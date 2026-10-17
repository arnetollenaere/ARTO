// Commandopalet (⌘K): spring naar een weergave, sectie, veld of voer een actie uit.
import { h, $, houdFocus, kbd } from './ui.js';
import { icoon } from './iconen.js';
import { staat } from './staat.js';
import { alleVelden, labelVoor, groepNaam } from './schema.js';
import { alleEditorSecties, sectieIcoon } from './inhoud.js';

let open = false;

function normaal(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
// Eenvoudige fuzzy-score: woorden vooraan en aaneengesloten letters wegen zwaarder.
function score(zoek, tekst) {
  if (!zoek) return 1;
  const z = normaal(zoek), t = normaal(tekst);
  const i = t.indexOf(z);
  if (i >= 0) return 100 - i + (i === 0 || t[i - 1] === ' ' ? 50 : 0) - t.length * 0.1;
  let j = 0, s = 0, vorige = -2;
  for (let k = 0; k < t.length && j < z.length; k++) {
    if (t[k] === z[j]) { s += k === vorige + 1 ? 3 : 1; vorige = k; j++; }
  }
  return j === z.length ? s : -1;
}

export function openPalet({ weergaven, acties, gaNaarVeld }) {
  if (open) return;
  open = true;
  const vorige = document.activeElement;
  const items = [
    ...weergaven.map((w) => ({ groep: 'Ga naar', label: w.label, icoon: w.icoon, toets: w.toets, doe: () => { location.hash = w.hash; } })),
    ...alleEditorSecties().map((s) => ({ groep: 'Secties', label: s.titel, sub: groepNaam(s.groep), icoon: sectieIcoon(s), doe: () => { location.hash = `#/inhoud/${s.id}`; } })),
    ...acties.filter((a) => !a.verborgen?.()).map((a) => ({ groep: 'Acties', label: a.label, icoon: a.icoon, toets: a.toets, doe: a.doe })),
  ];
  const velden = [];
  for (const { veld, pad, sectie } of alleVelden()) {
    if (veld.type === 'groep') continue;
    velden.push({ groep: 'Velden', label: labelVoor(pad), zoekTekst: `${labelVoor(pad)} ${sectie.titel}`, icoon: veld.type === 'lijst' ? 'lijst' : veld.type === 'afbeelding' ? 'media' : 'bewerk', doe: () => gaNaarVeld(pad) });
    if (velden.length > 1500) break;
  }
  const invoer = h('input', { class: 'palet-invoer', placeholder: 'Zoek een sectie, veld of actie…', 'aria-label': 'Zoeken', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'palet-lijst', autocomplete: 'off', spellcheck: 'false' });
  const lijst = h('ul', { class: 'palet-lijst', id: 'palet-lijst', role: 'listbox' });
  let zichtbaar = [], actief = 0;
  const teken = () => {
    const z = invoer.value.trim();
    const pool = z ? [...items, ...velden] : items;
    zichtbaar = pool.map((it) => ({ it, s: score(z, it.zoekTekst || `${it.label} ${it.sub || ''}`) })).filter((x) => x.s >= 0)
      .sort((a, b) => (z ? b.s - a.s : 0)).slice(0, 60).map((x) => x.it);
    if (z) zichtbaar.sort((a, b) => ['Acties', 'Ga naar', 'Secties', 'Velden'].indexOf(a.groep) - ['Acties', 'Ga naar', 'Secties', 'Velden'].indexOf(b.groep));
    actief = Math.min(actief, Math.max(0, zichtbaar.length - 1));
    let groep = null;
    const kinderen = [];
    zichtbaar.forEach((it, i) => {
      if (it.groep !== groep) { groep = it.groep; kinderen.push(h('li', { class: 'palet-groep', role: 'presentation' }, groep)); }
      kinderen.push(h('li', { class: 'palet-item' + (i === actief ? ' actief' : ''), role: 'option', id: `palet-${i}`, 'aria-selected': String(i === actief), onmousemove: () => { if (actief !== i) { actief = i; markeer(); } }, onclick: () => kies(i) },
        icoon(it.icoon || 'pijl', 16), h('span', { class: 'palet-label' }, it.label), it.sub ? h('span', { class: 'palet-sub' }, it.sub) : null, it.toets ? kbd(it.toets) : null));
    });
    if (!zichtbaar.length) kinderen.push(h('li', { class: 'palet-leeg' }, 'Niets gevonden'));
    lijst.replaceChildren(...kinderen);
    markeer();
  };
  const markeer = () => {
    lijst.querySelectorAll('.palet-item').forEach((el) => { const ja = el.id === `palet-${actief}`; el.classList.toggle('actief', ja); el.setAttribute('aria-selected', String(ja)); });
    invoer.setAttribute('aria-activedescendant', `palet-${actief}`);
    lijst.querySelector('.actief')?.scrollIntoView({ block: 'nearest' });
  };
  const sluit = () => { open = false; achter.remove(); document.removeEventListener('keydown', toets, true); vorige?.focus?.(); };
  const kies = (i) => { const it = zichtbaar[i]; if (!it) return; sluit(); setTimeout(() => it.doe(), 0); };
  const toets = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); sluit(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); actief = (actief + 1) % Math.max(1, zichtbaar.length); markeer(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); actief = (actief - 1 + zichtbaar.length) % Math.max(1, zichtbaar.length); markeer(); }
    else if (e.key === 'Enter') { e.preventDefault(); kies(actief); }
    else if (e.key === 'Tab') houdFocus(e, doos);
  };
  invoer.addEventListener('input', () => { actief = 0; teken(); });
  const doos = h('div', { class: 'palet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Zoeken en springen' },
    h('div', { class: 'palet-kop' }, icoon('zoeken', 17), invoer, h('kbd', null, 'esc')), lijst,
    h('div', { class: 'palet-voet' }, h('span', null, h('kbd', null, '↑'), h('kbd', null, '↓'), ' kiezen'), h('span', null, h('kbd', null, '↵'), ' openen'), h('span', { class: 'spacer' }), h('span', null, staat.inhoud?.site?.naam || '')));
  const achter = h('div', { class: 'dialoog-achter palet-achter', onmousedown: (e) => { if (e.target === achter) sluit(); } }, doos);
  document.body.append(achter);
  document.addEventListener('keydown', toets, true);
  teken();
  invoer.focus();
}
