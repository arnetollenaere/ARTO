// Nachtkeuken: menu, nu open/gesloten, reservatiebonnetje. Geen afhankelijkheden.
(() => {
  const d = document, $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  d.documentElement.classList.add('js');

  // Mobiel menu
  const kop = $('[data-kop]'), knop = $('[data-menuknop]');
  if (knop) {
    const zet = (open) => { kop.classList.toggle('is-open', open); knop.setAttribute('aria-expanded', open); d.body.style.overflow = open ? 'hidden' : ''; };
    knop.addEventListener('click', () => zet(knop.getAttribute('aria-expanded') !== 'true'));
    $$('#hoofdmenu a').forEach((a) => a.addEventListener('click', () => zet(false)));
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && kop.classList.contains('is-open')) { zet(false); knop.focus(); } });
  }

  // Nu open / gesloten, op basis van de openingsuren (Belgische tijd)
  const lijst = $('[data-uren-lijst]');
  const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const nu = (() => {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
      return { dag: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: +p.hour * 60 + +p.minute };
    } catch { const t = new Date(); return { dag: t.getDay(), min: t.getHours() * 60 + t.getMinutes() }; }
  })();
  if (lijst) {
    const t = lijst.dataset, uren = {};
    $$('li', lijst).forEach((li) => {
      const i = DAGEN.indexOf((li.dataset.dag || '').toLowerCase());
      if (i < 0) return;
      uren[i] = [...(li.dataset.uren || '').matchAll(/(\d{1,2})[:.h](\d{2})\s*[–—-]\s*(\d{1,2})[:.h](\d{2})/g)].map((m) => {
        const a = +m[1] * 60 + +m[2]; let b = +m[3] * 60 + +m[4];
        if (b <= a) b += 1440;
        return [a, b];
      });
    });
    $$('[data-uren-lijst] li').forEach((li) => { if (DAGEN.indexOf((li.dataset.dag || '').toLowerCase()) === nu.dag) li.classList.add('is-vandaag'); });
    const uur = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    let status = 'dicht', tekst = t.gesloten;
    const vandaag = uren[nu.dag] || [], gisteren = uren[(nu.dag + 6) % 7] || [];
    const openNu = vandaag.find(([a, b]) => nu.min >= a && nu.min < b) || gisteren.filter(([, b]) => b > 1440).map(([a, b]) => [a - 1440, b - 1440]).find(([, b]) => nu.min < b);
    if (openNu) { status = 'open'; tekst = `${t.open} · ${t.tot} ${uur(openNu[1])}`; }
    else {
      const straks = vandaag.find(([a]) => a > nu.min);
      if (straks) tekst = `${t.gesloten} · ${t.opent} ${t.vandaag} ${uur(straks[0])}`;
      else for (let k = 1; k <= 7; k++) {
        const dag = (nu.dag + k) % 7;
        if ((uren[dag] || []).length) { tekst = `${t.gesloten} · ${t.opent} ${DAGEN[dag]} ${uur(uren[dag][0][0])}`; break; }
      }
    }
    $$('[data-nu]').forEach((el) => { el.dataset.status = status; const s = $('[data-nu-tekst]', el); if (s) s.textContent = tekst; });
  } else {
    $$('[data-nu]').forEach((el) => { el.hidden = true; });
  }

  // Reservatiebonnetje
  $$('[data-ticket]').forEach((ticket) => {
    const datum = $('[data-datum]', ticket), aantal = $('[data-aantal]', ticket), toon = $('[data-aantal-toon]', ticket);
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const vandaag = new Date();
    if (datum) { datum.min = iso(vandaag); if (!datum.value) datum.value = iso(vandaag); }
    const nr = $('[data-bonnr]', ticket);
    if (nr) nr.textContent = String((vandaag.getMonth() + 1) * 100 + vandaag.getDate() + nu.min).padStart(4, '0');
    const zetAantal = (n) => {
      const max = +aantal.max || 99;
      n = Math.max(1, Math.min(max, n || 1));
      aantal.value = n;
      if (toon && toon.textContent !== String(n)) { toon.textContent = n; toon.classList.remove('wip'); void toon.offsetWidth; toon.classList.add('wip'); }
    };
    if (aantal) {
      $$('[data-stap]', ticket).forEach((b) => b.addEventListener('click', () => zetAantal(+aantal.value + +b.dataset.stap)));
      aantal.addEventListener('input', () => { if (toon && aantal.value) toon.textContent = aantal.value; });
      aantal.addEventListener('change', () => zetAantal(+aantal.value));
    }
    if (new URLSearchParams(location.search).has('verzonden')) {
      const bev = $('[data-bevestiging]', ticket);
      ticket.classList.add('ticket--verzonden');
      if (bev) bev.hidden = false;
    }
  });
  if (new URLSearchParams(location.search).has('verzonden')) {
    const t = $('[data-ticket]');
    if (t) requestAnimationFrame(() => { t.scrollIntoView({ block: 'center' }); const b = $('[data-bevestiging]', t); if (b) b.focus({ preventScroll: true }); });
  }

  // Weeknummer op de stempel van de kaart
  $$('[data-week]').forEach((el) => {
    const t = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    const dag = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dag);
    el.textContent = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  });

  // Actieve gang in de navigatie van de kaart
  const gangLinks = $$('.gangnav a');
  if (gangLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((items) => items.forEach((it) => {
      if (!it.isIntersecting) return;
      gangLinks.forEach((a) => a.classList.toggle('is-actief', a.hash === '#' + it.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    gangLinks.forEach((a) => { const s = d.getElementById(a.hash.slice(1)); if (s) io.observe(s); });
  }
})();
