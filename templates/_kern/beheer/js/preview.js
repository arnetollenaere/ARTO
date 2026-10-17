// Live preview: rendert de gekozen pagina met de huidige (niet-opgeslagen) inhoud in een iframe.
// Twee iframes wisselen elkaar af, zodat er bij elke wijziging niets knippert en de scrollpositie blijft.
import { h, $, bus, debounce, lsLees, lsZet } from './ui.js';
import { icoon } from './iconen.js';
import { staat } from './staat.js';
import { renderPagina, paginas } from './render.js';
import { vindVeld, labelVoor, alleVelden, paginaNaam, lees } from './schema.js';

const APPARATEN = { desktop: { b: 1280, label: 'Desktop' }, tablet: { b: 820, label: 'Tablet' }, mobiel: { b: 390, label: 'Mobiel' } };

const STIJL = `
arto-v{display:contents}
html{scroll-behavior:auto!important}
*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}
#arto-omlijning{position:absolute;pointer-events:none;z-index:2147483646;border-radius:5px;box-shadow:0 0 0 2px #ff6a2b,0 0 0 6px rgba(255,106,43,.18);display:none}
#arto-omlijning span{position:absolute;left:-2px;bottom:calc(100% + 6px);background:#ff6a2b;color:#1b0b02;font:600 11px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:5px 7px;border-radius:5px;white-space:nowrap;letter-spacing:0;text-transform:none}
#arto-omlijning.onder span{bottom:auto;top:calc(100% + 6px)}
.arto-flits{position:absolute;pointer-events:none;z-index:2147483645;border-radius:6px;background:rgba(255,106,43,.22);box-shadow:0 0 0 2px #ff6a2b;animation:arto-flits 1.4s ease-out forwards!important;animation-duration:1.4s!important}
@keyframes arto-flits{0%{opacity:0}15%{opacity:1}70%{opacity:1}100%{opacity:0}}
`;

export class Preview {
  constructor() {
    this.bestand = lsLees('arto-preview-pagina') || 'index.html';
    if (!staat.bron.bestanden[this.bestand]) this.bestand = paginas()[0]?.bestand || 'index.html';
    this.apparaat = matchMedia('(max-width: 860px)').matches ? 'mobiel' : lsLees('arto-preview-apparaat') || 'desktop';
    this.versie = null; // { inhoud, label } bij het bekijken van een oude versie
    this.renderNr = 0;
    this.actief = 0;
    this.zichtbaar = false;
    this.opKlik = null;
    this.bouw();
    this.ververs = debounce(() => this.render(), 220);
    bus.op('wijziging', () => { if (!this.versie) this.ververs(); });
    new ResizeObserver(() => this.schaal()).observe(this.podium);
  }

  bouw() {
    this.paginaKiezer = h('select', { class: 'keuze-klein', 'aria-label': 'Pagina in het voorbeeld', onchange: (e) => this.toonPagina(e.target.value) });
    this.vulPaginas();
    const apparaatKnop = (k, ic) => h('button', { class: 'seg-knop', 'aria-pressed': String(this.apparaat === k), title: APPARATEN[k].label, 'aria-label': APPARATEN[k].label, onclick: () => this.zetApparaat(k), dataset: { apparaat: k } }, icoon(ic, 16));
    this.apparaatGroep = h('div', { class: 'seg', role: 'group', 'aria-label': 'Schermgrootte' }, apparaatKnop('desktop', 'desktop'), apparaatKnop('tablet', 'tablet'), apparaatKnop('mobiel', 'mobiel'));
    this.liveLink = h('a', { class: 'knop-icoon', target: '_blank', rel: 'noopener', title: 'Open deze pagina op je site', 'aria-label': 'Open deze pagina op je site' }, icoon('extern', 16));
    this.versieBalk = h('div', { class: 'preview-versie', hidden: true });
    this.frames = [0, 1].map((i) => h('iframe', { class: 'preview-frame', title: 'Voorbeeld van je site', tabindex: i === 0 ? '0' : '-1' }));
    this.foutVak = h('div', { class: 'preview-fout', hidden: true });
    this.apparaatVak = h('div', { class: 'preview-apparaat' }, this.frames);
    this.podium = h('div', { class: 'preview-podium' }, this.apparaatVak, this.foutVak);
    this.el = h('section', { class: 'preview', 'aria-label': 'Voorbeeld' },
      h('div', { class: 'preview-balk' },
        h('div', { class: 'preview-titel' }, h('span', { class: 'live-punt', 'aria-hidden': 'true' }), h('span', null, 'Voorbeeld')),
        this.paginaKiezer, h('div', { class: 'spacer' }), this.apparaatGroep, this.liveLink),
      this.versieBalk,
      this.podium);
    this.zetLiveLink();
  }

