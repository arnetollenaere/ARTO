// E-mails via Gmail (vzwzonnebloem@gmail.com) met nodemailer.
// Nodig: variabele MAIL_GEBRUIKER (wrangler.toml) en geheim GMAIL_APP_WACHTWOORD (een Google-app-wachtwoord,
// nooit in de code). Zonder wachtwoord wordt er niets verstuurd en werkt de site gewoon verder.
import nodemailer from "nodemailer";
import { euro } from "./winkel.js";

export function mailIngesteld(env) {
  return Boolean(env.MAIL_GEBRUIKER && env.GMAIL_APP_WACHTWOORD);
}

let vervoer = null;
function transport(env) {
  if (!vervoer) {
    vervoer = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.MAIL_GEBRUIKER, pass: String(env.GMAIL_APP_WACHTWOORD).replace(/\s+/g, "") },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return vervoer;
}

// Geeft { ok: true } of { ok: false, fout: "..." }. Gooit nooit een fout.
export async function stuurMail(env, { aan, onderwerp, tekst, html }) {
  if (!aan) return { ok: false, fout: "Geen ontvanger." };
  if (!mailIngesteld(env)) return { ok: false, fout: "E-mail is nog niet ingesteld (GMAIL_APP_WACHTWOORD ontbreekt)." };
  try {
    await transport(env).sendMail({
      from: { name: env.MAIL_NAAM || "De Zonnebloem", address: env.MAIL_GEBRUIKER },
      to: aan,
      subject: onderwerp,
      text: tekst,
      html,
    });
    return { ok: true };
  } catch (e) {
    vervoer = null; // bij een volgende poging opnieuw verbinden
    return { ok: false, fout: String((e && (e.response || e.message)) || e).slice(0, 300) };
  }
}

// ---------- Inhoud ----------
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const BLAUW = "#2832b9", ORANJE = "#ff4619", ZACHT = "#eceefb";

