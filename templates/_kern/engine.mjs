// ARTO template-engine. Werkt in Node (bouw) en in de browser (live preview in het beheerpaneel).
// Geen afhankelijkheden. Syntax:
//   {{ pad.naar.veld }}          tekst, ge-escaped
//   {{{ pad }}}                  ruwe HTML (alleen voor vertrouwde inhoud)
//   {{ pad | filter }}           filters: tel, nl2br, md, klein, groot, url, json, slug, eerste, aantal, tekst, twee
//   {{#elk lijst}}…{{/elk}}      herhaal; binnenin {{ veld }}, {{ . }}, {{ @nr }}, {{ @index }}, {{ @eerste }}, {{ @laatste }}
//   {{#als pad}}…{{#anders}}…{{/als}}     ook {{#als pad == "waarde"}} en {{#als pad != "waarde"}}
//   {{#niet pad}}…{{/niet}}
//   {{> naam }}                  voegt src/_delen/naam.html in
// Tokens in HOOFDLETTERS ({{NAAM}}) laat de engine staan: die vult setup/scripts/nieuwe-site.sh in.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const filters = {
  tel: (v) => String(v ?? '').replace(/[^\d+]/g, ''),
  nl2br: (v) => escape(v).replace(/\n/g, '<br>'),
  klein: (v) => String(v ?? '').toLowerCase(),
  groot: (v) => String(v ?? '').toUpperCase(),
  url: (v) => encodeURIComponent(String(v ?? '')),
  json: (v) => JSON.stringify(v ?? null),
  slug: (v) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  eerste: (v) => (Array.isArray(v) ? v[0] : String(v ?? '').charAt(0)),
  aantal: (v) => (Array.isArray(v) ? v.length : String(v ?? '').length),
  tekst: (v) => String(v ?? '').replace(/<[^>]*>/g, ''),
  twee: (v) => String(v ?? '').padStart(2, '0'),
  md: (v) => markdown(v),
};
const RAUW_FILTERS = new Set(['nl2br', 'json', 'md']);

// Mini-markdown voor velden van het type "rijk": alinea's, **vet**, *cursief*, [link](url), lijstjes met "- ".
export function markdown(v) {
  const inline = (t) => escape(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:|tel:|#)[^)\s]*)\)/g, '<a href="$2">$1</a>');
  return String(v ?? '').trim().split(/\n{2,}/).filter(Boolean).map((blok) => {
    const regels = blok.split('\n');
    if (regels.every((r) => /^\s*[-•]\s+/.test(r))) return '<ul>' + regels.map((r) => `<li>${inline(r.replace(/^\s*[-•]\s+/, ''))}</li>`).join('') + '</ul>';
    return `<p>${regels.map(inline).join('<br>')}</p>`;
  }).join('');
}

// ---------- parser ----------
const TOKEN = /\{\{\{\s*([^}]+?)\s*\}\}\}|\{\{\s*([^}]+?)\s*\}\}/g;

function parse(bron) {
  const wortel = { type: 'blok', kinderen: [] };
  const stapel = [wortel];
  let laatste = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(bron))) {
    const huidig = stapel[stapel.length - 1];
    if (m.index > laatste) huidig.kinderen.push({ type: 'tekst', waarde: bron.slice(laatste, m.index) });
    laatste = TOKEN.lastIndex;
    const voor = bron.slice(Math.max(0, m.index - 400), m.index);
    if (m[1] !== undefined) { huidig.kinderen.push({ type: 'var', expr: m[1], rauw: true }); continue; }
    const t = m[2];
    if (/^[A-Z][A-Z0-9_]*$/.test(t)) { huidig.kinderen.push({ type: 'tekst', waarde: m[0] }); continue; }
    if (t.startsWith('#elk ') || t.startsWith('#als ') || t.startsWith('#niet ')) {
      const [soort, ...rest] = t.slice(1).split(' ');
      const knoop = { type: soort, expr: rest.join(' ').trim(), kinderen: [] };
      huidig.kinderen.push(knoop);
      stapel.push(knoop);
    } else if (t.startsWith('/')) {
      const naam = t.slice(1).trim();
      const blok = stapel.pop();
      if (!blok || blok.type !== naam) throw new Error(`Onverwacht {{/${naam}}}`);
    } else if (t.startsWith('>')) {
      huidig.kinderen.push({ type: 'deel', naam: t.slice(1).trim() });
    } else if (t.startsWith('!')) {
      // commentaar
    } else {
      huidig.kinderen.push({ type: 'var', expr: t, rauw: false, inTag: inTag(voor) });
    }
  }
  if (laatste < bron.length) stapel[stapel.length - 1].kinderen.push({ type: 'tekst', waarde: bron.slice(laatste) });
  if (stapel.length > 1) throw new Error(`Blok {{#${stapel[stapel.length - 1].type}}} niet gesloten`);
  return wortel;
}

// Is de positie binnen een HTML-tag, of binnen <title>, <script>, <style>, <textarea>?
function inTag(voor) {
  const lt = voor.lastIndexOf('<');
  const gt = voor.lastIndexOf('>');
  if (lt > gt) return true;
  const laag = voor.toLowerCase();
  for (const t of ['title', 'script', 'style', 'textarea', 'option']) {
    if (laag.lastIndexOf('<' + t) > laag.lastIndexOf('</' + t)) return true;
  }
  return false;
}

// ---------- evaluatie ----------
function zoek(pad, scopes) {
  pad = pad.trim();
  if (pad === '.' || pad === 'dit') return scopes[scopes.length - 1].waarde;
  if (pad.startsWith('"') || pad.startsWith("'")) return pad.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(pad)) return Number(pad);
  const delen = pad.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (delen[0].startsWith('@')) {
      if (delen[0] in s.meta) return s.meta[delen[0]];
      continue;
    }
    let w = s.waarde;
    if (w !== null && typeof w === 'object' && delen[0] in w) {
      for (const d of delen) w = w == null ? undefined : w[d];
      return w;
    }
  }
  return undefined;
}

