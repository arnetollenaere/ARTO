// Optimaliseren: score per categorie, alle bevindingen, herstel per punt en "Optimaliseer alles".
import { h, $, $$, meld, vraag, scoreRing, bytes, geleden, lsLees, lsZet } from './ui.js';
import { icoon } from './iconen.js';
import { staat, vervang, wijzigingen } from './staat.js';
import { analyseer, pasToe, CATEGORIEEN, wisCache } from './analyse.js';
import { paginaNaam } from './schema.js';
import { app } from './ctx.js';

let filterCat = lsLees('arto-opt-filter') || 'alles';

export async function startAnalyse({ opnieuw = false, opVoortgang } = {}) {
  if (app.analyse && !opnieuw) return app.analyse;
  if (opnieuw) wisCache();
  app.analyse = analyseer({ opVoortgang }).then((r) => { staat.analyse = r; return r; }).catch((e) => { console.error(e); app.analyse = null; throw e; });
  return app.analyse;
}

const ERNST = { fout: { label: 'Fout', meer: 'Fouten', icoon: 'fout' }, waarschuwing: { label: 'Waarschuwing', meer: 'Waarschuwingen', icoon: 'waarschuwing' }, tip: { label: 'Tip', meer: 'Tips', icoon: 'tip' } };
const CAT_ICOON = { snelheid: 'optimaliseren', vindbaarheid: 'vindbaarheid', toegankelijkheid: 'oog', inhoud: 'inhoud' };

