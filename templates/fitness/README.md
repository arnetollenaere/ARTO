# Splittijd — template voor fitness

Voor gyms, crossfit-boxen, yoga- en pilatesstudio's en personal trainers. Gebruikt voor de site van {{NAAM}} ({{DOMEIN}}).

## Ontwerpidee

Een sportprogramma dat beweegt. Zwart met één elektrische kleur, gigantische cijfers en koppen in condensed hoofdletters, diagonale snedes tussen de secties en tekst die meeschuift als je scrolt. Het weekrooster is een echte tijdtabel (dagen × uren) met een filter per lestype, en lidmaatschappen zien eruit als toegangspassen met perforatie en barcode. Alles werkt zonder foto's; coaches krijgen dan een grafisch portret met initialen.

Lettertypes (zelf gehost, SIL Open Font License): **Big Shoulders Display** voor koppen en cijfers, **Archivo** (variabel, met breedte-as) voor lopende tekst, **JetBrains Mono** voor labels en tijden.

## Pagina's

| Pagina | Wat staat erop |
|---|---|
| `index.html` | Opening met drie regels in reuzenletters, tellende kerncijfers, lopende band met lestypes, de lestypes als genummerde lijst met intensiteitsmeter, "lessen per week" met de lessen van vandaag, passen, coaches, resultaten en het formulier voor een gratis proefles. |
| `rooster.html` | Het weekrooster als tijdtabel met filter per lestype, een lijn op het huidige uur, op gsm per dag met dagkiezer. |
| `tarieven.html` | Passen, losse prijzen, voorwaarden en veelgestelde vragen. |
| `404.html` | "Nul herhalingen." |

## Velden in het beheerpaneel

Naast de vaste velden (algemeen, contact, uren, sociale media, SEO, mededeling):

- **Menu en knoppen**: woorden in het menu en de knop rechtsboven.
- **Startpagina: opening**: label, drie titelregels, intro, knoppen, 3–4 kerncijfers.
- **Lessen**: kop, intro en per lestype naam, code (2–3 letters), beschrijving, duur, intensiteit (1–5), voor wie.
- **Weekrooster**: kop, intro, kleine lettertjes, dagen, begin- en einduur van de tabel, en elke les (dag, begin, einde, lestype, coach, niveau, zaal).
- **Lidmaatschappen**: per pas soort, naam, prijs, per, looptijd, wat inbegrepen is, uitlichten, knoptekst.
- **Pagina Tarieven**: losse prijzen, voorwaarden, veelgestelde vragen.
- **Coaches**: naam, initialen, rol, specialiteiten, citaat, foto.
- **Resultaten**: groot cijfer, eenheid, waarover, getuigenis, naam, detail.
- **Gratis proefles**: kop, intro, stappen, keuzes voor het moment, knop, privacyzin, bevestiging.
- **Onderaan en 404**: slagzin in de footer, kop openingsuren, teksten van de 404-pagina.

Aanvragen voor een proefles komen in het beheerpaneel onder **Berichten** (formulier `proefles`).

## Tips

- **Lestype in het rooster** moet exact zo geschreven zijn als bij Lessen, anders werkt het filter niet.
- **Titelregels** kort houden: één woord per regel (bv. Sneller. / Sterker. / Samen.).
- **Coachfoto's**: staand 4:5, minstens 800×1000 px, WebP. Ze worden in zwart-wit getoond en kleuren in bij hover; donker belichte foto's met een egale achtergrond werken het best.
- **Deelafbeelding** (SEO): 1200×630 px, bv. de accentkleur met het logo.
- **Kleuren**: de accentkleur moet fel zijn en goed contrasteren met zwart (fluogeel, limoen, elektrisch oranje). Geen paars of blauw verloop.
- Lokaal: `./dev.sh`, bouwen: `./build.sh`, publiceren: `./deploy.sh`.
