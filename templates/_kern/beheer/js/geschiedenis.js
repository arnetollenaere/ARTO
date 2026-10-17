// Geschiedenis: elke opslag is een versie. Bekijken, vergelijken en terugzetten.
import { h, meld, bevestig, geleden, datumLang, bus } from './ui.js';
import { icoon } from './iconen.js';
import { api } from './api.js';
import { staat, vervang, verschillen } from './staat.js';
import { labelVoor, vindVeld, paginaNaam, itemTitel } from './schema.js';
import { mediaVoorbeeld } from './media.js';
import { nietIngesteld } from './hulp.js';
import { app } from './ctx.js';

export async function laadVersies() {
  const r = await api('geschiedenis');
  staat.versies = r.versies || [];
  return staat.versies;
}
// "Beheer: menukaart bijgewerkt (klant)" -> { tekst, wie }
export function leesBericht(b = '') {
  const m = String(b).match(/^(?:Beheer:\s*)?(.*?)(?:\s*\((klant|arto)\))?$/i);
  const tekst = (m?.[1] || b).trim();
  return { tekst: tekst.charAt(0).toUpperCase() + tekst.slice(1), wie: m?.[2] ? (m[2].toLowerCase() === 'arto' ? 'ARTO' : 'Klant') : /^beheer/i.test(b) ? null : 'ARTO (code)' };
}

const cacheVersie = new Map();
async function haalVersie(sha) {
  if (!cacheVersie.has(sha)) cacheVersie.set(sha, api('geschiedenis/versie', { query: { sha } }).then((r) => r.inhoud).catch((e) => { cacheVersie.delete(sha); throw e; }));
  return cacheVersie.get(sha);
}

let gekozen = null;

export async function toonGeschiedenis(root) {
  const lijst = h('ol', { class: 'tijdlijn', 'aria-label': 'Versies' });
  const detail = h('section', { class: 'versie-detail', 'aria-live': 'polite' });
  const vak = h('div', { class: 'geschiedenis' }, lijst, detail);
  root.replaceChildren(h('div', { class: 'formulier breed' },
    h('div', { class: 'pagina-kop' }, h('div', null, h('h1', null, 'Geschiedenis'), h('p', { class: 'pagina-uitleg' }, 'Elke keer dat iemand opslaat, bewaren we een versie. Bekijk wat er veranderde en zet een oude versie terug als het nodig is.'))),
    vak));

  const teken = () => {
    const v = staat.versies || [];
    if (!v.length) { lijst.replaceChildren(h('li', { class: 'leeg-staat klein' }, icoon('geschiedenis', 24), h('p', null, 'Nog geen versies. Na de eerste keer opslaan verschijnt hier de geschiedenis.'))); return; }
    lijst.replaceChildren(...v.map((x, i) => {
      const b = leesBericht(x.bericht);
      return h('li', { class: 'tijdlijn-item' + (gekozen === x.sha ? ' gekozen' : '') },
        h('button', { class: 'tijdlijn-knop', 'aria-pressed': String(gekozen === x.sha), onclick: () => kies(x, i) },
          h('span', { class: 'tijdlijn-punt' + (i === 0 ? ' nu' : '') }),
          h('span', { class: 'tijdlijn-tekst' },
            h('strong', null, b.tekst || 'Inhoud bijgewerkt'),
            h('span', { class: 'stil klein' }, i === 0 ? h('span', { class: 'tag tag-signaal' }, 'Huidige versie') : null, b.wie ? h('span', { class: 'tag' }, b.wie) : null, h('time', { datetime: x.datum, title: datumLang(x.datum) }, geleden(x.datum))))));
    }));
  };
  const kies = async (x, i) => {
    gekozen = x.sha;
    teken();
    vak.classList.add('met-open');
    const b = leesBericht(x.bericht);
    detail.replaceChildren(h('div', { class: 'detail-kop' },
      h('button', { class: 'knop-icoon terug-knop', 'aria-label': 'Terug', onclick: () => { gekozen = null; vak.classList.remove('met-open'); teken(); app.preview?.toonVersie(null); } }, icoon('terug', 16)),
      h('div', null, h('h2', null, b.tekst), h('span', { class: 'stil klein' }, datumLang(x.datum), b.wie ? ` · ${b.wie}` : ''))),
    h('div', { class: 'skelet-blok' }));
    let inhoud;
    try { inhoud = await haalVersie(x.sha); } catch (e) { detail.append(h('p', { class: 'fout-tekst' }, e.message)); return; }
    if (gekozen !== x.sha) return;
    const diff = verschillen(inhoud, staat.inhoud);
    const knoppen = h('div', { class: 'detail-knoppen' },
      h('button', { class: 'knop', onclick: () => { app.preview?.toonVersie(inhoud, `versie van ${datumLang(x.datum)}`); app.zetPreviewZichtbaar(true); } }, icoon('oog', 15), 'Bekijk in voorbeeld'),
      i === 0 && !diff.length ? null : h('button', { class: 'knop knop-primair', disabled: staat.alleenLezen, onclick: async () => {
        if (!(await bevestig('Deze versie terugzetten?', `De inhoud van ${datumLang(x.datum)} wordt geladen als niet-opgeslagen wijziging. Je kan alles nog nakijken voor je opslaat.`, 'Terugzetten'))) return;
        vervang(inhoud, 'versie teruggezet');
        app.preview?.toonVersie(null);
        meld('Versie teruggezet. Klik op Opslaan om ze te publiceren.', { soort: 'goed', actie: { label: 'Opslaan', fn: () => app.opslaan({ bericht: `versie van ${new Date(x.datum).toLocaleString('nl-BE')} teruggezet` }) } });
        kies(x, i);
      } }, icoon('ongedaan', 15), 'Terugzetten'));
    detail.replaceChildren(detail.firstChild, knoppen,
      h('h3', { class: 'blok-titel' }, diff.length ? `${diff.length} ${diff.length === 1 ? 'verschil' : 'verschillen'} met nu` : 'Geen verschillen met de huidige inhoud'),
      diff.length ? verschilLijst(diff, inhoud) : h('p', { class: 'stil' }, i === 0 ? 'Dit is de versie die nu online staat.' : 'Deze versie is gelijk aan wat je nu hebt.'));
  };

  lijst.replaceChildren(...Array.from({ length: 5 }, () => h('li', { class: 'tijdlijn-item skelet' })));
  try {
    await laadVersies();
    teken();
    const nu = staat.versies.findIndex((x) => x.sha === gekozen);
    if (nu >= 0) kies(staat.versies[nu], nu);
    else detail.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('geschiedenis', 26), h('p', null, 'Kies een versie om te zien wat er toen anders was.')));
  } catch (e) {
    if (e.nietIngesteld) vak.replaceChildren(nietIngesteld('opslaan', { blok: true }));
    else lijst.replaceChildren(h('li', { class: 'leeg-staat' }, icoon('waarschuwing', 24), h('p', null, e.message)));
  }
}

