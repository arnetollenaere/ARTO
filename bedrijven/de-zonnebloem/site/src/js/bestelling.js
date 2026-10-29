// Bevestigingspagina: toont bestelling, betaalgegevens en een EPC-QR-code (SEPA) voor de bank-app.
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var euro = function (c) { return "€ " + (c / 100).toFixed(2).replace(".", ","); };
  var q = new URLSearchParams(location.search);

  function nietGevonden() { $("laden").hidden = true; $("niet-gevonden").hidden = false; }

  // EPC069-12: de standaard QR-code voor SEPA-overschrijvingen.
  function epc(b) {
    return [
      "BCD", "002", "1", "SCT",
      (b.betaling.bic || "").replace(/\s/g, ""),
      b.betaling.begunstigde.slice(0, 70),
      b.betaling.iban.replace(/\s/g, ""),
      "EUR" + (b.totaal / 100).toFixed(2),
      "", "", b.ogm
    ].join("\n");
  }

  function toonQr(tekst) {
    if (!window.qrcode) return;
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    var qr = qrcode(0, "M");
    qr.addData(tekst, "Byte");
    qr.make();
    $("qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  var STATUS = {
    nieuw: ["Wacht op betaling", "Je bestelling is geregistreerd. Schrijf het bedrag over met de gestructureerde mededeling, dan zetten we je wijn klaar."],
    betaald: ["Betaald", "We hebben je betaling ontvangen. Bedankt! We zetten je wijn klaar."],
    klaar: ["Klaar", "Je wijn staat klaar."],
    afgeleverd: ["Afgeleverd", "Je wijn is afgehaald of geleverd. Santé, en bedankt voor je steun!"],
    geannuleerd: ["Geannuleerd", "Deze bestelling is geannuleerd. Neem contact op als dat niet klopt."]
  };

  fetch("/api/bestelling/" + encodeURIComponent(q.get("id") || "") + "?t=" + encodeURIComponent(q.get("t") || ""))
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (b) {
      var s = STATUS[b.status] || STATUS.nieuw;
      $("status").textContent = s[0];
      $("status").className = "status status--" + b.status;
      $("titel").textContent = b.status === "nieuw" ? "Dank je wel, " + b.naam.split(" ")[0] + "!" : "Bestelling " + b.nummer;
      $("intro").textContent = s[1];
      $("nummer").textContent = b.nummer;

      $("betaalkaart").hidden = b.status !== "nieuw";
      $("b-bedrag").textContent = euro(b.totaal);
      $("b-iban").textContent = b.betaling.iban;
      $("b-bic").textContent = b.betaling.bic;
      $("b-bic-rij").hidden = !b.betaling.bic;
      $("b-begunstigde").textContent = b.betaling.begunstigde;
      $("b-ogm").textContent = b.ogm;
      $("b-termijn").textContent = "Gelieve binnen " + b.betaling.termijnDagen + " dagen te betalen. Gebruik zeker de gestructureerde mededeling.";
      if (b.status === "nieuw") toonQr(epc(b));

      var tbody = $("regels");
      b.regels.forEach(function (r) {
        var tr = document.createElement("tr");
        var a = document.createElement("td"), c = document.createElement("td");
        a.textContent = r.aantal + " × " + r.naam;
        c.textContent = euro(r.aantal * r.prijs);
        tr.append(a, c);
        tbody.appendChild(tr);
      });
      if (b.levering === "levering") {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>Levering</td><td></td>";
        tr.lastChild.textContent = b.leveringskost ? euro(b.leveringskost) : "gratis";
        tbody.appendChild(tr);
      }
      $("totaal").textContent = euro(b.totaal);
      $("levering").textContent = b.levering === "afhalen"
        ? "Afhalen: " + b.afhaalmoment + ", " + b.afhaalplaats + "."
        : "Levering aan huis: " + b.adres + ", " + b.postcode + " " + b.gemeente + ".";

      $("laden").hidden = true;
      $("inhoud").hidden = false;
    })
    .catch(nietGevonden);

  document.addEventListener("click", function (e) {
    var k = e.target.closest("[data-kopieer]");
    if (k) {
      var tekst = $(k.dataset.kopieer).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(tekst) : Promise.reject()).then(function () {
        k.textContent = "Gekopieerd";
        setTimeout(function () { k.textContent = "Kopieer"; }, 1600);
      }).catch(function () {});
    }
    if (e.target.id === "afdrukken") print();
  });
})();
