// POST /api/beheer/testmail: stuurt een testmail naar het afzendadres zelf, om de instelling te controleren.
import { json, fout } from "../../../lib/winkel.js";
import { stuurMail } from "../../../lib/mail.js";

export async function onRequestPost({ env }) {
  const r = await stuurMail(env, {
    aan: env.MAIL_GEBRUIKER,
    onderwerp: "Testmail van zonnebloemwijn.be",
    tekst: "Deze testmail komt van het beheer van zonnebloemwijn.be. Krijg je hem, dan werken de e-mails naar klanten.",
  });
  return r.ok ? json({ ok: true, aan: env.MAIL_GEBRUIKER }) : fout(r.fout, 502);
}
