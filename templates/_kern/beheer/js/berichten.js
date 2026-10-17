// Berichten: inbox van formulierinzendingen.
import { h, $$, meld, bevestig, geleden, datumLang, download, bus } from './ui.js';
import { icoon } from './iconen.js';
import { api } from './api.js';
import { staat } from './staat.js';
import { nietIngesteld } from './hulp.js';

export async function laadBerichten() {
  const r = await api('berichten');
  staat.berichten = r.berichten || [];
  bus.stuur('berichten-bijgewerkt');
  return staat.berichten;
}
export const ongelezen = () => (staat.berichten || []).filter((b) => !b.gelezen).length;

const veldVan = (b, ...namen) => {
  for (const n of namen) for (const [k, v] of Object.entries(b.velden || {})) if (k.toLowerCase().replace(/[^a-z]/g, '') === n && String(v).trim()) return String(v).trim();
  return '';
};
const naamVan = (b) => veldVan(b, 'naam', 'name', 'voornaam', 'volledigenaam') || veldVan(b, 'email', 'mail') || 'Anoniem';
const emailVan = (b) => { const e = veldVan(b, 'email', 'mail', 'emailadres'); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : ''; };
const tekstVan = (b) => veldVan(b, 'bericht', 'vraag', 'opmerking', 'message', 'tekst') || Object.values(b.velden || {}).sort((a, c) => String(c).length - String(a).length)[0] || '';
const LABELS = { naam: 'Naam', email: 'E-mail', telefoon: 'Telefoon', tel: 'Telefoon', bericht: 'Bericht', onderwerp: 'Onderwerp', datum: 'Datum', personen: 'Personen', uur: 'Uur' };
const labelVan = (k) => LABELS[k.toLowerCase()] || k.charAt(0).toUpperCase() + k.slice(1).replace(/[_-]+/g, ' ');

let filter = 'alles', open = null, zoek = '';

