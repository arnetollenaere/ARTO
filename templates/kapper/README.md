# Omslag — template voor kappers en salons

Voor **{{NAAM}}** ({{DOMEIN}}). Gemaakt voor kapsalons, barbiers, schoonheidssalons en nagelstudio's.

## Ontwerpidee

De site is opgebouwd als een **high-fashion magazine**. Bone white papier, bijna zwarte inkt en één felle signaalkleur (standaard acid lime). Reusachtige didone-letters (Bodoni Moda) staan tegenover een smalle grotesk (Archivo) en een typemachinelettertype (IBM Plex Mono) voor labels, duur en prijzen.

- **Omslag**: de titel loopt over een schuin afgeknipt beeldvlak heen, met coverregels, een draaiend prijsetiket, een barcode en een "snijlijn" in de signaalkleur.
- **Inhoudstafel** als menu: een volledig scherm met genummerde pagina's.
- **Prijslijst als catalogus**: per categorie (Dames, Heren, Kinderen, Kleur, Verzorging …) een tabel met nummer, dienst, duur en prijs, met een vaste index opzij.
- **Lookbook**: een strook om horizontaal door te swipen, met beeldvlakken in vier vormen (boog, schuin, knip, capsule).
- **Team** als portretreeks met specialisaties, uitspraak en een knop "Boek bij …".
- **Credits**: de merken waarmee het salon werkt.
- Zonder foto's ziet alles er af uit: getekende haarpatronen (golf, krul, vlecht, coupe, fade) en monogrammen vullen de beeldvlakken.

## Pagina's

| Pagina | Inhoud |
|---|---|
| `/` | Omslag, lichtkrant, editoriaal, uitgelichte diensten, lookbook, team, reviews, merken, afspraak, adres en uren |
| `/prijzen` | Volledige prijslijst per categorie |
| `/team` | Alle stylisten met portret, specialisaties en boekknop, plus merken |
| `/404` | Pagina niet gevonden |

## Wat de klant zelf aanpast (beheerpaneel op `/beheer/`)

Kop en knop (editieregel), Omslag, Lichtkrant, Editoriaal, Uitgelichte diensten, Prijslijst (categorieën en diensten met duur, prijs, vanafprijs, uitlichten), Lookbook, Team, Merken, Reviews, Afspraak maken (boekingslink of formulier), Bezoek, Pagina niet gevonden, Voettekst, Menu, en de vaste blokken: algemeen, mededeling, contact, openingsuren, sociale media en vindbaarheid. Vier themakleuren: papier, inkt, signaalkleur, chroom.

## Online boeken

Werkt het salon met Salonized, Treatwell, Planity of Fresha? Vul de boekingslink in onder **Afspraak maken**: alle afspraakknoppen gaan dan naar dat systeem. Laat het veld leeg, dan komen aanvragen via het formulier binnen in **Berichten**.

## Foto's

- Altijd WebP, staand, en een korte beschrijving (alt-tekst) erbij.
- Coverfoto: minstens 1200×1500 px. Wordt schuin bijgesneden; houd het gezicht in het midden.
- Lookbook: 900×1125 px (4:5). Rustige achtergrond, haar als onderwerp.
- Portretten: 900×1200 px (3:4), liefst allemaal met hetzelfde licht en dezelfde achtergrond.
- Logo's van merken: SVG of PNG, zwart op transparant. Zonder logo staat de merknaam in letters, wat ook mooi is.

## Tips

- Pas de editieregel (bv. "Nº 15 — Lente/Zomer 2027") en de lookbook per seizoen aan: zo voelt de site levend.
- Kies als signaalkleur iets lichts en fels (lime, signaalrood-roze, fluogeel): er staat altijd inkt op.
- Houd diensten kort ("Knippen en brushen") en zet de uitleg in de toelichting.

Technisch: zie `CLAUDE.md` en `arto/README.md`. Lettertypes zelf gehost onder de SIL Open Font License (`src/fonts/LICENTIE.txt`).
