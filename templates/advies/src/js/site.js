// Paragraaf — kleine interacties. Alles werkt ook zonder JavaScript.
(() => {
  const kop = document.querySelector('[data-kop]');
  const knop = document.querySelector('[data-menu]');
  const nav = document.getElementById('nav');

  // Header-lijn na scrollen
  const scrol = () => kop && kop.classList.toggle('is-gescrold', scrollY > 8);
  addEventListener('scroll', scrol, { passive: true }); scrol();

  // Mobiel menu
  const zet = (open) => {
    kop.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    knop.setAttribute('aria-expanded', String(open));
  };
  if (knop && nav) {
    knop.addEventListener('click', () => zet(knop.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) zet(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && kop.classList.contains('is-open')) { zet(false); knop.focus(); } });
  }

  // Datums als 24.09.2026
  for (const t of document.querySelectorAll('[data-datum]')) {
    const m = (t.getAttribute('datetime') || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) t.textContent = `${m[3]}.${m[2]}.${m[1]}`;
  }

  // Cijfers die optellen
  const fmt = new Intl.NumberFormat(document.documentElement.lang || 'nl-BE');
  const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tellers = [...document.querySelectorAll('[data-tel]')];
  for (const el of tellers) { const n = Number(el.dataset.tel); if (!isNaN(n)) el.textContent = fmt.format(n); }
  if (!stil && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((items) => {
      for (const it of items) {
        if (!it.isIntersecting) continue;
        io.unobserve(it.target);
        const el = it.target, doel = Number(el.dataset.tel), start = performance.now(), duur = 1400;
        if (isNaN(doel)) continue;
        const stap = (nu) => {
          const p = Math.min(1, (nu - start) / duur), e = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt.format(Math.round(doel * e));
          if (p < 1) requestAnimationFrame(stap);
        };
        requestAnimationFrame(stap);
      }
    }, { threshold: 0.6 });
    tellers.forEach((el) => io.observe(el));
  }

  // Actieve domein in de zijindex (expertisepagina)
  const links = [...document.querySelectorAll('.dossier-index a')];
  if (links.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((items) => {
      for (const it of items) if (it.isIntersecting) {
        links.forEach((a) => a.classList.toggle('is-actief', a.hash === '#' + it.target.id));
      }
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach((a) => { const d = document.getElementById(decodeURIComponent(a.hash.slice(1))); if (d) io2.observe(d); });
  }

  // Bevestiging na verzenden (/?verzonden=1)
  if (new URLSearchParams(location.search).has('verzonden')) {
    const b = document.querySelector('[data-bevestiging]');
    if (b) {
      b.hidden = false;
      b.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => { b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); });
    }
  }
})();
