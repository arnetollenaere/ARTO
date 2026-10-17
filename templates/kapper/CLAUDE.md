# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het kappertemplate "Omslag". Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, prijslijst, lookbook, team, merken, reviews, uren, afspraakinstellingen, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- Pagina's in `src/`: `index.html` (omslag, editoriaal, uitgelicht, lookbook, team, reviews, merken, afspraak, bezoek), `prijzen.html` (catalogus), `team.html` (portretten), `404.html`. Gedeelde stukken in `src/_delen/`: `hoofd` (css/js), `kop` (masthead + inhoudstafel), `voet`, `boek` (de href van elke afspraakknop). Templatesyntax: zie `arto/README.md`.
- Prijslijst: `prijzen.categorieen[]` met `categorie`, `code`, `intro` en `diensten[]` (`naam`, `omschrijving`, `duur`, `prijs`, `vanaf`, `uitgelicht`). Prijs 0 of leeg toont `prijzen.opAanvraag`. `uitgelicht: true` zet de dienst op de startpagina. Gebruik in een dienst geen sleutel `categorie` of `code`: die worden van de categorie overgenomen.
- Afspraken: is `afspraak.boekingslink` ingevuld (Salonized, Treatwell, Planity …), dan gaan alle afspraakknoppen daarheen; anders naar het formulier op `/#afspraak`. Het formulier post naar `/api/bericht` met `_formulier=afspraak`; berichten verschijnen in het beheerpaneel. `?stylist=Voornaam` selecteert de stylist vooraf.
- Beeld: zonder foto tonen hero, lookbook en team getekende patronen uit `src/img/patronen.svg` (`golf`, `krul`, `vlecht`, `coupe`, `fade`, `kam`). Foto's van de klant komen in `src/img/uploads/` (WebP, staand: hero 1200×1500, look 900×1125, portret 900×1200) en altijd met een `alt`-tekst.
- Stijl in `src/css/omslag.css`, gedrag in `src/js/omslag.js` (bevestiging, stylist vooraf, vandaag in de uren, lookbookpijlen, actieve categorie). Geen frameworks of CDN's toevoegen.
- Kleuren: gebruik `var(--thema-<sleutel>, #fallback)` of de tokens bovenaan de CSS (`--papier`, `--inkt`, `--signaal`, `--chroom`). De signaalkleur staat altijd achter inkt, nooit als tekstkleur op papier (contrast).

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel). Bouwen: `./build.sh` — moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` en `navigatie` in `inhoud.json` (de sitemap komt er vanzelf).

## Afspraken

- De gegevens van de klant (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, afbeeldingen in WebP met `width` en `height`, `loading="lazy"` behalve bovenaan, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een foto, dan blijft het getekende patroon staan.
