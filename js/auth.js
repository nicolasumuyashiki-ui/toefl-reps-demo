/* ============================================================
   TOEFL Reps Demo — Trial Auth
   ============================================================
   Demo-tier auth: signupTrial / loginTrial / recoverTrialPass
   endpoints write/read against the USERS_TRIAL sheet on the
   shared TOEFL Reps GAS backend. Sessions are stored in
   sessionStorage under tck_demo_user, separate from the
   production-tier kickstart_user key so that running both apps
   in the same browser doesn't cross-contaminate.
   ============================================================ */

function tckRootPrefix() {
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || '';
    var m = src.match(/^(.*\/)js\/auth\.js(?:\?.*)?$/);
    if (m) return m[1];
  }
  return '';
}

var Auth = {
  SESSION_KEY: 'tck_demo_user',

  require: function() {
    if (!this.getUser()) {
      var ret = encodeURIComponent(location.pathname + location.search);
      location.replace(tckRootPrefix() + 'login.html?return=' + ret);
      return false;
    }
    return true;
  },

  getUser: function() {
    try {
      var u = JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
      return u && u.userId ? u : null;
    } catch (e) {
      return null;
    }
  },

  setUser: function(u) {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(u));
  },

  logout: function() {
    sessionStorage.removeItem(this.SESSION_KEY);
    location.href = tckRootPrefix() + 'index.html';
  },

  showBadge: function(elId) {
    var u = this.getUser();
    if (!u) return;
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML =
      '<span class="avatar">' + (u.userName || '?').charAt(0).toUpperCase() + '</span>' +
      '<span>' + (u.userName || u.userId) + '</span>';
  }
};
