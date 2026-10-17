# ARTO-controlepaneel

Een besloten website met het overzicht van de hele agency: alle klanten, hun status, of hun site bereikbaar is, wat er nog in de fiches ontbreekt, het logboek en kant-en-klare opdrachten voor Claude (optimaliseren, aanpassen, publiceren, overdragen).

Dit is het paneel voor ARTO zelf. De beheerpagina per klantsite staat los daarvan (zie `templates/`).

## Hoe het werkt

- `build.mjs` leest alle fiches in `bedrijven/<slug>/bedrijf.md` en `logboek.md` en schrijft `dist/data.json`. Het paneel is dus altijd zo actueel als de repo: pas een fiche aan, push, en het paneel volgt.
- `src/` is de website zelf (HTML, CSS, JavaScript, geen frameworks).
- `functions/_middleware.js` schermt **elke** aanvraag af met een loginpagina (gebruikersnaam + wachtwoord). Wie aangemeld is, blijft 30 dagen aangemeld (cookie). Zolang het wachtwoord niet is ingesteld, toont het paneel niets.
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

   Het project `arto-paneel` wordt aangemaakt als het nog niet bestaat. Het paneel staat dan op `https://arto-paneel.pages.dev`, maar toont niets tot stap 4 klaar is.

4. **Login instellen.** De gebruikersnaam staat in `wrangler.toml` (`PANEEL_GEBRUIKER`, standaard `arne`). Het wachtwoord is een geheim van het Pages-project:

   ```bash
   cd paneel && npx wrangler pages secret put PANEEL_WACHTWOORD --project-name arto-paneel
   ```

   Of in het dashboard: Workers & Pages → arto-paneel → Settings → Variables and Secrets → `PANEEL_WACHTWOORD` (type *Secret*), en publiceer daarna opnieuw. Bewaar het wachtwoord in de wachtwoordmanager onder "ARTO / paneel". Een nieuw wachtwoord logt meteen iedereen uit.

5. **Eigen adres (optioneel)**: Workers & Pages → arto-paneel → Custom domains → bv. `paneel.artowebdesign.com`.

## Automatisch publiceren via GitHub

`.github/workflows/paneel.yml` bouwt en publiceert het paneel bij elke push die `bedrijven/` of `paneel/` wijzigt. Pushes op de standaardbranch gaan naar productie, andere branches naar de preview. Zet daarvoor in GitHub → Settings → Secrets and variables → Actions de secrets `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID`. Zonder secrets bouwt de workflow alleen.

## Toegang aanpassen

Wachtwoord vergeten of gelekt: zet een nieuw `PANEEL_WACHTWOORD` (zie stap 4). Alle bestaande sessies vervallen dan. Uitloggen kan via "Uitloggen" rechtsboven.