  vulPaginas() {
    this.paginaKiezer.replaceChildren(...paginas().map((p) => h('option', { value: p.bestand }, `${paginaNaam(p.bestand)}  ·  ${p.url}`)));
    this.paginaKiezer.value = this.bestand;
  }
  zetLiveLink() {
    const p = paginas().find((x) => x.bestand === this.bestand);
    this.liveLink.href = location.origin + (p?.url || '/');
  }

  toonPagina(bestand) {
    if (!staat.bron.bestanden[bestand]) return;
    const anders = bestand !== this.bestand;
    this.bestand = bestand;
    this.paginaKiezer.value = bestand;
    lsZet('arto-preview-pagina', bestand);
    this.zetLiveLink();
    if (anders) { this.scrollNaar = 0; this.render(); }
    bus.stuur('preview-pagina', bestand);
  }
  zetApparaat(k) {
    this.apparaat = k;
    lsZet('arto-preview-apparaat', k);
    for (const b of this.apparaatGroep.children) b.setAttribute('aria-pressed', String(b.dataset.apparaat === k));
    this.schaal();
  }
  schaal() {
    const breedte = this.podium.clientWidth, hoogte = this.podium.clientHeight;
    if (!breedte) return;
    const doel = APPARATEN[this.apparaat].b;
    const marge = this.apparaat === 'desktop' ? 0 : 24;
    const s = Math.min(1, (breedte - marge * 2) / doel);
    const b = Math.min(doel, Math.floor((breedte - marge * 2) / s));
    this.apparaatVak.dataset.apparaat = this.apparaat;
    Object.assign(this.apparaatVak.style, {
      width: b + 'px',
      height: Math.floor((hoogte - (this.apparaat === 'desktop' ? 0 : marge * 2)) / s) + 'px',
      transform: `translateX(-50%) scale(${s})`,
    });
  }

  // Een oude versie tonen (geschiedenis) of terug naar de werkkopie.
  toonVersie(inhoud, label) {
    this.versie = inhoud ? { inhoud, label } : null;
    this.versieBalk.hidden = !inhoud;
    if (inhoud) {
      this.versieBalk.replaceChildren(icoon('geschiedenis', 15), h('span', null, `Je bekijkt: ${label}`), h('button', { class: 'knop-link', onclick: () => this.toonVersie(null) }, 'Terug naar nu'));
    }
    this.render();
    bus.stuur('preview-versie', !!inhoud);
  }

  zetZichtbaar(z) {
    const was = this.zichtbaar;
    this.zichtbaar = z;
    if (z && (!was || this.vuil)) { this.schaal(); this.render(); }
  }

