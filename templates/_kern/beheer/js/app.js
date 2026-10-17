// ARTO-beheerpaneel: opstarten, schil (zijbalk, kop, opslagbalk), router, opslaan en sneltoetsen.
import { h, $, $$, bus, meld, vraag, debounce, geleden, kbd, popover, lsLees, lsZet, sneltoets, leeg } from './ui.js';
import { icoon, artoMerk } from './iconen.js';
import { api, haal, ApiFout } from './api.js';
import { staat, laadInhoud, zetOpgeslagen, wijzigingen, ongedaan, opnieuw, kanOngedaan, vervang, verschillen, leesConcept, wisConcept, verwerp } from './staat.js';
import { bouwSchema, vindVeld, editorGroepen, sectiesVan, groepNaam, labelVoor, zet, lees } from './schema.js';
import { focusVeld, valideer } from './velden.js';
import { alleVelden } from './schema.js';
import { Preview } from './preview.js';
import { toonLogin, siteNaam } from './login.js';
import { toonOverzicht, laadPublicaties, publicatieStatus } from './overzicht.js';
import { toonSectie, toonSectieLijst, alleEditorSecties, gewijzigdeSecties, sectieIcoon } from './inhoud.js';
import { toonSeo } from './seo.js';
import { toonMedia, laadMedia } from './media.js';
import { toonOptimaliseren, optimaliseerAlles, startAnalyse } from './optimaliseren.js';
import { toonBerichten, laadBerichten, ongelezen } from './berichten.js';
import { toonGeschiedenis, verschilLijst } from './geschiedenis.js';
import { toonThema, heeftThema } from './thema.js';
import { toonInstellingen, SNELTOETSEN } from './instellingen.js';
import { openPalet } from './palet.js';
import { nietIngesteld } from './hulp.js';
import { app } from './ctx.js';

const wortel = document.getElementById('app');
const mobiel = matchMedia('(max-width: 860px)');

// ---------- weergave (licht/donker) ----------
function zetWeergave(k) {
  lsZet('arto-weergave', k);
  if (k === 'systeem') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = k === 'licht' ? 'light' : 'dark';
  bus.stuur('weergave');
}
zetWeergave(lsLees('arto-weergave') || 'systeem');
app.zetWeergave = zetWeergave;

// ---------- opstarten ----------
async function begin() {
  let sessie;
  try { sessie = await api('sessie'); } catch (e) {
    wortel.replaceChildren(h('div', { class: 'opstart-fout' }, icoon('waarschuwing', 22), h('h1', null, 'Het beheer is niet bereikbaar'), h('p', null, e.message), h('button', { class: 'knop', onclick: () => location.reload() }, 'Opnieuw proberen')));
    return;
  }
  staat.sessie = sessie;
  if (!sessie.ingelogd) return login();
  await start();
}

async function login(melding) {
  document.title = 'Inloggen · Beheer';
  const naam = await siteNaam();
  document.title = `Inloggen · ${naam}`;
  toonLogin(wortel, { naam, melding, configuratie: staat.sessie?.configuratie, opIngelogd: async () => {
    staat.sessie = await api('sessie');
    await start();
  } });
}

bus.op('uitgelogd', () => {
  if (!staat.sessie?.ingelogd) return;
  staat.sessie.ingelogd = false;
  login('Je sessie is verlopen. Log opnieuw in; je wijzigingen staan nog klaar.');
});

async function start() {
  wortel.replaceChildren(h('div', { class: 'laden' }, h('div', { class: 'laden-punt' }), h('span', null, 'Je site wordt geladen…')));
  let bron, basis;
  try { [bron, basis] = await Promise.all([haal('/beheer/bron.json'), haal('/beheer/basis-schema.json')]); }
  catch (e) { wortel.replaceChildren(h('div', { class: 'opstart-fout' }, icoon('waarschuwing', 22), h('h1', null, 'Bestanden van het beheer ontbreken'), h('p', null, `${e.message}. Bouw de site opnieuw.`))); return; }
  staat.bron = bron;
  staat.basis = basis;
  staat.schema = bouwSchema(basis, bron.template || {});
  try {
    const r = await api('inhoud');
    laadInhoud(r.inhoud, r.sha);
  } catch (e) {
    if (e.status === 401) return login();
    if (!e.nietIngesteld) { wortel.replaceChildren(h('div', { class: 'opstart-fout' }, icoon('waarschuwing', 22), h('h1', null, 'De inhoud kon niet geladen worden'), h('p', null, e.message), h('button', { class: 'knop', onclick: () => location.reload() }, 'Opnieuw proberen'))); return; }
    // Opslaan niet ingesteld: werk met de inhoud uit de build (als die meegegeven is), alleen-lezen.
    laadInhoud(bron.inhoud || { site: { naam: await siteNaam() } }, null);
    staat.alleenLezen = !bron.inhoud ? true : false;
    staat.geenOpslag = true;
  }
  lsZet('arto-sitenaam', staat.inhoud.site?.naam || '');
  bouwSchil();
  herstelConcept();
  window.addEventListener('hashchange', route);
  route();
  // Achtergrond: badges vullen.
  laadBerichten().then(tekenBadges, () => {});
  laadMedia().catch(() => {});
  laadPublicaties().then(tekenPubPil, () => {});
  setTimeout(() => { if (!staat.analyse) startAnalyse().then(tekenBadges, () => {}); }, 1500);
}

