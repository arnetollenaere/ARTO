// ARTO beheer-API. Draait als dist/_worker.js op Cloudflare Pages (advanced mode).
// Alles onder /api/ handelt dit bestand af; al de rest gaat naar de statische site.
//
// Instellingen (Cloudflare → Workers & Pages → project → Settings → Variables and Secrets):
//   BEHEER_WACHTWOORD   wachtwoord van de klant (rol "klant")              verplicht
//   ARTO_WACHTWOORD     wachtwoord van ARTO (rol "arto": alles)             aangeraden
//   SESSIE_GEHEIM       lange willekeurige tekst om sessies te ondertekenen verplicht
//   GITHUB_TOKEN        fine-grained token, alleen "Contents" en "Actions" (lezen/schrijven) op de site-repo
//   GITHUB_REPO         eigenaar/repo, bv. arto-sites/bakkerij-peeters
//   GITHUB_BRANCH       standaard "main"
//   GITHUB_MAP          submap van de site in de repo, standaard leeg
// Optionele KV-binding: BERICHTEN (berichten van het contactformulier).
// Lokaal (node arto/dev.mjs) geeft de dev-server een eigen opslag mee via env.__opslag.

const JSON_KOP = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const antwoord = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...JSON_KOP, ...extra } });
const fout = (status, melding) => antwoord({ fout: melding }, status);
const MAX_MEDIA = 8 * 1024 * 1024;
const MEDIA_MAP = 'src/img/uploads';
const MEDIA_TYPES = /^image\/(png|jpe?g|webp|avif|gif|svg\+xml)$|^application\/pdf$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('Niet gevonden', { status: 404 });
    }
    try {
      return await api(request, env, url);
    } catch (e) {
      const status = e.status || 500;
      return fout(status, status === 500 ? `Serverfout: ${e.message}` : e.message);
    }
  },
};

class ApiFout extends Error { constructor(status, m) { super(m); this.status = status; } }

