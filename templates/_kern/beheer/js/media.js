// Mediabibliotheek: raster, uploaden (met verkleinen en omzetten naar WebP in de browser), kiezer, verwijderen.
import { h, $, $$, meld, vraag, bevestig, bytes, bus, kopieer, debounce } from './ui.js';
import { icoon } from './iconen.js';
import { api, apiUpload } from './api.js';
import { staat, bewerk } from './staat.js';
import { alleVelden, labelVoor, lees, zet } from './schema.js';
import { nietIngesteld } from './hulp.js';

const MAX_BREEDTE = 2000;
const KWALITEIT = 0.82;
export const GROOT = 300 * 1024;

export async function laadMedia(opnieuw = false) {
  if (staat.media && !opnieuw) return staat.media;
  const r = await api('media');
  staat.media = r.bestanden || [];
  bus.stuur('media-bijgewerkt');
  return staat.media;
}

export const naamVan = (url) => decodeURIComponent(String(url || '').split('?')[0].split('/').pop());
export const mediaInfo = (url) => (staat.media || []).find((m) => m.url === url || m.naam === naamVan(url) && String(url).startsWith('/img/uploads/'));
export function mediaVoorbeeld(url) {
  if (!url) return '';
  if (String(url).startsWith('/img/uploads/') && staat.geupload.has(naamVan(url))) return '/api/media/bestand?naam=' + encodeURIComponent(naamVan(url));
  return url;
}
const isBeeld = (naam) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(naam);
const isRaster = (naam) => /\.(png|jpe?g|webp|avif)$/i.test(naam);
const extVan = (naam) => (String(naam).split('.').pop() || '').toUpperCase().replace('JPEG', 'JPG');

// Waar wordt deze afbeelding gebruikt in de inhoud?
export function gebruiktOp(url, inhoud = staat.inhoud) {
  const uit = [];
  const zoek = (w, pad) => {
    if (typeof w === 'string') { if (w === url || (w.includes(url) && w.length > url.length)) uit.push(pad); }
    else if (Array.isArray(w)) w.forEach((x, i) => zoek(x, pad ? `${pad}.${i}` : String(i)));
    else if (w && typeof w === 'object') for (const [k, x] of Object.entries(w)) zoek(x, pad ? `${pad}.${k}` : k);
  };
  zoek(inhoud, '');
  return uit;
}
// Vervang een url overal in de inhoud (geeft het aantal vervangingen).
export function vervangUrl(inhoud, oud, nieuw) {
  let n = 0;
  const loop = (o) => {
    for (const k of Object.keys(o)) {
      const w = o[k];
      if (typeof w === 'string' && w.includes(oud)) {
        if (w === oud) { o[k] = nieuw; n++; }
        else { const r = w.split(`(${oud})`).join(`(${nieuw})`); if (r !== w) { o[k] = r; n++; } }
      } else if (w && typeof w === 'object') loop(w);
    }
  };
  loop(inhoud);
  return n;
}

