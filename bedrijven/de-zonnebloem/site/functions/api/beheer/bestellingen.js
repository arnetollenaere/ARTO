// GET /api/beheer/bestellingen: alle bestellingen voor het beheer.
import { json } from "../../../lib/winkel.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM bestellingen ORDER BY id DESC").all();
  return json(results.map(({ token, ip_hash, ...r }) => ({ ...r, regels: JSON.parse(r.regels) })));
}
