# ARTO-kern

De gedeelde motor achter alle sectortemplates: de template-engine, de build, het beheerpaneel en de beheer-API. Bij een nieuwe klantsite kopieert `setup/scripts/nieuwe-site.sh` deze map naar `arto/` in de klantrepo. Zo werkt elke site op zichzelf, ook na overdracht aan de klant.

```
_kern/
├── engine.mjs          # template-engine (Node én browser)
├── bouw.mjs            # src/ + inhoud.json -> dist/ (+ beheer, + API)
├── dev.mjs             # lokale server met werkend beheerpaneel
├── worker.js           # beheer-API, wordt dist/_worker.js op Cloudflare Pages
├── vul.mjs             # vult klantgegevens in inhoud.json (gebruikt door nieuwe-site.sh)
├── basis-schema.json   # velden die elk template heeft (algemeen, contact, uren, socials, SEO, mededeling)
├── beheer/             # het beheerpaneel (statische app op /beheer/)
├── sjabloon/           # vaste bestanden voor een nieuw template (build.sh, dev.sh, deploy.sh, robots, sitemap, headers, workflow)
├── proefsite/          # testsite met elk veldtype, om het beheerpaneel te ontwikkelen
└── nieuw-template.sh   # zet een nieuw sectortemplate klaar
```

## Hoe het samenhangt

```
inhoud.json ──┐
template.json ├─ bouw.mjs ─> dist/ ── Cloudflare Pages
src/*.html  ──┘                 ├── *.html, css, img …   (de site)
                                ├── beheer/              (beheerpaneel + bron voor live preview)
                                └── _worker.js           (API op /api/*)

Beheerpaneel ── /api/inhoud ── GitHub (commit inhoud.json) ── GitHub Action ── build + deploy (± 1 minuut)
```

- **Inhoud** staat in één bestand, `inhoud.json`. Het beheerpaneel past alleen dat bestand en afbeeldingen in `src/img/uploads/` aan.
- **Opslaan** maakt een commit in de GitHub-repo van de site. De workflow `.github/workflows/publiceer.yml` bouwt en publiceert daarna automatisch. Elke opslag is dus een versie die je kan terugzetten.
- **Live preview**: het beheerpaneel rendert de pagina's in de browser met dezelfde engine, dus je ziet elke wijziging meteen, nog voor je opslaat. Klik in de preview op een tekst om meteen naar dat veld te springen.
- **Lokaal** (`./dev.sh`) schrijft het beheerpaneel rechtstreeks naar `inhoud.json`; elk wachtwoord werkt.

## Templatesyntax

Elke `.html`, `.xml` en `.txt` in `src/` gaat door de engine, met `inhoud.json` als data.

