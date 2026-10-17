// Centrale toestand van het paneel: inhoud (werkkopie), opgeslagen versie, ongedaan maken, concept.
import { bus, kloon, debounce, lsLees, lsZet } from './ui.js';
import { lees, zet } from './schema.js';

export const staat = {
  sessie: null,        // { ingelogd, rol, modus, configuratie }
  bron: null,          // bron.json: { template, bestanden, delen, arto }
  basis: null,         // basis-schema.json
  schema: [],          // alle secties
  inhoud: null,        // werkkopie (wat de gebruiker ziet en bewerkt)
  opgeslagen: null,    // laatst opgeslagen versie
  sha: null,
  alleenLezen: false,
  media: null,         // [{ naam, grootte, url, voorbeeld }]
  berichten: null,
  versies: null,
  publicaties: null,
  analyse: null,
  openItems: new Set(),// opengeklapte lijstitems (volledige paden)
  geupload: new Set(), // namen van bestanden die tijdens deze sessie geüpload zijn
};

const terug = [];
const vooruit = [];
let samenvoeg = null;
const MAX_STAPPEN = 120;

function stap() {
  terug.push(kloon(staat.inhoud));
  if (terug.length > MAX_STAPPEN) terug.shift();
  vooruit.length = 0;
}

// Eén veld wijzigen. Snel na elkaar typen in hetzelfde veld wordt één stap voor "ongedaan maken".
export function wijzig(pad, waarde, { samenvoegen = true } = {}) {
  if (staat.alleenLezen) return;
  const oud = lees(staat.inhoud, pad);
  if (JSON.stringify(oud) === JSON.stringify(waarde)) return;
  const nu = Date.now();
  if (!(samenvoegen && samenvoeg && samenvoeg.pad === pad && nu - samenvoeg.t < 1500)) stap();
  samenvoeg = { pad, t: nu };
  zet(staat.inhoud, pad, waarde);
  gewijzigd({ soort: 'veld', pad });
}

// De hele inhoud vervangen (terugzetten, optimaliseren, JSON-editor, import). Eén stap.
export function vervang(nieuw, reden = '') {
  stap();
  samenvoeg = null;
  staat.inhoud = kloon(nieuw);
  gewijzigd({ soort: 'alles', reden });
}

// Structurele wijziging (lijstitem toevoegen, verplaatsen …): functie krijgt de werkkopie.
export function bewerk(fn, { pad } = {}) {
  if (staat.alleenLezen) return;
  stap();
  samenvoeg = null;
  fn(staat.inhoud);
  gewijzigd({ soort: 'structuur', pad });
}

export const kanOngedaan = () => terug.length > 0;
export const kanOpnieuw = () => vooruit.length > 0;
export function ongedaan() {
  if (!terug.length) return false;
  vooruit.push(kloon(staat.inhoud));
  staat.inhoud = terug.pop();
  samenvoeg = null;
  gewijzigd({ soort: 'alles', reden: 'ongedaan' });
  return true;
}
export function opnieuw() {
  if (!vooruit.length) return false;
  terug.push(kloon(staat.inhoud));
  staat.inhoud = vooruit.pop();
  samenvoeg = null;
  gewijzigd({ soort: 'alles', reden: 'opnieuw' });
  return true;
}
export function verwerp() {
  vervang(staat.opgeslagen, 'verworpen');
}

function gewijzigd(info) {
  staat.analyse = staat.analyse ? { ...staat.analyse, verouderd: true } : null;
  bewaarConcept();
  bus.stuur('wijziging', info);
}

// Na laden of opslaan.
export function zetOpgeslagen(inhoud, sha) {
  staat.opgeslagen = kloon(inhoud);
  staat.sha = sha;
  bewaarConcept.nu();
  bus.stuur('opgeslagen-status');
}
export function laadInhoud(inhoud, sha) {
  staat.inhoud = kloon(inhoud);
  terug.length = 0; vooruit.length = 0; samenvoeg = null;
  zetOpgeslagen(inhoud, sha);
}

// ---------- verschillen ----------
const leegWaarde = (w) => w === undefined || w === null || w === '' || w === false;
const isObj = (w) => w !== null && typeof w === 'object' && !Array.isArray(w);
const gelijk = (a, b) => (leegWaarde(a) && leegWaarde(b)) || JSON.stringify(a) === JSON.stringify(b);

export function verschillen(oud, nieuw, pad = '', uit = []) {
  const p = (k) => (pad ? `${pad}.${k}` : String(k));
  if (isObj(oud) && isObj(nieuw)) {
    for (const k of new Set([...Object.keys(oud), ...Object.keys(nieuw)])) verschillen(oud[k], nieuw[k], p(k), uit);
  } else if (Array.isArray(oud) && Array.isArray(nieuw)) {
    if (oud.length === nieuw.length) oud.forEach((_, i) => verschillen(oud[i], nieuw[i], p(i), uit));
    else lijstVerschil(oud, nieuw, p, uit);
  } else if (!gelijk(oud, nieuw)) {
    if ((isObj(oud) || Array.isArray(oud)) && leegWaarde(nieuw)) uit.push({ pad, soort: 'verwijderd', oud, nieuw });
    else if ((isObj(nieuw) || Array.isArray(nieuw)) && leegWaarde(oud)) uit.push({ pad, soort: 'toegevoegd', oud, nieuw });
    else uit.push({ pad, soort: 'gewijzigd', oud, nieuw });
  }
  return uit;
}
function lijstVerschil(a, b, p, uit) {
  const sa = a.map((x) => JSON.stringify(x)), sb = b.map((x) => JSON.stringify(x));
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = sa[i] === sb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0;
  let gatA = [], gatB = [];
  const spoel = () => {
    const k = Math.min(gatA.length, gatB.length);
    for (let x = 0; x < k; x++) verschillen(a[gatA[x]], b[gatB[x]], p(gatB[x]), uit);
    for (let x = k; x < gatA.length; x++) uit.push({ pad: p(gatA[x]), soort: 'verwijderd', oud: a[gatA[x]], nieuw: undefined, index: gatA[x] });
    for (let x = k; x < gatB.length; x++) uit.push({ pad: p(gatB[x]), soort: 'toegevoegd', oud: undefined, nieuw: b[gatB[x]] });
    gatA = []; gatB = [];
  };
  while (i < n || j < m) {
    if (i < n && j < m && sa[i] === sb[j]) { spoel(); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) gatB.push(j++);
    else gatA.push(i++);
  }
  spoel();
}

export const wijzigingen = () => (staat.inhoud && staat.opgeslagen ? verschillen(staat.opgeslagen, staat.inhoud) : []);

// ---------- concept in de browser ----------
const conceptSleutel = () => `arto-concept:${location.host}`;
export const bewaarConcept = debounce(() => {
  if (!staat.inhoud || !staat.opgeslagen) return;
  if (!wijzigingen().length) { lsZet(conceptSleutel(), null); return; }
  lsZet(conceptSleutel(), { inhoud: staat.inhoud, sha: staat.sha, tijd: new Date().toISOString() });
}, 400);
export const leesConcept = () => lsLees(conceptSleutel());
export const wisConcept = () => lsZet(conceptSleutel(), null);
