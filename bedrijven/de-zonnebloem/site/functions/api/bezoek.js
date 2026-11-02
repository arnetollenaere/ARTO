// POST /api/bezoek: telt een paginaweergave, anoniem (zie lib/statistiek.js).
// Telt niet: bots, het beheer zelf (wie ingelogd is) en overdreven veel weergaven per bezoeker.
import { BOT, dagBrussel, maakTabel, bezoekerHash, toestel, bron } from "../../lib/statistiek.js";
import { geldigeSessie } from "../../lib/beveiliging.js";

const leeg = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function onRequestPost({ request, env }) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (!env.DB || BOT.test(ua)) return leeg();
    const herkomst = request.headers.get("origin");
    const url = new URL(request.url);
    if (herkomst && herkomst !== url.origin) return leeg();
    if (await geldigeSessie(request, env)) return leeg();

    let d = {};
    try { d = JSON.parse((await request.text()).slice(0, 2000)); } catch { return leeg(); }
    const pad = ["/", "/bestelling/"].includes(d.pad) ? d.pad : "/";
    const dag = dagBrussel();
    const wie = await bezoekerHash(request, env, dag);

    await maakTabel(env);
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM bezoeken WHERE dag = ? AND bezoeker = ?").bind(dag, wie).first();
    if (r && r.n >= 200) return leeg();
    await env.DB.prepare("INSERT INTO bezoeken (dag, tijd, pad, bron, toestel, bezoeker) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(dag, new Date().toISOString(), pad, bron(d.verwijzer, d.utm, url.hostname), toestel(ua), wie).run();
    // Af en toe opruimen: ouder dan 400 dagen.
    if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM bezoeken WHERE dag < ?").bind(dagBrussel(new Date(Date.now() - 400 * 864e5))).run();
  } catch { /* statistiek mag de site nooit hinderen */ }
  return leeg();
}
