// Overzicht: begroeting, publicatiestatus, score, berichten, snelle acties, recente wijzigingen, waarschuwingen.
import { h, geleden, datumLang, scoreRing, bus } from './ui.js';
import { icoon } from './iconen.js';
import { api } from './api.js';
import { staat, wijzig, wijzigingen } from './staat.js';
import { laadBerichten, ongelezen } from './berichten.js';
import { laadVersies, leesBericht } from './geschiedenis.js';
import { startAnalyse, oordeelTekst, niveau } from './optimaliseren.js';
import { CATEGORIEEN } from './analyse.js';
import { lees } from './schema.js';
import { app } from './ctx.js';

export async function laadPublicaties() {
  const r = await api('publicaties');
  staat.publicaties = r.publicaties || [];
  return staat.publicaties;
}
export function publicatieStatus(p) {
  if (!p) return { soort: 'geen', label: 'Nog niet gepubliceerd' };
  if (p.status && p.status !== 'completed') return { soort: 'bezig', label: 'Bezig met publiceren' };
  if (p.conclusie === 'success') return { soort: 'goed', label: 'Gepubliceerd' };
  if (p.conclusie === 'cancelled' || p.conclusie === 'skipped') return { soort: 'stil', label: 'Geannuleerd' };
  return { soort: 'fout', label: 'Publicatie mislukt' };
}

const begroeting = () => { const u = new Date().getHours(); return u < 6 ? 'Goedenacht' : u < 12 ? 'Goedemorgen' : u < 18 ? 'Goedemiddag' : 'Goedenavond'; };