// ---------- verwerken in de browser ----------
async function decodeer(blob) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(blob); } catch { /* val terug op <img> */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
export async function verwerkAfbeelding(bestand, naam = bestand.name) {
  const type = bestand.type || mimeVan(naam);
  const basis = { blob: bestand, naam, type, voor: bestand.size, na: bestand.size, ongewijzigd: true };
  if (/svg|pdf|gif/.test(type) || !/^image\//.test(type)) return basis;
  let beeld;
  try { beeld = await decodeer(bestand); } catch {
    throw new Error(`${naam}: dit formaat kan de browser niet openen. Bewaar de foto als JPG of PNG en probeer opnieuw.`);
  }
  const b = beeld.width || beeld.naturalWidth, hg = beeld.height || beeld.naturalHeight;
  const s = Math.min(1, MAX_BREEDTE / b);
  const doek = document.createElement('canvas');
  doek.width = Math.round(b * s);
  doek.height = Math.round(hg * s);
  const ctx = doek.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(beeld, 0, 0, doek.width, doek.height);
  beeld.close?.();
  const webp = await new Promise((ok) => doek.toBlob(ok, 'image/webp', KWALITEIT));
  if (!webp || webp.type !== 'image/webp') return { ...basis, breedte: b, hoogte: hg };
  if (/webp|avif/.test(type) && s === 1 && webp.size >= bestand.size) return { ...basis, breedte: b, hoogte: hg };
  return { blob: webp, naam: naam.replace(/\.[^.]+$/, '') + '.webp', type: 'image/webp', voor: bestand.size, na: webp.size, ongewijzigd: false, breedte: doek.width, hoogte: doek.height, verkleind: s < 1 };
}
function mimeVan(naam) {
  const e = String(naam).split('.').pop().toLowerCase();
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf', heic: 'image/heic' }[e] || '';
}
const naarBase64 = (blob) => new Promise((ok, nok) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => nok(new Error('Bestand lezen mislukt'));
  r.readAsDataURL(blob);
});
export function veiligeNaam(naam) {
  return String(naam || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|-+$/g, '').replace(/-+(\.[a-z0-9]+)$/, '$1').slice(0, 80);
}
function uniekeNaam(naam, bezet) {
  let n = veiligeNaam(naam) || 'afbeelding.webp';
  if (!/\.[a-z0-9]{2,5}$/.test(n)) n += '.webp';
  const namen = new Set([...(staat.media || []).map((m) => m.naam), ...bezet]);
  if (!namen.has(n)) return n;
  const [, stam, ext] = n.match(/^(.*?)(\.[a-z0-9]+)$/);
  for (let i = 2; i < 999; i++) { const k = `${stam}-${i}${ext}`; if (!namen.has(k)) return k; }
  return `${stam}-${Date.now()}${ext}`;
}

// ---------- uploaden ----------
let paneel = null;
function uploadPaneel() {
  if (paneel?.isConnected) return paneel;
  paneel = h('div', { class: 'upload-paneel', role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'upload-kop' }, h('strong', null, 'Uploaden'), h('button', { class: 'knop-icoon klein', 'aria-label': 'Sluiten', onclick: () => paneel.remove() }, icoon('sluit', 14))),
    h('ul', { class: 'upload-lijst' }));
  document.body.append(paneel);
  return paneel;
}

export async function uploadBestanden(bestanden, { opKlaar } = {}) {
  const lijst = [...bestanden];
  if (!lijst.length) return [];
  const p = uploadPaneel();
  const ul = $('.upload-lijst', p);
  const resultaten = [];
  const bezet = [];
  for (const f of lijst) {
    const balk = h('span', { class: 'voortgang-balk' });
    const status = h('span', { class: 'upload-status' }, 'Verkleinen…');
    const rij = h('li', { class: 'upload-rij' }, h('span', { class: 'upload-naam' }, f.name), h('span', { class: 'voortgang' }, balk), status);
    ul.prepend(rij);
    try {
      if (f.size > 40 * 1024 * 1024) throw new Error('Bestand is groter dan 40 MB.');
      const v = await verwerkAfbeelding(f);
      if (v.blob.size > 8 * 1024 * 1024) throw new Error('Ook na verkleinen groter dan 8 MB.');
      const naam = uniekeNaam(v.naam, bezet);
      bezet.push(naam);
      status.textContent = v.ongewijzigd ? bytes(v.voor) : `${bytes(v.voor)} → ${bytes(v.na)}`;
      const data = await naarBase64(v.blob);
      const r = await apiUpload('media', { naam, type: v.type, data }, (x) => { balk.style.width = Math.round(x * 100) + '%'; });
      balk.style.width = '100%';
      rij.classList.add('klaar');
      status.replaceChildren(icoon('check', 13), v.ongewijzigd ? bytes(v.na) : ` ${bytes(v.voor)} → ${bytes(v.na)}`);
      staat.geupload.add(r.naam);
      const item = { naam: r.naam, grootte: v.blob.size, url: r.url, voorbeeld: r.voorbeeld, nieuw: true };
      staat.media = [item, ...(staat.media || []).filter((m) => m.naam !== r.naam)];
      resultaten.push({ ...item, voor: v.voor, na: v.na });
    } catch (e) {
      rij.classList.add('mislukt');
      status.textContent = e.nietIngesteld ? 'Opslag niet ingesteld' : e.message;
      if (e.nietIngesteld) nietIngesteld('opslaan');
    }
  }
  bus.stuur('media-bijgewerkt');
  const ok = resultaten.length;
  if (ok) meld(ok === 1 ? `${resultaten[0].naam} geüpload` : `${ok} bestanden geüpload`, { soort: 'goed' });
  setTimeout(() => { if (paneel && !$$('.upload-rij:not(.klaar)', paneel).length) paneel.classList.add('weg'); setTimeout(() => { if (paneel?.classList.contains('weg')) paneel.remove(); }, 400); }, 4500);
  opKlaar?.(resultaten);
  return resultaten;
}

