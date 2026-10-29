// Toegang tot /beheer en /api/beheer met gebruikersnaam en wachtwoord (HTTP Basic Auth).
// Instellen (beide als geheim, nooit in de code):
//   npx wrangler pages secret put BEHEER_GEBRUIKER --project-name=de-zonnebloem
//   npx wrangler pages secret put BEHEER_WACHTWOORD --project-name=de-zonnebloem
// Lokaal: zet BEHEER_GEBRUIKER=... en BEHEER_WACHTWOORD=... in .dev.vars (staat in .gitignore).
export async function vereisWachtwoord({ request, env, next }) {
  const gebruiker = env.BEHEER_GEBRUIKER, wachtwoord = env.BEHEER_WACHTWOORD;
  if (!gebruiker || !wachtwoord) return new Response("Beheer is nog niet ingesteld (BEHEER_GEBRUIKER of BEHEER_WACHTWOORD ontbreekt).", { status: 503 });

  const kop = request.headers.get("authorization") || "";
  let naam = "", gegeven = "";
  if (kop.startsWith("Basic ")) {
    try {
      const delen = atob(kop.slice(6)).split(":");
      naam = delen.shift();
      gegeven = delen.join(":");
    } catch { naam = gegeven = ""; }
  }
  // Beide controles altijd uitvoeren, zodat de tijd niet verraadt welk deel fout is.
  const naamOk = await gelijk(naam, gebruiker);
  const wwOk = await gelijk(gegeven, wachtwoord);
  if (!(naamOk && wwOk)) {
    if (kop) await new Promise((r) => setTimeout(r, 800)); // vertraagt raden
    return new Response("Inloggen vereist.", {
      status: 401,
      headers: { "www-authenticate": 'Basic realm="De Zonnebloem beheer", charset="UTF-8"', "cache-control": "no-store" },
    });
  }
  const antwoord = await next();
  const kopie = new Response(antwoord.body, antwoord);
  kopie.headers.set("cache-control", "no-store");
  kopie.headers.set("x-robots-tag", "noindex");
  // Zelfde strenge headers als de rest van de site, ook voor pagina's achter het wachtwoord.
  kopie.headers.set("content-security-policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
  kopie.headers.set("x-frame-options", "DENY");
  kopie.headers.set("x-content-type-options", "nosniff");
  kopie.headers.set("referrer-policy", "no-referrer");
  kopie.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
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
