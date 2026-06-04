/**
 * Code.gs  -  EHESP enrolment backend (Google Apps Script web app).
 *
 * What it does on each submission:
 *   1. re-runs the SAME validation as the browser (defence against tampering)
 *   2. handles duplicates per CONFIG.dedupMode (overwrite / lock / deadline)
 *   3. writes / updates one row per student, keyed on lower-cased email
 *   4. emails the student a confirmation
 *   5. replies to the page with { ok, message } so it can show success / rejection
 *
 * SETUP: see ../docs/SETUP.md. You must (a) add validation.gs (a copy of
 * web/validation.js) and spec.gs (the SPEC object) to THIS Apps Script project,
 * (b) set CONFIG below, (c) Deploy > New deployment > Web app > Execute as: Me,
 * Who has access: Anyone, then paste the URL into web/index.html APP_CONFIG.endpoint.
 */

var CONFIG = {
  sheetId:    '1HyAZWH7bjdfXEUmi8v3LZ79aXu07fwUzpC2_eLWqByU',   // the Sheet that stores responses
  sheetName:  'Responses',
  dedupMode:  'overwrite',     // 'overwrite' = latest wins | 'lock' = first is final | 'deadline'
  deadline:   '2026-07-31T23:59:59Z', // used only when dedupMode === 'deadline'
  ectsCeiling: null,           // mirror of web APP_CONFIG.ectsCeiling
  fromName:   'EHESP Master Enrolment',
  ccProgramme: ''              // optional: also copy a programme inbox on each confirmation
};

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var email = String(payload.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return _json({ ok: false, message: 'A valid email is required.' });
    }

    // (1) server-side re-validation using the shared engine (validation.gs + spec.gs)
    var res = validateSelection(SPEC, payload.track, payload.picks, { ectsCeiling: CONFIG.ectsCeiling });
    if (!res.ok) {
      return _json({ ok: false, message: 'Selection failed validation: ' + res.violations.join('; ') });
    }

    var sheet = _sheet();
    var existingRow = _findRowByEmail(sheet, email);

    // (2) duplicate handling
    if (existingRow > 0) {
      if (CONFIG.dedupMode === 'lock') {
        return _json({ ok: false, message: 'You have already enrolled. Contact the programme office to make changes.' });
      }
      if (CONFIG.dedupMode === 'deadline' && new Date() > new Date(CONFIG.deadline)) {
        return _json({ ok: false, message: 'The deadline has passed; your earlier submission stands.' });
      }
    }

    var codes = payload.picks.map(function (p) { return p.code; }).sort();
    var detail = JSON.stringify(payload.picks);
    var now = new Date();
    var status = existingRow > 0 ? 'Updated' : 'Submitted';
    var row = [email, payload.firstName || '', payload.lastName || '', payload.track,
               codes.join(', '), detail, res.totalEcts, status, now.toISOString(), Session.getActiveUser().getEmail() || ''];

    // (3) upsert
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    // (4) confirmation email
    _sendConfirmation(email, payload, res.totalEcts);

    // (5) reply
    return _json({ ok: true, message: 'Your selection has been registered and a confirmation email sent to ' + email + '.' });
  } catch (err) {
    return _json({ ok: false, message: 'Server error: ' + err });
  }
}

function _sheet() {
  var ss = SpreadsheetApp.openById(CONFIG.sheetId);
  var sh = ss.getSheetByName(CONFIG.sheetName);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.sheetName);
    sh.appendRow(['StudentEmail', 'FirstName', 'LastName', 'Track', 'SelectedModules',
                  'SelectedModulesDetail', 'TotalECTS', 'Status', 'SubmittedAtUtc', 'SubmittedBy']);
  }
  return sh;
}

function _findRowByEmail(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var vals = sheet.getRange(2, 1, last - 1, 1).getValues(); // column A = email
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return -1;
}

function _sendConfirmation(email, payload, totalEcts) {
  var lines = payload.picks.map(function (p) {
    var m = _moduleName(p.code);
    return '  - ' + p.code + '  ' + m.name + '  (' + m.ects + ' ECTS, ' + p.role + ')';
  }).join('\n');
  var body =
    'Dear ' + (payload.firstName || 'student') + ',\n\n' +
    'Your module selection for track ' + payload.track + ' has been registered.\n\n' +
    'Modules (' + totalEcts + ' ECTS total):\n' + lines + '\n\n' +
    'If you resubmit the form, this selection will be ' +
      (CONFIG.dedupMode === 'lock' ? 'kept as final unless the office changes it' : 'overwritten by your new choice') + '.\n\n' +
    'Regards,\n' + CONFIG.fromName;
  var opts = { name: CONFIG.fromName };
  if (CONFIG.ccProgramme) opts.cc = CONFIG.ccProgramme;
  MailApp.sendEmail(email, 'EHESP module selection confirmation - ' + payload.track, body, opts);
}

function _moduleName(code) {
  for (var i = 0; i < SPEC.modules.length; i++) { if (SPEC.modules[i].code === code) return SPEC.modules[i]; }
  return { name: '(unknown)', ects: 0 };
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
