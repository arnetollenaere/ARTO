// Geanimeerd verhaal in het openingsbeeld, getekend met duizenden lichtdeeltjes.
// De deeltjes vormen na elkaar: een glas wijn, een muntstuk, een zonnebloem en twee vrienden.
// Ze hebben diepte (lichte 3D-draaiing), wijken uit voor muis of vinger en zweven tussen de beelden.
(function () {
  "use strict";
  var fig = document.getElementById("verhaal-anim");
  var cv = document.getElementById("vc");
  if (!fig || !cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var tekst = fig.querySelector(".verhaal__tekst");
  var balken = [].slice.call(fig.querySelectorAll(".verhaal__balk i"));
  var knop = document.getElementById("verhaal-pauze");

  var W = 600, H = 720;                       // logische tekenruimte
  var DUUR = [3400, 3200, 3400, 4400];        // duur per stap in ms
  var OVERGANG = 1050;                        // duur van een vormwissel in ms
  var rustig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var klein = Math.min(innerWidth, screen.width || innerWidth) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  var N = klein ? 4200 : 9000;

  // ---------- Vormen tekenen en bemonsteren ----------
  function hart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * .3);
    c.bezierCurveTo(x, y - s * .25, x - s * .95, y - s * .35, x - s * .95, y + s * .2);
    c.bezierCurveTo(x - s * .95, y + s * .65, x - s * .2, y + s * .9, x, y + s * 1.15);
    c.bezierCurveTo(x + s * .2, y + s * .9, x + s * .95, y + s * .65, x + s * .95, y + s * .2);
    c.bezierCurveTo(x + s * .95, y - s * .35, x, y - s * .25, x, y + s * .3);
    c.fill();
  }

  var VORMEN = [
    function glas(c) {
      c.translate(300, 105); c.scale(1.45, 1.45); c.translate(-190, -280);
      var kelk = new Path2D("M120,280 C116,390 140,476 190,488 C240,476 264,390 260,280 Z");
      c.save(); c.clip(kelk);
      var g = c.createLinearGradient(0, 300, 0, 490);
      g.addColorStop(0, "#ff5a6a"); g.addColorStop(1, "#d42343");
      c.fillStyle = g;
      c.beginPath(); c.moveTo(100, 318);
      for (var x = 100; x <= 280; x += 10) c.lineTo(x, 318 + Math.sin(x / 14) * 4);
      c.lineTo(280, 500); c.lineTo(100, 500); c.fill();
      c.restore();
      c.strokeStyle = "#ffffff"; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 5;
      c.stroke(new Path2D("M120,280 C116,390 140,476 190,488 C240,476 264,390 260,280"));
      c.beginPath(); c.ellipse(190, 280, 70, 9, 0, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.moveTo(190, 488); c.lineTo(190, 630); c.stroke();
      c.beginPath(); c.ellipse(190, 634, 52, 7, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "#fff4e0"; c.lineWidth = 3;
      c.stroke(new Path2D("M138,300 C135,360 146,420 166,458"));
    },
    function munt(c) {
      c.strokeStyle = "#ff8a3d"; c.lineWidth = 20; c.beginPath(); c.arc(300, 380, 160, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "#ffc24a"; c.lineWidth = 5; c.beginPath(); c.arc(300, 380, 128, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#fff8ea"; c.font = '800 230px "Libre Franklin", Arial, sans-serif';
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("€", 296, 392);
    },
    function bloem(c) {
      c.strokeStyle = "#a6c054"; c.lineWidth = 14; c.lineCap = "round";
      c.beginPath(); c.moveTo(300, 655); c.bezierCurveTo(288, 570, 316, 470, 300, 380); c.stroke();
      c.fillStyle = "#9cbb4c";
      c.fill(new Path2D("M302,560 C340,515 390,515 422,528 C390,560 345,572 302,560Z"));
      c.fill(new Path2D("M298,480 C262,438 214,438 182,450 C214,482 258,492 298,480Z"));
      var i, a;
      for (i = 0; i < 20; i++) {
        a = (i / 20) * Math.PI * 2 + Math.PI / 20;
        c.save(); c.translate(300, 290); c.rotate(a); c.fillStyle = "#ff8a1f";
        c.beginPath(); c.moveTo(0, -40); c.bezierCurveTo(18, -70, 16, -118, 0, -150); c.bezierCurveTo(-16, -118, -18, -70, 0, -40); c.fill(); c.restore();
      }
      for (i = 0; i < 20; i++) {
        a = (i / 20) * Math.PI * 2;
        c.save(); c.translate(300, 290); c.rotate(a);
        var g = c.createLinearGradient(0, 0, 0, -140); g.addColorStop(0, "#ffc12e"); g.addColorStop(1, "#ffe58a");
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, -46); c.bezierCurveTo(17, -72, 15, -112, 0, -140); c.bezierCurveTo(-15, -112, -17, -72, 0, -46); c.fill(); c.restore();
      }
      c.fillStyle = "#7a4219"; c.beginPath(); c.arc(300, 290, 64, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#f0b955";
      var ga = Math.PI * (3 - Math.sqrt(5));
      for (i = 1; i < 260; i++) {
        var r = 3.9 * Math.sqrt(i); if (r > 60) break;
        c.beginPath(); c.arc(300 + r * Math.cos(i * ga), 290 + r * Math.sin(i * ga), 2.1, 0, Math.PI * 2); c.fill();
      }
    },
    function vrienden(c) {
      c.translate(300, 505); c.scale(1.32, 1.32); c.translate(-252, -528);
      c.strokeStyle = "#fbf3e2"; c.fillStyle = "#fbf3e2"; c.lineWidth = 8; c.lineCap = "round"; c.lineJoin = "round";
      function lijn(d) { c.stroke(new Path2D(d)); }
      function cirkel(x, y, r, vol) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (vol) c.fill(); else c.stroke(); }
      cirkel(190, 598, 38); cirkel(190, 598, 6, true); cirkel(252, 628, 9);
      lijn("M146,500 L158,505 L170,560 L240,560 L252,619");
      cirkel(198, 464, 17, true);
      lijn("M196,486 C192,510 188,535 186,558 L236,556 L240,606 L256,608");
      lijn("M194,502 C210,494 222,480 232,452");
      cirkel(320, 426, 17, true);
      lijn("M320,447 L320,545 L306,636 M320,545 L334,636");
      lijn("M320,470 C300,478 276,488 256,500");
      lijn("M320,470 C338,456 348,438 354,408");
      c.fillStyle = "#ff4619"; hart(c, 262, 330, 34);
      c.fillStyle = "#ff8a5c"; hart(c, 208, 372, 14); hart(c, 314, 360, 11);
    }
  ];

  function bemonster(tekenFn) {
    var s = .5, oc = document.createElement("canvas");
    oc.width = W * s; oc.height = H * s;
    var c = oc.getContext("2d");
    c.scale(s, s); tekenFn(c);
    var d = c.getImageData(0, 0, oc.width, oc.height).data, pts = [], stap = klein ? 3 : 2;
    for (var y = 0; y < oc.height; y += stap) {
      for (var x = 0; x < oc.width; x += stap) {
        var i = (y * oc.width + x) * 4;
        if (d[i + 3] > 150) pts.push([(x + Math.random() * stap) / s, (y + Math.random() * stap) / s, d[i], d[i + 1], d[i + 2]]);
      }
    }
    for (var k = pts.length - 1; k > 0; k--) { var j = (Math.random() * (k + 1)) | 0, t = pts[k]; pts[k] = pts[j]; pts[j] = t; }
    var uit = new Float32Array(N * 5);
    for (var n = 0; n < N; n++) {
      var p = pts[n % pts.length], extra = n >= pts.length ? 1.6 : 0;
      uit[n * 5] = p[0] + (Math.random() - .5) * extra;
      uit[n * 5 + 1] = p[1] + (Math.random() - .5) * extra;
      uit[n * 5 + 2] = p[2]; uit[n * 5 + 3] = p[3]; uit[n * 5 + 4] = p[4];
    }
    return uit;
  }

  // ---------- Deeltjes ----------
  var px = new Float32Array(N), py = new Float32Array(N);        // huidige basispositie
  var fx = new Float32Array(N), fy = new Float32Array(N);        // vertrekpunt van de overgang
  var cr = new Float32Array(N), cg = new Float32Array(N), cb = new Float32Array(N);
  var fr = new Float32Array(N), fg = new Float32Array(N), fb = new Float32Array(N);
  var ox = new Float32Array(N), oy = new Float32Array(N);        // uitwijking door muis
  var z = new Float32Array(N), fase = new Float32Array(N), maat = new Float32Array(N);
  var zwier = new Float32Array(N), wacht = new Float32Array(N);
  var doelen = [], vorm = -1, wisselStart = 0;

  for (var i = 0; i < N; i++) {
    var hoek = Math.random() * Math.PI * 2, straal = 80 + Math.random() * 320;
    px[i] = 300 + Math.cos(hoek) * straal; py[i] = 360 + Math.sin(hoek) * straal * .9;
    fx[i] = px[i]; fy[i] = py[i];
    cr[i] = fr[i] = 255; cg[i] = fg[i] = 255; cb[i] = fb[i] = 255;
    z[i] = Math.random() * 2 - 1; fase[i] = Math.random() * 6.283;
    maat[i] = 1 + Math.random() * 1.1;
    zwier[i] = (Math.random() < .5 ? -1 : 1) * (30 + Math.random() * 150);
  }

  var stof = [];
  for (var s2 = 0; s2 < (klein ? 40 : 80); s2++) stof.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), v: 6 + Math.random() * 14, f: Math.random() * 6.283 });

  function naarVorm(v, nu) {
    var d = doelen[v];
    for (var i = 0; i < N; i++) {
      fx[i] = px[i]; fy[i] = py[i]; fr[i] = cr[i]; fg[i] = cg[i]; fb[i] = cb[i];
      wacht[i] = (d[i * 5] / W) * 260 + Math.random() * 160;       // golf van links naar rechts
    }
    vorm = v; wisselStart = nu;
  }

  // ---------- Muis en vinger ----------
  var mx = -9999, my = -9999, kx = 0, ky = 0, kantel = 0, kantelY = 0;
  function wijzer(e) {
    var r = cv.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width * W; my = (e.clientY - r.top) / r.height * H;
    kx = (e.clientX - r.left) / r.width * 2 - 1; ky = (e.clientY - r.top) / r.height * 2 - 1;
  }
  cv.addEventListener("pointermove", wijzer);
  cv.addEventListener("pointerdown", wijzer);
  cv.addEventListener("pointerleave", function () { mx = my = -9999; kx = ky = 0; });

  // ---------- Sfeerlaag over het hele openingsbeeld ----------
  // Gloed en goudstof achter tekst én animatie; de kleur volgt de huidige stap.
  var held = fig.closest(".held") || fig;
  var sv = document.getElementById("held-sfeer");
  var sctx = sv && sv.getContext ? sv.getContext("2d") : null;
  var KLEUREN = [[200, 40, 70], [255, 120, 50], [255, 196, 60], [255, 255, 255]];
  var kleurNu = [123, 30, 44], hx = 0, hy = 0, sdpr = 1;
  var hstof = [];
  for (var h = 0; h < (klein ? 60 : 150); h++) hstof.push({ x: Math.random(), y: Math.random(), z: Math.random(), v: .006 + Math.random() * .018, f: Math.random() * 6.283 });
  held.addEventListener("pointermove", function (e) {
    var r = held.getBoundingClientRect();
    hx = (e.clientX - r.left) / r.width * 2 - 1; hy = (e.clientY - r.top) / r.height * 2 - 1;
  });
  function maatSfeer() {
    if (!sv) return;
    var r = held.getBoundingClientRect();
    sdpr = .5;
    sv.width = Math.max(1, Math.round(r.width * sdpr)); sv.height = Math.max(1, Math.round(r.height * sdpr));
  }
  if (sv) { if ("ResizeObserver" in window) new ResizeObserver(maatSfeer).observe(held); else addEventListener("resize", maatSfeer); }

  function tekenSfeer(t) {
    if (!sctx) return;
    var doel = KLEUREN[Math.max(0, vorm)];
    for (var k = 0; k < 3; k++) kleurNu[k] += (doel[k] - kleurNu[k]) * .025;
    var r0 = kleurNu[0] | 0, g0 = kleurNu[1] | 0, b0 = kleurNu[2] | 0;
    var w = sv.width, hh = sv.height;
    sctx.clearRect(0, 0, w, hh);
    // Goudstof dat over het hele beeld drijft en met de muis meebeweegt.
    sctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < hstof.length; i++) {
      var q = hstof[i];
      q.y -= q.v * .016 * (rustig ? 0 : 1); if (q.y < -.03) { q.y = 1.03; q.x = Math.random(); }
      var a = .06 + .16 * (.5 + .5 * Math.sin(t * 1.3 + q.f));
      var mr = (255 + r0) >> 1, mg = (255 + g0) >> 1, mb = (255 + b0) >> 1;
      sctx.fillStyle = "rgba(" + mr + "," + mg + "," + mb + "," + a.toFixed(2) + ")";
      sctx.beginPath();
      sctx.arc((q.x * w) + Math.sin(t * .4 + q.f) * 14 * sdpr + hx * 26 * q.z * sdpr, (q.y * hh) + hy * 14 * q.z * sdpr, (1 + q.z * 3.2) * sdpr, 0, 6.283);
      sctx.fill();
    }
    sctx.globalCompositeOperation = "source-over";
  }

  // ---------- Tekenen ----------
  var schaal = 1, dpr = 1;
  function maatCanvas() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    schaal = cv.width / W;
  }
  if ("ResizeObserver" in window) new ResizeObserver(maatCanvas).observe(cv); else addEventListener("resize", maatCanvas);

  var kleurCache = {};
  function kleur(r, g, b, a) {
    var k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    var key = k + "_" + a;
    return kleurCache[key] || (kleurCache[key] = "rgba(" + (r >> 3 << 3) + "," + (g >> 3 << 3) + "," + (b >> 3 << 3) + "," + a + ")");
  }
  function zacht(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame(nu) {
    var t = nu / 1000;
    kantel += ((Math.sin(t * .35) * .2 + kx * .35) - kantel) * .05;
    kantelY += ((ky * .2) - kantelY) * .05;
    var cosA = Math.cos(kantel), sinA = Math.sin(kantel), cosB = Math.cos(kantelY), sinB = Math.sin(kantelY);
    var d = doelen[vorm];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(schaal, 0, 0, schaal, 0, 0);

    tekenSfeer(t);

    ctx.globalCompositeOperation = "source-over";
    var straal2 = 75 * 75;
    for (var i = 0; i < N; i++) {
      var o = i * 5, tx = d[o], ty = d[o + 1];
      var e = (nu - wisselStart - wacht[i]) / OVERGANG;
      e = e <= 0 ? 0 : e >= 1 ? 1 : zacht(e);
      var bx, by, piek = Math.sin(e * Math.PI);
      if (e < 1) {
        // Vlucht in een boog: loodrecht op de reisrichting uitwijken.
        var dx = tx - fx[i], dy = ty - fy[i], len = Math.sqrt(dx * dx + dy * dy) || 1;
        bx = fx[i] + dx * e - dy / len * zwier[i] * piek;
        by = fy[i] + dy * e + dx / len * zwier[i] * piek;
        cr[i] = fr[i] + (d[o + 2] - fr[i]) * e; cg[i] = fg[i] + (d[o + 3] - fg[i]) * e; cb[i] = fb[i] + (d[o + 4] - fb[i]) * e;
      } else {
        bx = tx; by = ty; cr[i] = d[o + 2]; cg[i] = d[o + 3]; cb[i] = d[o + 4];
      }
      // Rusteloos glinsteren, en golvende wijn in het glas.
      bx += Math.sin(t * .9 + fase[i]) * .45;
      by += Math.cos(t * 1.1 + fase[i] * 1.3) * .45;
      if (vorm === 0 && cr[i] > 150 && cg[i] < 130) by += Math.sin(bx * .045 + t * 2.4) * 3.2 * Math.max(0, 1 - (by - 150) / 380);
      px[i] = bx; py[i] = by;

      // Uitwijken voor muis of vinger, met terugvering.
      var mdx = bx + ox[i] - mx, mdy = by + oy[i] - my, m2 = mdx * mdx + mdy * mdy;
      if (m2 < straal2) { var m = Math.sqrt(m2) || 1, kracht = (1 - m / 75) * 5.5; ox[i] += mdx / m * kracht; oy[i] += mdy / m * kracht; }
      ox[i] *= .9; oy[i] *= .9;

      // Lichte 3D-draaiing rond het midden; diepte bepaalt grootte en helderheid.
      var zz = z[i] * 10 + piek * (zwier[i] > 0 ? 90 : -90);
      var lx = bx + ox[i] - 300, ly = by + oy[i] - 360;
      var x3 = lx * cosA + zz * sinA, z3 = -lx * sinA + zz * cosA;
      var y3 = ly * cosB - z3 * sinB; z3 = ly * sinB + z3 * cosB;
      var p = 520 / (520 - z3);
      var sx = 300 + x3 * p, sy = 360 + y3 * p, r = maat[i] * p * (1 + piek * .8);
      ctx.fillStyle = kleur(cr[i] | 0, cg[i] | 0, cb[i] | 0, (.72 + .28 * Math.min(1, p)).toFixed(2));
      ctx.fillRect(sx - r / 2, sy - r / 2, r, r);
    }

    // Gloed: een deel van de deeltjes krijgt een zachte lichtkrans.
    ctx.globalCompositeOperation = "lighter";
    for (var g = 0; g < N; g += 10) {
      ctx.fillStyle = kleur(cr[g] | 0, cg[g] | 0, cb[g] | 0, ".06");
      ctx.beginPath(); ctx.arc(px[g] + ox[g], py[g] + oy[g], 6, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    if (actief) requestAnimationFrame(frame);
  }

  // ---------- Verhaal, zinnen en voortgang ----------
  var stap = 0, timer = null, gepauzeerd = false, zichtbaar = true, actief = false, resterend = 0, gestart = 0;

  function zetStap(n) {
    stap = n;
    tekst.setAttribute("data-stap", n);
    balken.forEach(function (b, i) { b.classList.toggle("klaar", i < n - 1); b.classList.remove("bezig"); });
    var b = balken[n - 1];
    if (b) {
      b.style.setProperty("--duur", DUUR[n - 1] + "ms");
      void b.offsetWidth;
      b.classList.add("bezig");
    }
    naarVorm(n - 1, performance.now());
    var kl = KLEUREN[n - 1];
    held.style.setProperty("--sfeer", "rgb(" + kl[0] + "," + kl[1] + "," + kl[2] + ")");
  }
  function volgende() { zetStap(stap % 4 + 1); plan(DUUR[stap - 1]); }
  function plan(ms) {
    clearTimeout(timer); resterend = ms; gestart = Date.now();
    if (!gepauzeerd && zichtbaar) timer = setTimeout(volgende, ms);
  }
  function start() { if (!actief) { actief = true; requestAnimationFrame(frame); } }
  function stop() { actief = false; }
  function pauzeer() {
    clearTimeout(timer); resterend = Math.max(0, resterend - (Date.now() - gestart));
    fig.classList.add("gepauzeerd"); stop();
  }
  function hervat() {
    if (gepauzeerd || !zichtbaar || stap === 0) return;
    fig.classList.remove("gepauzeerd"); gestart = Date.now();
    timer = setTimeout(volgende, resterend); start();
  }

  knop.addEventListener("click", function () {
    gepauzeerd = !gepauzeerd;
    knop.setAttribute("aria-pressed", String(gepauzeerd));
    knop.setAttribute("aria-label", gepauzeerd ? "Animatie afspelen" : "Animatie pauzeren");
    if (gepauzeerd) pauzeer(); else hervat();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (items) {
      var was = zichtbaar; zichtbaar = items[0].isIntersecting;
      if (zichtbaar && !was) hervat(); else if (!zichtbaar && was && !gepauzeerd) pauzeer();
    }).observe(fig);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (!gepauzeerd) pauzeer(); zichtbaar = false; }
    else { zichtbaar = true; hervat(); }
  });

  // ---------- Start ----------
  var lettertypes = document.fonts && document.fonts.load ? document.fonts.load('700 40px "Libre Franklin"').catch(function () {}) : Promise.resolve();
  lettertypes.then(function () {
    maatCanvas(); maatSfeer();
    for (var v = 0; v < VORMEN.length; v++) doelen.push(bemonster(VORMEN[v]));
    if (rustig) {
      // Geen beweging: eindbeeld tonen en alle zinnen naast elkaar.
      fig.classList.add("rustig");
      vorm = 3; wisselStart = -1e9;
      for (var i = 0; i < N; i++) { px[i] = doelen[3][i * 5]; py[i] = doelen[3][i * 5 + 1]; }
      actief = false; frame(0);
      if ("ResizeObserver" in window) new ResizeObserver(function () { frame(0); }).observe(cv);
      return;
    }
    vorm = 0; wisselStart = performance.now() + 1e9;   // eerst als zwevende wolk tonen
    start();
    setTimeout(function () { zetStap(1); plan(DUUR[0]); }, 300);
  });
})();
