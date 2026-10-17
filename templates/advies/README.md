# {{NAAM}} — template "Paragraaf" (advies)

Website van {{NAAM}} (https://{{DOMEIN}}), gebouwd door ARTO op het adviestemplate **Paragraaf**.

## Voor wie

Advocatenkantoren, notarissen, boekhouders, fiscalisten, bedrijfsrevisoren en consultants: vrije beroepen waar vertrouwen, precisie en duidelijke kosten het verschil maken.

## Ontwerpidee

"Hedendaagse Zwitserse autoriteit": de site leest als een goed gezet juridisch document. Veel lucht, haarfijne lijnen en een streng 12-koloms raster dat zichtbaar in de achtergrond loopt. Elke sectie heeft een paragraafnummer (§ 01, § 02 …). Een scherpe display-serif (Newsreader) draagt de koppen, een neutrale grotesk (Hanken Grotesk) de lopende tekst. Diep inktgroen en ossenbloedrood op warm gebroken wit. Signatuur-elementen:

- een grote titel met een cursief vervolg in ossenbloed, en een **ronde stempel** met de kantoornaam die traag draait;
- een **inhoudstafel** in de opening, zoals in een conclusie of wetboek;
- expertise als **index-lijst** die openklapt met uitleg en trefwoorden;
- **kerncijfers** in een inktgroen vlak die optellen wanneer ze in beeld komen;
- lijnen die zich **tekenen bij het scrollen**, en een dunne voortgangslijn onder de header;
- het team als **register** (naam, rol, domein, talen, balie) en op de teampagina als fiches met monogram zolang er geen portret is;
- tarieven als staat van ereloon, met een "Nota bene";
- een rustig formulier **Eerste gesprek aanvragen**;
- wettelijke vermeldingen (ondernemingsnummer, RPR, balie, beroepsaansprakelijkheid, deontologie) in de footer.

## Pagina's

| Pagina | Inhoud |
|---|---|
| `index.html` | Opening + inhoudstafel, § 01 expertise, § 02 kerncijfers, § 03 werkwijze, § 04 tarieven, § 05 team, § 06 inzichten (3 nieuwste), § 07 vragen, § 08 eerste gesprek + contact en kantooruren |
| `expertise.html` | Elk domein uitgebreid, met zijindex die meeloopt |
| `team.html` | Fiche per teamlid: portret of monogram, domein, talen, balie, sinds, bio, e-mail |
| `inzichten.html` | Alle artikels met datum, categorie, auteur en volledige tekst |
| `404.html` | "Deze pagina staat niet in ons dossier." |

Aanvragen posten naar `/api/bericht` (`_formulier=eerste-gesprek`) en komen in het beheerpaneel onder **Berichten**.

## Velden (beheerpaneel)

Naast de vaste velden (algemeen, contact, openingsuren, socials, SEO, mededeling):

- **Menu** — woorden in de navigatie en de knop rechtsboven.
- **Kantoorgegevens** — actief sinds, balie/beroepsorde, talen, plaats (de strook bovenaan).
- **Openingsblok** — label, titel + cursief vervolg, intro, knoppen, tekst in de stempel.
- **Expertise** — domeinen met korte omschrijving, uitleg (opgemaakte tekst) en trefwoorden.
- **Kerncijfers** — tot 4 cijfers met teken (%, +) en omschrijving.
- **Werkwijze** — stappen met duur en uitleg.
- **Tarieven** — omschrijving, prijs, eenheid, toelichting en een noot.
- **Team** — naam, rol, talen, balie, sinds, specialisaties, e-mail, portret, bio.
- **Inzichten** — artikels met titel, datum, categorie, auteur, samenvatting en volledige tekst.
- **Veelgestelde vragen**, **Formulier eerste gesprek** (onderwerpen, voorkeur, bevestiging, privacyzin).
- **Koppen van de subpagina's** en **Kleine teksten** (kolomtitels, formulierlabels, footerkoppen).
- **Wettelijke vermeldingen** — vennootschap, RPR, balie, verzekering, deontologie (+ link), privacylink.
- **Kleuren** — inkt, stempel, papier, tekst en haarlijnen.

Voor een notaris, boekhouder of consultant: pas `kantoor.balie`, `labels.orde` (bv. "ITAA" of "Kamer"), de juridische vermeldingen en de categorieën van de inzichten aan.

## Foto's

Het ontwerp is af zonder foto's. Portretten maken het persoonlijker:

- **Portretten**: staand 4:5, 800×1000 px, WebP, rustige neutrale achtergrond, alle portretten in hetzelfde licht en dezelfde uitsnede. Ze krijgen een lichte grijstint om het geheel rustig te houden. Vul altijd de beschrijving in (bv. "Portret van Lieve Maes").
- **Deelafbeelding** (SEO): 1200×630 px, bv. de naam van het kantoor in de huisstijl.
- **Logo**: SVG met transparante achtergrond, ± 36 px hoog in de header. Zonder logo verschijnt een woordmerk met §.