export async function toonBerichten(root) {
  const lijstEl = h('ul', { class: 'inbox-lijst', role: 'listbox', 'aria-label': 'Berichten' });
  const detail = h('section', { class: 'inbox-detail', 'aria-live': 'polite' });
  const tabs = h('div', { class: 'seg', role: 'tablist' });
  const vak = h('div', { class: 'inbox' + (open ? ' met-open' : '') }, h('div', { class: 'inbox-kolom' },
    h('div', { class: 'werkbalk-rij' }, tabs,
      h('div', { class: 'zoek-wrap' }, icoon('zoeken', 15), h('input', { class: 'invoer zoek-invoer', type: 'search', placeholder: 'Zoeken', value: zoek, 'aria-label': 'Zoek in berichten', oninput: (e) => { zoek = e.target.value; tekenLijst(); } }))),
    lijstEl), detail);
  const kop = h('div', { class: 'pagina-kop' },
    h('div', null, h('h1', null, 'Berichten'), h('p', { class: 'pagina-uitleg' }, 'Wat bezoekers via de formulieren op je site sturen.')),
    h('div', { class: 'kop-knoppen' },
      h('button', { class: 'knop', onclick: () => laad() }, icoon('vernieuwen', 15), 'Vernieuwen'),
      h('button', { class: 'knop', onclick: exporteer }, icoon('download', 15), 'Exporteren (CSV)')));
  root.replaceChildren(h('div', { class: 'formulier breed' }, kop, vak));

  const tekenTabs = () => {
    tabs.replaceChildren(...[['alles', 'Alles'], ['ongelezen', `Ongelezen${ongelezen() ? ` (${ongelezen()})` : ''}`]].map(([k, l]) =>
      h('button', { class: 'seg-knop', role: 'tab', 'aria-selected': String(filter === k), onclick: () => { filter = k; tekenTabs(); tekenLijst(); } }, l)));
  };
  const tekenLijst = () => {
    const z = zoek.toLowerCase();
    const lijst = (staat.berichten || []).filter((b) => (filter === 'alles' || !b.gelezen) && (!z || JSON.stringify(b.velden).toLowerCase().includes(z)))
      .sort((a, b) => b.datum.localeCompare(a.datum));
    if (!lijst.length) {
      lijstEl.replaceChildren(h('li', { class: 'leeg-staat klein' }, icoon('berichten', 24), h('p', null, staat.berichten?.length ? 'Geen berichten gevonden.' : 'Nog geen berichten. Ze verschijnen hier zodra iemand je formulier invult.')));
      return;
    }
    lijstEl.replaceChildren(...lijst.map((b) => h('li', { role: 'option', 'aria-selected': String(open === b.id) },
      h('button', { class: 'inbox-rij' + (b.gelezen ? '' : ' ongelezen') + (open === b.id ? ' open' : ''), onclick: () => kies(b) },
        h('span', { class: 'inbox-punt', 'aria-label': b.gelezen ? null : 'Ongelezen' }),
        h('span', { class: 'inbox-tekst' },
          h('span', { class: 'inbox-boven' }, h('strong', null, naamVan(b)), h('time', { datetime: b.datum, title: datumLang(b.datum) }, geleden(b.datum))),
          h('span', { class: 'inbox-voorbeeld' }, b.formulier && b.formulier !== 'contact' ? h('span', { class: 'tag' }, b.formulier) : null, tekstVan(b).slice(0, 120)))))));
  };
  const kies = async (b) => {
    open = b.id;
    vak.classList.add('met-open');
    tekenDetail(b);
    if (!b.gelezen) {
      b.gelezen = true;
      tekenLijst(); tekenTabs(); bus.stuur('berichten-bijgewerkt');
      api('berichten', { methode: 'PATCH', query: { id: b.id }, body: { gelezen: true } }).catch((e) => meld(e.message, { soort: 'fout' }));
    } else tekenLijst();
  };
  const tekenDetail = (b) => {
    if (!b) { detail.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('mail', 26), h('p', null, 'Kies een bericht om het te lezen.'))); return; }
    const mail = emailVan(b);
    const onderwerp = `Re: je bericht via ${staat.inhoud?.site?.naam || 'onze website'}`;
    const citaat = `\n\n---\nOp ${new Date(b.datum).toLocaleString('nl-BE')} schreef ${naamVan(b)}:\n${tekstVan(b).split('\n').map((r) => '> ' + r).join('\n')}`;
    detail.replaceChildren(
      h('div', { class: 'detail-kop' },
        h('button', { class: 'knop-icoon terug-knop', 'aria-label': 'Terug naar de lijst', onclick: () => { open = null; vak.classList.remove('met-open'); tekenLijst(); } }, icoon('terug', 16)),
        h('div', null, h('h2', null, naamVan(b)), h('span', { class: 'stil klein' }, datumLang(b.datum), b.formulier ? ` · formulier "${b.formulier}"` : ''))),
      h('dl', { class: 'bericht-velden' }, Object.entries(b.velden || {}).map(([k, v]) => [h('dt', null, labelVan(k)), h('dd', { class: String(v).length > 80 ? 'lang' : '' },
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? h('a', { href: `mailto:${v}` }, v) : /^\+?[\d\s()./-]{8,}$/.test(v) ? h('a', { href: `tel:${v.replace(/[^\d+]/g, '')}` }, v) : v)])),
      h('div', { class: 'detail-knoppen' },
        mail ? h('a', { class: 'knop knop-primair', href: `mailto:${mail}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(citaat)}` }, icoon('mail', 15), 'Antwoorden') : h('span', { class: 'stil klein' }, 'Geen e-mailadres om op te antwoorden.'),
        h('button', { class: 'knop', onclick: async () => {
          b.gelezen = false; open = null; vak.classList.remove('met-open');
          tekenLijst(); tekenTabs(); tekenDetail(null); bus.stuur('berichten-bijgewerkt');
          await api('berichten', { methode: 'PATCH', query: { id: b.id }, body: { gelezen: false } }).catch((e) => meld(e.message, { soort: 'fout' }));
        } }, icoon('berichten', 15), 'Markeer als ongelezen'),
        h('button', { class: 'knop knop-gevaar-zacht', onclick: async () => {
          if (!(await bevestig('Bericht verwijderen?', `Het bericht van ${naamVan(b)} wordt definitief verwijderd.`, 'Verwijderen', true))) return;
          try {
            await api('berichten', { methode: 'DELETE', query: { id: b.id } });
            staat.berichten = staat.berichten.filter((x) => x.id !== b.id);
            open = null; vak.classList.remove('met-open');
            tekenLijst(); tekenTabs(); tekenDetail(null); bus.stuur('berichten-bijgewerkt');
            meld('Bericht verwijderd', { soort: 'goed' });
          } catch (e) { meld(e.message, { soort: 'fout' }); }
        } }, icoon('prullenbak', 15), 'Verwijderen')));
  };
  const laad = async () => {
    lijstEl.replaceChildren(...Array.from({ length: 4 }, () => h('li', { class: 'inbox-rij skelet' })));
    try {
      await laadBerichten();
      tekenTabs(); tekenLijst();
      tekenDetail((staat.berichten || []).find((b) => b.id === open) || null);
    } catch (e) {
      if (e.nietIngesteld) { vak.replaceChildren(nietIngesteld('berichten', { blok: true })); tabs.replaceChildren(); }
      else lijstEl.replaceChildren(h('li', { class: 'leeg-staat' }, icoon('waarschuwing', 24), h('p', null, e.message)));
    }
  };
  tekenTabs();
  if (staat.berichten) { tekenLijst(); tekenDetail(staat.berichten.find((b) => b.id === open) || null); }
  await laad();
}

function exporteer() {
  const lijst = staat.berichten || [];
  if (!lijst.length) return meld('Er zijn geen berichten om te exporteren.', { soort: 'info' });
  const sleutels = [...new Set(lijst.flatMap((b) => Object.keys(b.velden || {})))];
  const cel = (v) => { const s = String(v ?? ''); return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rijen = [['Datum', 'Formulier', 'Gelezen', ...sleutels.map(labelVan)], ...lijst.map((b) => [new Date(b.datum).toLocaleString('nl-BE'), b.formulier || '', b.gelezen ? 'ja' : 'nee', ...sleutels.map((k) => b.velden?.[k] ?? '')])];
  // Puntkomma en BOM: opent correct in Excel met Belgische instellingen.
  download(`berichten-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + rijen.map((r) => r.map(cel).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}
