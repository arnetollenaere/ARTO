// GET /api/beheer/controle: status van de betaalgegevens voor het beheerscherm.
import { json, instellingen, controleerBetaalgegevens, bestelStand } from "../../../lib/winkel.js";
import { mailIngesteld } from "../../../lib/mail.js";

export async function onRequestGet({ env }) {
  const c = await controleerBetaalgegevens(env);
  return json({ ...c, iban: instellingen.betaling.iban, begunstigde: instellingen.betaling.begunstigde, mail: { ingesteld: mailIngesteld(env), van: env.MAIL_GEBRUIKER || "" }, bestellen: await bestelStand(env) });
}