export async function toonOverzicht(root) {
  const s = staat.inhoud?.site || {};
  const live = location.origin + '/';
  const pubKaart = h('div', { class: 'kaart pub-kaart' }, h('div', { class: 'skelet-regel' }));
  const scoreKaart = h('a', { class: 'kaart score-mini', href: '#/optimaliseren' }, scoreRing(staat.analyse?.totaal ?? null, { grootte: 76, dik: 7 }), h('div', null, h('span', { class: 'kaart-label' }, 'Optimalisatie'), h('strong', null, staat.analyse ? oordeelTekst(staat.analyse.totaal) : 'Bezig met analyseren…')));
  const berKaart = h('a', { class: 'kaart ber-kaart', href: '#/berichten' }, h('span', { class: 'kaart-label' }, 'Berichten'), h('strong', { class: 'groot-getal' }, '–'), h('span', { class: 'stil' }, 'ongelezen'));
  const recent = h('ul', { class: 'recent-lijst' }, h('li', { class: 'skelet-regel' }), h('li', { class: 'skelet-regel' }));
  const waarsch = h('div', { class: 'waarschuwingen' });

  // Snelle acties
  const med = staat.inhoud?.mededeling || {};
  const medSchakel = h('button', { type: 'button', class: 'schakelaar', role: 'switch', 'aria-checked': String(!!med.aan), 'aria-label': 'Mededeling tonen', onclick: () => {
    const nu = medSchakel.getAttribute('aria-checked') !== 'true';
    medSchakel.setAttribute('aria-checked', String(nu));
    wijzig('mededeling.aan', nu, { samenvoegen: false });
    medStatus.textContent = nu ? 'Staat aan' : 'Staat uit';
  } }, h('span', { class: 'schakelaar-bol' }));
  const medStatus = h('span', { class: 'stil klein' }, med.aan ? 'Staat aan' : 'Staat uit');
  const medTekst = h('input', { class: 'invoer', value: med.tekst || '', placeholder: 'Bv. Gesloten van 1 tot 15 augustus', maxlength: 120, 'aria-label': 'Tekst van de mededeling', oninput: (e) => wijzig('mededeling.tekst', e.target.value) });
  const acties = h('div', { class: 'acties' },
    h('div', { class: 'kaart actie-mededeling' },
      h('div', { class: 'rij-tussen' }, h('div', { class: 'actie-kop' }, icoon('mededeling', 16), h('strong', null, 'Mededeling')), h('div', { class: 'rij' }, medStatus, medSchakel)),
      medTekst, h('p', { class: 'stil klein' }, 'Een balk bovenaan je site, bv. bij vakantie of een actie.')),
    h('a', { class: 'kaart actie', href: '#/inhoud/openingsuren' }, icoon('klok', 18), h('strong', null, 'Openingsuren aanpassen'), h('span', { class: 'stil klein' }, urenSamenvatting())),
    h('a', { class: 'kaart actie', href: '#/media?upload=1' }, icoon('upload', 18), h('strong', null, 'Foto toevoegen'), h('span', { class: 'stil klein' }, 'Wordt automatisch verkleind')),
    h('a', { class: 'kaart actie', href: '#/inhoud' }, icoon('bewerk', 18), h('strong', null, 'Teksten aanpassen'), h('span', { class: 'stil klein' }, 'Met live voorbeeld')));

  root.replaceChildren(h('div', { class: 'formulier breed overzicht' },
    h('div', { class: 'groet' },
      h('div', null,
        h('p', { class: 'kaart-label' }, begroeting()),
        h('h1', null, s.naam || 'Je site'),
        h('a', { class: 'live-link', href: live, target: '_blank', rel: 'noopener' }, icoon('globe', 14), (s.domein || location.host), icoon('extern', 12))),
      pubKaart),
    waarsch,
    h('div', { class: 'overzicht-raster' }, scoreKaart, berKaart,
      h('div', { class: 'kaart wijz-kaart' }, h('span', { class: 'kaart-label' }, 'Niet opgeslagen'), h('strong', { class: 'groot-getal' }, String(wijzigingen().length)), h('span', { class: 'stil' }, wijzigingen().length === 1 ? 'wijziging' : 'wijzigingen'))),
    h('h2', { class: 'groep-kop' }, 'Snel aanpassen'), acties,
    h('div', { class: 'twee-kol' },
      h('section', null, h('h2', { class: 'groep-kop' }, 'Recente wijzigingen', h('a', { class: 'knop-link klein', href: '#/geschiedenis' }, 'Alles bekijken')), recent),
      h('section', { class: 'score-detail' }, h('h2', { class: 'groep-kop' }, 'Je site in cijfers', h('a', { class: 'knop-link klein', href: '#/optimaliseren' }, 'Optimaliseren')), h('div', { class: 'cat-lijst' })))));

  tekenWaarschuwingen(waarsch);
  const tekenPub = () => {
    const p = staat.publicaties?.[0];
    const st = publicatieStatus(p);
    pubKaart.replaceChildren(h('span', { class: `status-punt ${st.soort}` }), h('div', null, h('strong', null, st.label), h('span', { class: 'stil klein' }, p ? geleden(p.bijgewerkt || p.datum) : staat.sessie?.configuratie?.opslaan ? '' : 'Opslaan nog niet ingesteld')),
      p?.url && staat.sessie?.rol === 'arto' ? h('a', { class: 'knop-icoon klein', href: p.url, target: '_blank', rel: 'noopener', 'aria-label': 'Bekijk op GitHub' }, icoon('extern', 14)) : null);
  };
  laadPublicaties().then(tekenPub, () => { staat.publicaties = []; tekenPub(); });
  laadBerichten().then(() => { berKaart.querySelector('.groot-getal').textContent = String(ongelezen()); berKaart.classList.toggle('aandacht', ongelezen() > 0); },
    (e) => { berKaart.querySelector('.groot-getal').textContent = '–'; berKaart.lastChild.textContent = e.nietIngesteld ? 'niet ingesteld' : 'niet beschikbaar'; });
  laadVersies().then((v) => {
    recent.replaceChildren(...(v.length ? v.slice(0, 5).map((x) => { const b = leesBericht(x.bericht); return h('li', null, h('span', { class: 'recent-punt' }), h('span', { class: 'recent-tekst' }, b.tekst), h('span', { class: 'stil klein', title: datumLang(x.datum) }, [b.wie, geleden(x.datum)].filter(Boolean).join(' · '))); }) : [h('li', { class: 'stil' }, 'Nog geen wijzigingen opgeslagen.')]));
  }, (e) => recent.replaceChildren(h('li', { class: 'stil' }, e.nietIngesteld ? 'Geschiedenis is beschikbaar zodra opslaan ingesteld is.' : e.message)));
  const tekenScore = (r) => {
    if (!root.isConnected) return;
    scoreKaart.replaceChildren(scoreRing(r.totaal, { grootte: 76, dik: 7 }), h('div', null, h('span', { class: 'kaart-label' }, 'Optimalisatie'), h('strong', null, oordeelTekst(r.totaal)), h('span', { class: 'stil klein' }, r.items.filter((i) => i.herstel?.auto).length ? `${r.items.filter((i) => i.herstel?.auto).length} punten automatisch op te lossen` : `${r.items.length} ${r.items.length === 1 ? 'punt' : 'punten'} om zelf na te kijken`)));
    root.querySelector('.cat-lijst')?.replaceChildren(...Object.entries(CATEGORIEEN).map(([k, c]) => h('a', { class: 'cat-rij', href: '#/optimaliseren' }, h('span', null, c.naam), h('div', { class: 'meter' }, h('span', { class: niveau(r.scores[k]), style: { width: r.scores[k] + '%' } })), h('strong', { class: niveau(r.scores[k]) }, String(r.scores[k])))));
  };
  if (staat.analyse && !staat.analyse.verouderd) tekenScore(staat.analyse);
  else startAnalyse({ opnieuw: !!staat.analyse }).then(tekenScore, () => {});
}

