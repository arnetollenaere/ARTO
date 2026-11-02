// GET /api/beheer/bestellingen: alle bestellingen voor het beheer.
import { json } from "../../../lib/winkel.js";
import { bestellingVoorBeheer } from "../../../lib/mailboek.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM bestellingen ORDER BY id DESC").all();
  return json(results.map(bestellingVoorBeheer));
}
