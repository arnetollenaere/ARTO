// POST /api/beheer/bestelling/:id/herinnering: stuurt een betaalherinnering naar de klant.
// Alleen voor bestellingen die nog op betaling wachten; niet twee keer binnen 10 minuten.
import { json, fout, publiekeBestelling } from "../../../../../lib/winkel.js";
import { stuurMail, herinneringsmail, mailIngesteld } from "../../../../../lib/mail.js";
import { bestellingVoorBeheer } from "../../../../../lib/mailboek.js";

export async function onRequestPost({ params, request, env }) {
  const id = Number(params.id) || 0;
  const rij = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  if (!rij) return fout("Bestelling niet gevonden.", 404);
  if (rij.status !== "nieuw") return fout("Deze bestelling wacht niet (meer) op betaling.");
  if (!mailIngesteld(env)) return fout("E-mail is nog niet ingesteld (GMAIL_APP_WACHTWOORD ontbreekt).", 503);
  if (rij.herinnerd_op && Date.now() - Date.parse(rij.herinnerd_op) < 10 * 60e3) return fout("Er is net al een herinnering verstuurd.", 429);

  const link = `${new URL(request.url).origin}/bestelling/?id=${id}&t=${rij.token}`;
  const r = await stuurMail(env, { aan: rij.email, ...herinneringsmail(publiekeBestelling(rij), link) });
  if (!r.ok) {
    await env.DB.prepare("UPDATE bestellingen SET mail_fout = ? WHERE id = ?").bind(r.fout, id).run();
    return fout("Versturen mislukt: " + r.fout, 502);
  }
  await env.DB.prepare("UPDATE bestellingen SET herinnerd_op = ?, herinneringen = herinneringen + 1, mail_fout = NULL WHERE id = ?").bind(new Date().toISOString(), id).run();
  const nieuw = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(id).first();
  return json(bestellingVoorBeheer(nieuw));
}
