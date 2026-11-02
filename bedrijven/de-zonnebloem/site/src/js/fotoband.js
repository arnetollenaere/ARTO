// Fotoband "De Zonnebloem in beeld": de foto's schuiven traag en ononderbroken voorbij.
// De band wordt één keer verdubbeld zodat hij naadloos rondloopt. Stopt bij muis erover,
// bij focus, met de pauzeknop en buiten beeld. Bij "minder beweging": gewone rij om zelf te scrollen.
(function () {
  "use strict";
  var band = document.querySelector("[data-fotoband]");
  if (!band) return;
  var spoor = band.querySelector(".fotoband__spoor");
  var knop = band.querySelector(".fotoband__pauze");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { band.classList.add("fotoband--stil"); return; }

  // Tweede kopie voor de naadloze lus (voor schermlezers verborgen).
  [].slice.call(spoor.children).forEach(function (d) {
    var k = d.cloneNode(true);
    k.setAttribute("aria-hidden", "true");
    k.querySelector("img").alt = "";
    spoor.appendChild(k);
  });

  // Snelheid: ongeveer 40 pixels per seconde, ongeacht hoeveel foto's er zijn.
  function snelheid() { spoor.style.setProperty("--duur", Math.max(20, spoor.scrollWidth / 2 / 40) + "s"); }
  snelheid();
  addEventListener("resize", snelheid);
  [].slice.call(spoor.querySelectorAll("img")).forEach(function (i) { i.addEventListener("load", snelheid); });

  band.classList.add("fotoband--loopt");
  knop.addEventListener("click", function () {
    var uit = knop.getAttribute("aria-pressed") !== "true";
    knop.setAttribute("aria-pressed", String(uit));
    knop.setAttribute("aria-label", uit ? "Foto's laten lopen" : "Foto's pauzeren");
    band.classList.toggle("fotoband--gepauzeerd", uit);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { band.classList.toggle("fotoband--buiten", !e[0].isIntersecting); }).observe(band);
  }
})();
