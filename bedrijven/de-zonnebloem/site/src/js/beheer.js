// Beheerscherm: bestellingen opvolgen, betalingen afpunten, picklijst.
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var euro = function (c) { return "€ " + (c / 100).toFixed(2).replace(".", ","); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var datum = function (iso) {
    return iso ? new Date(iso).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  };

  var STATUS = {
    nieuw: "Wacht op betaling",
    betaald: "Betaald",
    klaar: "Klaargezet",
    afgeleverd: "Afgeleverd",
    geannuleerd: "Geannuleerd"
  };
  var VOLGENDE = { nieuw: ["betaald", "Betaald"], betaald: ["klaar", "Klaargezet"], klaar: ["afgeleverd", "Afgeleverd"] };

  var bestellingen = [];
  var filter = "alles";
  var open = null;

  function melding(t) {
    var m = $("melding");
    m.textContent = t;
    m.hidden = false;
    clearTimeout(melding.t);
    melding.t = setTimeout(function () { m.hidden = true; }, 2600);
  }

  function laad() {
    return fetch("/api/beheer/bestellingen", { cache: "no-store" })
      .then(function (r) { if (r.status === 401) { location.replace("/inloggen/"); throw new Error("Niet ingelogd."); } if (!r.ok) throw new Error("Kon de bestellingen niet laden (" + r.status + ")."); return r.json(); })
      .then(function (d) { bestellingen = d; toonAlles(); })
      .catch(function (e) { melding(e.message); });
  }

  function wijzig(id, data) {
    return fetch("/api/beheer/bestelling/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.fout || "Opslaan mislukt."); });
      return r.json();
    }).then(function (nieuw) {
      bestellingen = bestellingen.map(function (b) { return b.id === nieuw.id ? nieuw : b; });
      return nieuw;
    });
  }

  // ---------- Kerncijfers ----------
  function cijfers() {
    var actief = bestellingen.filter(function (b) { return b.status !== "geannuleerd"; });
    var openB = actief.filter(function (b) { return b.status === "nieuw"; });
    $("k-bestellingen").textContent = actief.length;
    $("k-flessen").textContent = actief.reduce(function (s, b) { return s + b.flessen; }, 0);
    $("k-open").textContent = euro(openB.reduce(function (s, b) { return s + b.totaal; }, 0));
    $("k-open-n").textContent = openB.length + " onbetaald";
    $("k-ontvangen").textContent = euro(actief.filter(function (b) { return b.status !== "nieuw"; }).reduce(function (s, b) { return s + b.totaal; }, 0));
  }

  // ---------- Lijst ----------
  function statusfilter() {
    var tel = { alles: bestellingen.length };
    bestellingen.forEach(function (b) { tel[b.status] = (tel[b.status] || 0) + 1; });
    var opties = [["alles", "Alles"]].concat(Object.keys(STATUS).map(function (k) { return [k, STATUS[k]]; }));
    $("statusfilter").innerHTML = opties.map(function (o) {
      return '<button type="button" data-status="' + o[0] + '" aria-pressed="' + (filter === o[0]) + '">' + o[1] + "<b>" + (tel[o[0]] || 0) + "</b></button>";
    }).join("");
  }

  function lijst() {
    var zoek = $("zoek").value.trim().toLowerCase();
    var cijfersZoek = zoek.replace(/\D/g, "");
    var rijen = bestellingen.filter(function (b) {
      if (filter !== "alles" && b.status !== filter) return false;
      if (!zoek) return true;
      var hooi = [b.nummer, b.naam, b.email, b.telefoon, b.gemeente].join(" ").toLowerCase();
      return hooi.indexOf(zoek) > -1 || (cijfersZoek.length >= 4 && (b.ogm || "").replace(/\D/g, "").indexOf(cijfersZoek) > -1);
    });
    $("leeg").hidden = rijen.length > 0;
    $("lijst").innerHTML = rijen.map(function (b) {
      var v = VOLGENDE[b.status];
      var html = '<tr class="rij" data-id="' + b.id + '">' +
        "<td><strong>" + esc(b.nummer) + "</strong></td>" +
        "<td>" + datum(b.aangemaakt) + "</td>" +
        "<td>" + esc(b.naam) + "<small>" + esc(b.telefoon) + "</small></td>" +
        "<td>" + b.regels.map(function (r) { return r.aantal + "× " + esc(r.naam); }).join("<br>") + "</td>" +
        "<td>" + (b.levering === "afhalen" ? "Afhalen<small>" + esc(b.afhaalmoment) + "</small>" : "Levering<small>" + esc(b.postcode + " " + b.gemeente) + "</small>") + "</td>" +
        '<td class="r"><strong>' + euro(b.totaal) + "</strong><small>" + b.flessen + " fl.</small></td>" +
        '<td class="mono">' + esc(b.ogm) + "</td>" +
        '<td><span class="lbl lbl--' + b.status + '">' + STATUS[b.status] + "</span></td>" +
        '<td><div class="acties">' +
          (v ? '<button type="button" class="bh-knop bh-knop--oranje bh-knop--klein" data-zet="' + v[0] + '" data-id="' + b.id + '">' + v[1] + "</button>" : "") +
          '<select data-kies="' + b.id + '" aria-label="Status van ' + esc(b.nummer) + '">' +
            Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (k === b.status ? " selected" : "") + ">" + STATUS[k] + "</option>"; }).join("") +
          "</select>" +
        "</div></td></tr>";
      if (open === b.id) html += detail(b);
      return html;
    }).join("");
  }

  function detail(b) {
    return '<tr class="detail"><td colspan="9"><div class="detail__raster">' +
      "<div><h4>Contact</h4><p>" + esc(b.naam) + '</p><p><a href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a></p><p><a href="tel:' + esc(b.telefoon) + '">' + esc(b.telefoon) + "</a></p></div>" +
      "<div><h4>" + (b.levering === "afhalen" ? "Afhalen" : "Leveradres") + "</h4>" +
        (b.levering === "afhalen" ? "<p>" + esc(b.afhaalmoment) + "</p>" : "<p>" + esc(b.adres) + "</p><p>" + esc(b.postcode + " " + b.gemeente) + "</p>") +
        "<h4>Tijdlijn</h4><p>Besteld " + datum(b.aangemaakt) + "</p>" + (b.betaald_op ? "<p>Betaald " + datum(b.betaald_op) + "</p>" : "") + (b.afgeleverd_op ? "<p>Afgeleverd " + datum(b.afgeleverd_op) + "</p>" : "") +
      "</div>" +
      "<div><h4>Opmerking klant</h4><p>" + (esc(b.opmerking) || "<em>geen</em>") + "</p>" +
        '<h4><label for="notitie-' + b.id + '">Interne notitie</label></h4><textarea id="notitie-' + b.id + '">' + esc(b.notitie_beheer) + "</textarea>" +
        '<div class="bh-rij"><button type="button" class="bh-knop bh-knop--rand bh-knop--klein" data-notitie="' + b.id + '">Notitie bewaren</button></div>' +
      "</div></div></td></tr>";
  }

  function toonAlles() {
    cijfers();
    statusfilter();
    lijst();
    picklijst();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var knop = t.closest("button");
    if (knop && knop.dataset.status) { filter = knop.dataset.status; statusfilter(); lijst(); return; }
    if (knop && knop.dataset.tab) { toonTab(knop.dataset.tab); return; }
    if (knop && knop.dataset.zet) {
      knop.disabled = true;
      wijzig(Number(knop.dataset.id), { status: knop.dataset.zet })
        .then(function (b) { melding(b.nummer + ": " + STATUS[b.status]); toonAlles(); })
        .catch(function (err) { melding(err.message); knop.disabled = false; });
      return;
    }
    if (knop && knop.dataset.notitie) {
      var id = Number(knop.dataset.notitie);
      wijzig(id, { notitie: $("notitie-" + id).value }).then(function () { melding("Notitie bewaard"); }).catch(function (err) { melding(err.message); });
      return;
    }
    if (t.closest("select, a, textarea, .detail")) return;
    var rij = t.closest("tr.rij");
    if (rij) { var rid = Number(rij.dataset.id); open = open === rid ? null : rid; lijst(); }
  });

  document.addEventListener("change", function (e) {
    var s = e.target.closest("select[data-kies]");
    if (!s) return;
    var b = bestellingen.find(function (x) { return x.id === Number(s.dataset.kies); });
    if (s.value === "geannuleerd" && !confirm("Bestelling " + b.nummer + " annuleren?")) { s.value = b.status; return; }
    wijzig(b.id, { status: s.value }).then(function (n) { melding(n.nummer + ": " + STATUS[n.status]); toonAlles(); }).catch(function (err) { melding(err.message); s.value = b.status; });
  });

  $("zoek").addEventListener("input", lijst);
  $("vernieuw").addEventListener("click", function () { laad().then(function () { melding("Bijgewerkt"); }); });

  function toonTab(naam) {
    document.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tab === naam)); });
    ["bestellingen", "afpunten", "picklijst"].forEach(function (n) { $("tab-" + n).hidden = n !== naam; });
  }

  // ---------- Betalingen afpunten ----------
  // Zoekt reeksen van 12 cijfers (met of zonder +++ en /) met een geldig controlegetal.
  function vindMededelingen(tekst) {
    var gevonden = {};
    var re = /(\d{3})\s*[\/.\-]?\s*(\d{4})\s*[\/.\-]?\s*(\d{5})/g, m;
    while ((m = re.exec(tekst))) {
      var c = m[1] + m[2] + m[3];
      var basis = c.slice(0, 10), controle = Number(c.slice(10));
      var rest = Number(BigInt(basis) % 97n) || 97;
      if (rest === controle) gevonden[c] = tekst.slice(m.index + m[0].length, m.index + m[0].length + 80);
    }
    return gevonden;
  }

  function bedragNa(tekst) {
    var m = /(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+\.\d{2})/.exec(tekst || "");
    if (!m) return null;
    var s = m[1].replace(/[\s.](?=\d{3})/g, "").replace(",", ".");
    return Math.round(parseFloat(s) * 100);
  }

  $("zoekbetalingen").addEventListener("click", function () {
    var tekst = $("bankplak").value;
    var gevonden = vindMededelingen(tekst);
    var codes = Object.keys(gevonden);
    var uit = $("afpunt-resultaat");
    if (!codes.length) { uit.innerHTML = "<p>Geen gestructureerde mededelingen gevonden in de geplakte tekst.</p>"; return; }
    var rijen = codes.map(function (c) {
      var b = bestellingen.find(function (x) { return (x.ogm || "").replace(/\D/g, "") === c; });
      var bedrag = bedragNa(gevonden[c]);
      if (!b) return { c: c, b: null };
      return { c: c, b: b, bedrag: bedrag };
    });
    var teZetten = rijen.filter(function (r) { return r.b && r.b.status === "nieuw"; });
    uit.innerHTML =
      "<h3>" + codes.length + " mededeling(en) gevonden</h3>" +
      '<table><thead><tr><th></th><th>Mededeling</th><th>Bestelling</th><th>Klant</th><th class="r">Te betalen</th><th>Status</th></tr></thead><tbody>' +
      rijen.map(function (r) {
        var ogm = "+++" + r.c.slice(0, 3) + "/" + r.c.slice(3, 7) + "/" + r.c.slice(7) + "+++";
        if (!r.b) return '<tr><td></td><td class="mono">' + ogm + "</td><td colspan=4><em>Geen bestelling met deze mededeling</em></td></tr>";
        var kan = r.b.status === "nieuw";
        var afwijking = r.bedrag != null && r.bedrag !== r.b.totaal;
        return "<tr><td>" + (kan ? '<input type="checkbox" data-afpunt="' + r.b.id + '"' + (afwijking ? "" : " checked") + ' aria-label="Markeer ' + esc(r.b.nummer) + ' als betaald">' : "") + "</td>" +
          '<td class="mono">' + ogm + "</td><td>" + esc(r.b.nummer) + "</td><td>" + esc(r.b.naam) + "</td>" +
          '<td class="r">' + euro(r.b.totaal) + (afwijking ? '<br><span class="verschil">bank: ' + euro(r.bedrag) + "?</span>" : "") + "</td>" +
          '<td><span class="lbl lbl--' + r.b.status + '">' + STATUS[r.b.status] + "</span></td></tr>";
      }).join("") + "</tbody></table>" +
      (teZetten.length ? '<div class="bh-rij"><button type="button" class="bh-knop bh-knop--oranje" id="afpunt-ok">Aangevinkte bestellingen op betaald zetten</button></div><p class="hint">Controleer bij een afwijkend bedrag eerst de verrichting. Het bedrag wordt geschat uit de tekst rond de mededeling.</p>' : "<p>Alle gevonden bestellingen zijn al verwerkt.</p>");
    var ok = $("afpunt-ok");
    if (ok) ok.addEventListener("click", function () {
      var ids = [].slice.call(document.querySelectorAll("[data-afpunt]:checked")).map(function (x) { return Number(x.dataset.afpunt); });
      if (!ids.length) return;
      ok.disabled = true;
      ids.reduce(function (p, id) { return p.then(function () { return wijzig(id, { status: "betaald" }); }); }, Promise.resolve())
        .then(function () { melding(ids.length + " bestelling(en) op betaald gezet"); toonAlles(); $("zoekbetalingen").click(); })
        .catch(function (err) { melding(err.message); ok.disabled = false; });
    });
  });

  // ---------- Picklijst ----------
  function picklijst() {
    var ookOpen = $("pick-ook-open").checked;
    var sel = bestellingen.filter(function (b) {
      return b.status === "betaald" || b.status === "klaar" || (ookOpen && b.status === "nieuw");
    });
    var totaal = {};
    var groepen = {};
    sel.forEach(function (b) {
      var g = b.levering === "afhalen" ? "Afhalen: " + b.afhaalmoment : "Levering aan huis";
      (groepen[g] = groepen[g] || []).push(b);
      b.regels.forEach(function (r) { totaal[r.naam] = (totaal[r.naam] || 0) + r.aantal; });
    });
    var namen = Object.keys(totaal).sort();
    if (!sel.length) { $("picklijst").innerHTML = "<p><em>Geen bestellingen om klaar te zetten.</em></p>"; return; }
    $("picklijst").innerHTML =
      '<h3>Totaal per wijn</h3><div class="pick-totaal">' +
      namen.map(function (n) { return "<div><strong>" + totaal[n] + "</strong>" + esc(n) + "</div>"; }).join("") +
      "</div>" +
      Object.keys(groepen).sort().map(function (g) {
        var lijstB = groepen[g].slice().sort(function (a, b) { return a.naam.localeCompare(b.naam); });
        return '<div class="pick-groep"><h3>' + esc(g) + " <small>(" + lijstB.length + ")</small></h3>" +
          '<table><thead><tr><th>✓</th><th>Nr.</th><th>Klant</th><th>Wijnen</th>' + (g === "Levering aan huis" ? "<th>Adres</th>" : "") + "<th>Status</th></tr></thead><tbody>" +
          lijstB.map(function (b) {
            return "<tr><td>☐</td><td>" + esc(b.nummer) + "</td><td>" + esc(b.naam) + "<br><small>" + esc(b.telefoon) + "</small></td><td>" +
              b.regels.map(function (r) { return r.aantal + "× " + esc(r.naam); }).join("<br>") + "</td>" +
              (g === "Levering aan huis" ? "<td>" + esc(b.adres) + "<br>" + esc(b.postcode + " " + b.gemeente) + "</td>" : "") +
              '<td><span class="lbl lbl--' + b.status + '">' + STATUS[b.status] + "</span></td></tr>";
          }).join("") + "</tbody></table></div>";
      }).join("");
  }
  $("pick-ook-open").addEventListener("change", picklijst);
  $("druk-pick").addEventListener("click", function () { print(); });

  // ---------- Controle van de betaalgegevens ----------
  function controleIban() {
    fetch("/api/beheer/controle", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (c) {
      var vak = $("iban-status"), soort, titel, uitleg;
      if (c.pinKlopt === false) {
        soort = "fout"; titel = "Opgelet: het rekeningnummer klopt niet met de vingerafdruk";
        uitleg = "Bestellingen worden geweigerd en klanten zien geen betaalgegevens. Neem meteen contact op met ARTO.";
      } else if (!c.geldig) {
        soort = "fout"; titel = "Het rekeningnummer is ongeldig of nog niet ingevuld";
        uitleg = "Klanten krijgen nu " + c.iban + " te zien. Bezorg ARTO het juiste rekeningnummer.";
      } else if (!c.pinIngesteld) {
        soort = "let"; titel = "Rekeningnummer " + c.iban + " (" + c.begunstigde + ")";
        uitleg = "Geldig, maar de extra vingerafdruk (IBAN_SHA256) is nog niet ingesteld.";
      } else {
        soort = "goed"; titel = "Rekeningnummer " + c.iban + " (" + c.begunstigde + ") is beveiligd";
        uitleg = "Geldig en gecontroleerd tegen de vingerafdruk. Klanten zien alleen dit rekeningnummer.";
      }
      vak.className = "bh-iban bh-iban--" + soort;
      vak.innerHTML = "<strong>" + esc(titel) + "</strong><span>" + esc(uitleg) + "</span>";
      vak.hidden = false;
    }).catch(function () {});
  }

  // Uitloggen
  $("uitloggen").addEventListener("click", function () {
    fetch("/api/uitloggen", { method: "POST" }).finally(function () { location.replace("/inloggen/"); });
  });

  controleIban();
  laad();
})();
