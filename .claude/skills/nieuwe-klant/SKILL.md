---
name: nieuwe-klant
description: Maakt een nieuwe klant aan in ARTO (bedrijfsmap met fiche en logboek) en zet desgevraagd een nieuwe site klaar vanuit een template. Gebruik bij "nieuwe klant", "voeg bedrijf toe", "start een site voor ...".
---

# Nieuwe klant

Volg `setup/nieuwe-klant.md`. Kort:

## 1. Gegevens verzamelen

Haal uit het gesprek wat je kan: naam van het bedrijf, contactpersoon, e-mail, telefoon, adres, gewenst domein, sector, korte beschrijving. Vraag **niet** naar alles vooraf; naam is genoeg om te starten. Wat ontbreekt, laat je leeg in de fiche en som je op het einde op.

## 2. Bedrijfsmap aanmaken

```bash
./setup/scripts/nieuwe-klant.sh "<Naam>"          # slug wordt automatisch gemaakt
./setup/scripts/nieuwe-klant.sh "<Naam>" <slug>   # eigen slug
```

Bestaat de map al, stop dan en zeg het tegen Arne. Vul daarna `bedrijven/<slug>/bedrijf.md` in met wat je weet. Status: `offerte`, tenzij Arne zegt dat het akkoord is (`in opbouw`).

## 3. Site klaarzetten (alleen als Arne dat vraagt of de status `in opbouw` is)

1. Kies het template: bekijk `templates/README.md` en neem het template dat bij de sector past; anders `site-basis`. Zeg welk je koos.
2. Maak de site naast deze repo:

   ```bash
   TEMPLATE=<template> ./setup/scripts/nieuwe-site.sh ../<slug> \
     NAAM="..." DOMEIN=... PROJECT=<slug> BESCHRIJVING="..." \
     TELEFOON="..." EMAIL=... ADRES="..."
   ```

3. In `../<slug>`: verwijder de sectie "Velden in te vullen" uit `README.md`, dan `git init -b main`, eerste commit.
4. Een GitHub-repo aanmaken en pushen doe je alleen als je daarvoor toegang hebt en Arne het vraagt; anders geef je hem de commando's uit `setup/nieuwe-klant.md` stap 3. Gebruik een **private** repo met de slug als naam.
5. Vul `Repo`, `Template gebruikt` en `Cloudflare Pages-project` in de fiche in.

## 4. Afronden

- Voeg een regel toe aan `bedrijven/<slug>/logboek.md`.
- Commit in deze repo: `Nieuwe klant: <Naam>`.
- Meld aan Arne: wat er is aangemaakt, welke velden nog ontbreken, en de volgende stap (meestal: klant laten weten wat die moet doen voor hosting, zie `setup/hosting-cloudflare.md#wat-de-klant-doet`; bied aan die tekst klaar te zetten).
