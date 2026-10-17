// Witte Zaal — kleine scripts: menu, klok, galerij, zwevende preview, filter, bevestiging, woordmerk.
(() => {
  const d = document;
  const root = d.documentElement;
  root.classList.add('js');
  const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu op gsm
  const knop = d.querySelector('[data-menu-knop]');
  const nav = d.getElementById('hoofdmenu');
  if (knop && nav) {
    const zet = (open) => {
      knop.setAttribute('aria-expanded', String(open));
      knop.textContent = open ? knop.dataset.dicht : knop.dataset.open;
      nav.classList.toggle('is-open', open);
      d.body.style.overflow = open ? 'hidden' : '';
    };
    knop.addEventListener('click', () => zet(knop.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) zet(false); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { zet(false); knop.focus(); } });
  }

  // Klok in de kop (lokale tijd van de studio)
  const klok = d.querySelector('[data-klok]');
  if (klok) {
    const fmt = new Intl.DateTimeFormat('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
    const tik = () => { klok.textContent = fmt.format(new Date()); };
    tik(); setInterval(tik, 20000);
  }

  // Horizontale galerij: lengte van de scroll = breedte van het spoor
  const gal = d.querySelector('[data-galerij]');
  const spoor = d.querySelector('[data-galerij-spoor]');
  if (gal && spoor) {
    const meet = () => gal.style.setProperty('--lengte', Math.max(0, spoor.scrollWidth - innerWidth) + 'px');
    meet();
    addEventListener('resize', meet);
    addEventListener('load', meet);
    d.fonts && d.fonts.ready.then(meet);
  }

  // Zwevende preview bij de index
  const lijst = d.querySelector('[data-index]');
  const zweef = d.querySelector('[data-zweef]');
  if (lijst && zweef && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const stukken = [...zweef.querySelectorAll('[data-zweef-nr]')];
    let x = innerWidth / 2, y = innerHeight / 2, hx = x, hy = y, raf = 0;
    const beweeg = () => {
      hx += (x - hx) * (stil ? 1 : 0.16);
      hy += (y - hy) * (stil ? 1 : 0.16);
      const r = (x - hx) * 0.04;
      zweef.style.transform = `translate(${hx + 28}px, ${hy - zweef.offsetHeight / 2}px) rotate(${stil ? 0 : r}deg)`;
      raf = Math.abs(x - hx) + Math.abs(y - hy) > 0.5 ? requestAnimationFrame(beweeg) : 0;
    };
    const toon = (nr) => {
      stukken.forEach((s) => s.classList.toggle('is-aan', s.dataset.zweefNr === nr));
      zweef.classList.toggle('is-aan', nr != null);
    };
    lijst.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (x + 28 + zweef.offsetWidth > innerWidth) x = innerWidth - zweef.offsetWidth - 40;
      if (!raf) raf = requestAnimationFrame(beweeg);
    });
    lijst.addEventListener('pointerover', (e) => {
      const rij = e.target.closest('[data-nr]');
      if (rij) toon(rij.dataset.nr);
    });
    lijst.addEventListener('pointerleave', () => toon(null));
  }

  // Filter op discipline (werkpagina)
  const filter = d.querySelector('[data-filter]');
  if (filter && lijst) {
    const items = [...d.querySelectorAll('[data-discipline]')];
    const soorten = [...new Set(items.map((i) => i.dataset.discipline).filter(Boolean))];
    if (soorten.length > 1) {
      const knoppen = [filter.dataset.alles, ...soorten].map((naam, i) => {
        const b = d.createElement('button');
        b.type = 'button'; b.textContent = naam; b.setAttribute('aria-pressed', String(i === 0));
        b.dataset.waarde = i === 0 ? '' : naam;
        filter.append(b);
        return b;
      });
      filter.hidden = false;
      filter.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        knoppen.forEach((k) => k.setAttribute('aria-pressed', String(k === b)));
        items.forEach((i) => { i.hidden = !!b.dataset.waarde && i.dataset.discipline !== b.dataset.waarde; });
      });
    }
  }

  // Bevestiging na verzenden
  if (new URLSearchParams(location.search).get('verzonden') === '1') {
    const b = d.querySelector('[data-bevestiging]');
    if (b) {
      b.hidden = false;
      const form = b.parentElement.querySelector('form');
      if (form) form.hidden = true;
      requestAnimationFrame(() => b.scrollIntoView({ block: 'center', behavior: stil ? 'auto' : 'smooth' }));
    }
  }

  // Woordmerk in de footer over de volle breedte
  const pas = d.querySelector('[data-pas]');
  if (pas) {
    const vul = () => {
      const ouder = pas.parentElement;
      pas.style.fontSize = '100px';
      const w = pas.getBoundingClientRect().width;
      if (w) pas.style.fontSize = (100 * ouder.clientWidth / w) * 0.995 + 'px';
    };
    vul();
    addEventListener('resize', vul);
    addEventListener('load', vul);
    d.fonts && d.fonts.load('600 100px Unbounded').then(vul, () => {});
  }
})();