// Verschillen leesbaar tonen, gegroepeerd per sectie. "Toen" = versie, "Nu" = huidige werkkopie.
export function verschilLijst(diff, oudeInhoud, { kolommen = ['Toen', 'Nu'] } = {}) {
  const groepen = new Map();
  for (const d of diff) {
    const v = vindVeld(d.pad);
    const sectie = v?.sectie?.titel || 'Overig';
    (groepen.get(sectie) || groepen.set(sectie, []).get(sectie)).push({ ...d, v });
  }
  return h('div', { class: 'verschillen' }, [...groepen.entries()].map(([sectie, l]) => h('section', { class: 'verschil-groep' },
    h('h4', null, sectie),
    h('ul', null, l.map((d) => {
      const inhoudVoorLabel = d.soort === 'verwijderd' ? oudeInhoud : staat.inhoud;
      let label = d.v ? labelVoor(d.pad, inhoudVoorLabel) : d.pad;
      if (label.startsWith(sectie + ' › ')) label = label.slice(sectie.length + 3);
      return h('li', { class: `verschil soort-${d.soort}` },
        h('div', { class: 'verschil-label' }, h('span', { class: 'tag' }, { gewijzigd: 'Gewijzigd', toegevoegd: 'Toegevoegd', verwijderd: 'Verwijderd' }[d.soort]), label),
        h('div', { class: 'verschil-waarden' },
          h('div', { class: 'oud' }, h('small', null, kolommen[0]), waarde(d.oud, d.v?.veld)),
          icoon('pijl', 14, 'stil'),
          h('div', { class: 'nieuw' }, h('small', null, kolommen[1]), waarde(d.nieuw, d.v?.veld))));
    })))));
}

function waarde(w, veld) {
  if (w === undefined || w === null || w === '') return h('em', { class: 'stil' }, 'leeg');
  if (typeof w === 'boolean') return h('span', null, w ? 'Aan' : 'Uit');
  if (veld?.type === 'kleur' || /^#[0-9a-f]{3,6}$/i.test(w)) return h('span', { class: 'kleur-mini' }, h('span', { style: { background: w } }), String(w));
  if (veld?.type === 'afbeelding' && typeof w === 'string') return h('span', { class: 'beeld-mini-diff' }, h('img', { src: mediaVoorbeeld(w), alt: '' }), w.split('/').pop());
  if (veld?.type === 'pagina') return h('span', null, paginaNaam(w));
  if (typeof w === 'object') {
    if (veld?.type === 'lijst' && !Array.isArray(w)) return h('span', null, itemTitel(veld, w, 0));
    if (Array.isArray(w)) return h('span', null, `${w.length} item(s)`);
    const t = Object.values(w).find((x) => typeof x === 'string' && x);
    return h('span', null, t || 'item');
  }
  const s = String(w);
  return h('span', { class: 'verschil-tekst' }, s.length > 220 ? s.slice(0, 220) + '…' : s);
}

bus.op('opgeslagen', () => { staat.versies = null; });
