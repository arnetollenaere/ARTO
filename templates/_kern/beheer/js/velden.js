// Formulieren uit het schema: één component per veldtype.
import { h, $, $$, meld, popover, bus } from './ui.js';
import { icoon } from './iconen.js';
import { staat, wijzig, bewerk } from './staat.js';
import { lees, zet, zichtbaar, itemTitel, enkelvoud, nieuwItem, altVeldVan, paginaNaam, delen, themaLabel } from './schema.js';
import { paginas } from './render.js';
import { contrast, contrastTekst, oordeel, geldigHex, normaliseerHex, themaParen } from './kleur.js';
import { kiesMedia, uploadBestanden, mediaVoorbeeld, mediaInfo } from './media.js';

const id = (pad) => 'v-' + pad.replace(/[^\w-]/g, '_');

// ---------- validatie ----------
const leeg = (w) => w == null || String(w).trim() === '';
export function valideer(veld, w) {
  if (veld.verplicht && leeg(w) && !['schakelaar', 'lijst', 'groep'].includes(veld.type)) return 'Dit veld is verplicht.';
  if (veld.type === 'lijst' && veld.min && Array.isArray(w) && w.length < veld.min) return `Minstens ${veld.min} nodig.`;
  if (leeg(w)) return '';
  const s = String(w).trim();
  if (veld.max && ['tekst', 'tekstvak', 'rijk'].includes(veld.type) && s.length > veld.max) return `Te lang: ${s.length} tekens, maximaal ${veld.max}.`;
  switch (veld.type) {
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? '' : 'Dit lijkt geen geldig e-mailadres (bv. naam@zaak.be).';
    case 'url':
      if (/^(\/|#|mailto:|tel:)/.test(s)) return '';
      if (/^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(s)) return '';
      if (/^[\w-]+(\.[\w-]+)+/.test(s)) return 'Begin met https:// (bv. https://' + s + ').';
      return 'Dit lijkt geen geldige link. Begin met https://';
    case 'telefoon': {
      if (/[^\d\s+().\/-]/.test(s)) return 'Gebruik alleen cijfers, spaties en eventueel +32.';
      return s.replace(/\D/g, '').length >= 8 ? '' : 'Dit nummer lijkt te kort.';
    }
    case 'getal': return isNaN(Number(String(s).replace(',', '.'))) ? 'Vul een getal in.' : '';
    case 'kleur': return geldigHex(s) ? '' : 'Gebruik een kleurcode zoals #c2562b.';
    default: return '';
  }
}

// ---------- formulier ----------
// velden: schema-velden, basis: pad van het ouderobject ('' voor de wortel)
export function maakVelden(velden, basis = '', ctx = {}) {
  const raster = h('div', { class: 'velden' });
  for (const veld of velden) {
    if (!zichtbaar(veld)) continue;
    // Alt-velden horen bij hun afbeelding en worden daar getoond.
    if (/Alt$/.test(veld.pad) && velden.some((v) => v.type === 'afbeelding' && `${v.pad}Alt` === veld.pad && zichtbaar(v))) continue;
    raster.append(maakVeld(veld, basis ? `${basis}.${veld.pad}` : veld.pad, { ...ctx, velden }));
  }
  return raster;
}

export function maakVeld(veld, pad, ctx = {}) {
  const maker = MAKERS[veld.type] || MAKERS.tekst;
  const el = maker(veld, pad, ctx);
  el.classList.add('veld', `veld-${veld.type}`);
  if (veld.breedte === 'smal') el.classList.add('smal');
  el.dataset.pad = pad;
  return el;
}

function kop(veld, pad, extra) {
  return h('div', { class: 'veld-kop' },
    h('label', { for: id(pad), class: 'veld-label' }, veld.label || veld.pad,
      veld.verplicht ? h('span', { class: 'verplicht', 'aria-hidden': 'true', title: 'Verplicht' }, '*') : null,
      veld.rol === 'arto' ? h('span', { class: 'badge badge-arto', title: 'Alleen zichtbaar voor ARTO' }, 'ARTO') : null),
    extra || null);
}
const hulp = (veld, pad) => (veld.hulp ? h('p', { class: 'veld-hulp', id: id(pad) + '-hulp' }, veld.hulp) : null);
const foutEl = (pad) => h('p', { class: 'veld-fout', id: id(pad) + '-fout', hidden: true, 'aria-live': 'polite' });

function toonFout(wrap, melding) {
  const f = wrap.querySelector(':scope > .veld-fout');
  if (!f) return;
  f.hidden = !melding;
  f.replaceChildren(...(melding ? [icoon('waarschuwing', 13), h('span', null, melding)] : []));
  wrap.classList.toggle('heeft-fout', !!melding);
  wrap.querySelector('input, textarea, select')?.setAttribute('aria-invalid', melding ? 'true' : 'false');
}
function bindValidatie(wrap, input, veld, pad) {
  const check = () => toonFout(wrap, valideer(veld, lees(staat.inhoud, pad)));
  input.addEventListener('blur', check);
  input.addEventListener('input', () => { if (wrap.classList.contains('heeft-fout')) check(); });
  wrap._check = check;
}
function meldWijziging(el, pad) {
  el.dispatchEvent(new CustomEvent('veld-wijzig', { bubbles: true, detail: { pad } }));
}

function teller(veld, pad) {
  if (!veld.max && !veld.aanbevolen) return null;
  const t = h('span', { class: 'teller', 'aria-live': 'off' });
  const zetT = (w) => {
    const n = String(w ?? '').length;
    const [min, max] = veld.aanbevolen || [0, veld.max];
    t.textContent = veld.max ? `${n} / ${veld.max}` : `${n}`;
    let k = '';
    if (veld.max && n > veld.max) k = 'slecht';
    else if (veld.aanbevolen) k = n === 0 ? '' : n < min ? 'let-op' : n > max ? 'slecht' : 'goed';
    else if (veld.max && n > veld.max * 0.9) k = 'let-op';
    t.dataset.niveau = k;
    t.title = veld.aanbevolen ? `Aanbevolen: ${min} tot ${max} tekens` : `Maximaal ${veld.max} tekens`;
  };
  zetT(lees(staat.inhoud, pad));
  t._zet = zetT;
  return t;
}

// ---------- tekstachtige velden ----------
function tekstVeld(veld, pad, ctx, { type = 'text', inputmode, autocomplete, voorvoegsel } = {}) {
  const tel = teller(veld, pad);
  const w = lees(staat.inhoud, pad);
  const input = h('input', {
    id: id(pad), type, class: 'invoer', value: w ?? '', inputmode, autocomplete: autocomplete || 'off', spellcheck: type === 'text' ? 'true' : 'false',
    'aria-describedby': [veld.hulp ? id(pad) + '-hulp' : '', id(pad) + '-fout'].filter(Boolean).join(' '),
    placeholder: veld.voorbeeld || PLACEHOLDERS[veld.type] || '',
    oninput: (e) => {
      let v = e.target.value;
      if (veld.type === 'getal') v = v === '' ? '' : isNaN(Number(v.replace(',', '.'))) ? v : Number(v.replace(',', '.'));
      if (veld.type === 'prijs' && typeof w === 'number' && v !== '' && !isNaN(Number(v.replace(',', '.')))) v = Number(v.replace(',', '.'));
      wijzig(pad, v);
      tel?._zet(e.target.value);
      meldWijziging(input, pad);
    },
  });
  const veldje = voorvoegsel ? h('div', { class: 'invoer-groep' }, h('span', { class: 'voorvoegsel', 'aria-hidden': 'true' }, voorvoegsel), input) : input;
  const wrap = h('div', null, kop(veld, pad, tel), veldje, hulp(veld, pad), foutEl(pad));
  bindValidatie(wrap, input, veld, pad);
  if (veld.type === 'url') {
    input.addEventListener('blur', () => {
      const s = input.value.trim();
      if (s && /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s) && !/^https?:/i.test(s)) { input.value = 'https://' + s; wijzig(pad, input.value); wrap._check(); meldWijziging(input, pad); }
    });
  }
  return wrap;
}
const PLACEHOLDERS = { email: 'naam@zaak.be', telefoon: '+32 9 123 45 67', url: 'https://', prijs: '0,00' };

function tekstvak(veld, pad) {
  const tel = teller(veld, pad);
  const ta = h('textarea', {
    id: id(pad), class: 'invoer', rows: 3, value: lees(staat.inhoud, pad) ?? '',
    'aria-describedby': [veld.hulp ? id(pad) + '-hulp' : '', id(pad) + '-fout'].filter(Boolean).join(' '),
    oninput: (e) => { wijzig(pad, e.target.value); tel?._zet(e.target.value); groei(ta); meldWijziging(ta, pad); },
  });
  requestAnimationFrame(() => groei(ta));
  const wrap = h('div', null, kop(veld, pad, tel), ta, hulp(veld, pad), foutEl(pad));
  bindValidatie(wrap, ta, veld, pad);
  return wrap;
}
export function groei(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight + 2, 520) + 'px';
}

