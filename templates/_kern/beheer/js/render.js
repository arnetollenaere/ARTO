// Rendert een pagina van de site in de browser met dezelfde engine als de build.
import { renderTemplate, escape } from '../engine.mjs';
import { staat } from './staat.js';

export const paginas = () => (staat.bron?.arto?.paginas || []).filter((p) => staat.bron.bestanden[p.bestand] != null)
  .sort((a, b) => (a.bestand === 'index.html' ? -1 : b.bestand === 'index.html' ? 1 : a.url.split('/').length - b.url.split('/').length || 0));

export function paginaSeo(inhoud, bestand) {
  const url = '/' + bestand.replace(/index\.html$/, '').replace(/\.html$/, '');
  return (inhoud.seo?.paginas || []).find((p) => p.pagina === bestand || p.pagina === url || p.pagina === url.slice(1)) || null;
}

// De titel en beschrijving zoals bouw.mjs ze in <head> zet.
export function kopGegevens(inhoud, bestand) {
  const s = inhoud.site || {};
  const seo = inhoud.seo || {};
  const p = paginaSeo(inhoud, bestand) || {};
  const naam = s.naam || '';
  const titel = bestand === '404.html' ? `Pagina niet gevonden | ${naam}` : p.titel ? `${p.titel} | ${naam}` : (seo.titel || naam);
  const beschrijving = p.beschrijving || seo.beschrijving || s.slogan || '';
  const url = '/' + bestand.replace(/index\.html$/, '').replace(/\.html$/, '');
  return { titel, beschrijving, url, volledig: (staat.bron?.arto?.basisUrl || '') + url, eigenTitel: p.titel || (bestand === 'index.html' ? seo.titel : ''), eigenBeschrijving: p.beschrijving || (bestand === 'index.html' ? seo.beschrijving : '') };
}

export function maakData(inhoud, bestand) {
  const url = '/' + bestand.replace(/index\.html$/, '').replace(/\.html$/, '');
  const p = paginaSeo(inhoud, bestand) || {};
  const naam = bestand.replace(/\.html$/, '');
  const pagina = { bestand, url, naam, titel: p.titel || '', beschrijving: p.beschrijving || '', is: { [naam.replace(/[^a-z0-9]/gi, '_')]: true } };
  const k = kopGegevens(inhoud, bestand);
  const vars = Object.entries(inhoud.thema?.kleuren || {}).map(([x, v]) => `--thema-${x}:${v}`).join(';').replace(/</g, '');
  const kop = [
    `<title>${escape(k.titel)}</title>`,
    `<meta name="description" content="${escape(k.beschrijving)}">`,
    inhoud.site?.favicon ? `<link rel="icon" href="${escape(inhoud.site.favicon)}">` : '',
    vars ? `<style id="arto-thema">:root{${vars}}</style>` : '',
  ].filter(Boolean).join('\n  ');
  return { ...inhoud, jaar: new Date().getFullYear(), pagina, arto: { ...staat.bron.arto, kop, voet: '' } };
}

export function renderPagina(inhoud, bestand, { markeer = false } = {}) {
  const bron = staat.bron.bestanden[bestand];
  if (bron == null) throw new Error(`Pagina ${bestand} bestaat niet`);
  return renderTemplate(bron, maakData(inhoud, bestand), { delen: staat.bron.delen, markeer });
}