function herstelConcept() {
  const c = leesConcept();
  if (!c?.inhoud) return;
  const diff = verschillen(staat.opgeslagen, c.inhoud);
  if (!diff.length) { wisConcept(); return; }
  if (c.sha === staat.sha) {
    vervang(c.inhoud, 'concept');
    meld(`We hebben je ${diff.length} niet-opgeslagen ${diff.length === 1 ? 'wijziging' : 'wijzigingen'} van ${geleden(c.tijd)} teruggezet.`, { soort: 'info', duur: 9000, actie: { label: 'Weggooien', fn: () => { verwerp(); wisConcept(); } } });
  } else {
    vraag({ titel: 'Niet-opgeslagen wijzigingen gevonden', tekst: `Je had ${geleden(c.tijd)} ${diff.length} ${diff.length === 1 ? 'wijziging' : 'wijzigingen'} die niet opgeslagen zijn. Intussen heeft iemand anders de site aangepast. Wil je jouw wijzigingen er opnieuw bovenop zetten?`,
      knoppen: [{ label: 'Weggooien', waarde: false }, { label: 'Opnieuw toepassen', waarde: true, soort: 'primair' }] }).then((ja) => {
      if (ja) { vervang(pasDiffToe(staat.opgeslagen, verschillen(staat.opgeslagen, c.inhoud), c.inhoud), 'concept'); meld('Je wijzigingen staan weer klaar. Kijk ze na en sla op.', { soort: 'goed' }); }
      else wisConcept();
    });
  }
}

// Mijn wijzigingen (diff t.o.v. mijn basis) bovenop een nieuwere versie zetten.
function pasDiffToe(basis, diff, mijn) {
  const uit = JSON.parse(JSON.stringify(basis));
  for (const d of diff) {
    if (d.soort === 'gewijzigd') zet(uit, d.pad, d.nieuw);
    else {
      // Toegevoegd/verwijderd in een lijst: neem de hele lijst van mij over.
      const ouder = d.pad.split('.').slice(0, -1).join('.');
      if (ouder) zet(uit, ouder, JSON.parse(JSON.stringify(lees(mijn, ouder))));
      else zet(uit, d.pad, d.nieuw);
    }
  }
  return uit;
}

// ---------- schil ----------
const WEERGAVEN = () => [
  { naam: 'overzicht', label: 'Overzicht', icoon: 'overzicht', hash: '#/overzicht' },
  { naam: 'inhoud', label: 'Inhoud', icoon: 'inhoud', hash: '#/inhoud' },
  { naam: 'vindbaarheid', label: 'Vindbaarheid', icoon: 'vindbaarheid', hash: '#/vindbaarheid' },
  { naam: 'media', label: 'Media', icoon: 'media', hash: '#/media' },
  { naam: 'optimaliseren', label: 'Optimaliseren', icoon: 'optimaliseren', hash: '#/optimaliseren' },
  { naam: 'berichten', label: 'Berichten', icoon: 'berichten', hash: '#/berichten' },
  { naam: 'geschiedenis', label: 'Geschiedenis', icoon: 'geschiedenis', hash: '#/geschiedenis' },
  heeftThema() ? { naam: 'thema', label: 'Thema', icoon: 'thema', hash: '#/thema' } : null,
  { naam: 'instellingen', label: 'Instellingen', icoon: 'instellingen', hash: '#/instellingen' },
].filter(Boolean).map((w, i) => ({ ...w, toets: i < 9 ? `Alt+${i + 1}` : null }));

const MET_PREVIEW = new Set(['inhoud', 'thema', 'geschiedenis']);
let el = {};
let previewAan = lsLees('arto-preview-aan') ?? true;
let mobielTab = 'bewerken';
let huidig = { naam: null, param: null };

