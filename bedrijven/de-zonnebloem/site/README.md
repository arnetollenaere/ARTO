# De Zonnebloem: wijnactie

Webshop voor de wijnverkoop ten voordele van De Zonnebloem, gemaakt door ARTO. Klanten kiezen wijnen, bestellen, en betalen via overschrijving met een gestructureerde mededeling of QR-code. De organisatie volgt de bestellingen op in een beheerscherm.

Live op https://{{DOMEIN}} (nog in te vullen).

## Hoe het werkt

1. **Klant** kiest wijnen op de homepage en vult het bestelformulier in (afhalen of levering aan huis).
2. De server controleert de bestelling, rekent de prijs uit (altijd uit `src/wijnen.json`, nooit uit de browser) en bewaart ze in de database.
3. De klant komt op `/bestelling/` met het bedrag, IBAN, de **gestructureerde mededeling** (bv. `+++260/0000/00170+++`) en een **EPC-QR-code** die bank-apps kunnen scannen.
4. **De Zonnebloem** opent `/beheer/` (met wachtwoord):
   - **Bestellingen**: zoeken, filteren op status, status aanpassen (wacht op betaling → betaald → klaargezet → afgeleverd, of geannuleerd), interne notities.
   - **Betalingen afpunten**: plak de verrichtingen uit de bank-app; de mededelingen worden herkend en de bestellingen gaan in één klik op betaald. Bij een afwijkend bedrag wordt dat gemeld.
   - **Picklijst**: totaal per wijn (om bij de leverancier te bestellen) en per afhaalmoment of levering een afvinklijst om af te drukken.
   - **Exporteer naar Excel**: alle bestellingen als CSV.
5. Optioneel: automatische e-mails (bevestiging met betaalgegevens, melding aan de organisatie, "betaling ontvangen") via Resend.

## Structuur

```
src/                    # statische site
├── index.html          # homepage met wijnen, mandje en bestelformulier
├── bestelling/         # bevestigingspagina met betaalgegevens en QR-code
├── beheer/             # beheerscherm (afgeschermd met wachtwoord)
├── wijnen.json         # DE WIJNEN: naam, prijs (eurocent), voorraad, kleuren
├── instellingen.json   # IBAN, begunstigde, afhaalmomenten, leveringskost, deadline, doel
├── css/ js/ fonts/
├── img/foto/           # foto's in WebP (zie FOTOS.md)
├── _headers            # beveiligings- en cache-headers (strikte CSP)
└── _routes.json        # alleen /api/* en /beheer/* draaien als Function
functions/              # Cloudflare Pages Functions (de API)
├── api/bestellingen.js         # POST: nieuwe bestelling
├── api/bestelling/[id].js      # GET: bestelling bekijken (met geheime token)
├── api/stand.js                # GET: teller op de homepage
├── api/beheer/...              # lijst, status wijzigen, export (wachtwoord)
└── beheer/_middleware.js       # wachtwoord voor /beheer
lib/                    # gedeelde code voor de Functions
schema.sql              # databasetabel
wrangler.toml           # Cloudflare-configuratie (D1-database)
```

## Wijnen en instellingen aanpassen

- **Wijnen**: `src/wijnen.json`. Prijs in eurocent (`1350` = € 13,50). `voorraad`: aantal flessen of `null` voor onbeperkt. `foto`: naam van de foto in `src/img/foto/` (zie `FOTOS.md`).
- **Foto's**: sfeerbeelden van Unsplash, bronnen en uitleg om ze te vervangen in `FOTOS.md`.
- **Instellingen**: `src/instellingen.json`. Zet `bestellingenOpen` op `false` om de actie af te sluiten.
- Daarna `./build.sh && ./deploy.sh`.

## Eerste keer online zetten

In het Cloudflare-account van de klant (zie `ARTO/setup/hosting-cloudflare.md`):

```bash
npx wrangler login
# 1. Database aanmaken en het database_id in wrangler.toml zetten
npx wrangler d1 create zonnebloem-bestellingen
npx wrangler d1 execute zonnebloem-bestellingen-eu --remote --file schema.sql
# 2. Eerste deploy (maakt het Pages-project aan)
./build.sh && ./deploy.sh preview
# 3. Wachtwoord voor het beheer (bewaar het in de wachtwoordmanager)
npx wrangler pages secret put BEHEER_WACHTWOORD --project-name=de-zonnebloem
# 4. Optioneel: e-mails. Vul MAIL_VAN en MAIL_BEHEER in wrangler.toml in, dan:
npx wrangler pages secret put RESEND_API_KEY --project-name=de-zonnebloem
```

Inloggen op `/beheer/`: de gebruikersnaam mag om het even wat zijn, het wachtwoord is `BEHEER_WACHTWOORD`.

## Lokaal testen

```bash
echo "BEHEER_WACHTWOORD=test" > .dev.vars
npx wrangler d1 execute zonnebloem-bestellingen-eu --local --file schema.sql
./build.sh && npx wrangler pages dev
```

Open http://localhost:8788 en http://localhost:8788/beheer/.

## Publiceren

```bash
./build.sh && ./deploy.sh            # productie
./build.sh && ./deploy.sh preview    # testversie
```

## Back-up van de bestellingen

```bash
npx wrangler d1 export zonnebloem-bestellingen-eu --remote --output bestellingen-backup.sql
```

Of gewoon "Exporteer naar Excel" in het beheer.
