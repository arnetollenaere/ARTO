// Het schema: basis-schema.json + template.json samen, en hulpjes om paden en velden te vinden.
import { staat } from './staat.js';

export const GROEPEN = { inhoud: "Pagina's en teksten", gegevens: 'Gegevens', seo: 'Vindbaarheid' };

export function bouwSchema(basis, template) {
  const perId = new Map();
  for (const s of basis.secties || []) perId.set(s.id, { ...s, bron: 'basis' });
  for (const s of template.secties || []) perId.set(s.id, { ...s, bron: 'template' });
  const secties = [...perId.values()].map((s) => ({ ...s, groep: s.groep || 'inhoud' }));
  return secties;
}

export const zichtbaar = (veld) => veld.rol !== 'arto' || staat.sessie?.rol === 'arto';
export const sectiesVan = (groep) => staat.schema.filter((s) => s.groep === groep && s.velden.some(zichtbaar));
export const editorGroepen = () => {
  const g = [...new Set(staat.schema.map((s) => s.groep))].filter((x) => x !== 'seo');
  return g.sort((a, b) => (a === 'inhoud' ? -1 : b === 'inhoud' ? 1 : a === 'gegevens' ? -1 : 0));
};
export const groepNaam = (g) => GROEPEN[g] || g.charAt(0).toUpperCase() + g.slice(1);

// ---------- paden ----------
export const delen = (pad) => String(pad).split('.').filter((x) => x !== '');
export function lees(obj, pad) {
  let w = obj;
  for (const d of delen(pad)) { if (w == null) return undefined; w = w[d]; }
  return w;
}
export function zet(obj, pad, waarde) {
  const d = delen(pad);
  let o = obj;
  for (let i = 0; i < d.length - 1; i++) {
    if (o[d[i]] == null || typeof o[d[i]] !== 'object') o[d[i]] = /^\d+$/.test(d[i + 1]) ? [] : {};
    o = o[d[i]];
  }
  o[d[d.length - 1]] = waarde;
}
export const ouderPad = (pad) => delen(pad).slice(0, -1).join('.');

// ---------- velden zoeken ----------
// vindVeld('kaart.categorieen.1.gerechten.0.prijs') -> { sectie, veld, vol, items: ['kaart.categorieen.1', 'kaart.categorieen.1.gerechten.0'] }
export function vindVeld(pad) {
  const doel = delen(pad);
  if (doel[0] === 'thema' && doel[1] === 'kleuren' && doel[2]) {
    return { sectie: { id: '__thema', titel: 'Thema' }, veld: { pad, type: 'kleur', label: themaLabel(doel[2]) }, vol: pad, items: [], thema: true };
  }
  for (const sectie of staat.schema) {
    const r = zoekIn(sectie.velden, [], doel);
    if (r) return { sectie, ...r };
  }
  return null;
}
function zoekIn(velden, basis, rest) {
  for (const veld of velden) {
    const segs = delen(veld.pad);
    if (segs.length > rest.length || !segs.every((s, i) => s === rest[i])) continue;
    const vol = [...basis, ...segs];
    const na = rest.slice(segs.length);
    if (!na.length) return { veld, vol: vol.join('.'), items: [] };
    if (veld.type === 'groep' && veld.velden) {
      const r = zoekIn(veld.velden, vol, na);
      if (r) return r;
    }
    if (veld.type === 'lijst' && /^\d+$/.test(na[0])) {
      const itemVol = [...vol, na[0]].join('.');
      if (na.length === 1) return { veld, vol: itemVol, items: [itemVol], item: true };
      const r = zoekIn(veld.velden || [], [...vol, na[0]], na.slice(1));
      if (r) { r.items.unshift(itemVol); return r; }
      return { veld, vol: itemVol, items: [itemVol], item: true };
    }
    return { veld, vol: vol.join('.'), items: [], benadering: true };
  }
  return null;
}
export const themaLabel = (sleutel) => (staat.bron?.template?.thema?.kleuren || []).find((k) => k.sleutel === sleutel)?.label || sleutel;

