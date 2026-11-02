// Contact helpers. On a computer every email link opens Gmail's compose window in a new tab,
// because most people have no desktop mail app set up; on a phone the mailto: link opens the mail
// app as usual. Email links also copy the address and show a short toast, as a fallback.
// Elements: [data-copy-email] (copy + toast, link still opens), [data-copy-only] (copy + toast),
// [data-share] (the device's share sheet, shown only where the browser has one).
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

  var GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + EMAIL + '&su=' + encodeURIComponent('Hello from your portfolio');
  var computer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!computer || e.metaKey || e.ctrlKey || e.shiftKey) return;   // phones and modified clicks keep mailto:
      e.preventDefault();
      window.open(GMAIL, '_blank', 'noopener');
    });
  });

  document.querySelectorAll('[data-share]').forEach(function (el) {
    if (!navigator.share) return;
    var item = el.closest('[hidden]');
    if (item) item.hidden = false;
    el.addEventListener('click', function () {
      navigator.share({
        title: 'Chandana Vishnu Jayanth',
        text: 'Backend systems, data pipelines and applied ML',
        url: 'https://vishnuatgit.github.io/',
      }).catch(function () {});   // closing the share sheet is not an error
    });
  });
})();