export async function toonOptimaliseren(root) {
  const lijf = h('div', { class: 'opt-lijf' });
  const autoKnop = h('button', { class: 'knop knop-primair', disabled: true, onclick: () => optimaliseerAlles(teken) }, icoon('toverstaf', 15), 'Optimaliseer alles');
  const opnieuwKnop = h('button', { class: 'knop', onclick: () => laad(true) }, icoon('vernieuwen', 15), 'Opnieuw analyseren');
  const psi = h('a', { class: 'knop knop-zacht', target: '_blank', rel: 'noopener', href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(staat.bron.arto.basisUrl + '/')}` }, icoon('extern', 15), 'PageSpeed Insights');
  root.replaceChildren(h('div', { class: 'formulier breed' },
    h('div', { class: 'pagina-kop' },
      h('div', null, h('h1', null, 'Optimaliseren'), h('p', { class: 'pagina-uitleg' }, 'We lichten je hele site door: elke pagina, elke foto, elke link. Los punten één voor één op, of laat ons alles wat automatisch kan in één keer verbeteren.')),
      h('div', { class: 'kop-knoppen' }, psi, opnieuwKnop, autoKnop)),
    lijf));

  const teken = (r) => {
    const auto = r.items.filter((i) => i.herstel?.auto);
    autoKnop.disabled = !auto.length || staat.alleenLezen;
    autoKnop.lastChild.textContent = auto.length ? `Optimaliseer alles (${auto.length})` : 'Alles is geoptimaliseerd';
    const zichtbaarItems = r.items.filter((i) => filterCat === 'alles' || i.categorie === filterCat);
    const goed = r.goed.filter((g) => filterCat === 'alles' || g.categorie === filterCat);
    const kaarten = h('div', { class: 'score-kaarten' },
      h('button', { class: 'score-totaal' + (filterCat === 'alles' ? ' actief' : ''), onclick: () => zetFilter('alles') },
        scoreRing(r.totaal, { grootte: 112, dik: 9 }),
        h('div', null, h('strong', null, 'Totaalscore'), h('span', null, oordeelTekst(r.totaal)), h('small', { class: 'stil' }, `${r.paginas} pagina's · ${geleden(r.tijd)}`))),
      Object.entries(CATEGORIEEN).map(([k, c]) => {
        const n = r.items.filter((i) => i.categorie === k);
        return h('button', { class: 'score-kaart' + (filterCat === k ? ' actief' : ''), 'aria-pressed': String(filterCat === k), onclick: () => zetFilter(filterCat === k ? 'alles' : k) },
          h('div', { class: 'score-kaart-kop' }, icoon(CAT_ICOON[k], 15), h('span', null, c.naam)),
          h('div', { class: 'score-getal' }, h('strong', { class: niveau(r.scores[k]) }, String(r.scores[k])), h('span', { class: 'stil' }, '/100')),
          h('div', { class: 'meter' }, h('span', { class: niveau(r.scores[k]), style: { width: r.scores[k] + '%' } })),
          h('small', { class: 'stil' }, n.length ? `${n.length} ${n.length === 1 ? 'punt' : 'punten'}` : 'Alles in orde'));
      }));
    const meting = r.metingen?.totaal ? h('div', { class: 'metingen' },
      meet('Startpagina', bytes(r.metingen.totaal)), meet('Afbeeldingen', `${r.metingen.beelden.aantal} · ${bytes(r.metingen.beelden.bytes)}`),
      meet('CSS', `${r.metingen.css.aantal} · ${bytes(r.metingen.css.bytes)}`), meet('JavaScript', `${r.metingen.js.aantal} · ${bytes(r.metingen.js.bytes)}`),
      meet('Lettertypes', `${r.metingen.fonts.aantal} · ${bytes(r.metingen.fonts.bytes)}`)) : null;
    const groepen = ['fout', 'waarschuwing', 'tip'].map((e) => {
      const l = zichtbaarItems.filter((i) => i.ernst === e);
      if (!l.length) return null;
      return h('section', { class: 'bevinding-groep' }, h('h2', { class: 'groep-kop' }, icoon(ERNST[e].icoon, 15, `ernst-${e}`), ERNST[e].meer, h('span', { class: 'aantal' }, String(l.length))),
        h('ul', { class: 'bevindingen' }, l.map((it) => bevinding(it, () => laad(true)))));
    });
    lijf.replaceChildren(
      r.verouderd ? h('div', { class: 'info-blok' }, icoon('info', 16), h('span', null, 'Je hebt intussen dingen aangepast.'), h('button', { class: 'knop-link', onclick: () => laad(true) }, 'Opnieuw analyseren')) : null,
      kaarten, meting,
      ...(zichtbaarItems.length ? groepen : [h('div', { class: 'leeg-staat' }, icoon('goed', 28, 'ernst-goed'), h('h3', null, 'Niets te verbeteren'), h('p', null, filterCat === 'alles' ? 'Je site is helemaal in orde. Knap!' : `Geen punten voor ${CATEGORIEEN[filterCat].naam.toLowerCase()}.`))]),
      goed.length ? h('details', { class: 'in-orde' }, h('summary', null, icoon('goed', 15, 'ernst-goed'), `${goed.length} dingen zijn in orde`), h('ul', null, goed.map((g) => h('li', null, icoon('check', 13), g.titel)))) : null);
  };
  const zetFilter = (k) => { filterCat = k; lsZet('arto-opt-filter', k); teken(staat.analyse); };

  const laad = async (opnieuw) => {
    const status = h('span', null, 'Pagina’s renderen…');
    if (opnieuw || !staat.analyse || staat.analyse.verouderd) {
      lijf.replaceChildren(h('div', { class: 'score-kaarten' }, h('div', { class: 'score-totaal' }, scoreRing(null, { grootte: 112, dik: 9 }), h('div', null, h('strong', null, 'Bezig met analyseren'), status)),
        Object.values(CATEGORIEEN).map(() => h('div', { class: 'score-kaart skelet' }))));
      try { await startAnalyse({ opnieuw: true, opVoortgang: (t) => { status.textContent = t + '…'; } }); }
      catch (e) { lijf.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('waarschuwing', 24), h('h3', null, 'De analyse lukte niet'), h('p', null, e.message))); return; }
    }
    if (root.isConnected) teken(staat.analyse);
  };
  await laad(false);
}

