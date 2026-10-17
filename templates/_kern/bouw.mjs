#!/usr/bin/env node
// ARTO-bouw: zet src/ + inhoud.json om naar dist/, klaar voor Cloudflare Pages.
// Gebruik: node arto/bouw.mjs [sitemap]   (standaard: de map waarin build.sh staat)
//
// Wat het doet:
//  1. kopieert src/ naar dist/ (behalve src/_delen/)
//  2. rendert elke .html, .xml, .txt en _headers met de ARTO-engine en inhoud.json
//  3. voegt per pagina SEO toe via {{{ arto.kop }}}: title, description, canonical, Open Graph, JSON-LD, themakleuren
//  4. zet het beheerpaneel in dist/beheer/ en de beheer-API in dist/_worker.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplate, escape } from './engine.mjs';

const KERN = path.dirname(fileURLToPath(import.meta.url));
const RENDER = /\.(html|xml|txt|webmanifest)$|^_headers$|^_redirects$/;

export function bouw(siteMap, { stil = false, uit } = {}) {
  const log = (...a) => !stil && console.log(...a);
  const src = path.join(siteMap, 'src');
  const dist = uit || path.join(siteMap, 'dist');
  const inhoud = leesJson(path.join(siteMap, 'inhoud.json'));
  const template = leesJson(path.join(siteMap, 'template.json'));

  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  // Delen (partials) en alle te renderen bronbestanden verzamelen.
  const delen = {};
  const delenMap = path.join(src, '_delen');
  if (fs.existsSync(delenMap)) {
    for (const f of fs.readdirSync(delenMap)) if (f.endsWith('.html')) delen[f.replace(/\.html$/, '')] = fs.readFileSync(path.join(delenMap, f), 'utf8');
  }
  const bestanden = wandel(src).filter((f) => !f.startsWith('_delen/') && !f.endsWith('.gitkeep'));
  const paginas = bestanden.filter((f) => f.endsWith('.html') && f !== '404.html');
  const domein = (inhoud.site?.domein || 'example.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const basisUrl = `https://${domein}`;
  const urlVan = (f) => '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '');
  const arto = {
    paginas: paginas.map((f) => ({ bestand: f, url: urlVan(f), volledig: basisUrl + urlVan(f) })),
    basisUrl,
    bouwdatum: new Date().toISOString().slice(0, 10),
  };

  const waarschuwingen = [];
  const bronnen = {};
  for (const f of bestanden) {
    const van = path.join(src, f);
    const naar = path.join(dist, f);
    fs.mkdirSync(path.dirname(naar), { recursive: true });
    const naam = path.basename(f);
    if (!RENDER.test(naam)) { fs.copyFileSync(van, naar); continue; }
    const bron = fs.readFileSync(van, 'utf8');
    if (f.endsWith('.html')) bronnen[f] = bron;
    const data = maakData(inhoud, template, arto, f);
    let html;
    try {
      html = renderTemplate(bron, data, { delen });
    } catch (e) {
      throw new Error(`${f}: ${e.message}`);
    }
    if (f.endsWith('.html')) waarschuwingen.push(...controleer(f, html));
    fs.writeFileSync(naar, html);
  }

  // robots.txt en _headers: het beheerpaneel nooit indexeren of cachen.
  const robots = path.join(dist, 'robots.txt');
  if (fs.existsSync(robots)) {
    const r = fs.readFileSync(robots, 'utf8');
    if (!r.includes('/beheer')) fs.writeFileSync(robots, r.replace(/^(User-agent:\s*\*\s*\n)/im, '$1Disallow: /beheer/\nDisallow: /api/\n'));
  }
  fs.appendFileSync(path.join(dist, '_headers'), `\n/beheer/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n  X-Frame-Options: SAMEORIGIN\n`);

  // Beheerpaneel + bron voor de live preview.
  const beheerBron = path.join(KERN, 'beheer');
  if (fs.existsSync(beheerBron)) {
    kopieerMap(beheerBron, path.join(dist, 'beheer'));
    fs.copyFileSync(path.join(KERN, 'engine.mjs'), path.join(dist, 'beheer', 'engine.mjs'));
    fs.copyFileSync(path.join(KERN, 'basis-schema.json'), path.join(dist, 'beheer', 'basis-schema.json'));
    fs.writeFileSync(path.join(dist, 'beheer', 'bron.json'), JSON.stringify({ template, bestanden: bronnen, delen, arto }, null, 0));
  }
  // Beheer-API (Cloudflare Pages advanced mode).
  const worker = path.join(KERN, 'worker.js');
  if (fs.existsSync(worker)) fs.copyFileSync(worker, path.join(dist, '_worker.js'));

  log(`Gebouwd in ${path.relative(process.cwd(), dist) || dist}/: ${paginas.length + 1} pagina's, ${wandel(dist).length} bestanden`);
  for (const w of waarschuwingen) log('  let op:', w);
  return { dist, waarschuwingen };
}

function maakData(inhoud, template, arto, bestand) {
  const url = '/' + bestand.replace(/index\.html$/, '').replace(/\.html$/, '');
  const paginaSeo = (inhoud.seo?.paginas || []).find((p) => p.pagina === bestand || p.pagina === url) || {};
  const pagina = {
    bestand,
    url,
    naam: bestand.replace(/\.html$/, ''),
    titel: paginaSeo.titel || '',
    beschrijving: paginaSeo.beschrijving || '',
    is: { [bestand.replace(/\.html$/, '').replace(/[^a-z0-9]/gi, '_')]: true },
  };
  const kop = maakKop(inhoud, template, arto, pagina, bestand);
  return { ...inhoud, jaar: new Date().getFullYear(), pagina, arto: { ...arto, kop, voet: '' } };
}

function maakKop(inhoud, template, arto, pagina, bestand) {
  const s = inhoud.site || {};
  const seo = inhoud.seo || {};
  const c = inhoud.contact || {};
  const naam = s.naam || '';
  const titel = bestand === '404.html'
    ? `Pagina niet gevonden | ${naam}`
    : pagina.titel ? `${pagina.titel} | ${naam}` : (seo.titel || naam);
  const besch = pagina.beschrijving || seo.beschrijving || s.slogan || '';
  const canon = arto.basisUrl + pagina.url;
  const beeld = seo.afbeelding ? absoluut(seo.afbeelding, arto.basisUrl) : '';
  const r = [];
  r.push(`<title>${escape(titel)}</title>`);
  r.push(`<meta name="description" content="${escape(besch)}">`);
  if (bestand === '404.html') r.push('<meta name="robots" content="noindex">');
  else r.push(`<link rel="canonical" href="${escape(canon)}">`);
  r.push('<meta property="og:type" content="website">');
  r.push(`<meta property="og:title" content="${escape(titel)}">`);
  r.push(`<meta property="og:description" content="${escape(besch)}">`);
  r.push(`<meta property="og:url" content="${escape(canon)}">`);
  r.push(`<meta property="og:locale" content="${escape((s.taal || 'nl-BE').replace('-', '_'))}">`);
  if (beeld) r.push(`<meta property="og:image" content="${escape(beeld)}">`, '<meta name="twitter:card" content="summary_large_image">');
  if (s.favicon) r.push(`<link rel="icon" href="${escape(s.favicon)}">`);
  const thema = inhoud.thema || {};
  if (thema.kleuren) r.push(`<meta name="theme-color" content="${escape(thema.kleuren.achtergrond || thema.kleuren.accent || '')}">`);
  const vars = Object.entries(thema.kleuren || {}).map(([k, v]) => `--thema-${k}:${v}`).join(';');
  if (vars) r.push(`<style id="arto-thema">:root{${vars.replace(/</g, '')}}</style>`);
  r.push('<meta name="generator" content="ARTO">');
  if (bestand === 'index.html') r.push(`<script type="application/ld+json">${JSON.stringify(jsonLd(inhoud, template, arto)).replace(/</g, '\\u003c')}</script>`);
  return r.join('\n  ');
}

function jsonLd(inhoud, template, arto) {
  const s = inhoud.site || {};
  const c = inhoud.contact || {};
  const ld = {
    '@context': 'https://schema.org',
    '@type': template.schemaType || 'LocalBusiness',
    name: s.naam,
    description: inhoud.seo?.beschrijving || s.slogan,
    url: arto.basisUrl + '/',
  };
  if (c.telefoon) ld.telephone = c.telefoon;
  if (c.email) ld.email = c.email;
  if (c.adres || c.gemeente) ld.address = { '@type': 'PostalAddress', streetAddress: c.adres, postalCode: c.postcode, addressLocality: c.gemeente, addressCountry: c.land || 'BE' };
  if (inhoud.seo?.afbeelding) ld.image = absoluut(inhoud.seo.afbeelding, arto.basisUrl);
  if (c.btw) ld.vatID = c.btw;
  const uren = (inhoud.openingsuren || []).filter((u) => u.uren && !/gesloten/i.test(u.uren));
  const DAG = { maandag: 'Mo', dinsdag: 'Tu', woensdag: 'We', donderdag: 'Th', vrijdag: 'Fr', zaterdag: 'Sa', zondag: 'Su' };
  const ldUren = uren.filter((u) => DAG[(u.dag || '').toLowerCase()]).map((u) => `${DAG[u.dag.toLowerCase()]} ${u.uren.replace(/\s*[–—-]\s*/g, '-').replace(/\s*[,&]\s*/g, ',')}`);
  if (ldUren.length) ld.openingHours = ldUren;
  const socials = (inhoud.socials || []).map((x) => x.url).filter(Boolean);
  if (socials.length) ld.sameAs = socials;
  return ld;
}

// Eenvoudige controles na het renderen; het beheerpaneel doet de uitgebreide analyse.
function controleer(f, html) {
  const w = [];
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  if (f !== '404.html' && h1 !== 1) w.push(`${f}: ${h1} keer <h1> (verwacht: 1)`);
  for (const img of html.match(/<img\b[^>]*>/gi) || []) {
    if (!/\balt=/.test(img)) w.push(`${f}: afbeelding zonder alt: ${img.slice(0, 80)}`);
  }
  if (!/<html[^>]+lang=/i.test(html)) w.push(`${f}: <html> mist lang`);
  if (!/<title>/i.test(html)) w.push(`${f}: geen <title> (zet {{{ arto.kop }}} in <head>)`);
  if (/\{\{[^A-Z]/.test(html)) w.push(`${f}: onverwerkte {{ }} gevonden`);
  return w;
}

const absoluut = (u, basis) => (/^https?:/.test(u) ? u : basis + (u.startsWith('/') ? '' : '/') + u);
function leesJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { throw new Error(`Kan ${p} niet lezen: ${e.message}`); }
}
function wandel(map, basis = map) {
  if (!fs.existsSync(map)) return [];
  return fs.readdirSync(map, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(map, d.name);
    return d.isDirectory() ? wandel(p, basis) : [path.relative(basis, p).split(path.sep).join('/')];
  });
}
function kopieerMap(van, naar) {
  for (const f of wandel(van)) {
    fs.mkdirSync(path.dirname(path.join(naar, f)), { recursive: true });
    fs.copyFileSync(path.join(van, f), path.join(naar, f));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const doel = path.resolve(process.argv[2] || process.cwd());
  try { bouw(doel); } catch (e) { console.error('Bouwen mislukt:', e.message); process.exit(1); }
}
