// Instellingen en hulp: status van de koppeling, weergave, sneltoetsen, export/import en (voor ARTO) de JSON-editor.
import { h, meld, vraag, download, kbd, lsLees } from './ui.js';
import { icoon } from './iconen.js';
import { staat, vervang, verschillen } from './staat.js';
import { UITLEG } from './hulp.js';
import { verschilLijst } from './geschiedenis.js';
import { app } from './ctx.js';

export const SNELTOETSEN = [
  ['Mod+K', 'Zoeken en springen naar een sectie, veld of actie'],
  ['Mod+S', 'Opslaan'],
  ['Mod+Z', 'Ongedaan maken (buiten een tekstveld)'],
  ['Mod+Shift+Z', 'Opnieuw'],
  ['Mod+.', 'Voorbeeld tonen of verbergen'],
  ['Alt+1 … 9', 'Naar Overzicht, Inhoud, Vindbaarheid, Media, …'],
  ['?', 'Deze lijst met sneltoetsen'],
  ['Esc', 'Venster sluiten'],
];

export function toonInstellingen(root) {
  const s = staat.sessie || {};
  const c = s.configuratie || {};
  const arto = s.rol === 'arto';
  const rij = (ok, titel, sleutel, extra) => h('li', { class: 'status-rij ' + (ok ? 'ok' : 'nok') },
    h('span', { class: 'status-icoon' }, icoon(ok ? 'goed' : 'waarschuwing', 18)),
    h('div', null, h('strong', null, titel), h('p', null, ok ? extra || 'In orde.' : UITLEG[sleutel]?.kort),
      !ok && UITLEG[sleutel] ? h('details', { class: 'uitleg-details' }, h('summary', null, 'Hoe stel ik dit in?'), h('ol', { class: 'stappen' }, UITLEG[sleutel].stappen.map((x) => h('li', null, x)))) : null));
  const thema = lsLees('arto-weergave') || 'systeem';
  const weergave = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Weergave' },
    [['systeem', 'Automatisch', 'systeem'], ['licht', 'Licht', 'zon'], ['donker', 'Donker', 'maan']].map(([k, l, ic]) => h('button', { class: 'seg-knop', role: 'radio', 'aria-checked': String(thema === k), onclick: () => { app.zetWeergave(k); toonInstellingen(root); } }, icoon(ic, 14), l)));

  root.replaceChildren(h('div', { class: 'formulier' },
    h('div', { class: 'pagina-kop' }, h('div', null, h('h1', null, 'Instellingen en hulp'), h('p', { class: 'pagina-uitleg' }, `Je bent ingelogd als ${arto ? 'ARTO' : 'klant'}${s.modus === 'lokaal' ? ', op de lokale testserver' : ''}.`))),
    h('section', { class: 'kaart-blok' }, h('h2', { class: 'blok-titel' }, 'Koppeling'),
      h('ul', { class: 'status-lijst' },
        rij(c.wachtwoord, 'Inloggen met wachtwoord', 'wachtwoord', s.modus === 'lokaal' ? 'Lokaal werkt elk wachtwoord.' : null),
        rij(c.opslaan, 'Opslaan en publiceren', 'opslaan', c.repo ? `Wijzigingen gaan naar ${c.repo}.` : s.modus === 'lokaal' ? 'Lokaal: wijzigingen gaan rechtstreeks naar inhoud.json.' : null),
        rij(c.berichten, 'Berichten van het contactformulier', 'berichten'))),
    h('section', { class: 'kaart-blok' }, h('h2', { class: 'blok-titel' }, 'Weergave'), h('div', { class: 'rij-tussen' }, h('span', null, 'Kleur van het beheerpaneel'), weergave)),
    h('section', { class: 'kaart-blok' }, h('h2', { class: 'blok-titel' }, 'Sneltoetsen'),
      h('dl', { class: 'sneltoetsen' }, SNELTOETSEN.map(([t, l]) => [h('dt', null, kbd(t)), h('dd', null, l)]))),
    h('section', { class: 'kaart-blok' }, h('h2', { class: 'blok-titel' }, 'Gegevens'),
      h('p', { class: 'pagina-uitleg' }, 'Download alle inhoud als bestand (handig als reservekopie), of laad een eerder bestand terug.'),
      h('div', { class: 'detail-knoppen' },
        h('button', { class: 'knop', onclick: () => download('inhoud.json', JSON.stringify(staat.inhoud, null, 2) + '\n') }, icoon('download', 15), 'inhoud.json downloaden'),
        h('label', { class: 'knop', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter') e.currentTarget.querySelector('input').click(); } }, icoon('upload', 15), 'Bestand importeren',
          h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            try { await importeer(JSON.parse(await f.text())); } catch (err) { meld(`Dit bestand kan niet gelezen worden: ${err.message}`, { soort: 'fout' }); }
          } })))),
    arto ? jsonEditor() : null,
    h('p', { class: 'stil klein voetnoot' }, 'Beheerpaneel door ARTO · vragen? Mail of bel ons gerust.')));
}

