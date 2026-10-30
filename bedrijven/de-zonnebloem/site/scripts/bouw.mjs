// Bouwstap: vult dist/ aan met inhoud uit wijnen.json en instellingen.json,
// zodat zoekmachines en AI-assistenten alles zien zonder JavaScript uit te voeren.
// - wijnkaarten vooraf in de HTML (winkel.js tekent ze daarna opnieuw, met dezelfde opmaak)
// - antwoorden in de FAQ (prijzen, deadline, afhalen)
// - gestructureerde gegevens (JSON-LD): organisatie, website, FAQ en wijnen met prijs
// - llms.txt en sitemap.xml met de datum van vandaag
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://zonnebloemwijn.be";
const dist = new URL("../dist/", import.meta.url);
const lees = (f) => readFileSync(new URL(f, dist), "utf8");
const schrijf = (f, s) => writeFileSync(new URL(f, dist), s);

const { wijnen } = JSON.parse(lees("wijnen.json"));
const inst = JSON.parse(lees("instellingen.json"));
const vandaag = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const euro = (c) => "€ " + (c / 100).toFixed(2).replace(".", ",");
const foto = (w, b) => `/img/foto/${w.foto}-${b}.webp`;
const soortNaam = { wit: "Witte wijn", "rosé": "Rosé", rood: "Rode wijn", bubbels: "Mousserende wijn" };
const datum = (iso, metDag) => new Date(iso + "T12:00:00").toLocaleDateString("nl-BE", { ...(metDag ? { weekday: "long" } : {}), day: "numeric", month: "long", year: "numeric" });
const open = inst.bestellingenOpen !== false && (!inst.deadline || inst.deadline >= vandaag);

// ---------- Wijnkaarten (zelfde opmaak als toonWijnen() in js/winkel.js) ----------
const kaart = (w) =>
  `<li class="wijn" data-soort="${esc(w.soort)}">` +
  `<div class="wijn__beeld">` +
  `<img src="${foto(w, 1000)}" srcset="${foto(w, 640)} 640w, ${foto(w, 1000)} 1000w" sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw" width="1000" height="1250" loading="lazy" alt="${esc(soortNaam[w.soort] || "Wijn")}: ${esc(w.naam)}">` +
  `<span class="wijn__soort">${esc(w.soort)}</span>` +
  `<div class="wijn__snel"><p class="wijn__prijs">${euro(w.prijs)}<small>per fles</small></p></div>` +
  `</div>` +
  `<div class="wijn__tekst">` +
  `<p class="wijn__streek">${esc(w.streek)} · ${esc(w.land)}${w.jaar ? " · " + w.jaar : ""}</p>` +
  `<h3>${esc(w.naam)}</h3>` +
  `<p class="wijn__druif">${esc(w.druif)}</p>` +
  `<p class="wijn__smaak">${esc(w.smaak)}</p>` +
  `<p class="wijn__past"><span>Past bij</span>${esc(w.pastBij)}</p>` +
  `</div>` +
  `<div class="wijn__acties">` +
  `<div class="stapper" role="group" aria-label="Aantal flessen ${esc(w.naam)}">` +
  `<button type="button" data-min="${w.id}" aria-label="Eén fles minder">−</button>` +
  `<output aria-live="polite" data-aantal="${w.id}">0</output>` +
  `<button type="button" data-plus="${w.id}" aria-label="Eén fles meer">+</button>` +
  `</div>` +
  `<button type="button" class="knop" data-doos="${w.id}"><span>+ 6 flessen</span></button>` +
  `</div></li>`;

let html = lees("index.html");
const vervang = (zoek, door) => {
  if (!zoek.test(html)) throw new Error("Niet gevonden in index.html: " + zoek);
  html = html.replace(zoek, door);
};
vervang(/<li class="laden">[^<]*<\/li>/, wijnen.map(kaart).join(""));

