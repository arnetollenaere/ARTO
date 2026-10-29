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
  // Slot: na 10 foute pogingen binnen 15 minuten wordt dit toestel een kwartier geweigerd.
  const ipHash = await hashTekst((request.headers.get("cf-connecting-ip") || "onbekend") + "|beheer");
  const sinds = new Date(Date.now() - 15 * 60e3).toISOString();
  let fouten = 0;
  if (env.DB) {
    try {
      const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM inlogpogingen WHERE ip_hash = ? AND tijd > ?").bind(ipHash, sinds).first();
      fouten = r ? r.n : 0;
    } catch { fouten = 0; } // tabel bestaat nog niet: nog geen foute pogingen
  }
  if (fouten >= 10) {
    return new Response("Te veel foute pogingen. Probeer het over een kwartier opnieuw.", { status: 429, headers: { "retry-after": "900", "cache-control": "no-store" } });
  }

  // Beide controles altijd uitvoeren, zodat de tijd niet verraadt welk deel fout is.
  const naamOk = await gelijk(naam, gebruiker);
  const wwOk = await gelijk(gegeven, wachtwoord);
  if (!(naamOk && wwOk)) {
    if (kop && env.DB) {
      try {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS inlogpogingen (ip_hash TEXT NOT NULL, tijd TEXT NOT NULL)").run();
        await env.DB.prepare("INSERT INTO inlogpogingen (ip_hash, tijd) VALUES (?, ?)").bind(ipHash, new Date().toISOString()).run();
        await env.DB.prepare("DELETE FROM inlogpogingen WHERE tijd < ?").bind(new Date(Date.now() - 86400e3).toISOString()).run();
      } catch { /* slot is extra; inloggen blijft werken */ }
    }
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

async function hashTekst(tekst) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
