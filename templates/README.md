# Templates

Startpunten voor nieuwe klantsites. Je kopieert een template naar een eigen repo voor de klant en past het daar aan; het template zelf blijft ongewijzigd.

## Beschikbaar

| Template | Voor wie | Beheerpaneel | Status |
|---|---|---|---|
| [`site-basis/`](site-basis/README.md) | Technische basis: één pagina in plain HTML, build- en deployscripts, headers, SEO-basis. | nee | klaar |
| [`horeca/`](horeca/README.md) | Restaurant, bar, bistro, foodtruck | ja | klaar |
| [`kapper/`](kapper/README.md) | Kapsalon, barbier, schoonheidssalon, nagelstudio | ja | klaar |
| [`bouw/`](bouw/README.md) | Aannemer, schrijnwerker, loodgieter, elektricien, dakwerker | ja | klaar |
| [`advies/`](advies/README.md) | Advocaat, boekhouder, notaris, consultant | ja | klaar |
| [`fitness/`](fitness/README.md) | Gym, yoga- of pilatesstudio, personal trainer | ja | klaar |
| [`winkel/`](winkel/README.md) | Boetiek, conceptstore, bakker, bloemist, lokale winkel | ja | klaar |
| [`creatief/`](creatief/README.md) | Fotograaf, architect, ontwerper, studio | ja | klaar |
| [`zorg/`](zorg/README.md) | Kinesist, tandarts, psycholoog, groepspraktijk | ja | klaar |

Elk sectortemplate heeft een eigen, uitgesproken ontwerp en hetzelfde **beheerpaneel** op `/beheer/`, waar de klant (of jij) teksten, foto's, prijzen, openingsuren en SEO aanpast en de hele site laat doorlichten en optimaliseren. Zie [`_kern/README.md`](_kern/README.md) voor hoe dat technisch werkt.

## Een site maken vanuit een template

```bash
TEMPLATE=horeca ./setup/scripts/nieuwe-site.sh ../cafe-elise \
  NAAM="Café Élise" DOMEIN=cafe-elise.be PROJECT=cafe-elise \
  TELEFOON="+32 9 123 45 67" EMAIL=hallo@cafe-elise.be ADRES="Kouter 5, 9000 Gent"
```

Zonder `TEMPLATE=` gebruikt het script `site-basis`. Bij een sectortemplate kopieert het script ook de ARTO-kern naar `arto/` en de publicatie-workflow naar `.github/workflows/`, en vult het de gegevens in `inhoud.json` in.

Of vraag Claude: "maak een nieuwe klant aan voor Café Élise met het horeca-template" (skill `nieuwe-klant`).

Lokaal bekijken met werkend beheerpaneel:

```bash
cd ../cafe-elise && ./dev.sh        # http://localhost:8790 en http://localhost:8790/beheer/
```

Het beheerpaneel online laten werken (opslaan vanaf de site zelf): zie [`setup/beheerpaneel.md`](../setup/beheerpaneel.md).

## Wat elk template moet hebben

Zo werken alle skills en scripts met elk template:

- `src/` met de site zoals ze online komt, en minstens `index.html`, `404.html`, `_headers`, `robots.txt`, `sitemap.xml`.
- `build.sh` dat de site in `dist/` zet, en `deploy.sh` dat `dist/` naar Cloudflare Pages publiceert.
- `CLAUDE.md` met instructies voor Claude en `README.md` met uitleg voor mensen.
- De klantgegevens `{{NAAM}}`, `{{DOMEIN}}`, `{{PROJECT}}`, `{{BESCHRIJVING}}`, `{{TELEFOON}}`, `{{EMAIL}}` en `{{ADRES}}`: in `site-basis` rechtstreeks in de HTML, in sectortemplates via `inhoud.json` (het script vult ze daar in) en `{{PROJECT}}` in `deploy.sh`.
- Voldoen aan [`setup/optimalisatie.md`](../setup/optimalisatie.md): snel, toegankelijk, goede SEO.

Sectortemplates hebben daarnaast:

- `template.json`: naam, sector, type voor Google (`schemaType`) en de **secties en velden die het beheerpaneel toont**.
- `inhoud.json`: alle teksten en gegevens van de site. Dit is het enige bestand dat het beheerpaneel aanpast.
- `dev.sh` voor lokaal werken met beheerpaneel.
- In elke pagina `{{{ arto.kop }}}` in `<head>` (titel, beschrijving, Open Graph, Google-gegevens en themakleuren komen daar automatisch) en `{{> mededeling }}` bovenaan in `<body>`.
- Formulieren posten naar `/api/bericht`; ze komen dan in het beheerpaneel onder **Berichten**.

## Een nieuw sectortemplate maken

```bash
./templates/_kern/nieuw-template.sh dierenarts
```

Dat zet de vaste bestanden klaar. Daarna schrijf je `template.json`, `inhoud.json` en de pagina's. De syntax voor de pagina's staat in [`_kern/README.md`](_kern/README.md#templatesyntax).

## Ontwerpregels voor sectortemplates

Elk template moet eruitzien alsof een goede studio het voor die sector ontwierp, niet als een generieke AI-site:

- Een eigen idee per sector (bv. menukaart als typografische lijst, werfdossier als technische fiche), met een eigen lettertypecombinatie en kleurpalet.
- Niet: paarse of blauwe verlopen, "hero + drie kaarten met emoji", stockfoto-gevoel, glassmorphism zonder reden, overal dezelfde ronde kaartjes.
- Werkt zonder foto's van de klant (geen lege kaders), en wordt beter met foto's.
- Snel: geen frameworks, lettertypes zelf gehost (alleen gebruikte gewichten, `font-display: swap`), JavaScript klein en met `defer`, `prefers-reduced-motion` gerespecteerd.
- Toegankelijk: contrast minstens 4,5:1, zichtbare focus, alles met het toetsenbord bereikbaar, één `<h1>` per pagina.

## Andere sjablonen

De fiche voor een nieuwe klant en documenten zoals de offerte en het overdrachtsdocument staan in [`setup/sjablonen/`](../setup/sjablonen/).
