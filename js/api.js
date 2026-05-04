/* ============================================================
   TOEFL Reps Demo — API client
   ============================================================
   Talks to the shared TOEFL Reps GAS backend, but only against the
   trial-tier endpoints (signupTrial / loginTrial / recoverTrialPass)
   which write/read the USERS_TRIAL sheet. The full app's endpoints
   are not used here so the demo cannot accidentally pollute paid-tier
   data.
   ============================================================ */

var API_URL = 'https://script.google.com/macros/s/AKfycbwjI8n86Cu1ar1IsPffyq9mboDrUNpG-SsVpFtURjP6AmCFHD3Zbw5_qcJJUksz_UDyyw/exec';

function _jsonpRequest(url) {
  return new Promise(function(resolve, reject) {
    var cb = '__tckCb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    var script = document.createElement('script');
    var done = false;
    var timeout = setTimeout(function() {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('timeout'));
    }, 30000);
    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      clearTimeout(timeout);
    }
    window[cb] = function(data) {
      if (done) return;
      done = true;
      cleanup();
      resolve(data);
    };
    script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + cb;
    script.onerror = function() {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('network'));
    };
    document.body.appendChild(script);
  });
}

var Api = {
  /* Demo signup — creates a row in the USERS_TRIAL sheet.
     Returns { success, userId, userName, email, error? }. */
  signup: function(id, pass, name, email) {
    return _jsonpRequest(API_URL + '?action=signupTrial'
      + '&id=' + encodeURIComponent(id)
      + '&pass=' + encodeURIComponent(pass)
      + '&name=' + encodeURIComponent(name)
      + '&email=' + encodeURIComponent(email));
  },

  /* Demo login — verifies against USERS_TRIAL.
     Returns { success, userId, userName, email, error? }. */
  login: function(id, pass) {
    return _jsonpRequest(API_URL + '?action=loginTrial'
      + '&id=' + encodeURIComponent(id)
      + '&pass=' + encodeURIComponent(pass));
  },

  /* Demo password recovery — generates a fresh temp password,
     stores it, and emails the user. They must change it on next
     login (server enforces TTL).
     Returns { success, error? }. */
  recover: function(email) {
    return _jsonpRequest(API_URL + '?action=recoverTrialPass'
      + '&email=' + encodeURIComponent(email));
  }
};
