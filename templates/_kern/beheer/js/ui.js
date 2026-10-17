// Kleine bouwstenen voor de interface: DOM-helper, meldingen, dialogen, tijd en getallen.
import { icoon } from './iconen.js';

// Lege kinderen (null, undefined, false) overslaan bij append/replaceChildren, zoals h() dat ook doet.
for (const m of ['replaceChildren', 'append', 'prepend']) {
  const orig = Element.prototype[m];
  Element.prototype[m] = function (...k) { return orig.apply(this, k.filter((x) => x != null && x !== false)); };
}

// h('div', { class: 'x', onclick: fn }, 'tekst', kind, [kinderen])
export function h(tag, attrs, ...kinderen) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'value') el.value = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== 'string' && k !== 'list') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  voegToe(el, kinderen);
  return el;
}
function voegToe(el, kinderen) {
  for (const k of kinderen) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) voegToe(el, k);
    else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Eenvoudige gebeurtenissenbus.
const luisteraars = {};
export const bus = {
  op(naam, fn) { (luisteraars[naam] ||= new Set()).add(fn); return () => luisteraars[naam].delete(fn); },
  stuur(naam, data) { for (const fn of luisteraars[naam] || []) { try { fn(data); } catch (e) { console.error(e); } } },
};

export function debounce(fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.nu = (...a) => { clearTimeout(t); fn(...a); };
  return d;
}

export const kloon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

// ---------- meldingen (toasts) ----------
export function meld(tekst, { soort = 'info', actie, duur, id } = {}) {
  const doos = document.getElementById('meldingen');
  if (!doos) return;
  if (id) doos.querySelector(`[data-id="${id}"]`)?.remove();
  const ic = { info: 'info', goed: 'goed', fout: 'fout', waarschuwing: 'waarschuwing', bezig: 'vernieuwen' }[soort] || 'info';
  const sluit = () => { m.classList.add('weg'); setTimeout(() => m.remove(), 220); };
  const m = h('div', { class: `melding melding-${soort}`, dataset: id ? { id } : undefined, role: soort === 'fout' ? 'alert' : 'status' },
    icoon(ic, 16, soort === 'bezig' ? 'draai' : ''),
    h('span', { class: 'melding-tekst' }, tekst),
    actie ? h('button', { class: 'melding-actie', onclick: () => { actie.fn(); sluit(); } }, actie.label) : null,
    h('button', { class: 'melding-sluit', 'aria-label': 'Sluiten', onclick: sluit }, icoon('sluit', 14)),
  );
  doos.append(m);
  const d = duur ?? (actie ? 7000 : soort === 'fout' ? 8000 : soort === 'bezig' ? 0 : 3800);
  if (d) setTimeout(sluit, d);
  return { sluit, zet: (t) => { m.querySelector('.melding-tekst').textContent = t; } };
}

