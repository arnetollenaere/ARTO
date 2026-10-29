# Bedrijven

Hier staat één map per bedrijf waarvoor ARTO een website heeft gemaakt (of aan het maken is).

## Huidige klanten

| Bedrijf | Map | Domein |
|---|---|---|
| AMC (Algemeen Metaal Constructiebedrijf) | [`amc/`](amc/bedrijf.md) | amc.be |
| Dr. Yves Depaepe Orthopedie | [`orthopedie-depaepe/`](orthopedie-depaepe/bedrijf.md) | orthopedie-depaepe.be |
| House of Beauty by Alana | [`house-of-beauty-by-alana/`](house-of-beauty-by-alana/bedrijf.md) | houseofbeautybyalana.be |
| De Zonnebloem (wijnactie) | [`de-zonnebloem/`](de-zonnebloem/bedrijf.md) | de-zonnebloem.pages.dev |
| Arne Tollenaere (eigen portfolio) | [`arnetollenaere/`](arnetollenaere/bedrijf.md) | arnetollenaere.com |

Voor de actuele status vraag je Claude om een overzicht (skill `overzicht`).

## Inhoud van een bedrijfsmap

```
bedrijven/
└── bakkerij-peeters/
    ├── bedrijf.md     # de fiche: contact, domein, repo, hosting, status
    ├── logboek.md     # elke wijziging, nieuwste bovenaan
    └── bestanden/     # optioneel: logo, foto's, teksten die de klant aanleverde
```

- **`bedrijf.md`** is de enige plek waar de gegevens van de klant staan. Klopt er iets niet meer (nieuw telefoonnummer, ander domein), pas het hier aan.
- **`logboek.md`** toont wat er wanneer gebeurde: oplevering, aanpassingen, publicaties, afspraken. Handig als een klant vraagt "wanneer hebben we dat veranderd?".
- **`bestanden/`** is voor materiaal van de klant dat nog niet in de site zit. Grote bestanden (video's, ruwe foto's) horen hier niet; zet die in de cloudopslag en noteer de link in de fiche.

De code van de website zelf staat **niet** hier maar in een eigen GitHub-repo per klant (zie het veld `Repo` in de fiche). Zo kan de code apart worden overgedragen.

## Een nieuw bedrijf toevoegen

Het snelst: vraag Claude "maak een nieuwe klant aan voor ...". Dat gebruikt de skill `nieuwe-klant`.

Met de hand:

```bash
./setup/scripts/nieuwe-klant.sh "Bakkerij Peeters"
```

Dit kopieert `setup/sjablonen/bedrijf/` naar `bedrijven/bakkerij-peeters/`. Vul daarna `bedrijf.md` in.

## Status van een klant

Elke fiche heeft een veld `Status`. Gebruik altijd een van deze waarden, zodat het overzicht klopt:

| Status | Betekenis |
|---|---|
| `offerte` | Offerte verstuurd, nog niet akkoord. |
| `in opbouw` | Akkoord, de site wordt gebouwd. |
| `online` | Site staat live, ARTO doet het onderhoud. |
| `overgedragen` | Klant beheert alles zelf, ARTO heeft geen toegang meer. |
| `gestopt` | Samenwerking beëindigd of site offline. |

## Overzicht

Vraag Claude "geef me een overzicht van alle klanten" (skill `overzicht`) voor een tabel met alle bedrijven, hun status en domein.
