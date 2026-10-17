#!/usr/bin/env node
// Lokale ontwikkelserver met werkend beheerpaneel.
// Gebruik: node arto/dev.mjs [sitemap] [--poort 8790]
// Open daarna http://localhost:8790 (site) en http://localhost:8790/beheer/ (beheer, elk wachtwoord werkt).
// Opslaan in het beheer schrijft rechtstreeks naar inhoud.json en src/img/uploads/ en bouwt de site opnieuw.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bouw } from './bouw.mjs';

const KERN = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const poortIdx = args.indexOf('--poort');
const POORT = Number(poortIdx >= 0 ? args[poortIdx + 1] : process.env.POORT || 8790);
const SITE = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--poort') || process.cwd());
const DIST = path.join(SITE, 'dist');
const DEV = path.join(SITE, '.arto-dev');
fs.mkdirSync(path.join(DEV, 'versies'), { recursive: true });

const worker = (await import(pathToFileURL(path.join(KERN, 'worker.js')).href + '?t=' + Date.now())).default;

function herbouw(reden) {
  try { bouw(SITE, { stil: true }); console.log(`[${new Date().toLocaleTimeString('nl-BE')}] gebouwd${reden ? ` (${reden})` : ''}`); }
  catch (e) { console.error('Bouwen mislukt:', e.message); }
}
herbouw();

// Herbouw bij wijzigingen.
let wacht;
for (const p of [path.join(SITE, 'src'), path.join(SITE, 'inhoud.json'), path.join(SITE, 'template.json'), KERN]) {
  if (!fs.existsSync(p)) continue;
  fs.watch(p, { recursive: true }, (_, f) => {
    if (String(f || '').includes('.arto-dev')) return;
    clearTimeout(wacht);
    wacht = setTimeout(() => herbouw(f), 120);
  });
}

// Lokale opslag met dezelfde vorm als de GitHub-opslag in worker.js.
const berichtenBestand = path.join(DEV, 'berichten.json');
const kvData = fs.existsSync(berichtenBestand) ? JSON.parse(fs.readFileSync(berichtenBestand, 'utf8')) : {};
const bewaarKv = () => fs.writeFileSync(berichtenBestand, JSON.stringify(kvData, null, 2));
const versiesBestand = path.join(DEV, 'versies.json');
const versies = fs.existsSync(versiesBestand) ? JSON.parse(fs.readFileSync(versiesBestand, 'utf8')) : [];
const sha = (t) => String(Buffer.from(t).reduce((a, b) => (a * 31 + b) >>> 0, 7).toString(16)).padStart(8, '0');

const opslag = {
  kv: {
    async put(k, v) { kvData[k] = v; bewaarKv(); },
    async get(k) { return kvData[k] ?? null; },
    async delete(k) { delete kvData[k]; bewaarKv(); },
    async list({ prefix }) { return { keys: Object.keys(kvData).filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  },
  async lees(p, ref) {
    if (ref && ref !== 'main') {
      const v = versies.find((x) => x.sha === ref);
      if (!v) throw Object.assign(new Error('Versie niet gevonden'), { status: 404 });
      return { tekst: fs.readFileSync(path.join(DEV, 'versies', v.sha + '.json'), 'utf8'), sha: v.sha };
    }
    const vol = path.join(SITE, p);
    if (!fs.existsSync(vol)) throw Object.assign(new Error('Niet gevonden'), { status: 404 });
    const tekst = fs.readFileSync(vol, 'utf8');
    return { tekst, sha: sha(tekst) };
  },
  async leesBytes(p) { return { bytes: fs.readFileSync(path.join(SITE, p)), type: TYPES[p.split('.').pop().toLowerCase()] }; },
  async schrijf(p, { tekst, base64 }, vorigeSha, bericht) {
    const vol = path.join(SITE, p);
    if (tekst != null && fs.existsSync(vol) && vorigeSha && sha(fs.readFileSync(vol, 'utf8')) !== vorigeSha) {
      throw Object.assign(new Error('Iemand anders heeft intussen iets opgeslagen. Herlaad en probeer opnieuw.'), { status: 409 });
    }
    fs.mkdirSync(path.dirname(vol), { recursive: true });
    if (base64 != null) fs.writeFileSync(vol, Buffer.from(base64, 'base64'));
    else fs.writeFileSync(vol, tekst);
    const nieuweSha = base64 != null ? sha(base64) : sha(tekst);
    if (p === 'inhoud.json') {
      fs.mkdirSync(path.join(DEV, 'versies'), { recursive: true });
      fs.writeFileSync(path.join(DEV, 'versies', nieuweSha + '.json'), tekst);
      versies.unshift({ sha: nieuweSha, bericht, datum: new Date().toISOString(), auteur: 'lokaal' });
      fs.writeFileSync(versiesBestand, JSON.stringify(versies.slice(0, 100), null, 2));
    }
    return { sha: nieuweSha, commit: nieuweSha };
  },
  async verwijder(p) { fs.rmSync(path.join(SITE, p), { force: true }); },
  async lijst(p) {
    const map = path.join(SITE, p);
    if (!fs.existsSync(map)) return [];
    return fs.readdirSync(map).filter((n) => n !== '.gitkeep').map((naam) => ({ naam, grootte: fs.statSync(path.join(map, naam)).size }));
  },
  async geschiedenis() { return versies; },
  async publicaties() {
    return versies.slice(0, 8).map((v, i) => ({ id: v.sha, titel: v.bericht, status: 'completed', conclusie: 'success', datum: v.datum, bijgewerkt: v.datum, url: null }));
  },
};
const env = { __opslag: opslag, BEHEER_WACHTWOORD: process.env.BEHEER_WACHTWOORD, ARTO_WACHTWOORD: process.env.ARTO_WACHTWOORD, SESSIE_GEHEIM: process.env.SESSIE_GEHEIM };

const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', ico: 'image/x-icon', woff2: 'font/woff2', woff: 'font/woff', xml: 'application/xml', txt: 'text/plain; charset=utf-8', pdf: 'application/pdf', webmanifest: 'application/manifest+json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await lees(req);
      const r = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body }), env);
      const kop = Object.fromEntries(r.headers);
      res.writeHead(r.status, kop);
      res.end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    // Statisch, met Cloudflare-gedrag: /menu -> menu.html, /map/ -> map/index.html
    let p = decodeURIComponent(url.pathname);
    const kandidaten = [p, p + '.html', path.posix.join(p, 'index.html')];
    let bestand = kandidaten.map((k) => path.join(DIST, k)).find((f) => f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile());
    let status = 200;
    if (!bestand) { bestand = path.join(DIST, '404.html'); status = 404; }
    const ext = bestand.split('.').pop();
    res.writeHead(status, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(bestand));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Fout: ' + e.message);
  }
}).listen(POORT, () => {
  console.log(`\nSite:    http://localhost:${POORT}/`);
  console.log(`Beheer:  http://localhost:${POORT}/beheer/   (lokaal werkt elk wachtwoord)\n`);
});

function lees(req) {
  return new Promise((ok, nok) => { const d = []; req.on('data', (c) => d.push(c)); req.on('end', () => ok(Buffer.concat(d))); req.on('error', nok); });
}