function bouwSchil() {
  const s = staat.inhoud.site || {};
  app.preview = new Preview();
  app.preview.opKlik = (pad) => gaNaarVeld(pad, { vanPreview: true });

  // Zijbalk
  const siteKnop = h('button', { class: 'site-knop', 'aria-label': 'Sitemenu', onclick: (e) => popover(e.currentTarget, [
    { label: 'Bekijk je site', icoon: 'extern', fn: () => window.open(location.origin + '/', '_blank', 'noopener') },
    { label: 'Instellingen en hulp', icoon: 'instellingen', fn: () => { location.hash = '#/instellingen'; } },
    '-',
    { label: 'Uitloggen', icoon: 'uitloggen', fn: uitloggen },
  ]) },
  h('span', { class: 'site-monogram' }, s.logo ? h('img', { src: s.logo, alt: '', onerror: (e) => e.target.replaceWith(document.createTextNode((s.naam || '?').charAt(0))) }) : (s.naam || '?').charAt(0).toUpperCase()),
  h('span', { class: 'site-tekst' }, h('strong', { class: 'site-naam' }, s.naam || 'Je site'), h('span', { class: 'site-domein' }, s.domein || location.host)),
  icoon('onder', 14, 'stil'));
  const zoekKnop = h('button', { class: 'zoek-knop', onclick: palet }, icoon('zoeken', 15), h('span', null, 'Zoeken'), kbd('Mod+K'));
  el.nav = h('nav', { class: 'nav', 'aria-label': 'Hoofdmenu' });
  const weergaveKnop = h('button', { class: 'knop-icoon', 'aria-label': 'Licht of donker', title: 'Licht of donker', onclick: () => {
    const nu = lsLees('arto-weergave') || 'systeem';
    const donkerNu = nu === 'donker' || (nu === 'systeem' && matchMedia('(prefers-color-scheme: dark)').matches);
    zetWeergave(donkerNu ? 'licht' : 'donker');
    tekenWeergaveKnop();
  } });
  const tekenWeergaveKnop = () => {
    const nu = lsLees('arto-weergave') || 'systeem';
    const donker = nu === 'donker' || (nu === 'systeem' && matchMedia('(prefers-color-scheme: dark)').matches);
    weergaveKnop.replaceChildren(icoon(donker ? 'zon' : 'maan', 16));
  };
  tekenWeergaveKnop();
  const zijbalk = h('aside', { class: 'zijbalk' },
    h('div', { class: 'zijbalk-kop' }, siteKnop),
    zoekKnop, el.nav,
    h('div', { class: 'zijbalk-voet' },
      h('div', { class: 'rol' }, h('span', { class: 'rol-punt' }), h('span', null, staat.sessie.rol === 'arto' ? 'ARTO' : 'Klant'), staat.sessie.modus === 'lokaal' ? h('span', { class: 'tag' }, 'lokaal') : null),
      h('span', { class: 'spacer' }),
      weergaveKnop,
      h('button', { class: 'knop-icoon', 'aria-label': 'Uitloggen', title: 'Uitloggen', onclick: uitloggen }, icoon('uitloggen', 16))),
    h('div', { class: 'arto-merk' }, artoMerk(11), 'ARTO'));

  // Kop van het werkvlak
  el.titel = h('div', { class: 'werkkop-titel' });
  el.pub = h('button', { class: 'pub-pil', onclick: () => { location.hash = '#/geschiedenis'; } });
  el.previewKnop = h('button', { class: 'knop-icoon', 'aria-label': 'Voorbeeld tonen of verbergen', title: `Voorbeeld tonen/verbergen (${sneltoets('Mod+.')})`, onclick: () => zetPreviewZichtbaar(!previewAan) }, icoon('splits', 16));
  el.tabs = h('div', { class: 'seg mobiel-tabs', role: 'tablist', 'aria-label': 'Bewerken of voorbeeld' },
    h('button', { class: 'seg-knop', role: 'tab', 'aria-selected': 'true', dataset: { tab: 'bewerken' }, onclick: () => zetMobielTab('bewerken') }, icoon('bewerk', 14), 'Bewerken'),
    h('button', { class: 'seg-knop', role: 'tab', 'aria-selected': 'false', dataset: { tab: 'voorbeeld' }, onclick: () => zetMobielTab('voorbeeld') }, icoon('oog', 14), 'Voorbeeld'));
  const werkkop = h('header', { class: 'werkkop' },
    h('button', { class: 'knop-icoon alleen-mobiel', 'aria-label': 'Zoeken', onclick: palet }, icoon('zoeken', 17)),
    el.titel, h('span', { class: 'spacer' }), el.pub, el.tabs, el.previewKnop,
    h('a', { class: 'knop knop-klein knop-zacht verberg-mobiel', href: location.origin + '/', target: '_blank', rel: 'noopener' }, icoon('extern', 14), 'Bekijk site'));

  el.hoofd = h('div', { id: 'hoofd', class: 'hoofd', tabindex: '-1' });
  el.scheiding = h('div', { class: 'scheiding', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'Breedte van het voorbeeld aanpassen', tabindex: '0' });
  el.previewVak = h('div', { class: 'preview-vak' }, app.preview.el);
  el.werkvlak = h('div', { class: 'werkvlak' }, el.hoofd, el.scheiding, el.previewVak);
  splitser(el.scheiding, el.werkvlak);

  // Opslagbalk
  el.aantal = h('button', { class: 'opslag-aantal', onclick: toonWijzigingen, title: 'Bekijk wat er veranderd is' }, h('span', { class: 'opslag-punt' }), h('span', { class: 'opslag-tekst' }));
  el.bericht = h('input', { class: 'invoer opslag-bericht', placeholder: 'Wat heb je aangepast?', 'aria-label': 'Wat heb je aangepast? (optioneel)', maxlength: 100, onkeydown: (e) => { if (e.key === 'Enter') opslaan(); } });
  el.ongedaan = h('button', { class: 'knop knop-zacht', onclick: () => ongedaan() }, icoon('ongedaan', 15), h('span', { class: 'verberg-mobiel' }, 'Ongedaan maken'));
  el.opslaanKnop = h('button', { class: 'knop knop-primair', onclick: () => opslaan() }, h('span', null, 'Opslaan'), h('span', { class: 'verberg-mobiel kbd-licht' }, kbd('Mod+S')));
  el.opslagbalk = h('div', { class: 'opslagbalk', role: 'region', 'aria-label': 'Niet-opgeslagen wijzigingen', hidden: true }, el.aantal, el.bericht, h('span', { class: 'spacer' }), el.ongedaan, el.opslaanKnop);

  // Onderbalk (gsm)
  el.onderbalk = h('nav', { class: 'onderbalk', 'aria-label': 'Menu' });

  wortel.replaceChildren(h('div', { class: 'schil' }, zijbalk, h('main', { class: 'werk' }, werkkop, el.werkvlak, el.opslagbalk), el.onderbalk));
  tekenNav();
  tekenOpslagbalk();
  tekenPubPil();

  el.hoofd.addEventListener('focusin', debounce((e) => {
    const p = e.target.closest?.('[data-pad]')?.dataset.pad;
    if (p && !app.previewVanKlik) app.preview.toonPad(p);
    app.previewVanKlik = false;
  }, 120));

  bus.op('wijziging', (info) => {
    tekenOpslagbalk();
    tekenNavDots();
    if (info.soort === 'alles') herteken();
  });
  bus.op('opgeslagen-status', () => { tekenOpslagbalk(); tekenNavDots(); });
  bus.op('berichten-bijgewerkt', tekenBadges);
  bus.op('weergave', tekenWeergaveKnop);
  bus.op('preview-versie', () => tekenPreviewStand());
  mobiel.addEventListener('change', () => { tekenPreviewStand(); app.preview.schaal(); });
  window.addEventListener('beforeunload', (e) => { if (wijzigingen().length && !staat.alleenLezen) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', sneltoetsen);
}

function tekenNav() {
  const ws = WEERGAVEN();
  const link = (w, extra) => h('a', { class: 'nav-item', href: w.hash, dataset: { weergave: w.naam } }, icoon(w.icoon, 16), h('span', { class: 'nav-label' }, w.label), extra || null);
  const secties = (g) => h('div', { class: 'nav-secties' }, sectiesVan(g).map((s) => h('a', { class: 'nav-sub', href: `#/inhoud/${s.id}`, dataset: { sectie: s.id } }, h('span', { class: 'nav-label' }, s.titel), h('span', { class: 'punt-gewijzigd', hidden: true }))));
  el.nav.replaceChildren(
    link(ws[0]),
    ...editorGroepen().flatMap((g) => [h('div', { class: 'nav-groep' }, groepNaam(g)), secties(g)]),
    h('div', { class: 'nav-groep' }, 'Site'),
    ...ws.slice(2).map((w) => link(w, w.naam === 'berichten' ? h('span', { class: 'badge-teller', hidden: true }) : w.naam === 'optimaliseren' ? h('span', { class: 'badge-score', hidden: true }) : null)));
  const mob = [ws[0], ws[1], ws.find((w) => w.naam === 'media'), ws.find((w) => w.naam === 'berichten')];
  el.onderbalk.replaceChildren(...mob.map((w) => h('a', { class: 'onder-item', href: w.hash, dataset: { weergave: w.naam } }, icoon(w.icoon, 20), h('span', null, w.label), w.naam === 'berichten' ? h('span', { class: 'badge-teller', hidden: true }) : null)),
    h('button', { class: 'onder-item', onclick: (e) => popover(e.currentTarget, ws.filter((w) => !mob.includes(w)).map((w) => ({ label: w.label, icoon: w.icoon, fn: () => { location.hash = w.hash; } })).concat(['-', { label: 'Uitloggen', icoon: 'uitloggen', fn: uitloggen }])) }, icoon('meer', 20), h('span', null, 'Meer')));
  tekenBadges();
  tekenNavDots();
}
function tekenNavDots() {
  const g = gewijzigdeSecties();
  $$('.nav-sub', el.nav).forEach((a) => { a.querySelector('.punt-gewijzigd').hidden = !g.has(a.dataset.sectie); });
}
function tekenBadges() {
  const n = ongelezen();
  $$('.badge-teller').forEach((b) => { b.hidden = !n; b.textContent = n > 99 ? '99+' : String(n); });
  const sc = $('.badge-score', el.nav);
  if (sc && staat.analyse) { sc.hidden = false; sc.textContent = String(staat.analyse.totaal); sc.dataset.niveau = staat.analyse.totaal >= 90 ? 'goed' : staat.analyse.totaal >= 60 ? 'let-op' : 'slecht'; }
}
function tekenActief() {
  $$('[data-weergave]').forEach((a) => a.classList.toggle('actief', a.dataset.weergave === huidig.naam && !(huidig.naam === 'inhoud' && huidig.param && a.closest('.nav'))));
  $$('.nav-sub', el.nav).forEach((a) => a.classList.toggle('actief', huidig.naam === 'inhoud' && a.dataset.sectie === huidig.param));
  $$('[data-weergave]').forEach((a) => { if (a.classList.contains('actief')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}

function tekenOpslagbalk() {
  const n = wijzigingen().length;
  el.opslagbalk.hidden = !n || staat.alleenLezen;
  el.werkvlak.classList.toggle('met-balk', !!n);
  $('.opslag-tekst', el.aantal).textContent = n === 1 ? '1 niet-opgeslagen wijziging' : `${n} niet-opgeslagen wijzigingen`;
  el.bericht.placeholder = n ? `Wat heb je aangepast? (${voorstelBericht()})` : 'Wat heb je aangepast?';
  el.ongedaan.disabled = !kanOngedaan();
  if (staat.geenOpslag && n) { el.opslagbalk.hidden = false; el.opslaanKnop.disabled = true; el.opslaanKnop.title = 'Opslaan is nog niet ingesteld'; }
}

function tekenPubPil() {
  if (!el.pub) return;
  if (app.publiceren) { el.pub.className = 'pub-pil bezig'; el.pub.replaceChildren(icoon('vernieuwen', 13, 'draai'), h('span', null, 'Publiceren…')); return; }
  const p = staat.publicaties?.[0];
  if (!p) { el.pub.hidden = true; return; }
  el.pub.hidden = false;
  const st = publicatieStatus(p);
  el.pub.className = `pub-pil ${st.soort}`;
  el.pub.replaceChildren(h('span', { class: `status-punt ${st.soort}` }), h('span', { class: 'verberg-mobiel' }, st.label), h('span', { class: 'stil' }, geleden(p.bijgewerkt || p.datum)));
  el.pub.title = `${st.label} · ${new Date(p.bijgewerkt || p.datum).toLocaleString('nl-BE')}`;
}
setInterval(tekenPubPil, 30000);

// ---------- preview-paneel ----------
function zetPreviewZichtbaar(z) {
  previewAan = z;
  lsZet('arto-preview-aan', z);
  if (mobiel.matches && z && MET_PREVIEW.has(huidig.naam)) mobielTab = 'voorbeeld';
  tekenPreviewStand();
}
app.zetPreviewZichtbaar = zetPreviewZichtbaar;
function zetMobielTab(t) {
  mobielTab = t;
  tekenPreviewStand();
  if (t === 'bewerken') el.hoofd.focus({ preventScroll: true });
}
function tekenPreviewStand() {
  const kan = MET_PREVIEW.has(huidig.naam) && (huidig.naam !== 'geschiedenis' || !!app.preview.versie);
  const toon = kan && (mobiel.matches ? mobielTab === 'voorbeeld' : previewAan);
  el.werkvlak.classList.toggle('met-preview', kan && (mobiel.matches ? true : previewAan));
  el.werkvlak.classList.toggle('mobiel-voorbeeld', mobiel.matches && kan && mobielTab === 'voorbeeld');
  el.previewKnop.hidden = !kan || mobiel.matches;
  el.previewKnop.setAttribute('aria-pressed', String(previewAan));
  el.tabs.hidden = !kan || !mobiel.matches;
  el.tabs.parentElement.classList.toggle('met-tabs', !el.tabs.hidden);
  for (const b of el.tabs.children) b.setAttribute('aria-selected', String(b.dataset.tab === mobielTab));
  app.preview.zetZichtbaar(toon);
  requestAnimationFrame(() => app.preview.schaal());
}
function splitser(lijn, vak) {
  const opgeslagen = lsLees('arto-preview-breedte');
  const doc = document.documentElement.style;
  if (opgeslagen) doc.setProperty('--preview-b', opgeslagen + 'px');
  const zet = (b) => {
    const max = vak.clientWidth - 380;
    b = Math.max(320, Math.min(max, b));
    doc.setProperty('--preview-b', b + 'px');
    lsZet('arto-preview-breedte', Math.round(b));
    app.preview.schaal();
  };
  lijn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lijn.setPointerCapture(e.pointerId);
    vak.classList.add('sleept');
    const rechts = vak.getBoundingClientRect().right;
    const beweeg = (ev) => zet(rechts - ev.clientX);
    const los = () => { vak.classList.remove('sleept'); lijn.removeEventListener('pointermove', beweeg); lijn.removeEventListener('pointerup', los); };
    lijn.addEventListener('pointermove', beweeg);
    lijn.addEventListener('pointerup', los);
  });
  lijn.addEventListener('keydown', (e) => {
    const b = el.previewVak.getBoundingClientRect().width;
    if (e.key === 'ArrowLeft') { e.preventDefault(); zet(b + 40); }
    if (e.key === 'ArrowRight') { e.preventDefault(); zet(b - 40); }
  });
  lijn.addEventListener('dblclick', () => { doc.removeProperty('--preview-b'); lsZet('arto-preview-breedte', null); app.preview.schaal(); });
}

// ---------- router ----------
let wachtFocus = null;
function leesHash() {
  const [pad, qs] = (location.hash.replace(/^#\/?/, '') || 'overzicht').split('?');
  const [naam, ...rest] = pad.split('/');
  return { naam: naam || 'overzicht', param: rest.length ? decodeURIComponent(rest.join('/')) : null, query: new URLSearchParams(qs || '') };
}
async function route() {
  const r = leesHash();
  if (r.naam === 'veld' && r.param) { gaNaarVeld(r.param); return; }
  const zelfde = huidig.naam === r.naam && huidig.param === r.param;
  huidig = r;
  if (!zelfde) el.hoofd.scrollTop = 0;
  tekenActief();
  if (r.naam !== 'geschiedenis' && app.preview.versie) app.preview.toonVersie(null);
  const w = WEERGAVEN().find((x) => x.naam === r.naam);
  let titel = w?.label || 'Overzicht';
  el.hoofd.className = `hoofd weergave-${r.naam}`;
  try {
    switch (r.naam) {
      case 'overzicht': await toonOverzicht(el.hoofd); break;
      case 'inhoud': {
        const sectie = r.param && staat.schema.find((s) => s.id === r.param && s.groep !== 'seo');
        if (r.param && !sectie) { location.replace('#/inhoud'); return; }
        if (!sectie && !mobiel.matches) { const eerste = alleEditorSecties()[0]; if (eerste) { location.replace(`#/inhoud/${eerste.id}`); return; } }
        if (sectie) { toonSectie(el.hoofd, sectie); titel = sectie.titel; } else toonSectieLijst(el.hoofd);
        break;
      }
      case 'vindbaarheid': toonSeo(el.hoofd, { focus: r.query.get('pagina') }); break;
      case 'media': await toonMedia(el.hoofd, { openUpload: r.query.get('upload') === '1' }); if (r.query.get('upload')) history.replaceState(null, '', '#/media'); break;
      case 'optimaliseren': await toonOptimaliseren(el.hoofd); break;
      case 'berichten': await toonBerichten(el.hoofd); break;
      case 'geschiedenis': await toonGeschiedenis(el.hoofd); break;
      case 'thema': if (!heeftThema()) { location.replace('#/overzicht'); return; } toonThema(el.hoofd); break;
      case 'instellingen': toonInstellingen(el.hoofd); break;
      default: location.replace('#/overzicht'); return;
    }
  } catch (e) {
    console.error(e);
    el.hoofd.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('waarschuwing', 24), h('h3', null, 'Er ging iets mis'), h('p', null, e.message)));
  }
  el.titel.replaceChildren(h('span', null, titel));
  document.title = `${titel} · ${staat.inhoud.site?.naam || 'Beheer'}`;
  tekenPreviewStand();
  if (wachtFocus) {
    const p = wachtFocus; wachtFocus = null;
    requestAnimationFrame(() => focusMetTerugval(p));
  }
}
// Na een wijziging van "alles" (ongedaan maken, terugzetten …) de huidige weergave opnieuw tekenen.
const herteken = debounce(() => {
  if (!['inhoud', 'thema', 'vindbaarheid', 'overzicht', 'instellingen'].includes(huidig.naam)) return;
  if (huidig.naam === 'instellingen' && document.activeElement?.classList.contains('json-editor')) return;
  const scroll = el.hoofd.scrollTop;
  const actiefPad = document.activeElement?.closest?.('#hoofd [data-pad]')?.dataset.pad;
  route().then(() => {
    el.hoofd.scrollTop = scroll;
    if (actiefPad) focusVeld(actiefPad, { flits: false });
  });
}, 30);
app.ververs = herteken;
app.navigeer = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

function focusMetTerugval(pad) {
  const delen = pad.split('.');
  for (let n = delen.length; n > 0; n--) {
    if (focusVeld(delen.slice(0, n).join('.'))) return true;
  }
  return false;
}

// Spring naar een veld: open de juiste sectie, klap lijstitems open en zet de focus.
function gaNaarVeld(pad, { vanPreview = false } = {}) {
  const v = vindVeld(pad);
  if (!v) { meld('Dit veld kan je hier niet aanpassen.', { soort: 'info' }); return; }
  for (const p of v.items) staat.openItems.add(p);
  if (v.item) staat.openItems.add(v.vol);
  let hash;
  if (v.thema) hash = '#/thema';
  else if (v.sectie.groep === 'seo') hash = /^seo\.paginas\.(\d+)/.test(pad) ? `#/vindbaarheid?pagina=${encodeURIComponent(lees(staat.inhoud, pad.split('.').slice(0, 3).join('.') + '.pagina') || '')}` : '#/vindbaarheid';
  else hash = `#/inhoud/${v.sectie.id}`;
  app.previewVanKlik = vanPreview;
  if (mobiel.matches) mobielTab = 'bewerken';
  wachtFocus = v.vol || pad;
  if (location.hash === hash) route(); else location.hash = hash;
  if (!vanPreview && !v.thema && v.sectie.groep !== 'seo') {
    const best = app.preview.zoekPaginaVoor(pad);
    if (best && best !== app.preview.bestand) { app.preview.toonPagina(best); app.preview.naRender = () => app.preview.toonPad(pad); }
    else setTimeout(() => app.preview.toonPad(pad), 350);
  }
}
app.gaNaarVeld = gaNaarVeld;

// ---------- opslaan ----------
function voorstelBericht() {
  const w = wijzigingen();
  const secties = [];
  for (const d of w) {
    const v = vindVeld(d.pad);
    const t = v?.sectie?.titel || (d.pad.startsWith('thema') ? 'Thema' : null);
    if (t && !secties.includes(t)) secties.push(t);
  }
  if (!secties.length) return 'inhoud bijgewerkt';
  if (w.length === 1) {
    const l = labelVoor(w[0].pad).split(' › ');
    return `${l.slice(-2).join(' › ')} ${w[0].soort === 'toegevoegd' ? 'toegevoegd' : w[0].soort === 'verwijderd' ? 'verwijderd' : 'aangepast'}`;
  }
  const s = secties.slice(0, 3);
  return (s.length === 1 ? s[0] : `${s.slice(0, -1).join(', ')} en ${s[s.length - 1]}`) + (secties.length > 3 ? ' en meer' : '') + ' bijgewerkt';
}

function controleerAlles() {
  const fouten = [];
  for (const { veld, pad } of alleVelden()) {
    if (veld.type === 'groep') continue;
    const f = valideer(veld, lees(staat.inhoud, pad));
    if (f) fouten.push({ pad, f });
  }
  return fouten;
}

let bezigMetOpslaan = false;
async function opslaan({ bericht } = {}) {
  if (bezigMetOpslaan || staat.alleenLezen) return;
  if (staat.geenOpslag) { nietIngesteld('opslaan'); return; }
  if (!wijzigingen().length) { meld('Er is niets om op te slaan.', { soort: 'info', duur: 2000 }); return; }
  // Alleen fouten in velden die gewijzigd zijn blokkeren; oude fouten niet.
  const gewijzigd = new Set(wijzigingen().map((d) => d.pad));
  const fouten = controleerAlles().filter((f) => [...gewijzigd].some((p) => f.pad === p || f.pad.startsWith(p + '.') || p.startsWith(f.pad + '.')));
  if (fouten.length) {
    const keuze = await vraag({ titel: fouten.length === 1 ? 'Eén veld klopt nog niet' : `${fouten.length} velden kloppen nog niet`,
      inhoud: h('ul', { class: 'fout-lijst' }, fouten.slice(0, 8).map((f) => h('li', null, h('button', { class: 'knop-link', onclick: () => { document.querySelector('.dialoog')?._sluit?.('nakijken'); setTimeout(() => gaNaarVeld(f.pad), 50); } }, labelVoor(f.pad)), h('span', { class: 'stil' }, f.f)))),
      knoppen: [{ label: 'Toch opslaan', waarde: 'toch' }, { label: 'Nakijken', waarde: 'nakijken', soort: 'primair' }] });
    if (keuze === 'nakijken') { gaNaarVeld(fouten[0].pad); return; }
    if (keuze !== 'toch') return;
  }
  const tekst = (bericht || el.bericht.value.trim() || voorstelBericht()).slice(0, 100);
  bezigMetOpslaan = true;
  el.opslaanKnop.disabled = true;
  el.opslaanKnop.firstChild.textContent = 'Opslaan…';
  const inhoud = JSON.parse(JSON.stringify(staat.inhoud));
  const start = Date.now();
  try {
    const r = await api('inhoud', { methode: 'PUT', body: { inhoud, sha: staat.sha, bericht: tekst } });
    zetOpgeslagen(inhoud, r.sha);
    wisConcept();
    el.bericht.value = '';
    staat.versies = null;
    bus.stuur('opgeslagen');
    if (staat.sessie.modus === 'lokaal') {
      meld('Opgeslagen. Je site is bijgewerkt.', { soort: 'goed', id: 'opslag' });
      laadPublicaties().then(tekenPubPil, () => {});
    } else {
      meld('Opgeslagen. Je site wordt nu bijgewerkt (± 1 minuut).', { soort: 'goed', id: 'opslag', duur: 6000 });
      volgPublicatie(start);
    }
  } catch (e) {
    if (e.conflict) await conflict();
    else if (e.nietIngesteld) nietIngesteld('opslaan');
    else if (e.status !== 401) meld(`Opslaan mislukt: ${e.message}`, { soort: 'fout', actie: { label: 'Opnieuw', fn: () => opslaan({ bericht: tekst }) } });
  } finally {
    bezigMetOpslaan = false;
    el.opslaanKnop.disabled = false;
    el.opslaanKnop.firstChild.textContent = 'Opslaan';
    tekenOpslagbalk();
  }
}
app.opslaan = opslaan;

async function conflict() {
  const keuze = await vraag({ titel: 'Iemand anders heeft intussen opgeslagen', tekst: 'Terwijl jij aan het werken was, is de site door iemand anders aangepast. Herlaad de nieuwste versie. Je kan jouw wijzigingen er meteen opnieuw bovenop zetten.',
    knoppen: [{ label: 'Herladen zonder mijn wijzigingen', waarde: 'weg' }, { label: 'Herladen en mijn wijzigingen behouden', waarde: 'behoud', soort: 'primair' }] });
  if (!keuze) return;
  try {
    const mijnBasis = staat.opgeslagen, mijn = staat.inhoud;
    const diff = verschillen(mijnBasis, mijn);
    const r = await api('inhoud');
    laadInhoud(r.inhoud, r.sha);
    if (keuze === 'behoud') { vervang(pasDiffToe(r.inhoud, diff, mijn), 'conflict'); meld('Nieuwste versie geladen, met jouw wijzigingen erbovenop. Kijk ze na en sla opnieuw op.', { soort: 'goed', duur: 8000 }); }
    else { wisConcept(); meld('Nieuwste versie geladen.', { soort: 'goed' }); }
    herteken();
  } catch (e) { meld(`Herladen mislukt: ${e.message}`, { soort: 'fout' }); }
}

async function volgPublicatie(start) {
  app.publiceren = true;
  tekenPubPil();
  const einde = Date.now() + 6 * 60 * 1000;
  let gezien = false;
  while (Date.now() < einde) {
    await new Promise((r) => setTimeout(r, 6000));
    let lijst;
    try { lijst = await laadPublicaties(); } catch { break; }
    const nieuw = lijst.filter((p) => new Date(p.datum).getTime() >= start - 30000);
    if (!nieuw.length) { if (Date.now() - start > 90000) break; continue; }
    gezien = true;
    const p = nieuw[0];
    if (p.status === 'completed') {
      app.publiceren = false;
      tekenPubPil();
      if (p.conclusie === 'success') meld('Je site is bijgewerkt.', { soort: 'goed', actie: { label: 'Bekijken', fn: () => window.open(location.origin + '/', '_blank', 'noopener') } });
      else meld('Het publiceren is mislukt. Je wijzigingen zijn wel bewaard; ARTO bekijkt het.', { soort: 'fout', duur: 12000 });
      return;
    }
  }
  app.publiceren = false;
  tekenPubPil();
  if (!gezien) meld('Opgeslagen. De site wordt op de achtergrond bijgewerkt.', { soort: 'info' });
}

function toonWijzigingen() {
  const w = wijzigingen();
  if (!w.length) return;
  vraag({ titel: `${w.length} niet-opgeslagen ${w.length === 1 ? 'wijziging' : 'wijzigingen'}`, breed: true,
    inhoud: h('div', { class: 'wijzigingen-dlg' }, verschilLijst(w, staat.opgeslagen, { kolommen: ['Opgeslagen', 'Nu'] })),
    knoppen: [{ label: 'Alles weggooien', waarde: 'weg', soort: 'gevaar' }, { label: 'Sluiten', waarde: null }, { label: 'Opslaan', waarde: 'opslaan', soort: 'primair' }] }).then(async (k) => {
    if (k === 'opslaan') opslaan();
    if (k === 'weg') {
      const ok = await vraag({ titel: 'Alle wijzigingen weggooien?', tekst: 'Alles wat je sinds de laatste keer opslaan veranderde, gaat verloren.', knoppen: [{ label: 'Annuleren', waarde: false }, { label: 'Weggooien', waarde: true, soort: 'gevaar' }] });
      if (ok) { verwerp(); meld('Wijzigingen weggegooid.', { soort: 'info', actie: { label: 'Ongedaan maken', fn: () => ongedaan() } }); }
    }
  });
}
app.toonWijzigingen = toonWijzigingen;

async function uitloggen() {
  if (wijzigingen().length && !(await vraag({ titel: 'Uitloggen?', tekst: 'Je hebt niet-opgeslagen wijzigingen. Ze blijven bewaard in deze browser, zodat je later verder kan.', knoppen: [{ label: 'Annuleren', waarde: false }, { label: 'Uitloggen', waarde: true, soort: 'primair' }] }))) return;
  await api('uitloggen', { methode: 'POST' }).catch(() => {});
  staat.sessie.ingelogd = false;
  window.removeEventListener('hashchange', route);
  document.removeEventListener('keydown', sneltoetsen);
  login();
}

// ---------- sneltoetsen en palet ----------
function acties() {
  return [
    { label: 'Opslaan', icoon: 'check', toets: 'Mod+S', doe: () => opslaan(), verborgen: () => !wijzigingen().length },
    { label: 'Ongedaan maken', icoon: 'ongedaan', toets: 'Mod+Z', doe: () => ongedaan(), verborgen: () => !kanOngedaan() },
    { label: 'Wijzigingen nakijken', icoon: 'lijst', doe: toonWijzigingen, verborgen: () => !wijzigingen().length },
    { label: 'Optimaliseer alles', icoon: 'toverstaf', doe: () => { location.hash = '#/optimaliseren'; setTimeout(() => optimaliseerAlles(() => route()), 300); } },
    { label: staat.inhoud?.mededeling?.aan ? 'Mededeling uitzetten' : 'Mededeling aanzetten', icoon: 'mededeling', doe: () => { import('./staat.js').then(({ wijzig }) => { wijzig('mededeling.aan', !staat.inhoud.mededeling?.aan, { samenvoegen: false }); herteken(); meld(staat.inhoud.mededeling.aan ? 'Mededeling staat aan (nog opslaan)' : 'Mededeling staat uit (nog opslaan)', { soort: 'info' }); }); } },
    { label: 'Foto uploaden', icoon: 'upload', doe: () => { location.hash = '#/media?upload=1'; } },
    { label: 'Voorbeeld tonen of verbergen', icoon: 'splits', toets: 'Mod+.', doe: () => zetPreviewZichtbaar(!previewAan) },
    { label: 'Licht of donker', icoon: 'maan', doe: () => { const d = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); zetWeergave(d ? 'licht' : 'donker'); } },
    { label: 'Bekijk je site', icoon: 'extern', doe: () => window.open(location.origin + '/', '_blank', 'noopener') },
    { label: 'Sneltoetsen', icoon: 'toetsenbord', toets: '?', doe: toonSneltoetsen },
    { label: 'Uitloggen', icoon: 'uitloggen', doe: uitloggen },
  ];
}
function palet() { openPalet({ weergaven: WEERGAVEN(), acties: acties(), gaNaarVeld }); }
function toonSneltoetsen() {
  vraag({ titel: 'Sneltoetsen', inhoud: h('dl', { class: 'sneltoetsen' }, SNELTOETSEN.map(([t, l]) => [h('dt', null, kbd(t)), h('dd', null, l)])), knoppen: [{ label: 'Sluiten', waarde: true, soort: 'primair' }] });
}
function inTekst(e) {
  const t = e.target;
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}
function sneltoetsen(e) {
  const mod = e.metaKey || e.ctrlKey;
  if (document.querySelector('.dialoog-achter') && !(mod && e.key.toLowerCase() === 's')) return;
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); opslaan(); return; }
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); palet(); return; }
  if (mod && e.key === '.') { e.preventDefault(); zetPreviewZichtbaar(!previewAan); return; }
  if (mod && e.key.toLowerCase() === 'z' && !inTekst(e)) { e.preventDefault(); if (e.shiftKey) opnieuw(); else ongedaan(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !inTekst(e)) { e.preventDefault(); opnieuw(); return; }
  if (e.altKey && /^Digit[1-9]$/.test(e.code)) {
    const w = WEERGAVEN()[Number(e.code.slice(5)) - 1];
    if (w) { e.preventDefault(); location.hash = w.hash; }
    return;
  }
  if (e.key === '?' && !inTekst(e)) { e.preventDefault(); toonSneltoetsen(); }
}

begin();
