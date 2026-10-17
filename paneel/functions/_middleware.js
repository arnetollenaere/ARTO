// Afscherming van het paneel met een gewone login (gebruikersnaam + wachtwoord).
// Zonder geldige sessie is alles dicht, ook data.json en /api/status.
//
// Instellen (zie paneel/README.md):
//   PANEEL_GEBRUIKER   gebruikersnaam, staat in wrangler.toml
//   PANEEL_WACHTWOORD  wachtwoord, een geheim van het Pages-project (nooit in de repo)
// Wie het wachtwoord verandert, logt meteen alle bestaande sessies uit.

const COOKIE = "arto_sessie";
const DUUR = 30 * 24 * 60 * 60; // 30 dagen, in seconden

const enc = new TextEncoder();

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sleutel(env) {
  // De sessiesleutel komt uit het wachtwoord: nieuw wachtwoord = alle sessies ongeldig.
  const ruw = await crypto.subtle.digest("SHA-256", enc.encode(`arto-sessie:${env.PANEEL_GEBRUIKER}:${env.PANEEL_WACHTWOORD}`));
  return crypto.subtle.importKey("raw", ruw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function handtekening(inhoud, env) {
  return b64url(await crypto.subtle.sign("HMAC", await sleutel(env), enc.encode(inhoud)));
}

// Vergelijk zonder dat de duur verraadt hoeveel tekens juist zijn.
async function gelijk(a, b) {
  const [ha, hb] = await Promise.all([a, b].map((x) => crypto.subtle.digest("SHA-256", enc.encode(String(x)))));
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let verschil = 0;
  for (let i = 0; i < va.length; i++) verschil |= va[i] ^ vb[i];
  return verschil === 0;
}

function cookie(request, naam) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${naam}=([^;]+)`));
  return m ? m[1] : "";
}

async function geldigeSessie(request, env) {
  const waarde = cookie(request, COOKIE);
  const [exp, sig] = waarde.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return gelijk(sig, await handtekening(exp, env));
}

function veiligPad(pad) {
  return typeof pad === "string" && pad.startsWith("/") && !pad.startsWith("//") && !pad.startsWith("/login") ? pad : "/";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const KOPPEN = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
};

function loginPagina({ terug = "/", fout = "", status = 200 } = {}) {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Aanmelden · ARTO paneel</title>
<style>
:root{--bg:#f5f5f7;--kaart:#fff;--tekst:#1d1d1f;--zacht:#6e6e73;--rand:#d2d2d7;--accent:#1d4ed8;--fout:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#111113;--kaart:#1c1c1f;--tekst:#f5f5f7;--zacht:#a1a1a6;--rand:#3a3a3f;--accent:#7aa2ff;--fout:#f87171}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--tekst);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
form{width:100%;max-width:22rem;background:var(--kaart);border:1px solid var(--rand);border-radius:14px;padding:28px}
h1{font-size:1.3rem;margin:0 0 4px}p{margin:0 0 20px;color:var(--zacht);font-size:.95rem}
label{display:block;font-size:.9rem;font-weight:600;margin:14px 0 6px}
input{width:100%;font:inherit;padding:10px 12px;border:1px solid var(--rand);border-radius:8px;background:transparent;color:inherit}
input:focus{outline:2px solid var(--accent);outline-offset:1px}
button{margin-top:22px;width:100%;font:inherit;font-weight:600;padding:11px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
.fout{color:var(--fout);margin:0 0 6px;font-size:.95rem}
</style></head><body>
<form method="post" action="/login">
<h1>ARTO paneel</h1><p>Meld je aan om verder te gaan.</p>
${fout ? `<div class="fout" role="alert">${esc(fout)}</div>` : ""}
<input type="hidden" name="terug" value="${esc(terug)}">
<label for="gebruiker">Gebruikersnaam</label><input id="gebruiker" name="gebruiker" autocomplete="username" required autofocus>
<label for="wachtwoord">Wachtwoord</label><input id="wachtwoord" name="wachtwoord" type="password" autocomplete="current-password" required>
<button type="submit">Aanmelden</button>
</form></body></html>`;
  return new Response(html, { status, headers: KOPPEN });
}

function doorsturen(naar, extraCookie) {
  const headers = { Location: naar, "Cache-Control": "no-store" };
  if (extraCookie) headers["Set-Cookie"] = extraCookie;
  return new Response(null, { status: 303, headers });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.PANEEL_GEBRUIKER || !env.PANEEL_WACHTWOORD) {
    return new Response("<!doctype html><meta charset=utf-8><title>ARTO paneel</title><p>De login is nog niet ingesteld (PANEEL_GEBRUIKER en PANEEL_WACHTWOORD, zie paneel/README.md).</p>", { status: 503, headers: KOPPEN });
  }

  if (url.pathname === "/login") {
    if (request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const terug = veiligPad(form?.get("terug"));
      const okGebruiker = await gelijk((form?.get("gebruiker") || "").trim().toLowerCase(), env.PANEEL_GEBRUIKER.toLowerCase());
      const okWachtwoord = await gelijk(form?.get("wachtwoord") || "", env.PANEEL_WACHTWOORD);
      if (!okGebruiker || !okWachtwoord) {
        await new Promise((r) => setTimeout(r, 1000)); // remt het raden van wachtwoorden af
        return loginPagina({ terug, fout: "Gebruikersnaam of wachtwoord klopt niet.", status: 401 });
      }
      const exp = String(Math.floor(Date.now() / 1000) + DUUR);
      const waarde = `${exp}.${await handtekening(exp, env)}`;
      return doorsturen(terug, `${COOKIE}=${waarde}; Path=/; Max-Age=${DUUR}; HttpOnly; Secure; SameSite=Lax`);
    }
    if (await geldigeSessie(request, env)) return doorsturen("/");
    return loginPagina({ terug: veiligPad(url.searchParams.get("terug")) });
  }

  if (url.pathname === "/uitloggen") {
    return doorsturen("/login", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  if (!(await geldigeSessie(request, env))) {
    const wilPagina = request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html");
    if (wilPagina) return doorsturen(`/login?terug=${encodeURIComponent(url.pathname)}`);
    return new Response("Niet aangemeld", { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  const res = await context.next();
  const kopie = new Response(res.body, res);
  kopie.headers.set("Cache-Control", "private, no-store");
  kopie.headers.set("X-Robots-Tag", "noindex, nofollow");
  return kopie;
}