// Een bestaande afbeelding opnieuw comprimeren naar WebP; geeft de nieuwe url.
export async function herComprimeer(url) {
  const bron = mediaVoorbeeld(url).startsWith('/api/') ? mediaVoorbeeld(url) : url;
  const r = await fetch(bron, { credentials: 'same-origin' });
  if (!r.ok) throw new Error(`${naamVan(url)} kon niet geladen worden`);
  const blob = await r.blob();
  const v = await verwerkAfbeelding(new File([blob], naamVan(url), { type: blob.type || mimeVan(url) }));
  if (v.ongewijzigd) return { url, voor: v.voor, na: v.na, ongewijzigd: true };
  const naam = uniekeNaam(v.naam, []);
  const res = await apiUpload('media', { naam, type: v.type, data: await naarBase64(v.blob) });
  staat.geupload.add(res.naam);
  staat.media = [{ naam: res.naam, grootte: v.blob.size, url: res.url, voorbeeld: res.voorbeeld, nieuw: true }, ...(staat.media || [])];
  bus.stuur('media-bijgewerkt');
  return { url: res.url, voor: v.voor, na: v.na };
}

// Bestandsgrootte van een afbeelding die niet in uploads staat (HEAD).
const groottes = new Map();
export async function grootteVan(url) {
  const m = mediaInfo(url);
  if (m?.grootte) return m.grootte;
  if (!/^\//.test(url)) return null;
  if (groottes.has(url)) return groottes.get(url);
  try {
    const r = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
    const n = r.ok ? Number(r.headers.get('content-length')) || null : null;
    groottes.set(url, n);
    return n;
  } catch { return null; }
}

// ---------- verwijderen ----------
async function verwijder(item) {
  const gebruik = gebruiktOp(item.url);
  const inhoudEl = gebruik.length ? h('div', { class: 'waarschuwing-blok' }, icoon('waarschuwing', 16),
    h('div', null, h('strong', null, `Deze afbeelding wordt nog gebruikt op ${gebruik.length === 1 ? '1 plaats' : gebruik.length + ' plaatsen'}:`),
      h('ul', null, gebruik.slice(0, 6).map((p) => h('li', null, labelVoor(p)))),
      h('p', null, 'Na het verwijderen toont de site daar geen afbeelding meer.'))) : null;
  const ok = await vraag({ titel: `${item.naam} verwijderen?`, tekst: 'Dit kan je niet ongedaan maken.', inhoud: inhoudEl,
    knoppen: [{ label: 'Annuleren', waarde: false }, { label: gebruik.length ? 'Toch verwijderen' : 'Verwijderen', waarde: true, soort: 'gevaar' }] });
  if (!ok) return false;
  try {
    await api('media', { methode: 'DELETE', query: { naam: item.naam } });
    staat.media = staat.media.filter((m) => m.naam !== item.naam);
    bus.stuur('media-bijgewerkt');
    meld(`${item.naam} verwijderd`, { soort: 'goed' });
    return true;
  } catch (e) {
    meld(e.message, { soort: 'fout' });
    return false;
  }
}

// ---------- raster ----------
function tegel(item, { gekozen, opKies, opOpen }) {
  const gebruik = gebruiktOp(item.url).length;
  const beeld = isBeeld(item.naam);
  return h('button', { type: 'button', class: 'tegel' + (gekozen ? ' gekozen' : ''), 'aria-pressed': opKies ? String(!!gekozen) : null, dataset: { naam: item.naam },
    title: item.naam, onclick: () => (opKies || opOpen)(item), ondblclick: opKies ? () => opKies(item, true) : null },
    h('span', { class: 'tegel-beeld' + (beeld ? '' : ' geen-beeld') },
      beeld ? h('img', { src: item.nieuw ? item.voorbeeld : item.url, alt: '', loading: 'lazy', decoding: 'async',
        onerror: (e) => { if (item.voorbeeld && e.target.src.indexOf('/api/') < 0) e.target.src = item.voorbeeld; } }) : icoon('pdf', 28),
      gekozen ? h('span', { class: 'tegel-vink' }, icoon('check', 14)) : null),
    h('span', { class: 'tegel-onder' },
      h('span', { class: 'tegel-naam' }, item.naam),
      h('span', { class: 'tegel-meta' },
        h('span', { class: 'fmt' + (/\.(webp|avif|svg)$/i.test(item.naam) ? ' goed' : '') }, extVan(item.naam)),
        h('span', { class: item.grootte > GROOT && isRaster(item.naam) ? 'te-groot' : '' }, bytes(item.grootte)),
        gebruik ? h('span', { class: 'in-gebruik', title: `Gebruikt op ${gebruik} plaats(en)` }, icoon('link', 11), String(gebruik)) : null)));
}

function filter(lijst, zoek, soort) {
  const z = zoek.trim().toLowerCase();
  return lijst.filter((m) => (!z || m.naam.toLowerCase().includes(z)) && (soort !== 'beeld' || isBeeld(m.naam)));
}

function dropzone(el, opBestanden) {
  let teller = 0;
  el.addEventListener('dragenter', (e) => { if (![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); teller++; el.classList.add('sleep-actief'); });
  el.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  el.addEventListener('dragleave', () => { if (--teller <= 0) { teller = 0; el.classList.remove('sleep-actief'); } });
  el.addEventListener('drop', (e) => { e.preventDefault(); teller = 0; el.classList.remove('sleep-actief'); if (e.dataTransfer.files?.length) opBestanden(e.dataTransfer.files); });
}
function uploadKnop(label, opBestanden, primair = true) {
  const input = h('input', { type: 'file', multiple: true, accept: 'image/*,.svg,.pdf', hidden: true, onchange: (e) => { opBestanden(e.target.files); e.target.value = ''; } });
  return h('label', { class: `knop ${primair ? 'knop-primair' : ''}`, tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } } }, icoon('upload', 15), label, input);
}

