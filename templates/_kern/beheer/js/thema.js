// Thema: de kleuren van de site, met contrastcontrole en terug naar standaard.
import { h, $$, meld } from './ui.js';
import { icoon } from './iconen.js';
import { staat, wijzig, bewerk } from './staat.js';
import { kleurVeld } from './velden.js';
import { contrast, contrastTekst, themaParen, geldigHex, isDonker } from './kleur.js';
import { themaLabel } from './schema.js';

export const heeftThema = () => (staat.bron?.template?.thema?.kleuren || []).length > 0;
let beginwaarden = null;
const standaard = (k) => k.standaard || beginwaarden?.[k.sleutel] || '';

export function toonThema(root) {
  const defs = staat.bron.template.thema.kleuren;
  beginwaarden ||= { ...(staat.opgeslagen?.thema?.kleuren || {}) };
  const staal = h('div', { class: 'thema-staal', 'aria-hidden': 'true' });
  const paren = h('div', { class: 'thema-paren' });
  const tekenStaal = () => {
    const k = staat.inhoud.thema?.kleuren || {};
    const achter = Object.keys(k).find((x) => /achtergrond|bg/i.test(x));
    const tekst = Object.keys(k).find((x) => /tekst|text/i.test(x));
    const accent = Object.keys(k).find((x) => /accent|primair|merk/i.test(x));
    const a = k[achter] || '#ffffff', t = k[tekst] || '#111111', c = k[accent] || t;
    staal.style.background = a;
    staal.style.color = t;
    staal.replaceChildren(
      h('span', { class: 'staal-klein', style: { color: c } }, staat.inhoud.site?.slogan || 'Zo ziet je site eruit'),
      h('strong', null, staat.inhoud.site?.naam || 'Je zaak'),
      h('span', null, 'Gewone tekst op je achtergrond, zoals bezoekers ze lezen.'),
      h('span', { class: 'staal-knop', style: { background: c, color: isDonker(c) ? '#fff' : '#111' } }, 'Een knop'));
    paren.replaceChildren(...themaParen(k).map((p) => {
      const cc = contrast(k[p.voor], k[p.achter]);
      const niv = cc == null ? 'onbekend' : cc >= p.min ? 'goed' : cc >= 3 ? 'let-op' : 'slecht';
      return h('div', { class: `paar niveau-${niv}` },
        h('span', { class: 'chip-staal', style: { background: k[p.achter] } }, h('span', { style: { color: k[p.voor] } }, 'Aa')),
        h('span', null, `${themaLabel(p.voor)} op ${themaLabel(p.achter).toLowerCase()}`),
        h('strong', null, contrastTekst(cc)),
        h('span', { class: 'chip-oordeel' }, niv === 'goed' ? 'Goed leesbaar' : niv === 'let-op' ? 'Alleen voor grote tekst' : 'Slecht leesbaar'));
    }));
  };
  const velden = defs.map((d) => {
    const pad = `thema.kleuren.${d.sleutel}`;
    const w = kleurVeld({ pad, type: 'kleur', label: d.label || d.sleutel, hulp: d.hulp }, pad);
    w.classList.add('veld', 'veld-kleur');
    w.dataset.pad = pad;
    const std = standaard(d);
    if (std) w.querySelector('.veld-kop').append(h('button', { type: 'button', class: 'knop-link klein', title: `Standaard: ${std}`, onclick: () => {
      wijzig(pad, std, { samenvoegen: false });
      toonThema(root);
    } }, icoon('ongedaan', 12), 'Standaard'));
    return w;
  });
  const lijst = h('div', { class: 'velden' }, velden);
  lijst.addEventListener('veld-wijzig', () => { tekenStaal(); for (const v of velden) v._vulChips?.(); });
  root.replaceChildren(h('div', { class: 'formulier' },
    h('div', { class: 'pagina-kop' },
      h('div', null, h('h1', null, 'Thema'), h('p', { class: 'pagina-uitleg' }, 'De kleuren van je site. Je ziet elke wijziging meteen in het voorbeeld. Let op het contrast: tekst moet voor iedereen goed leesbaar blijven.')),
      h('button', { class: 'knop', onclick: () => {
        bewerk((inh) => { inh.thema ||= {}; inh.thema.kleuren ||= {}; for (const d of defs) { const s = standaard(d); if (s) inh.thema.kleuren[d.sleutel] = s; } });
        meld('Kleuren teruggezet naar de standaard', { soort: 'goed' });
        toonThema(root);
      } }, icoon('ongedaan', 15), 'Alles naar standaard')),
    staal, lijst,
    h('section', { class: 'kaart-blok' }, h('h2', { class: 'blok-titel' }, 'Leesbaarheid'), h('p', { class: 'pagina-uitleg' }, 'Gewone tekst heeft minstens 4,5:1 nodig, knoppen en grote titels 3:1 (WCAG).'), paren)));
  tekenStaal();
}
