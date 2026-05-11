/**
 * gas-trial-history-additions.js
 *
 * Lets the demo's trial users (USERS_TRIAL sheet) read their own past
 * answers from the shared ANSWERS sheet — same flow as the main app,
 * just authenticating against the trial pool.
 *
 * Paste flow:
 *   1. Add the verifyAnyUser_ helper below to the bottom of the file.
 *   2. Inside handleGetMyAnswers_, REPLACE the line:
 *          var u = verifyUser_(e.parameter.id, e.parameter.pass);
 *      with:
 *          var u = verifyAnyUser_(e.parameter.id, e.parameter.pass);
 *   3. (Optional but recommended) Inside handleListMyRecordings_,
 *      do the same swap so trial users could later see recordings too:
 *          var u = verifyAnyUser_(e.parameter.id, e.parameter.pass);
 *   4. Save (Ctrl+S) → Deploy → Manage deployments → 鉛筆 → New version → Deploy.
 */

/* Verify against BOTH USERS and USERS_TRIAL. The two sheets share the
   same shape for cols A (id) and B (pass), so the check is identical
   and `userName` / `email` are read from cols C and D respectively.

   Use this only on endpoints that read the user's OWN data from the
   shared ANSWERS / RECORDINGS sheets. Don't use it on billing endpoints
   (those are paid-tier-only by definition). */
function verifyAnyUser_(id, pass) {
  // Try the main USERS sheet first (most common case).
  var u = verifyUser_(id, pass);
  if (u) return u;
  // Fall back to the trial pool.
  if (!id || !pass) return null;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS_TRIAL');
  if (!sh) return null;
  var d = sh.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    if (String(d[i][0]) === String(id) && String(d[i][1]) === String(pass)) {
      return {
        userId: String(d[i][0]),
        userName: String(d[i][2] || ''),
        email: String(d[i][3] || ''),
        isTrial: true
      };
    }
  }
  return null;
}
