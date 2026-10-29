// Optionele e-mails via Resend (https://resend.com). Zonder RESEND_API_KEY wordt er niets verstuurd.
// Instellen: npx wrangler pages secret put RESEND_API_KEY, en de variabelen MAIL_VAN en MAIL_BEHEER.
import { euro } from "./winkel.js";

export async function stuurMail(env, { aan, onderwerp, tekst }) {
  if (!env.RESEND_API_KEY || !env.MAIL_VAN || !aan) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_VAN, to: [aan], subject: onderwerp, text: tekst }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function bevestigingsmail(b, link) {
  const regels = b.regels.map((r) => `  ${r.aantal} × ${r.naam} (${euro(r.prijs)})`).join("\n");
  const levering = b.levering === "afhalen"
    ? `Afhalen: ${b.afhaalmoment}, ${b.afhaalplaats}`
    : `Levering aan huis: ${b.adres}, ${b.postcode} ${b.gemeente}`;
  return `Dag ${b.naam},

Bedankt voor je bestelling ${b.nummer}. Met jouw aankoop steun je De Zonnebloem.

${regels}
${b.leveringskost ? `  Levering: ${euro(b.leveringskost)}\n` : ""}  Totaal: ${euro(b.totaal)}

${levering}

Betalen via overschrijving binnen ${b.betaling.termijnDagen} dagen:
  Bedrag:       ${euro(b.totaal)}
  Rekening:     ${b.betaling.iban}${b.betaling.bic ? ` (BIC ${b.betaling.bic})` : ""}
  Begunstigde:  ${b.betaling.begunstigde}
  Mededeling:   ${b.ogm}

Gebruik zeker de gestructureerde mededeling, zo vinden we je betaling meteen terug.
Je bestelling en een QR-code om te betalen vind je hier: ${link}

Hartelijk dank!
De Zonnebloem
`;
}
