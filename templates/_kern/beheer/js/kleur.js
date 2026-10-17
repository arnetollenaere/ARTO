// Kleurhulpjes: hex lezen, WCAG-contrast.
export function hexNaarRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export const geldigHex = (hex) => !!hexNaarRgb(hex);
export function normaliseerHex(hex) {
  const rgb = hexNaarRgb(hex);
  return rgb ? '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('') : hex;
}
function luminantie([r, g, b]) {
  const k = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}
export function contrast(a, b) {
  const x = hexNaarRgb(a), y = hexNaarRgb(b);
  if (!x || !y) return null;
  const [l1, l2] = [luminantie(x), luminantie(y)].sort((p, q) => q - p);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}
// Oordeel voor gewone tekst (4,5) en grote tekst / knoppen (3).
export function oordeel(c) {
  if (c == null) return { niveau: 'onbekend', label: '–' };
  if (c >= 7) return { niveau: 'goed', label: 'AAA' };
  if (c >= 4.5) return { niveau: 'goed', label: 'AA' };
  if (c >= 3) return { niveau: 'let-op', label: 'Alleen grote tekst' };
  return { niveau: 'slecht', label: 'Te weinig' };
}
export const contrastTekst = (c) => (c == null ? '–' : `${String(c.toFixed(1)).replace('.', ',')}:1`);
export const isDonker = (hex) => { const r = hexNaarRgb(hex); return r ? luminantie(r) < 0.4 : false; };

// Welke themakleuren zijn achtergronden en welke tekst? Op basis van de sleutelnaam.
export function themaParen(kleuren) {
  const ks = Object.keys(kleuren || {}).filter((k) => hexNaarRgb(kleuren[k]));
  const achter = ks.filter((k) => /achtergrond|bg|vlak|basis|papier|licht/i.test(k));
  const tekst = ks.filter((k) => /tekst|text|inkt|donker|voorgrond/i.test(k));
  const accent = ks.filter((k) => /accent|primair|merk|hoofd|knop|signaal/i.test(k));
  const paren = [];
  // Hoofdachtergrond: hier staan de gewone tekst en de accenten op.
  const hoofd = achter.find((k) => /^(achtergrond|bg|basis)$/i.test(k)) || achter[0];
  if (!hoofd) return paren;
  for (const t of tekst) paren.push({ voor: t, achter: hoofd, min: 4.5, soort: 'tekst' });
  for (const t of accent) paren.push({ voor: t, achter: hoofd, min: 3, soort: 'accent' });
  // Andere vlakken (papier, licht vlak …): we weten niet welke kleur erop staat, dus
  // nemen we de best leesbare andere themakleur. Alleen als zelfs die faalt, is er een probleem.
  for (const a of achter) {
    if (a === hoofd) continue;
    const kandidaten = ks.filter((k) => k !== a && (tekst.includes(k) || achter.includes(k)));
    const beste = kandidaten.sort((x, y) => contrast(kleuren[y], kleuren[a]) - contrast(kleuren[x], kleuren[a]))[0];
    if (beste) paren.push({ voor: beste, achter: a, min: 4.5, soort: 'tekst' });
  }
  return paren;
}
