// PATCH /api/beheer/bestelling/:id  { status?, notitie? }
import { json, fout, STATUSSEN, publiekeBestelling } from "../../../../lib/winkel.js";
import { stuurMail, betaaldmail } from "../../../../lib/mail.js";
import { noteerMail, bestellingVoorBeheer } from "../../../../lib/mailboek.js";

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
    // Van "wacht op betaling" naar betaald (of verder): één keer de betaald-mail met afhaalpunt en -uur.
    if (rij.status === "nieuw" && ["betaald", "klaar", "afgeleverd"].includes(invoer.status) && !rij.mail_betaald) {
      waitUntil((async () => {
        const r = await stuurMail(env, { aan: rij.email, ...betaaldmail(publiekeBestelling(rij)) });
        await noteerMail(env, id, "mail_betaald", r);
      })());
    }
  }
  if (typeof invoer.notitie === "string") {
    await env.DB.prepare("UPDATE bestellingen SET notitie_beheer = ?, bijgewerkt = ? WHERE id = ?").bind(invoer.notitie.slice(0, 1000), nu, id).run();
  }
  const nieuw = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  return json(bestellingVoorBeheer(nieuw));
}
