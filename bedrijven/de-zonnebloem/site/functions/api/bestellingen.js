// POST /api/bestellingen: nieuwe bestelling plaatsen.
import { json, fout, euro, controleerBetaalgegevens, controleerBestelling, besteldPerWijn, maakOgm, bestelnummer, willekeurigToken, publiekeBestelling } from "../../lib/winkel.js";
import { stuurMail, bevestigingsmail } from "../../lib/mail.js";

export async function onRequestPost({ request, env, waitUntil }) {
  let invoer;
  try { invoer = await request.json(); } catch { return fout("Ongeldige bestelling."); }
  if (invoer && invoer.website) return fout("Ongeldige bestelling."); // honeypot tegen spam

  // Weiger bestellingen als het IBAN in de code niet overeenkomt met de vingerafdruk.
  const betaal = await controleerBetaalgegevens(env);
  if (!betaal.veilig) {
    console.error("IBAN komt niet overeen met IBAN_SHA256: bestellingen geweigerd");
    return fout("Bestellen is tijdelijk niet mogelijk. Probeer later opnieuw.", 503);
  }

  // Spambeperking: maximaal 5 bestellingen per bezoeker per uur. Enkel een hash van IP + dag.
  const ip = request.headers.get("cf-connecting-ip") || "onbekend";
  const ipHash = await hash(ip + "|" + new Date().toISOString().slice(0, 10) + "|zonnebloem");
  const uurGeleden = new Date(Date.now() - 3600e3).toISOString();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM bestellingen WHERE ip_hash = ? AND aangemaakt > ?").bind(ipHash, uurGeleden).first();
  if (recent && recent.n >= 5) return fout("Je plaatste net al enkele bestellingen. Probeer later opnieuw of neem contact met ons op.", 429);

  const { fout: probleem, bestelling: b } = controleerBestelling(invoer, await besteldPerWijn(env.DB));
  if (probleem) return fout(probleem);

  const nu = new Date().toISOString();
  const token = willekeurigToken();
  const ins = await env.DB.prepare(
    `INSERT INTO bestellingen (ip_hash, token, aangemaakt, bijgewerkt, naam, email, telefoon, levering, afhaalmoment, adres, postcode, gemeente, opmerking, regels, flessen, subtotaal, leveringskost, totaal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(ipHash, token, nu, nu, b.naam, b.email, b.telefoon, b.levering, b.afhaalmoment, b.adres, b.postcode, b.gemeente, b.opmerking,
    JSON.stringify(b.regels), b.flessen, b.subtotaal, b.leveringskost, b.totaal).run();

  const id = ins.meta.last_row_id;
  const jaar = new Date().getFullYear();
  await env.DB.prepare("UPDATE bestellingen SET nummer = ?, ogm = ? WHERE id = ?").bind(bestelnummer(id, jaar), maakOgm(id, jaar), id).run();
  const rij = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  const publiek = publiekeBestelling(rij);

  const link = `${new URL(request.url).origin}/bestelling/?id=${id}&t=${token}`;
  waitUntil(Promise.all([
    stuurMail(env, { aan: b.email, onderwerp: `Je wijnbestelling ${publiek.nummer} bij De Zonnebloem`, tekst: bevestigingsmail(publiek, link) }),
    stuurMail(env, { aan: env.MAIL_BEHEER, onderwerp: `Nieuwe bestelling ${publiek.nummer}: ${b.flessen} flessen, ${euro(b.totaal)}`, tekst: `${b.naam} (${b.email}, ${b.telefoon})\n\n${b.regels.map((r) => `${r.aantal} × ${r.naam}`).join("\n")}\n\nTotaal ${euro(b.totaal)}, mededeling ${publiek.ogm}` }),
  ]));

  return json({ id, token, bestelling: publiek }, 201);
}

async function hash(tekst) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
