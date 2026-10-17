// Toonbank: menu, open-indicator, schappen, bestelbon. Klein en zonder afhankelijkheden.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

  // ---------- kop ----------
  const kop = $('[data-kop]');
  const menuknop = $('.menuknop');
  if (kop && menuknop) {
    const zet = (open) => {
      menuknop.setAttribute('aria-expanded', String(open));
      kop.toggleAttribute('data-open-menu', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuknop.addEventListener('click', () => zet(menuknop.getAttribute('aria-expanded') !== 'true'));
    $$('.nav a', kop).forEach((a) => a.addEventListener('click', () => zet(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') zet(false); });
  }
  if (kop) {
    const scroll = () => kop.toggleAttribute('data-gescrold', scrollY > 8);
    addEventListener('scroll', scroll, { passive: true });
    scroll();
  }

  // ---------- openingsuren ----------
  const leesUren = (tekst) => {
    const uren = {};
    (tekst || '').split(';').forEach((paar) => {
      const i = paar.indexOf('=');
      if (i < 0) return;
      const dag = paar.slice(0, i).trim().toLowerCase();
      const blokken = [];
      paar.slice(i + 1).replace(/(\d{1,2})(?:[:.hu](\d{2}))?\s*[–—-]\s*(\d{1,2})(?:[:.hu](\d{2}))?/g, (_, a, b, c, d) => {
        blokken.push([+a * 60 + +(b || 0), +c * 60 + +(d || 0)]);
      });
      uren[dag] = blokken;
    });
    return uren;
  };
  const tijd = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const nuInBrussel = () => {
    try {
      const d = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).map((p) => [p.type, p.value]));
      const dag = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(d.weekday);
      return { dag, min: +d.hour * 60 + +d.minute };
    } catch { const n = new Date(); return { dag: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
  };

  const pil = $('[data-open]');
  if (pil) {
    const uren = leesUren(pil.dataset.uren);
    const nu = nuInBrussel();
    const vandaag = uren[DAGEN[nu.dag]] || [];
    let staat = 'dicht', woorden = pil.dataset.dicht, sterk = '';
    const bezig = vandaag.find(([van, tot]) => nu.min >= van && nu.min < tot);
    const straks = vandaag.find(([van]) => nu.min < van);
    if (bezig) { staat = 'open'; woorden = pil.dataset.tot; sterk = tijd(bezig[1]); }
    else if (straks) { staat = 'straks'; woorden = pil.dataset.om; sterk = tijd(straks[0]); }
    else {
      for (let i = 1; i <= 7; i++) {
        const naam = DAGEN[(nu.dag + i) % 7];
        if (uren[naam] && uren[naam].length) { woorden = `${pil.dataset.dicht} · ${i === 1 && pil.dataset.morgen ? pil.dataset.morgen : `${pil.dataset.volgende} ${naam}`}`; sterk = tijd(uren[naam][0][0]); break; }
      }
    }
    pil.dataset.staat = staat;
    const t = $('[data-open-tekst]', pil);
    if (t) t.textContent = `${woorden} ${sterk}`.trim();
    const groot = $('[data-open-groot]');
    if (groot) {
      groot.dataset.staat = staat;
      groot.textContent = woorden + ' ';
      if (sterk) { const s = document.createElement('strong'); s.textContent = sterk; groot.append(s); }
    }
    const rij = $(`.uren__rij[data-dag="${DAGEN[nu.dag]}"]`);
    if (rij) rij.setAttribute('data-vandaag', '');
  }

  // ---------- schappen ----------
  $$('[data-schap-naar]').forEach((knop) => {
    const schap = document.getElementById(knop.getAttribute('aria-controls'));
    if (!schap) return;
    knop.addEventListener('click', () => {
      const stap = Math.max(schap.clientWidth * 0.8, 260) * Number(knop.dataset.schapNaar);
      schap.scrollBy({ left: stap, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });

  // ---------- bestelbon ----------
  const form = $('[data-bestelform]');
  const params = new URLSearchParams(location.search);
  if (form) {
    const bedankt = $('[data-bedankt]');
    if (params.get('verzonden') === '1' && bedankt) {
      form.hidden = true;
      bedankt.hidden = false;
      bedankt.focus();
    }
    const keuze = $('[data-productkeuze]', form);
    const gevraagd = (params.get('product') || '').trim().toLowerCase();
    if (keuze && gevraagd) {
      const opties = [...keuze.options];
      const optie = opties.find((o) => o.text.trim().toLowerCase() === gevraagd) || opties.find((o) => o.value && o.text.trim().toLowerCase().startsWith(gevraagd));
      if (optie) optie.selected = true;
    }
    const dag = $('[data-afhaaldag]', form);
    if (dag) {
      const morgen = new Date(Date.now() + 864e5);
      const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dag.min = iso(morgen);
      const uren = leesUren(form.dataset.uren);
      const toets = () => {
        if (!dag.value) return dag.setCustomValidity('');
        const naam = DAGEN[new Date(dag.value + 'T12:00').getDay()];
        dag.setCustomValidity(uren[naam] && !uren[naam].length ? form.dataset.dicht || '' : '');
      };
      dag.addEventListener('change', toets);
      dag.addEventListener('input', toets);
    }
  }

  // ---------- WhatsApp ----------
  $$('[data-wa]').forEach((a) => {
    const u = new URL(a.href);
    u.pathname = u.pathname.replace(/\+/g, '');
    a.href = u.toString();
    const basis = a.dataset.waBericht;
    if (!form || basis == null) return;
    const bouw = () => {
      const regels = [basis];
      const p1 = form.elements.product?.value, a1 = form.elements.aantal?.value;
      const p2 = form.elements.product_2?.value, a2 = form.elements.aantal_2?.value;
      if (p1) regels.push(`${a1 || 1} × ${p1}`);
      if (p2 && +a2 > 0) regels.push(`${a2} × ${p2}`);
      if (form.elements.afhaaldag?.value) regels.push(`${form.elements.afhaaldag.value}, ${form.elements.afhaalmoment?.value || ''}`);
      u.searchParams.set('text', regels.join('\n'));
      a.href = u.toString();
    };
    form.addEventListener('input', bouw);
    bouw();
  });
})();
