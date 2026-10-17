/* Maatlijn: kleine interacties. Alles werkt ook zonder dit script. */
(() => {
  const $ = (s, d = document) => d.querySelector(s);
  const $$ = (s, d = document) => [...d.querySelectorAll(s)];
  const rustig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu op kleine schermen
  const kop = $('#kop');
  const menuknop = $('.kop__menuknop');
  if (kop && menuknop) {
    const zet = (open) => { kop.classList.toggle('is-open', open); menuknop.setAttribute('aria-expanded', String(open)); };
    menuknop.addEventListener('click', () => zet(!kop.classList.contains('is-open')));
    $$('.kop__nav a').forEach((a) => a.addEventListener('click', () => zet(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && kop.classList.contains('is-open')) { zet(false); menuknop.focus(); } });
  }

  // Maatlijnen tonen de echte breedte van het element (in px, als maatgetal)
  const meet = () => $$('[data-meet]').forEach((el) => {
    const doel = $(el.dataset.meet);
    if (doel) el.textContent = Math.round(doel.getBoundingClientRect().width * 10).toLocaleString('nl-BE').replace(/\./g, ' ');
  });
  meet();
  addEventListener('resize', meet, { passive: true });
  document.fonts && document.fonts.ready.then(meet);

  // Coördinaten en kruisdraad in de hero
  const held = $('[data-kruis]');
  if (held && matchMedia('(pointer: fine)').matches) {
    const x = $('[data-x]', held), y = $('[data-y]', held);
    held.addEventListener('pointermove', (e) => {
      const r = held.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      held.style.setProperty('--kx', px + 'px');
      held.style.setProperty('--ky', (py - 26) + 'px');
      x.textContent = String(Math.round(px * 10)).padStart(5, '0');
      y.textContent = String(Math.round(py * 10)).padStart(5, '0');
    });
    held.addEventListener('pointerenter', () => held.classList.add('is-kruis'));
    held.addEventListener('pointerleave', () => held.classList.remove('is-kruis'));
  }

  // Voor/na-schuif
  const io = 'IntersectionObserver' in window && !rustig ? new IntersectionObserver((items) => items.forEach((it) => {
    if (!it.isIntersecting) return;
    io.unobserve(it.target);
    const vn = it.target;
    vn.style.setProperty('--pos', '78%');
    setTimeout(() => vn.style.setProperty('--pos', vn.querySelector('input').value + '%'), 700);
  }), { threshold: .55 }) : null;
  $$('[data-vn]').forEach((vn) => {
    const inp = $('input', vn);
    const zet = () => vn.style.setProperty('--pos', inp.value + '%');
    inp.addEventListener('input', () => { vn.classList.add('is-sleep'); zet(); });
    inp.addEventListener('change', () => vn.classList.remove('is-sleep'));
    inp.addEventListener('pointerup', () => vn.classList.remove('is-sleep'));
    if (io) io.observe(vn);
  });

  // Weekschaal van de werfplanning
  $$('.gantt').forEach((g) => {
    const n = Math.max(1, Math.min(60, parseInt(g.dataset.weken, 10) || 16));
    const schaal = $('.gantt__schaal', g);
    if (!schaal) return;
    schaal.setAttribute('data-woord', g.dataset.woord || '');
    const rij = document.createElement('div');
    rij.className = 'gantt__weken';
    for (let i = 1; i <= n; i++) {
      const s = document.createElement('span');
      s.textContent = n > 20 && i % 2 === 0 && innerWidth < 760 ? '' : String(i).padStart(2, '0');
      rij.append(s);
    }
    schaal.append(rij);
  });

  // Werkgebied: lijst en kaart koppelen
  const punten = $$('.kaart__punt');
  $$('.gebied__lijst li').forEach((li) => {
    const aan = (v) => { li.classList.toggle('is-actief', v); const p = punten.find((x) => x.dataset.g === li.dataset.g); p && p.classList.toggle('is-actief', v); };
    li.addEventListener('pointerenter', () => aan(true));
    li.addEventListener('pointerleave', () => aan(false));
  });

  // Projecten filteren op type werk
  const filter = $('[data-filter]');
  const werven = $('[data-werven]');
  if (filter && werven) {
    const fiches = $$('.fiche', werven);
    const types = [...new Set(fiches.map((f) => f.dataset.type).filter(Boolean))];
    if (types.length > 1) {
      const knoppen = [];
      const maak = (label, type, aantal) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(type === ''));
        b.textContent = label;
        const sup = document.createElement('sup');
        sup.textContent = aantal;
        b.append(sup);
        b.addEventListener('click', () => {
          knoppen.forEach((k) => k.setAttribute('aria-pressed', String(k === b)));
          const doe = () => fiches.forEach((f) => { f.hidden = type !== '' && f.dataset.type !== type; });
          document.startViewTransition && !rustig ? document.startViewTransition(doe) : doe();
        });
        knoppen.push(b);
        filter.append(b);
      };
      maak(filter.dataset.alles || 'Alles', '', fiches.length);
      types.forEach((t) => maak(t, t, fiches.filter((f) => f.dataset.type === t).length));
      filter.hidden = false;
    }
  }

  // Offerteaanvraag in stappen
  const form = $('[data-stappen]');
  if (form) {
    const stappen = $$('.stap', form);
    const balk = $$('.stappenbalk li');
    const teller = $('[data-teller]', form);
    const totaal = stappen.length;
    let op = 1;
    const toon = (n, focus) => {
      op = n;
      form.dataset.op = String(n);
      stappen.forEach((s, i) => s.classList.toggle('is-actief', i === n - 1));
      balk.forEach((b, i) => { b.classList.toggle('is-actief', i === n - 1); b.classList.toggle('is-klaar', i < n - 1); });
      if (teller) teller.textContent = 'Stap ' + String(n).padStart(2, '0') + ' / ' + String(totaal).padStart(2, '0');
      if (focus) { const l = $('legend', stappen[n - 1]); l && l.setAttribute('tabindex', '-1'); l && l.focus({ preventScroll: true }); form.closest('.blad').scrollIntoView({ block: 'start', behavior: rustig ? 'auto' : 'smooth' }); }
    };
    const geldig = (n) => {
      const velden = $$('input, select, textarea', stappen[n - 1]).filter((v) => v.willValidate);
      const fout = velden.find((v) => !v.checkValidity());
      stappen[n - 1].classList.toggle('is-fout', !!fout);
      if (fout) { fout.reportValidity(); return false; }
      return true;
    };
    $('[data-volgende]', form).addEventListener('click', () => { if (geldig(op)) toon(Math.min(totaal, op + 1), true); });
    $('[data-vorige]', form).addEventListener('click', () => toon(Math.max(1, op - 1), true));
    $$('.tegel input', form).forEach((r) => r.addEventListener('change', () => setTimeout(() => toon(2, true), rustig ? 0 : 280)));
    form.addEventListener('submit', (e) => {
      for (let i = 1; i <= totaal; i++) if (!geldig(i)) { e.preventDefault(); toon(i); geldig(i); return; }
    });
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && op < totaal && e.target.tagName === 'INPUT') { e.preventDefault(); $('[data-volgende]', form).click(); }
    });
    toon(1);
  }

  // Bevestiging na verzenden
  if (new URLSearchParams(location.search).get('verzonden') === '1') {
    const bev = $('#bevestiging');
    if (bev) {
      bev.hidden = false;
      form && (form.hidden = true);
      bev.focus();
    }
  }
})();
