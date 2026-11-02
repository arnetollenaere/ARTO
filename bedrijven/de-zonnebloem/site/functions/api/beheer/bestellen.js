// POST /api/beheer/bestellen { open: true|false }: bestellingen stopzetten of weer openen.
import { json, fout, bestelStand, zetBestellenGestopt } from "../../../lib/winkel.js";

export async function onRequestPost({ request, env }) {
  let invoer;
  try { invoer = await request.json(); } catch { return fout("Ongeldige aanvraag."); }
  if (typeof invoer.open !== "boolean") return fout("Ongeldige aanvraag.");
  if (!(await bestelStand(env)).schakelbaar) return fout("De bestelstand wordt in de instellingen van de site bepaald (niet \"open\"). Vraag het aan ARTO.", 409);
  await zetBestellenGestopt(env, !invoer.open);
  return json(await bestelStand(env));
}
