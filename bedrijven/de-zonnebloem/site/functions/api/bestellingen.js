// POST /api/bestellingen: nieuwe bestelling plaatsen.
import { json, fout, euro, controleerBestelling, besteldPerWijn, maakOgm, bestelnummer, willekeurigToken, publiekeBestelling } from "../../lib/winkel.js";
import { stuurMail, bevestigingsmail } from "../../lib/mail.js";

export async function onRequestPost({ request, env, waitUntil }) {
  let invoer;
  try { invoer = await request.json(); } catch { return fout("Ongeldige bestelling."); }
  if (invoer && invoer.website) return fout("Ongeldige bestelling."); // honeypot tegen spam

  const { fout: probleem, bestelling: b } = controleerBestelling(invoer, await besteldPerWijn(env.DB));
  if (probleem) return fout(probleem);

  const nu = new Date().toISOString();
  const token = willekeurigToken();
  const ins = await env.DB.prepare(
    `INSERT INTO bestellingen (token, aangemaakt, bijgewerkt, naam, email, telefoon, levering, afhaalmoment, adres, postcode, gemeente, opmerking, regels, flessen, subtotaal, leveringskost, totaal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(token, nu, nu, b.naam, b.email, b.telefoon, b.levering, b.afhaalmoment, b.adres, b.postcode, b.gemeente, b.opmerking,
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
