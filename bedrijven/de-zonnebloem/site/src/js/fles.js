// Tekent wijnflessen en zonnebloemen als SVG, zodat er geen foto's nodig zijn.
// Komen er later echte productfoto's, dan kan winkel.js die gebruiken in plaats van Fles.svg().
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var teller = 0;

  var VORMEN = {
    bordeaux: "M50 18h20v112c0 22 28 24 28 56v190q0 14-13 14H35q-13 0-13-14V186c0-32 28-34 28-56z",
    bourgogne: "M51 18h18v96c0 58 31 62 31 118v144q0 14-13 14H33q-13 0-13-14V232c0-56 31-60 31-118z",
    mousserend: "M48 18h24v90c0 58 30 62 30 118v150q0 16-15 16H33q-15 0-15-16V226c0-56 30-60 30-118z"
  };

  function donker(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Woorden over maximaal twee regels verdelen voor het etiket.
  function regels(naam) {
    var w = naam.split(" ");
    if (w.length === 1) return [naam];
    var helft = Math.ceil(w.length / 2);
    return [w.slice(0, helft).join(" "), w.slice(helft).join(" ")];
  }

  function svg(wijn) {
    var id = "f" + (++teller);
    var vorm = VORMEN[wijn.fles] || VORMEN.bordeaux;
    var licht = !donker(wijn.glas);
    var labelDonker = donker(wijn.label);
    var inkt = labelDonker ? "#f7efe0" : "#3a1424";
    var accent = labelDonker ? "#f4b740" : "#7a1630";
    var kapsule = wijn.fles === "mousserend" ? "url(#" + id + "k)" : (wijn.soort === "rood" ? "#5a0f24" : "#2a1a12");
    var kapsuleHoogte = wijn.fles === "mousserend" ? 118 : 78;
    var tekst = regels(wijn.naam);
    var jaar = wijn.jaar ? String(wijn.jaar) : "Brut";
    var vloeistof = licht
      ? '<path d="M24 230h74v146q0 12-12 12H36q-12 0-12-12z" fill="' + wijn.glas + '" opacity=".55"/>'
      : "";

    return '<svg xmlns="' + NS + '" viewBox="0 0 120 400" class="fles" role="img" aria-label="Fles ' + esc(wijn.naam) + '">' +
      "<defs>" +
        '<linearGradient id="' + id + 'g" x1="0" x2="1">' +
          '<stop offset="0" stop-color="' + wijn.glas + '" stop-opacity="' + (licht ? ".55" : "1") + '"/>' +
          '<stop offset=".45" stop-color="' + wijn.glas + '" stop-opacity="' + (licht ? ".3" : ".85") + '"/>' +
          '<stop offset="1" stop-color="#000" stop-opacity="' + (licht ? ".25" : ".9") + '"/>' +
        "</linearGradient>" +
        '<linearGradient id="' + id + 'k" x1="0" x2="1"><stop offset="0" stop-color="#b8841c"/><stop offset=".4" stop-color="#f6d27a"/><stop offset="1" stop-color="#8a5f10"/></linearGradient>' +
        '<clipPath id="' + id + 'c"><path d="' + vorm + '"/></clipPath>' +
      "</defs>" +
      '<ellipse cx="60" cy="394" rx="44" ry="5" fill="#000" opacity=".25"/>' +
      '<g clip-path="url(#' + id + 'c)">' +
        '<rect width="120" height="400" fill="url(#' + id + 'g)"/>' +
        vloeistof +
        '<rect x="0" y="0" width="120" height="' + kapsuleHoogte + '" fill="' + kapsule + '"/>' +
        '<rect x="0" y="' + (kapsuleHoogte - 4) + '" width="120" height="4" fill="#000" opacity=".25"/>' +
        '<rect x="30" y="236" width="60" height="104" rx="3" fill="' + wijn.label + '"/>' +
        '<rect x="33" y="239" width="54" height="98" rx="2" fill="none" stroke="' + accent + '" stroke-width=".6" opacity=".7"/>' +
        '<g transform="translate(60 258) scale(.11)">' + zonVorm(accent, inkt) + "</g>" +
        '<text x="60" y="' + (tekst.length > 1 ? 286 : 292) + '" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="9.5" font-weight="600" fill="' + inkt + '">' +
          tekst.map(function (t, i) { return '<tspan x="60" dy="' + (i ? 11 : 0) + '">' + esc(t) + "</tspan>"; }).join("") +
        "</text>" +
        '<text x="60" y="318" text-anchor="middle" font-family="Inter, sans-serif" font-size="' + Math.min(4.6, 50 / (wijn.streek.length * 0.86)).toFixed(2) + '" letter-spacing=".9" fill="' + inkt + '" opacity=".75">' + esc(wijn.streek.toUpperCase()) + "</text>" +
        '<text x="60" y="330" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="7" font-style="italic" fill="' + accent + '">' + jaar + "</text>" +
        '<rect x="34" y="80" width="7" height="300" rx="3.5" fill="#fff" opacity=".16"/>' +
        '<rect x="44" y="96" width="2.5" height="270" rx="1.2" fill="#fff" opacity=".1"/>' +
      "</g>" +
    "</svg>";
  }

  // Een kleine zonnebloem voor op het etiket.
  function zonVorm(blad, hart) {
    var s = "";
    for (var i = 0; i < 12; i++) {
      s += '<path d="M0-30C13-58 9-86 0-98-9-86-13-58 0-30Z" fill="' + blad + '" transform="rotate(' + i * 30 + ')"/>';
    }
    return s + '<circle r="34" fill="' + hart + '" opacity=".85"/>';
  }

  // Grote zonnebloem met zaadjes in een gulden-hoek-spiraal.
  function zon(el, opties) {
    if (!el) return;
    opties = opties || {};
    var bladen = opties.bladen || 28;
    var zaden = opties.zaden || 420;
    var p = "z" + (++teller);
    var s = '<defs><radialGradient id="' + p + 'h"><stop offset="0" stop-color="#2a1208"/><stop offset=".7" stop-color="#4a2512"/><stop offset="1" stop-color="#6b3a16"/></radialGradient>' +
      '<linearGradient id="' + p + 'b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c97c0e"/><stop offset=".6" stop-color="#f4b740"/><stop offset="1" stop-color="#ffd977"/></linearGradient></defs>';
    var laag = function (straal, lengte, breedte, verschuiving, kleur, ondoorzichtig) {
      var g = '<g fill="' + kleur + '" opacity="' + ondoorzichtig + '">';
      for (var i = 0; i < bladen; i++) {
        var hoek = (360 / bladen) * i + verschuiving;
        g += '<path d="M0 ' + -straal + "C" + breedte + " " + -(straal + lengte * 0.45) + " " + breedte * 0.6 + " " + -(straal + lengte * 0.9) +
          " 0 " + -(straal + lengte) + "C" + -breedte * 0.6 + " " + -(straal + lengte * 0.9) + " " + -breedte + " " + -(straal + lengte * 0.45) +
          " 0 " + -straal + 'Z" transform="rotate(' + hoek.toFixed(2) + ')"/>';
      }
      return g + "</g>";
    };
    s += laag(60, 120, 22, 360 / bladen / 2, "#b86f0c", ".9");
    s += laag(64, 128, 20, 0, "url(#" + p + "b)", "1");
    s += '<circle r="74" fill="url(#' + p + 'h)"/>';
    var ga = Math.PI * (3 - Math.sqrt(5));
    s += '<g fill="#d99a3c">';
    for (var i = 1; i < zaden; i++) {
      var r = 3.5 * Math.sqrt(i);
      if (r > 72) break;
      var a = i * ga;
      s += '<circle cx="' + (r * Math.cos(a)).toFixed(1) + '" cy="' + (r * Math.sin(a)).toFixed(1) + '" r="' + (0.9 + r / 70).toFixed(2) + '" opacity="' + (0.35 + r / 110).toFixed(2) + '"/>';
    }
    el.innerHTML = s + "</g>";
  }

  window.Fles = { svg: svg, zon: zon };
})();
