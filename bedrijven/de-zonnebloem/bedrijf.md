# De Zonnebloem (vzw Raakpunt)

## Basis

| Veld | Waarde |
|---|---|
| Naam | vzw Raakpunt, wijnverkoop ten voordele van De Zonnebloem |
| Slug | de-zonnebloem |
| Status | online |
| Klant sinds | 2026-10-29 |
| Sector | Vzw uit Gent: vrijetijdsactiviteiten voor kansengroepen (kinderen, jongeren en volwassenen met of zonder beperking, uit kansarmoede of moeilijke opvoedingssituaties). De Zonnebloem = hun jaarlijks weekend en kamp voor kinderen en jongeren met of zonder beperking. Andere werkingen: 't Stoofken, Raakpunt In De Wijk, Jaarfeest. |
| Pakket / prijs | |

## Contact

| Veld | Waarde |
|---|---|
| Contactpersoon | |
| E-mail | vzwraakpunt@gmail.com |
| Telefoon | |
| Adres | Gent (straat en nummer niet op hun website) |
| Btw-nummer | BE 0452.918.932 (ondernemingsnummer) |

## Website

| Veld | Waarde |
|---|---|
| Domein | zonnebloemwijn.be (Cloudflare-zone aangemaakt, wacht op nameservers bij Hostinger); tijdelijk https://de-zonnebloem.pages.dev |
| Repo | nog aan te maken (`arnetollenaere/de-zonnebloem`, private) |
| Site staat in | `bedrijven/de-zonnebloem/site/` (tijdelijk, tot de eigen repo bestaat) |
| Template gebruikt | site-basis, uitgebreid tot webshop (Pages Functions + D1) |
| Live sinds | 2026-10-29 (pages.dev) |

## Hosting en toegang

Noteer hier nooit wachtwoorden of tokens, alleen waar ze staan.

| Veld | Waarde |
|---|---|
| Domein geregistreerd bij | Hostinger |
| Domein op naam van | nog na te vragen (best vzw Raakpunt) |
| Cloudflare-account van | Arne (eigen account, op zijn vraag; afwijkend van de ARTO-afspraak) |
| Cloudflare-account e-mail | |
| Arne uitgenodigd als Administrator | n.v.t. (eigen account) |
| Cloudflare Pages-project | de-zonnebloem (eigen domeinen: zonnebloemwijn.be en www.zonnebloemwijn.be) |
| Cloudflare-zone | zonnebloemwijn.be, nameservers charles.ns.cloudflare.com en robin.ns.cloudflare.com; www stuurt door naar het hoofddomein (Single Redirect) |
| D1-database | zonnebloem-bestellingen-eu (EU-jurisdictie). Een lege, ongebruikte `zonnebloem-bestellingen` (Noord-Amerika) mag weg. |
| Wachtwoorden en tokens in | wachtwoordmanager, map "ARTO / De Zonnebloem" (beheer: gebruiker `zonnebloem` + `BEHEER_WACHTWOORD`, beide Pages-secrets; slot na 10 foute pogingen; `IBAN_SHA256`; eventueel `RESEND_API_KEY`) |

## Webshop

| Veld | Waarde |
|---|---|
| Betaling | overschrijving met gestructureerde mededeling en EPC-QR-code |
| IBAN / begunstigde | BE82 9799 7559 3568, vzw Raakpunt (bevestigd door Arne op 2026-10-29) |
| Afhaalpunt en -momenten | in te vullen in `site/src/instellingen.json` |
| Levering aan huis | nee, enkel afhalen (`levering.actief: false` in instellingen.json) |
| Wijnen en prijzen | voorbeeldselectie in `site/src/wijnen.json`, te vervangen door de echte |
| Beheer | `/beheer/` met wachtwoord: bestellingen, betalingen afpunten, picklijst, Excel-export, status van het IBAN |
| IBAN-beveiliging | IBAN enkel in de code (geen API om te wijzigen). Vingerafdruk `IBAN_SHA256` ingesteld als Pages-secret op 2026-10-29 (zie `site/README.md`). |
| E-mails | optioneel via Resend (nog niet ingesteld) |

## Afspraken

- Onderhoud: 
- Wie bezit de code: 
- Facturatie: 

## Notities

- Huisstijl Raakpunt: blauw #2832b9, oranje #ff4619, wit; lettertypes Antonio (titels, hoofdletters) en Cantarell. Logo van hun site (Logo_Raakpunt_wit.png). Rek.nr. BE82 9799 7559 3568 is bevestigd voor de wijnverkoop.

- Eigen website: https://www.vzwraakpunt.be/ (motto: "zonder een hoek af is de cirkel nooit rond"). Weekend De Zonnebloem 2026: 27/2 tot 1/3 in Jeugdpark Hoogland, Lokeren. Sponsors o.a. VOG en Rotary Gent.
- Geen kinderen in beeld naast wijn (Belgische alcoholreclameregels); in tekst mag vermeld worden dat de opbrengst naar het kamp voor kinderen en jongeren gaat.

- Onderaan: "Website gemaakt en geschonken door arto" met interactief ARTO-teken, link naar artowebdesign.com.
- Verkoop alleen aan 18+ (vinkje in het bestelformulier).
