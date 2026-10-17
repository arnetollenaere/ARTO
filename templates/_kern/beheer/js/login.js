// Loginscherm: rustig, met de naam van de site en één wachtwoordveld.
import { h, lsLees, lsZet } from './ui.js';
import { icoon, artoMerk } from './iconen.js';
import { api } from './api.js';

export async function siteNaam() {
  const bewaard = lsLees('arto-sitenaam');
  try {
    const html = await (await fetch('/', { credentials: 'same-origin' })).text();
    const d = new DOMParser().parseFromString(html, 'text/html');
    let naam = '';
    for (const s of d.querySelectorAll('script[type="application/ld+json"]')) { try { naam = JSON.parse(s.textContent).name || naam; } catch { /* */ } }
    naam ||= d.querySelector('meta[property="og:site_name"]')?.content || (d.title || '').split(/\s[|–-]\s/).pop();
    if (naam) { lsZet('arto-sitenaam', naam); return naam; }
  } catch { /* offline */ }
  return bewaard || location.hostname;
}

export function toonLogin(root, { naam, melding, opIngelogd, configuratie }) {
  const fout = h('p', { class: 'login-fout', role: 'alert', hidden: !melding }, melding || '');
  const ww = h('input', { id: 'wachtwoord', class: 'invoer groot', type: 'password', autocomplete: 'current-password', required: true, autofocus: true, 'aria-describedby': 'login-fout' });
  fout.id = 'login-fout';
  const oog = h('button', { type: 'button', class: 'knop-icoon oog-knop', 'aria-label': 'Wachtwoord tonen', onclick: () => {
    const zie = ww.type === 'password';
    ww.type = zie ? 'text' : 'password';
    oog.replaceChildren(icoon(zie ? 'oogUit' : 'oog', 17));
    oog.setAttribute('aria-label', zie ? 'Wachtwoord verbergen' : 'Wachtwoord tonen');
    ww.focus();
  } }, icoon('oog', 17));
  const knop = h('button', { class: 'knop knop-primair groot knop-blok', type: 'submit' }, h('span', null, 'Inloggen'), icoon('pijl', 16));
  const kaart = h('form', { class: 'login-kaart', onsubmit: async (e) => {
    e.preventDefault();
    if (!ww.value) { toonFout('Vul je wachtwoord in.'); return; }
    knop.disabled = true;
    knop.firstChild.textContent = 'Even geduld…';
    try {
      const r = await api('login', { methode: 'POST', body: { wachtwoord: ww.value } });
      kaart.classList.add('gelukt');
      setTimeout(() => opIngelogd(r), 180);
    } catch (err) {
      toonFout(err.status === 401 ? 'Dat wachtwoord klopt niet. Probeer het opnieuw.' : err.status === 503 ? 'Inloggen is nog niet ingesteld op deze site. Neem contact op met ARTO.' : err.message);
      knop.disabled = false;
      knop.firstChild.textContent = 'Inloggen';
      ww.select();
    }
  } },
    h('div', { class: 'login-merk' }, h('span', { class: 'login-monogram', 'aria-hidden': 'true' }, (naam || '?').trim().charAt(0).toUpperCase()), h('span', { class: 'kaart-label' }, 'Beheer')),
    h('h1', { class: 'login-naam' }, naam),
    h('p', { class: 'login-uitleg' }, 'Log in om je site aan te passen.'),
    h('label', { class: 'veld-label', for: 'wachtwoord' }, 'Wachtwoord'),
    h('div', { class: 'invoer-met-knop' }, ww, oog),
    fout, knop,
    configuratie && !configuratie.wachtwoord ? h('p', { class: 'login-hint' }, icoon('info', 14), 'Er is nog geen wachtwoord ingesteld. Lokaal werkt elk wachtwoord.') : null);
  const toonFout = (t) => { fout.textContent = t; fout.hidden = false; kaart.classList.remove('schud'); void kaart.offsetWidth; kaart.classList.add('schud'); ww.setAttribute('aria-invalid', 'true'); };
  root.replaceChildren(h('main', { class: 'login' },
    h('div', { class: 'login-gloed', 'aria-hidden': 'true' }),
    kaart,
    h('a', { class: 'login-voet', href: location.origin + '/' }, icoon('links', 13), 'Terug naar de site'),
    h('div', { class: 'login-arto' }, artoMerk(12), h('span', null, 'ARTO'))));
  requestAnimationFrame(() => ww.focus());
}
