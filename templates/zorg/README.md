# {{NAAM}}

Website van {{NAAM}}, gemaakt door ARTO op het zorgtemplate **Luwte**. Live op https://{{DOMEIN}}.

## Voor wie

Kinesisten, tandartsen, psychologen, osteopaten, diëtisten en groepspraktijken. De demo-inhoud is een fictieve groepspraktijk in Sint-Amandsberg (Gent): kinesitherapie, osteopathie en psychologie.

## Ontwerpidee

"Kalm-futuristisch": een site die zelf rust uitstraalt. Zachte organische vormen in salie en mint die heel traag van vorm veranderen, een ademcirkel die mee in- en uitademt, diep bosgroen op warm wit. De ronde, warme grotesk Parkinsans draagt het ontwerp in grote maten; Figtree voor lopende tekst, Martian Mono voor kleine labels, tarieven en RIZIV-nummers. Grote tekst, sterk contrast, duidelijke knoppen en een zwevende afspraakknop op de gsm. Alle beweging stopt bij "beweging beperken" in het besturingssysteem.

## Pagina's

- **Start** (`index.html`): titel met ademcirkel, kerncijfers, "herken je jezelf hierin?" (voor wie / wanneer), uitgelichte behandelingen met duur, tarief en terugbetaling, je eerste afspraak in stappen, team, praktisch (meebrengen, annuleren, rolstoel, parking, openbaar vervoer, betalen, adres en uren), veelgestelde vragen.
- **Behandelingen** (`behandelingen.html`): alle behandelingen met uitleg, duur, tarief, terugbetaling, voorschrift nodig of niet, en een kader "hoe werkt terugbetaling?".
- **Team** (`team.html`): elke zorgverlener met beroep, specialisaties, talen, aanwezigheidsdagen, RIZIV- of erkenningsnummer en conventie.
- **404**: vriendelijke foutpagina.
- Op elke pagina: **Afspraak maken** (knop naar de online agenda, bv. Rosa of Doctoranytime, plus een aanvraagformulier en het telefoonnummer) en onderaan de **noodnummers**.

## Velden in het beheerpaneel

Naast de vaste velden (algemeen, contact, uren, sociale media, vindbaarheid, mededeling):

- **Menu en knoppen**: woorden in het menu en op de afspraakknop.
- **Startpagina: bovenaan**: label, titel (met gekleurd slot), inleiding, knoppen, woorden in de ademcirkel, optionele foto.
- **Kerncijfers**: drie of vier korte feiten.
- **Afspraak maken**: link en naam van de online agenda, teksten, alle woorden in het formulier.
- **Voor wie / wanneer**: situaties en wie helpt, plus "wanneer beter niet bij ons".
- **Behandelingen en tarieven**: per behandeling naam, categorie, korte zin, uitleg, duur, tarief, terugbetaling, wat je zelf betaalt, voorschrift, op de startpagina tonen; kader over terugbetaling.
- **Team**: per zorgverlener naam, initialen, beroep, specialisaties, talen, RIZIV-nummer, geconventioneerd, dagen, bio, foto.
- **Je eerste afspraak**: stappen.
- **Praktisch**: wat meebrengen, infoblokken met icoon (annuleren, rolstoel, parking, openbaar vervoer, betalen, info).
- **Veelgestelde vragen**, **Noodnummers**, **Onderaan de site**, **Subpagina's: koppen**, **Pagina niet gevonden**.

## Foto's

Het ontwerp is af zonder foto's. Wil de praktijk toch foto's:

- **Startpagina**: één rustige foto van de praktijk of een behandelruimte, staand, minstens 900×1100 px. Ze krijgt een organische vorm.
- **Team**: vierkante portretten, minstens 800×800 px, rustige effen achtergrond, iedereen op dezelfde hoogte in beeld. Zonder foto tonen we de initialen in een vorm.
- Altijd WebP, en altijd een beschrijving (alt-tekst) invullen.

## Lokaal bekijken

```bash
./dev.sh          # http://localhost:8790 en http://localhost:8790/beheer/
```

## Publiceren

```bash
./build.sh && ./deploy.sh preview    # testversie
./build.sh && ./deploy.sh            # productie
```
