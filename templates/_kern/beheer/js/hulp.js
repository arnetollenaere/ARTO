// Uitleg bij functies die (nog) niet ingesteld zijn (API antwoordt 503).
import { h, meld } from './ui.js';
import { icoon } from './iconen.js';

export const UITLEG = {
  wachtwoord: {
    titel: 'Wachtwoord is niet ingesteld',
    kort: 'Zonder wachtwoord kan niemand inloggen op de online site.',
    stappen: ['Open Cloudflare → Workers & Pages → dit project → Settings → Variables and Secrets.', 'Voeg BEHEER_WACHTWOORD toe (voor de klant) en ARTO_WACHTWOORD (voor ARTO).', 'Voeg SESSIE_GEHEIM toe: een lange willekeurige tekst.', 'Publiceer opnieuw zodat de instellingen actief worden.'],
  },
  opslaan: {
    titel: 'Opslaan is nog niet ingesteld',
    kort: 'Je kan alles bekijken en uitproberen, maar wijzigingen en foto’s kunnen nog niet bewaard worden.',
    stappen: ['Maak op GitHub een fine-grained token met alleen "Contents" en "Actions" (lezen en schrijven) op de repo van deze site.', 'Zet in Cloudflare de variabelen GITHUB_TOKEN en GITHUB_REPO (bv. arto-sites/bakkerij-peeters).', 'Optioneel: GITHUB_BRANCH (standaard main) en GITHUB_MAP.'],
  },
  berichten: {
    titel: 'Berichten zijn nog niet ingesteld',
    kort: 'Het contactformulier werkt, maar inzendingen worden nog nergens bewaard.',
    stappen: ['Maak in Cloudflare een KV-namespace, bv. "berichten".', 'Koppel die aan dit project onder Settings → Bindings met de naam BERICHTEN.', 'Publiceer opnieuw. Nieuwe berichten verschijnen dan hier.'],
  },
};

export function nietIngesteld(soort, { blok = false } = {}) {
  const u = UITLEG[soort] || { titel: 'Niet ingesteld', kort: '', stappen: [] };
  if (!blok) {
    meld(`${u.titel}. ${u.kort}`, { soort: 'waarschuwing', actie: { label: 'Uitleg', fn: () => { location.hash = '#/instellingen'; } } });
    return null;
  }
  return h('div', { class: 'uitleg-blok' },
    h('div', { class: 'uitleg-icoon' }, icoon('slot', 20)),
    h('div', null,
      h('h3', null, u.titel),
      h('p', null, u.kort),
      u.stappen.length ? h('ol', { class: 'stappen' }, u.stappen.map((s) => h('li', null, s))) : null,
      h('p', { class: 'stil klein' }, 'Dit doet ARTO normaal voor je. Laat het ons weten als het nog niet in orde is.')));
}
