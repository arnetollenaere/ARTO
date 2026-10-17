# Toonbank — template voor lokale winkels

Voor bakkers, delicatessenzaken, conceptstores, boetieks, bloemisten en fietsenwinkels. De demo is **Vonk**, een fictieve bakkerij-delicatessenzaak in de Overleie in Kortrijk. Voor een klant wordt dit de site van {{NAAM}} op {{DOMEIN}}.

## Ontwerpidee

*Product als object, speelse modernist.* Producten staan groot als objecten op kleurvlakken (terracotta, botergeel, flessengroen, crème), in horizontale **schappen** met een doorlopende plank en schapkaartjes met prijs, eenheid en beschikbaarheid. Licht schuine **stickers** (Nieuw, Seizoen, Favoriet, Bio, Uitverkocht) en een seizoensbanner met lopende band geven de site de sfeer van een etalage. Typografie: Bricolage Grotesque (variabel, smal en zwaar voor titels) met Young Serif als accent.

Geen webshop: klanten **bestellen of reserveren** via een bestelbon (komt binnen in het beheerpaneel onder Berichten) of via WhatsApp, en betalen bij het afhalen.

## Pagina's

| Pagina | Inhoud |
|---|---|
| `index.html` | Grote titel met product, "Nu in de winkel"-seizoensbanner, schap met uitgelichte producten, categorieën, het verhaal (met getekende oven of foto), cadeaubonnen, bestelband, openingsuren groot met "vandaag open tot …", adres en kaartje |
| `assortiment.html` | Alle categorieën als schappen, met prijs, eenheid, beschikbaarheid en een "Reserveer"-link per product |
| `bestellen.html` | Bestelbon (product, aantal, afhaaldag, afhaalmoment, gegevens), WhatsApp-alternatief, regels. Toont "Genoteerd!" na verzenden |
| `404.html` | "Dit schap is leeg." |

## Velden (beheerpaneel)

Naast de vaste velden (algemeen, contact, openingsuren, socials, SEO, mededeling):

- **Menu en vaste teksten** (`navigatie`): woorden in het menu, knop rechtsboven, zin in de voettekst.
- **Startpagina: bovenaan** (`hero`): titel in twee delen, inleiding, knoppen, getekend product of foto, prijskaartje, twee stickers.
- **Nu in de winkel** (`seizoen`): aan/uit, titel, tekst, prijs, hoe lang nog, product voor de bestelbon, illustratie of foto, teksten op de lopende band.
- **Uitgelichte producten** (`schap`): koppen boven het schap en de categorieën.
- **Assortiment** (`assortiment`, `categorieen`): categorieën met kleur en per categorie producten met prijs, eenheid, beschrijving, sticker, beschikbaarheid, illustratie of foto en "uitlichten op de startpagina".
- **Ons verhaal** (`verhaal`): titel, tekst, citaat, stempel, jaartal, foto, feiten in cijfers.
- **Cadeaubonnen** (`cadeaubon`): aan/uit, teksten, bedragen (komen ook in de keuzelijst van de bestelbon).
- **Bestellen en reserveren** (`bestellen`): teksten, stappen, afhaalmomenten, WhatsApp-teksten, regels, bevestiging, woorden op de bestelbon.
- **Waar je ons vindt** (`winkel`): titel, uitleg, routeknop en de woorden van de open-indicator.
- **Pagina niet gevonden** (`nietgevonden`).

Kleuren: hoofdkleur, tweede en derde kleur, achtergrond en tekst (`thema.kleuren`).

## Illustraties

Elk product kan een getekend object krijgen: brood, baguette, croissant, taart, koek, kaas, pot, fles, zak, chocolade, cadeau, bloemen, tas, kop, fiets (`src/img/producten/`). Zo ziet de site er zonder foto's al af uit. Voor een bloemist of fietsenwinkel kan je er gerust nieuwe bijtekenen in dezelfde stijl (240×240, contour 5 px in #2A1D15, vlakke kleuren) en de naam toevoegen aan de keuzelijsten in `template.json`.

## Foto's

- **Productfoto's**: vrijstaand op transparante achtergrond (PNG of WebP), vierkant, 800×800 px. Foto's met achtergrond werken ook, maar het "object op kleurvlak"-effect is dan weg.
- **Hero en seizoen**: vrijstaand, vierkant, minstens 1000×1000 px.
- **Verhaal**: staand 1200×1500 px (verhouding 4:5), wordt in een boogvorm getoond.
- **Deelafbeelding** (SEO): 1200×630 px.

## Tips

- De open-indicator leest de openingsuren (Brusselse tijd). Schrijf uren als `07:00–18:30`, een middagpauze als `07:00–12:30, 13:30–18:00` en dichte dagen als `Gesloten`.
- Een "Reserveer"-link vult het product al in op de bestelbon. Uitverkochte producten krijgen geen link en staan niet in de keuzelijst.
- Het anker van een categorie (`brood`) wordt het adres `assortiment#brood`.