function urenSamenvatting() {
  const u = staat.inhoud?.openingsuren;
  if (!Array.isArray(u) || !u.length) return 'Nog niet ingevuld';
  const dag = new Date().toLocaleDateString('nl-BE', { weekday: 'long' });
  const vandaag = u.find((x) => String(x.dag).toLowerCase() === dag);
  return vandaag ? `Vandaag: ${vandaag.uren || '?'}` : `${u.length} dagen ingevuld`;
}

function tekenWaarschuwingen(el) {
  const w = [];
  const c = staat.sessie?.configuratie || {};
  const live = staat.sessie?.modus !== 'lokaal';
  if (live && !c.wachtwoord) w.push({ t: 'Er is geen wachtwoord ingesteld voor het beheer.', l: '#/instellingen', ic: 'slot' });
  if (!c.opslaan) w.push({ t: 'Opslaan is nog niet ingesteld: wijzigingen kunnen niet bewaard worden.', l: '#/instellingen', ic: 'slot' });
  if (!c.berichten) w.push({ t: 'Berichten van het contactformulier worden nog niet bewaard.', l: '#/instellingen', ic: 'berichten' });
  if (!lees(staat.inhoud, 'contact.btw')) w.push({ t: 'Je ondernemingsnummer (btw) staat niet op de site. Dat is wettelijk verplicht.', l: '#/veld/contact.btw', ic: 'waarschuwing' });
  if (!lees(staat.inhoud, 'seo.afbeelding')) w.push({ t: 'Er is geen deelafbeelding: bij delen via WhatsApp of Facebook verschijnt geen foto.', l: '#/veld/seo.afbeelding', ic: 'media' });
  el.replaceChildren(...w.map((x) => h('a', { class: 'waarschuwing-rij', href: x.l }, icoon(x.ic, 16), h('span', null, x.t), icoon('rechts', 14, 'stil'))));
}

bus.op('berichten-bijgewerkt', () => {
  const b = document.querySelector('.ber-kaart .groot-getal');
  if (b) b.textContent = String(ongelezen());
});
