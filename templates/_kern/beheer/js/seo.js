// Vindbaarheid: SEO-velden, Google-zoekresultaat en deelpreview per pagina.
import { h, $$, bus } from './ui.js';
import { icoon } from './iconen.js';
import { staat, wijzig, bewerk } from './staat.js';
import { sectiesVan, lees, paginaNaam, zichtbaar } from './schema.js';
import { maakVelden } from './velden.js';
import { paginas, kopGegevens, renderPagina } from './render.js';
import { mediaVoorbeeld } from './media.js';
import { voorstelTitel, voorstelBeschrijving } from './analyse.js';

let gekozen = 'index.html';

// Afkappen op pixelbreedte zoals Google (titel ±600 px in 20px Arial).
const meet = (() => {
  const c = document.createElement('canvas').getContext('2d');
  return (t, font) => { c.font = font; return c.measureText(t).width; };
})();
function kapPixels(t, max, font) {
  if (meet(t, font) <= max) return { tekst: t, afgekapt: false };
  let lo = 0, hi = t.length;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (meet(t.slice(0, m) + ' …', font) <= max) lo = m; else hi = m - 1; }
  let k = t.slice(0, lo);
  const sp = k.lastIndexOf(' ');
  if (sp > lo * 0.7) k = k.slice(0, sp);
  return { tekst: k.replace(/[\s,.;:–|-]+$/, '') + ' …', afgekapt: true };
}
function kapTekens(t, n) {
  if (t.length <= n) return { tekst: t, afgekapt: false };
  const k = t.slice(0, n);
  const sp = k.lastIndexOf(' ');
  return { tekst: (sp > n * 0.7 ? k.slice(0, sp) : k).replace(/[\s,.;:–-]+$/, '') + ' …', afgekapt: true };
}

export function googlePreview(bestand) {
  const k = kopGegevens(staat.inhoud, bestand);
  const s = staat.inhoud.site || {};
  const domein = (s.domein || location.host).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const pad = k.url.split('/').filter(Boolean);
  const t = kapPixels(k.titel || s.naam || 'Zonder titel', 580, '20px Arial');
  const b = kapTekens(k.beschrijving || 'Google kiest zelf een stukje tekst van je pagina, omdat er geen beschrijving is.', 158);
  const favicon = s.favicon || s.logo;
  return h('div', { class: 'google' },
    h('div', { class: 'google-kop' },
      h('span', { class: 'google-icoon' }, favicon ? h('img', { src: mediaVoorbeeld(favicon), alt: '' }) : (s.naam || '?').charAt(0).toUpperCase()),
      h('span', { class: 'google-site' }, h('span', { class: 'google-naam' }, s.naam || domein), h('span', { class: 'google-url' }, `https://${domein}${pad.length ? ' › ' + pad.join(' › ') : ''}`)),
      h('span', { class: 'google-meer', 'aria-hidden': 'true' }, '⋮')),
    h('div', { class: 'google-titel' }, t.tekst),
    h('div', { class: 'google-tekst' + (k.beschrijving ? '' : ' leeg') }, b.tekst),
    h('div', { class: 'google-oordeel' },
      oordeel(k.titel.length, 30, 60, 'Titel'), oordeel(k.beschrijving.length, 70, 155, 'Beschrijving'),
      t.afgekapt ? h('span', { class: 'oordeel let-op' }, icoon('waarschuwing', 12), 'Titel wordt afgekapt') : null));
}
function oordeel(n, min, max, label) {
  const niveau = n === 0 ? 'slecht' : n < min ? 'let-op' : n > max ? 'let-op' : 'goed';
  return h('span', { class: `oordeel ${niveau}` }, icoon(niveau === 'goed' ? 'check' : 'waarschuwing', 12), `${label}: ${n} tekens`);
}

