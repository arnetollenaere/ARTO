// GET /api/bestelling/:id?t=token: de klant bekijkt zijn bestelling.
import { json, fout, publiekeBestelling } from "../../../lib/winkel.js";

export async function onRequestGet({ params, request, env }) {
  const token = new URL(request.url).searchParams.get("t") || "";
  const rij = await env.DB.prepare("SELECT * FROM bestellingen WHERE id = ?").bind(Number(params.id) || 0).first();
  if (!rij || !token || rij.token !== token) return fout("Bestelling niet gevonden.", 404);
  return json(publiekeBestelling(rij));
}
