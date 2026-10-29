// GET /api/beheer/controle: status van de betaalgegevens voor het beheerscherm.
import { json, instellingen, controleerBetaalgegevens } from "../../../lib/winkel.js";

export async function onRequestGet({ env }) {
  const c = await controleerBetaalgegevens(env);
  return json({ ...c, iban: instellingen.betaling.iban, begunstigde: instellingen.betaling.begunstigde });
}
