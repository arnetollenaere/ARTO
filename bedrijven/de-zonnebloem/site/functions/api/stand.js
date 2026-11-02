// GET /api/stand: teller op de homepage. Telt alleen betaalde bestellingen
// (status betaald, klaar of afgeleverd), niet wat nog op betaling wacht of geannuleerd is.
import { json, instellingen, bestelStand } from "../../lib/winkel.js";

export async function onRequestGet({ env }) {
  const r = await env.DB.prepare("SELECT COALESCE(SUM(flessen),0) AS flessen, COUNT(*) AS bestellingen FROM bestellingen WHERE status IN ('betaald', 'klaar', 'afgeleverd')").first();
  const { stand } = await bestelStand(env);
  return json({ flessen: r.flessen, bestellingen: r.bestellingen, doel: instellingen.doelFlessen, bestellen: stand }, 200, { "cache-control": "public, max-age=30" });
}