// ---------- de mediaweergave ----------
let zoekTerm = '';
export async function toonMedia(root, { openUpload = false } = {}) {
  const raster = h('div', { class: 'media-raster', role: 'list' });
  const detail = h('aside', { class: 'media-detail', hidden: true, 'aria-label': 'Details van de afbeelding' });
  const tellerEl = h('span', { class: 'kop-meta' });
  const zoekIn = h('input', { class: 'invoer zoek-invoer', type: 'search', placeholder: 'Zoeken op naam', value: zoekTerm, 'aria-label': 'Zoek in media',
    oninput: debounce((e) => { zoekTerm = e.target.value; teken(); }, 120) });
  const upl = (files) => uploadBestanden(files).then(teken);
  const knop = uploadKnop('Uploaden', upl);
  const vak = h('div', { class: 'media-vak' },
    h('div', { class: 'pagina-kop' },
      h('div', null, h('h1', null, 'Media'), h('p', { class: 'pagina-uitleg' }, "Foto's en bestanden van je site. Nieuwe foto's worden automatisch verkleind en omgezet naar WebP, zodat je site snel blijft.")),
      knop),
    h('div', { class: 'werkbalk-rij' }, h('div', { class: 'zoek-wrap' }, icoon('zoeken', 15), zoekIn), tellerEl),
    h('div', { class: 'media-lijf' }, raster, detail),
    h('div', { class: 'sleep-hint', 'aria-hidden': 'true' }, icoon('upload', 28), h('span', null, 'Laat los om te uploaden')));
  dropzone(vak, upl);
  root.replaceChildren(vak);

  let open = null;
  const toonDetail = (item) => {
    open = item;
    $$('.tegel', raster).forEach((t) => t.classList.toggle('open', t.dataset.naam === item?.naam));
    if (!item) { detail.hidden = true; vak.classList.remove('met-detail'); return; }
    vak.classList.add('met-detail');
    detail.hidden = false;
    const gebruik = gebruiktOp(item.url);
    const afm = h('span', null, '…');
    const beeld = isBeeld(item.naam);
    const img = beeld ? h('img', { src: mediaVoorbeeld(item.url) !== item.url ? mediaVoorbeeld(item.url) : item.url, alt: '', onload: (e) => { afm.textContent = `${e.target.naturalWidth} × ${e.target.naturalHeight} px`; }, onerror: (e) => { if (item.voorbeeld && !e.target.src.includes('/api/')) e.target.src = item.voorbeeld; } }) : icoon('pdf', 40);
    const kanOptimaliseren = isRaster(item.naam) && (!/\.(webp|avif)$/i.test(item.naam) || item.grootte > GROOT);
    detail.replaceChildren(
      h('div', { class: 'detail-kop' }, h('strong', null, item.naam), h('button', { class: 'knop-icoon klein', 'aria-label': 'Sluiten', onclick: () => toonDetail(null) }, icoon('sluit', 15))),
      h('div', { class: 'detail-beeld' + (beeld ? '' : ' geen-beeld') }, img),
      h('dl', { class: 'detail-lijst' },
        h('dt', null, 'Formaat'), h('dd', null, extVan(item.naam)),
        h('dt', null, 'Grootte'), h('dd', { class: item.grootte > GROOT && isRaster(item.naam) ? 'te-groot' : '' }, bytes(item.grootte), item.grootte > GROOT && isRaster(item.naam) ? ' · groot' : ''),
        beeld ? [h('dt', null, 'Afmetingen'), h('dd', null, afm)] : null,
        h('dt', null, 'Adres'), h('dd', null, h('button', { class: 'knop-link mono klein', onclick: () => kopieer(item.url), title: 'Kopiëren' }, item.url, ' ', icoon('kopie', 12)))),
      h('div', { class: 'detail-sectie' }, h('h3', null, 'Gebruikt op'),
        gebruik.length ? h('ul', { class: 'gebruik-lijst' }, gebruik.map((p) => h('li', null, h('a', { href: '#/veld/' + encodeURIComponent(p) }, labelVoor(p), icoon('rechts', 12))))) : h('p', { class: 'stil' }, 'Nergens. Je kan deze afbeelding veilig verwijderen.')),
      h('div', { class: 'detail-knoppen' },
        kanOptimaliseren ? h('button', { class: 'knop', onclick: async (e) => {
          e.currentTarget.disabled = true;
          try {
            const r = await herComprimeer(item.url);
            if (r.ongewijzigd) { meld('Deze afbeelding is al zo klein als het kan.', { soort: 'info' }); return; }
            bewerk((inh) => vervangUrl(inh, item.url, r.url));
            meld(`Omgezet: ${bytes(r.voor)} → ${bytes(r.na)}. Vergeet niet op te slaan.`, { soort: 'goed' });
            teken();
            toonDetail(staat.media.find((m) => m.url === r.url));
          } catch (err) { meld(err.message, { soort: 'fout' }); } finally { e.currentTarget && (e.currentTarget.disabled = false); }
        } }, icoon('vonk', 15), 'Optimaliseren (WebP)') : null,
        h('button', { class: 'knop knop-gevaar-zacht', onclick: async () => { if (await verwijder(item)) { toonDetail(null); teken(); } } }, icoon('prullenbak', 15), 'Verwijderen')));
  };

  const teken = () => {
    const lijst = filter(staat.media || [], zoekTerm, 'alles');
    const totaal = (staat.media || []).reduce((n, m) => n + (m.grootte || 0), 0);
    tellerEl.textContent = staat.media ? `${(staat.media || []).length} bestanden · ${bytes(totaal)}` : '';
    if (!staat.media) return;
    if (!lijst.length) {
      raster.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('media', 28), h('h3', null, zoekTerm ? 'Niets gevonden' : 'Nog geen bestanden'),
        h('p', null, zoekTerm ? `Geen bestanden met "${zoekTerm}" in de naam.` : "Sleep foto's hierheen of klik op Uploaden."),
        zoekTerm ? null : uploadKnop("Foto's kiezen", upl, false)));
      return;
    }
    raster.replaceChildren(...lijst.map((m) => tegel(m, { gekozen: false, opOpen: toonDetail })));
    if (open) { const nu = staat.media.find((m) => m.naam === open.naam); toonDetail(nu || null); }
  };

  raster.replaceChildren(...Array.from({ length: 8 }, () => h('div', { class: 'tegel skelet' })));
  try {
    await laadMedia(true);
    teken();
  } catch (e) {
    if (e.nietIngesteld) raster.replaceChildren(nietIngesteld('opslaan', { blok: true }));
    else raster.replaceChildren(h('div', { class: 'leeg-staat' }, icoon('waarschuwing', 24), h('h3', null, 'Media laden lukte niet'), h('p', null, e.message)));
  }
  if (openUpload) knop.querySelector('input')?.click();
}

