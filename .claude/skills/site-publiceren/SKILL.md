---
name: site-publiceren
description: Bouwt en publiceert de website van een ARTO-klant naar Cloudflare Pages (preview of productie) en koppelt indien nodig het domein. Gebruik bij "publiceer", "zet online", "deploy", "maak een preview van de site van X".
---

# Site publiceren

Volg `setup/hosting-cloudflare.md`.

## 1. Voorbereiden

1. Zoek de klant in `bedrijven/` en lees `bedrijf.md` (repo, Cloudflare-project, account).
2. Ga naar `../<repo-naam>` (clone als nodig), `git pull`, en controleer dat er geen niet-gecommitte wijzigingen zijn.
3. Controleer dat `.cloudflare-account` gevuld is en `PROJECT` in `deploy.sh` ingevuld is. Ontbreekt het account-ID, vraag het aan Arne (staat in het Cloudflare-dashboard van de klant).
4. Is Arne nog niet uitgenodigd in het klantaccount (fiche zegt `nee`)? Stop en leg uit wat de klant eerst moet doen (`setup/hosting-cloudflare.md#wat-de-klant-doet`).

## 2. Bouwen en controleren

> Sites die gemaakt zijn vóór de ARTO-templates hebben misschien geen `build.sh` of `deploy.sh`. Volg dan de `README.md` of `CLAUDE.md` van die site, en noteer in `bedrijf.md` hoe die site gebouwd en gepubliceerd wordt.

```bash
./build.sh
grep -r '{{' dist && echo "Er staan nog lege velden in de site" 
```

Stop als er nog `{{VELDEN}}` in staan.

## 3. Publiceren

- **Preview** (standaard als Arne niet uitdrukkelijk "live" of "productie" zegt):

  ```bash
  ./deploy.sh preview
  ```

- **Productie** (alleen als Arne dat in dit gesprek vraagt):

  ```bash
  ./deploy.sh
  ```

Wrangler moet ingelogd zijn (`npx wrangler login`). Lukt dat niet in deze omgeving (geen browser), zeg dan dat Arne het commando zelf moet draaien en geef het exacte commando.

Geef de URL die Wrangler teruggeeft aan Arne.

## 4. Eerste keer live: domein

Is de site voor het eerst in productie en staat `Live sinds` nog leeg, leg dan de stappen uit `setup/hosting-cloudflare.md#domein-koppelen` voor. Die gebeuren in het Cloudflare-dashboard. Zet daarna in de fiche: `Live sinds` en status `online`.

## 5. Bijhouden

Voeg een regel toe aan `bedrijven/<slug>/logboek.md` met wat er gepubliceerd is (Gepubliceerd: `preview` of `productie`) en commit in deze repo.