// Opgemaakte tekst met een kleine werkbalk die mini-markdown schrijft.
function rijk(veld, pad) {
  const tel = teller(veld, pad);
  const ta = h('textarea', {
    id: id(pad), class: 'invoer rijk-invoer', rows: 5, value: lees(staat.inhoud, pad) ?? '',
    'aria-describedby': [veld.hulp ? id(pad) + '-hulp' : '', id(pad) + '-fout'].filter(Boolean).join(' '),
    oninput: (e) => { wijzig(pad, e.target.value); tel?._zet(e.target.value); groei(ta); meldWijziging(ta, pad); },
    onkeydown: (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'b') { e.preventDefault(); omsluit(ta, '**'); }
      if (e.key === 'i') { e.preventDefault(); omsluit(ta, '*'); }
      if (e.key === 'k') { e.preventDefault(); e.stopPropagation(); maakLink(ta, linkKnop); }
    },
  });
  requestAnimationFrame(() => groei(ta));
  const knop = (ic, label, fn, toets) => h('button', { type: 'button', class: 'werkbalk-knop', title: toets ? `${label} (${toets})` : label, 'aria-label': label, onmousedown: (e) => e.preventDefault(), onclick: fn }, icoon(ic, 15));
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
  const linkKnop = knop('link', 'Link', () => maakLink(ta, linkKnop), mod + 'K');
  const balk = h('div', { class: 'werkbalk', role: 'toolbar', 'aria-label': 'Opmaak' },
    knop('vet', 'Vet', () => omsluit(ta, '**'), mod + 'B'),
    knop('cursief', 'Cursief', () => omsluit(ta, '*'), mod + 'I'),
    linkKnop,
    knop('lijst', 'Opsomming', () => lijstje(ta)),
    h('span', { class: 'werkbalk-uitleg' }, '**vet**  *cursief*  - lijst'));
  const wrap = h('div', null, kop(veld, pad, tel), h('div', { class: 'rijk-vak' }, balk, ta), hulp(veld, pad), foutEl(pad));
  bindValidatie(wrap, ta, veld, pad);
  return wrap;
}
function vervangSelectie(ta, tekst, selStart, selEind) {
  ta.focus();
  ta.setRangeText(tekst, ta.selectionStart, ta.selectionEnd, 'end');
  if (selStart != null) ta.setSelectionRange(selStart, selEind);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}