const meet = (l, w) => h('div', { class: 'meting' }, h('span', { class: 'stil' }, l), h('strong', null, w));
export const niveau = (s) => (s == null ? '' : s >= 90 ? 'goed' : s >= 60 ? 'let-op' : 'slecht');
export const oordeelTekst = (s) => (s >= 90 ? 'Uitstekend' : s >= 75 ? 'Goed, met wat verbeterpunten' : s >= 60 ? 'Kan beter' : 'Hier valt veel te winnen');

function bevinding(it, naHerstel) {
  const knoppen = [];
  if (it.pad || (it.pagina && /^(titel|beschrijving)/.test(it.id))) {
    knoppen.push(h('button', { class: 'knop knop-klein', onclick: () => gaNaar(it) }, 'Ga naar veld', icoon('rechts', 13)));
  }
  if (it.herstel) knoppen.push(h('button', { class: 'knop knop-klein knop-signaal', disabled: staat.alleenLezen, onclick: async (e) => {
    const knop = e.currentTarget;
    knop.disabled = true;
    knop.replaceChildren(icoon('vernieuwen', 13, 'draai'), 'Bezig…');
    try {
      const { inhoud, verslag } = await pasToe(staat.inhoud, [it]);
      if (!verslag[0].ok) throw new Error(verslag[0].fout);
      vervang(inhoud, it.herstel.label);
      meld(`${it.herstel.label}: gedaan. Kijk het na en sla op.`, { soort: 'goed', actie: { label: 'Bekijk', fn: () => gaNaar(it) } });
      naHerstel();
    } catch (err) { meld(err.message, { soort: 'fout' }); knop.disabled = false; knop.replaceChildren(icoon('vonk', 13), it.herstel.label); }
  } }, icoon('vonk', 13), it.herstel.label));
  return h('li', { class: `bevinding ernst-${it.ernst}` },
    h('span', { class: 'bevinding-icoon' }, icoon(ERNST[it.ernst].icoon, 16)),
    h('div', { class: 'bevinding-tekst' },
      h('div', { class: 'bevinding-titel' }, h('strong', null, it.titel)),
      h('p', null, it.uitleg),
      h('div', { class: 'bevinding-meta' }, h('span', { class: 'tag' }, CATEGORIEEN[it.categorie].naam), it.pagina ? h('span', { class: 'tag' }, paginaNaam(it.pagina)) : null, it.herstel?.auto ? h('span', { class: 'tag tag-auto' }, icoon('toverstaf', 11), 'Automatisch op te lossen') : null)),
    knoppen.length ? h('div', { class: 'bevinding-knoppen' }, knoppen) : null);
}

function gaNaar(it) {
  if ((it.pad === 'seo.paginas' || !it.pad) && it.pagina) { app.navigeer(`#/vindbaarheid?pagina=${encodeURIComponent(it.pagina)}`); return; }
  if (it.pad) app.gaNaarVeld(it.pad);
}