async function importeer(nieuw) {
  const fout = controleer(nieuw);
  if (fout) throw new Error(fout);
  const diff = verschillen(staat.inhoud, nieuw);
  if (!diff.length) return meld('Dit bestand is gelijk aan de huidige inhoud.', { soort: 'info' });
  const ok = await vraag({ titel: 'Inhoud importeren?', tekst: `${diff.length} verschil(len). De inhoud komt bij je niet-opgeslagen wijzigingen.`, inhoud: verschilLijst(diff.slice(0, 60), staat.inhoud, { kolommen: ['Nu', 'Bestand'] }), breed: true,
    knoppen: [{ label: 'Annuleren', waarde: false }, { label: 'Importeren', waarde: true, soort: 'primair' }] });
  if (ok) { vervang(nieuw, 'import'); meld('Geïmporteerd. Kijk het na en sla op.', { soort: 'goed' }); }
}

function controleer(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return 'De inhoud moet een object zijn ({ … }).';
  if (!o.site || typeof o.site !== 'object') return 'De sleutel "site" ontbreekt.';
  for (const k of ['contact', 'seo', 'mededeling']) if (o[k] != null && typeof o[k] !== 'object') return `"${k}" moet een object zijn.`;
  for (const k of ['openingsuren', 'socials']) if (o[k] != null && !Array.isArray(o[k])) return `"${k}" moet een lijst zijn.`;
  return null;
}

function jsonEditor() {
  const ta = h('textarea', { class: 'invoer mono json-editor', spellcheck: 'false', rows: 22, value: JSON.stringify(staat.inhoud, null, 2), 'aria-label': 'Ruwe inhoud (JSON)' });
  const melding = h('div', { class: 'json-melding', 'aria-live': 'polite' });
  const lees = () => {
    try {
      const o = JSON.parse(ta.value);
      const f = controleer(o);
      if (f) throw new Error(f);
      melding.className = 'json-melding goed';
      melding.replaceChildren(icoon('goed', 14), `Geldig · ${verschillen(staat.inhoud, o).length} verschil(len) met de huidige inhoud`);
      return o;
    } catch (e) {
      const m = String(e.message).match(/position (\d+)/);
      let waar = '';
      if (m) { const voor = ta.value.slice(0, Number(m[1])); waar = ` (regel ${voor.split('\n').length}, kolom ${voor.length - voor.lastIndexOf('\n')})`; }
      melding.className = 'json-melding fout';
      melding.replaceChildren(icoon('fout', 14), `${e.message}${waar}`);
      return null;
    }
  };
  ta.addEventListener('input', () => lees());
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); }
  });
  return h('section', { class: 'kaart-blok' },
    h('h2', { class: 'blok-titel' }, 'JSON-editor', h('span', { class: 'badge badge-arto' }, 'ARTO')),
    h('p', { class: 'pagina-uitleg' }, 'De ruwe inhoud van inhoud.json. Toepassen zet alles bij de niet-opgeslagen wijzigingen.'),
    ta, melding,
    h('div', { class: 'detail-knoppen' },
      h('button', { class: 'knop', onclick: () => { ta.value = JSON.stringify(staat.inhoud, null, 2); lees(); } }, icoon('vernieuwen', 15), 'Herladen uit het paneel'),
      h('button', { class: 'knop', onclick: () => { const o = lees(); if (o) ta.value = JSON.stringify(o, null, 2); } }, icoon('code', 15), 'Netjes opmaken'),
      h('button', { class: 'knop knop-primair', onclick: () => { const o = lees(); if (!o) return; vervang(o, 'JSON-editor'); meld('Toegepast. Kijk het na en sla op.', { soort: 'goed' }); } }, icoon('check', 15), 'Toepassen')));
}
