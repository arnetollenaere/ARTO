// Analyse van de hele site: rendert elke pagina, leest de HTML met DOMParser en controleert inhoud,
// vindbaarheid, toegankelijkheid en snelheid. Elk resultaat kan naar een veld springen en waar mogelijk
// automatisch hersteld worden.
import { staat } from './staat.js';
import { kloon } from './ui.js';
import { renderPagina, paginas, kopGegevens, paginaSeo } from './render.js';
import { alleVelden, lees, zet, paginaNaam, itemTitel, labelVoor, themaLabel, altVeldVan } from './schema.js';
import { contrast, contrastTekst, themaParen, geldigHex } from './kleur.js';
import { valideer } from './velden.js';
import { mediaInfo, grootteVan, herComprimeer, vervangUrl, laadMedia, GROOT, naamVan } from './media.js';

export const CATEGORIEEN = {
  snelheid: { naam: 'Snelheid', uitleg: 'Hoe vlot je site laadt, vooral op een gsm.' },
  vindbaarheid: { naam: 'Vindbaarheid', uitleg: 'Hoe goed Google je site begrijpt en toont.' },
  toegankelijkheid: { naam: 'Toegankelijkheid', uitleg: 'Of iedereen je site kan gebruiken, ook met een beperking.' },
  inhoud: { naam: 'Inhoud', uitleg: 'Of alle belangrijke gegevens volledig en actueel zijn.' },
};
const STRAF = { fout: 0.2, waarschuwing: 0.08, tip: 0.025 };