// ---------- FAQ-antwoorden uit de instellingen ----------
const prijzen = wijnen.map((w) => w.prijs);
const min = Math.min(...prijzen), max = Math.max(...prijzen);
const zet = (id, tekst) => vervang(new RegExp(`(<p id="${id}">)[\\s\\S]*?(</p>)`), `$1${esc(tekst)}$2`);
zet("faq-prijs", `Een fles kost ${min === max ? euro(min) : "tussen " + euro(min) + " en " + euro(max)}. Je kiest per fles of per doos van zes, en je kan wit, rosé, rood en bubbels combineren. Afhalen is gratis.`);
if (inst.deadline) zet("faq-deadline", `Je kan bestellen tot en met ${datum(inst.deadline, true)}.`);
zet("faq-levering", inst.levering && inst.levering.actief
  ? `Ja. ${inst.levering.uitleg} Levering kost ${euro(inst.levering.kost)}${inst.levering.gratisVanaf ? `, gratis vanaf ${inst.levering.gratisVanaf} flessen` : ""}. Afhalen kan ook, gratis.`
  : "Nee, je haalt je wijn zelf op. Bij het bestellen kies je een afhaalmoment. Afhalen is gratis.");

// ---------- Gestructureerde gegevens ----------
const tekst = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const vragen = [...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/g)]
  .map((m) => ({ "@type": "Question", name: tekst(m[1]), acceptedAnswer: { "@type": "Answer", text: tekst(m[2]) } }));