function evalExpr(expr, scopes) {
  const [basis, ...fs] = expr.split('|').map((s) => s.trim());
  let w = zoek(basis, scopes);
  for (const f of fs) {
    const fn = filters[f];
    if (!fn) throw new Error(`Onbekende filter "${f}"`);
    w = fn(w);
  }
  return { w, rauwFilter: fs.some((f) => RAUW_FILTERS.has(f)) };
}

function voorwaarde(expr, scopes) {
  const m = expr.match(/^(.+?)\s*(==|!=)\s*(.+)$/);
  if (m) {
    const a = String(evalExpr(m[1], scopes).w ?? '');
    const b = String(evalExpr(m[3], scopes).w ?? '');
    return m[2] === '==' ? a === b : a !== b;
  }
  const w = evalExpr(expr, scopes).w;
  return Array.isArray(w) ? w.length > 0 : !!w;
}

function splits(knoop) {
  // Splits kinderen bij de {{#anders}}-markering.
  if (knoop._gesplitst) return knoop._gesplitst;
  const ja = [], nee = [];
  let doel = ja;
  for (const k of knoop.kinderen) {
    if (k.type === '__anders') { doel = nee; continue; }
    doel.push(k);
  }
  return (knoop._gesplitst = [ja, nee]);
}

function render(kinderen, scopes, opties, diepte = 0) {
  let uit = '';
  for (const k of kinderen) {
    switch (k.type) {
      case 'tekst': uit += k.waarde; break;
      case 'var': {
        const { w, rauwFilter } = evalExpr(k.expr, scopes);
        let s = w == null ? '' : typeof w === 'object' ? '' : String(w);
        if (!k.rauw && !rauwFilter) s = escape(s);
        if (opties.markeer && !k.rauw && !k.inTag && !k.expr.includes('|')) {
          const pad = volledigPad(k.expr, scopes);
          if (pad) s = `<arto-v data-pad="${escape(pad)}">${s}</arto-v>`;
        }
        uit += s;
        break;
      }
      case 'als':
      case 'niet': {
        const [ja, nee] = splits(k);
        let ok = voorwaarde(k.expr, scopes);
        if (k.type === 'niet') ok = !ok;
        uit += render(ok ? ja : nee, scopes, opties, diepte);
        break;
      }
      case 'elk': {
        const [ja, nee] = splits(k);
        const lijst = evalExpr(k.expr, scopes).w;
        if (!Array.isArray(lijst) || !lijst.length) { uit += render(nee, scopes, opties, diepte); break; }
        const basisPad = volledigPad(k.expr, scopes);
        lijst.forEach((item, i) => {
          uit += render(ja, [...scopes, {
            waarde: item,
            pad: basisPad ? `${basisPad}.${i}` : null,
            meta: { '@index': i, '@nr': i + 1, '@eerste': i === 0, '@laatste': i === lijst.length - 1, '@even': i % 2 === 1, '@oneven': i % 2 === 0 },
          }], opties, diepte);
        });
        break;
      }
      case 'deel': {
        if (diepte > 10) throw new Error('Te diep geneste {{> deel}}');
        const bron = opties.delen?.[k.naam];
        if (bron == null) throw new Error(`Deel "${k.naam}" niet gevonden (src/_delen/${k.naam}.html)`);
        uit += render(compileer(bron).kinderen, scopes, opties, diepte + 1);
        break;
      }
    }
  }
  return uit;
}

// Volledig pad van een expressie t.o.v. de wortel, voor klik-om-te-bewerken in de preview.
function volledigPad(expr, scopes) {
  const basis = expr.split('|')[0].trim();
  if (basis.startsWith('@') || basis.startsWith('"')) return null;
  const eerste = basis.split('.')[0];
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (basis === '.' && i === scopes.length - 1) return s.pad;
    const w = s.waarde;
    if (w !== null && typeof w === 'object' && eerste in w) {
      return s.pad ? `${s.pad}.${basis}` : (i === 0 ? basis : null);
    }
  }
  return null;
}

const cache = new Map();
export function compileer(bron) {
  if (cache.has(bron)) return cache.get(bron);
  const boom = parse(bron.replace(/\{\{\s*#?anders\s*\}\}/g, '\u0000ANDERS\u0000'));
  // vervang markering door een __anders-knoop
  const fix = (k) => {
    if (!k.kinderen) return k;
    const nieuw = [];
    for (const c of k.kinderen) {
      if (c.type === 'tekst' && c.waarde.includes('\u0000ANDERS\u0000')) {
        const stukken = c.waarde.split('\u0000ANDERS\u0000');
        stukken.forEach((st, i) => {
          if (i > 0) nieuw.push({ type: '__anders' });
          if (st) nieuw.push({ type: 'tekst', waarde: st });
        });
      } else nieuw.push(fix(c));
    }
    k.kinderen = nieuw;
    return k;
  };
  const r = fix(boom);
  cache.set(bron, r);
  return r;
}

/**
 * Rendert een template.
 * @param {string} bron  template-tekst
 * @param {object} data  inhoud (inhoud.json + extra's zoals arto, pagina, jaar)
 * @param {object} [opties] { delen: {naam: bron}, markeer: bool (preview: klik-om-te-bewerken) }
 */
export function renderTemplate(bron, data, opties = {}) {
  return render(compileer(bron).kinderen, [{ waarde: data, pad: null, meta: {} }], opties);
}
