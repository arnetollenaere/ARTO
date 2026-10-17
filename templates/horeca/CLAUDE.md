# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het horecatemplate "Nachtkeuken". Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, kaart, dranken, prijzen, uren, reservatie-instellingen, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- De pagina's staan in `src/` (`index.html`, `menu.html`, `reserveren.html`, `404.html`), gedeelde stukken in `src/_delen/` (`hoofd`, `kop`, `voet`, `ticket`, `uren`, `bord`). Templatesyntax: zie `arto/README.md`.
- Stijl in `src/css/stijl.css`, gedrag in `src/js/site.js` (menu, nu open/gesloten, bonnetje, weeknummer). Geen frameworks of CDN's toevoegen.
- Kleuren: gebruik `var(--thema-<sleutel>, #fallback)` of de afgeleide tokens bovenaan de CSS. De klant kiest de kleuren in het beheerpaneel.
- Openingsuren in de vorm `18:00–23:00`, meerdere blokken met een komma, `Gesloten` voor dichte dagen. Sluiten na middernacht (`17:30–00:30`) werkt.
- Het reservatieformulier post naar `/api/bericht` met `_formulier=reservatie`; berichten verschijnen in het beheerpaneel.

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel). Bouwen: `./build.sh` — moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` in `inhoud.json` (de sitemap komt er vanzelf).

## Afspraken

- De gegevens van de klant (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, afbeeldingen in WebP met `width` en `height`, `loading="lazy"` behalve bovenaan, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een foto, dan blijft de getekende fallback staan.
