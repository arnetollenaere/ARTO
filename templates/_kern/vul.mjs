#!/usr/bin/env node
// Vult klantgegevens in inhoud.json in. Wordt aangeroepen door setup/scripts/nieuwe-site.sh.
// Gebruik: node arto/vul.mjs <sitemap> NAAM="Bakkerij Peeters" DOMEIN=bakkerijpeeters.be TELEFOON=... EMAIL=... ADRES=... BESCHRIJVING=...
import fs from 'node:fs';
import path from 'node:path';

const [map, ...paren] = process.argv.slice(2);
const bestand = path.join(map, 'inhoud.json');
const inhoud = JSON.parse(fs.readFileSync(bestand, 'utf8'));

const zet = (pad, waarde) => {
  const d = pad.split('.');
  let o = inhoud;
  for (const k of d.slice(0, -1)) o = o[k] ??= {};
  o[d.at(-1)] = waarde;
};

const KOPPELING = {
  NAAM: (v) => { zet('site.naam', v); zet('seo.titel', v); },
  DOMEIN: (v) => zet('site.domein', v.replace(/^https?:\/\//, '').replace(/\/$/, '')),
  BESCHRIJVING: (v) => zet('seo.beschrijving', v),
  TELEFOON: (v) => zet('contact.telefoon', v),
  EMAIL: (v) => zet('contact.email', v),
  ADRES: (v) => {
    // "Kerkstraat 1, 9000 Gent" -> adres, postcode, gemeente
    const m = v.match(/^(.*?),\s*(\d{4,5})\s+(.+)$/);
    if (m) { zet('contact.adres', m[1]); zet('contact.postcode', m[2]); zet('contact.gemeente', m[3]); }
    else zet('contact.adres', v);
  },
};

for (const paar of paren) {
  const i = paar.indexOf('=');
  if (i < 0) continue;
  const veld = paar.slice(0, i);
  if (KOPPELING[veld]) KOPPELING[veld](paar.slice(i + 1));
}
fs.writeFileSync(bestand, JSON.stringify(inhoud, null, 2) + '\n');
console.log('inhoud.json ingevuld');
