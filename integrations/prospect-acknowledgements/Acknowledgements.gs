/* Add this new file alongside the existing Code.gs and Notifications.gs.
 * Run setupEnquiryAcknowledgements once. Uses existing authorized scopes.
 */
const ACK_HEADERS = ['Submission ID', 'Recipient', 'Status', 'Updated at', 'Note'];
const ACK_REPLY_TO = 'thisisfurqanahmad@gmail.com';
const ACK_SUBJECT = 'Thanks for getting in touch | Furqan Ahmad';
const ACK_BODY = "Hi there,\n\nThanks for getting in touch and sharing your project. Your enquiry has reached me, and I’ll review the details before getting back to you about the next steps.\n\nIf there’s anything you’d like to add, simply reply to this email.\n\nBest,\nFurqan Ahmad\nhttps://furqanahmad.com\n\nThis is an automatic acknowledgement of a website enquiry. If you didn’t submit one, you can ignore this email.";

function setupEnquiryAcknowledgements() {
  const book = notificationBook_();
  acknowledgementLog_(book);
  const props = PropertiesService.getScriptProperties();
  // Do not contact old enquiries when this feature is first installed.
  if (!props.getProperty('ACK_ENABLED_AT')) props.setProperty('ACK_ENABLED_AT', new Date().toISOString());
  const exists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sendEnquiryAcknowledgements');
  if (!exists) ScriptApp.newTrigger('sendEnquiryAcknowledgements').timeBased().everyMinutes(5).create();
  if (props.getProperty('ACK_SETUP_SENT') !== 'yes') {
    MailApp.sendEmail({to: ACK_REPLY_TO, subject: 'Website acknowledgements enabled',
      body: 'New website enquiries will receive the following acknowledgement, normally within five minutes. Repeat addresses are limited to one acknowledgement per 24 hours.\n\nSubject: ' + ACK_SUBJECT + '\n\n' + ACK_BODY,
      name: 'Furqan Ahmad Website'});
    props.setProperty('ACK_SETUP_SENT', 'yes');
  }
}

function sendEnquiryAcknowledgements(submissionId) {
  const targetId = typeof submissionId === 'string' ? submissionId : null;
  const enabled = Date.parse(PropertiesService.getScriptProperties().getProperty('ACK_ENABLED_AT') || '');
  if (!Number.isFinite(enabled)) return;
  const lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) return;
  try {
    const book = notificationBook_(), sheet = book.getSheetByName('Enquiries'), log = acknowledgementLog_(book);
    if (sheet.getLastRow() < 2) return;
    const ownerLog = book.getSheetByName('Notification Log');
    if (!ownerLog || ownerLog.getLastRow() < 2) return;
    const ownerSent = new Set(ownerLog.getRange(2, 1, ownerLog.getLastRow() - 1, 2).getDisplayValues().filter(r => r[1] === 'Sent').map(r => r[0]));
    const now = Date.now(), recentCutoff = now - 24 * 60 * 60 * 1000;
    const records = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, 5).getValues() : [];
    const byId = new Map(), recentRecipients = new Set();
    let recentCount = 0;
    records.forEach((r, i) => {
      byId.set(String(r[0]), {row: i + 2, status: String(r[2])});
      if ((r[2] === 'Sent' || r[2] === 'Sending') && new Date(r[3]).getTime() > recentCutoff) {
        recentRecipients.add(String(r[1]).toLowerCase()); recentCount++;
      }
    });
    // Reserve capacity for owner alerts; acknowledgements have a separate rolling daily cap.
    let remaining = Math.max(0, Math.min(20, 50 - recentCount, MailApp.getRemainingDailyQuota() - 20));
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
    for (const r of rows) {
      if (remaining <= 0) break;
      const received = r[0] instanceof Date ? r[0].getTime() : NaN;
      const email = String(r[3] || '').trim(), id = String(r[6] || '');
      if (!Number.isFinite(received) || received < enabled || received > now || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) continue;
      // Never acknowledge before this enquiry's owner alert has been accepted and logged.
      if ((targetId && id !== targetId) || !ownerSent.has(id)) continue;
      const prior = byId.get(id);
      if (prior && prior.status !== 'Retry') continue;
      const logRow = prior ? prior.row : log.getLastRow() + 1;
      if (logRow > log.getMaxRows()) log.insertRowsAfter(log.getMaxRows(), 100);
      if (!validAcknowledgementEmail_(email)) {
        acknowledgementRecord_(log, logRow, id, email, 'Skipped', 'Invalid or reserved recipient address.');
        byId.set(id, {row: logRow, status: 'Skipped'}); continue;
      }
      if (recentRecipients.has(email.toLowerCase())) {
        acknowledgementRecord_(log, logRow, id, email, 'Skipped', 'An acknowledgement was already sent to this address within 24 hours.');
        byId.set(id, {row: logRow, status: 'Skipped'}); continue;
      }
      acknowledgementRecord_(log, logRow, id, email, 'Sending', 'If this remains Sending, check delivery before retrying.');
      SpreadsheetApp.flush();
      let sent = false;
      try {
        // Fixed copy: never echo untrusted enquiry content into an automatic email.
        MailApp.sendEmail({to: email, subject: ACK_SUBJECT, body: ACK_BODY, name: 'Furqan Ahmad', replyTo: ACK_REPLY_TO});
        sent = true; remaining--;
        acknowledgementRecord_(log, logRow, id, email, 'Sent', '');
        SpreadsheetApp.flush();
        byId.set(id, {row: logRow, status: 'Sent'}); recentRecipients.add(email.toLowerCase());
      } catch (error) {
        if (sent) throw error;
        acknowledgementRecord_(log, logRow, id, email, 'Retry', 'Mail service failed; will retry on next run.');
        break;
      }
    }
  } finally { lock.releaseLock(); }
}

function validAcknowledgementEmail_(email) {
  if (email.length > 254 || !/^[^\s@,;<>:"\\]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) return false;
  const domain = email.split('@')[1].toLowerCase();
  return !/(^|\.)(example\.(com|net|org)|example|invalid|test|localhost)$/.test(domain);
}
function acknowledgementRecord_(log, row, id, email, status, note) {
  log.getRange(row, 1, 1, 5).setValues([[id, "'" + email, status, new Date(), note]]);
  log.getRange(row, 4).setNumberFormat('yyyy-mm-dd hh:mm:ss');
}
function acknowledgementLog_(book) {
  let log = book.getSheetByName('Acknowledgement Log');
  if (!log) {
    log = book.insertSheet('Acknowledgement Log');
    log.getRange(1, 1, 1, 5).setValues([ACK_HEADERS]).setFontWeight('bold');
    log.setFrozenRows(1);
    log.setColumnWidth(1, 290); log.setColumnWidth(2, 240); log.setColumnWidth(3, 100); log.setColumnWidth(4, 170); log.setColumnWidth(5, 380);
  }
  if (log.getRange(1, 1, 1, 5).getDisplayValues()[0].join('|') !== ACK_HEADERS.join('|')) throw new Error('Unexpected acknowledgement log layout.');
  return log;
}