// ---------- dialogen ----------
// vraag({ titel, tekst, inhoud: Node, knoppen: [{ label, waarde, soort: 'primair'|'gevaar' }] }) -> Promise<waarde|null>
export function vraag({ titel, tekst, inhoud, knoppen = [{ label: 'Oké', waarde: true, soort: 'primair' }], breed = false, sluitbaar = true }) {
  return new Promise((ok) => {
    const vorige = document.activeElement;
    const klaar = (w) => {
      achter.classList.add('weg');
      document.removeEventListener('keydown', toets, true);
      setTimeout(() => achter.remove(), 160);
      vorige?.focus?.();
      ok(w);
    };
    const toets = (e) => {
      if (e.key === 'Escape' && sluitbaar) { e.preventDefault(); e.stopPropagation(); klaar(null); }
      if (e.key === 'Tab') houdFocus(e, doos);
    };
    const titelId = 'dlg-' + Math.random().toString(36).slice(2, 8);
    const doos = h('div', { class: 'dialoog' + (breed ? ' breed' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titelId },
      h('div', { class: 'dialoog-kop' },
        h('h2', { id: titelId }, titel),
        sluitbaar ? h('button', { class: 'knop-icoon', 'aria-label': 'Sluiten', onclick: () => klaar(null) }, icoon('sluit', 16)) : null),
      tekst ? h('p', { class: 'dialoog-tekst' }, tekst) : null,
      inhoud || null,
      knoppen.length ? h('div', { class: 'dialoog-knoppen' }, knoppen.map((k) =>
        h('button', { class: `knop ${k.soort === 'primair' ? 'knop-primair' : k.soort === 'gevaar' ? 'knop-gevaar' : ''}`, onclick: async () => {
          if (k.voor) { const r = await k.voor(); if (r === false) return; }
          klaar(k.waarde);
        } }, k.label))) : null,
    );
    const achter = h('div', { class: 'dialoog-achter', onmousedown: (e) => { if (e.target === achter && sluitbaar) klaar(null); } }, doos);
    document.body.append(achter);
    document.addEventListener('keydown', toets, true);
    requestAnimationFrame(() => {
      const f = doos.querySelector('[autofocus]') || doos.querySelector('input, textarea, select') || doos.querySelector('.dialoog-knoppen .knop-primair') || doos.querySelector('button');
      f?.focus();
    });
    doos._sluit = klaar;
  });
}
export function houdFocus(e, doos) {
  const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', doos).filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const eerste = f[0], laatste = f[f.length - 1];
  if (e.shiftKey && document.activeElement === eerste) { e.preventDefault(); laatste.focus(); }
  else if (!e.shiftKey && document.activeElement === laatste) { e.preventDefault(); eerste.focus(); }
}
export const bevestig = (titel, tekst, label = 'Doorgaan', gevaar = false) =>
  vraag({ titel, tekst, knoppen: [{ label: 'Annuleren', waarde: false }, { label, waarde: true, soort: gevaar ? 'gevaar' : 'primair' }] }).then((x) => !!x);

// ---------- tijd en getallen ----------
const rtf = new Intl.RelativeTimeFormat('nl-BE', { numeric: 'auto' });
export function geleden(datum) {
  if (!datum) return '';
  const s = (new Date(datum).getTime() - Date.now()) / 1000;
  const a = Math.abs(s);
  if (a < 45) return 'zonet';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute').replace('minuten', 'min').replace('minuut', 'min');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
  return datumKort(datum);
}
export const datumKort = (d) => new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: new Date(d).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
export const datumLang = (d) => new Date(d).toLocaleString('nl-BE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export function bytes(n) {
  if (n == null || isNaN(n)) return '–';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
export const meervoud = (n, een, veel) => `${n} ${n === 1 ? een : veel}`;

// ---------- scorering ----------
export function scoreRing(score, { grootte = 96, dik = 8, label = true } = {}) {
  const r = (grootte - dik) / 2;
  const omtrek = 2 * Math.PI * r;
  const wrap = h('div', { class: 'ring', style: { width: grootte + 'px', height: grootte + 'px' }, role: 'img', 'aria-label': score == null ? 'Score wordt berekend' : `Score ${score} op 100` });
  const kleur = score == null ? 'var(--rand-sterk)' : score >= 90 ? 'var(--goed)' : score >= 60 ? 'var(--let-op)' : 'var(--slecht)';
  wrap.innerHTML = `<svg viewBox="0 0 ${grootte} ${grootte}" width="${grootte}" height="${grootte}" aria-hidden="true">
    <circle cx="${grootte / 2}" cy="${grootte / 2}" r="${r}" fill="none" stroke="var(--rand)" stroke-width="${dik}"/>
    <circle class="ring-boog" cx="${grootte / 2}" cy="${grootte / 2}" r="${r}" fill="none" stroke="${kleur}" stroke-width="${dik}" stroke-linecap="round"
      stroke-dasharray="${omtrek}" stroke-dashoffset="${omtrek}" transform="rotate(-90 ${grootte / 2} ${grootte / 2})"/></svg>`;
  if (label) wrap.append(h('span', { class: 'ring-getal', style: { fontSize: Math.round(grootte * 0.3) + 'px' } }, score == null ? '–' : String(score)));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const boog = wrap.querySelector('.ring-boog');
    if (boog && score != null) boog.style.strokeDashoffset = String(omtrek * (1 - score / 100));
  }));
  return wrap;
}

export function leeg(el) { while (el.firstChild) el.firstChild.remove(); return el; }

export function sneltoets(toets) {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return toets.replace('Mod', mac ? '⌘' : 'Ctrl').replace('Shift', mac ? '⇧' : 'Shift').replace('Alt', mac ? '⌥' : 'Alt');
}
export function kbd(toets) {
  return h('span', { class: 'kbd-groep' }, sneltoets(toets).split('+').map((t) => h('kbd', null, t)));
}

// Klein menu (popover) naast een knop.
export function popover(anker, items) {
  document.querySelector('.popover')?.remove();
  const r = anker.getBoundingClientRect();
  const lijst = h('div', { class: 'popover', role: 'menu' }, items.filter(Boolean).map((it) =>
    it === '-' ? h('div', { class: 'popover-lijn' }) :
    h('button', { class: 'popover-item' + (it.gevaar ? ' gevaar' : ''), role: 'menuitem', onclick: () => { sluit(); it.fn(); } }, it.icoon ? icoon(it.icoon, 15) : null, h('span', null, it.label))));
  const sluit = () => { lijst.remove(); document.removeEventListener('mousedown', buiten, true); document.removeEventListener('keydown', esc, true); };
  const buiten = (e) => { if (!lijst.contains(e.target) && e.target !== anker) sluit(); };
  const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); sluit(); anker.focus(); } };
  document.body.append(lijst);
  const b = lijst.offsetWidth, hg = lijst.offsetHeight;
  let x = Math.min(r.right - b, window.innerWidth - b - 8); x = Math.max(8, x);
  let y = r.bottom + 6; if (y + hg > window.innerHeight - 8) y = r.top - hg - 6;
  Object.assign(lijst.style, { left: x + 'px', top: y + 'px' });
  document.addEventListener('mousedown', buiten, true);
  document.addEventListener('keydown', esc, true);
  lijst.querySelector('button')?.focus();
  return sluit;
}

export function kopieer(tekst) {
  navigator.clipboard?.writeText(tekst).then(() => meld('Gekopieerd', { soort: 'goed', duur: 1600 }), () => meld('Kopiëren lukte niet', { soort: 'fout' }));
}

export function download(naam, inhoud, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([inhoud], { type }));
  const a = h('a', { href: url, download: naam });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function lsLees(k, standaard = null) { try { const v = localStorage.getItem(k); return v == null ? standaard : JSON.parse(v); } catch { return standaard; } }
export function lsZet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* opslag vol of geblokkeerd */ } }
