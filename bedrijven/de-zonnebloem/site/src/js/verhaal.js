// Geanimeerd verhaal in het openingsbeeld: glas vult zich, druppels worden muntjes,
// daaruit groeit een zonnebloem, en twee vrienden komen samen. Speelt in een lus.
(function () {
  "use strict";
  var fig = document.getElementById("verhaal-anim");
  var svg = document.getElementById("va");
  if (!fig || !svg) return;
  var tekst = fig.querySelector(".verhaal__tekst");
  var balken = [].slice.call(fig.querySelectorAll(".verhaal__balk i"));
  var knop = document.getElementById("verhaal-pauze");
  var baan = document.getElementById("va-baan");
  var druppels = [].slice.call(svg.querySelectorAll(".druppel"));
  var munten = [].slice.call(svg.querySelectorAll(".munt"));
  var DUUR = [4200, 4400, 4600, 5600];

  // Bloemblaadjes één voor één laten openvouwen.
  [].slice.call(svg.querySelectorAll(".blad")).forEach(function (b, i) { b.style.setProperty("--i", i % 16); });

  // Rustige weergave: eindbeeld tonen, alle zinnen naast elkaar, geen beweging.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fig.classList.add("rustig");
    svg.classList.add("stil", "s1", "s2", "s3", "s4");
    munten.forEach(function (m) { m.classList.add("geland"); });
    return;
  }

  var stap = 0;
  var timer = null;
  var gepauzeerd = false;
  var zichtbaar = true;
  var resterend = 0;
  var gestart = 0;
  var loopt = false;

  function zetStap(n) {
    stap = n;
    for (var i = 1; i <= 4; i++) svg.classList.toggle("s" + i, i <= n);
    tekst.setAttribute("data-stap", n);
    balken.forEach(function (b, i) {
      b.classList.toggle("klaar", i < n - 1);
      b.classList.remove("bezig");
    });
    if (n >= 1) {
      var b = balken[n - 1];
      b.style.setProperty("--duur", DUUR[n - 1] + "ms");
      void b.offsetWidth;
      b.classList.add("bezig");
    }
    if (n === 2) setTimeout(laatDruppelsVallen, 700);
  }

  function laatDruppelsVallen() {
    if (!baan.getTotalLength) { munten.forEach(function (m) { m.classList.add("geland"); }); return; }
    var lengte = baan.getTotalLength();
    druppels.forEach(function (d, i) {
      var start = null;
      var vertraging = i * 380;
      function frame(t) {
        if (stap !== 2) { d.style.opacity = 0; return; }
        if (gepauzeerd) { start = null; requestAnimationFrame(frame); return; }
        if (start === null) start = t + vertraging;
        var p = Math.min(1, Math.max(0, (t - start) / 1150));
        var e = p * p * (3 - 2 * p);
        var pt = baan.getPointAtLength(e * lengte);
        d.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
        d.style.opacity = p > 0 && p < 1 ? 1 : 0;
        if (p < 1) requestAnimationFrame(frame);
        else munten[i].classList.add("geland");
      }
      requestAnimationFrame(frame);
    });
  }

  function volgende() {
    if (stap < 4) {
      zetStap(stap + 1);
      plan(DUUR[stap - 1]);
    } else {
      // Zacht uitfaden, alles terugzetten zonder overgang, en opnieuw beginnen.
      svg.classList.add("uit");
      loopt = true;
      timer = setTimeout(function () {
        svg.classList.add("stil");
        munten.forEach(function (m) { m.classList.remove("geland"); });
        zetStap(0);
        void svg.getBoundingClientRect();
        svg.classList.remove("stil", "uit");
        timer = setTimeout(function () { zetStap(1); plan(DUUR[0]); }, 250);
      }, 650);
    }
  }

  function plan(ms) {
    clearTimeout(timer);
    resterend = ms;
    gestart = Date.now();
    loopt = !gepauzeerd && zichtbaar;
    if (loopt) timer = setTimeout(volgende, ms);
  }

  function pauzeer() {
    if (!loopt) { fig.classList.add("gepauzeerd"); return; }
    loopt = false;
    clearTimeout(timer);
    resterend = Math.max(0, resterend - (Date.now() - gestart));
    fig.classList.add("gepauzeerd");
  }

  function hervat() {
    if (gepauzeerd || !zichtbaar || loopt || stap === 0) return;
    loopt = true;
    fig.classList.remove("gepauzeerd");
    gestart = Date.now();
    timer = setTimeout(volgende, resterend);
  }

  knop.addEventListener("click", function () {
    gepauzeerd = !gepauzeerd;
    knop.setAttribute("aria-pressed", String(gepauzeerd));
    knop.textContent = gepauzeerd ? "Speel af" : "Pauzeer";
    if (gepauzeerd) pauzeer(); else hervat();
  });

  // Niet afspelen als het beeld niet zichtbaar is (spaart batterij).
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (items) {
      zichtbaar = items[0].isIntersecting;
      if (zichtbaar) hervat(); else if (!gepauzeerd) pauzeer();
    }).observe(fig);
  }
  document.addEventListener("visibilitychange", function () {
    zichtbaar = !document.hidden;
    if (zichtbaar) hervat(); else if (!gepauzeerd) pauzeer();
  });

  // Start na de intro-animatie van de pagina.
  setTimeout(function () { zetStap(1); plan(DUUR[0]); }, 900);
})();
