# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het zorgtemplate "Luwte". Schrijf in het Nederlands, in een rustige, duidelijke toon (je-vorm, korte zinnen, geen jargon zonder uitleg).

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, behandelingen met duur, tarief en terugbetaling, team (specialisatie, talen, RIZIV-nummer, conventie), praktische info, FAQ, noodnummers, afspraaklink, formulierteksten, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- Pagina's in `src/`: `index.html`, `behandelingen.html`, `team.html`, `404.html`. Gedeelde stukken in `src/_delen/`: `hoofd` (head), `kop` (menu), `afspraak` (online agenda + formulier, op elke pagina), `voet` (noodnummers, footer, zwevende knop op gsm), `icoon` (iconen voor de praktische blokken). Templatesyntax: zie `arto/README.md`.
- Stijl in `src/css/luwte.css`, gedrag in `src/js/luwte.js` (gsm-menu, zwevende afspraakknop, `?behandeling=` vult het formulier in, `?verzonden=1` toont de bevestiging). Geen frameworks of CDN's toevoegen.
- Kleuren: `var(--thema-<sleutel>, #fallback)` of de afgeleide tokens bovenaan de CSS (`--bg`, `--inkt`, `--accent`, `--salie`, `--mint`). De klant kiest ze in het beheerpaneel. `tekst` moet heel donker blijven (ook de knoppen), `accent` minstens 4,5:1 op de achtergrond.
- Terugbetaling is een vaste keuze (`RIZIV-terugbetaald`, `Deels via ziekenfonds`, `Niet terugbetaald`); de CSS kleurt de badge op basis van die waarde. Nieuwe optie? Voeg ze toe in `template.json` én een `.badge[data-terug="…"]`-regel.
- De organische vormen zijn inline SVG's met CSS-animatie op `d` (heel traag) en staan uit bij `prefers-reduced-motion`. Houd dat zo.
- Het afspraakformulier post naar `/api/bericht` met `_formulier=afspraak`; aanvragen verschijnen in het beheerpaneel onder Berichten. Laat de zin "geen medische details" staan: medische gegevens horen niet in een webformulier.
- Noodnummers (112, 1733, 1813 …) staan onderaan elke pagina. Niet weghalen zonder overleg met Arne.

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel op `/beheer/`). Bouwen: `./build.sh`, dat moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` in `inhoud.json` (de sitemap komt er vanzelf) en zorg voor precies één `<h1>`.

## Afspraken

- De gegevens van de klant (contact, domein, RIZIV-nummers, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn; tarieven en RIZIV-nummers altijd laten bevestigen door de praktijk.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, afbeeldingen in WebP met `width` en `height`, `loading="lazy"` behalve bovenaan, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Zorgsites moeten extra toegankelijk zijn: tekst niet kleiner maken dan nu, knoppen minstens 48 px hoog, focus altijd zichtbaar.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een foto, dan blijft de getekende fallback (vormen, initialen) staan.
