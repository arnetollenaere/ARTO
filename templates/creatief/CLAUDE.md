# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het creatieve template "Witte Zaal". Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, projecten, disciplines en tarieven, team, opdrachtgevers, prijzen, formulierlabels, uren, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- Pagina's in `src/`: `index.html` (opening, horizontale galerij, disciplines, statement, opdrachtgevers, aanvraag), `werk.html` (index met zwevende preview + alle case studies), `studio.html` (verhaal, werkwijze, team, erkenningen, opdrachtgevers, aanvraag) en `404.html`. Gedeelde stukken in `src/_delen/`: `kop`, `voet`, `aanvraag` (formulier), `beeld` (projectbeeld of compositie), `composities` (de SVG-symbolen). Templatesyntax: zie `arto/README.md`.
- **Projecten** zijn de kern. Elk project krijgt automatisch een nummer (W—01 …) volgens de volgorde in de lijst, een anker op de werkpagina (`/werk#<titel-als-slug>`) en verschijnt in de galerij als `uitgelicht` aan staat. Een titel wijzigen verandert dus het anker.
- **Composities**: zonder foto toont elk project een getekende SVG (`boog`, `trap`, `kolom`, `vouw`, `plan`, `horizon`, `doorsnede`, `kader`) op een vlak (`licht`, `donker`, `accent`). Een nieuwe compositie maak je als `<symbol id="c-naam" viewBox="0 0 400 500">` in `_delen/composities.html`, met kleuren via `style="fill:var(--i)"` (inkt), `var(--a)` (accent) en `var(--g)` (grond); voeg de naam daarna toe aan de `opties` in `template.json` (twee keer: hero en projecten).
- Stijl in `src/css/stijl.css`, gedrag in `src/js/zaal.js` (menu, klok, galerij, zwevende preview, filter, bevestiging, woordmerk). Geen frameworks of CDN's toevoegen.
- Kleuren: gebruik `var(--thema-<sleutel>, #fallback)` of de tokens bovenaan de CSS (`--bg`, `--ink`, `--acc`, `--dk`). Eén accentkleur, altijd als vlak; controleer dat witte tekst erop minstens 4,5:1 haalt.
- Het formulier "Start een project" post naar `/api/bericht` met `_formulier=Start een project`; aanvragen verschijnen in het beheerpaneel onder Berichten.

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel). Bouwen: `./build.sh` — moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` in `inhoud.json` (de sitemap komt er vanzelf).

## Afspraken

- De gegevens van de klant (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, afbeeldingen in WebP met `width` en `height`, `loading="lazy"` behalve bovenaan, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Projectfoto's: staand 4:5 (minstens 1600×2000 px), WebP, onder 300 kB. Een foto vervangt de compositie; laat `fotoAlt` nooit leeg.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een foto, dan blijft de compositie staan.