async function api(request, env, url) {
  const route = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  const m = request.method;
  const opslag = env.__opslag || (env.GITHUB_TOKEN && env.GITHUB_REPO ? githubOpslag(env) : null);

  // Openbaar: contactformulier.
  if (route === 'bericht' && m === 'POST') return ontvangBericht(request, env, url);

  if (route === 'login' && m === 'POST') return login(request, env);
  if (route === 'uitloggen' && m === 'POST') return antwoord({ ok: true }, 200, { 'set-cookie': cookie('', 0, url) });

  const sessie = await leesSessie(request, env);
  if (route === 'sessie') {
    return antwoord({
      ingelogd: !!sessie,
      rol: sessie?.rol || null,
      modus: env.__opslag ? 'lokaal' : 'live',
      configuratie: {
        wachtwoord: !!(env.BEHEER_WACHTWOORD || env.ARTO_WACHTWOORD || env.__opslag),
        opslaan: !!opslag,
        berichten: !!(env.BERICHTEN || env.__opslag),
        repo: env.GITHUB_REPO || null,
      },
    });
  }
  if (!sessie) throw new ApiFout(401, 'Niet ingelogd');
  if (m !== 'GET' && request.headers.get('x-arto') !== '1') throw new ApiFout(403, 'Ontbrekende beveiligingsheader');

  if (route === 'berichten') return berichten(request, env, url, m);
  if (!opslag) throw new ApiFout(503, 'Opslaan is nog niet ingesteld: GITHUB_TOKEN en GITHUB_REPO ontbreken.');

  switch (`${m} ${route}`) {
    case 'GET inhoud': {
      const r = await opslag.lees('inhoud.json');
      return antwoord({ inhoud: JSON.parse(r.tekst), sha: r.sha });
    }
    case 'PUT inhoud': {
      const { inhoud, sha, bericht } = await request.json();
      if (!inhoud || typeof inhoud !== 'object') throw new ApiFout(400, 'Geen inhoud meegegeven');
      const tekst = JSON.stringify(inhoud, null, 2) + '\n';
      if (tekst.length > 900_000) throw new ApiFout(413, 'Inhoud te groot');
      const r = await opslag.schrijf('inhoud.json', { tekst }, sha, `Beheer: ${String(bericht || 'inhoud bijgewerkt').slice(0, 120)} (${sessie.rol})`);
      return antwoord({ sha: r.sha, commit: r.commit });
    }
    case 'GET media': {
      const lijst = await opslag.lijst(MEDIA_MAP);
      return antwoord({ bestanden: lijst.map((b) => ({ ...b, url: '/img/uploads/' + b.naam, voorbeeld: '/api/media/bestand?naam=' + encodeURIComponent(b.naam) })) });
    }
    case 'POST media': {
      const { naam, type, data } = await request.json();
      if (!MEDIA_TYPES.test(type || '')) throw new ApiFout(415, 'Alleen afbeeldingen (PNG, JPG, WebP, AVIF, GIF, SVG) of PDF');
      const schoon = veiligeNaam(naam);
      if (!schoon) throw new ApiFout(400, 'Ongeldige bestandsnaam');
      if (!data || data.length * 0.75 > MAX_MEDIA) throw new ApiFout(413, 'Bestand groter dan 8 MB');
      const pad = `${MEDIA_MAP}/${schoon}`;
      const bestaand = await opslag.lees(pad).catch(() => null);
      const r = await opslag.schrijf(pad, { base64: data }, bestaand?.sha, `Beheer: afbeelding ${schoon} (${sessie.rol})`);
      return antwoord({ naam: schoon, url: '/img/uploads/' + schoon, voorbeeld: '/api/media/bestand?naam=' + encodeURIComponent(schoon), sha: r.sha });
    }
    case 'DELETE media': {
      const schoon = veiligeNaam(url.searchParams.get('naam'));
      const b = await opslag.lees(`${MEDIA_MAP}/${schoon}`);
      await opslag.verwijder(`${MEDIA_MAP}/${schoon}`, b.sha, `Beheer: afbeelding ${schoon} verwijderd (${sessie.rol})`);
      return antwoord({ ok: true });
    }
    case 'GET media/bestand': {
      const schoon = veiligeNaam(url.searchParams.get('naam'));
      const { bytes, type } = await opslag.leesBytes(`${MEDIA_MAP}/${schoon}`);
      return new Response(bytes, { headers: { 'content-type': type || mimeVan(schoon), 'cache-control': 'private, max-age=300', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
    }
    case 'GET geschiedenis':
      return antwoord({ versies: await opslag.geschiedenis('inhoud.json') });
    case 'GET geschiedenis/versie': {
      const sha = url.searchParams.get('sha') || '';
      if (!/^[0-9a-f]{7,40}$/.test(sha)) throw new ApiFout(400, 'Ongeldige versie');
      const r = await opslag.lees('inhoud.json', sha);
      return antwoord({ inhoud: JSON.parse(r.tekst) });
    }
    case 'GET publicaties':
      return antwoord({ publicaties: await opslag.publicaties() });
  }
  throw new ApiFout(404, `Onbekende route: ${m} /api/${route}`);
}

// ---------- inloggen ----------
async function login(request, env) {
  const { wachtwoord } = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  await new Promise((r) => setTimeout(r, 400)); // remt raden af
  let rol = null;
  if (env.__opslag && !env.BEHEER_WACHTWOORD) rol = 'arto'; // lokale dev-server: elk wachtwoord werkt
  else if (env.ARTO_WACHTWOORD && await gelijk(wachtwoord, env.ARTO_WACHTWOORD)) rol = 'arto';
  else if (env.BEHEER_WACHTWOORD && await gelijk(wachtwoord, env.BEHEER_WACHTWOORD)) rol = 'klant';
  if (!rol) throw new ApiFout(401, 'Verkeerd wachtwoord');
  const geldig = Date.now() + 1000 * 60 * 60 * 12;
  const waarde = `${rol}.${geldig}`;
  const token = `${waarde}.${await hmac(waarde, geheim(env))}`;
  return antwoord({ ok: true, rol }, 200, { 'set-cookie': cookie(token, 60 * 60 * 12, url) });
}

async function leesSessie(request, env) {
  const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)arto_sessie=([^;]+)/);
  if (!c) return null;
  const [rol, geldig, sig] = decodeURIComponent(c[1]).split('.');
  if (!rol || !geldig || !sig || Number(geldig) < Date.now()) return null;
  if (!(await gelijk(sig, await hmac(`${rol}.${geldig}`, geheim(env))))) return null;
  return { rol };
}

function geheim(env) {
  const g = env.SESSIE_GEHEIM || (env.__opslag ? 'lokaal-ontwikkelen' : '');
  if (!g) throw new ApiFout(503, 'SESSIE_GEHEIM is niet ingesteld');
  return g;
}
const cookie = (waarde, maxAge, url) => `arto_sessie=${encodeURIComponent(waarde)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${url.protocol === 'https:' ? '; Secure' : ''}`;

async function hmac(tekst, sleutel) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(sleutel), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(tekst));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function gelijk(a, b) {
  // Vergelijk via hashes zodat de duur niet afhangt van de inhoud.
  const h = async (x) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(x ?? ''))));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let v = 0;
  for (let i = 0; i < x.length; i++) v |= x[i] ^ y[i];
  return v === 0;
}