// ---------- Optimaliseer alles ----------
export async function optimaliseerAlles(naKlaar) {
  let r = staat.analyse;
  if (!r || r.verouderd) r = await startAnalyse({ opnieuw: true });
  const auto = r.items.filter((i) => i.herstel?.auto);
  if (!auto.length) return meld('Er is niets dat automatisch verbeterd kan worden.', { soort: 'info' });
  const vinkjes = new Map(auto.map((i) => [i.id, true]));
  const groepen = {};
  for (const it of auto) (groepen[it.categorie] ||= []).push(it);
  const teller = h('span');
  const zetTeller = () => { const n = [...vinkjes.values()].filter(Boolean).length; teller.textContent = n; knop.disabled = !n; };
  const lijst = h('div', { class: 'auto-lijst' }, Object.entries(groepen).map(([cat, l]) => h('fieldset', { class: 'auto-groep' },
    h('legend', null, CATEGORIEEN[cat].naam),
    l.map((it) => h('label', { class: 'auto-rij' },
      h('input', { type: 'checkbox', checked: true, onchange: (e) => { vinkjes.set(it.id, e.target.checked); zetTeller(); } }),
      h('span', { class: 'vinkje', 'aria-hidden': 'true' }, icoon('check', 12)),
      h('span', { class: 'auto-tekst' }, h('strong', null, it.herstel.label), h('span', null, it.herstel.omschrijving || it.titel)))))));
  const knop = h('button', { class: 'knop knop-primair', onclick: () => dlg._sluit(true) }, icoon('toverstaf', 15), h('span', null, 'Toepassen (', teller, ')'));
  const inhoud = h('div', null,
    h('p', { class: 'dialoog-tekst' }, 'Dit gaan we aanpassen. Haal een vinkje weg als je iets liever zelf doet. Er wordt nog niets gepubliceerd: alles komt bij je niet-opgeslagen wijzigingen, zodat je het eerst kan nalezen.'),
    lijst,
    h('div', { class: 'dialoog-knoppen' }, h('button', { class: 'knop', onclick: () => dlg._sluit(null) }, 'Annuleren'), knop));
  const belofte = vraag({ titel: 'Optimaliseer alles', inhoud, knoppen: [], breed: true });
  const dlg = $$('.dialoog').pop();
  zetTeller();
  if (!(await belofte)) return;

  const gekozen = auto.filter((i) => vinkjes.get(i.id));
  const voor = r.totaal;
  const voortgang = h('div', { class: 'voortgang groot' }, h('span', { class: 'voortgang-balk' }));
  const stap = h('p', { class: 'stil' }, 'Bezig…');
  const bezig = vraag({ titel: 'Bezig met optimaliseren', inhoud: h('div', null, stap, voortgang), knoppen: [], sluitbaar: false });
  const bezigDlg = $$('.dialoog').pop();
  const { inhoud: nieuw, verslag } = await pasToe(staat.inhoud, gekozen, (i, it) => {
    stap.textContent = `${i + 1} van ${gekozen.length}: ${it.herstel.omschrijving || it.herstel.label}`;
    $('.voortgang-balk', voortgang).style.width = Math.round((i / gekozen.length) * 100) + '%';
  });
  $('.voortgang-balk', voortgang).style.width = '100%';
  vervang(nieuw, 'Optimaliseer alles');
  stap.textContent = 'Opnieuw analyseren…';
  const na = await startAnalyse({ opnieuw: true });
  bezigDlg._sluit(null);
  await bezig;
  const mislukt = verslag.filter((v) => !v.ok);
  const bespaard = verslag.filter((v) => v.ok && v.r?.voor).reduce((n, v) => n + (v.r.voor - v.r.na), 0);
  naKlaar?.(na);
  const keuze = await vraag({ titel: 'Klaar met optimaliseren', breed: false, inhoud: h('div', { class: 'voor-na' },
    h('div', { class: 'voor-na-ringen' },
      h('div', null, scoreRing(voor, { grootte: 92, dik: 8 }), h('span', { class: 'stil' }, 'Voor')),
      icoon('pijl', 22, 'stil'),
      h('div', null, scoreRing(na.totaal, { grootte: 92, dik: 8 }), h('span', null, 'Na'))),
    h('p', null, `${verslag.length - mislukt.length} ${verslag.length - mislukt.length === 1 ? 'verbetering' : 'verbeteringen'} toegepast${bespaard > 0 ? `, ${bytes(bespaard)} lichter` : ''}.`),
    mislukt.length ? h('div', { class: 'waarschuwing-blok' }, icoon('waarschuwing', 16), h('div', null, h('strong', null, `${mislukt.length} lukte niet:`), h('ul', null, mislukt.map((m) => h('li', null, `${m.it.herstel.omschrijving}: ${m.fout}`))))) : null,
    h('p', { class: 'stil' }, `Alles staat bij je niet-opgeslagen wijzigingen (${wijzigingen().length}). Lees het na en klik op Opslaan om je site bij te werken.`)),
  knoppen: [{ label: 'Nakijken', waarde: 'nakijken' }, { label: 'Opslaan', waarde: 'opslaan', soort: 'primair' }] });
  if (keuze === 'opslaan') app.opslaan({ bericht: 'Site geoptimaliseerd' });
  if (keuze === 'nakijken') app.toonWijzigingen?.();
}