// Alle velden met hun volledige pad in de huidige inhoud (lijsten uitgeklapt).
export function* alleVelden(inhoud = staat.inhoud, { ookVerborgen = false } = {}) {
  for (const sectie of staat.schema) yield* loop(sectie.velden, '', sectie, [], inhoud, ookVerborgen);
}
function* loop(velden, basis, sectie, keten, inhoud, ookVerborgen) {
  for (const veld of velden) {
    if (!ookVerborgen && !zichtbaar(veld)) continue;
    const pad = basis ? `${basis}.${veld.pad}` : veld.pad;
    yield { veld, pad, sectie, keten, velden };
    if (veld.type === 'groep' && veld.velden) yield* loop(veld.velden, pad, sectie, [...keten, { veld, pad }], inhoud, ookVerborgen);
    if (veld.type === 'lijst' && veld.velden) {
      const lijst = lees(inhoud, pad);
      if (Array.isArray(lijst)) for (let i = 0; i < lijst.length; i++) {
        yield* loop(veld.velden, `${pad}.${i}`, sectie, [...keten, { veld, pad: `${pad}.${i}`, index: i, item: lijst[i] }], inhoud, ookVerborgen);
      }
    }
  }
}

// ---------- labels ----------
export function paginaNaam(bestand) {
  if (!bestand) return '';
  const b = String(bestand).replace(/^\//, '');
  if (b === '' || b === 'index.html' || b === 'index') return 'Start';
  const n = b.replace(/\.html$/, '').replace(/\/index$/, '').split('/').pop().replace(/[-_]+/g, ' ');
  return n.charAt(0).toUpperCase() + n.slice(1);
}
export function itemTitel(veld, item, index) {
  if (item == null || typeof item !== 'object') return `${enkelvoud(veld.label)} ${index + 1}`;
  const sleutel = veld.itemLabel;
  let w = sleutel ? lees(item, sleutel) : null;
  const sub = (veld.velden || []).find((v) => v.pad === sleutel);
  if (sub?.type === 'pagina' && w) w = paginaNaam(w);
  if (w == null || String(w).trim() === '') {
    const velden = veld.velden || [];
    const eerste = velden.find((v) => ['tekst', 'email'].includes(v.type) && item[v.pad]) || velden.find((v) => v.type === 'keuze' && item[v.pad] && v.standaard !== item[v.pad]);
    w = eerste ? item[eerste.pad] : '';
  }
  return String(w || '').trim() || `${enkelvoud(veld.label)} ${index + 1}`;
}
export function enkelvoud(label = 'Item') {
  const l = String(label);
  const vaste = { "Categorieën": 'Categorie', Gerechten: 'Gerecht', Uren: 'Dag', Profielen: 'Profiel', 'Per pagina': 'Pagina', Diensten: 'Dienst', Projecten: 'Project', Foto: 'Foto', "Foto's": 'Foto', Medewerkers: 'Medewerker', Reviews: 'Review', Vragen: 'Vraag', Producten: 'Product', Behandelingen: 'Behandeling', Lessen: 'Les', Items: 'Item' };
  if (vaste[l]) return vaste[l];
  if (l.trim().split(/\s+/).length > 2) return 'Item';
  if (/en$/.test(l) && l.length > 4) return l.replace(/en$/, '');
  if (/'s$/.test(l)) return l.replace(/'s$/, '');
  return l;
}

// Leesbaar label voor een pad: "Menukaart › Gerechten › Pasta › Prijs"
export function labelVoor(pad, inhoud = staat.inhoud) {
  const v = vindVeld(pad);
  if (!v) return pad;
  if (v.thema) return `Thema › ${v.veld.label}`;
  const stukken = [v.sectie.titel];
  for (const itemPad of v.items) {
    const r = vindLijstVeld(itemPad);
    if (r) {
      const item = lees(inhoud, itemPad);
      stukken.push(itemTitel(r, item, Number(delen(itemPad).pop())));
    }
  }
  if (!v.item) stukken.push(v.veld.label || v.veld.pad);
  return stukken.join(' › ');
}
function vindLijstVeld(itemPad) {
  const v = vindVeld(itemPad);
  return v && v.veld.type === 'lijst' ? v.veld : null;
}

export function standaardWaarde(veld) {
  switch (veld.type) {
    case 'schakelaar': return false;
    case 'lijst': return [];
    case 'groep': return Object.fromEntries((veld.velden || []).map((v) => [v.pad, standaardWaarde(v)]));
    case 'getal': return '';
    case 'keuze': return veld.opties?.[0] ?? '';
    default: return '';
  }
}
export function nieuwItem(veld) {
  if (!veld.velden?.length) return '';
  const o = {};
  for (const v of veld.velden || []) zet(o, v.pad, standaardWaarde(v));
  return o;
}

// Bij een afbeeldingsveld "foto" hoort een alt-veld "fotoAlt" in dezelfde lijst van velden.
export const altVeldVan = (veld, velden) => velden.find((v) => v.pad === `${veld.pad}Alt`);
