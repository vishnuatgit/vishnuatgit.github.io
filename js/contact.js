// Contact helpers: email links also copy the address and show a short toast, because a
// mailto: link does nothing for people without a mail app. The mailto still opens.
// Elements: [data-copy-email] (copy + toast, link still opens), [data-copy-only] (copy + toast).
(function () {
  var EMAIL = 'jayanthvishnu9@gmail.com';

  // One polite live region for the whole page, created up front so screen readers announce it.
  var toast = document.createElement('div');
  toast.className = 'cm-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var hideTimer = 0;

  function showToast(text) {
    clearTimeout(hideTimer);
    toast.textContent = '';
    // A fresh text node each time, so repeated clicks are announced again.
    setTimeout(function () {
      toast.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M6 10.4l2.6 2.5L14 7.6" fill="none" stroke="#111110" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var span = document.createElement('span');
      span.textContent = text;
      toast.appendChild(span);
      toast.classList.add('show');
      hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 3000);
    }, 30);
  }

  function fallbackCopy() {
    var area = document.createElement('textarea');
    area.value = EMAIL;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    area.remove();
    return ok;
  }

  function copyEmail() {
    var done = function (ok) { showToast(ok ? 'Email copied: ' + EMAIL : 'Email: ' + EMAIL); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(fallbackCopy()); });
    } else {
      done(fallbackCopy());
    }
  }

  document.querySelectorAll('[data-copy-email]').forEach(function (el) {
    el.addEventListener('click', copyEmail);   // the mailto: link still opens as normal
  });
  document.querySelectorAll('[data-copy-only]').forEach(function (el) {
    var item = el.closest('[hidden]');
    if (item) item.hidden = false;   // without JavaScript this button could not copy, so it stays hidden
    el.addEventListener('click', copyEmail);
  });
})();
