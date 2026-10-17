# Maatlijn — template voor bouw en renovatie

Voor aannemers, schrijnwerkers, dakwerkers, loodgieters, elektriciens en renovatiebedrijven. Deze kopie is de site van **{{NAAM}}** ({{DOMEIN}}).

## Ontwerpidee

De site leest als een **werfdossier**: papierwit met een fijn bouwraster, betongrijs, signaalgeel en veiligheidsoranje. Bovenaan staat een liniaal met coördinaten (A–L, 1–6), de grote titel krijgt een maatlijn die zijn echte breedte toont, en een doorsnede van een woning tekent zichzelf met maatlijnen, peilen (±0,00, +2,90 …) en een titelblok zoals op een bouwplan. Projecten zijn technische fiches; diensten een legende met arceringen; de werkwijze een werfplanning per week. Kleurcode zoals op een Belgische bouwaanvraag: **geel = afgebroken, oranje = nieuw**.

Lettertypes: **Archivo** (variabel, van condensed tot normaal) en **IBM Plex Mono** voor labels. Zelf gehost, samen ± 120 kB.

## Pagina's

| Pagina | Wat staat erop |
|---|---|
| `index.html` | Hero met doorsnedetekening, kerncijfers, diensten als legende, uitgelichte projecten, werfplanning, kaart van het werkgebied, erkenningen als stempels + premie-uitleg, getuigenissen, oproep |
| `projecten.html` | Alle projecten als fiche met voor/na-schuif en filter op type werk |
| `offerte.html` | Offerteaanvraag in drie stappen (type werk → details → contact) en veelgestelde vragen |
| `404.html` | "Deze pagina staat niet op het plan." |

Op de gsm staat onderaan altijd een balk met **Bel ons** en **Offerte**.

## Wat de klant kan aanpassen (beheerpaneel)

Algemeen, contact, uren, socials, vindbaarheid, en daarnaast:

- **Menu en knoppen**: woorden in het menu en de gsm-balk.
- **Startpagina bovenaan**: label, titel + gemarkeerd deel, intro, knoppen, kerncijfers, titelblok bij de tekening.
- **Diensten**: code, naam, arcering, omschrijving, onderdelen.
- **Projecten**: titel, dossiernummer, gemeente, type, m², duur, jaar, materialen, omschrijving, foto vóór/na, tekening als fallback, op de startpagina ja/nee.
- **Werkwijze**: fases met startweek en aantal weken.
- **Werkgebied**: straal en gemeenten (afstand en richting).
- **Erkenningen en premies**: VCA, erkenning, verzekering … en een blok over Mijn VerbouwPremie.
- **Getuigenissen**, **Oproep onderaan**, **Offertepagina** (stappen, keuzes, bevestiging, FAQ), **Offerteformulier: velden**, **Footer**, **404**.
- **Kleuren**: signaalgeel, veiligheidsoranje, papier, inkt, beton.

## Foto's

- Voor/na-foto's **liggend, 4:3, minstens 1600×1200 px**, in WebP. Neem ze vanaf **hetzelfde standpunt**, anders werkt de schuif niet.
- Geen foto's? Dan toont de fiche een tekening (gevel, dak, keuken of ramen) met de afbraak in geel en het nieuwe in oranje. Dat ziet er af uit; foto's maken het sterker.
- Deelafbeelding (SEO): 1200×630 px, bv. een foto van een afgewerkte werf.

## Tips

- Gebruik echte cijfers bij de projecten (m², weken): dat is wat bezoekers vertrouwen geeft.
- Zet alleen erkenningen en certificaten online die het bedrijf echt heeft, met het juiste nummer.
- Houd de werfplanning realistisch; ze is een belofte.

## Werken

```bash
./dev.sh          # lokaal met beheerpaneel
./build.sh        # bouwt naar dist/
./deploy.sh preview
```
