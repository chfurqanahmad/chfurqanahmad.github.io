/* Website enquiries: append-only public endpoint. No email is sent by this version. */
const HEADERS = ['Received at (Chicago)', 'Name', 'Company', 'Email', 'Subject', 'Goal', 'Submission ID'];

function doGet() {
  return json_({ok: true, service: 'website-enquiries'});
}

function doPost(e) {
  let lock;
  try {
    const input = validate_(e);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ok: false, error: 'busy'});
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Not configured');
    const sheet = SpreadsheetApp.openById(id).getSheetByName('Enquiries');
    if (!sheet || sheet.getRange(1, 1, 1, 7).getDisplayValues()[0].join('|') !== HEADERS.join('|')) {
      throw new Error('Unexpected sheet layout');
    }
    const last = sheet.getLastRow();
    if (last > 1) {
      const prior = sheet.getRange(2, 7, last - 1, 1).createTextFinder(input.submissionId).matchEntireCell(true).findNext();
      if (prior) {
        const saved = sheet.getRange(prior.getRow(), 2, 1, 5).getDisplayValues()[0];
        if (saved.some((value, i) => value !== input.values[i])) return json_({ok: false, error: 'conflicting_request'});
        return json_({ok: true, submissionId: input.submissionId});
      }
    }
    // Simple quota protection; not a substitute for CAPTCHA under sustained abuse.
    const cache = CacheService.getScriptCache();
    const minute = Math.floor(Date.now() / 60000);
    const hour = Math.floor(Date.now() / 3600000);
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input.values[2].toLowerCase()).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
    const globalKey = 'minute:' + minute;
    const emailKey = 'email:' + hour + ':' + hash;
    const globalCount = Number(cache.get(globalKey) || 0);
    const emailCount = Number(cache.get(emailKey) || 0);
    if (globalCount >= 30 || emailCount >= 5) return json_({ok: false, error: 'rate_limited'});
    const row = last + 1;
    if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
    // Leading apostrophes force literal text in Sheets and are not displayed.
    const textValues = input.values.concat(input.submissionId).map(value => "'" + value);
    sheet.getRange(row, 1).setValue(new Date()).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(row, 2, 1, 6).setValues([textValues]);
    sheet.getRange(row, 1, 1, 7).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('top');
    sheet.getRange(row, 6).setWrap(true);
    SpreadsheetApp.flush();
    cache.put(globalKey, String(globalCount + 1), 120);
    cache.put(emailKey, String(emailCount + 1), 3600);
    return json_({ok: true, submissionId: input.submissionId});
  } catch (_) {
    return json_({ok: false, error: 'unable_to_save'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validate_(e) {
  if (!e || !e.postData || e.postData.length > 24000) throw new Error('Invalid request');
  const p = e.parameter || {};
  const limits = {name: 100, company: 150, email: 254, subject: 160, goal: 3000};
  if (String(p.website || '').trim()) throw new Error('Invalid request');
  const values = Object.keys(limits).map(key => {
    if (e.parameters && e.parameters[key] && e.parameters[key].length !== 1) throw new Error('Duplicate field');
    const value = String(p[key] || '').trim();
    if (!value || value.length > limits[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error('Invalid field');
    if (key !== 'goal' && /[\r\n]/.test(value)) throw new Error('Invalid field');
    return value;
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[2])) throw new Error('Invalid email');
  const submissionId = String(p.submissionId || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) throw new Error('Invalid reference');
  return {values, submissionId};
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