// ---------- contactformulier ----------
async function ontvangBericht(request, env, url) {
  const kv = env.BERICHTEN || env.__opslag?.kv;
  const type = request.headers.get('content-type') || '';
  const velden = type.includes('json') ? await request.json() : Object.fromEntries(await request.formData());
  if (velden._honing) return terug(request, url, true); // spam-val: verborgen veld ingevuld
  const schoon = {};
  for (const [k, v] of Object.entries(velden)) {
    if (k.startsWith('_') || typeof v !== 'string') continue;
    schoon[k.slice(0, 40)] = v.slice(0, 5000);
  }
  if (!Object.values(schoon).some((v) => v.trim())) throw new ApiFout(400, 'Leeg bericht');
  if (kv) {
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const bericht = { id, datum: new Date().toISOString(), formulier: String(velden._formulier || 'contact').slice(0, 40), velden: schoon, gelezen: false };
    await kv.put(`bericht:${id}`, JSON.stringify(bericht), { expirationTtl: 60 * 60 * 24 * 365 });
  }
  return terug(request, url, true);
}
function terug(request, url, ok) {
  if ((request.headers.get('accept') || '').includes('application/json')) return antwoord({ ok });
  const van = request.headers.get('referer');
  const doel = new URL(van && new URL(van).host === url.host ? van : '/', url);
  doel.searchParams.set('verzonden', '1');
  return Response.redirect(doel.toString(), 303);
}

async function berichten(request, env, url, m) {
  const kv = env.BERICHTEN || env.__opslag?.kv;
  if (!kv) throw new ApiFout(503, 'Berichten zijn niet ingesteld: koppel een KV-namespace als BERICHTEN.');
  const id = url.searchParams.get('id');
  if (m === 'GET') {
    const sleutels = [];
    let cursor;
    do {
      const r = await kv.list({ prefix: 'bericht:', cursor });
      sleutels.push(...r.keys);
      cursor = r.list_complete ? null : r.cursor;
    } while (cursor && sleutels.length < 500);
    const lijst = (await Promise.all(sleutels.slice(-200).map((k) => kv.get(k.name)))).filter(Boolean).map((x) => JSON.parse(x));
    lijst.sort((a, b) => b.datum.localeCompare(a.datum));
    return antwoord({ berichten: lijst });
  }
  if (!id || !/^[\w-]+$/.test(id)) throw new ApiFout(400, 'Geen id');
  if (m === 'DELETE') { await kv.delete(`bericht:${id}`); return antwoord({ ok: true }); }
  if (m === 'PATCH') {
    const b = JSON.parse((await kv.get(`bericht:${id}`)) || 'null');
    if (!b) throw new ApiFout(404, 'Bericht niet gevonden');
    Object.assign(b, { gelezen: !!(await request.json()).gelezen });
    await kv.put(`bericht:${id}`, JSON.stringify(b));
    return antwoord({ ok: true });
  }
  throw new ApiFout(405, 'Niet toegestaan');
}