  render() {
    if (!this.zichtbaar) { this.vuil = true; return; }
    this.vuil = false;
    const nr = ++this.renderNr;
    const inhoud = this.versie?.inhoud || staat.inhoud;
    let html;
    try {
      html = renderPagina(inhoud, this.bestand, { markeer: !this.versie });
      this.foutVak.hidden = true;
    } catch (e) {
      this.foutVak.hidden = false;
      this.foutVak.replaceChildren(icoon('waarschuwing', 18), h('div', null, h('strong', null, 'Deze pagina kan niet getoond worden'), h('p', null, e.message)));
      return;
    }
    const oud = this.frames[this.actief];
    const nieuw = this.frames[1 - this.actief];
    let scroll = this.scrollNaar;
    if (scroll == null) { try { scroll = oud.contentWindow?.scrollY || 0; } catch { scroll = 0; } }
    this.scrollNaar = null;
    const map = this.bestand.includes('/') ? '/' + this.bestand.slice(0, this.bestand.lastIndexOf('/') + 1) : '/';
    const kop = `<base href="${map}"><style id="arto-preview-stijl">${STIJL}</style>`;
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + kop) : kop + html;
    if (staat.geupload.size) {
      html = html.replace(/\/img\/uploads\/([\w.-]+)/g, (m, naam) => (staat.geupload.has(naam) ? `/api/media/bestand?naam=${encodeURIComponent(naam)}` : m));
    }
    nieuw.onload = () => {
      if (nr !== this.renderNr) return;
      try {
        const w = nieuw.contentWindow;
        w.scrollTo(0, scroll);
        // Late afbeeldingen kunnen de hoogte nog veranderen: herhaal kort.
        setTimeout(() => { if (Math.abs(w.scrollY - scroll) > 2) w.scrollTo(0, scroll); }, 60);
        this.koppel(nieuw);
      } catch (e) { console.warn(e); }
      nieuw.classList.add('actief');
      nieuw.tabIndex = 0;
      oud.classList.remove('actief');
      oud.tabIndex = -1;
      this.actief = 1 - this.actief;
      if (this.naRender) { const f = this.naRender; this.naRender = null; setTimeout(f, 30); }
    };
    nieuw.srcdoc = html;
  }

  // Klik-om-te-bewerken en hover-omlijning in het voorbeeld.
  koppel(frame) {
    const doc = frame.contentDocument;
    if (!doc) return;
    const omlijning = doc.createElement('div');
    omlijning.id = 'arto-omlijning';
    omlijning.append(doc.createElement('span'));
    doc.body?.append(omlijning);
    let laatste = null, wacht = false;

    const vind = (e) => {
      const x = e.clientX, y = e.clientY;
      // 1. tekst onder de muis
      let knoop = null;
      if (doc.caretRangeFromPoint) knoop = doc.caretRangeFromPoint(x, y)?.startContainer;
      else if (doc.caretPositionFromPoint) knoop = doc.caretPositionFromPoint(x, y)?.offsetNode;
      const el = knoop ? (knoop.nodeType === 3 ? knoop.parentElement : knoop) : null;
      const v = el?.closest?.('arto-v');
      if (v && binnen(v, x, y)) return { el: v, pad: v.dataset.pad };
      // 2. afbeelding
      const img = e.target.closest?.('img');
      if (img) {
        const pad = afbeeldingPad(img.getAttribute('src'));
        if (pad) return { el: img, pad };
      }
      // 3. element met precies één bewerkbare tekst erin (knop, label …)
      const doelEl = e.target.closest?.('a, button, h1, h2, h3, h4, li, p, span, dt, dd, label');
      const binnenin = doelEl ? doelEl.querySelectorAll('arto-v') : [];
      if (binnenin.length === 1) return { el: binnenin[0], pad: binnenin[0].dataset.pad };
      return null;
    };
    const binnen = (v, x, y) => {
      const r = rechthoek(v);
      return r && x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3;
    };
    const rechthoek = (el) => {
      if (el.tagName !== 'ARTO-V') return el.getBoundingClientRect();
      const r = doc.createRange();
      r.selectNodeContents(el);
      const b = r.getBoundingClientRect();
      return b.width || b.height ? b : null;
    };
    const toon = (doel) => {
      if (!doel || !vindVeld(doel.pad)) { omlijning.style.display = 'none'; doc.documentElement.style.cursor = ''; laatste = null; return; }
      if (laatste && laatste.el === doel.el) return;
      laatste = doel;
      const r = rechthoek(doel.el);
      if (!r) { omlijning.style.display = 'none'; return; }
      const w = frame.contentWindow;
      Object.assign(omlijning.style, { display: 'block', left: r.left + w.scrollX - 3 + 'px', top: r.top + w.scrollY - 2 + 'px', width: r.width + 6 + 'px', height: r.height + 4 + 'px' });
      omlijning.classList.toggle('onder', r.top < 30);
      omlijning.firstChild.textContent = labelKort(doel.pad);
      doc.documentElement.style.cursor = 'pointer';
    };
    doc.addEventListener('mousemove', (e) => {
      if (wacht) return;
      wacht = true;
      requestAnimationFrame(() => { wacht = false; toon(vind(e)); });
    });
    doc.addEventListener('mouseleave', () => toon(null));
    doc.addEventListener('scroll', () => { laatste = null; omlijning.style.display = 'none'; }, { passive: true });
    doc.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]');
      if (a || e.target.closest?.('button, [type=submit]')) e.preventDefault();
      if (this.versie) return;
      const doel = vind(e);
      if (doel && vindVeld(doel.pad)) { e.preventDefault(); this.opKlik?.(doel.pad); return; }
      if (a) {
        const href = a.getAttribute('href') || '';
        const best = interneBestand(href, frame);
        if (best) this.toonPagina(best);
      }
    }, true);
    doc.addEventListener('submit', (e) => e.preventDefault(), true);
  }

  // Na een klik in het formulier: toon waar het veld in het voorbeeld staat.
  toonPad(pad) {
    const frame = this.frames[this.actief];
    const doc = frame?.contentDocument;
    if (!doc || !this.zichtbaar || this.versie) return;
    let el = doc.querySelector(`arto-v[data-pad="${CSS.escape(pad)}"]`);
    let rect = null;
    if (el) { const r = doc.createRange(); r.selectNodeContents(el); rect = r.getBoundingClientRect(); if (!rect.width && !rect.height) rect = null; }
    if (!rect) {
      const waarde = lees(staat.inhoud, pad);
      if (typeof waarde === 'string' && waarde) {
        el = [...doc.images].find((i) => i.getAttribute('src') === waarde);
        rect = el?.getBoundingClientRect();
      }
    }
    if (!rect) return;
    const w = frame.contentWindow;
    if (rect.top < 40 || rect.bottom > w.innerHeight - 40) w.scrollTo({ top: rect.top + w.scrollY - w.innerHeight / 3, behavior: 'smooth' });
    setTimeout(() => {
      const r2 = el.tagName === 'ARTO-V' ? (() => { const r = doc.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); })() : el.getBoundingClientRect();
      const f = doc.createElement('div');
      f.className = 'arto-flits';
      Object.assign(f.style, { left: r2.left + w.scrollX - 4 + 'px', top: r2.top + w.scrollY - 3 + 'px', width: r2.width + 8 + 'px', height: r2.height + 6 + 'px' });
      doc.body.append(f);
      setTimeout(() => f.remove(), 1500);
    }, 260);
  }

  // Toon de pagina waar een pad op staat (bv. na klik op "Ga naar veld").
  zoekPaginaVoor(pad) {
    const huidig = renderPagina(staat.inhoud, this.bestand, { markeer: true });
    if (huidig.includes(`data-pad="${pad}"`)) return this.bestand;
    for (const p of paginas()) {
      try { if (renderPagina(staat.inhoud, p.bestand, { markeer: true }).includes(`data-pad="${pad}"`)) return p.bestand; } catch { /* */ }
    }
    return null;
  }
}

function labelKort(pad) {
  const l = labelVoor(pad).split(' › ');
  return l.slice(-2).join(' › ');
}

function afbeeldingPad(src) {
  if (!src) return null;
  for (const { veld, pad } of alleVelden()) {
    if (veld.type === 'afbeelding' && lees(staat.inhoud, pad) === src) return pad;
  }
  return null;
}

function interneBestand(href, frame) {
  if (!href || /^(mailto:|tel:|#|javascript:)/i.test(href)) return null;
  let u;
  try { u = new URL(href, frame.contentDocument.baseURI); } catch { return null; }
  if (u.origin !== location.origin) return null;
  const p = u.pathname.replace(/\/$/, '/');
  const lijst = paginas();
  const m = lijst.find((x) => x.url === p || x.url === p.replace(/\.html$/, '') || '/' + x.bestand === p || x.url === p.replace(/\/$/, '') || (p === '/' && x.bestand === 'index.html'));
  return m?.bestand || null;
}
