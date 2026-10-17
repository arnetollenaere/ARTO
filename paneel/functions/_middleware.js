// Afscherming van het paneel. Elke aanvraag moet een geldig Cloudflare Access-token
// hebben van het toegelaten e-mailadres. Zonder correcte instelling is alles dicht.
//
// Instellen (zie paneel/README.md):
//   ACCESS_TEAM_DOMAIN  bv. arto.cloudflareaccess.com
//   ACCESS_AUD          de "Application Audience (AUD) Tag" van de Access-applicatie
//   TOEGESTANE_EMAIL    e-mailadres(sen) die binnen mogen, komma-gescheiden

let certCache = { url: "", keys: null, tot: 0 };

function b64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function sleutels(team) {
  const url = `https://${team}/cdn-cgi/access/certs`;
  if (certCache.url === url && certCache.tot > Date.now()) return certCache.keys;
  const res = await fetch(url);
  if (!res.ok) throw new Error("certs niet bereikbaar");
  const { keys } = await res.json();
  certCache = { url, keys, tot: Date.now() + 60 * 60 * 1000 };
  return keys;
}

export async function controleerToken(token, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const aud = env.ACCESS_AUD || "";
  const toegelaten = (env.TOEGESTANE_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!team || !aud || !toegelaten.length) return { ok: false, reden: "niet-ingesteld" };
  if (!token) return { ok: false, reden: "geen-token" };

  const delen = token.split(".");
  if (delen.length !== 3) return { ok: false, reden: "ongeldig" };
  const [h, p, s] = delen;
  let kop, inhoud;
  try {
    kop = JSON.parse(new TextDecoder().decode(b64url(h)));
    inhoud = JSON.parse(new TextDecoder().decode(b64url(p)));
  } catch { return { ok: false, reden: "ongeldig" }; }
  if (kop.alg !== "RS256") return { ok: false, reden: "ongeldig" };

  const jwk = (await sleutels(team)).find((k) => k.kid === kop.kid);
  if (!jwk) return { ok: false, reden: "onbekende-sleutel" };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const geldig = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!geldig) return { ok: false, reden: "ongeldig" };

  const nu = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(inhoud.aud) ? inhoud.aud : [inhoud.aud];
  if (!auds.includes(aud)) return { ok: false, reden: "verkeerde-applicatie" };
  if (!inhoud.exp || inhoud.exp < nu) return { ok: false, reden: "verlopen" };
  if (inhoud.iss !== `https://${team}`) return { ok: false, reden: "ongeldig" };
  if (!toegelaten.includes(String(inhoud.email || "").toLowerCase())) return { ok: false, reden: "geen-toegang" };
  return { ok: true, email: inhoud.email };
}

function cookie(request, naam) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${naam}=([^;]+)`));
  return m ? m[1] : "";
}

const UITLEG = {
  "niet-ingesteld": "De afscherming is nog niet ingesteld. Zet ACCESS_TEAM_DOMAIN, ACCESS_AUD en TOEGESTANE_EMAIL in het Pages-project (zie paneel/README.md).",
  "geen-toegang": "Dit e-mailadres heeft geen toegang tot het ARTO-paneel.",
};

export async function onRequest(context) {
  const { request, env } = context;
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || cookie(request, "CF_Authorization");
  let uitslag;
  try { uitslag = await controleerToken(token, env); }
  catch { uitslag = { ok: false, reden: "fout" }; }

  if (!uitslag.ok) {
    const tekst = UITLEG[uitslag.reden] || "Je bent niet aangemeld. Open het paneel via het adres dat door Cloudflare Access beschermd is.";
    const html = `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>ARTO paneel</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#1d1d1f"><h1 style="font-size:1.4rem">Geen toegang</h1><p>${tekst}</p></body></html>`;
    return new Response(html, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  const res = await context.next();
  const kopie = new Response(res.body, res);
  kopie.headers.set("Cache-Control", "private, no-store");
  kopie.headers.set("X-Robots-Tag", "noindex, nofollow");
  return kopie;
}
