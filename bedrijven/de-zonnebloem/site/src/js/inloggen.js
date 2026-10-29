// Inlogpagina beheer: gegevens naar /api/inloggen sturen, bij succes naar het beheer.
(function () {
  "use strict";
  var f = document.getElementById("inlogformulier");
  var fout = document.getElementById("fout");
  var knop = document.getElementById("knop");
  var ww = document.getElementById("wachtwoord");
  var toon = document.getElementById("toon");

  // Al ingelogd? Dan meteen door naar het beheer.
  fetch("/api/beheer/controle", { cache: "no-store" }).then(function (r) { if (r.ok) location.replace("/beheer/"); }).catch(function () {});

  toon.addEventListener("click", function () {
    var zichtbaar = ww.type === "text";
    ww.type = zichtbaar ? "password" : "text";
    toon.textContent = zichtbaar ? "Toon" : "Verberg";
    toon.setAttribute("aria-pressed", String(!zichtbaar));
  });

  function toonFout(t) { fout.textContent = t; fout.hidden = false; }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    fout.hidden = true;
    if (!f.gebruiker.value.trim() || !ww.value) return toonFout("Vul je gebruikersnaam en wachtwoord in.");
    knop.disabled = true;
    knop.textContent = "Even geduld…";
    fetch("/api/inloggen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gebruiker: f.gebruiker.value, wachtwoord: ww.value })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.fout || "Inloggen mislukt.");
        location.replace("/beheer/");
      })
      .catch(function (err) {
        toonFout(err.message === "Failed to fetch" ? "Geen verbinding. Probeer het opnieuw." : err.message);
        knop.disabled = false;
        knop.textContent = "Inloggen";
        ww.select();
      });
  });
})();
