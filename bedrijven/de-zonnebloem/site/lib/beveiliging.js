// Toegang tot /beheer en /api/beheer met een wachtwoord (HTTP Basic Auth).
// Wachtwoord instellen: npx wrangler pages secret put BEHEER_WACHTWOORD --project-name=de-zonnebloem
// Lokaal: zet BEHEER_WACHTWOORD=... in .dev.vars (staat in .gitignore).
export async function vereisWachtwoord({ request, env, next }) {
  const wachtwoord = env.BEHEER_WACHTWOORD;
  if (!wachtwoord) return new Response("Beheer is nog niet ingesteld (BEHEER_WACHTWOORD ontbreekt).", { status: 503 });

  const kop = request.headers.get("authorization") || "";
  let gegeven = "";
  if (kop.startsWith("Basic ")) {
    try { gegeven = atob(kop.slice(6)).split(":").slice(1).join(":"); } catch { gegeven = ""; }
  }
  if (!(await gelijk(gegeven, wachtwoord))) {
    return new Response("Wachtwoord vereist.", {
      status: 401,
      headers: { "www-authenticate": 'Basic realm="De Zonnebloem beheer", charset="UTF-8"', "cache-control": "no-store" },
    });
  }
  const antwoord = await next();
  const kopie = new Response(antwoord.body, antwoord);
  kopie.headers.set("cache-control", "no-store");
  kopie.headers.set("x-robots-tag", "noindex");
  return kopie;
}

// Vergelijkt in constante tijd via een hash.
async function gelijk(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let verschil = 0;
  for (let i = 0; i < x.length; i++) verschil |= x[i] ^ y[i];
  return verschil === 0;
}
