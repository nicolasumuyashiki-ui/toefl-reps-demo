/* Shared "Back to menu" control for task pages.
 *
 * Usage: include this script on a task page.
 *   <script src="../../js/back-button.js"></script>
 * By default it asks for confirmation before leaving (real TOEFL tasks cannot
 * be paused). Reading pages, where stopping is harmless, opt out of the prompt:
 *   <script>window.BACK_CONFIRM = false;</script>
 *   <script src="../../js/back-button.js"></script>
 * Optional override of the destination: window.BACK_URL (default ../../menu.html).
 */
(function () {
  var CONFIRM = (typeof window.BACK_CONFIRM === 'undefined') ? true : !!window.BACK_CONFIRM;
  var DEST = window.BACK_URL || '../../menu.html';
  var overlay = null;

  function leave() { window.location.href = DEST; }

  function showModal() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.setAttribute('data-tck-back-modal', '');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100000;padding:20px;';
      var card = document.createElement('div');
      card.style.cssText = 'background:#fff;border-radius:12px;max-width:430px;width:100%;padding:28px 26px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:inherit;';
      card.innerHTML =
        '<div style="font-size:34px;line-height:1;margin-bottom:8px">⚠️</div>' +
        '<h3 style="margin:0 0 10px;font-size:17px;color:#0F1511">' +
          '<span class="jp">問題の途中です</span>' +
          '<span class="en">You’re in the middle of the task</span></h3>' +
        '<p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#4a5568">' +
          '<span class="jp">本番のテストでは途中で中断できません。メニューに戻ると、この回の解答は保存されません。戻りますか？</span>' +
          '<span class="en">The real test cannot be paused. If you return to the menu, your answers for this attempt will not be saved. Go back?</span></p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<button type="button" data-act="cancel" style="padding:10px 22px;border-radius:8px;border:1px solid #cbd5e0;background:#edf2f7;color:#4a5568;font:inherit;font-weight:600;font-size:14px;cursor:pointer">' +
            '<span class="jp">続ける</span><span class="en">Keep going</span></button>' +
          '<button type="button" data-act="leave" style="padding:10px 22px;border-radius:8px;border:none;background:#e53e3e;color:#fff;font:inherit;font-weight:600;font-size:14px;cursor:pointer">' +
            '<span class="jp">メニューに戻る</span><span class="en">Back to menu</span></button>' +
        '</div>';
      overlay.appendChild(card);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) { hideModal(); return; }
        var act = e.target.closest ? e.target.closest('[data-act]') : null;
        if (!act) return;
        if (act.getAttribute('data-act') === 'leave') leave();
        else hideModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') hideModal();
      });
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  }

  function hideModal() { if (overlay) overlay.style.display = 'none'; }

  function onClick() { if (CONFIRM) showModal(); else leave(); }

  function init() {
    if (document.querySelector('.tck-back-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tck-back-btn';
    btn.setAttribute('aria-label', 'Back to menu');
    btn.innerHTML = '← <span class="jp">メニュー</span><span class="en">Menu</span>';
    btn.style.cssText = 'display:inline-flex;align-items:center;margin-right:14px;padding:5px 12px;border:1px solid rgba(128,128,128,.4);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;white-space:nowrap;';
    btn.onclick = onClick;
    var host = document.querySelector('.top-nav-left, .nav-left');
    if (host) {
      host.insertBefore(btn, host.firstChild);
    } else {
      btn.style.position = 'fixed';
      btn.style.top = '56px';
      btn.style.left = '12px';
      btn.style.zIndex = '9998';
      btn.style.background = '#fff';
      btn.style.boxShadow = '0 2px 6px rgba(0,0,0,.12)';
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
