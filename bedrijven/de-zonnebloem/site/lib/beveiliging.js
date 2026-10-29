// Toegang tot het beheer via een inlogpagina (/inloggen/) en een beveiligd sessiecookie.
// Gebruikersnaam en wachtwoord staan als geheim bij Cloudflare, nooit in de code:
//   npx wrangler pages secret put BEHEER_GEBRUIKER --project-name=de-zonnebloem
//   npx wrangler pages secret put BEHEER_WACHTWOORD --project-name=de-zonnebloem
// Lokaal: zet BEHEER_GEBRUIKER=... en BEHEER_WACHTWOORD=... in .dev.vars (staat in .gitignore).
// Het cookie is ondertekend met een sleutel afgeleid van die geheimen: wie het wachtwoord
// wijzigt, logt meteen alle bestaande sessies uit.

const COOKIE = "zb_beheer";
const DUUR_S = 8 * 3600;          // 8 uur ingelogd
const MAX_FOUTEN = 10;            // per 15 minuten per toestel

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha = async (t) => hex(await crypto.subtle.digest("SHA-256", enc.encode(t)));

async function sleutel(env) {
  return crypto.subtle.importKey("raw", enc.encode("zb-sessie|" + env.BEHEER_GEBRUIKER + "|" + env.BEHEER_WACHTWOORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function onderteken(env, tekst) {
  return hex(await crypto.subtle.sign("HMAC", await sleutel(env), enc.encode(tekst)));
}

// Vergelijkt in constante tijd via een hash.
async function gelijk(a, b) {
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let verschil = 0;
  for (let i = 0; i < x.length; i++) verschil |= x[i] ^ y[i];
  return verschil === 0;
}

function leesCookie(request) {
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  return m ? m[1] : "";
}

export async function geldigeSessie(request, env) {
  if (!env.BEHEER_GEBRUIKER || !env.BEHEER_WACHTWOORD) return false;
  const [verval, handtekening] = leesCookie(request).split(".");
  if (!verval || !handtekening || Number(verval) < Date.now() / 1000) return false;
  return gelijk(handtekening, await onderteken(env, verval));
}

export async function maakSessieCookie(env) {
  const verval = String(Math.floor(Date.now() / 1000) + DUUR_S);
  const waarde = verval + "." + (await onderteken(env, verval));
  return `${COOKIE}=${waarde}; Path=/; Max-Age=${DUUR_S}; HttpOnly; Secure; SameSite=Strict`;
}
export const wisSessieCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

// ---------- Slot tegen raden ----------
async function toestel(request) {
  return sha((request.headers.get("cf-connecting-ip") || "onbekend") + "|beheer");
}
export async function teVeelFouten(request, env) {
  if (!env.DB) return false;
  try {
    const sinds = new Date(Date.now() - 15 * 60e3).toISOString();
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM inlogpogingen WHERE ip_hash = ? AND tijd > ?").bind(await toestel(request), sinds).first();
    return (r ? r.n : 0) >= MAX_FOUTEN;
  } catch { return false; } // tabel bestaat nog niet: nog geen foute pogingen
}
export async function noteerFout(request, env) {
  if (!env.DB) return;
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS inlogpogingen (ip_hash TEXT NOT NULL, tijd TEXT NOT NULL)").run();
    await env.DB.prepare("INSERT INTO inlogpogingen (ip_hash, tijd) VALUES (?, ?)").bind(await toestel(request), new Date().toISOString()).run();
    await env.DB.prepare("DELETE FROM inlogpogingen WHERE tijd < ?").bind(new Date(Date.now() - 86400e3).toISOString()).run();
  } catch { /* het slot is extra; inloggen blijft werken */ }
}
export async function controleerGegevens(env, naam, wachtwoord) {
  const a = await gelijk(naam, env.BEHEER_GEBRUIKER), b = await gelijk(wachtwoord, env.BEHEER_WACHTWOORD);
  return a && b;
}

// ---------- Middleware voor /beheer en /api/beheer ----------
export async function vereisWachtwoord({ request, env, next }) {
  if (!env.BEHEER_GEBRUIKER || !env.BEHEER_WACHTWOORD) return new Response("Beheer is nog niet ingesteld (BEHEER_GEBRUIKER of BEHEER_WACHTWOORD ontbreekt).", { status: 503 });
  const url = new URL(request.url);
  const api = url.pathname.startsWith("/api/");

  if (!(await geldigeSessie(request, env))) {
    if (api) return new Response(JSON.stringify({ fout: "Niet ingelogd." }), { status: 401, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    return new Response(null, { status: 302, headers: { location: "/inloggen/", "cache-control": "no-store" } });
  }
  // Wijzigingen alleen vanaf de eigen site (extra bescherming naast SameSite=Strict).
  if (api && request.method !== "GET" && request.method !== "HEAD") {
    const herkomst = request.headers.get("origin");
    if (herkomst && herkomst !== url.origin) return new Response(JSON.stringify({ fout: "Niet toegestaan." }), { status: 403, headers: { "content-type": "application/json; charset=utf-8" } });
  }

  const antwoord = await next();
  const kopie = new Response(antwoord.body, antwoord);
  kopie.headers.set("cache-control", "no-store");
  kopie.headers.set("x-robots-tag", "noindex");
  // Zelfde strenge headers als de rest van de site.
  kopie.headers.set("content-security-policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
  kopie.headers.set("x-frame-options", "DENY");
  kopie.headers.set("x-content-type-options", "nosniff");
  kopie.headers.set("referrer-policy", "no-referrer");
  kopie.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  return kopie;
}
