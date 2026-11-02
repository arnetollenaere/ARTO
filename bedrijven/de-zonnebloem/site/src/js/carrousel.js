// Fotocarrousel "De Zonnebloem in beeld": één foto in het midden, buren half zichtbaar.
// Bladeren met pijlen, puntjes, vegen of pijltjestoetsen; na de laatste terug naar de eerste.
// Loopt vanzelf (niet bij "minder beweging"), pauzeert bij muis erover, bij aanraken en buiten beeld.
(function () {
  "use strict";
  var c = document.querySelector("[data-carrousel]");
  if (!c) return;
  var spoor = c.querySelector(".carrousel__spoor");
  var dias = [].slice.call(c.querySelectorAll(".carrousel__dia"));
  var puntenVak = c.querySelector("[data-punten]");
  var rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var n = dias.length, nu = 0, zelf = false;   // zelf: het script schuift zelf, niet de bezoeker

  var punten = dias.map(function (d, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "carrousel__punt";
    b.setAttribute("aria-label", "Foto " + (i + 1) + " van " + n);
    b.addEventListener("click", function () { naar(i); herstart(); });
    puntenVak.appendChild(b);
    return b;
  });

  function midden(d) { return d.offsetLeft + d.offsetWidth / 2 - spoor.clientWidth / 2; }
  function naar(i) {
    nu = (i + n) % n; zelf = true;
    spoor.scrollTo({ left: midden(dias[nu]), behavior: rustig ? "auto" : "smooth" });
    toon();
  }
  function toon() {
    punten.forEach(function (p, i) { p.setAttribute("aria-current", i === nu ? "true" : "false"); });
    dias.forEach(function (d, i) { d.classList.toggle("is-actief", i === nu); });
  }
  // Na vegen of scrollen: de foto die het dichtst bij het midden staat, is de huidige.
  var wacht = null;
  spoor.addEventListener("scroll", function () {
    clearTimeout(wacht);
    wacht = setTimeout(function () {
      if (zelf) { zelf = false; return; }
      var m = spoor.scrollLeft, beste = 0, afstand = Infinity;
      dias.forEach(function (d, i) { var a = Math.abs(midden(d) - m); if (a < afstand) { afstand = a; beste = i; } });
      if (beste !== nu) { nu = beste; toon(); }
    }, 150);
  }, { passive: true });

  c.querySelector("[data-vorige]").addEventListener("click", function () { naar(nu - 1); herstart(); });
  c.querySelector("[data-volgende]").addEventListener("click", function () { naar(nu + 1); herstart(); });
  spoor.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); naar(nu + 1); herstart(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); naar(nu - 1); herstart(); }
  });
  addEventListener("resize", function () { spoor.scrollTo({ left: midden(dias[nu]) }); });
  toon();

  // Vanzelf verder om de 5 seconden.
  if (rustig || n < 2) return;
  var timer = null, zichtbaar = false, muis = false, rustTot = 0;
  function tik() { if (!muis && Date.now() > rustTot) naar(nu + 1); }
  function start() { clearInterval(timer); timer = null; if (zichtbaar && !document.hidden) timer = setInterval(tik, 5000); }
  function herstart() { rustTot = Date.now() + 8000; start(); }   // na een klik even wachten
  c.addEventListener("mouseenter", function () { muis = true; });
  c.addEventListener("mouseleave", function () { muis = false; });
  spoor.addEventListener("touchstart", function () { rustTot = Date.now() + 10000; }, { passive: true });
  document.addEventListener("visibilitychange", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { zichtbaar = e[0].isIntersecting; start(); }, { threshold: 0.4 }).observe(c);
  } else { zichtbaar = true; start(); }
})();
