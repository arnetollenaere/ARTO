// Praat met de beheer-API (/api/*, zie _kern/worker.js).
import { bus } from './ui.js';

export class ApiFout extends Error {
  constructor(status, melding, data) { super(melding); this.status = status; this.data = data; }
  get nietIngesteld() { return this.status === 503; }
  get conflict() { return this.status === 409; }
}

const OPENBAAR = new Set(['sessie', 'login', 'bericht']);

export async function api(route, { methode = 'GET', body, query } = {}) {
  const qs = query ? '?' + new URLSearchParams(query) : '';
  const kop = { accept: 'application/json' };
  if (methode !== 'GET') kop['x-arto'] = '1';
  if (body !== undefined) kop['content-type'] = 'application/json';
  let r;
  try {
    r = await fetch(`/api/${route}${qs}`, { method: methode, credentials: 'same-origin', headers: kop, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiFout(0, 'Geen verbinding. Controleer je internet en probeer opnieuw.');
  }
  let data = null;
  try { data = await r.json(); } catch { /* geen JSON */ }
  if (!r.ok) {
    const melding = data?.fout || `Er ging iets mis (${r.status})`;
    if (r.status === 401 && !OPENBAAR.has(route)) bus.stuur('uitgelogd');
    throw new ApiFout(r.status, melding, data);
  }
  return data;
}

// Upload met voortgang (fetch kent geen uploadvoortgang).
export function apiUpload(route, body, opVoortgang) {
  return new Promise((ok, nok) => {
    const x = new XMLHttpRequest();
    x.open('POST', `/api/${route}`);
    x.withCredentials = true;
    x.setRequestHeader('content-type', 'application/json');
    x.setRequestHeader('accept', 'application/json');
    x.setRequestHeader('x-arto', '1');
    x.upload.onprogress = (e) => e.lengthComputable && opVoortgang?.(e.loaded / e.total);
    x.onload = () => {
      let data = null;
      try { data = JSON.parse(x.responseText); } catch { /* */ }
      if (x.status >= 200 && x.status < 300) ok(data);
      else {
        if (x.status === 401) bus.stuur('uitgelogd');
        nok(new ApiFout(x.status, data?.fout || `Upload mislukt (${x.status})`, data));
      }
    };
    x.onerror = () => nok(new ApiFout(0, 'Geen verbinding tijdens het uploaden.'));
    x.send(JSON.stringify(body));
  });
}

// Statisch bestand van de site ophalen (bron.json, schema …).
export async function haal(pad, soort = 'json') {
  const r = await fetch(pad, { credentials: 'same-origin', cache: 'no-store' });
  if (!r.ok) throw new ApiFout(r.status, `${pad} niet gevonden`);
  return soort === 'json' ? r.json() : r.text();
}
