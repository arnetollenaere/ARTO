# ARTO-controlepaneel

Een besloten website met het overzicht van de hele agency: alle klanten, hun status, of hun site bereikbaar is, wat er nog in de fiches ontbreekt, het logboek en kant-en-klare opdrachten voor Claude (optimaliseren, aanpassen, publiceren, overdragen).

Dit is het paneel voor ARTO zelf. De beheerpagina per klantsite staat los daarvan (zie `templates/`).

## Hoe het werkt

- `build.mjs` leest alle fiches in `bedrijven/<slug>/bedrijf.md` en `logboek.md` en schrijft `dist/data.json`. Het paneel is dus altijd zo actueel als de repo: pas een fiche aan, push, en het paneel volgt.
- `src/` is de website zelf (HTML, CSS, JavaScript, geen frameworks).
- `functions/_middleware.js` schermt **elke** aanvraag af: alleen wie via Cloudflare Access is aangemeld met het e-mailadres uit `TOEGESTANE_EMAIL` komt binnen. Zolang de afscherming niet is ingesteld, toont het paneel niets ("Geen toegang").
- `functions/api/status.js` controleert of de klantsites bereikbaar zijn (HTTP-status, laadtijd, titel, meta description). Het controleert alleen domeinen die in de fiches staan.

| Pagina | Wat |
|---|---|
| Overzicht | Kerncijfers, klantentabel met zoeken en filteren, live sitestatus, recente activiteit uit alle logboeken. |
| Klant | Alle gegevens van de fiche, open punten, logboek, sitecontrole, meetlinks (PageSpeed, beveiliging, HTML-validatie) en opdrachten voor Claude om te kopiëren. |
| Werkwijze | Procedures en sjablonen uit `setup/` en snelle links. |

## Lokaal bekijken

```bash
node paneel/build.mjs
python3 -m http.server 8790 -d paneel/dist   # alleen de interface, zonder afscherming en statuscontrole
```

## Eerste keer publiceren

1. **Cloudflare-account voor ARTO.** Gebruik het account van Arne (het paneel is geen klantsite).
2. **API-token**: dash.cloudflare.com → My Profile → API Tokens → Create Token → *Custom token* met **Account → Cloudflare Pages → Edit**. Bewaar het in de wachtwoordmanager onder "ARTO / Cloudflare paneel", nooit in deze repo.
3. Publiceren:

   ```bash
   export CLOUDFLARE_API_TOKEN=...      # uit de wachtwoordmanager
   export CLOUDFLARE_ACCOUNT_ID=...     # dash.cloudflare.com, rechts op de overzichtspagina
   ./paneel/deploy.sh
   ```

   Het project `arto-paneel` wordt aangemaakt als het nog niet bestaat. Het paneel staat dan op `https://arto-paneel.pages.dev`, maar toont "Geen toegang" tot stap 4 klaar is.

4. **Afscherming met Cloudflare Access** (gratis tot 50 gebruikers):
   1. one.dash.cloudflare.com → kies een teamnaam als dat gevraagd wordt (bv. `arto`, geeft `arto.cloudflareaccess.com`).
   2. Access → Applications → Add an application → **Self-hosted**.
   3. Domein: `arto-paneel.pages.dev` én een tweede regel `*.arto-paneel.pages.dev` (zodat ook previews beschermd zijn).
   4. Policy: Action **Allow**, Include → **Emails** → `arne.tollenaere@gmail.com`. Inlogmethode: *One-time PIN* (code per e-mail) volstaat.
   5. Kopieer na het opslaan de **Application Audience (AUD) Tag** (Overview van de applicatie).
   6. Vul in `paneel/wrangler.toml` in: `ACCESS_TEAM_DOMAIN = "arto.cloudflareaccess.com"` en `ACCESS_AUD = "<de tag>"`. Dit zijn geen geheimen.
   7. Publiceer opnieuw met `./paneel/deploy.sh`.

   Twee sloten dus: Access laat alleen Arne door tot de site, en de middleware weigert alles zonder geldig Access-token van dat e-mailadres, ook als Access ooit per ongeluk uitgezet wordt.

5. **Eigen adres (optioneel)**: Workers & Pages → arto-paneel → Custom domains → bv. `paneel.artowebdesign.com`. Voeg dat adres ook toe aan de Access-applicatie.

## Automatisch publiceren via GitHub

`.github/workflows/paneel.yml` bouwt en publiceert het paneel bij elke push die `bedrijven/` of `paneel/` wijzigt. Pushes op de standaardbranch gaan naar productie, andere branches naar de preview. Zet daarvoor in GitHub → Settings → Secrets and variables → Actions de secrets `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID`. Zonder secrets bouwt de workflow alleen.

## Toegang aanpassen

Meer mensen toelaten: voeg hun e-mail toe aan de Access-policy **en** aan `TOEGESTANE_EMAIL` in `wrangler.toml` (komma-gescheiden), en publiceer opnieuw.
