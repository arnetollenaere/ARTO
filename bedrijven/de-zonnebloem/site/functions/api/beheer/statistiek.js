// GET /api/beheer/statistiek?dagen=30: bezoekers per dag, bronnen, toestellen en bestellingen.
import { json } from "../../../lib/winkel.js";
import { dagBrussel, maakTabel } from "../../../lib/statistiek.js";

export async function onRequestGet({ request, env }) {
  const dagen = Math.min(365, Math.max(7, Number(new URL(request.url).searchParams.get("dagen")) || 30));
  await maakTabel(env);
  const vandaag = dagBrussel();
  const reeks = [];
  for (let i = dagen - 1; i >= 0; i--) reeks.push(dagBrussel(new Date(Date.now() - i * 864e5)));
  const vanaf = reeks[0];
  const db = env.DB;

  const [perDag, bronnen, toestellen, nu, best] = await Promise.all([
    db.prepare("SELECT dag, COUNT(DISTINCT bezoeker) AS bezoekers, COUNT(*) AS weergaven FROM bezoeken WHERE dag >= ? GROUP BY dag").bind(vanaf).all(),
    db.prepare("SELECT bron, COUNT(DISTINCT dag || bezoeker) AS bezoeken FROM bezoeken WHERE dag >= ? GROUP BY bron ORDER BY bezoeken DESC LIMIT 8").bind(vanaf).all(),
    db.prepare("SELECT toestel, COUNT(DISTINCT dag || bezoeker) AS bezoeken FROM bezoeken WHERE dag >= ? GROUP BY toestel ORDER BY bezoeken DESC").bind(vanaf).all(),
    db.prepare("SELECT COUNT(DISTINCT bezoeker) AS n FROM bezoeken WHERE tijd >= ?").bind(new Date(Date.now() - 30 * 60e3).toISOString()).first(),
    db.prepare("SELECT substr(aangemaakt, 1, 10) AS dag, COUNT(*) AS n, COALESCE(SUM(flessen), 0) AS flessen FROM bestellingen WHERE status != 'geannuleerd' AND aangemaakt >= ? GROUP BY dag").bind(vanaf).all(),
  ]);

  const kaart = Object.fromEntries((perDag.results || []).map((r) => [r.dag, r]));
  const bkaart = Object.fromEntries((best.results || []).map((r) => [r.dag, r]));
  const rijen = reeks.map((dag) => ({
    dag,
    bezoekers: kaart[dag] ? kaart[dag].bezoekers : 0,
    weergaven: kaart[dag] ? kaart[dag].weergaven : 0,
    bestellingen: bkaart[dag] ? bkaart[dag].n : 0,
  }));
  const som = (k) => rijen.reduce((s, r) => s + r[k], 0);
  return json({
    dagen,
    vandaag: (kaart[vandaag] || { bezoekers: 0 }).bezoekers,
    nu: nu ? nu.n : 0,
    bezoeken: som("bezoekers"),
    weergaven: som("weergaven"),
    bestellingen: som("bestellingen"),
    perDag: rijen,
    bronnen: bronnen.results || [],
    toestellen: toestellen.results || [],
  }, 200, { "cache-control": "no-store" });
}
