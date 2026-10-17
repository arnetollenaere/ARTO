---
name: site-optimaliseren
description: Optimaliseert de hele website van een ARTO-klant op snelheid, SEO, toegankelijkheid en techniek, meet voor en na, en schrijft een rapport in het logboek. Gebruik bij "optimaliseer", "maak de site sneller", "SEO-check", "audit van de site van X".
---

# Hele site optimaliseren

De checklist staat in `setup/optimalisatie.md`. Werk die volledig af.

## 1. Voorbereiden

1. Zoek de klant in `bedrijven/`, lees `bedrijf.md`.
2. Ga naar `../<repo-naam>` (clone als nodig), `git pull`, maak een branch `optimalisatie-<datum>`.

## 2. Meten vóór

- Is de site live: `npx lighthouse https://<domein> --output=json --output-path=./lighthouse-voor.json --chrome-flags="--headless"` en noteer de vier scores. Lukt Lighthouse niet in deze omgeving, meet dan lokaal tegen `npx wrangler pages dev dist`, of sla de meting over en zeg dat.
- Loop daarnaast de bronbestanden zelf na; veel punten zie je in de code (ontbrekende alt, geen description, grote afbeeldingen).

## 3. Verbeteren

Ga elk onderdeel van `setup/optimalisatie.md` af: snelheid, SEO, toegankelijkheid, veiligheid en techniek, inhoud. Voor elk punt: in orde, verbeterd, of niet mogelijk (met reden).

- Afbeeldingen omzetten naar WebP kan met `npx sharp-cli` of `cwebp` als die beschikbaar zijn; anders noteer welke afbeeldingen te groot zijn.
- Verander het ontwerp of de teksten niet ingrijpend zonder te vragen; optimaliseren is geen herontwerp. Teksten voor title en description mag je voorstellen en invullen.
- Controleer dat de contactgegevens overeenkomen met `bedrijf.md`.

## 4. Meten na en opleveren

1. `./build.sh`, opnieuw meten (lokaal of na een preview via `./deploy.sh preview`).
2. Commit op de branch, push. Publiceer naar productie alleen als Arne dat vraagt.
3. Voeg aan `bedrijven/<slug>/logboek.md` een regel toe: "Optimalisatie: Lighthouse prestaties X→Y, toegankelijkheid X→Y, best practices X→Y, SEO X→Y", plus Gepubliceerd.
4. Geef Arne een kort rapport: scores voor en na, wat je veranderde, wat nog open staat en waarom.
