// Triggers laptop lid-open + iPad float animations when device showcase enters viewport.
// Add <script src="device-animate.js"></script> before </body> in each case study.
(function () {
  var showcases = document.querySelectorAll('.device-showcase');
  if (!showcases.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  showcases.forEach(function (el) { observer.observe(el); });
})();