export function deelPreview(bestand) {
  const k = kopGegevens(staat.inhoud, bestand);
  const s = staat.inhoud.site || {};
  const beeld = staat.inhoud.seo?.afbeelding;
  const domein = (s.domein || location.host).replace(/^https?:\/\//, '');
  const img = beeld ? h('img', { src: mediaVoorbeeld(beeld), alt: '' }) : h('div', { class: 'deel-geen' }, icoon('media', 22), h('span', null, 'Geen deelafbeelding'));
  return h('div', { class: 'deel' },
    h('div', { class: 'deel-label' }, 'WhatsApp'),
    h('div', { class: 'wa' },
      h('div', { class: 'wa-bel' },
        h('div', { class: 'wa-kaart' },
          h('div', { class: 'wa-beeld' }, img.cloneNode(true)),
          h('div', { class: 'wa-tekst' }, h('strong', null, kapTekens(k.titel, 70).tekst), h('span', null, kapTekens(k.beschrijving, 90).tekst), h('small', null, domein))),
        h('div', { class: 'wa-link' }, k.volledig.replace(/^https?:\/\/[^/]+/, 'https://' + domein)),
        h('div', { class: 'wa-tijd' }, new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })))),
    h('div', { class: 'deel-label' }, 'Facebook en LinkedIn'),
    h('div', { class: 'fb' },
      h('div', { class: 'fb-beeld' }, img),
      h('div', { class: 'fb-tekst' }, h('small', null, domein.toUpperCase()), h('strong', null, kapTekens(k.titel, 88).tekst), h('span', null, kapTekens(k.beschrijving, 110).tekst))),
    !beeld ? h('p', { class: 'stil klein' }, 'Tip: kies hierboven een deelafbeelding van 1200 × 630 px.') : null);
}

export function toonSeo(root, { focus } = {}) {
  if (focus) gekozen = focus;
  const lijst = paginas();
  if (!lijst.some((p) => p.bestand === gekozen)) gekozen = lijst[0]?.bestand || 'index.html';
  const vb = h('div', { class: 'seo-voorbeeld' });
  const tabs = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Soort voorbeeld' });
  let soort = 'google';
  const tekenVb = () => {
    vb.replaceChildren(h('div', { class: 'seo-vb-kop' }, h('strong', null, paginaNaam(gekozen)), h('span', { class: 'stil mono klein' }, kopGegevens(staat.inhoud, gekozen).url)), soort === 'google' ? googlePreview(gekozen) : deelPreview(gekozen));
    $$('.seo-pagina', root).forEach((k) => k.classList.toggle('gekozen', k.dataset.bestand === gekozen));
  };
  for (const [k, l] of [['google', 'Google'], ['delen', 'Delen']]) tabs.append(h('button', { class: 'seg-knop', role: 'tab', 'aria-selected': String(k === soort), onclick: (e) => { soort = k; for (const b of tabs.children) b.setAttribute('aria-selected', String(b === e.currentTarget)); tekenVb(); } }, l));

  // Algemene velden (zonder de lijst per pagina, die krijgt hieronder een eigen weergave).
  const secties = sectiesVan('seo');
  const algemeen = secties.map((s) => h('section', { class: 'kaart-blok' },
    h('h2', { class: 'blok-titel' }, s.id === 'seo' ? 'Algemeen' : s.titel),
    s.beschrijving && s.id !== 'seo' ? h('p', { class: 'pagina-uitleg' }, s.beschrijving) : null,
    maakVelden(s.velden.filter((v) => !['seo.paginas', 'seo.titel', 'seo.beschrijving'].includes(v.pad) && zichtbaar(v)), '', { sectie: s })));

  const perPagina = h('section', { class: 'kaart-blok' },
    h('h2', { class: 'blok-titel' }, 'Per pagina'),
    h('p', { class: 'pagina-uitleg' }, 'Geef elke pagina een eigen titel en beschrijving. Laat leeg om de algemene te gebruiken.'),
    h('div', { class: 'seo-paginas' }, lijst.map((p) => paginaKaart(p.bestand, () => { gekozen = p.bestand; tekenVb(); }, tekenVb))));

  root.replaceChildren(h('div', { class: 'seo-vak' },
    h('div', { class: 'formulier' },
      h('div', { class: 'pagina-kop' }, h('div', null, h('h1', null, 'Vindbaarheid'), h('p', { class: 'pagina-uitleg' }, 'Hoe je site verschijnt in Google en wanneer iemand een link deelt via WhatsApp of Facebook.'))),
      algemeen, perPagina),
    h('aside', { class: 'seo-zij' }, h('div', { class: 'seo-zij-plak' }, tabs, vb))));
  tekenVb();
  root.addEventListener('veld-wijzig', () => tekenVb());
  root.addEventListener('focusin', (e) => {
    const k = e.target.closest('.seo-pagina');
    if (k && k.dataset.bestand !== gekozen) { gekozen = k.dataset.bestand; tekenVb(); }
    else if (!k && e.target.closest('[data-pad^="seo."]') && gekozen !== 'index.html') { gekozen = 'index.html'; tekenVb(); }
  });
}

