/* Splittijd — kleine interacties: tellers, volgende les, weekrooster, formulierbevestiging. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rustig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const min = (t) => { const m = /(\d{1,2})[:.hu](\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
  const nu = new Date();
  const vandaag = DAGEN[nu.getDay()];
  const nuMin = nu.getHours() * 60 + nu.getMinutes();

  // Menu: sluit de popover na een klik op een link.
  const menu = $('#menu');
  if (menu && menu.hidePopover) $$('a', menu).forEach((a) => a.addEventListener('click', () => { try { menu.hidePopover(); } catch (e) {} }));

  // Bevestiging na verzenden.
  if (/[?&]verzonden=1/.test(location.search)) {
    const b = $('[data-bevestiging]');
    if (b) { b.hidden = false; b.scrollIntoView({ block: 'center', behavior: 'instant' }); }
  }

  // Tellers die optellen wanneer ze in beeld komen.
  const tellers = $$('[data-tel]');
  if (tellers.length && 'IntersectionObserver' in window && !rustig) {
    const io = new IntersectionObserver((items) => items.forEach((it) => {
      if (!it.isIntersecting) return;
      io.unobserve(it.target);
      const el = it.target, doel = parseFloat(el.dataset.tel) || 0, t0 = performance.now(), duur = 1400;
      const stap = (t) => {
        const p = Math.min(1, (t - t0) / duur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(doel * e).toLocaleString('nl-BE');
        if (p < 1) requestAnimationFrame(stap);
      };
      el.textContent = '0';
      requestAnimationFrame(stap);
    }), { threshold: 0.6 });
    tellers.forEach((t) => io.observe(t));
  }

  // Startpagina: volgende les en de lessen van vandaag.
  const data = $('#rooster-data');
  if (data) {
    let r; try { r = JSON.parse(data.textContent); } catch (e) { r = null; }
    if (r && r.lessen && r.lessen.length) {
      const kort = Object.fromEntries((r.dagen || []).map((d) => [d.naam, d.kort]));
      const sorteer = (a, b) => min(a.start) - min(b.start);
      let volgende = null;
      for (let i = 0; i < 7 && !volgende; i++) {
        const dag = DAGEN[(nu.getDay() + i) % 7];
        volgende = r.lessen.filter((l) => l.dag === dag && (i > 0 || min(l.start) > nuMin)).sort(sorteer)[0];
      }
      const nuEl = $('[data-volgende]');
      if (volgende && nuEl) {
        nuEl.innerHTML = '<span class="puls" aria-hidden="true"></span>';
        nuEl.append(`${kort[volgende.dag] || volgende.dag} `);
        const b = document.createElement('b'); b.textContent = volgende.start; nuEl.append(b, ` · ${volgende.type} · ${volgende.coach}`);
        nuEl.hidden = false;
      }
      // Vandaag, of de eerstvolgende dag met lessen.
      let dag = vandaag, lijst = [];
      for (let i = 0; i < 7 && !lijst.length; i++) { dag = DAGEN[(nu.getDay() + i) % 7]; lijst = r.lessen.filter((l) => l.dag === dag).sort(sorteer); if (i === 0 && !lijst.some((l) => min(l.einde) > nuMin)) lijst = []; }
      const blok = $('[data-vandaag]'), ol = $('[data-vandaag-lessen]');
      if (blok && ol && lijst.length) {
        $('[data-vandaag-dag]').textContent = dag;
        lijst.forEach((l) => {
          const li = document.createElement('li');
          if (dag === vandaag && min(l.einde) < nuMin) li.className = 'is-voorbij';
          const t = document.createElement('time'); t.textContent = l.start;
          const s = document.createElement('strong'); s.textContent = l.type;
          const m = document.createElement('span'); m.textContent = `${l.coach} · ${l.zaal}`;
          li.append(t, s, m); ol.append(li);
        });
        blok.hidden = false;
      }
    }
  }

  // Weekrooster.
  const rooster = $('[data-rooster]');
  if (!rooster) return;
  const grid = $('[data-grid]', rooster);
  const van = parseInt(rooster.dataset.van, 10) || 6;
  const tot = Math.max(van + 1, parseInt(rooster.dataset.tot, 10) || 22);
  grid.style.setProperty('--uren', tot - van);
  const as = $('[data-as]', grid);
  for (let u = van; u <= tot; u++) {
    const s = document.createElement('span');
    s.className = 'as__uur'; s.textContent = String(u).padStart(2, '0') + ':00';
    s.style.top = `calc(var(--kopje) + ${u - van} * var(--uur))`;
    as.append(s);
  }
  const dagen = $$('.dag', grid);
  dagen.forEach((d) => {
    const lessen = $$('.les', d).map((el) => ({ el, a: min(el.dataset.start), b: min(el.dataset.einde) }))
      .filter((l) => !isNaN(l.a)).sort((x, y) => x.a - y.a);
    lessen.forEach((l) => { if (isNaN(l.b) || l.b <= l.a) l.b = l.a + 60; });
    // Lessen die overlappen krijgen elk een eigen baan.
    let groep = [], einde = -1;
    const sluit = () => { const n = Math.max(1, ...groep.map((l) => l.baan + 1)); groep.forEach((l) => { l.el.style.setProperty("--banen", n); l.el.classList.toggle("is-smal", n > 1); }); groep = []; };
    lessen.forEach((l) => {
      if (l.a >= einde && groep.length) sluit();
      const banen = [];
      groep.forEach((g) => { if (g.b > l.a) banen[g.baan] = true; });
      l.baan = banen.findIndex((x) => !x); if (l.baan < 0) l.baan = banen.length;
      groep.push(l); einde = Math.max(einde, l.b);
      l.el.style.setProperty('--t', ((l.a - van * 60) / 60).toFixed(3));
      l.el.style.setProperty('--d', ((l.b - l.a) / 60).toFixed(3));
      l.el.style.setProperty('--baan', l.baan);
    });
    if (groep.length) sluit();
    if (d.dataset.dag === vandaag) {
      d.classList.add('is-vandaag');
      if (nuMin >= van * 60 && nuMin <= tot * 60) {
        const lijn = document.createElement('div');
        lijn.className = 'nu-lijn'; lijn.setAttribute('aria-hidden', 'true');
        lijn.style.top = `calc(${((nuMin - van * 60) / 60).toFixed(3)} * var(--uur))`;
        $('.dag__lessen', d).append(lijn);
      }
    }
  });
  grid.classList.add('is-tijd');

  // Dagkeuze (mobiel).
  const keuze = $('[data-dagkeuze]', rooster);
  const leeg = $('[data-leeg]', rooster);
  let actief = dagen.find((d) => d.dataset.dag === vandaag) ? vandaag : (dagen[0] && dagen[0].dataset.dag);
  const knoppen = $$('.dagkeuze__knop', keuze);
  keuze.style.setProperty('--n', knoppen.length);
  const toonDag = (naam) => {
    actief = naam;
    knoppen.forEach((k) => { const ja = k.dataset.dag === naam; k.setAttribute('aria-selected', ja); k.tabIndex = ja ? 0 : -1; });
    dagen.forEach((d) => d.classList.toggle('is-actief', d.dataset.dag === naam));
    werkLeegBij();
  };
  knoppen.forEach((k, i) => {
    if (k.dataset.dag === vandaag) k.classList.add('is-vandaag');
    k.addEventListener('click', () => toonDag(k.dataset.dag));
    k.addEventListener('keydown', (e) => {
      const r = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!r) return;
      const n = knoppen[(i + r + knoppen.length) % knoppen.length]; n.focus(); toonDag(n.dataset.dag);
    });
  });
  keuze.hidden = false;
  rooster.classList.add('met-dagen');

  // Filter per lestype.
  const filters = $$('[data-filter]', rooster);
  const status = $('[data-filter-status]', rooster);
  const teller = $('[data-teller]');
  const eenheid = teller && teller.nextElementSibling ? teller.nextElementSibling.textContent : '';
  let type = '';
  function werkLeegBij() {
    const d = dagen.find((x) => x.dataset.dag === actief);
    const zichtbaar = d ? $$('.les', d).filter((l) => !type || l.dataset.type === type).length : 1;
    if (leeg) leeg.hidden = !(matchMedia('(max-width: 959.98px)').matches && zichtbaar === 0);
  }
  filters.forEach((f) => f.addEventListener('click', () => {
    type = f.dataset.filter;
    filters.forEach((x) => x.setAttribute('aria-pressed', x === f));
    rooster.classList.toggle('is-gefilterd', !!type);
    let n = 0;
    $$('.les', rooster).forEach((l) => { const ja = !type || l.dataset.type === type; l.classList.toggle('is-aan', ja); if (ja) n++; });
    if (teller) teller.textContent = n;
    if (status) status.textContent = `${n} ${eenheid}`;
    werkLeegBij();
  }));
  if (actief) toonDag(actief);
  addEventListener('resize', werkLeegBij, { passive: true });
})();