const cacheGrootte = new Map();
const cacheStatus = new Map();
async function bestandGrootte(url) {
  if (cacheGrootte.has(url)) return cacheGrootte.get(url);
  const p = (async () => {
    try {
      const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) return { ok: false, status: r.status, bytes: 0, tekst: '' };
      const type = r.headers.get('content-type') || '';
      if (/css|javascript|text/.test(type) || /\.(css|js|mjs)(\?|$)/.test(url)) { const t = await r.text(); return { ok: true, bytes: new Blob([t]).size, tekst: t, type }; }
      const b = await r.blob();
      return { ok: true, bytes: b.size, tekst: '', type };
    } catch { return { ok: false, status: 0, bytes: 0, tekst: '' }; }
  })();
  cacheGrootte.set(url, p);
  return p;
}
async function bestaat(url) {
  if (cacheStatus.has(url)) return cacheStatus.get(url);
  const p = fetch(url, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store' }).then((r) => r.status !== 404, () => true);
  cacheStatus.set(url, p);
  return p;
}
export function wisCache() { cacheGrootte.clear(); cacheStatus.clear(); }

// ---------- voorstellen ----------
const kap = (t, n) => {
  t = String(t || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const k = t.slice(0, n - 1);
  const i = k.lastIndexOf(' ');
  return (i > n * 0.6 ? k.slice(0, i) : k).replace(/[\s,.;:–-]+$/, '') + '…';
};
// Afkappen, liefst na een volledige zin.
function kapZin(t, n) {
  t = String(t || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const k = t.slice(0, n);
  const zin = Math.max(k.lastIndexOf('. '), k.lastIndexOf('! '), k.lastIndexOf('? '));
  if (zin > n * 0.55) return k.slice(0, zin + 1);
  return kap(t, n);
}
function tekstVanPagina(doc) {
  const wortel = doc.querySelector('main') || doc.body;
  if (!wortel) return '';
  const kloonEl = wortel.cloneNode(true);
  kloonEl.querySelectorAll('header, footer, nav, script, style, form, .arto-mededeling, h1, button, time').forEach((x) => x.remove());
  const stukken = [...kloonEl.querySelectorAll('p, li, dd')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 25 && t.split(' ').length >= 5 && (t.match(/[·|]/g) || []).length < 2);
  let uit = '';
  for (const s of stukken) { if (uit.length >= 150) break; uit += (uit ? ' ' : '') + (/[.!?…]$/.test(s) ? s : s + '.'); }
  return uit;
}
export function voorstelTitel(inhoud, bestand, doc) {
  const s = inhoud.site || {};
  const gemeente = inhoud.contact?.gemeente || '';
  const naam = s.naam || '';
  if (bestand === 'index.html') {
    let t = s.slogan ? `${naam} – ${s.slogan}` : naam;
    if (t.length > 60) t = naam;
    if (gemeente && !t.toLowerCase().includes(gemeente.toLowerCase()) && t.length + gemeente.length + 3 <= 60) t += ` · ${gemeente}`;
    return t;
  }
  const h1 = doc?.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim();
  let t = h1 && h1 !== naam && h1.length <= 45 ? h1 : paginaNaam(bestand);
  if (gemeente && !t.toLowerCase().includes(gemeente.toLowerCase()) && `${t} in ${gemeente} | ${naam}`.length <= 60) t += ` in ${gemeente}`;
  return t;
}
export function voorstelBeschrijving(inhoud, bestand, doc) {
  const s = inhoud.site || {};
  const c = inhoud.contact || {};
  let t = tekstVanPagina(doc);
  if (t.length < 60) {
    const basis = [s.slogan, t].filter(Boolean).join('. ');
    t = `${s.naam || ''}${c.gemeente ? ` in ${c.gemeente}` : ''}${basis ? ': ' + basis : ''}`;
    if (bestand !== 'index.html') t = `${paginaNaam(bestand)} – ${t}`;
  }
  return kapZin(t, 155);
}
function voorstelAlt(veld, keten, inhoud) {
  const naam = inhoud.site?.naam || '';
  const item = [...keten].reverse().find((k) => k.item);
  if (item) {
    const t = itemTitel(item.veld, item.item, item.index);
    const generiek = /^(foto|afbeelding|beeld|plaatje)$/i.test(veld.label || '');
    return generiek ? t : `${veld.label} van ${t.charAt(0).toLowerCase() + t.slice(1)}`;
  }
  if (/logo/i.test(veld.pad)) return `Logo van ${naam}`;
  const label = (veld.label || 'Foto').replace(/^grote\s+/i, '');
  return `${label.charAt(0).toUpperCase() + label.slice(1)} van ${naam}`;
}
export function normaliseerSocial(netwerk, url) {
  let u = String(url || '').trim();
  if (!u) return u;
  const handle = u.replace(/^@/, '');
  const basis = { instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/@', x: 'https://x.com/', facebook: 'https://www.facebook.com/', youtube: 'https://www.youtube.com/@', pinterest: 'https://www.pinterest.com/', linkedin: 'https://www.linkedin.com/company/' }[String(netwerk || '').toLowerCase()];
  if (/^@?[\w.]+$/.test(u) && !u.includes('.') && basis) return basis + handle;
  if (/^@[\w.]+$/.test(u) && basis) return basis + handle;
  if (/^(www\.)?[\w-]+\.[a-z]{2,}/i.test(u)) u = 'https://' + u;
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:/i, 'https:');
  return u;
}
export function btwControle(btw) {
  const cijfers = String(btw || '').replace(/^BE/i, '').replace(/\D/g, '');
  const n = cijfers.length === 9 ? '0' + cijfers : cijfers;
  if (n.length !== 10 || !/^[01]/.test(n)) return { geldig: false, n };
  const geldig = 97 - (Number(n.slice(0, 8)) % 97) === Number(n.slice(8));
  return { geldig, n, mooi: `BE ${n.slice(0, 4)}.${n.slice(4, 7)}.${n.slice(7)}` };
}
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
function datumUitTekst(t) {
  t = String(t || '').toLowerCase();
  const nu = new Date();
  const data = [];
  for (const m of t.matchAll(/(?<![€\d,.]\s?)(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?(?![\d,])/g)) {
    const dag = Number(m[1]), maand = Number(m[2]);
    if (dag < 1 || dag > 31 || maand < 1 || maand > 12) continue;
    const j = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : nu.getFullYear();
    data.push(new Date(j, maand - 1, dag, 23, 59));
  }
  for (const m of t.matchAll(new RegExp(`(\\d{1,2})\\s+(${MAANDEN.join('|')})(?:\\s+(\\d{4}))?`, 'g'))) {
    data.push(new Date(m[3] ? Number(m[3]) : nu.getFullYear(), MAANDEN.indexOf(m[2]), Number(m[1]), 23, 59));
  }
  return data.length ? new Date(Math.max(...data)) : null;
}
const vandaag = () => new Date(new Date().toDateString());

// ---------- de analyse ----------
export async function analyseer({ inhoud = staat.inhoud, opVoortgang } = {}) {
  const items = [];
  const goed = [];
  const metingen = {};
  const voeg = (r) => items.push(r);
  const ok = (categorie, titel) => goed.push({ categorie, titel });
  const lijst = paginas();
  const seoPaginas = inhoud.seo?.paginas || [];
  const padSeo = (bestand, veld) => {
    if (bestand === 'index.html' && veld !== 'pagina') return `seo.${veld}`;
    const i = seoPaginas.findIndex((p) => p.pagina === bestand || '/' + bestand.replace(/\.html$/, '') === p.pagina);
    return i >= 0 ? `seo.paginas.${i}.${veld}` : 'seo.paginas';
  };
  // Zorg dat er een seo.paginas-item voor deze pagina is in het concept, geef het pad terug.
  const seoItem = (draft, bestand) => {
    draft.seo ||= {};
    draft.seo.paginas ||= [];
    let i = draft.seo.paginas.findIndex((p) => p.pagina === bestand);
    if (i < 0) { draft.seo.paginas.push({ pagina: bestand, titel: '', beschrijving: '' }); i = draft.seo.paginas.length - 1; }
    return `seo.paginas.${i}`;
  };

  opVoortgang?.('Pagina’s renderen');
  if (!staat.media) await laadMedia().catch(() => {});
  const pags = [];
  for (const p of lijst) {
    try {
      const html = renderPagina(inhoud, p.bestand);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      pags.push({ ...p, html, doc, kop: kopGegevens(inhoud, p.bestand), naam: paginaNaam(p.bestand) });
    } catch (e) {
      voeg({ id: `render:${p.bestand}`, categorie: 'inhoud', ernst: 'fout', titel: `${paginaNaam(p.bestand)} kan niet gemaakt worden`, uitleg: `De pagina geeft een fout: ${e.message}. Laat ARTO dit bekijken.`, pagina: p.bestand });
    }
  }

  // ===== Vindbaarheid: titels en beschrijvingen =====
  const titels = new Map(), beschrijvingen = new Map();
  for (const p of pags) {
    const k = p.kop;
    const eigen = p.bestand === 'index.html' ? inhoud.seo?.titel : paginaSeo(inhoud, p.bestand)?.titel;
    if (!eigen) {
      const voorstel = voorstelTitel(inhoud, p.bestand, p.doc);
      voeg({ id: `titel-ontbreekt:${p.bestand}`, categorie: 'vindbaarheid', ernst: p.bestand === 'index.html' ? 'fout' : 'waarschuwing', pagina: p.bestand,
        titel: `${p.naam} heeft geen eigen titel voor Google`,
        uitleg: p.bestand === 'index.html' ? 'De titel is het blauwe kopje in Google. Zonder eigen titel toont Google alleen je bedrijfsnaam.' : `Nu krijgt deze pagina dezelfde titel als je startpagina ("${k.titel}"). Een eigen titel helpt Google om de juiste pagina te tonen.`,
        pad: padSeo(p.bestand, 'titel'),
        herstel: { auto: true, label: 'Titel invullen', omschrijving: `Titel voor ${p.naam}: "${voorstel}"`, voer: (d) => { if (p.bestand === 'index.html') zet(d, 'seo.titel', voorstel); else { const ip = seoItem(d, p.bestand); zet(d, ip + '.titel', voorstel); } } } });
    } else {
      const n = k.titel.length;
      if (n > 65) voeg({ id: `titel-lang:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'waarschuwing', pagina: p.bestand, titel: `Titel van ${p.naam} is te lang (${n} tekens)`, uitleg: `Google toont ongeveer 60 tekens; de rest wordt afgekapt met "…". Volledige titel: "${k.titel}".`, pad: padSeo(p.bestand, 'titel') });
      else if (n < 25) voeg({ id: `titel-kort:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'tip', pagina: p.bestand, titel: `Titel van ${p.naam} is erg kort`, uitleg: `"${k.titel}" zegt weinig. Vermeld wat je doet en waar, bv. "Bakkerij in Gent".`, pad: padSeo(p.bestand, 'titel') });
      else ok('vindbaarheid', `Titel van ${p.naam} heeft een goede lengte`);
    }
    titels.set(k.titel, [...(titels.get(k.titel) || []), p]);

    const eigenB = p.bestand === 'index.html' ? inhoud.seo?.beschrijving : paginaSeo(inhoud, p.bestand)?.beschrijving;
    if (!eigenB) {
      const voorstel = voorstelBeschrijving(inhoud, p.bestand, p.doc);
      voeg({ id: `beschrijving-ontbreekt:${p.bestand}`, categorie: 'vindbaarheid', ernst: p.bestand === 'index.html' ? 'fout' : 'waarschuwing', pagina: p.bestand,
        titel: `${p.naam} heeft geen beschrijving voor Google`,
        uitleg: k.beschrijving ? `Google toont nu "${kap(k.beschrijving, 80)}". Een eigen beschrijving van 1 à 2 zinnen overtuigt meer mensen om te klikken.` : 'De beschrijving is de grijze tekst onder je titel in Google. Zonder beschrijving kiest Google zelf een willekeurig stukje tekst.',
        pad: padSeo(p.bestand, 'beschrijving'),
        herstel: { auto: true, label: 'Beschrijving invullen', omschrijving: `Beschrijving voor ${p.naam}: "${voorstel}"`, voer: (d) => { if (p.bestand === 'index.html') zet(d, 'seo.beschrijving', voorstel); else { const ip = seoItem(d, p.bestand); zet(d, ip + '.beschrijving', voorstel); } } } });
    } else {
      const n = k.beschrijving.length;
      if (n > 160) voeg({ id: `beschrijving-lang:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'tip', pagina: p.bestand, titel: `Beschrijving van ${p.naam} is te lang (${n} tekens)`, uitleg: 'Google toont ongeveer 155 tekens. Zet het belangrijkste vooraan.', pad: padSeo(p.bestand, 'beschrijving') });
      else if (n < 60) voeg({ id: `beschrijving-kort:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'tip', pagina: p.bestand, titel: `Beschrijving van ${p.naam} is kort (${n} tekens)`, uitleg: 'Mik op 70 tot 155 tekens: wat bied je aan, waar, en waarom bij jou.', pad: padSeo(p.bestand, 'beschrijving') });
      else ok('vindbaarheid', `Beschrijving van ${p.naam} heeft een goede lengte`);
    }
    if (k.beschrijving) beschrijvingen.set(k.beschrijving, [...(beschrijvingen.get(k.beschrijving) || []), p]);

    // Eén h1
    const h1 = p.doc.querySelectorAll('h1').length;
    if (h1 === 0) voeg({ id: `h1-geen:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'fout', pagina: p.bestand, titel: `${p.naam} heeft geen hoofdtitel (h1)`, uitleg: 'Elke pagina hoort één grote hoofdtitel te hebben. Google gebruikt die om te begrijpen waarover de pagina gaat. Dit zit in het ontwerp: laat ARTO het nakijken.' });
    else if (h1 > 1) voeg({ id: `h1-meer:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'waarschuwing', pagina: p.bestand, titel: `${p.naam} heeft ${h1} hoofdtitels (h1)`, uitleg: 'Gebruik precies één h1 per pagina; de rest worden tussentitels.' });
    else ok('vindbaarheid', `${p.naam} heeft precies één hoofdtitel`);

    if (!p.doc.querySelector('meta[name=viewport]')) voeg({ id: `viewport:${p.bestand}`, categorie: 'vindbaarheid', ernst: 'fout', pagina: p.bestand, titel: `${p.naam} is niet ingesteld voor gsm's`, uitleg: 'De <meta name="viewport"> ontbreekt, waardoor de pagina op een gsm piepklein wordt getoond. Google rangschikt zo’n pagina lager.' });
  }
  for (const [t, ps] of titels) if (ps.length > 1) voeg({ id: `titel-dubbel:${t}`, categorie: 'vindbaarheid', ernst: 'waarschuwing', titel: `${ps.length} pagina's hebben dezelfde titel`, uitleg: `${ps.map((p) => p.naam).join(', ')} heten allemaal "${t}". Geef elke pagina een eigen titel.`, pad: padSeo(ps.find((p) => p.bestand !== 'index.html')?.bestand || ps[0].bestand, 'titel') });
  for (const [b, ps] of beschrijvingen) if (ps.length > 1) voeg({ id: `beschrijving-dubbel:${b.slice(0, 40)}`, categorie: 'vindbaarheid', ernst: 'tip', titel: `${ps.length} pagina's hebben dezelfde beschrijving`, uitleg: `${ps.map((p) => p.naam).join(', ')} tonen dezelfde tekst in Google. Een eigen beschrijving per pagina werkt beter.`, pad: padSeo(ps.find((p) => p.bestand !== 'index.html')?.bestand || ps[0].bestand, 'beschrijving') });
  if (pags.length && [...titels.values()].every((ps) => ps.length === 1)) ok('vindbaarheid', 'Elke pagina heeft een unieke titel');

  // Deelafbeelding
  if (!inhoud.seo?.afbeelding) {
    const kandidaat = [...alleVelden(inhoud, { ookVerborgen: true })].map((v) => ({ ...v, w: lees(inhoud, v.pad) })).find((v) => v.veld.type === 'afbeelding' && v.w && !/logo|favicon|seo\./i.test(v.pad) && !/\.svg$/i.test(v.w));
    voeg({ id: 'deelafbeelding', categorie: 'vindbaarheid', ernst: 'waarschuwing', titel: 'Geen deelafbeelding ingesteld', uitleg: 'Als iemand je site deelt via WhatsApp of Facebook, verschijnt er nu geen foto. Een deelafbeelding van 1200 × 630 px valt veel meer op.', pad: 'seo.afbeelding',
      herstel: kandidaat ? { auto: true, label: 'Foto gebruiken', omschrijving: `Deelafbeelding: ${naamVan(kandidaat.w)} (uit ${labelVoor(kandidaat.pad, inhoud)})`, voer: (d) => zet(d, 'seo.afbeelding', kandidaat.w) } : null });
  } else ok('vindbaarheid', 'Er is een deelafbeelding voor sociale media');
  if (!inhoud.site?.favicon) voeg({ id: 'favicon', categorie: 'vindbaarheid', ernst: 'tip', titel: 'Geen favicon', uitleg: 'Het kleine icoon in het browsertabblad en in Google. Een vierkant logo werkt het best.', pad: 'site.favicon',
    herstel: inhoud.site?.logo ? { auto: false, label: 'Logo gebruiken', omschrijving: 'Favicon: je logo', voer: (d) => zet(d, 'site.favicon', inhoud.site.logo) } : null });
  if (/example\.com/.test(staat.bron?.arto?.basisUrl || '') || !inhoud.site?.domein) voeg({ id: 'domein', categorie: 'vindbaarheid', ernst: 'fout', titel: 'Het domein van de site is niet ingevuld', uitleg: 'Google krijgt nu verkeerde adressen (canonical en sitemap wijzen naar example.com).', pad: 'site.domein' });

  // Socials
  (inhoud.socials || []).forEach((s, i) => {
    const pad = `socials.${i}.url`;
    if (!s.url) { voeg({ id: `social-leeg:${i}`, categorie: 'inhoud', ernst: 'tip', titel: `${s.netwerk || 'Sociaal profiel'} zonder link`, uitleg: 'Vul de link in of verwijder dit profiel, anders staat er een lege knop op je site.', pad }); return; }
    const norm = normaliseerSocial(s.netwerk, s.url);
    const geldig = /^https:\/\/[^\s/]+\.[^\s]{2,}/.test(norm);
    if (norm !== s.url) voeg({ id: `social-url:${i}`, categorie: 'vindbaarheid', ernst: 'waarschuwing', titel: `Link naar ${s.netwerk || 'sociaal profiel'} is onvolledig`, uitleg: `"${s.url}" werkt niet als link. Het moet een volledig adres zijn dat met https:// begint.`, pad,
      herstel: geldig ? { auto: true, label: 'Link herstellen', omschrijving: `${s.netwerk}: ${s.url} → ${norm}`, voer: (d) => zet(d, pad, norm) } : null });
    else if (!geldig) voeg({ id: `social-ongeldig:${i}`, categorie: 'vindbaarheid', ernst: 'waarschuwing', titel: `Link naar ${s.netwerk || 'sociaal profiel'} lijkt ongeldig`, uitleg: `"${s.url}" is geen geldig webadres.`, pad });
    else {
      const verwacht = { instagram: /instagram\.com/, facebook: /facebook\.com|fb\.com/, tiktok: /tiktok\.com/, linkedin: /linkedin\.com/, youtube: /youtube\.com|youtu\.be/, pinterest: /pinterest\./, x: /x\.com|twitter\.com/ }[String(s.netwerk).toLowerCase()];
      if (verwacht && !verwacht.test(s.url)) voeg({ id: `social-netwerk:${i}`, categorie: 'inhoud', ernst: 'tip', titel: `Link bij ${s.netwerk} wijst naar een andere site`, uitleg: `${s.url} lijkt geen ${s.netwerk}-adres. Klopt het netwerk?`, pad });
      else ok('vindbaarheid', `Link naar ${s.netwerk} is in orde`);
    }
  });

  // ===== Inhoud =====
  const c = inhoud.contact || {};
  if (!c.btw) voeg({ id: 'btw', categorie: 'inhoud', ernst: 'fout', titel: 'Ondernemingsnummer ontbreekt', uitleg: 'Een Belgische bedrijfssite moet het ondernemingsnummer (btw-nummer) vermelden. Dat is wettelijk verplicht.', pad: 'contact.btw' });
  else {
    const b = btwControle(c.btw);
    if (!b.geldig) voeg({ id: 'btw-ongeldig', categorie: 'inhoud', ernst: 'waarschuwing', titel: 'Ondernemingsnummer lijkt niet te kloppen', uitleg: `"${c.btw}" is geen geldig Belgisch ondernemingsnummer (10 cijfers, bv. BE 0123.456.749). Controleer het even.`, pad: 'contact.btw' });
    else if (b.mooi !== c.btw) voeg({ id: 'btw-vorm', categorie: 'inhoud', ernst: 'tip', titel: 'Ondernemingsnummer in de standaardvorm schrijven', uitleg: `Schrijf het als ${b.mooi}, zo herkent iedereen het meteen.`, pad: 'contact.btw', herstel: { auto: true, label: 'Netjes schrijven', omschrijving: `Btw-nummer: ${c.btw} → ${b.mooi}`, voer: (d) => zet(d, 'contact.btw', b.mooi) } });
    else ok('inhoud', 'Ondernemingsnummer staat erop en klopt');
  }
  const contactOntbreekt = [['telefoon', 'telefoonnummer'], ['email', 'e-mailadres'], ['adres', 'adres'], ['gemeente', 'gemeente']].filter(([k]) => !c[k]);
  if (contactOntbreekt.length) voeg({ id: 'contact', categorie: 'inhoud', ernst: contactOntbreekt.length > 2 ? 'fout' : 'waarschuwing', titel: `Contactgegevens onvolledig: ${contactOntbreekt.map((x) => x[1]).join(', ')}`, uitleg: 'Bezoekers en Google zoeken eerst hoe ze je kunnen bereiken. Volledige gegevens helpen ook om in Google Maps te verschijnen.', pad: `contact.${contactOntbreekt[0][0]}` });
  else ok('inhoud', 'Contactgegevens zijn volledig');
  const uren = inhoud.openingsuren;
  if (Array.isArray(uren)) {
    if (!uren.length) voeg({ id: 'uren', categorie: 'inhoud', ernst: 'waarschuwing', titel: 'Geen openingsuren', uitleg: 'Openingsuren zijn een van de meest gezochte gegevens. Zet ze erop, ook als je op afspraak werkt.', pad: 'openingsuren' });
    else {
      const leegU = uren.map((u, i) => [u, i]).filter(([u]) => !String(u.uren || '').trim());
      if (leegU.length) voeg({ id: 'uren-leeg', categorie: 'inhoud', ernst: 'waarschuwing', titel: `Openingsuren onvolledig (${leegU.map(([u]) => u.dag).join(', ')})`, uitleg: 'Vul de uren in of zet "Gesloten".', pad: `openingsuren.${leegU[0][1]}.uren` });
      else ok('inhoud', 'Openingsuren zijn ingevuld');
    }
  }
  const m = inhoud.mededeling || {};
  if (m.aan) {
    if (!String(m.tekst || '').trim()) voeg({ id: 'mededeling-leeg', categorie: 'inhoud', ernst: 'fout', titel: 'Mededeling staat aan maar is leeg', uitleg: 'Bovenaan je site staat nu een lege balk.', pad: 'mededeling.tekst', herstel: { auto: true, label: 'Mededeling uitzetten', omschrijving: 'Lege mededeling uitzetten', voer: (d) => zet(d, 'mededeling.aan', false) } });
    else {
      const tot = m.tot ? new Date(m.tot + 'T23:59:59') : datumUitTekst(m.tekst);
      if (tot && tot < vandaag()) voeg({ id: 'mededeling-verlopen', categorie: 'inhoud', ernst: 'waarschuwing', titel: 'Mededeling is verouderd', uitleg: `"${kap(m.tekst, 70)}" gaat over ${tot.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}, en die datum is voorbij.`, pad: 'mededeling.aan',
        herstel: { auto: true, label: 'Uitzetten', omschrijving: 'Verouderde mededeling uitzetten', voer: (d) => zet(d, 'mededeling.aan', false) } });
      else ok('inhoud', 'Mededeling is actueel');
    }
  }

  // Velden: verplicht, formaat, alt-teksten, verlopen data
  const altGezien = new Set();
  for (const { veld, pad, keten, velden } of alleVelden(inhoud, { ookVerborgen: true })) {
    const w = lees(inhoud, pad);
    if (['lijst', 'groep'].includes(veld.type)) {
      if (veld.type === 'lijst' && veld.verplicht && (!Array.isArray(w) || !w.length)) voeg({ id: `leeg:${pad}`, categorie: 'inhoud', ernst: 'waarschuwing', titel: `${labelVoor(pad, inhoud)} is leeg`, uitleg: 'Deze lijst hoort minstens één item te hebben.', pad });
      continue;
    }
    const f = valideer(veld, w);
    if (f) voeg({ id: `veld:${pad}`, categorie: 'inhoud', ernst: veld.verplicht && (w == null || w === '') ? 'fout' : 'waarschuwing', titel: `${labelVoor(pad, inhoud)}: ${f.replace(/\.$/, '').toLowerCase()}`, uitleg: f, pad });
    if (typeof w === 'string' && /lorem ipsum|\{\{|TODO|xxx/i.test(w)) voeg({ id: `plaatshouder:${pad}`, categorie: 'inhoud', ernst: 'fout', titel: `${labelVoor(pad, inhoud)} bevat voorbeeldtekst`, uitleg: `"${kap(w, 60)}" lijkt nog een plaatshouder.`, pad });
    if (veld.type === 'afbeelding' && w && /\.(png|jpe?g|webp|avif|gif)$/i.test(w)) {
      const alt = altVeldVan(veld, velden);
      if (alt) {
        const altPad = pad.slice(0, pad.length - veld.pad.length) + alt.pad;
        altGezien.add(w);
        if (!String(lees(inhoud, altPad) || '').trim()) {
          const voorstel = voorstelAlt(veld, keten, inhoud);
          voeg({ id: `alt:${altPad}`, categorie: 'toegankelijkheid', ernst: 'waarschuwing', titel: `Beschrijving ontbreekt bij ${labelVoor(pad, inhoud)}`, uitleg: 'Een korte beschrijving (alt-tekst) laat slechtziende bezoekers weten wat er op de foto staat, en helpt Google Afbeeldingen.', pad: altPad,
            herstel: { auto: true, label: 'Beschrijving voorstellen', omschrijving: `Alt-tekst voor ${naamVan(w)}: "${voorstel}"`, voer: (d) => zet(d, altPad, voorstel) } });
        }
      }
    }
    if (veld.type === 'datum' && w) {
      const d = new Date(w + 'T23:59:59');
      const ouder = keten.length ? lees(inhoud, keten[keten.length - 1].pad) : lees(inhoud, pad.split('.').slice(0, -1).join('.'));
      const schakel = velden.find((v) => v.type === 'schakelaar' && ouder?.[v.pad.split('.').pop()] === true && /tonen|aan|actief|zichtbaar/i.test(v.pad));
      if (d < vandaag() && schakel) {
        const sPad = pad.replace(/[^.]+$/, schakel.pad.split('.').pop());
        voeg({ id: `verlopen:${pad}`, categorie: 'inhoud', ernst: 'waarschuwing', titel: `${labelVoor(pad.split('.').slice(0, -1).join('.') || pad, inhoud).split(' › ')[0]} is voorbij maar staat nog op de site`, uitleg: `De datum (${d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}) is voorbij.`, pad,
          herstel: { auto: true, label: 'Niet meer tonen', omschrijving: `${labelVoor(sPad, inhoud)} uitzetten (datum voorbij)`, voer: (dr) => zet(dr, sPad, false) } });
      }
    }
  }

  // ===== Toegankelijkheid: thema-contrast =====
  const kleuren = inhoud.thema?.kleuren || {};
  for (const paar of themaParen(kleuren)) {
    const a = kleuren[paar.voor], b = kleuren[paar.achter];
    if (!geldigHex(a) || !geldigHex(b)) continue;
    const cc = contrast(a, b);
    const naam = `${themaLabel(paar.voor)} op ${themaLabel(paar.achter).toLowerCase()}`;
    if (cc < paar.min) voeg({ id: `contrast:${paar.voor}:${paar.achter}`, categorie: 'toegankelijkheid', ernst: cc < 3 ? 'fout' : 'waarschuwing', titel: `Te weinig contrast: ${naam} (${contrastTekst(cc)})`, uitleg: `Voor ${paar.soort === 'tekst' ? 'gewone tekst' : 'knoppen en accenten'} is minstens ${String(paar.min).replace('.', ',')}:1 nodig. Mensen met een minder goed zicht of in fel zonlicht kunnen dit moeilijk lezen.`, pad: `thema.kleuren.${paar.voor}` });
    else ok('toegankelijkheid', `Contrast ${naam}: ${contrastTekst(cc)}`);
  }

  // ===== HTML per pagina: alt, links, formulieren, koppen, lang =====
  const intern = new Map(); // url -> [{ pagina, href }]
  const middelen = { css: new Set(), js: new Set(), fonts: new Set(), extern: new Set(), blokkerend: new Set() };
  const beelden = new Map(); // src -> { paginas: Set, zonderMaat, zonderLazy }
  for (const p of pags) {
    const d = p.doc;
    const basis = location.origin + p.url;
    if (!d.documentElement.getAttribute('lang')) voeg({ id: `lang:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'fout', pagina: p.bestand, titel: `${p.naam}: taal van de pagina ontbreekt`, uitleg: 'Zonder lang-attribuut leest een schermlezer de tekst met de verkeerde uitspraak voor.', pad: 'site.taal' });
    // koppen in volgorde
    let vorige = 0, sprong = null;
    for (const k of d.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      const n = Number(k.tagName[1]);
      if (vorige && n > vorige + 1 && !sprong) sprong = `${k.tagName.toLowerCase()} na h${vorige} ("${kap(k.textContent, 40)}")`;
      vorige = n;
    }
    if (sprong) voeg({ id: `koppen:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'tip', pagina: p.bestand, titel: `${p.naam}: tussentitels slaan een niveau over`, uitleg: `Er staat een ${sprong}. Schermlezers gebruiken koppen als inhoudstafel; sla geen niveau over.` });
    // afbeeldingen
    const imgs = [...d.querySelectorAll('img')];
    const zonderAlt = imgs.filter((i) => !i.hasAttribute('alt'));
    if (zonderAlt.length) voeg({ id: `img-alt:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'fout', pagina: p.bestand, titel: `${p.naam}: ${zonderAlt.length} afbeelding(en) zonder alt-attribuut`, uitleg: 'Schermlezers lezen dan de bestandsnaam voor. Dit zit in het ontwerp van de pagina; laat ARTO het nakijken.' });
    imgs.forEach((img, idx) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      let u; try { u = new URL(src, basis); } catch { return; }
      const sleutel = u.origin === location.origin ? u.pathname : u.href;
      const b = beelden.get(sleutel) || { paginas: new Set(), zonderMaat: 0, zonderLazy: 0, src };
      b.paginas.add(p.naam);
      if (!(img.hasAttribute('width') && img.hasAttribute('height'))) b.zonderMaat++;
      if (img.getAttribute('loading') !== 'lazy' && idx > 1 && !img.closest('header')) b.zonderLazy++;
      beelden.set(sleutel, b);
    });
    // links
    const links = [...d.querySelectorAll('a')];
    const zonderTekst = links.filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title') && ![...a.querySelectorAll('img')].some((i) => i.getAttribute('alt')) && !a.querySelector('svg title'));
    if (zonderTekst.length) {
      const href = zonderTekst[0].getAttribute('href') || '';
      const pad = [...alleVelden(inhoud, { ookVerborgen: true })].find((v) => lees(inhoud, v.pad) === href)?.pad;
      voeg({ id: `link-tekst:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'waarschuwing', pagina: p.bestand, titel: `${p.naam}: ${zonderTekst.length} link(s) zonder tekst`, uitleg: `Een link zonder tekst (bv. naar ${href || 'een lege pagina'}) is onbruikbaar voor schermlezers. Vaak komt dit door een leeg veld.`, pad });
    }
    const leeg = links.filter((a) => { const x = (a.getAttribute('href') || '').trim(); return !a.hasAttribute('href') ? false : x === '' || x === '#'; });
    if (leeg.length) voeg({ id: `link-leeg:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'waarschuwing', pagina: p.bestand, titel: `${p.naam}: ${leeg.length} lege link(s)`, uitleg: `"${kap(leeg[0].textContent, 40)}" linkt nergens naartoe. Vul de link in of haal de knop weg.`, pad: [...alleVelden(inhoud, { ookVerborgen: true })].find((v) => v.veld.type === 'url' && !lees(inhoud, v.pad) && leeg[0].textContent.includes(String(lees(inhoud, v.pad.replace(/[^.]+$/, 'tekst')) || '\u0000')))?.pad });
    for (const a of links) {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
      if (/^(www\.)?[\w-]+\.[a-z]{2,}(\/|$)/i.test(href)) continue; // domein zonder https://: zie socials/velden
      let u; try { u = new URL(href, basis); } catch { continue; }
      if (u.origin !== location.origin) continue;
      const k = u.pathname;
      intern.set(k, [...(intern.get(k) || []), { pagina: p, href }]);
    }
    // formulieren
    const velden = [...d.querySelectorAll('input, select, textarea')].filter((x) => !['hidden', 'submit', 'button', 'reset', 'image'].includes(x.type) && x.getAttribute('aria-hidden') !== 'true' && x.getAttribute('tabindex') !== '-1');
    const zonderLabel = velden.filter((x) => !(x.id && d.querySelector(`label[for="${CSS.escape(x.id)}"]`)) && !x.closest('label') && !x.getAttribute('aria-label') && !x.getAttribute('aria-labelledby') && !x.getAttribute('title'));
    if (zonderLabel.length) voeg({ id: `form-label:${p.bestand}`, categorie: 'toegankelijkheid', ernst: 'fout', pagina: p.bestand, titel: `${p.naam}: ${zonderLabel.length} formulierveld(en) zonder label`, uitleg: `Het veld "${zonderLabel[0].name || zonderLabel[0].type}" heeft geen zichtbaar label. Een placeholder alleen is niet genoeg. Dit zit in het ontwerp; laat ARTO het nakijken.` });
    else if (velden.length) ok('toegankelijkheid', `${p.naam}: alle formuliervelden hebben een label`);
    // middelen
    for (const l of d.querySelectorAll('link[rel~=stylesheet][href]')) voegMiddel(l.getAttribute('href'), basis, middelen, 'css');
    for (const s of d.querySelectorAll('script[src]')) {
      voegMiddel(s.getAttribute('src'), basis, middelen, 'js');
      if (s.closest('head') && !s.defer && !s.async && s.type !== 'module') middelen.blokkerend.add(s.getAttribute('src'));
    }
    for (const l of d.querySelectorAll('link[rel=preload][as=font][href]')) voegMiddel(l.getAttribute('href'), basis, middelen, 'fonts');
  }
  if (pags.length && ![...items].some((i) => i.id.startsWith('lang:'))) ok('toegankelijkheid', 'Elke pagina heeft een taal ingesteld');

  // ===== Snelheid: afbeeldingen =====
  opVoortgang?.('Afbeeldingen controleren');
  const contentBeelden = new Set([...alleVelden(inhoud, { ookVerborgen: true })].filter((v) => v.veld.type === 'afbeelding').map((v) => lees(inhoud, v.pad)).filter(Boolean));
  let zonderMaat = 0, zonderLazy = 0, beeldBytes = 0;
  const groteLijst = [];
  await Promise.all([...beelden.entries()].map(async ([sleutel, b]) => {
    zonderMaat += b.zonderMaat; zonderLazy += b.zonderLazy;
    if (!sleutel.startsWith('/')) return;
    const n = await grootteVan(sleutel);
    if (n) beeldBytes += n;
    if (/\.svg$/i.test(sleutel)) return;
    const raster = /\.(png|jpe?g|gif|bmp)$/i.test(sleutel);
    const groot = n && n > GROOT;
    const inInhoud = contentBeelden.has(b.src) || contentBeelden.has(sleutel);
    if (!raster && !groot) return;
    groteLijst.push({ sleutel, n, raster, groot, inInhoud, b });
  }));
  groteLijst.sort((a, b) => (b.n || 0) - (a.n || 0));
  for (const g of groteLijst) {
    const naam = naamVan(g.sleutel);
    const padIn = g.inInhoud ? [...alleVelden(inhoud, { ookVerborgen: true })].find((v) => v.veld.type === 'afbeelding' && (lees(inhoud, v.pad) === g.b.src || lees(inhoud, v.pad) === g.sleutel))?.pad : null;
    const herstel = g.inInhoud && !/\.gif$/i.test(g.sleutel) ? { auto: true, label: 'Omzetten naar WebP', omschrijving: `${naam}${g.n ? ` (${kb(g.n)})` : ''} verkleinen en omzetten naar WebP`, beeld: true, voer: async (d) => {
      const r = await herComprimeer(g.b.src);
      if (!r.ongewijzigd) vervangUrl(d, g.b.src, r.url);
      return r;
    } } : null;
    if (g.groot) voeg({ id: `beeld-groot:${g.sleutel}`, categorie: 'snelheid', ernst: g.n > 1024 * 1024 ? 'fout' : 'waarschuwing', titel: `${naam} is zwaar (${kb(g.n)})`, uitleg: `Gebruikt op ${[...g.b.paginas].join(', ')}. Afbeeldingen boven 300 kB maken je site traag op een gsm. ${herstel ? 'Omzetten naar WebP maakt ze meestal 3 tot 10 keer kleiner, zonder zichtbaar verschil.' : 'Deze afbeelding hoort bij het ontwerp; laat ARTO ze verkleinen.'}`, pad: padIn, herstel });
    else if (g.raster) voeg({ id: `beeld-formaat:${g.sleutel}`, categorie: 'snelheid', ernst: 'tip', titel: `${naam} is geen WebP`, uitleg: `${g.sleutel.split('.').pop().toUpperCase()} is een ouder formaat. WebP is even scherp en een pak kleiner.`, pad: padIn, herstel });
  }
  if (!groteLijst.length && beelden.size) ok('snelheid', 'Alle afbeeldingen zijn licht en modern (WebP/AVIF/SVG)');
  if (zonderMaat) voeg({ id: 'beeld-maat', categorie: 'snelheid', ernst: 'tip', titel: `${zonderMaat} afbeelding(en) zonder breedte en hoogte`, uitleg: 'Zonder vaste afmetingen verspringt de pagina tijdens het laden (Google noemt dit "layout shift"). Dit zit in het ontwerp; laat ARTO het nakijken.' });
  else if (beelden.size) ok('snelheid', 'Afbeeldingen hebben vaste afmetingen');
  if (zonderLazy) voeg({ id: 'beeld-lazy', categorie: 'snelheid', ernst: 'tip', titel: `${zonderLazy} afbeelding(en) laden meteen, ook als ze nog niet in beeld zijn`, uitleg: 'Met loading="lazy" laden foto’s verder op de pagina pas als de bezoeker ernaartoe scrolt. Dit zit in het ontwerp.' });

  // ===== Snelheid: CSS, JS, lettertypes =====
  opVoortgang?.('Bestanden wegen');
  const weeg = async (set) => (await Promise.all([...set].map(async (u) => ({ u, ...(await bestandGrootte(u)) }))));
  const css = await weeg(middelen.css);
  for (const x of css) {
    for (const mm of x.tekst.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) voegMiddel(mm[1], location.origin + x.u, middelen, 'css-import');
    for (const blok of x.tekst.match(/@font-face\s*{[^}]*}/g) || []) {
      const mm = blok.match(/url\(\s*['"]?([^'")]+\.woff2?[^'")]*)['"]?\s*\)/) || blok.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
      if (mm) voegMiddel(mm[1], location.origin + x.u, middelen, 'fonts');
    }
  }
  const [js, fonts] = await Promise.all([weeg(middelen.js), weeg(middelen.fonts)]);
  const som = (l) => l.reduce((n, x) => n + (x.bytes || 0), 0);
  metingen.css = { aantal: css.length, bytes: som(css) };
  metingen.js = { aantal: js.length, bytes: som(js) };
  metingen.fonts = { aantal: fonts.length, bytes: som(fonts) };
  metingen.beelden = { aantal: beelden.size, bytes: beeldBytes };
  metingen.extern = [...middelen.extern];
  const html0 = pags[0]?.html ? new Blob([pags[0].html]).size : 0;
  metingen.html = html0;
  metingen.totaal = html0 + metingen.css.bytes + metingen.js.bytes + metingen.fonts.bytes + beeldBytes;
  for (const [l, soort] of [[css, 'CSS'], [js, 'JavaScript'], [fonts, 'lettertype']]) for (const x of l) if (!x.ok) voeg({ id: `ontbreekt:${x.u}`, categorie: 'snelheid', ernst: 'fout', titel: `${soort}-bestand ontbreekt: ${x.u}`, uitleg: 'De pagina vraagt een bestand op dat niet bestaat. Dat kost tijd en kan het ontwerp breken.' });
  if (metingen.css.bytes > 150 * 1024) voeg({ id: 'css-zwaar', categorie: 'snelheid', ernst: 'waarschuwing', titel: `Opmaak (CSS) is zwaar: ${kb(metingen.css.bytes)}`, uitleg: 'Meer dan 150 kB CSS vertraagt de eerste weergave.' });
  else if (css.length) ok('snelheid', `Opmaak is licht (${kb(metingen.css.bytes)} CSS)`);
  if (css.length > 4) voeg({ id: 'css-aantal', categorie: 'snelheid', ernst: 'tip', titel: `${css.length} aparte CSS-bestanden`, uitleg: 'Elk bestand is een extra verzoek. Samenvoegen maakt de site sneller.' });
  if (metingen.js.bytes > 200 * 1024) voeg({ id: 'js-zwaar', categorie: 'snelheid', ernst: 'waarschuwing', titel: `Scripts (JavaScript) zijn zwaar: ${kb(metingen.js.bytes)}`, uitleg: 'Meer dan 200 kB JavaScript is veel voor een bedrijfssite en vertraagt vooral oudere gsm’s.' });
  else ok('snelheid', `Weinig JavaScript (${kb(metingen.js.bytes)})`);
  if (middelen.blokkerend.size) voeg({ id: 'js-blokkerend', categorie: 'snelheid', ernst: 'tip', titel: `${middelen.blokkerend.size} script(s) houden het laden tegen`, uitleg: 'Scripts in <head> zonder defer of async laten de browser wachten. Voeg defer toe.' });
  if (fonts.length > 4 || metingen.fonts.bytes > 300 * 1024) voeg({ id: 'fonts', categorie: 'snelheid', ernst: 'waarschuwing', titel: `${fonts.length} lettertypebestanden (${kb(metingen.fonts.bytes)})`, uitleg: 'Elk gewicht of stijl is een apart bestand. Beperk tot 2 à 3, of gebruik een variabel lettertype.' });
  else if (fonts.length) ok('snelheid', `Lettertypes zijn beperkt (${fonts.length}, ${kb(metingen.fonts.bytes)})`);
  if (middelen.extern.size) voeg({ id: 'extern', categorie: 'snelheid', ernst: /fonts\.googleapis|fonts\.gstatic/.test([...middelen.extern].join(' ')) ? 'waarschuwing' : 'tip', titel: `${middelen.extern.size} bestand(en) van andere servers`, uitleg: `${[...middelen.extern].slice(0, 3).join(', ')}. Externe bestanden vertragen de site${/fonts\.g/.test([...middelen.extern].join(' ')) ? ', en Google Fonts via Google laden is in de EU een privacyrisico (GDPR). Host lettertypes zelf.' : '.'}` });
  if (metingen.totaal > 2.5 * 1024 * 1024) voeg({ id: 'gewicht', categorie: 'snelheid', ernst: 'waarschuwing', titel: `Startpagina weegt ${kb(metingen.totaal)}`, uitleg: 'Mik op minder dan 1,5 MB. Afbeeldingen zijn meestal de grootste boosdoener.' });

  // ===== Kapotte interne links =====
  opVoortgang?.('Links nakijken');
  const bekend = new Set(lijst.flatMap((p) => [p.url, p.url.replace(/\/$/, '') || '/', '/' + p.bestand, p.url + '/']));
  const kapot = [];
  await Promise.all([...intern.entries()].map(async ([pad, waar]) => {
    if (bekend.has(pad) || bekend.has(pad.replace(/\.html$/, '')) || pad.startsWith('/api/')) return;
    if (!(await bestaat(pad))) kapot.push({ pad, waar });
  }));
  for (const k of kapot) {
    const href = k.waar[0].href;
    const veldPad = [...alleVelden(inhoud, { ookVerborgen: true })].find((v) => { const w = lees(inhoud, v.pad); return typeof w === 'string' && w && (w === href || href.endsWith(w) || (v.veld.type === 'pagina' && href.includes(w))); })?.pad;
    voeg({ id: `kapot:${k.pad}`, categorie: 'vindbaarheid', ernst: 'fout', titel: `Kapotte link naar ${k.pad}`, uitleg: `Op ${[...new Set(k.waar.map((x) => x.pagina.naam))].join(', ')} staat een link die naar een pagina leidt die niet bestaat. Bezoekers krijgen een foutpagina en Google ziet dit als slordig.`, pad: veldPad });
  }
  if (!kapot.length && intern.size) ok('vindbaarheid', `Alle ${intern.size} interne links werken`);

  // ===== Scores =====
  const scores = {};
  for (const k of Object.keys(CATEGORIEEN)) {
    const lijstK = items.filter((i) => i.categorie === k);
    let s = 1;
    for (const i of lijstK) s *= 1 - STRAF[i.ernst];
    scores[k] = Math.max(0, Math.round(s * 100));
  }
  const totaal = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);
  const volgorde = { fout: 0, waarschuwing: 1, tip: 2 };
  items.sort((a, b) => volgorde[a.ernst] - volgorde[b.ernst]);
  return { items, goed, scores, totaal, metingen, tijd: new Date().toISOString(), paginas: pags.length };
}

function voegMiddel(href, basis, m, soort) {
  if (!href) return;
  let u; try { u = new URL(href, basis); } catch { return; }
  if (u.origin !== location.origin) { m.extern.add(u.host + u.pathname.slice(0, 30)); return; }
  const k = u.pathname + u.search;
  if (soort === 'css' || soort === 'css-import') m.css.add(k);
  else if (soort === 'js') m.js.add(k);
  else m.fonts.add(k);
}
const kb = (n) => (n == null ? '?' : n < 1024 * 1024 ? `${Math.round(n / 1024)} kB` : `${(n / 1048576).toFixed(1).replace('.', ',')} MB`);

// Alle automatisch herstelbare punten op een kopie van de inhoud toepassen.
export async function pasToe(inhoud, items, opStap) {
  const d = kloon(inhoud);
  const verslag = [];
  for (const [i, it] of items.entries()) {
    opStap?.(i, it);
    try {
      const r = await it.herstel.voer(d);
      verslag.push({ it, ok: true, r });
    } catch (e) {
      verslag.push({ it, ok: false, fout: e.message });
    }
  }
  return { inhoud: d, verslag };
}
