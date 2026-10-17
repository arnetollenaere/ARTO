# Instructies voor Claude: site van {{NAAM}}

Dit is de website van {{NAAM}} ({{DOMEIN}}), gebouwd en beheerd door ARTO op het bouwtemplate "Maatlijn". Schrijf in het Nederlands.

## Hoe de site werkt

- **Alle inhoud staat in `inhoud.json`**: teksten, diensten, projecten, werfplanning, werkgebied, erkenningen, offerteformulier, uren, kleuren. Pas inhoud daar aan, niet in de HTML. Wat het beheerpaneel toont, staat in `template.json`; voeg je een nieuw stuk tekst toe, maak er dan ook een veld voor (met Nederlands label en `hulp`).
- Pagina's in `src/`: `index.html`, `projecten.html`, `offerte.html`, `404.html`. Gedeelde stukken in `src/_delen/`: `kop`, `voet` (met de vaste belbalk op gsm), `fiche` (projectfiche met voor/na-schuif), `patronen` (SVG-arceringen), `tek-doorsnede` (hero-tekening) en `tek-gevel`, `tek-dak`, `tek-keuken`, `tek-ramen` (tekeningen als een project geen foto's heeft). Templatesyntax: zie `arto/README.md`.
- Stijl in `src/css/stijl.css`, gedrag in `src/js/site.js` (menu, maatlijnen, coördinaten, voor/na-schuif, weekschaal, kaart, projectfilter, offertestappen). Geen frameworks of CDN's toevoegen. Alles moet zonder JavaScript leesbaar blijven.
- Kleuren: `var(--thema-<sleutel>, #fallback)` of de tokens bovenaan de CSS (`--geel`, `--oranje`, `--papier`, `--inkt`, `--beton`). Geel = af te breken, oranje = nieuw, zoals op een Belgische bouwaanvraag. Houd geel licht genoeg voor donkere tekst.
- Arceringen (`arcering`): `metselwerk`, `hout`, `isolatie`, `beton`, `tegel`, `staal`. Een nieuw patroon voeg je toe in `_delen/patronen.html` (id `p-<naam>`) én als optie in `template.json`.
- Werkgebied: elke gemeente heeft een afstand in km en een windrichting (N, NO, O, ZO, Z, ZW, W, NW); de kaart berekent de positie met CSS. Afstanden boven `regio.straal` komen op de buitenste cirkel.
- Werfplanning: `start` en `weken` per fase zijn weeknummers binnen `werkwijze.weken`.
- Het offerteformulier post naar `/api/bericht` met `_formulier=offerte`; aanvragen verschijnen in het beheerpaneel onder Berichten. Na verzenden toont de pagina de bevestiging (`?verzonden=1`).

## Bouwen en publiceren

- Lokaal: `./dev.sh` (site + beheerpaneel). Bouwen: `./build.sh` — moet eindigen zonder "let op:"-meldingen.
- Publiceren: `./deploy.sh preview` voor een testversie, `./deploy.sh` voor productie. **Publiceer naar productie alleen als Arne dat vraagt.** Toon eerst een preview.
- Nieuwe pagina? Voeg ze toe aan `seo.paginas` in `inhoud.json` (de sitemap komt er vanzelf) en aan het menu in `_delen/kop.html`.

## Afspraken

- De gegevens van de klant (contact, domein, erkenningsnummers, VCA-certificaat) staan in de ARTO-repo onder `bedrijven/<slug>/bedrijf.md`. Houd de site daarmee in lijn; zet nooit een erkenning of certificaat online dat de klant niet echt heeft.
- Noteer na elke wijziging wat je deed in `bedrijven/<slug>/logboek.md` in de ARTO-repo.
- Houd je aan `ARTO/setup/optimalisatie.md`: één `<h1>` per pagina, unieke title en description (via `seo`), alt-teksten, foto's in WebP met `width` en `height`, `loading="lazy"`, contrast minstens 4,5:1, `prefers-reduced-motion` respecteren.
- Geen emoji als iconen, geen stockfoto's, geen lorem ipsum. Ontbreekt een foto, dan blijft de getekende fallback staan.
