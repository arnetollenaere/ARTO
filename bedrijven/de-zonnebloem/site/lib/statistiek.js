// Anonieme bezoekersstatistiek: geen cookies, geen IP-adressen bewaard.
// Een bezoeker is een hash van (geheim zout + dag + IP + browser), die elke dag verandert:
// zo tellen we unieke bezoekers per dag zonder iemand te kunnen volgen of herkennen.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha = async (t) => hex(await crypto.subtle.digest("SHA-256", enc.encode(t)));

export const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|fetch|curl|wget|python|monitor|scan|facebookexternalhit/i;

export function dagBrussel(d = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Brussels" }).format(d);
}

export async function maakTabel(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS bezoeken (dag TEXT NOT NULL, tijd TEXT NOT NULL, pad TEXT NOT NULL, bron TEXT NOT NULL, toestel TEXT NOT NULL, bezoeker TEXT NOT NULL)"
  ).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS bezoeken_dag ON bezoeken (dag)").run();
}

export async function bezoekerHash(request, env, dag) {
  const zout = await sha("zb-stat|" + (env.BEHEER_WACHTWOORD || ""));
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ua = request.headers.get("user-agent") || "";
  return (await sha(zout + "|" + dag + "|" + ip + "|" + ua)).slice(0, 20);
}

export function toestel(ua) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "gsm";
  return "computer";
}

// Herkomst: zoekmachine, sociale media, chat, andere site of rechtstreeks.
export function bron(verwijzer, utm, eigenHost) {
  const s = String(utm || "").toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 40);
  if (s) return s;
  let host = "";
  try { host = new URL(verwijzer).hostname.replace(/^www\./, "").toLowerCase(); } catch { return "rechtstreeks"; }
  if (!host || host === eigenHost.replace(/^www\./, "")) return "rechtstreeks";
  if (/google\./.test(host)) return "google";
  if (/bing\.|duckduckgo|ecosia|yahoo/.test(host)) return "andere zoekmachine";
  if (/facebook|fb\.|messenger/.test(host)) return "facebook";
  if (/instagram/.test(host)) return "instagram";
  if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
  if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(host)) return "AI-assistent";
  return host.slice(0, 60);
}