function omsluit(ta, teken) {
  const { selectionStart: a, selectionEnd: b, value: v } = ta;
  const sel = v.slice(a, b);
  const n = teken.length;
  // Al omsloten? Dan weghalen.
  if (v.slice(a - n, a) === teken && v.slice(b, b + n) === teken && !(teken === '*' && v.slice(a - 2, a) === '**' && v.slice(a - 3, a) !== '***')) {
    ta.setSelectionRange(a - n, b + n);
    vervangSelectie(ta, sel, a - n, b - n);
    return;
  }
  const kern = sel.replace(/^\s+|\s+$/g, '');
  const voor = sel.slice(0, sel.indexOf(kern)), na = sel.slice(sel.indexOf(kern) + kern.length);
  const tekst = kern || 'tekst';
  vervangSelectie(ta, voor + teken + tekst + teken + na, a + voor.length + n, a + voor.length + n + tekst.length);
}
function maakLink(ta, anker) {
  const { selectionStart: a, selectionEnd: b, value: v } = ta;
  const sel = v.slice(a, b) || '';
  const tekstIn = h('input', { class: 'invoer', value: sel, placeholder: 'Tekst van de link' });
  const urlIn = h('input', { class: 'invoer', placeholder: 'https:// of /pagina', value: '' });
  const pop = h('form', { class: 'popover link-pop', onsubmit: (e) => {
    e.preventDefault();
    let u = urlIn.value.trim();
    if (!u) return;
    if (/^[\w-]+(\.[\w-]+)+/.test(u) && !/^https?:/.test(u)) u = 'https://' + u;
    if (/^[^\s@]+@[^\s@]+\.\w+$/.test(u)) u = 'mailto:' + u;
    const t = tekstIn.value.trim() || u;
    sluit();
    ta.setSelectionRange(a, b);
    vervangSelectie(ta, `[${t}](${u})`);
  } },
  h('label', { class: 'mini-label' }, 'Tekst', tekstIn), h('label', { class: 'mini-label' }, 'Link naar', urlIn),
  h('div', { class: 'pop-knoppen' }, h('button', { type: 'button', class: 'knop knop-klein', onclick: () => sluit() }, 'Annuleren'), h('button', { class: 'knop knop-klein knop-primair' }, 'Link maken')));
  const sluit = () => { pop.remove(); document.removeEventListener('mousedown', buiten, true); ta.focus(); };
  const buiten = (e) => { if (!pop.contains(e.target)) sluit(); };
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); sluit(); } });
  document.body.append(pop);
  const r = anker.getBoundingClientRect();
  Object.assign(pop.style, { left: Math.min(r.left, innerWidth - 300) + 'px', top: r.bottom + 6 + 'px' });
  document.addEventListener('mousedown', buiten, true);
  (sel ? urlIn : tekstIn).focus();
}
function lijstje(ta) {
  const v = ta.value;
  let a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
  let b = v.indexOf('\n', ta.selectionEnd); if (b < 0) b = v.length;
  const regels = v.slice(a, b).split('\n');
  const isLijst = regels.every((r) => /^\s*[-•]\s+/.test(r) || !r.trim());
  let nieuw = regels.map((r) => (isLijst ? r.replace(/^\s*[-•]\s+/, '') : r.trim() ? `- ${r.replace(/^\s+/, '')}` : r)).join('\n');
  if (!isLijst) {
    if (!nieuw.trim()) nieuw = '- ';
    if (a > 0 && v.slice(0, a) !== '' && !/\n\n$/.test(v.slice(0, a))) nieuw = '\n' + nieuw;
    if (b < v.length && !/^\n\n/.test(v.slice(b))) nieuw = nieuw + '\n';
  }
  ta.setSelectionRange(a, b);
  vervangSelectie(ta, nieuw);
}

// ---------- schakelaar, keuze, datum, pagina ----------
function schakelaar(veld, pad) {
  const aan = !!lees(staat.inhoud, pad);
  const knop = h('button', { type: 'button', id: id(pad), class: 'schakelaar', role: 'switch', 'aria-checked': String(aan), 'aria-describedby': veld.hulp ? id(pad) + '-hulp' : null,
    onclick: () => {
      const nu = knop.getAttribute('aria-checked') !== 'true';
      knop.setAttribute('aria-checked', String(nu));
      wijzig(pad, nu, { samenvoegen: false });
      status.textContent = nu ? 'Aan' : 'Uit';
      meldWijziging(knop, pad);
    } }, h('span', { class: 'schakelaar-bol' }));
  const status = h('span', { class: 'schakelaar-status' }, aan ? 'Aan' : 'Uit');
  return h('div', null,
    h('div', { class: 'schakel-rij' },
      h('label', { for: id(pad), class: 'veld-label', onclick: (e) => { e.preventDefault(); knop.click(); knop.focus(); } }, veld.label,
        veld.rol === 'arto' ? h('span', { class: 'badge badge-arto' }, 'ARTO') : null),
      h('span', { class: 'spacer' }), status, knop),
    hulp(veld, pad), foutEl(pad));
}

