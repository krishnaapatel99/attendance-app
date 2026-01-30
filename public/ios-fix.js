// iOS Safari compatibility fixes
(function() {
  // Fix for iOS Safari viewport issues
  function fixViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
  }

  // Fix for iOS Safari scrolling issues
  function fixScrolling() {
    document.body.addEventListener('touchmove', function(e) {
      if (e.target.closest('.overflow-x-auto')) {
        return; // Allow horizontal scrolling
      }
      e.preventDefault();
    }, { passive: false });
  }

  // Fix for iOS Safari console errors in production
  function fixConsole() {
    if (!window.console) {
      window.console = {};
    }
    const methods = ['log', 'error', 'warn', 'info', 'debug'];
    methods.forEach(method => {
      if (!window.console[method]) {
        window.console[method] = function() {};
      }
    });
  }

  // Apply fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fixViewport();
      fixScrolling();
      fixConsole();
    });
  } else {
    fixViewport();
    fixScrolling();
    fixConsole();
  }
})();