// ---------- kiezer vanuit een afbeeldingsveld ----------
export async function kiesMedia({ huidig = '', titel = 'Afbeelding' } = {}) {
  let gekozen = (staat.media || []).find((m) => m.url === huidig) || null;
  let zoek = '';
  const raster = h('div', { class: 'media-raster kiezer', role: 'listbox', 'aria-label': 'Afbeeldingen' });
  let klaarFn;
  const teken = () => {
    const lijst = filter(staat.media || [], zoek, 'beeld');
    if (!lijst.length) {
      raster.replaceChildren(h('div', { class: 'leeg-staat klein' }, icoon('media', 24), h('p', null, zoek ? 'Niets gevonden.' : "Nog geen foto's. Upload er een.")));
      return;
    }
    raster.replaceChildren(...lijst.map((m) => tegel(m, { gekozen: gekozen?.naam === m.naam, opKies: (item, meteen) => {
      gekozen = item;
      if (meteen) return klaarFn?.(item.url);
      teken();
      gebruikKnop.disabled = false;
    } })));
  };
  const upl = async (files) => {
    const r = await uploadBestanden(files);
    if (r.length) { gekozen = staat.media.find((m) => m.naam === r[0].naam); gebruikKnop.disabled = false; }
    teken();
  };
  const gebruikKnop = h('button', { class: 'knop knop-primair', disabled: !gekozen, onclick: () => gekozen && klaarFn?.(gekozen.url) }, 'Gebruiken');
  const inhoud = h('div', { class: 'kiezer-vak' },
    h('div', { class: 'werkbalk-rij' },
      h('div', { class: 'zoek-wrap' }, icoon('zoeken', 15), h('input', { class: 'invoer zoek-invoer', type: 'search', placeholder: 'Zoeken', 'aria-label': 'Zoeken', oninput: (e) => { zoek = e.target.value; teken(); } })),
      uploadKnop('Nieuwe uploaden', upl, false)),
    raster,
    h('div', { class: 'sleep-hint', 'aria-hidden': 'true' }, icoon('upload', 28), h('span', null, 'Laat los om te uploaden')),
    h('div', { class: 'dialoog-knoppen' }, h('span', { class: 'stil klein' }, 'Dubbelklik om meteen te kiezen'), h('span', { class: 'spacer' }),
      h('button', { class: 'knop', onclick: () => klaarFn?.(null) }, 'Annuleren'), gebruikKnop));
  dropzone(inhoud, upl);
  raster.replaceChildren(...Array.from({ length: 6 }, () => h('div', { class: 'tegel skelet' })));
  const belofte = vraag({ titel: `${titel} kiezen`, inhoud, knoppen: [], breed: true });
  const dlg = document.querySelector('.dialoog:last-of-type') || $$('.dialoog').pop();
  klaarFn = (w) => dlg?._sluit?.(w);
  laadMedia().then(teken).catch((e) => raster.replaceChildren(e.nietIngesteld ? nietIngesteld('opslaan', { blok: true }) : h('p', null, e.message)));
  const w = await belofte;
  return w ?? null;
}
