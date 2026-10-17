# Templates

Startpunten voor nieuwe klantsites. Je kopieert een template naar een eigen repo voor de klant en past het daar aan; het template zelf blijft ongewijzigd.

## Beschikbaar

| Template | Voor wie | Status |
|---|---|---|
| [`site-basis/`](site-basis/README.md) | Technische basis: één pagina, build- en deployscripts, headers, SEO-basis. Elk ander template bouwt hierop voort. | klaar |

Sectortemplates (bv. horeca, kapper, bouw, vrije beroepen) met een eigen, uitgesproken ontwerp komen hier bij. Elk krijgt een eigen map met een `README.md` die zegt voor welk soort bedrijf het is.

## Wat elk template moet hebben

Zo werken alle skills en scripts met elk template:

- `src/` met de site zoals ze online komt, en minstens `index.html`, `404.html`, `_headers`, `robots.txt`, `sitemap.xml`.
- `build.sh` dat de site in `dist/` zet, en `deploy.sh` dat `dist/` naar Cloudflare Pages publiceert (kopieer ze uit `site-basis/`).
- `CLAUDE.md` met instructies voor Claude en `README.md` met uitleg voor mensen.
- De velden `{{NAAM}}`, `{{DOMEIN}}`, `{{PROJECT}}`, `{{BESCHRIJVING}}`, `{{TELEFOON}}`, `{{EMAIL}}` en `{{ADRES}}` op de plaatsen waar klantgegevens komen.
- Voldoen aan [`setup/optimalisatie.md`](../setup/optimalisatie.md): snel, toegankelijk, goede SEO.

## Een site maken vanuit een template

```bash
./setup/scripts/nieuwe-site.sh ../bakkerij-peeters \
  NAAM="Bakkerij Peeters" DOMEIN=bakkerijpeeters.be PROJECT=bakkerij-peeters
```

Standaard gebruikt het script `site-basis`. Een ander template kies je met `TEMPLATE=<map>` vooraan:

```bash
TEMPLATE=horeca ./setup/scripts/nieuwe-site.sh ../cafe-elise NAAM="Café Élise" ...
```

Of vraag Claude: "maak een nieuwe klant aan voor Bakkerij Peeters" (skill `nieuwe-klant`).

## Andere sjablonen

De fiche voor een nieuwe klant en documenten zoals de offerte en het overdrachtsdocument staan in [`setup/sjablonen/`](../setup/sjablonen/).
