// Eigen lijniconen: 24×24 raster, lijndikte 1.75, ronde uiteinden.
const P = {
  overzicht: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5z"/><path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5z"/><path d="M4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5z"/><path d="M13 14.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5z"/>',
  inhoud: '<path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3.5V9h5.5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
  gegevens: '<path d="M4 9.5 5.6 4.8A1.2 1.2 0 0 1 6.7 4h10.6a1.2 1.2 0 0 1 1.1.8L20 9.5"/><path d="M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0"/><path d="M5.5 12v7a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7"/><path d="M10 20v-4.5h4V20"/>',
  vindbaarheid: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="m7.75 12.25 2-2 1.5 1.5 2.5-2.5"/>',
  zoeken: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  media: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.75"/><path d="m20.5 15.5-4.3-4.3a1.2 1.2 0 0 0-1.7 0L6 19.5"/>',
  optimaliseren: '<path d="M12 20a8 8 0 1 1 8-8"/><path d="m12 12 4-4"/><circle cx="12" cy="12" r="1.2"/><path d="M16.5 19.5 18 21l3-3.5"/>',
  berichten: '<path d="M3.5 13.5 6 6.2A1.8 1.8 0 0 1 7.7 5h8.6A1.8 1.8 0 0 1 18 6.2l2.5 7.3"/><path d="M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-4.5h-5l-1.25 2.5h-4.5L8.5 13.5z"/>',
  geschiedenis: '<path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7"/><path d="M4 4.5v4.2h4.2"/><path d="M12 8v4.25l2.75 1.75"/>',
  thema: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9a4.2 4.2 0 0 0 4.2-4.2C20.5 6.9 16.7 3.5 12 3.5z"/><circle cx="7.5" cy="11.5" r="1.1"/><circle cx="10.5" cy="7.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/>',
  instellingen: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  uitloggen: '<path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  min: '<path d="M5 12h14"/>',
  kopie: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  prullenbak: '<path d="M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7"/><path d="M6.5 7 7.3 18.6A2 2 0 0 0 9.3 20.5h5.4a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10.25 11v5.5M13.75 11v5.5"/>',
  omhoog: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  omlaag: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  greep: '<circle cx="9" cy="6.5" r="1.1"/><circle cx="15" cy="6.5" r="1.1"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="12" r="1.1"/><circle cx="9" cy="17.5" r="1.1"/><circle cx="15" cy="17.5" r="1.1"/>',
  rechts: '<path d="m9.5 6 6 6-6 6"/>',
  links: '<path d="m14.5 6-6 6 6 6"/>',
  onder: '<path d="m6 9.5 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  sluit: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  waarschuwing: '<path d="M10.3 4.6 3.4 16.8A2 2 0 0 0 5.1 19.8h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.6v.1"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  fout: '<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>',
  goed: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.8-5"/>',
  tip: '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V17.5h5v-1.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3.5z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3A4 4 0 0 0 11 18.66l1-1"/>',
  extern: '<path d="M13.5 4.5h6v6M19.5 4.5 11 13"/><path d="M17.5 14v3.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2H10"/>',
  oog: '<path d="M2.8 12.3a1 1 0 0 1 0-.6C4.3 7.6 7.9 5 12 5s7.7 2.6 9.2 6.7a1 1 0 0 1 0 .6C19.7 16.4 16.1 19 12 19s-7.7-2.6-9.2-6.7z"/><circle cx="12" cy="12" r="3"/>',
  oogUit: '<path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c4.1 0 7.7 2.6 9.2 6.7a1 1 0 0 1 0 .6 10.6 10.6 0 0 1-1.9 3.1M14.1 14.2a3 3 0 0 1-4.3-4.3M17.5 17.5A9.7 9.7 0 0 1 12 19c-4.1 0-7.7-2.6-9.2-6.7a1 1 0 0 1 0-.6 10.7 10.7 0 0 1 3.7-5.2"/><path d="m3.5 3.5 17 17"/>',
  upload: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5"/><path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>',
  tablet: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  mobiel: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  zon: '<circle cx="12" cy="12" r="3.75"/><path d="M12 2.75v1.5M12 19.75v1.5M2.75 12h1.5M19.75 12h1.5M5.46 5.46l1.06 1.06M17.48 17.48l1.06 1.06M5.46 18.54l1.06-1.06M17.48 6.52l1.06-1.06"/>',
  maan: '<path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7z"/>',
  systeem: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
  ongedaan: '<path d="M9 14.5 4.5 10 9 5.5"/><path d="M4.5 10h10a5 5 0 0 1 0 10H11"/>',
  opnieuw: '<path d="M15 14.5 19.5 10 15 5.5"/><path d="M19.5 10h-10a5 5 0 0 0 0 10H13"/>',
  vet: '<path d="M7.5 5h5.25a3.5 3.5 0 0 1 0 7H7.5zM7.5 12h6.25a3.5 3.5 0 0 1 0 7H7.5z"/>',
  cursief: '<path d="M10.5 5h7M6.5 19h7M14.5 5l-5 14"/>',
  lijst: '<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><circle cx="5" cy="6.5" r=".9"/><circle cx="5" cy="12" r=".9"/><circle cx="5" cy="17.5" r=".9"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>',
  telefoon: '<path d="M8.6 4.5H6.5a2 2 0 0 0-2 2.1A14.7 14.7 0 0 0 17.4 19.5a2 2 0 0 0 2.1-2v-2.1a1.5 1.5 0 0 0-1.1-1.5l-2.6-.7a1.5 1.5 0 0 0-1.5.4l-.8.8a11.3 11.3 0 0 1-4-4l.8-.8a1.5 1.5 0 0 0 .4-1.5l-.7-2.6a1.5 1.5 0 0 0-1.4-1z"/>',
  kalender: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5"/>',
  euro: '<path d="M17.5 6.5a6.5 6.5 0 1 0 0 11"/><path d="M5 10.5h8M5 13.5h8"/>',
  toverstaf: '<path d="m4.5 19.5 10-10M13 8l1.5-1.5 3 3L16 11z"/><path d="M18 3.5v2.5M16.75 4.75h2.5M20.5 9.5v2M19.5 10.5h2M10 3.5v2M9 4.5h2"/>',
  vonk: '<path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5z"/><path d="M18.5 15.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5z"/>',
  pijl: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  vernieuwen: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4.5V9H15"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  meer: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  slot: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  klok: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pagina: '<path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3.5V9h5.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z"/>',
  mededeling: '<path d="M4.5 10v4a1 1 0 0 0 1 1H8l6.5 4V5L8 9H5.5a1 1 0 0 0-1 1z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
  sleutel: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 8.5-8.5M16.5 7l2.5 2.5M14.5 9l2 2"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  code: '<path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5M13.5 5l-3 14"/>',
  toetsenbord: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14.5h9"/>',
  splits: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M12 4.5v15"/>',
  wolk: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97 6 6 0 0 1 11.6 1.47A3.75 3.75 0 0 1 17.25 18.5z"/>',
  pdf: '<path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M14 3.5V9h5.5"/><path d="M8.5 16.5v-4h1.25a1.25 1.25 0 0 1 0 2.5H8.5"/>',
  hulp: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.85c0 1.65-2.45 2.25-2.45 3.5M12 16.6v.1"/>',
  bewerk: '<path d="M14.5 5.5l4 4M4.5 19.5l1-4.5L15.7 4.8a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5z"/>',
  terug: '<path d="M10 7 5 12l5 5M5 12h14"/>',
  vergroot: '<path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6"/>',
};

const NS = 'http://www.w3.org/2000/svg';
export function icoon(naam, grootte = 16, extra = '') {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', grootte);
  s.setAttribute('height', grootte);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.75');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', 'ic' + (extra ? ' ' + extra : ''));
  s.innerHTML = P[naam] || P.info;
  return s;
}

// Het ARTO-merkteken: discreet, voor de voet van de zijbalk en het loginscherm.
export function artoMerk(grootte = 14) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', grootte);
  s.setAttribute('height', grootte);
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M12 3 21 20H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.2 14.5h7.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return s;
}
