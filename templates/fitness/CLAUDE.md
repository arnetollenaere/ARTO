# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO met het fitnesstemplate **Splittijd**. Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, lestypes, het weekrooster, passen en prijzen, coaches, getuigenissen, proeflesformulier, contact, openingsuren, SEO. Pas inhoud daar aan, nooit in de HTML. Het beheerpaneel (`/beheer/`) bewerkt hetzelfde bestand.
- `template.json` beschrijft welke velden het beheerpaneel toont. Nieuw veld nodig? Voeg het toe in `template.json`, vul het in `inhoud.json` en gebruik het in `src/`.
- `src/` bevat de pagina's (`index.html`, `rooster.html`, `tarieven.html`, `404.html`) met de ARTO-templatesyntax (`{{ veld }}`, `{{#elk lijst}}`, `{{#als}}`, zie `arto/README.md`). Gedeelde stukken staan in `src/_delen/` (`hoofd`, `kop`, `voet`, `passen`).
- Stijl: `src/css/volt.css`. Interactie (tellers, volgende les, rooster, filter, bevestiging): `src/js/volt.js`. Geen frameworks of CDN's toevoegen.
- Kleuren komen uit `inhoud.json` → `thema.kleuren` en verschijnen als `--thema-accent`, `--thema-achtergrond`, `--thema-vlak`, `--thema-tekst`, `--thema-gedempt`. Gebruik in CSS altijd `var(--a)` enz. (die verwijzen ernaar), geen nieuwe vaste kleuren.

## Belangrijk bij het rooster

- Elke les in `rooster.lessen` heeft `dag` (Maandag…Zondag), `start` en `einde` (`HH:MM`), `type`, `coach`, `niveau`, `zaal`.
- `type` moet **exact** gelijk zijn aan een `naam` in `lestypes.lijst`, anders werkt het filter niet voor die les.
- `rooster.dagen` bepaalt welke kolommen er zijn; `rooster.vanUur` en `rooster.totUur` de tijdas. Lessen buiten dat bereik vallen buiten de tabel.
- Overlappende lessen op dezelfde dag krijgen automatisch elk een eigen baan.

## Werkwijze

- Lokaal bekijken met beheerpaneel: `./dev.sh` (http://localhost:8790 en /beheer/).
- Bouwen: `./build.sh`. Het moet eindigen zonder regels met `let op:`.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- De gegevens van de klant (contact, domein, afspraken) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd `inhoud.json` daarmee in lijn.
- Na elke wijziging: noteer ze in `bedrijven/<slug>/logboek.md` in de ARTO-repo.

## Optimalisatieregels (ARTO/setup/optimalisatie.md)

- Elke pagina één `<h1>`, unieke titel en beschrijving via `seo.paginas` in `inhoud.json`. Nieuwe pagina? Voeg ze daar toe; de sitemap volgt vanzelf.
- Foto's in WebP, op maat, met `width`, `height`, `alt` en `loading="lazy"`. Coachfoto's staand (4:5).
- Lettertypes blijven zelf gehost in `src/fonts/` (Big Shoulders Display, Archivo, JetBrains Mono). CSS + JS samen onder 60 kB houden.
- Contrast minstens 4,5:1. Kiest de klant een andere accentkleur, controleer dan zwarte tekst op die kleur en die kleur op de achtergrond.
- Beweging respecteert `prefers-reduced-motion`; voeg geen animaties toe die dat negeren.
