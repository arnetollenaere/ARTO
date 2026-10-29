// POST /api/inloggen { gebruiker, wachtwoord }: zet een sessiecookie bij juiste gegevens.
import { controleerGegevens, maakSessieCookie, teVeelFouten, noteerFout } from "../../lib/beveiliging.js";

const antwoord = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

export async function onRequestPost({ request, env }) {
  if (!env.BEHEER_GEBRUIKER || !env.BEHEER_WACHTWOORD) return antwoord({ fout: "Beheer is nog niet ingesteld." }, 503);
  const herkomst = request.headers.get("origin");
  if (herkomst && herkomst !== new URL(request.url).origin) return antwoord({ fout: "Niet toegestaan." }, 403);
  if (await teVeelFouten(request, env)) return antwoord({ fout: "Te veel foute pogingen. Probeer het over een kwartier opnieuw." }, 429, { "retry-after": "900" });

  let invoer;
  try { invoer = await request.json(); } catch { return antwoord({ fout: "Ongeldige aanvraag." }, 400); }
  const naam = String(invoer.gebruiker || "").trim().slice(0, 100);
  const ww = String(invoer.wachtwoord || "").slice(0, 200);

  if (!(await controleerGegevens(env, naam, ww))) {
    await noteerFout(request, env);
    await new Promise((r) => setTimeout(r, 800)); // vertraagt raden
    return antwoord({ fout: "Gebruikersnaam of wachtwoord klopt niet." }, 401);
  }
  return antwoord({ ok: true }, 200, { "set-cookie": await maakSessieCookie(env) });
}