| Syntax | Betekenis |
|---|---|
| `{{ site.naam }}` | tekst, veilig ge-escaped |
| `{{{ arto.kop }}}` | ruwe HTML (alleen voor wat de build zelf maakt) |
| `{{ tekst \| md }}` | mini-markdown voor velden van het type `rijk` (alinea's, **vet**, *cursief*, links, lijstjes) |
| `{{ contact.telefoon \| tel }}` | telefoonnummer voor `tel:`-links |
| Andere filters | `datum` (24 september 2026), `kortedatum` (24.09.2026), `nl2br`, `klein`, `groot`, `url`, `json`, `slug`, `aantal`, `tekst`, `twee` |
| `{{#elk inzichten \| eerste3}}` | alleen de eerste 3 items (ook `eerste6`) |
| `{{#elk menu}} … {{/elk}}` | herhaal; binnenin `{{ naam }}`, `{{ . }}`, `{{ @nr }}` (1, 2, …), `{{ @index }}`, `{{ @eerste }}`, `{{ @laatste }}`, `{{ @even }}` |
| `{{#elk menu}} … {{#anders}} niets {{/elk}}` | met tekst als de lijst leeg is |
| `{{#als foto}} … {{#anders}} … {{/als}}` | voorwaarde; ook `{{#als soort == "vegan"}}` en `!=` |
| `{{#niet mededeling.aan}} … {{/niet}}` | omgekeerde voorwaarde |
| `{{> kop }}` | voegt `src/_delen/kop.html` in (gedeelde header, footer …) |
| `{{! commentaar }}` | wordt weggelaten |
| `{{NAAM}}` | hoofdletters laat de engine staan; die vult `nieuwe-site.sh` in |

Altijd beschikbaar naast `inhoud.json`:

- `jaar`: het huidige jaar.
- `pagina.bestand`, `pagina.url`, `pagina.naam`, `pagina.is.<naam>` (bv. `{{#als pagina.is.menu}}` voor de actieve link).
- `arto.kop`: zet dit in elke `<head>`. Bevat title, description, canonical, Open Graph, JSON-LD (op de startpagina) en `--thema-<kleur>` CSS-variabelen uit `inhoud.thema.kleuren`.
- `arto.paginas`: lijst van alle pagina's (`url`, `volledig`) voor sitemap en navigatie; `arto.basisUrl`.

Elk template gebruikt `{{> mededeling }}` (staat in `sjabloon/src/_delen/`) bovenaan `<body>` en geeft `.arto-mededeling` een eigen stijl.

## Vaste vorm van inhoud.json

Deze sleutels heeft elk template, zodat het beheerpaneel overal hetzelfde werkt (zie `basis-schema.json`):

```json
{
  "site":         { "naam": "", "slogan": "", "logo": "", "favicon": "", "domein": "", "taal": "nl-BE" },
  "mededeling":   { "aan": false, "tekst": "", "link": "" },
  "contact":      { "adres": "", "postcode": "", "gemeente": "", "land": "BE", "telefoon": "", "email": "", "whatsapp": "", "btw": "", "kaart": "" },
  "openingsuren": [ { "dag": "Maandag", "uren": "09:00–18:00" } ],
  "socials":      [ { "netwerk": "Instagram", "url": "" } ],
  "seo":          { "titel": "", "beschrijving": "", "afbeelding": "", "paginas": [ { "pagina": "menu.html", "titel": "", "beschrijving": "" } ] },
  "thema":        { "kleuren": { "accent": "#…", "achtergrond": "#…", "tekst": "#…" } }
}
```

Daarnaast kiest elk template zijn eigen sleutels (bv. `menu`, `diensten`, `team`, `projecten`), beschreven in `template.json`.

## template.json

```json
{
  "naam": "Nachtkeuken",
  "sector": "horeca",
  "beschrijving": "Voor restaurants en bars …",
  "schemaType": "Restaurant",
  "thema": {
    "kleuren": [
      { "sleutel": "accent", "label": "Accentkleur", "standaard": "#e8543a" },
      { "sleutel": "achtergrond", "label": "Achtergrond" },
      { "sleutel": "tekst", "label": "Tekst" }
    ]
  },
  "secties": [
    {
      "id": "menu", "titel": "Menukaart", "groep": "inhoud",
      "beschrijving": "Wat de bezoeker op de kaart ziet.",
      "velden": [
        { "pad": "menu", "type": "lijst", "label": "Gerechten", "itemLabel": "naam", "sorteerbaar": true,
          "velden": [
            { "pad": "naam", "type": "tekst", "label": "Gerecht" },
            { "pad": "prijs", "type": "prijs", "label": "Prijs" },
            { "pad": "soort", "type": "keuze", "label": "Soort", "opties": ["Voorgerecht", "Hoofdgerecht", "Dessert"] }
          ] }
      ]
    }
  ]
}
```

**Veldtypes**: `tekst`, `tekstvak` (meerdere regels), `rijk` (opgemaakte tekst, render met `| md`), `getal`, `prijs`, `email`, `telefoon`, `url`, `kleur`, `afbeelding` (pad naar een afbeelding, kies of upload in de mediabibliotheek), `schakelaar` (aan/uit), `keuze` (met `opties`), `datum`, `pagina` (een van de pagina's), `lijst` (herhaalbare items met eigen `velden`; `itemLabel` is het veld dat als titel van een item verschijnt), `groep` (een object met eigen `velden`).

**Extra eigenschappen van een veld**: `label`, `hulp` (uitleg onder het veld), `verplicht`, `max` (aantal tekens), `aanbevolen: [min, max]` (tekens, voor SEO), `breedte: "smal"`, `rol: "arto"` (alleen zichtbaar voor ARTO, niet voor de klant), `min` en `max` items bij een lijst.

**Groepen** (`groep` van een sectie) bepalen waar de sectie in het menu van het beheerpaneel staat: `inhoud` (pagina's en teksten), `gegevens` (contact, uren), `seo`.
