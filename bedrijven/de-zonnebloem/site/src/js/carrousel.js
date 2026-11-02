// Fotocarrousel "De Zonnebloem in beeld": bladeren met knoppen of vegen, loopt vanzelf
// (niet bij "minder beweging"), pauzeert bij muis, focus of als hij niet in beeld is.
(function () {
  "use strict";
  var c = document.querySelector("[data-carrousel]");
  if (!c) return;
  var spoor = c.querySelector(".carrousel__spoor");
  var dias = [].slice.call(c.querySelectorAll(".carrousel__dia"));
  var rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (dias.length < 2) { c.classList.add("carrousel--enkel"); return; }

  function rand() { return parseFloat(getComputedStyle(spoor).paddingLeft) || 0; }
  function huidige() {
    var links = spoor.scrollLeft + rand(), beste = 0, afstand = Infinity;
    dias.forEach(function (d, i) {
      var a = Math.abs(d.offsetLeft - links);
      if (a < afstand) { afstand = a; beste = i; }
    });
    // helemaal rechts: de laatste telt als huidige, zodat "volgende" terug naar het begin gaat
    if (spoor.scrollLeft + spoor.clientWidth >= spoor.scrollWidth - 4) beste = dias.length - 1;
    return beste;
  }
  function naar(i) {
    var d = dias[(i + dias.length) % dias.length];
    spoor.scrollTo({ left: d.offsetLeft - rand(), behavior: rustig ? "auto" : "smooth" });
  }
  c.querySelector("[data-vorige]").addEventListener("click", function () { naar(huidige() - 1); });
  c.querySelector("[data-volgende]").addEventListener("click", function () { naar(huidige() + 1); });
  spoor.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); naar(huidige() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); naar(huidige() - 1); }
  });

  if (rustig) return;
  var timer = null, zichtbaar = false, bezig = false;
  function start() { stop(); if (zichtbaar && !bezig && !document.hidden) timer = setInterval(function () { naar(huidige() + 1); }, 5000); }
  function stop() { clearInterval(timer); timer = null; }
  ["mouseenter", "focusin", "touchstart"].forEach(function (t) { c.addEventListener(t, function () { bezig = true; stop(); }, { passive: true }); });
  ["mouseleave", "focusout"].forEach(function (t) { c.addEventListener(t, function () { bezig = false; start(); }); });
  document.addEventListener("visibilitychange", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { zichtbaar = e[0].isIntersecting; start(); }, { threshold: 0.4 }).observe(c);
  }
})();
