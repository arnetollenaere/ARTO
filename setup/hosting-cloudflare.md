# Hosting op Cloudflare Pages

Elke klantsite draait op Cloudflare Pages. Het eigendomsmodel:

- **Domein**: op naam van de klant. Wie het domein heeft, heeft de site.
- **Cloudflare-account**: van de klant, met een eigen e-mailadres. Arne is uitgenodigd als Administrator.
- **Code**: in een GitHub-repo van ARTO. Bij vertrek wordt die overgedragen of krijgt de klant een kopie (volgens het contract).

Zo is een overdracht geen verhuis: de klant haalt alleen jouw toegang weg en de site blijft draaien.

## Wat de klant doet

Stuur deze stappen naar de klant (pas de naam aan):

1. Registreer het domein op je eigen naam (bv. bij Combell, OVH, of rechtstreeks bij Cloudflare Registrar).
2. Maak een gratis account op https://dash.cloudflare.com/sign-up met een zakelijk e-mailadres dat je zelf beheert.
3. Ga naar **Manage Account → Members → Invite** en nodig `<e-mail van Arne>` uit met de rol **Administrator**.
4. Laat weten wanneer dat gedaan is.

## Wat Arne doet

1. Aanvaard de uitnodiging (link in de e-mail).
2. Noteer in `bedrijf.md`: Cloudflare-account e-mail, "Arne uitgenodigd als Administrator: ja".
3. Zet het account-ID in het bestand `.cloudflare-account` in de site-repo.
4. Maak het Pages-project aan (de eerste keer maakt `./deploy.sh` het zelf aan als het nog niet bestaat; Wrangler vraagt dan om bevestiging):

   ```bash
   cd ~/arto/bakkerij-peeters
   ./build.sh && ./deploy.sh
   ```

   De site staat dan op `https://<project>.pages.dev`.
5. Noteer de projectnaam in `bedrijf.md`.

## Domein koppelen

1. In het Cloudflare-dashboard van de klant: **Workers & Pages → project → Custom domains → Set up a custom domain**.
2. Voeg zowel `bakkerijpeeters.be` als `www.bakkerijpeeters.be` toe.
3. Staat het domein al in hetzelfde Cloudflare-account, dan zet Cloudflare de DNS-records zelf. Staat het elders, dan moet je ofwel de nameservers naar Cloudflare zetten (aanbevolen), ofwel een CNAME-record naar `<project>.pages.dev` maken bij de registrar.
4. Wacht tot het certificaat actief is (meestal enkele minuten) en test beide adressen.
5. Zet een redirect van `www` naar het hoofddomein (of omgekeerd) met een **Redirect Rule** in het domein, zodat er één officieel adres is.

## Publiceren

Twee manieren; kies per klant en noteer welke in `bedrijf.md`.

**A. Vanaf je computer (standaard)**

```bash
./build.sh && ./deploy.sh            # productie
./build.sh && ./deploy.sh preview    # testversie op een aparte URL
```

**B. Automatisch via Git**

In het dashboard: **Workers & Pages → Create → Pages → Connect to Git**, kies de repo, build command `./build.sh`, output directory `dist`. Elke push naar `main` gaat dan live, elke andere branch krijgt een preview-URL. Nadeel: de klant moet de Cloudflare GitHub-app toegang geven tot de repo, wat bij overdracht een extra stap is.

## Limieten gratis plan (oktober 2026)

- 500 builds per maand per account (alleen relevant bij manier B).
- 100 projecten per account, 100 eigen domeinen per project.
- Statische bestanden: geen bandbreedtelimiet.
- Bij overschrijding stoppen de builds; de site blijft online.

Check de actuele limieten op https://developers.cloudflare.com/pages/platform/limits voor je iets groots doet.