function keuze(veld, pad) {
  const w = lees(staat.inhoud, pad) ?? '';
  const opties = [...(veld.opties || [])].map((o) => (typeof o === 'object' ? o : { waarde: o, label: o }));
  if (w !== '' && !opties.some((o) => o.waarde === w)) opties.unshift({ waarde: w, label: w });
  const kort = veld.breedte !== 'smal' && opties.length <= 4 && opties.reduce((n, o) => n + String(o.label).length, 0) <= 34;
  let wrap;
  if (kort) {
    const groep = h('div', { class: 'seg seg-veld', role: 'radiogroup', id: id(pad), 'aria-label': veld.label },
      opties.map((o) => h('button', { type: 'button', role: 'radio', class: 'seg-knop', 'aria-checked': String(o.waarde === w), tabindex: o.waarde === w || (!w && o === opties[0]) ? '0' : '-1',
        onclick: (e) => kies(e.currentTarget, o.waarde),
        onkeydown: (e) => {
          const knoppen = $$('.seg-knop', groep);
          const i = knoppen.indexOf(e.currentTarget);
          const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (d) { e.preventDefault(); const n = knoppen[(i + d + knoppen.length) % knoppen.length]; n.focus(); n.click(); }
        } }, o.label)));
    const kies = (knop, waarde) => {
      for (const b of groep.children) { const ja = b === knop; b.setAttribute('aria-checked', String(ja)); b.tabIndex = ja ? 0 : -1; }
      wijzig(pad, waarde, { samenvoegen: false });
      meldWijziging(groep, pad);
    };
    wrap = h('div', null, h('div', { class: 'veld-kop' }, h('span', { class: 'veld-label', id: id(pad) + '-l' }, veld.label)), groep, hulp(veld, pad), foutEl(pad));
  } else {
    const sel = h('select', { id: id(pad), class: 'invoer keuze', onchange: (e) => { wijzig(pad, e.target.value, { samenvoegen: false }); meldWijziging(sel, pad); } },
      !veld.verplicht && !opties.some((o) => o.waarde === '') ? h('option', { value: '' }, '— Kies —') : null,
      opties.map((o) => h('option', { value: o.waarde }, o.label)));
    sel.value = w;
    wrap = h('div', null, kop(veld, pad), h('div', { class: 'keuze-wrap' }, sel, icoon('onder', 14, 'keuze-pijl')), hulp(veld, pad), foutEl(pad));
  }
  return wrap;
}

function datum(veld, pad) {
  const w = lees(staat.inhoud, pad) ?? '';
  const uitleg = h('span', { class: 'teller' });
  const zetUitleg = (v) => {
    if (!v) { uitleg.textContent = ''; uitleg.dataset.niveau = ''; return; }
    const d = new Date(v + 'T12:00:00');
    if (isNaN(d)) { uitleg.textContent = ''; return; }
    const verlopen = d < new Date(new Date().toDateString());
    uitleg.textContent = d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }) + (verlopen ? ' · voorbij' : '');
    uitleg.dataset.niveau = verlopen ? 'let-op' : '';
  };
  zetUitleg(w);
  const input = h('input', { id: id(pad), type: 'date', class: 'invoer', value: w, oninput: (e) => { wijzig(pad, e.target.value, { samenvoegen: false }); zetUitleg(e.target.value); meldWijziging(input, pad); } });
  const wrap = h('div', null, kop(veld, pad, uitleg), input, hulp(veld, pad), foutEl(pad));
  bindValidatie(wrap, input, veld, pad);
  return wrap;
}

function pagina(veld, pad) {
  const w = lees(staat.inhoud, pad) ?? '';
  const lijst = paginas();
  const sel = h('select', { id: id(pad), class: 'invoer keuze', onchange: (e) => { wijzig(pad, e.target.value, { samenvoegen: false }); meldWijziging(sel, pad); } },
    h('option', { value: '' }, '— Kies een pagina —'),
    lijst.map((p) => h('option', { value: p.bestand }, `${paginaNaam(p.bestand)} (${p.url})`)),
    w && !lijst.some((p) => p.bestand === w) ? h('option', { value: w }, `${w} (bestaat niet)`) : null);
  sel.value = w;
  return h('div', null, kop(veld, pad), h('div', { class: 'keuze-wrap' }, sel, icoon('onder', 14, 'keuze-pijl')), hulp(veld, pad), foutEl(pad));
}

