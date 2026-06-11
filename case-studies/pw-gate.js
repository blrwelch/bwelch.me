(function () {
  var HASH = 'a2d00625edd4d720aa8f5000a64a7f4cb18033f77c28b84a79982645066292ce';
  var SESSION_KEY = 'bwelch-portfolio-access';

  // --- Password check ---
  async function sha256(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  window.checkPW = async function () {
    var input = document.getElementById('pw-input').value;
    var hash = await sha256(input);
    if (hash === HASH) {
      sessionStorage.setItem(SESSION_KEY, 'granted');
      unlock();
    } else {
      var err = document.getElementById('pw-error');
      err.style.opacity = '1';
      document.getElementById('pw-input').value = '';
      document.getElementById('pw-input').focus();
      setTimeout(function () { err.style.opacity = '0'; }, 2400);
    }
  };

  function unlock() {
    var gate = document.getElementById('pw-gate');
    gate.style.opacity = '0';
    gate.style.transition = 'opacity 0.4s ease';
    setTimeout(function () { gate.style.display = 'none'; }, 400);
    document.body.style.overflow = '';
  }

  // Allow Enter key to submit
  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('pw-input');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') window.checkPW();
      });
    }

    // Already authenticated this session?
    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
      var gate = document.getElementById('pw-gate');
      if (gate) gate.style.display = 'none';
      document.body.style.overflow = '';
      return;
    }

    // Lock scroll behind gate
    document.body.style.overflow = 'hidden';
  });

  // --- Screenshot deterrents ---
  // Block right-click
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  // Block drag-to-save on images
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  // Disable text + image selection
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  // Block common screenshot keyboard shortcuts (best-effort, OS-level still works)
  document.addEventListener('keydown', function (e) {
    if (
      (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
      e.key === 'PrintScreen'
    ) {
      e.preventDefault();
    }
  });
})();
