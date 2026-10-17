# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO. Schrijf in het Nederlands.

- De site is plain HTML en CSS in `src/`. Voeg geen framework of build-tool toe zonder dat Arne erom vraagt.
- Bouwen: `./build.sh` (kopieert `src/` naar `dist/`). Publiceren: `./deploy.sh` (productie) of `./deploy.sh preview`.
- Publiceer naar productie alleen als Arne dat vraagt. Toon eerst een preview.
- De gegevens van de klant (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn.
- Na elke wijziging: noteer ze in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan de optimalisatieregels in `ARTO/setup/optimalisatie.md`: unieke title en description, alt-teksten, afbeeldingen in WebP met width en height, één h1 per pagina.
- Nieuwe pagina? Voeg ze toe aan `src/sitemap.xml`.