function regelsTekst(b) {
  return b.regels.map((r) => `  ${r.aantal} × ${r.naam} (${euro(r.prijs)})  ${euro(r.prijs * r.aantal)}`).join("\n") +
    (b.leveringskost ? `\n  Levering  ${euro(b.leveringskost)}` : "") + `\n  Totaal  ${euro(b.totaal)}`;
}
function regelsHtml(b) {
  const rij = (l, r, vet) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${ZACHT};${vet ? "font-weight:bold;" : ""}">${l}</td><td style="padding:8px 0;border-bottom:1px solid ${ZACHT};text-align:right;white-space:nowrap;${vet ? "font-weight:bold;" : ""}">${r}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;">` +
    b.regels.map((r) => rij(`${r.aantal} × ${esc(r.naam)}<br><span style="color:#5a62c4;font-size:13px;">${euro(r.prijs)} per fles</span>`, euro(r.prijs * r.aantal))).join("") +
    (b.leveringskost ? rij("Levering", euro(b.leveringskost)) : "") + rij("Totaal", euro(b.totaal), true) + `</table>`;
}
function afhalenTekst(b) {
  return b.levering === "afhalen"
    ? `Afhaalpunt: ${b.afhaalplaats}\nAfhaalmoment: ${b.afhaalmoment}`
    : `Levering aan huis: ${b.adres}, ${b.postcode} ${b.gemeente}`;
}
function afhalenHtml(b) {
  return b.levering === "afhalen"
    ? `<p style="margin:0 0 4px;"><strong>Afhaalpunt:</strong> ${esc(b.afhaalplaats)}</p><p style="margin:0;"><strong>Afhaalmoment:</strong> ${esc(b.afhaalmoment)}</p>`
    : `<p style="margin:0;"><strong>Levering aan huis:</strong> ${esc(b.adres)}, ${esc(b.postcode)} ${esc(b.gemeente)}</p>`;
}
function betaalTekst(b) {
  return `  Bedrag:       ${euro(b.totaal)}\n  Rekening:     ${b.betaling.iban}${b.betaling.bic ? ` (BIC ${b.betaling.bic})` : ""}\n  Begunstigde:  ${b.betaling.begunstigde}\n  Mededeling:   ${b.ogm}`;
}
function betaalHtml(b) {
  const r = (l, w, extra = "") => `<tr><td style="padding:6px 12px 6px 0;color:#5a62c4;white-space:nowrap;">${l}</td><td style="padding:6px 0;font-weight:bold;${extra}">${w}</td></tr>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">` +
    r("Bedrag", euro(b.totaal)) + r("Rekening", esc(b.betaling.iban), "font-family:monospace;font-size:16px;") +
    r("Begunstigde", esc(b.betaling.begunstigde)) + r("Mededeling", esc(b.ogm), `font-family:monospace;font-size:16px;color:${ORANJE};`) + `</table>`;
}
function knop(link, label) {
  return `<p style="margin:20px 0 0;"><a href="${esc(link)}" style="display:inline-block;background:${ORANJE};color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;text-transform:uppercase;letter-spacing:.03em;">${label}</a></p>`;
}
function vak(titel, inhoud) {
  return `<div style="margin:24px 0 0;padding:18px 20px;border:2px solid ${BLAUW};"><h2 style="margin:0 0 12px;font-size:18px;text-transform:uppercase;letter-spacing:.03em;color:${BLAUW};">${titel}</h2>${inhoud}</div>`;
}
function omhulsel(kop, inleiding, inhoud) {
  return `<!doctype html><html lang="nl"><body style="margin:0;padding:0;background:${ZACHT};">
<div style="max-width:600px;margin:0 auto;background:#fff;font-family:Arial,Helvetica,sans-serif;color:${BLAUW};">
  <div style="background:${BLAUW};color:#fff;padding:20px 24px;"><div style="font-size:22px;font-weight:bold;text-transform:uppercase;letter-spacing:.02em;">De Zonnebloem</div><div style="font-size:14px;opacity:.85;">Wijnactie ten voordele van De Zonnebloem · vzw Raakpunt</div></div>
  <div style="padding:24px;">
    <h1 style="margin:0 0 12px;font-size:24px;text-transform:uppercase;color:${BLAUW};">${kop}</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${inleiding}</p>
    ${inhoud}
    <p style="margin:28px 0 0;font-size:14px;line-height:1.5;">Vragen? Antwoord gewoon op deze e-mail.<br>Hartelijk dank voor je steun!<br><strong>vzw Raakpunt · De Zonnebloem</strong></p>
  </div>
  <div style="background:${ORANJE};color:#fff;padding:14px 24px;font-size:12px;line-height:1.5;">vzw Raakpunt · Ond.nr. BE 0452.918.932 · <a href="https://zonnebloemwijn.be/" style="color:#fff;">zonnebloemwijn.be</a><br>Alcoholmisbruik schaadt de gezondheid. Geen verkoop aan min-18-jarigen.</div>
</div></body></html>`;
}
const slot = `\nVragen? Antwoord gewoon op deze e-mail.\nHartelijk dank voor je steun!\nvzw Raakpunt · De Zonnebloem\n\nAlcoholmisbruik schaadt de gezondheid. Geen verkoop aan min-18-jarigen.\n`;