const ORG = SITE + "/#organisatie";
const graph = [
  {
    "@type": "NGO",
    "@id": ORG,
    name: "vzw Raakpunt",
    alternateName: "Raakpunt",
    description: "Gentse vzw die vrijetijdsbesteding organiseert voor kansengroepen: kinderen, jongeren en volwassenen met of zonder beperking, of opgegroeid in (kans)armoede. Organiseert onder meer De Zonnebloem, een jaarlijks weekend en kamp.",
    url: "https://www.vzwraakpunt.be/",
    logo: { "@type": "ImageObject", url: SITE + "/img/raakpunt-blauw.webp", width: 600, height: 500 },
    email: "vzwraakpunt@gmail.com",
    vatID: "BE0452918932",
    taxID: "0452.918.932",
    address: { "@type": "PostalAddress", addressLocality: "Gent", addressRegion: "Oost-Vlaanderen", addressCountry: "BE" },
    areaServed: { "@type": "City", name: "Gent" },
    sameAs: ["https://www.vzwraakpunt.be/"],
    knowsAbout: ["inclusie", "vrijetijdsbesteding voor mensen met een beperking", "kansengroepen", "jeugdkampen"],
  },
  {
    "@type": "WebSite",
    "@id": SITE + "/#website",
    url: SITE + "/",
    name: "Wijnverkoop De Zonnebloem",
    inLanguage: "nl-BE",
    publisher: { "@id": ORG },
    creator: { "@type": "Organization", name: "ARTO", url: "https://artowebdesign.com/" },
  },
  {
    "@type": "WebPage",
    "@id": SITE + "/#pagina",
    url: SITE + "/",
    name: "Wijnverkoop ten voordele van De Zonnebloem",
    description: "Bestel wijn en steun De Zonnebloem, het jaarlijkse weekend en kamp van vzw Raakpunt (Gent) voor kinderen en jongeren met of zonder beperking.",
    inLanguage: "nl-BE",
    isPartOf: { "@id": SITE + "/#website" },
    about: { "@type": "Thing", name: "De Zonnebloem", description: "Jaarlijks weekend en kamp van vzw Raakpunt voor kinderen en jongeren met of zonder beperking." },
    primaryImageOfPage: { "@type": "ImageObject", url: SITE + "/img/og.jpg", width: 1200, height: 630 },
    dateModified: vandaag,
    mainEntity: { "@id": SITE + "/#wijnen" },
  },
  {
    "@type": "ItemList",
    "@id": SITE + "/#wijnen",
    name: "Wijnen van de wijnactie",
    numberOfItems: wijnen.length,
    itemListElement: wijnen.map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        "@id": `${SITE}/#wijn-${w.id}`,
        name: w.naam,
        category: soortNaam[w.soort] || "Wijn",
        description: `${w.smaak} Druif: ${w.druif}. Past bij: ${w.pastBij}.`,
        image: SITE + foto(w, 1000),
        countryOfOrigin: { "@type": "Country", name: w.land },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Druif", value: w.druif },
          { "@type": "PropertyValue", name: "Streek", value: w.streek },
          ...(w.jaar ? [{ "@type": "PropertyValue", name: "Oogstjaar", value: w.jaar }] : []),
        ],
        offers: {
          "@type": "Offer",
          url: SITE + "/#wijnen",
          price: (w.prijs / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: open && w.voorraad !== 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          ...(inst.deadline ? { priceValidUntil: inst.deadline } : {}),
          seller: { "@id": ORG },
          eligibleCustomerType: "https://schema.org/Enduser",
          availableDeliveryMethod: "https://schema.org/OnSitePickup",
          acceptedPaymentMethod: "https://schema.org/ByBankTransferInAdvance",
        },
      },
    })),
  },
  { "@type": "FAQPage", "@id": SITE + "/#vragen", mainEntity: vragen },
];
const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1).replace(/</g, "\\u003c");
vervang(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${ld}\n  </script>`);
schrijf("index.html", html);

// ---------- llms.txt: korte, feitelijke samenvatting voor AI-assistenten ----------
const llms = `# Wijnverkoop De Zonnebloem

> Online wijnverkoop van vzw Raakpunt (Gent, België) ten voordele van De Zonnebloem, het jaarlijkse weekend en kamp voor kinderen en jongeren met of zonder beperking. Website: ${SITE}/

## Kerngegevens

- Organisator: vzw Raakpunt, Gent (ondernemingsnummer BE 0452.918.932), een vzw die vrijetijdsbesteding organiseert voor kansengroepen, met inclusie als uitgangspunt.
- Goed doel: de opbrengst gaat naar De Zonnebloem, het jaarlijkse weekend en kamp van vzw Raakpunt.
- Actie: ${inst.actie}. ${open ? (inst.deadline ? `Bestellen kan tot en met ${datum(inst.deadline)}.` : "Bestellen kan zolang de actie loopt.") : "De bestellingen zijn afgesloten."}
- Bestellen: online via ${SITE}/#bestellen. Per fles of per doos van zes; soorten mogen gecombineerd worden.
- Prijs: ${min === max ? euro(min) : `${euro(min)} tot ${euro(max)}`} per fles.
- Betalen: via overschrijving met een gestructureerde mededeling, of met de QR-code in een bank-app. Het rekeningnummer verschijnt na het bestellen.
- ${inst.levering && inst.levering.actief ? `Levering of afhalen: ${inst.levering.uitleg}` : "Afhalen: enkel afhalen, gratis, op een afhaalmoment dat je kiest bij het bestellen. Geen levering."}
- Leeftijd: alleen voor personen van 18 jaar of ouder.
- Contact: vzwraakpunt@gmail.com

## Wijnen

${wijnen.map((w) => `- ${w.naam} (${(soortNaam[w.soort] || "wijn").toLowerCase()}, ${w.druif}, ${w.streek}, ${w.land}${w.jaar ? ", " + w.jaar : ""}): ${euro(w.prijs)} per fles. ${w.smaak} Past bij: ${w.pastBij.toLowerCase()}.`).join("\n")}

## Meer informatie

- [Bestellen](${SITE}/#bestellen): wijnen kiezen en bestellen
- [Veelgestelde vragen](${SITE}/#vragen)
- [vzw Raakpunt](https://www.vzwraakpunt.be/): de organisatie achter De Zonnebloem

Laatst bijgewerkt: ${vandaag}. Website gemaakt en geschonken door ARTO (https://artowebdesign.com/).
`;
schrijf("llms.txt", llms);

// ---------- Sitemap ----------
schrijf("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${vandaag}</lastmod>
    <image:image><image:loc>${SITE}/img/og.jpg</image:loc></image:image>
${wijnen.map((w) => `    <image:image><image:loc>${SITE}${foto(w, 1000)}</image:loc></image:image>`).join("\n")}
  </url>
</urlset>
`);

console.log(`Bouwstap: ${wijnen.length} wijnen, ${vragen.length} vragen, JSON-LD, llms.txt en sitemap klaar.`);