// ---------- kleur ----------
export function kleurVeld(veld, pad, { tegen } = {}) {
  const w = lees(staat.inhoud, pad) || '';
  const kiezer = h('input', { type: 'color', class: 'kleur-kiezer', value: geldigHex(w) ? normaliseerHex(w) : '#000000', 'aria-label': `${veld.label}: kleur kiezen`,
    oninput: (e) => { hex.value = e.target.value; zetKleur(e.target.value); } });
  const staal = h('label', { class: 'kleur-staal', style: { background: w || 'transparent' } }, kiezer);
  const hex = h('input', { id: id(pad), class: 'invoer mono kleur-hex', value: w, maxlength: 7, spellcheck: 'false', autocomplete: 'off',
    oninput: (e) => { let v = e.target.value.trim(); if (v && !v.startsWith('#')) v = '#' + v; if (geldigHex(v)) { kiezer.value = normaliseerHex(v); } zetKleur(v); } });
  const chips = h('div', { class: 'contrast-chips' });
  const zetKleur = (v) => {
    staal.style.background = geldigHex(v) ? v : 'transparent';
    wijzig(pad, v);
    vulChips();
    meldWijziging(hex, pad);
  };
  const vulChips = () => {
    const k = lees(staat.inhoud, pad);
    const doelen = typeof tegen === 'function' ? tegen() : standaardTegen(pad);
    chips.replaceChildren(...doelen.map((d) => {
      const c = contrast(k, d.kleur);
      const o = oordeel(c);
      const nodig = d.min || 4.5;
      const niveau = c == null ? 'onbekend' : c >= nodig ? 'goed' : c >= 3 ? 'let-op' : 'slecht';
      return h('span', { class: `contrast-chip niveau-${niveau}`, title: `Contrast ${contrastTekst(c)} (nodig: ${String(nodig).replace('.', ',')}:1)` },
        h('span', { class: 'chip-staal', style: { background: d.omgekeerd ? k : d.kleur } }, h('span', { style: { color: d.omgekeerd ? d.kleur : k } }, 'Aa')),
        h('span', null, d.label), h('strong', null, contrastTekst(c)), h('span', { class: 'chip-oordeel' }, niveau === 'goed' ? o.label : niveau === 'let-op' ? 'Matig' : 'Te weinig'));
    }));
  };
  vulChips();
  const wrap = h('div', null, kop(veld, pad), h('div', { class: 'kleur-rij' }, staal, hex), chips, hulp(veld, pad), foutEl(pad));
  wrap._vulChips = vulChips;
  bindValidatie(wrap, hex, veld, pad);
  return wrap;
}
function standaardTegen(pad) {
  const k = staat.inhoud.thema?.kleuren || {};
  const lijst = [];
  if (pad.startsWith('thema.kleuren.')) {
    // Dezelfde paren als de analyse: tekst en accent op de hoofdachtergrond, andere vlakken met hun best leesbare kleur.
    const s = pad.slice('thema.kleuren.'.length);
    for (const p of themaParen(k)) {
      if (p.voor === s) lijst.push({ label: `op ${themaLabel(p.achter).toLowerCase()}`, kleur: k[p.achter], min: p.min });
      else if (p.achter === s) lijst.push({ label: `met ${themaLabel(p.voor).toLowerCase()}`, kleur: k[p.voor], min: p.min, omgekeerd: true });
    }
    if (lijst.length) return lijst;
  }
  for (const [s, v] of Object.entries(k)) {
    if (`thema.kleuren.${s}` === pad || !geldigHex(v)) continue;
    if (/achtergrond|tekst|bg|text/i.test(s)) lijst.push({ label: `tegen ${themaLabel(s).toLowerCase()}`, kleur: v, min: 4.5 });
  }
  if (!lijst.length) lijst.push({ label: 'met witte tekst', kleur: '#ffffff', min: 4.5 }, { label: 'met zwarte tekst', kleur: '#000000', min: 4.5 });
  else if (!pad.startsWith('thema.')) lijst.push({ label: 'met witte tekst', kleur: '#ffffff', min: 4.5 });
  return lijst;
}

