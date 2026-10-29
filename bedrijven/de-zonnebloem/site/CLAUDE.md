# Instructies voor Claude: site van De Zonnebloem (wijnactie)

Webshop voor de wijnverkoop van De Zonnebloem (zonnebloemwijn.be), gebouwd en beheerd door ARTO. Schrijf in het Nederlands.

- Statische site in `src/` (plain HTML, CSS en JS, geen framework) plus Cloudflare Pages Functions in `functions/` met een D1-database. Gedeelde servercode staat in `lib/`. Voeg geen framework of build-tool toe zonder dat Arne erom vraagt.
- Wijnen en prijzen staan in `src/wijnen.json`, alle actie-instellingen (IBAN, afhaalmomenten, leveringskost, deadline) in `src/instellingen.json`. De server rekent prijzen altijd uit die bestanden.
- De CSP in `src/_headers` verbiedt inline scripts en inline `style`-attributen. Zet scripts in `src/js/` en zet stijl via CSS of `element.style` vanuit JS.
- Alles wat klanten invullen, toon je in het beheer altijd via `esc()`.
- Bouwen: `./build.sh`. Lokaal testen: zie README.md. Publiceren: `./deploy.sh` (productie) of `./deploy.sh preview`.
- Publiceer naar productie alleen als Arne dat vraagt. Toon eerst een preview.
- Klantgegevens staan in de ARTO-repo onder `bedrijven/de-zonnebloem/bedrijf.md`. Na elke wijziging: noteer ze in `bedrijven/de-zonnebloem/logboek.md`.
- Houd je aan `ARTO/setup/optimalisatie.md`.
- Nooit wachtwoorden of API-sleutels in de repo: die gaan via `wrangler pages secret put`.
