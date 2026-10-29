// Winkel op de homepage: wijnen tonen, mandje bijhouden, bestelling versturen.
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var euro = function (c) { return "€ " + (c / 100).toFixed(2).replace(".", ","); };
  var SLEUTEL = "zonnebloem-mandje";

  var wijnen = [];
  var inst = null;
  var mandje = {};
  try { mandje = JSON.parse(localStorage.getItem(SLEUTEL)) || {}; } catch (e) { mandje = {}; }

  function bewaar() {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(mandje)); } catch (e) { /* privévenster */ }
  }

  function el(tag, attrs, kinderen) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kinderen || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // ---------- Wijnen ----------
  function toonWijnen() {
    var lijst = $("#wijnlijst");
    lijst.innerHTML = "";
    wijnen.forEach(function (w, i) {
      var aantal = mandje[w.id] || 0;
      var kaart = el("li", { class: "kaart onthul", "data-soort": w.soort });
      kaart.style.setProperty("--vertraging", (i % 3) * 90 + "ms");
      kaart.style.setProperty("--labelkleur", w.label);
      kaart.innerHTML =
        '<div class="kaart__beeld">' + Fles.svg(w) + '<span class="kaart__soort">' + w.soort + "</span></div>" +
        '<div class="kaart__tekst">' +
          '<p class="kaart__streek">' + w.streek + " · " + w.land + (w.jaar ? " · " + w.jaar : "") + "</p>" +
          "<h3>" + w.naam + "</h3>" +
          '<p class="kaart__druif">' + w.druif + "</p>" +
          '<p class="kaart__smaak">' + w.smaak + "</p>" +
          '<p class="kaart__past"><span>Past bij</span> ' + w.pastBij + "</p>" +
        "</div>" +
        '<div class="kaart__voet">' +
          '<p class="kaart__prijs">' + euro(w.prijs) + "<small>per fles</small></p>" +
          '<div class="teller-knop" role="group" aria-label="Aantal ' + w.naam + '">' +
            '<button type="button" data-min="' + w.id + '" aria-label="Eén fles minder">−</button>' +
            '<output aria-live="polite" data-aantal="' + w.id + '">' + aantal + "</output>" +
            '<button type="button" data-plus="' + w.id + '" aria-label="Eén fles meer">+</button>' +
          "</div>" +
          '<button type="button" class="knop knop--doos" data-doos="' + w.id + '">+ doos van 6</button>' +
        "</div>";
      lijst.appendChild(kaart);
    });
    onthul();
  }

  function zetAantal(id, n) {
    var w = wijnen.find(function (x) { return x.id === id; });
    if (!w) return;
    n = Math.max(0, Math.min(n, inst ? inst.maxFlessenPerBestelling : 120));
    if (n) mandje[id] = n; else delete mandje[id];
    bewaar();
    document.querySelectorAll('[data-aantal="' + id + '"]').forEach(function (o) { o.textContent = n; });
    toonMandje();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.plus) { zetAantal(t.dataset.plus, (mandje[t.dataset.plus] || 0) + 1); pof(t); }
    if (t.dataset.min) zetAantal(t.dataset.min, (mandje[t.dataset.min] || 0) - 1);
    if (t.dataset.doos) { zetAantal(t.dataset.doos, (mandje[t.dataset.doos] || 0) + 6); pof(t); }
    if (t.dataset.filter) filter(t);
  });

  function pof(knop) {
    var z = $("#zwevend");
    z.classList.remove("pof");
    void z.offsetWidth;
    z.classList.add("pof");
    knop.classList.add("geklikt");
    setTimeout(function () { knop.classList.remove("geklikt"); }, 300);
  }

  function filter(knop) {
    var soort = knop.dataset.filter;
    document.querySelectorAll(".filter").forEach(function (b) { b.setAttribute("aria-pressed", String(b === knop)); });
    document.querySelectorAll(".kaart").forEach(function (k) {
      k.hidden = soort !== "alles" && k.dataset.soort !== soort;
    });
  }

  // ---------- Mandje ----------
  function flessen() {
    return Object.keys(mandje).reduce(function (s, k) { return s + mandje[k]; }, 0);
  }

  function leveringskost() {
    if (!inst || leveringsKeuze() !== "levering") return 0;
    var gratis = inst.levering.gratisVanaf;
    return gratis && flessen() >= gratis ? 0 : inst.levering.kost;
  }

  function leveringsKeuze() {
    var k = document.querySelector('input[name="levering"]:checked');
    return k ? k.value : "afhalen";
  }

  function toonMandje() {
    var ul = $("#mandje-regels");
    ul.innerHTML = "";
    var som = 0;
    wijnen.forEach(function (w) {
      var n = mandje[w.id];
      if (!n) return;
      som += n * w.prijs;
      var li = el("li", {}, []);
      li.innerHTML =
        '<span class="mandje__stip"></span>' +
        '<span class="mandje__naam">' + w.naam + "<small>" + euro(w.prijs) + " per fles</small></span>" +
        '<span class="teller-knop teller-knop--klein">' +
          '<button type="button" data-min="' + w.id + '" aria-label="Eén fles ' + w.naam + ' minder">−</button>' +
          '<output data-aantal="' + w.id + '">' + n + "</output>" +
          '<button type="button" data-plus="' + w.id + '" aria-label="Eén fles ' + w.naam + ' meer">+</button>' +
        "</span>" +
        '<span class="mandje__bedrag">' + euro(n * w.prijs) + "</span>";
      li.firstElementChild.style.setProperty("--kleur", w.label);
      ul.appendChild(li);
    });
    var n = flessen();
    var lk = leveringskost();
    $("#mandje-leeg").hidden = n > 0;
    $("#som-wijn").textContent = euro(som);
    $("#som-levering-rij").hidden = leveringsKeuze() !== "levering";
    $("#som-levering").textContent = lk ? euro(lk) : "gratis";
    $("#som-totaal").textContent = euro(som + lk);

    var z = $("#zwevend");
    z.hidden = n === 0 || bijBestellen;
    $("#zwevend-aantal").textContent = n;
    $("#zwevend-tekst").textContent = n === 1 ? "fles" : "flessen";
    $("#zwevend-totaal").textContent = euro(som + lk);
  }

  // ---------- Instellingen ----------
  function pasInstellingenToe() {
    $("#actienaam").textContent = inst.actie;
    var sel = $("#afhaalmoment");
    inst.afhalen.momenten.forEach(function (m) { sel.appendChild(el("option", { value: m, text: m })); });
    $("#afhaal-plaats").textContent = "Afhaalpunt: " + inst.afhalen.plaats;
    if (!inst.levering.actief) {
      $("#keuze-levering").hidden = true;
    } else {
      $("#levering-prijs").textContent = euro(inst.levering.kost) + (inst.levering.gratisVanaf ? ", gratis vanaf " + inst.levering.gratisVanaf + " flessen" : "");
      $("#levering-regio").textContent = inst.levering.uitleg + " Regio: " + inst.levering.postcodes + ".";
    }
    if (inst.deadline) {
      var d = new Date(inst.deadline + "T12:00:00");
      $("#faq-deadline").textContent = "Je kan bestellen tot en met " + d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ".";
    }
    if (!inst.bestellingenOpen) {
      $("#gesloten").hidden = false;
      $("#bestelformulier").hidden = true;
    }
  }

  document.querySelectorAll('input[name="levering"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var lev = leveringsKeuze() === "levering";
      $("#blok-levering").hidden = !lev;
      $("#blok-afhalen").hidden = lev;
      toonMandje();
    });
  });

  // ---------- Bestellen ----------
  $("#bestelformulier").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var foutEl = $("#formulier-fout");
    var toonFout = function (t, veld) {
      foutEl.textContent = t;
      foutEl.hidden = false;
      if (veld) { veld.setAttribute("aria-invalid", "true"); veld.focus(); }
    };
    foutEl.hidden = true;
    f.querySelectorAll("[aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });

    if (!flessen()) return toonFout("Je mandje is nog leeg. Kies eerst je wijnen.");
    if (f.naam.value.trim().length < 2) return toonFout("Vul je naam in.", f.naam);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return toonFout("Vul een geldig e-mailadres in.", f.email);
    if (f.telefoon.value.replace(/\D/g, "").length < 8) return toonFout("Vul een geldig telefoonnummer in.", f.telefoon);
    var lev = leveringsKeuze();
    if (lev === "levering") {
      if (f.adres.value.trim().length < 4) return toonFout("Vul je straat en huisnummer in.", f.adres);
      if (!/^\d{4}$/.test(f.postcode.value.trim())) return toonFout("Vul een geldige postcode in.", f.postcode);
      if (f.gemeente.value.trim().length < 2) return toonFout("Vul je gemeente in.", f.gemeente);
    }
    if (!f.leeftijd.checked) return toonFout("Bevestig dat je minstens 18 jaar bent.", f.leeftijd);

    var knop = $("#bestelknop");
    knop.disabled = true;
    knop.textContent = "Even geduld…";
    fetch("/api/bestellingen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        naam: f.naam.value, email: f.email.value, telefoon: f.telefoon.value,
        levering: lev, afhaalmoment: f.afhaalmoment.value,
        adres: f.adres.value, postcode: f.postcode.value, gemeente: f.gemeente.value,
        opmerking: f.opmerking.value, leeftijd: f.leeftijd.checked, website: f.website.value,
        mandje: mandje
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.fout || "Er ging iets mis.");
        mandje = {};
        bewaar();
        location.href = "/bestelling/?id=" + res.d.id + "&t=" + res.d.token;
      })
      .catch(function (err) {
        toonFout(err.message === "Failed to fetch" ? "Geen verbinding. Probeer het opnieuw." : err.message);
        knop.disabled = false;
        knop.textContent = "Bestellen en betaalgegevens tonen";
      });
  });

  // ---------- Teller ----------
  function laadStand() {
    fetch("/api/stand").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s || !s.doel) return;
      $("#teller").hidden = false;
      var pct = Math.min(100, Math.round((s.flessen / s.doel) * 100));
      $("#teller-doel").textContent = s.doel.toLocaleString("nl-BE") + " flessen";
      var balk = $("#teller-balk");
      balk.setAttribute("aria-valuenow", pct);
      requestAnimationFrame(function () { balk.firstElementChild.style.width = Math.max(pct, 2) + "%"; });
      telOp($("#teller-flessen"), s.flessen);
    }).catch(function () {});
  }

  function telOp(e, doel) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { e.textContent = doel.toLocaleString("nl-BE"); return; }
    var start = performance.now();
    (function stap(nu) {
      var t = Math.min(1, (nu - start) / 1600);
      e.textContent = Math.round(doel * (1 - Math.pow(1 - t, 3))).toLocaleString("nl-BE");
      if (t < 1) requestAnimationFrame(stap);
    })(start);
  }

  // ---------- Animaties ----------
  var waarnemer = "IntersectionObserver" in window ? new IntersectionObserver(function (items) {
    items.forEach(function (i) { if (i.isIntersecting) { i.target.classList.add("zichtbaar"); waarnemer.unobserve(i.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;

  function onthul() {
    document.querySelectorAll(".onthul:not(.zichtbaar)").forEach(function (x) {
      if (waarnemer) waarnemer.observe(x); else x.classList.add("zichtbaar");
    });
  }

  function heldFlessen() {
    var keuze = ["rose", "merlot", "cava"].map(function (id) { return wijnen.find(function (w) { return w.id === id; }); }).filter(Boolean);
    if (keuze.length < 3) keuze = wijnen.slice(0, 3);
    $("#held-flessen").innerHTML = keuze.map(function (w, i) { return '<div class="held__fles held__fles--' + (i + 1) + '">' + Fles.svg(w) + "</div>"; }).join("");
  }

  // Het zwevende mandje verdwijnt zolang je bij het bestelformulier bent.
  var bijBestellen = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (items) {
      bijBestellen = items[0].isIntersecting;
      $("#zwevend").hidden = flessen() === 0 || bijBestellen;
    }, { rootMargin: "0px 0px -30% 0px" }).observe($("#bestellen"));
  }

  var kop = $(".kop");
  addEventListener("scroll", function () { kop.classList.toggle("kop--vast", scrollY > 40); }, { passive: true });

  // ---------- Start ----------
  $("#jaar").textContent = new Date().getFullYear();
  Fles.zon($("#zon"));
  Fles.zon($("#zon-klein"), { bladen: 22, zaden: 300 });
  onthul();

  Promise.all([
    fetch("/wijnen.json").then(function (r) { return r.json(); }),
    fetch("/instellingen.json").then(function (r) { return r.json(); })
  ]).then(function (d) {
    wijnen = d[0].wijnen;
    inst = d[1];
    Object.keys(mandje).forEach(function (id) { if (!wijnen.some(function (w) { return w.id === id; })) delete mandje[id]; });
    pasInstellingenToe();
    toonWijnen();
    heldFlessen();
    toonMandje();
    laadStand();
  }).catch(function () {
    $("#wijnlijst").innerHTML = '<li class="laden">De wijnen konden niet geladen worden. Vernieuw de pagina.</li>';
  });
})();
