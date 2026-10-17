# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd door ARTO met het template **Toonbank** (sector winkel). Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, producten, prijzen, openingsuren, kleuren, SEO. Pas inhoud daar aan, niet in de HTML. Het beheerpaneel op `/beheer/` past ook alleen dat bestand (en `src/img/uploads/`) aan.
- `template.json` beschrijft welke velden het beheerpaneel toont. Nieuw veld nodig? Voeg het toe in `template.json`, vul het in `inhoud.json` en gebruik het in `src/`.
- Pagina's in `src/` (`index.html`, `assortiment.html`, `bestellen.html`, `404.html`), gedeelde stukken in `src/_delen/` (`hoofd`, `kop`, `voet`, `product`, `mededeling`). Syntax: zie `arto/README.md` (`{{ veld }}`, `{{#elk}}`, `{{#als}}`, `{{> deel }}`).
- Producten zitten genest: `categorieen[].producten[]`. Het schap op de startpagina toont producten met `uitgelicht: true`.
- Stijl in `src/css/stijl.css` (kleuren via `var(--thema-…)`), gedrag in `src/js/winkel.js` (menu, open-indicator, schappen, bestelbon, WhatsApp). Geen frameworks of CDN's toevoegen.
- Productillustraties: `src/img/producten/<naam>.svg`. Een nieuwe illustratie? Teken in dezelfde stijl en voeg de naam toe aan de keuzelijsten `illustratie` in `template.json`.

## Werken

- Bouwen: `./build.sh` (moet eindigen zonder "let op:"). Lokaal bekijken met beheerpaneel: `./dev.sh`.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie pas als Arne dat vraagt**; toon eerst een preview.
- Bestellingen van de bestelbon komen binnen in het beheerpaneel onder **Berichten** (formulier `bestelling`).
- Klantgegevens (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd `inhoud.json` daarmee in lijn.
- Na elke wijziging: noteer ze in `bedrijven/<slug>/logboek.md` in de ARTO-repo (datum, wat, gepubliceerd ja/nee).

## Optimalisatie (zie `ARTO/setup/optimalisatie.md`)

- Eén `<h1>` per pagina; titel en beschrijving per pagina in `seo.paginas`.
- Foto's in WebP op de juiste maat, met `alt` (veld `fotoAlt`). Illustraties zijn decoratief (`alt=""`).
- Contrast minstens 4,5:1: kies de hoofd- en derde kleur donker genoeg voor witte/lichte tekst.
- CSS+JS onder 60 kB, lettertypes (Bricolage Grotesque, Young Serif) zelf gehost in `src/fonts/`.
- Nieuwe pagina? Ze komt vanzelf in de sitemap; voeg ze toe aan `seo.paginas`.
