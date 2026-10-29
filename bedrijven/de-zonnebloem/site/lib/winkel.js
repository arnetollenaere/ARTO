// Gedeelde logica voor de Pages Functions: validatie, prijzen, mededeling, antwoorden.
// Prijzen komen altijd uit src/wijnen.json, nooit uit wat de browser stuurt.
import catalogus from "../src/wijnen.json";
import instellingen from "../src/instellingen.json";

export { instellingen };
export const wijnen = catalogus.wijnen;
export const STATUSSEN = ["nieuw", "betaald", "klaar", "afgeleverd", "geannuleerd"];

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

export const fout = (bericht, status = 400) => json({ fout: bericht }, status);

// Belgische gestructureerde mededeling: 10 cijfers + controlegetal (mod 97, 0 wordt 97).
export function maakOgm(id, jaar = new Date().getFullYear()) {
  const basis = String(jaar % 100).padStart(2, "0") + String(id).padStart(8, "0");
  const controle = Number(BigInt(basis) % 97n) || 97;
  const c = basis + String(controle).padStart(2, "0");
  return `+++${c.slice(0, 3)}/${c.slice(3, 7)}/${c.slice(7)}+++`;
}

export function bestelnummer(id, jaar = new Date().getFullYear()) {
  return `ZB-${jaar}-${String(id).padStart(4, "0")}`;
}

export function willekeurigToken() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const tekst = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Controleert de bestelling en rekent het totaal uit. Geeft { fout } of { bestelling }.
export function controleerBestelling(invoer, besteldPerWijn = {}) {
  if (!instellingen.bestellingenOpen) return { fout: "De bestellingen zijn afgesloten." };
  if (!invoer || typeof invoer !== "object") return { fout: "Ongeldige bestelling." };

  const naam = tekst(invoer.naam, 120);
  const email = tekst(invoer.email, 160).toLowerCase();
  const telefoon = tekst(invoer.telefoon, 40);
  const opmerking = tekst(invoer.opmerking, 1000);
  if (naam.length < 2) return { fout: "Vul je naam in." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { fout: "Vul een geldig e-mailadres in." };
  if (telefoon.replace(/\D/g, "").length < 8) return { fout: "Vul een geldig telefoonnummer in." };
  if (invoer.leeftijd !== true) return { fout: "Je moet minstens 18 jaar zijn om wijn te bestellen." };

  const regels = [];
  let flessen = 0;
  for (const [id, aantalRuw] of Object.entries(invoer.mandje || {})) {
    const wijn = wijnen.find((w) => w.id === id);
    const aantal = Number(aantalRuw);
    if (!wijn) return { fout: "Een van de wijnen bestaat niet meer. Vernieuw de pagina." };
    if (!Number.isInteger(aantal) || aantal < 0) return { fout: "Ongeldig aantal." };
    if (aantal === 0) continue;
    if (wijn.voorraad != null && (besteldPerWijn[id] || 0) + aantal > wijn.voorraad) {
      const over = Math.max(0, wijn.voorraad - (besteldPerWijn[id] || 0));
      return { fout: `Van ${wijn.naam} zijn nog maar ${over} flessen beschikbaar.` };
    }
    regels.push({ id, naam: wijn.naam, prijs: wijn.prijs, aantal });
    flessen += aantal;
  }
  if (flessen === 0) return { fout: "Je mandje is leeg." };
  if (flessen > instellingen.maxFlessenPerBestelling)
    return { fout: `Per bestelling kan je maximaal ${instellingen.maxFlessenPerBestelling} flessen bestellen. Neem contact op voor grotere bestellingen.` };

  let levering = invoer.levering === "levering" ? "levering" : "afhalen";
  let afhaalmoment = "", adres = "", postcode = "", gemeente = "", leveringskost = 0;
  if (levering === "afhalen") {
    afhaalmoment = tekst(invoer.afhaalmoment, 120);
    if (!instellingen.afhalen.momenten.includes(afhaalmoment)) return { fout: "Kies een afhaalmoment." };
  } else {
    if (!instellingen.levering.actief) return { fout: "Levering aan huis is niet mogelijk." };
    adres = tekst(invoer.adres, 160);
    postcode = tekst(invoer.postcode, 10);
    gemeente = tekst(invoer.gemeente, 80);
    if (adres.length < 4 || !/^\d{4}$/.test(postcode) || gemeente.length < 2) return { fout: "Vul je volledige leveradres in." };
    const gratis = instellingen.levering.gratisVanaf;
    leveringskost = gratis && flessen >= gratis ? 0 : instellingen.levering.kost;
  }

  const subtotaal = regels.reduce((s, r) => s + r.prijs * r.aantal, 0);
  return {
    bestelling: {
      naam, email, telefoon, opmerking, levering, afhaalmoment, adres, postcode, gemeente,
      regels, flessen, subtotaal, leveringskost, totaal: subtotaal + leveringskost,
    },
  };
}

// Wat de klant mag zien van een bestelling (geen interne notities).
export function publiekeBestelling(r) {
  return {
    nummer: r.nummer, aangemaakt: r.aangemaakt, status: r.status, naam: r.naam,
    levering: r.levering, afhaalmoment: r.afhaalmoment, adres: r.adres, postcode: r.postcode, gemeente: r.gemeente,
    regels: JSON.parse(r.regels), subtotaal: r.subtotaal, leveringskost: r.leveringskost, totaal: r.totaal,
    ogm: r.ogm, betaling: instellingen.betaling, afhaalplaats: instellingen.afhalen.plaats,
  };
}

export const euro = (cent) => "€ " + (cent / 100).toFixed(2).replace(".", ",");

// Aantal flessen per wijn in lopende bestellingen (voor de voorraad).
export async function besteldPerWijn(db) {
  const { results } = await db.prepare("SELECT regels FROM bestellingen WHERE status != 'geannuleerd'").all();
  const telling = {};
  for (const r of results) for (const regel of JSON.parse(r.regels)) telling[regel.id] = (telling[regel.id] || 0) + regel.aantal;
  return telling;
}

// ---------- Bescherming van de betaalgegevens ----------
// Het IBAN staat alleen in src/instellingen.json en wordt bij het publiceren in de code ingebakken.
// Er is geen API om het te wijzigen. Extra slot: de Pages-secret IBAN_SHA256 bevat de SHA-256 van het
// echte IBAN (zonder spaties, hoofdletters). Klopt het IBAN in de code daar niet mee, dan weigert de site
// bestellingen en toont ze het rekeningnummer niet.

export function ibanGeldig(iban) {
  const s = String(iban || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  if (s.startsWith("BE") && s.length !== 16) return false;
  const omgezet = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const cijfer of omgezet) rest = (rest * 10 + Number(cijfer)) % 97;
  return rest === 1;
}

async function sha256(tekst) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tekst));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Geeft { geldig, pinIngesteld, pinKlopt, veilig } terug.
export async function controleerBetaalgegevens(env) {
  const iban = String(instellingen.betaling.iban || "").replace(/\s+/g, "").toUpperCase();
  const geldig = ibanGeldig(iban);
  const pin = String(env.IBAN_SHA256 || "").trim().toLowerCase();
  const pinIngesteld = pin.length === 64;
  const pinKlopt = pinIngesteld ? (await sha256(iban)) === pin : null;
  return { geldig, pinIngesteld, pinKlopt, veilig: pinKlopt !== false };
}
