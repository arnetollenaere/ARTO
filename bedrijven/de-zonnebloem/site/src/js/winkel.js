// Winkel op de homepage: wijnen tonen, mandje bijhouden, bestelling versturen, animaties.
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var euro = function (c) { return "€ " + (c / 100).toFixed(2).replace(".", ","); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SLEUTEL = "zonnebloem-mandje";

  var wijnen = [];
  var inst = null;
  var mandje = {};
  try { mandje = JSON.parse(localStorage.getItem(SLEUTEL)) || {}; } catch (e) { mandje = {}; }
  function bewaar() {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(mandje)); } catch (e) { /* privévenster */ }
  }

  function foto(w, breedte) {
    return "/img/foto/" + w.foto + "-" + breedte + ".webp";
  }

  // ---------- Wijnen ----------
  function toonWijnen() {
    var lijst = $("#wijnlijst");
    lijst.innerHTML = wijnen.map(function (w, i) {
      var aantal = mandje[w.id] || 0;
      return '<li class="wijn" data-soort="' + esc(w.soort) + '">' +
        '<div class="wijn__beeld">' +
          '<img src="' + foto(w, 1000) + '" srcset="' + foto(w, 640) + " 640w, " + foto(w, 1000) + ' 1000w" sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw" width="1000" height="1250" loading="lazy" alt="">' +
          '<span class="wijn__soort">' + esc(w.soort) + "</span>" +
          '<div class="wijn__snel"><p class="wijn__prijs">' + euro(w.prijs) + "<small>per fles</small></p></div>" +
        "</div>" +
        '<div class="wijn__tekst">' +
          '<p class="wijn__streek">' + esc(w.streek) + " · " + esc(w.land) + (w.jaar ? " · " + w.jaar : "") + "</p>" +
          "<h3>" + esc(w.naam) + "</h3>" +
          '<p class="wijn__druif">' + esc(w.druif) + "</p>" +
          '<p class="wijn__smaak">' + esc(w.smaak) + "</p>" +
          '<p class="wijn__past"><span>Past bij</span>' + esc(w.pastBij) + "</p>" +
        "</div>" +
        '<div class="wijn__acties">' +
          '<div class="stapper" role="group" aria-label="Aantal flessen ' + esc(w.naam) + '">' +
            '<button type="button" data-min="' + w.id + '" aria-label="Eén fles minder">−</button>' +
            '<output aria-live="polite" data-aantal="' + w.id + '">' + aantal + "</output>" +
            '<button type="button" data-plus="' + w.id + '" aria-label="Eén fles meer">+</button>' +
          "</div>" +
          '<button type="button" class="knop" data-doos="' + w.id + '"><span>+ 6 flessen</span></button>' +
        "</div>" +
      "</li>";
    }).join("");
    $$(".wijn").forEach(function (k, i) { k.style.setProperty("--vertraging", (i % 3) * 120 + "ms"); });
    onthul(".wijn");
  }

  function zetAantal(id, n) {
    if (!wijnen.some(function (x) { return x.id === id; })) return;
    n = Math.max(0, Math.min(n, inst ? inst.maxFlessenPerBestelling : 120));
    if (n) mandje[id] = n; else delete mandje[id];
    bewaar();
    $$('[data-aantal="' + id + '"]').forEach(function (o) { o.textContent = n; });
    toonMandje();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.plus) { zetAantal(t.dataset.plus, (mandje[t.dataset.plus] || 0) + 1); pof(t); if (!t.closest(".mandje")) toegevoegd(t.dataset.plus, 1); }
    else if (t.dataset.min) zetAantal(t.dataset.min, (mandje[t.dataset.min] || 0) - 1);
    else if (t.dataset.doos) { zetAantal(t.dataset.doos, (mandje[t.dataset.doos] || 0) + 6); pof(t); toegevoegd(t.dataset.doos, 6); }
    else if (t.dataset.filter) filter(t);
  });

  function pof(knop) {
    [$("#zwevend"), $(".mandknop")].forEach(function (z) {
      z.classList.remove("pof");
      void z.offsetWidth;
      z.classList.add("pof");
    });
    knop.classList.add("geklikt");
    setTimeout(function () { knop.classList.remove("geklikt"); }, 350);
  }

  // Korte melding met foto wanneer je iets in je mandje legt.
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var toastTimer;
  function toegevoegd(id, n) {
    var w = wijnen.find(function (x) { return x.id === id; });
    if (!w) return;
    toast.innerHTML = '<img src="' + foto(w, 640) + '" width="44" height="55" alt=""><span><strong>' + esc(w.naam) + "</strong>" + n + (n === 1 ? " fles" : " flessen") + ' in je mandje</span><a href="#bestellen">Bekijk</a>';
    toast.classList.remove("toast--aan");
    void toast.offsetWidth;
    toast.classList.add("toast--aan");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("toast--aan"); }, 2600);
  }

  function filter(knop) {
    var soort = knop.dataset.filter;
    $$(".filter").forEach(function (b) { b.setAttribute("aria-pressed", String(b === knop)); });
    $("#wijnlijst").classList.toggle("gefilterd", soort !== "alles");
    $$(".wijn").forEach(function (k) { k.hidden = soort !== "alles" && k.dataset.soort !== soort; });
  }

  // ---------- Mandje ----------
  function flessen() {
    return Object.keys(mandje).reduce(function (s, k) { return s + mandje[k]; }, 0);
  }
  function leveringsKeuze() {
    var k = document.querySelector('input[name="levering"]:checked');
    return k ? k.value : "afhalen";
  }
  function leveringskost() {
    if (!inst || leveringsKeuze() !== "levering") return 0;
    var gratis = inst.levering.gratisVanaf;
    return gratis && flessen() >= gratis ? 0 : inst.levering.kost;
  }

  var bijBestellen = false;
  function toonMandje() {
    var som = 0;
    $("#mandje-regels").innerHTML = wijnen.filter(function (w) { return mandje[w.id]; }).map(function (w) {
      var n = mandje[w.id];
      som += n * w.prijs;
      return "<li>" +
        '<img class="mandje__foto" src="' + foto(w, 640) + '" width="56" height="70" alt="" loading="lazy">' +
        '<span class="mandje__naam">' + esc(w.naam) + "<small>" + euro(w.prijs) + " per fles</small></span>" +
        '<span class="mandje__bedrag">' + euro(n * w.prijs) + "</span>" +
        '<span class="stapper stapper--klein">' +
          '<button type="button" data-min="' + w.id + '" aria-label="Eén fles ' + esc(w.naam) + ' minder">−</button>' +
          '<output data-aantal="' + w.id + '">' + n + "</output>" +
          '<button type="button" data-plus="' + w.id + '" aria-label="Eén fles ' + esc(w.naam) + ' meer">+</button>' +
        "</span></li>";
    }).join("");
    var n = flessen();
    var lk = leveringskost();
    $("#mandje-leeg").hidden = n > 0;
    $("#som-wijn").textContent = euro(som);
    $("#som-levering-rij").hidden = leveringsKeuze() !== "levering";
    $("#som-levering").textContent = lk ? euro(lk) : "gratis";
    $("#som-totaal").textContent = euro(som + lk);
    $("#kop-aantal").textContent = n;
    $(".mandknop").classList.toggle("vol", n > 0);
    $("#zwevend").hidden = n === 0 || bijBestellen;
    $("#zwevend-aantal").textContent = n;
    $("#zwevend-tekst").textContent = n === 1 ? "fles" : "flessen";
    $("#zwevend-totaal").textContent = euro(som + lk);
  }

  // ---------- Instellingen ----------
  function pasInstellingenToe() {
    $("#actienaam").textContent = inst.actie;
    var sel = $("#afhaalmoment");
    sel.innerHTML = inst.afhalen.momenten.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + "</option>"; }).join("");
    $("#afhaal-plaats").textContent = "Afhaalpunt: " + inst.afhalen.plaats;
    if (!inst.levering.actief) {
      // Enkel afhalen: keuzevakjes verbergen, enkel het afhaalmoment tonen.
      $("#keuze-levering").hidden = true;
      $("#keuze-levering").parentNode.hidden = true;
      $("#legend-levering").textContent = "Afhalen";
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

  $$('input[name="levering"]').forEach(function (r) {
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
    $$("[aria-invalid]").forEach(function (x) { x.removeAttribute("aria-invalid"); });

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
    var label = knop.firstElementChild;
    knop.disabled = true;
    label.textContent = "Even geduld…";
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
        label.textContent = "Bestellen";
      });
  });

  // ---------- Teller ----------
  function laadStand() {
    fetch("/api/stand").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s || !s.doel) return;
      $("#stand").hidden = false;
      var pct = Math.min(100, Math.round((s.flessen / s.doel) * 100));
      $("#stand-doel").textContent = s.doel.toLocaleString("nl-BE") + " flessen";
      var lijn = $("#stand-lijn");
      lijn.setAttribute("aria-valuenow", pct);
      setTimeout(function () { lijn.firstElementChild.style.width = Math.max(pct, 1.5) + "%"; }, 1400);
      telOp($("#stand-flessen"), s.flessen);
    }).catch(function () {});
  }
  function telOp(e, doel) {
    if (rustig) { e.textContent = doel.toLocaleString("nl-BE"); return; }
    setTimeout(function () {
      var start = performance.now();
      (function stap(nu) {
        var t = Math.min(1, (nu - start) / 2000);
        e.textContent = Math.round(doel * (1 - Math.pow(1 - t, 4))).toLocaleString("nl-BE");
        if (t < 1) requestAnimationFrame(stap);
      })(start);
    }, 1300);
  }

  // ---------- Animaties ----------
  var waarnemer = "IntersectionObserver" in window ? new IntersectionObserver(function (items) {
    items.forEach(function (i) {
      if (i.isIntersecting) { i.target.classList.add("zichtbaar"); waarnemer.unobserve(i.target); }
    });
  }, { rootMargin: "0px 0px -12% 0px" }) : null;
  function onthul(sel) {
    $$(sel).forEach(function (x) { if (waarnemer && !rustig) waarnemer.observe(x); else x.classList.add("zichtbaar"); });
  }

  // Manifest: woorden lichten op terwijl je scrolt.
  var manifest = $("#manifest");
  var woorden = [];
  if (manifest && !rustig) {
    manifest.innerHTML = manifest.textContent.trim().split(/\s+/).map(function (w) { return '<span class="woord">' + esc(w) + "</span>"; }).join(" ");
    woorden = [].slice.call(manifest.querySelectorAll(".woord"));
  }

  var parallax = $$("[data-parallax]");
  var kop = $("#kop");
  var gepland = false;
  function opScroll() {
    gepland = false;
    var h = innerHeight;
    kop.classList.toggle("kop--vast", scrollY > 30);
    if (woorden.length) {
      var r = manifest.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (h * 0.85 - r.top) / (r.height + h * 0.35)));
      var aan = Math.round(p * woorden.length);
      woorden.forEach(function (w, i) { w.classList.toggle("aan", i < aan); });
    }
    if (!rustig) {
      parallax.forEach(function (el) {
        var r2 = el.getBoundingClientRect();
        if (r2.bottom < -200 || r2.top > h + 200) return;
        var midden = r2.top + r2.height / 2 - h / 2;
        el.style.transform = "translate3d(0," + (midden * Number(el.dataset.parallax)).toFixed(1) + "px,0)";
      });
    }
  }
  addEventListener("scroll", function () { if (!gepland) { gepland = true; requestAnimationFrame(opScroll); } }, { passive: true });
  addEventListener("resize", opScroll);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (items) {
      bijBestellen = items[0].isIntersecting;
      $("#zwevend").hidden = flessen() === 0 || bijBestellen;
    }, { rootMargin: "0px 0px -30% 0px" }).observe($("#bestellen"));
  }

  // ---------- ARTO-logo: kantelt mee met de muis, draait kort bij aantikken ----------
  var arto = $("#arto");
  if (arto && !rustig) {
    var teken = arto.querySelector(".arto__teken");
    arto.addEventListener("pointermove", function (e) {
      var r = teken.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / 120, dy = (e.clientY - (r.top + r.height / 2)) / 120;
      arto.style.setProperty("--ry", Math.max(-1, Math.min(1, dx)) * 35 + "deg");
      arto.style.setProperty("--rx", Math.max(-1, Math.min(1, -dy)) * 35 + "deg");
    });
    arto.addEventListener("pointerleave", function () { arto.style.setProperty("--rx", "0deg"); arto.style.setProperty("--ry", "0deg"); });
    arto.addEventListener("touchstart", function () {
      arto.classList.remove("tik"); void arto.offsetWidth; arto.classList.add("tik");
      setTimeout(function () { arto.classList.remove("tik"); }, 2200);
    }, { passive: true });
  }

  // ---------- Menu (volledig scherm, zoals op vzwraakpunt.be) ----------
  var menuknop = $("#menuknop"), menu = $("#menu");
  if (menuknop && menu) {
    var zetMenu = function (open) {
      menu.hidden = !open;
      menuknop.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { var eerste = menu.querySelector("a"); if (eerste) eerste.focus(); } else menuknop.focus();
    };
    menuknop.addEventListener("click", function () { zetMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) zetMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) zetMenu(false); });
  }

  // ---------- Start ----------
  $("#jaar").textContent = new Date().getFullYear();
  onthul(".onthul");
  opScroll();

  Promise.all([
    fetch("/wijnen.json").then(function (r) { return r.json(); }),
    fetch("/instellingen.json").then(function (r) { return r.json(); })
  ]).then(function (d) {
    wijnen = d[0].wijnen;
    inst = d[1];
    Object.keys(mandje).forEach(function (id) { if (!wijnen.some(function (w) { return w.id === id; })) delete mandje[id]; });
    pasInstellingenToe();
    toonWijnen();
    toonMandje();
    laadStand();
  }).catch(function () {
    $("#wijnlijst").innerHTML = '<li class="laden">De wijnen konden niet geladen worden. Vernieuw de pagina.</li>';
  });
})();
