/**
 * TCK Reps Demo — GAS additions
 *
 * Add these blocks to the existing TCK Reps backend GAS project.
 * They write/read against a NEW sheet called USERS_TRIAL (you've
 * already created the tab) and DON'T touch the paid-tier USERS sheet.
 *
 * Sheet layout (USERS_TRIAL — A:G):
 *   A: id              (auto: trial-{timestamp})
 *   B: pass            (plain — demo only)
 *   C: name
 *   D: email
 *   E: created_at
 *   F: last_login_at
 *   G: pass_temp_at    (timestamp when a recovery password was issued)
 *
 * No header row required, but it is recommended for readability.
 *
 * INSTALLATION
 * ============
 * 1. Open the existing TCK Reps GAS project.
 * 2. Add three new lines to the doGet() routing block:
 *      if (action === 'signupTrial')      return handleSignupTrial_(e, callback);
 *      if (action === 'loginTrial')       return handleLoginTrial_(e, callback);
 *      if (action === 'recoverTrialPass') return handleRecoverTrialPass_(e, callback);
 * 3. Paste the four functions below anywhere in the project.
 * 4. Save. Deploy → Manage deployments → Edit current → New version.
 *    The API URL stays the same; only the routing surface grows.
 *
 * EMAIL SENDER
 * ============
 * Default uses MailApp.sendEmail (sender = GAS owner). To upgrade to
 * a Gmail alias `noreply@tckworkshop.co.jp`, see the comment block
 * inside handleRecoverTrialPass_ for the GmailApp.sendEmail variant
 * and the one-time Workspace alias setup.
 */

var TRIAL_TEMP_PASS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function handleSignupTrial_(e, callback) {
  var pass  = e.parameter.pass  || '';
  var name  = e.parameter.name  || '';
  var email = (e.parameter.email || '').trim();

  if (!pass || !name || !email) {
    return jsonpResponse_(callback, { success: false, error: 'missing_params' });
  }
  if (String(pass).length < 4) {
    return jsonpResponse_(callback, { success: false, error: 'pass_too_short' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonpResponse_(callback, { success: false, error: 'invalid_email' });
  }

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS_TRIAL');
  if (!sh) {
    sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet('USERS_TRIAL');
    sh.appendRow(['id','pass','name','email','created_at','last_login_at','pass_temp_at']);
  }
  var d = sh.getDataRange().getValues();
  var emailNorm = email.toLowerCase();

  // Reject duplicate email so the recover flow has a single anchor.
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][3] || '').trim().toLowerCase() === emailNorm) {
      return jsonpResponse_(callback, { success: false, error: 'duplicate_email' });
    }
  }

  // Trial users get auto-generated IDs so they can't collide with the
  // paid-tier USERS sheet (which uses staff-assigned IDs).
  var newId = 'trial-' + (new Date().getTime()).toString(36);
  var now = new Date();
  sh.appendRow([newId, pass, name, email, now, now, '']);
  sh.getRange(sh.getLastRow(), 5, 1, 2).setNumberFormat(DATETIME_FMT);

  return jsonpResponse_(callback, {
    success: true,
    userId: newId,
    userName: name,
    email: email
  });
}

