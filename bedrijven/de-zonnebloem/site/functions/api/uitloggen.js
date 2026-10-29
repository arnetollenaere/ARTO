// POST /api/uitloggen: wist het sessiecookie.
import { wisSessieCookie } from "../../lib/beveiliging.js";
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "set-cookie": wisSessieCookie() } });
}
