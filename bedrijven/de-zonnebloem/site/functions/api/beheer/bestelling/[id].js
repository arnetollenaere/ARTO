// PATCH /api/beheer/bestelling/:id  { status?, notitie? }
import { json, fout, STATUSSEN, publiekeBestelling, euro } from "../../../../lib/winkel.js";
import { stuurMail } from "../../../../lib/mail.js";

export async function onRequestPatch({ params, request, env, waitUntil }) {
  const id = Number(params.id) || 0;
  let invoer;
  try { invoer = await request.json(); } catch { return fout("Ongeldige aanvraag."); }
  const rij = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  if (!rij) return fout("Bestelling niet gevonden.", 404);

  const nu = new Date().toISOString();
  if (invoer.status !== undefined) {
    if (!STATUSSEN.includes(invoer.status)) return fout("Onbekende status.");
    const betaaldOp = invoer.status === "nieuw" || invoer.status === "geannuleerd" ? null : rij.betaald_op || nu;
    const afgeleverdOp = invoer.status === "afgeleverd" ? rij.afgeleverd_op || nu : null;
    await env.DB.prepare("UPDATE bestellingen SET status = ?, betaald_op = ?, afgeleverd_op = ?, bijgewerkt = ? WHERE id = ?")
      .bind(invoer.status, betaaldOp, afgeleverdOp, nu, id).run();
    if (invoer.status === "betaald" && rij.status === "nieuw") {
      const b = publiekeBestelling(rij);
      waitUntil(stuurMail(env, {
        aan: rij.email,
        onderwerp: `Betaling ontvangen voor ${rij.nummer}`,
        tekst: `Dag ${rij.naam},\n\nWe hebben je betaling van ${euro(rij.totaal)} goed ontvangen. Dank je wel!\n\n${b.levering === "afhalen" ? `Je kan je wijn afhalen: ${b.afhaalmoment}, ${b.afhaalplaats}.` : `We leveren je wijn aan huis: ${b.adres}, ${b.postcode} ${b.gemeente}.`}\n\nvzw Raakpunt · De Zonnebloem\n`,
      }));
    }
  }
  if (typeof invoer.notitie === "string") {
    await env.DB.prepare("UPDATE bestellingen SET notitie_beheer = ?, bijgewerkt = ? WHERE id = ?").bind(invoer.notitie.slice(0, 1000), nu, id).run();
  }
  const nieuw = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  const { token, ip_hash, ...rest } = nieuw;
  return json({ ...rest, regels: JSON.parse(rest.regels) });
}
