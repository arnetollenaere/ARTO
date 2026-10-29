// GET /api/stand: teller op de homepage (flessen besteld, doel).
import { json, instellingen } from "../../lib/winkel.js";

export async function onRequestGet({ env }) {
  const r = await env.DB.prepare("SELECT COALESCE(SUM(flessen),0) AS flessen, COUNT(*) AS bestellingen FROM bestellingen WHERE status != 'geannuleerd'").first();
  return json({ flessen: r.flessen, bestellingen: r.bestellingen, doel: instellingen.doelFlessen }, 200, { "cache-control": "public, max-age=60" });
}
