# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het adviestemplate "Paragraaf". Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, domeinen, team, tarieven, artikels, FAQ, kleine labels, wettelijke vermeldingen, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- De pagina's staan in `src/` (`index.html`, `expertise.html`, `team.html`, `inzichten.html`, `404.html`), gedeelde stukken in `src/_delen/` (`kop` = head, `header`, `voet`, `mededeling`). Templatesyntax: zie `arto/README.md`.
- Stijl in `src/css/stijl.css`, gedrag in `src/js/site.js` (mobiel menu, datums als 24.09.2026, tellende cijfers, actieve zijindex, bevestiging na verzenden). Geen frameworks of CDN's toevoegen.
- Kleuren: gebruik de tokens bovenaan de CSS (`--inkt`, `--stempel`, `--papier`, `--tekst`, `--lijn`), die lezen `var(--thema-<sleutel>, #fallback)`. De klant kiest de kleuren in het beheerpaneel; houd tekstcontrast minstens 4,5:1.
- Het raster: 12 kolommen (`--kol`), 4 op gsm. Nieuwe blokken lijnen uit op kolom 1, 4, 7 of 10, zoals de rest. Nieuwe sectie op de startpagina? Geef ze het volgende paragraafnummer (§ 09) en zet ze in de inhoudstafel bovenaan.
- Ankers op team en inzichten komen uit `naam | slug` en `titel | slug`: een titel wijzigen verandert dus de link.
- Op de startpagina staan de drie bovenste artikels; zet het nieuwste bovenaan in `inzichten.artikels`.
- Het formulier post naar `/api/bericht` met `_formulier=eerste-gesprek`; berichten verschijnen in het beheerpaneel.

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel). Bouwen: `./build.sh` — moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` in `inhoud.json` (de sitemap komt er vanzelf) en aan de navigatie in `src/_delen/header.html`.

## Afspraken

- De gegevens van de klant (contact, domein, ondernemingsnummer, balie, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn, zeker de wettelijke vermeldingen in de footer.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, afbeeldingen in WebP met `width` en `height`, `loading="lazy"` behalve bovenaan, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Vrije beroepen hebben deontologische regels over reclame: geen superlatieven, geen beloftes over resultaten, geen vergelijkingen met confraters. Houd teksten feitelijk.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een portret, dan blijft het monogram staan.