function paginaKaart(bestand, kies, opWijzig) {
  const start = bestand === 'index.html';
  const idx = () => (staat.inhoud.seo?.paginas || []).findIndex((p) => p.pagina === bestand);
  const veldPad = (k) => (start ? `seo.${k}` : idx() >= 0 ? `seo.paginas.${idx()}.${k}` : null);
  const waarde = (k) => { const p = veldPad(k); return p ? lees(staat.inhoud, p) || '' : ''; };
  const schrijf = (k, v) => {
    let p = veldPad(k);
    if (!p) {
      bewerk((inh) => { inh.seo ||= {}; inh.seo.paginas ||= []; inh.seo.paginas.push({ pagina: bestand, titel: '', beschrijving: '' }); });
      p = veldPad(k);
    }
    wijzig(p, v);
  };
  let doc = null;
  const docVan = () => { if (!doc) { try { doc = new DOMParser().parseFromString(renderPagina(staat.inhoud, bestand), 'text/html'); } catch { doc = document.implementation.createHTMLDocument(''); } } return doc; };
  const k = kopGegevens(staat.inhoud, bestand);
  const rij = (sleutel, label, max, aanbevolen, tekstvak) => {
    const tel = h('span', { class: 'teller' });
    const zet = (n) => { tel.textContent = `${n} / ${max}`; tel.dataset.niveau = n === 0 ? '' : n < aanbevolen[0] ? 'let-op' : n > aanbevolen[1] ? 'slecht' : 'goed'; };
    const plaats = sleutel === 'titel' ? (start ? '' : `Leeg: "${k.titel}"`) : (start ? '' : 'Leeg: de algemene beschrijving');
    const id = `seo-${bestand.replace(/\W/g, '_')}-${sleutel}`;
    const opInput = (e) => { schrijf(sleutel, e.target.value); zet(e.target.value.length); e.target.dispatchEvent(new CustomEvent('veld-wijzig', { bubbles: true })); if (tekstvak) { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 2 + 'px'; } };
    const veld = tekstvak
      ? h('textarea', { id, class: 'invoer', rows: 2, value: waarde(sleutel), placeholder: plaats, oninput: opInput })
      : h('input', { id, class: 'invoer', value: waarde(sleutel), placeholder: plaats, oninput: opInput });
    zet(waarde(sleutel).length);
    const voorstel = h('button', { type: 'button', class: 'knop-link klein', title: 'Stel een tekst voor op basis van je pagina', onclick: () => {
      const v = sleutel === 'titel' ? voorstelTitel(staat.inhoud, bestand, docVan()) : voorstelBeschrijving(staat.inhoud, bestand, docVan());
      veld.value = v;
      veld.dispatchEvent(new Event('input', { bubbles: true }));
      veld.focus();
    } }, icoon('vonk', 12), 'Voorstel');
    return h('div', { class: 'veld', dataset: { pad: veldPad(sleutel) || `seo-pagina:${bestand}:${sleutel}` } },
      h('div', { class: 'veld-kop' }, h('label', { class: 'veld-label', for: id }, label), voorstel, tel), veld);
  };
  return h('div', { class: 'seo-pagina', dataset: { bestand } },
    h('button', { type: 'button', class: 'seo-pagina-kop', onclick: kies, 'aria-label': `Toon voorbeeld van ${paginaNaam(bestand)}` },
      icoon('pagina', 15), h('strong', null, paginaNaam(bestand)), h('span', { class: 'mono stil klein' }, k.url), h('span', { class: 'spacer' }), h('span', { class: 'stil klein' }, 'Voorbeeld', icoon('rechts', 12))),
    h('div', { class: 'velden' },
      rij('titel', start ? 'Titel in Google' : 'Titel', 60, [20, 60], false),
      rij('beschrijving', 'Beschrijving', 160, [70, 155], true)));
}

