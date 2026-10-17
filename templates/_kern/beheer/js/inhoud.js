// Inhoud bewerken: formulier per sectie, en (op gsm) een overzicht van alle secties.
import { h } from './ui.js';
import { icoon } from './iconen.js';
import { staat, wijzigingen } from './staat.js';
import { editorGroepen, sectiesVan, groepNaam, zichtbaar } from './schema.js';
import { maakVelden } from './velden.js';
import { renderPagina, paginas } from './render.js';
import { app } from './ctx.js';

const SECTIE_ICOON = { site: 'inhoud', mededeling: 'mededeling', contact: 'telefoon', openingsuren: 'klok', socials: 'globe' };
export const sectieIcoon = (s) => SECTIE_ICOON[s.id] || (s.groep === 'gegevens' ? 'gegevens' : 'pagina');

export function alleEditorSecties() {
  return editorGroepen().flatMap((g) => sectiesVan(g));
}

// Welke secties hebben niet-opgeslagen wijzigingen?
export function gewijzigdeSecties() {
  const uit = new Set();
  const w = wijzigingen();
  for (const s of staat.schema) {
    if (w.some((d) => s.velden.some((v) => d.pad === v.pad || d.pad.startsWith(v.pad + '.') || v.pad.startsWith(d.pad + '.')))) uit.add(s.id);
  }
  if (w.some((d) => d.pad.startsWith('thema.'))) uit.add('__thema');
  return uit;
}

export function toonSectieLijst(root) {
  const gew = gewijzigdeSecties();
  root.replaceChildren(h('div', { class: 'formulier' },
    h('div', { class: 'pagina-kop' }, h('div', null, h('h1', null, 'Inhoud'), h('p', { class: 'pagina-uitleg' }, 'Kies wat je wil aanpassen. Je ziet het resultaat meteen in het voorbeeld.'))),
    editorGroepen().map((g) => h('section', { class: 'kaart-groep' },
      h('h2', { class: 'groep-kop' }, groepNaam(g)),
      h('div', { class: 'kaart-lijst' }, sectiesVan(g).map((s) => h('a', { class: 'sectie-kaart', href: `#/inhoud/${s.id}` },
        h('span', { class: 'sectie-icoon' }, icoon(sectieIcoon(s), 18)),
        h('span', { class: 'sectie-tekst' }, h('strong', null, s.titel, gew.has(s.id) ? h('span', { class: 'punt-gewijzigd', title: 'Niet-opgeslagen wijzigingen' }) : null), s.beschrijving ? h('span', null, s.beschrijving) : null),
        icoon('rechts', 16, 'stil'))))))));
}

export function toonSectie(root, sectie) {
  const lijst = alleEditorSecties();
  const i = lijst.findIndex((s) => s.id === sectie.id);
  const vorige = lijst[i - 1], volgende = lijst[i + 1];
  const zichtbareVelden = sectie.velden.filter(zichtbaar);
  root.replaceChildren(h('div', { class: 'formulier', dataset: { sectie: sectie.id } },
    h('div', { class: 'pagina-kop' },
      h('div', null,
        h('a', { class: 'kruimel', href: '#/inhoud' }, groepNaam(sectie.groep)),
        h('h1', null, sectie.titel),
        sectie.beschrijving ? h('p', { class: 'pagina-uitleg' }, sectie.beschrijving) : null)),
    staat.alleenLezen ? h('div', { class: 'waarschuwing-blok' }, icoon('slot', 16), h('div', null, 'Opslaan is nog niet ingesteld. Je kan rondkijken, maar wijzigingen kunnen niet bewaard worden.')) : null,
    maakVelden(zichtbareVelden, '', { sectie }),
    h('nav', { class: 'sectie-nav', 'aria-label': 'Vorige en volgende' },
      vorige ? h('a', { class: 'sectie-nav-link', href: `#/inhoud/${vorige.id}` }, icoon('links', 15), h('span', null, h('small', null, 'Vorige'), vorige.titel)) : h('span'),
      volgende ? h('a', { class: 'sectie-nav-link volgende', href: `#/inhoud/${volgende.id}` }, h('span', null, h('small', null, 'Volgende'), volgende.titel), icoon('rechts', 15)) : null)));
  // Toon in het voorbeeld een pagina waarop deze sectie staat.
  const p = paginaVoorSectie(sectie);
  if (p && app.preview && p !== app.preview.bestand) app.preview.toonPagina(p);
}

export function paginaVoorSectie(sectie) {
  const wortels = sectie.velden.map((v) => v.pad);
  const heeft = (best) => {
    try {
      const html = renderPagina(staat.inhoud, best, { markeer: true });
      return wortels.some((w) => html.includes(`data-pad="${w}"`) || html.includes(`data-pad="${w}.`));
    } catch { return false; }
  };
  if (app.preview && heeft(app.preview.bestand)) return app.preview.bestand;
  return paginas().map((p) => p.bestand).find(heeft) || null;
}
