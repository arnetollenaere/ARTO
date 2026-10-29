# De Zonnebloem

## Basis

| Veld | Waarde |
|---|---|
| Naam | De Zonnebloem (officiële naam en rechtsvorm in te vullen) |
| Slug | de-zonnebloem |
| Status | online |
| Klant sinds | 2026-10-29 |
| Sector | Goed doel, organisatie die zich inzet voor mensen met een beperking. Website: wijnverkoop ten voordele van de werking. |
| Pakket / prijs | |

## Contact

| Veld | Waarde |
|---|---|
| Contactpersoon | |
| E-mail | |
| Telefoon | |
| Adres | |
| Btw-nummer | |

## Website

| Veld | Waarde |
|---|---|
| Domein | nog geen eigen domein, live op https://de-zonnebloem.pages.dev |
| Repo | nog aan te maken (`arnetollenaere/de-zonnebloem`, private) |
| Site staat in | `bedrijven/de-zonnebloem/site/` (tijdelijk, tot de eigen repo bestaat) |
| Template gebruikt | site-basis, uitgebreid tot webshop (Pages Functions + D1) |
| Live sinds | 2026-10-29 (pages.dev) |

## Hosting en toegang

Noteer hier nooit wachtwoorden of tokens, alleen waar ze staan.

| Veld | Waarde |
|---|---|
| Domein geregistreerd bij | |
| Domein op naam van | klant |
| Cloudflare-account van | Arne (eigen account, op zijn vraag; afwijkend van de ARTO-afspraak) |
| Cloudflare-account e-mail | |
| Arne uitgenodigd als Administrator | n.v.t. (eigen account) |
| Cloudflare Pages-project | de-zonnebloem |
| D1-database | zonnebloem-bestellingen-eu (EU-jurisdictie). Een lege, ongebruikte `zonnebloem-bestellingen` (Noord-Amerika) mag weg. |
| Wachtwoorden en tokens in | wachtwoordmanager, map "ARTO / De Zonnebloem" (o.a. `BEHEER_WACHTWOORD` voor /beheer/, ingesteld als Pages-secret; eventueel `RESEND_API_KEY`) |

## Webshop

| Veld | Waarde |
|---|---|
| Betaling | overschrijving met gestructureerde mededeling en EPC-QR-code |
| IBAN / begunstigde | in te vullen in `site/src/instellingen.json` |
| Afhaalpunt en -momenten | in te vullen in `site/src/instellingen.json` |
| Levering aan huis | € 5, gratis vanaf 12 flessen (voorbeeld, te bevestigen), regio in te vullen |
| Wijnen en prijzen | voorbeeldselectie in `site/src/wijnen.json`, te vervangen door de echte |
| Beheer | `/beheer/` met wachtwoord: bestellingen, betalingen afpunten, picklijst, Excel-export |
| E-mails | optioneel via Resend (nog niet ingesteld) |

## Afspraken

- Onderhoud: 
- Wie bezit de code: 
- Facturatie: 

## Notities

- Footer vermeldt "Website door ARTO" met link naar artowebdesign.com.
- Verkoop alleen aan 18+ (vinkje in het bestelformulier).