// ---------- opslag in GitHub ----------
function githubOpslag(env) {
  const repo = env.GITHUB_REPO;
  const tak = env.GITHUB_BRANCH || 'main';
  const map = (env.GITHUB_MAP || '').replace(/^\/|\/$/g, '');
  const vol = (p) => (map ? `${map}/${p}` : p);
  const gh = async (pad, opties = {}) => {
    const r = await fetch(`https://api.github.com/repos/${repo}/${pad}`, {
      ...opties,
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'arto-beheer', 'x-github-api-version': '2022-11-28', ...(opties.headers || {}) },
    });
    if (r.status === 404) throw new ApiFout(404, 'Niet gevonden in de repo');
    if (r.status === 409 || r.status === 422) throw new ApiFout(409, 'Iemand anders heeft intussen iets opgeslagen. Herlaad en probeer opnieuw.');
    if (!r.ok) throw new ApiFout(502, `GitHub antwoordde ${r.status}`);
    return r;
  };
  const inhoudPad = (p) => `contents/${vol(p).split('/').map(encodeURIComponent).join('/')}`;
  return {
    async lees(p, ref = tak) {
      const j = await (await gh(`${inhoudPad(p)}?ref=${encodeURIComponent(ref)}`)).json();
      let tekst;
      if (j.content) tekst = new TextDecoder().decode(b64naarBytes(j.content));
      else tekst = await (await gh(`${inhoudPad(p)}?ref=${encodeURIComponent(ref)}`, { headers: { accept: 'application/vnd.github.raw' } })).text();
      return { tekst, sha: j.sha };
    },
    async leesBytes(p) {
      const r = await gh(`${inhoudPad(p)}?ref=${encodeURIComponent(tak)}`, { headers: { accept: 'application/vnd.github.raw' } });
      return { bytes: await r.arrayBuffer(), type: mimeVan(p) };
    },
    async schrijf(p, { tekst, base64 }, sha, bericht) {
      const content = base64 ?? bytesNaarB64(new TextEncoder().encode(tekst));
      const j = await (await gh(inhoudPad(p), { method: 'PUT', body: JSON.stringify({ message: bericht, content, sha, branch: tak }) })).json();
      return { sha: j.content?.sha, commit: j.commit?.sha };
    },
    async verwijder(p, sha, bericht) {
      await gh(inhoudPad(p), { method: 'DELETE', body: JSON.stringify({ message: bericht, sha, branch: tak }) });
    },
    async lijst(p) {
      try {
        const j = await (await gh(`${inhoudPad(p)}?ref=${encodeURIComponent(tak)}`)).json();
        return (Array.isArray(j) ? j : []).filter((b) => b.type === 'file' && b.name !== '.gitkeep').map((b) => ({ naam: b.name, grootte: b.size, sha: b.sha }));
      } catch (e) {
        if (e.status === 404) return [];
        throw e;
      }
    },
    async geschiedenis(p) {
      const j = await (await gh(`commits?path=${encodeURIComponent(vol(p))}&sha=${encodeURIComponent(tak)}&per_page=40`)).json();
      return j.map((c) => ({ sha: c.sha, bericht: c.commit.message.split('\n')[0], datum: c.commit.author?.date, auteur: c.commit.author?.name }));
    },
    async publicaties() {
      const r = await gh(`actions/runs?branch=${encodeURIComponent(tak)}&per_page=10`).catch(() => null);
      if (!r) return [];
      const j = await r.json();
      return (j.workflow_runs || []).map((w) => ({ id: w.id, titel: w.display_title, status: w.status, conclusie: w.conclusion, datum: w.created_at, bijgewerkt: w.updated_at, url: w.html_url }));
    },
  };
}

// ---------- hulpjes ----------
function veiligeNaam(naam) {
  const n = String(naam || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|-+$/g, '').slice(0, 80);
  if (!n || n.includes('..') || !/\.[a-z0-9]{2,5}$/.test(n)) throw new ApiFout(400, 'Ongeldige bestandsnaam');
  return n;
}
function mimeVan(p) {
  const e = p.split('.').pop().toLowerCase();
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf' }[e] || 'application/octet-stream';
}
function b64naarBytes(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function bytesNaarB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