// 1. Na het bestellen.
export function bevestigingsmail(b, link) {
  const termijn = b.betaling.termijnDagen;
  return {
    onderwerp: `Je wijnbestelling ${b.nummer} bij De Zonnebloem`,
    tekst: `Dag ${b.naam},\n\nBedankt voor je bestelling ${b.nummer}. Met jouw aankoop steun je De Zonnebloem.\n\nJe bestelling:\n${regelsTekst(b)}\n\n${afhalenTekst(b)}\n\nNog niet betaald?\nSchrijf het bedrag over${termijn ? ` binnen ${termijn} dagen` : ""} met deze gegevens:\n${betaalTekst(b)}\n\nGebruik zeker de gestructureerde mededeling, zo vinden we je betaling meteen terug.\nJe bestelling en een QR-code om te betalen vind je hier: ${link}\nAl betaald? Dan hoef je niets meer te doen.\n\nZodra je betaling binnen is, krijg je een bevestiging.\n${slot}`,
    html: omhulsel(`Bedankt, ${esc(b.naam)}!`,
      `We hebben je bestelling <strong>${esc(b.nummer)}</strong> goed ontvangen. Met jouw aankoop steun je De Zonnebloem.`,
      vak("Je bestelling", regelsHtml(b)) +
      vak("Nog niet betaald?", `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Schrijf het bedrag over${termijn ? ` binnen ${termijn} dagen` : ""} met deze gegevens:</p>` + betaalHtml(b) + `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;">Gebruik zeker de gestructureerde mededeling, zo vinden we je betaling meteen terug. Met de QR-code betaal je in een paar tikken in je bank-app. Al betaald? Dan hoef je niets meer te doen.</p>` + knop(link, "Bekijk je bestelling en QR-code")) +
      vak("Afhalen", afhalenHtml(b) + `<p style="margin:12px 0 0;font-size:14px;">Zodra je betaling binnen is, krijg je een bevestiging.</p>`)),
  };
}

// 2. Wanneer de bestelling op betaald komt.
export function betaaldmail(b) {
  return {
    onderwerp: `Betaling ontvangen: je wijn ${b.nummer} ligt voor je klaar`,
    tekst: `Dag ${b.naam},\n\nWe hebben je betaling van ${euro(b.totaal)} voor bestelling ${b.nummer} goed ontvangen. Dank je wel!\n\nJe bestelling:\n${regelsTekst(b)}\n\n${afhalenTekst(b)}\n\nVermeld bij het afhalen je naam of bestelnummer ${b.nummer}.\n${slot}`,
    html: omhulsel("Betaling ontvangen",
      `Dag ${esc(b.naam)}, we hebben je betaling van <strong>${euro(b.totaal)}</strong> voor bestelling <strong>${esc(b.nummer)}</strong> goed ontvangen. Dank je wel!`,
      vak("Afhalen", afhalenHtml(b) + `<p style="margin:12px 0 0;font-size:14px;">Vermeld bij het afhalen je naam of bestelnummer <strong>${esc(b.nummer)}</strong>.</p>`) +
      vak("Je bestelling", regelsHtml(b))),
  };
}

// 3. Betaalherinnering (knop in het beheer).
export function herinneringsmail(b, link) {
  return {
    onderwerp: `Herinnering: betaling voor je wijnbestelling ${b.nummer}`,
    tekst: `Dag ${b.naam},\n\nBedankt nog voor je bestelling ${b.nummer} bij De Zonnebloem. We hebben je betaling nog niet ontvangen.\n\nWil je het bedrag overschrijven met deze gegevens?\n${betaalTekst(b)}\n\nJe bestelling en een QR-code om te betalen vind je hier: ${link}\n\nHeb je intussen al betaald? Dan mag je deze e-mail negeren; een overschrijving kan enkele dagen onderweg zijn.\nWil je de bestelling toch niet meer? Laat het ons weten door op deze e-mail te antwoorden.\n\nJe bestelling:\n${regelsTekst(b)}\n\n${afhalenTekst(b)}\n${slot}`,
    html: omhulsel("Even een herinnering",
      `Dag ${esc(b.naam)}, bedankt nog voor je bestelling <strong>${esc(b.nummer)}</strong>. We hebben je betaling nog niet ontvangen.`,
      vak("Betalen", betaalHtml(b) + knop(link, "Bekijk je bestelling en QR-code") + `<p style="margin:14px 0 0;font-size:14px;line-height:1.5;">Heb je intussen al betaald? Dan mag je deze e-mail negeren; een overschrijving kan enkele dagen onderweg zijn. Wil je de bestelling toch niet meer? Antwoord dan op deze e-mail.</p>`) +
      vak("Je bestelling", regelsHtml(b)) + vak("Afhalen", afhalenHtml(b))),
  };
}
