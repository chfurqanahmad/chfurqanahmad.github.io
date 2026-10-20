/* Add as a NEW script file in the existing Website Enquiries project.
 * Run setupEnquiryNotifications once. Existing deployed Code.gs stays unchanged.
 */
const ENQUIRY_OWNER_EMAIL = 'thisisfurqanahmad@gmail.com';
const NOTICE_HEADERS = ['Submission ID', 'Status', 'Updated at', 'Note'];

function setupEnquiryNotifications() {
  const book = notificationBook_();
  notificationLog_(book);
  const existing = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sendEnquiryNotifications');
  if (!existing.length) ScriptApp.newTrigger('sendEnquiryNotifications').timeBased().everyMinutes(5).create();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('OWNER_NOTICE_SETUP_SENT') !== 'yes') {
    MailApp.sendEmail({to: ENQUIRY_OWNER_EMAIL, subject: 'Website enquiry notifications enabled',
      body: 'New website enquiries will be checked every five minutes. Each notification includes the enquiry details and a link to your sheet.\n\n' + book.getUrl(), name: 'Furqan Ahmad Website'});
    props.setProperty('OWNER_NOTICE_SETUP_SENT', 'yes');
  }
  sendEnquiryNotifications();
}

function sendEnquiryNotifications() {
  // User lock serializes notification runs without blocking the public form's script lock.
  const lock = LockService.getUserLock();
  if (!lock.tryLock(1000)) return;
  try {
    const book = notificationBook_();
    const sheet = book.getSheetByName('Enquiries');
    const log = notificationLog_(book);
    const last = sheet.getLastRow();
    if (last < 2) return;
    const notices = new Map();
    if (log.getLastRow() > 1) log.getRange(2, 1, log.getLastRow() - 1, 4).getDisplayValues().forEach((r, i) => notices.set(r[0], {row: i + 2, status: r[1]}));
    let remaining = Math.min(20, MailApp.getRemainingDailyQuota());
    const rows = sheet.getRange(2, 1, last - 1, 7).getDisplayValues();
    for (let i = 0; i < rows.length && remaining > 0; i++) {
      const [received, name, company, email, subject, goal, id] = rows[i];
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !name || !email || !goal) continue;
      const prior = notices.get(id);
      if (prior && prior.status !== 'Retry') continue;
      const logRow = prior ? prior.row : log.getLastRow() + 1;
      const rowUrl = book.getUrl() + '#gid=' + sheet.getSheetId() + '&range=A' + (i + 2) + ':G' + (i + 2);
      log.getRange(logRow, 1, 1, 4).setValues([[id, 'Sending', new Date(), 'If this remains Sending, check delivery before retrying.']]);
      SpreadsheetApp.flush();
      let sent = false;
      try {
        MailApp.sendEmail({to: ENQUIRY_OWNER_EMAIL,
          subject: 'New website enquiry: ' + String(subject).replace(/[\r\n]/g, ' ').slice(0, 160),
          body: ['A new enquiry was saved from furqanahmad.com.', '', 'Received (Chicago): ' + received,
            'Name: ' + name, 'Company: ' + company, 'Email: ' + email, 'Subject: ' + subject,
            '', 'Goal:', goal, '', 'View enquiry: ' + rowUrl, '', 'Reference: ' + id].join('\n'),
          name: 'Furqan Ahmad Website'});
        sent = true;
        remaining--;
        log.getRange(logRow, 2, 1, 3).setValues([['Sent', new Date(), '']]);
        SpreadsheetApp.flush();
        notices.set(id, {row: logRow, status: 'Sent'});
      } catch (error) {
        if (sent) throw error; // Preserve Sending: delivery may have succeeded; do not resend automatically.
        log.getRange(logRow, 2, 1, 3).setValues([['Retry', new Date(), 'Mail service failed; will retry on next run.']]);
        notices.set(id, {row: logRow, status: 'Retry'});
        break;
      }
    }
  } finally { lock.releaseLock(); }
}

function notificationBook_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID script property.');
  const book = SpreadsheetApp.openById(id);
  const sheet = book.getSheetByName('Enquiries');
  if (!sheet || sheet.getRange(1, 1, 1, 7).getDisplayValues()[0].join('|') !== 'Received at (Chicago)|Name|Company|Email|Subject|Goal|Submission ID') throw new Error('Unexpected enquiry sheet layout.');
  return book;
}

function notificationLog_(book) {
  let log = book.getSheetByName('Notification Log');
  if (!log) {
    log = book.insertSheet('Notification Log');
    log.getRange(1, 1, 1, 4).setValues([NOTICE_HEADERS]).setFontWeight('bold');
    log.setFrozenRows(1);
    log.setColumnWidth(1, 290); log.setColumnWidth(2, 100); log.setColumnWidth(3, 170); log.setColumnWidth(4, 380);
  }
  if (log.getRange(1, 1, 1, 4).getDisplayValues()[0].join('|') !== NOTICE_HEADERS.join('|')) throw new Error('Unexpected notification log layout.');
  return log;
}