// ---------- afbeelding ----------
function afbeelding(veld, pad, ctx) {
  const alt = altVeldVan(veld, ctx.velden || []);
  const altPad = alt ? pad.slice(0, pad.length - veld.pad.length) + alt.pad : null;
  const wrap = h('div');
  const teken = () => {
    const w = lees(staat.inhoud, pad) || '';
    const info = w ? mediaInfo(w) : null;
    const naam = w ? decodeURIComponent(w.split('/').pop()) : '';
    const ext = naam.split('.').pop().toUpperCase();
    const mini = h('button', { type: 'button', id: id(pad), class: 'beeld-mini' + (w ? '' : ' leeg'), 'aria-label': w ? `${veld.label}: ${naam}. Klik om te wijzigen` : `${veld.label}: kies een afbeelding`, onclick: kies },
      w ? (/\.pdf$/i.test(w) ? icoon('pdf', 22) : h('img', { src: mediaVoorbeeld(w), alt: '', loading: 'lazy', onerror: (e) => e.target.replaceWith(icoon('media', 20)) })) : icoon('plus', 20));
    const knoppen = h('div', { class: 'beeld-knoppen' },
      h('button', { type: 'button', class: 'knop knop-klein', onclick: kies }, icoon('media', 14), w ? 'Andere kiezen' : 'Kies uit bibliotheek'),
      h('label', { class: 'knop knop-klein knop-zacht', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.querySelector('input').click(); } } }, icoon('upload', 14), 'Uploaden',
        h('input', { type: 'file', accept: 'image/*,.svg', hidden: true, onchange: async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = await uploadBestanden([f], { stil: false });
          if (r[0]?.url) zetW(r[0].url);
        } })),
      w ? h('button', { type: 'button', class: 'knop-icoon klein', title: 'Afbeelding weghalen', 'aria-label': 'Afbeelding weghalen', onclick: () => zetW('') }, icoon('sluit', 14)) : null);
    const blok = h('div', { class: 'beeld' }, mini,
      h('div', { class: 'beeld-info' },
        h('div', { class: 'beeld-naam' }, w ? naam : 'Nog geen afbeelding'),
        h('div', { class: 'beeld-meta' }, w ? [info?.grootte ? h('span', null, bytesKort(info.grootte)) : null, h('span', null, ext)] : 'Sleep een bestand hierheen of kies er een.'),
        knoppen));
    // Slepen op het veld zelf.
    blok.addEventListener('dragover', (e) => { e.preventDefault(); blok.classList.add('sleep-boven'); });
    blok.addEventListener('dragleave', () => blok.classList.remove('sleep-boven'));
    blok.addEventListener('drop', async (e) => {
      e.preventDefault(); blok.classList.remove('sleep-boven');
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      const r = await uploadBestanden([f]);
      if (r[0]?.url) zetW(r[0].url);
    });
    const delen = [kop(veld, pad), blok];
    if (alt) {
      const altW = lees(staat.inhoud, altPad) ?? '';
      const altIn = h('input', { id: id(altPad), class: 'invoer', value: altW, placeholder: 'Wat staat er op de foto?', 'aria-describedby': id(altPad) + '-hulp',
        oninput: (e) => { wijzig(altPad, e.target.value); meldWijziging(altIn, altPad); } });
      const altWrap = h('div', { class: 'veld veld-alt', dataset: { pad: altPad } },
        h('div', { class: 'veld-kop' }, h('label', { for: id(altPad), class: 'veld-label klein' }, alt.label || 'Beschrijving van de afbeelding')),
        altIn, h('p', { class: 'veld-hulp', id: id(altPad) + '-hulp' }, alt.hulp || 'Kort beschrijven wat je ziet. Helpt slechtziende bezoekers en Google.'));
      if (w && !altW) altWrap.classList.add('alt-ontbreekt');
      delen.push(altWrap);
    }
    delen.push(hulp(veld, pad), foutEl(pad));
    wrap.replaceChildren(...delen);
  };
  const zetW = (url) => { wijzig(pad, url, { samenvoegen: false }); teken(); meldWijziging(wrap, pad); };
  const kies = async () => {
    const url = await kiesMedia({ huidig: lees(staat.inhoud, pad), titel: veld.label });
    if (url != null) zetW(url);
  };
  teken();
  const af = bus.op('media-bijgewerkt', () => { if (!wrap.isConnected) return af(); teken(); });
  return wrap;
}
const bytesKort = (n) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} kB` : `${(n / 1048576).toFixed(1).replace('.', ',')} MB`);

// ---------- groep ----------
function groep(veld, pad, ctx) {
  return h('fieldset', { class: 'groep' },
    h('legend', { class: 'groep-titel' }, veld.label),
    veld.hulp ? h('p', { class: 'veld-hulp' }, veld.hulp) : null,
    maakVelden(veld.velden || [], pad, ctx));
}

// ---------- lijst ----------
function lijst(veld, pad, ctx) {
  const wrap = h('div');
  const teken = () => {
    const items = lees(staat.inhoud, pad);
    const arr = Array.isArray(items) ? items : [];
    const enk = enkelvoud(veld.label);
    const vol = veld.max && arr.length >= veld.max;
    const ol = h('ol', { class: 'items', 'aria-label': veld.label });
    arr.forEach((item, i) => ol.append(maakItem(veld, pad, i, item, arr.length, ctx, teken)));
    const alleOpen = arr.length && arr.every((_, i) => staat.openItems.has(`${pad}.${i}`));
    const kopEl = h('div', { class: 'veld-kop' },
      h('span', { class: 'veld-label', id: id(pad) }, veld.label, h('span', { class: 'aantal' }, String(arr.length))),
      arr.length > 1 ? h('button', { type: 'button', class: 'knop-link klein', onclick: () => {
        arr.forEach((_, i) => (alleOpen ? staat.openItems.delete(`${pad}.${i}`) : staat.openItems.add(`${pad}.${i}`)));
        teken();
      } }, alleOpen ? 'Alles dichtklappen' : 'Alles openklappen') : null);
    wrap.replaceChildren(kopEl,
      veld.hulp ? h('p', { class: 'veld-hulp' }, veld.hulp) : null,
      arr.length ? ol : h('div', { class: 'lijst-leeg' }, `Nog geen ${veld.label.toLowerCase()}.`),
      h('button', { type: 'button', class: 'lijst-toevoegen', disabled: vol, title: vol ? `Maximaal ${veld.max}` : null, onclick: () => {
        const nieuw = nieuwItem(veld);
        const idx = arr.length; // vóór de push: arr is de live lijst
        bewerk((inh) => { const l = lees(inh, pad); if (Array.isArray(l)) l.push(nieuw); else zet(inh, pad, [nieuw]); }, { pad });
        staat.openItems.add(`${pad}.${idx}`);
        teken();
        const it = wrap.querySelector(`.item[data-pad="${CSS.escape(`${pad}.${idx}`)}"]`);
        it?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        (it?.matches('.primitief') ? it.querySelector('input') : it?.querySelector(':scope > .item-lijf :is(input:not([type=file]):not([type=color]), textarea, select, button)'))?.focus({ preventScroll: true });
      } }, icoon('plus', 15), `${enk} toevoegen`),
      foutEl(pad));
  };
  teken();
  wrap._teken = teken;
  const af = bus.op('herteken-veld', (p) => { if (!wrap.isConnected) return af(); if (p === pad) teken(); });
  return wrap;
}

function samenvatting(veld, item) {
  if (!item || typeof item !== 'object') return '';
  const delen = [];
  for (const v of veld.velden || []) {
    if (v.pad === veld.itemLabel || !zichtbaar(v)) continue;
    const w = item[v.pad];
    if (v.type === 'lijst' && Array.isArray(w)) { delen.push(`${w.length} ${(w.length === 1 ? enkelvoud(v.label) : v.label).toLowerCase()}`); continue; }
    if (w == null || w === '' || typeof w === 'object') continue;
    if (v.type === 'prijs') delen.push(`€ ${w}`);
    else if (v.type === 'schakelaar') { if (w) delen.push(v.label); }
    else if (['tekst', 'keuze', 'datum', 'getal', 'telefoon', 'email'].includes(v.type)) delen.push(String(w));
    if (delen.length >= 2) break;
  }
  return delen.join(' · ');
}

function maakItem(veld, lijstPad, i, item, totaal, ctx, herteken) {
  const pad = `${lijstPad}.${i}`;
  const open = staat.openItems.has(pad);
  const titel = h('span', { class: 'item-titel' }, itemTitel(veld, item, i));
  const sub = h('span', { class: 'item-sub' }, samenvatting(veld, item));
  const lijfId = id(pad) + '-lijf';
  const schakel = h('button', { type: 'button', class: 'item-schakel', 'aria-expanded': String(open), 'aria-controls': lijfId, onclick: () => {
    const nu = !li.classList.contains('open');
    if (nu) staat.openItems.add(pad); else staat.openItems.delete(pad);
    li.classList.toggle('open', nu);
    schakel.setAttribute('aria-expanded', String(nu));
    if (nu && !lijf.firstChild) vulLijf();
  } }, icoon('rechts', 14, 'item-pijl'), h('span', { class: 'item-tekst' }, titel, sub));
  const enk = enkelvoud(veld.label);
  const naam = () => itemTitel(veld, lees(staat.inhoud, pad), i);
  const actie = (ic, label, fn, uit) => h('button', { type: 'button', class: 'knop-icoon klein', title: label, 'aria-label': `${label}: ${naam()}`, disabled: uit, onclick: fn }, icoon(ic, 15));
  const verplaats = (naar, focusGreep = false) => {
    if (naar < 0 || naar >= totaal) return;
    bewerk((inh) => { const l = lees(inh, lijstPad); const [x] = l.splice(i, 1); l.splice(naar, 0, x); }, { pad: lijstPad });
    verschuifOpen(lijstPad, i, naar);
    herteken();
    const doel = document.querySelector(`.item[data-pad="${CSS.escape(`${lijstPad}.${naar}`)}"]`);
    (focusGreep ? doel?.querySelector('.greep') : doel?.querySelector(`[aria-label^="${naar < i ? 'Omhoog' : 'Omlaag'}"]`) || doel?.querySelector('.greep'))?.focus();
  };
  const acties = h('div', { class: 'item-acties' },
    actie('omhoog', 'Omhoog', () => verplaats(i - 1), i === 0),
    actie('omlaag', 'Omlaag', () => verplaats(i + 1), i === totaal - 1),
    actie('kopie', 'Dupliceren', () => {
      if (veld.max && totaal >= veld.max) return meld(`Maximaal ${veld.max} items`, { soort: 'waarschuwing' });
      bewerk((inh) => { const l = lees(inh, lijstPad); l.splice(i + 1, 0, JSON.parse(JSON.stringify(l[i]))); }, { pad: lijstPad });
      verschuifOpen(lijstPad, null, i + 1);
      staat.openItems.add(`${lijstPad}.${i + 1}`);
      herteken();
      meld(`${naam()} gedupliceerd`, { soort: 'goed', duur: 2200 });
    }),
    actie('prullenbak', 'Verwijderen', () => {
      if (veld.min && totaal <= veld.min) return meld(`Er moet minstens ${veld.min} overblijven.`, { soort: 'waarschuwing' });
      const weg = JSON.parse(JSON.stringify(lees(staat.inhoud, pad)));
      const titelWeg = naam();
      bewerk((inh) => lees(inh, lijstPad).splice(i, 1), { pad: lijstPad });
      verschuifOpen(lijstPad, i, null);
      herteken();
      meld(`${titelWeg || enk} verwijderd`, { actie: { label: 'Ongedaan maken', fn: () => {
        bewerk((inh) => { const l = lees(inh, lijstPad) || []; l.splice(Math.min(i, l.length), 0, weg); zet(inh, lijstPad, l); }, { pad: lijstPad });
        verschuifOpen(lijstPad, null, i);
        bus.stuur('herteken-veld', lijstPad);
      } } });
    }, veld.min && totaal <= veld.min));
  const greep = h('button', { type: 'button', class: 'greep', 'aria-label': `Verplaats ${naam()} (pijltjestoetsen of slepen)`, title: 'Sleep om te verplaatsen',
    onkeydown: (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); verplaats(i - 1, true); }
      if (e.key === 'ArrowDown') { e.preventDefault(); verplaats(i + 1, true); }
    } }, icoon('greep', 15));
  if (veld.sorteerbaar === false) greep.hidden = true;
  if (!veld.velden?.length) {
    // Lijst van gewone teksten (bv. ["Wifi", "Parking"]): één invoerveld per item.
    const input = h('input', { class: 'invoer', id: id(pad), value: typeof item === 'string' ? item : item == null ? '' : JSON.stringify(item), 'aria-label': `${enk} ${i + 1}`,
      oninput: (e) => { wijzig(pad, e.target.value); meldWijziging(input, pad); } });
    const li = h('li', { class: 'item primitief', dataset: { pad, index: String(i) } }, h('div', { class: 'item-kop' }, greep, input, acties));
    sleepbaar(greep, li, lijstPad, i, totaal, (naar) => {
      if (naar === i) return;
      bewerk((inh) => { const l = lees(inh, lijstPad); const [x] = l.splice(i, 1); l.splice(naar, 0, x); }, { pad: lijstPad });
      herteken();
    });
    return li;
  }
  const lijf = h('div', { class: 'item-lijf', id: lijfId, role: 'group', 'aria-label': naam() });
  const vulLijf = () => lijf.replaceChildren(maakVelden(veld.velden || [], pad, { ...ctx, item: pad }));
  const li = h('li', { class: 'item' + (open ? ' open' : ''), dataset: { pad, index: String(i) } },
    h('div', { class: 'item-kop' }, greep, schakel, acties), lijf);
  if (open) vulLijf();
  li.addEventListener('veld-wijzig', () => {
    const nu = lees(staat.inhoud, pad);
    titel.textContent = itemTitel(veld, nu, i);
    sub.textContent = samenvatting(veld, nu);
  });
  sleepbaar(greep, li, lijstPad, i, totaal, (naar) => {
    if (naar === i) return;
    bewerk((inh) => { const l = lees(inh, lijstPad); const [x] = l.splice(i, 1); l.splice(naar, 0, x); }, { pad: lijstPad });
    verschuifOpen(lijstPad, i, naar);
    herteken();
  });
  return li;
}

// Open/dicht-toestand meeschuiven als items verplaatst, toegevoegd of verwijderd worden.
function verschuifOpen(lijstPad, van, naar) {
  const prefix = lijstPad + '.';
  const oud = [...staat.openItems];
  const nieuw = new Set();
  for (const p of oud) {
    if (!p.startsWith(prefix)) { nieuw.add(p); continue; }
    const rest = p.slice(prefix.length).split('.');
    let idx = Number(rest[0]);
    if (van != null && naar != null) { // verplaatsen
      if (idx === van) idx = naar;
      else if (van < naar && idx > van && idx <= naar) idx--;
      else if (van > naar && idx >= naar && idx < van) idx++;
    } else if (van != null) { // verwijderen
      if (idx === van) continue;
      if (idx > van) idx--;
    } else if (naar != null) { // invoegen
      if (idx >= naar) idx++;
    }
    rest[0] = String(idx);
    nieuw.add(prefix + rest.join('.'));
  }
  staat.openItems = nieuw;
}

// Slepen met muis of vinger op de greep.
function sleepbaar(greep, li, lijstPad, i, totaal, klaar) {
  greep.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const ol = li.parentElement;
    const items = [...ol.children];
    const rects = items.map((x) => x.getBoundingClientRect());
    const startY = e.clientY;
    const hoogte = rects[i].height + 6;
    let naar = i;
    greep.setPointerCapture(e.pointerId);
    li.classList.add('sleept');
    ol.classList.add('bezig-slepen');
    const beweeg = (ev) => {
      const dy = ev.clientY - startY;
      li.style.transform = `translateY(${dy}px)`;
      const midden = rects[i].top + rects[i].height / 2 + dy;
      naar = i;
      for (let j = 0; j < items.length; j++) {
        if (j === i) continue;
        const m = rects[j].top + rects[j].height / 2;
        if (j < i && midden < m) { naar = Math.min(naar, j); }
        if (j > i && midden > m) { naar = Math.max(naar, j); }
      }
      items.forEach((x, j) => {
        if (j === i) return;
        let d = 0;
        if (i < naar && j > i && j <= naar) d = -hoogte;
        if (i > naar && j < i && j >= naar) d = hoogte;
        x.style.transform = d ? `translateY(${d}px)` : '';
      });
    };
    const los = () => {
      greep.removeEventListener('pointermove', beweeg);
      greep.removeEventListener('pointerup', los);
      greep.removeEventListener('pointercancel', los);
      items.forEach((x) => { x.style.transform = ''; });
      li.classList.remove('sleept');
      ol.classList.remove('bezig-slepen');
      klaar(naar);
    };
    greep.addEventListener('pointermove', beweeg);
    greep.addEventListener('pointerup', los);
    greep.addEventListener('pointercancel', los);
  });
}

const MAKERS = {
  tekst: (v, p, c) => tekstVeld(v, p, c),
  email: (v, p, c) => tekstVeld(v, p, c, { type: 'email', inputmode: 'email', autocomplete: 'email' }),
  telefoon: (v, p, c) => tekstVeld(v, p, c, { type: 'tel', inputmode: 'tel', autocomplete: 'tel' }),
  url: (v, p, c) => tekstVeld(v, p, c, { type: 'url', inputmode: 'url' }),
  getal: (v, p, c) => tekstVeld(v, p, c, { inputmode: 'decimal' }),
  prijs: (v, p, c) => tekstVeld(v, p, c, { inputmode: 'decimal', voorvoegsel: '€' }),
  tekstvak, rijk, schakelaar, keuze, datum, pagina,
  kleur: (v, p) => kleurVeld(v, p),
  afbeelding, groep, lijst,
};

// ---------- naar een veld springen ----------
export function focusVeld(pad, { flits = true } = {}) {
  const el = document.querySelector(`#hoofd [data-pad="${CSS.escape(pad)}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const doel = el.matches('.item') ? el.querySelector('.item-schakel') || el.querySelector('input') : el.querySelector('input:not([type=file]):not([type=color]), textarea, select, .schakelaar, .seg-knop[aria-checked=true], .seg-knop, .beeld-mini, .item-schakel, button');
  doel?.focus({ preventScroll: true });
  if (flits) { el.classList.remove('flits'); void el.offsetWidth; el.classList.add('flits'); setTimeout(() => el.classList.remove('flits'), 1600); }
  return true;
}

// Alle zichtbare velden in het formulier opnieuw valideren; geeft het aantal fouten.
export function valideerZichtbaar(root = document) {
  let n = 0;
  for (const w of $$('.veld', root)) { if (w._check) { w._check(); if (w.classList.contains('heeft-fout')) n++; } }
  return n;
}
