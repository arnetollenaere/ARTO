# {{NAAM}} — template "Nachtkeuken" (horeca)

Website van {{NAAM}} (https://{{DOMEIN}}), gebouwd door ARTO op het horecatemplate **Nachtkeuken**.

## Voor wie

Restaurants, bistro's, wijnbars, cafés met keuken en foodtrucks: zaken die 's avonds leven en waar de kaart het belangrijkste is.

## Ontwerpidee

"Late-night editorial": een bijna zwarte achtergrond met korrel, crème tekst en één warm accent (tomatenrood, met amber als tweede kleur). Een grote, expressieve display-serif draagt het ontwerp; een mono-letter doet de details (labels, uren, prijzen) zoals op een bonnetje of een krijtbord. Signatuur-elementen:

- een getekend bord (SVG) dat langzaam draait in plaats van een foto;
- een bewegende band **"Vanavond op de kaart"**;
- de kaart als **typografische lijst** met stippellijnen naar de prijs, per gang, met labels (vegan, vegetarisch, glutenvrij, chef's pick) en allergenen;
- reserveren als een **papieren bonnetje** met gekartelde rand, perforatie en streepjescode;
- een **"nu open / gesloten"**-indicator die zelf rekent op basis van de openingsuren (Belgische tijd, ook voor uren na middernacht);
- een draaiende stempel met het weeknummer van de kaart.

## Pagina's

| Pagina | Inhoud |
|---|---|
| `index.html` | Titel, band, het idee + cijfers, signatuurgerechten, verhaal & chef, pers/reviews, groepen & events, reservatiebonnetje, ligging & openingsuren |
| `menu.html` | Volledige kaart per gang, formules, allergeneninfo, dranken (glas/fles) |
| `reserveren.html` | Bonnetje (formulier), afspraken, groepen, openingsuren |
| `404.html` | "Dit bord is op" |

Reservaties posten naar `/api/bericht` (`_formulier=reservatie`) en komen in het beheerpaneel onder **Berichten**. Een extern boekingssysteem (Zenchef, Resengo, TheFork …) kan je erbij linken via **Reserveren → Link naar extern boekingssysteem**.

## Velden (beheerpaneel)

Naast de vaste velden (algemeen, contact, openingsuren, socials, SEO, mededeling):

- **Navigatie** — woorden in het menu.
- **Nu open / gesloten** — de woorden van de indicator.
- **Startpagina: bovenaan** — titel (twee regels), intro, knoppen, notitie, optionele sfeerfoto.
- **Vanavond op de kaart** — de bewegende band (aan/uit, items).
- **Startpagina: het idee** — tekst en cijfers.
- **Signatuurgerechten** — 1 tot 4 gerechten met prijs, label en optionele foto.
- **Menukaart** — gangen met gerechten (naam, beschrijving, prijs, vegan, vegetarisch, glutenvrij, chef's pick, allergenen), formules, labels en legende.
- **Dranken** — groepen met dranken, prijs per glas en per fles.
- **Verhaal & chef** — tekst, citaat, namen, optioneel portret.
- **Groepen & events**, **Reviews & pers**, **Reserveren** (teksten, max. personen, uren, afspraken, externe link), **Ligging**, **Voettekst & 404**.
- **Thema** — vijf kleuren: achtergrond, tekst, accent, tweede accent, papier van het bonnetje.

## Foto's

Het ontwerp is af zonder foto's. Met foto's wordt het warmer:

- **Sfeerfoto bovenaan**: staand of vierkant, minstens 1200×1200 px, WebP. Wordt rond uitgesneden: kies een beeld met het onderwerp in het midden (een bord van bovenaf werkt het best).
- **Signatuurgerechten**: vierkant, van bovenaf gefotografeerd, 800×800 px, WebP. Ook rond uitgesneden.
- **Portret chef**: staand 3:4, 900×1200 px. Wordt zwart-wit en warm getint, met een boog bovenaan.
- **Deelafbeelding (SEO)**: 1200×630 px.

Donkere, warm belichte foto's passen het best bij de nachtsfeer. Houd foto's onder 250 kB.

## Lokaal werken

```bash
./dev.sh             # http://localhost:8790 en /beheer/
./build.sh           # bouwt naar dist/
./deploy.sh preview  # testversie
```

## Lettertypes

Instrument Serif, Schibsted Grotesk en JetBrains Mono, zelf gehost in `src/fonts/` (SIL Open Font License).
