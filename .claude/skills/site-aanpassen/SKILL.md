---
name: site-aanpassen
description: Voert een wijziging door op de website van een ARTO-klant (tekst, foto, pagina, openingsuren, kleuren) en houdt fiche en logboek bij. Gebruik bij "verander ... op de site van X", "voeg een pagina toe", "nieuwe foto's voor X".
---

# Site van een klant aanpassen

## 1. Klant en site vinden

1. Zoek de klant in `bedrijven/`. Twijfel je welke bedoeld is, vraag het.
2. Lees `bedrijf.md`: veld `Repo` en `Site staat in`.
3. Ga naar de site: `../<repo-naam>` naast deze repo. Bestaat die map niet, clone de repo daar. Haal eerst de laatste versie op (`git pull`).
4. Lees de `CLAUDE.md` van de site en volg die.

## 2. Wijzigen

- Doe precies wat gevraagd is, in de stijl van de bestaande site.
- Komen er nieuwe contactgegevens of andere klantgegevens bij, pas die ook aan in `bedrijf.md`, zodat fiche en site gelijk blijven.
- Nieuwe afbeeldingen: WebP, juiste maat, `width`/`height`, zinvolle `alt`.
- Nieuwe pagina: unieke `<title>` en description, toevoegen aan `sitemap.xml` en het menu.

## 3. Controleren

> Sites die gemaakt zijn vóór de ARTO-templates hebben misschien geen `build.sh` of `deploy.sh`. Volg dan de `README.md` of `CLAUDE.md` van die site, en noteer in `bedrijf.md` hoe die site gebouwd en gepubliceerd wordt.

```bash
./build.sh
npx wrangler pages dev dist   # lokaal bekijken op http://localhost:8788
```

Controleer minstens dat de build lukt en dat er geen kapotte links of lege `{{VELDEN}}` zijn (`grep -r '{{' dist`).

## 4. Opslaan en melden

1. Commit in de site-repo met een duidelijke boodschap en push.
2. Voeg een regel toe aan `bedrijven/<slug>/logboek.md` (Gepubliceerd: `nee`, of `preview` als je een preview maakte) en commit in deze repo.
3. Publiceer **niet** naar productie tenzij Arne het vraagt. Bied aan om een preview te publiceren of te publiceren via de skill `site-publiceren`.
