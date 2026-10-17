// Luwte: menu, kop bij scrollen, zwevende afspraakknop, formulierbevestiging.
(() => {
  const d = document;
  const kop = d.querySelector('[data-kop]');
  const knop = d.querySelector('[data-menuknop]');
  const nav = d.getElementById('hoofdnav');

  // Menu op gsm
  if (knop && nav) {
    const zet = (open) => {
      knop.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      d.body.classList.toggle('menu-open', open);
    };
    knop.addEventListener('click', () => zet(knop.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) zet(false); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { zet(false); knop.focus(); } });
  }

  // Kop krijgt een achtergrond na scrollen; zwevende knop verdwijnt bij het afspraakblok
  const zweef = d.querySelector('[data-zweef]');
  const afspraak = d.getElementById('afspraak');
  const opScroll = () => kop && kop.classList.toggle('is-gescrold', window.scrollY > 12);
  opScroll();
  window.addEventListener('scroll', opScroll, { passive: true });
  // Zwevende knop: pas na het eerste scherm, en weg zodra het afspraakblok in beeld is
  let bijAfspraak = false;
  const zweefZet = () => zweef && zweef.classList.toggle('is-weg', bijAfspraak || window.scrollY < window.innerHeight * 0.6);
  if (zweef) {
    zweefZet();
    window.addEventListener('scroll', zweefZet, { passive: true });
    if (afspraak && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { bijAfspraak = e.isIntersecting; zweefZet(); }, { rootMargin: '0px 0px -30% 0px' }).observe(afspraak);
    }
  }

  // ?behandeling=… vult de keuzelijst in; ?verzonden=1 toont de bevestiging
  const q = new URLSearchParams(location.search);
  const keuze = d.querySelector('[data-behandeling]');
  const beh = q.get('behandeling');
  if (keuze && beh) [...keuze.options].forEach((o) => { if (o.text === beh) o.selected = true; });
  if (q.get('verzonden') === '1') {
    const b = d.getElementById('bevestiging');
    const f = d.querySelector('[data-formulier]');
    if (b) {
      b.hidden = false;
      if (f) f.hidden = true;
      requestAnimationFrame(() => { b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); });
    }
  }
})();