function handleLoginTrial_(e, callback) {
  var id   = e.parameter.id   || '';
  var pass = e.parameter.pass || '';
  if (!id || !pass) {
    return jsonpResponse_(callback, { success: false, error: 'missing_params' });
  }

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS_TRIAL');
  if (!sh) return jsonpResponse_(callback, { success: false, error: 'no_sheet' });
  var d = sh.getDataRange().getValues();

  for (var i = 1; i < d.length; i++) {
    // Match either by user-id (column A) or by email (column D), since
    // demo users will most often type the email they registered with.
    var rowId = String(d[i][0] || '');
    var rowEmail = String(d[i][3] || '').trim().toLowerCase();
    var matches = rowId === String(id) || rowEmail === String(id).trim().toLowerCase();
    if (!matches) continue;
    if (String(d[i][1]) !== String(pass)) {
      return jsonpResponse_(callback, { success: false, error: 'invalid_credentials' });
    }
    // Enforce 24h TTL on temporary recovery passwords.
    var tempAt = d[i][6];
    var mustChange = false;
    if (tempAt) {
      if (new Date().getTime() - new Date(tempAt).getTime() > TRIAL_TEMP_PASS_TTL_MS) {
        return jsonpResponse_(callback, { success: false, error: 'temp_password_expired' });
      }
      mustChange = true;
    }
    var now = new Date();
    sh.getRange(i + 1, 6).setValue(now).setNumberFormat(DATETIME_FMT);
    return jsonpResponse_(callback, {
      success: true,
      userId: rowId,
      userName: String(d[i][2] || ''),
      email: String(d[i][3] || ''),
      mustChangePassword: mustChange
    });
  }
  return jsonpResponse_(callback, { success: false, error: 'invalid_credentials' });
}

function handleRecoverTrialPass_(e, callback) {
  var email = (e.parameter.email || '').trim();
  if (!email) return jsonpResponse_(callback, { success: false, error: 'no_email' });

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS_TRIAL');
  if (!sh) return jsonpResponse_(callback, { success: false, error: 'no_sheet' });
  var d = sh.getDataRange().getValues();
  var emailNorm = email.toLowerCase();

  for (var i = 1; i < d.length; i++) {
    if (String(d[i][3] || '').trim().toLowerCase() !== emailNorm) continue;
    var userId = String(d[i][0]);
    var userName = String(d[i][2] || '');
    var tempPass = generateTempPassword_();
    var now = new Date();

    sh.getRange(i + 1, 2).setValue(tempPass);            // overwrite pass
    sh.getRange(i + 1, 7).setValue(now).setNumberFormat(DATETIME_FMT); // pass_temp_at

    var subject = 'TCK Reps Demo — 仮パスワードのお知らせ';
    var html =
      '<p>' + escapeHtml_(userName) + ' 様</p>' +
      '<p>TCK Reps Demo の仮パスワードを発行しました。</p>' +
      '<table style="border-collapse:collapse;margin:12px 0">' +
        '<tr><td style="padding:4px 12px 4px 0;color:#5A6861">User ID</td>' +
            '<td style="padding:4px 0;font-weight:700">' + escapeHtml_(userId) + '</td></tr>' +
        '<tr><td style="padding:4px 12px 4px 0;color:#5A6861">仮パスワード</td>' +
            '<td style="padding:4px 0;font-weight:700;font-family:monospace">' + tempPass + '</td></tr>' +
      '</table>' +
      '<p style="color:#8A6D2A">※ 24時間以内にログイン後、パスワードを変更してください。期限を過ぎると無効になります。</p>' +
      '<p style="margin-top:24px">— TCK Workshop · TCK Reps Demo</p>';

    try {
      // === Default: MailApp.sendEmail ===
      // Sender = GAS owner. Works with no extra setup.
      MailApp.sendEmail({ to: email, subject: subject, htmlBody: html });

      // === Optional upgrade: GmailApp + alias ===
      // 1. Add `noreply@tckworkshop.co.jp` as an alias on the GAS-owner
      //    account in Google Workspace > Users > [owner] > Email aliases.
      // 2. Replace the MailApp call above with:
      //    GmailApp.sendEmail(email, subject, '', {
      //      htmlBody: html,
      //      from: 'noreply@tckworkshop.co.jp',
      //      name: 'TCK Workshop · TCK Reps Demo'
      //    });
    } catch (mailErr) {
      return jsonpResponse_(callback, { success: false, error: 'mail_failed', detail: String(mailErr) });
    }
    return jsonpResponse_(callback, { success: true });
  }
  return jsonpResponse_(callback, { success: false, error: 'not_found' });
}
