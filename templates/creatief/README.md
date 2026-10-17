# Witte Zaal — template voor creatieve studio's

Voor architecten, interieurstudio's, fotografen, grafisch ontwerpers en videomakers. Demo: **Kavel Studio**, een fictieve studio voor architectuur en interieur aan het Achterdok in Gent.

Site voor {{NAAM}} — {{DOMEIN}}.

## Ontwerpidee

Het portfolio als tentoonstelling. De site is een witte zaal: gebroken wit (of bijna zwart) met één elektrische accentkleur die altijd als vlak verschijnt, nooit als verloop. Elk onderdeel is een "zaal" met een nummer, elk project een werk met index (W—01) en jaartal, beschreven zoals op een museumlabel.

- **Typografie**: Unbounded (breed, variabel 200–700) voor titels — ultralicht in de opening, die zwaarder wordt terwijl je scrolt; Instrument Sans voor lopende tekst; JetBrains Mono voor captions en metadata.
- **Zonder foto's af**: elk project toont een getekende architecturale compositie (boog, trap, kolom, vouw, plan, horizon, doorsnede, kader) op een licht, donker of accentvlak. Met foto's wordt het een echte galerie.
- **Beweging**: horizontale galerij die meeschuift met de scroll, indexlijst met een preview die de cursor volgt, disciplines die zich vullen met de accentkleur, een band met opdrachtgevers. Alles valt terug op gewone scroll bij `prefers-reduced-motion` of in oudere browsers.

## Pagina's

| Pagina | Inhoud |
|---|---|
| `index.html` | Opening met zaaltekst, indexje en beeld · horizontale galerij (uitgelichte projecten) · disciplines met tarieven · statement en kerncijfers · band met opdrachtgevers · formulier "Start een project" |
| `werk.html` | Grote titel · filter per discipline · indexlijst met zwevende preview · een case study per project (fiche met klant, jaar, discipline, locatie, omvang, status en extra gegevens, beeld, verhaal, citaat) |
| `studio.html` | Verhaal en cijfers · werkwijze in stappen · team (portret of monogram) · prijzen en vermeldingen · opdrachtgevers · formulier |
| `404.html` | "Deze zaal is leeg." |

## Velden in het beheerpaneel

Naast de vaste velden (algemeen, contact, uren, socials, SEO, mededeling):

- **Navigatie en vaste teksten**: menu, plaatsregel in de kop, footerzin, 404.
- **Startpagina: opening**: zaalnummer, titel (regels), inleiding, knop, bijschrift, compositie of foto.
- **Startpagina: galerij**: kop en teksten; welke projecten erin staan kies je per project met "Uitlichten".
- **Projecten**: titel, klant, jaar, discipline, locatie, omvang, status, korte omschrijving, case study, citaat, compositie + vlak, foto, extra gegevens.
- **Werkpagina**: titel, inleiding, labels van de fiche.
- **Disciplines en tarieven**: naam, omschrijving, prijsindicatie, doorlooptijd.
- **Studio**: statement, titel, verhaal, kerncijfers, werkwijze, team.
- **Opdrachtgevers**, **Prijzen en erkenningen**.
- **Start een project**: titel, inleiding, keuzes voor soort project en budget, alle labels, bevestiging.
- **Kleuren**: accent, achtergrond, tekst, donkere vlakken.

## Foto's en maten

- Projectbeelden: staand 4:5, minstens 1600×2000 px, WebP, liefst onder 300 kB. Op de werkpagina worden ze breed (16:10) uitgesneden, dus houd het onderwerp in het midden.
- Opening: staand, minstens 1200×1500 px.
- Studiobeeld: liggend 3:2, minstens 2000 px breed.
- Portretten: staand 4:5; ze worden automatisch zwart-wit getoond.
- Geen foto? Kies een compositie en een vlak die bij het project passen: `doorsnede` voor renovatie, `plan` voor interieur, `kader` voor scenografie of fotografie, `vouw` voor objecten.

## Tips

- Houd de openingstitel kort (3 tot 6 woorden); breed lettertype, dus lange woorden breken op gsm snel.
- Kies maximaal zes uitgelichte projecten; de galerij wordt anders te lang.
- De accentkleur moet witte tekst dragen (Klein-blauw `#1A2FD6`, signaalrood `#C42A14`, groen `#0F6B3E` werken; geel of lichtroze niet).
