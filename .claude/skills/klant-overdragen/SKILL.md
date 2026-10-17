---
name: klant-overdragen
description: Begeleidt de overdracht van een website aan de klant (code, toegang, overdrachtsdocument) en werkt de fiche bij. Gebruik bij "draag over", "klant stopt", "klant wil alles zelf beheren".
---

# Klant overdragen

Volg `setup/overdracht.md`. Deze stappen zijn moeilijk terug te draaien, dus vraag bij elke stap die iets buiten deze repo verandert eerst bevestiging aan Arne.

1. **Fiche lezen**: `bedrijven/<slug>/bedrijf.md`, vooral "Afspraken → Wie bezit de code". Staat dat er niet, vraag het.
2. **Overdrachtsdocument maken**: kopieer `setup/sjablonen/documenten/overdracht.md` naar `bedrijven/<slug>/overdracht-<datum>.md` en vul alles in vanuit de fiche. Laat geen `{{VELD}}` staan; wat je niet weet, vraag je.
3. **Code**: leg Arne de juiste optie voor (repo overdragen via GitHub Settings → Transfer ownership, of zip van de repo of van `dist/`). Een repo-overdracht doet Arne zelf of jij alleen na zijn uitdrukkelijke akkoord.
4. **Publiceren**: was de site via Git gekoppeld, zeg dat het project in Cloudflare opnieuw aan de overgedragen repo moet worden gekoppeld.
5. **Toegang**: herinner Arne eraan om de klant te vragen hem uit het Cloudflare-account te verwijderen, en zelf API-tokens en de map in de wachtwoordmanager op te ruimen.
6. **Fiche en logboek**: als Arne bevestigt dat het rond is, zet status `overgedragen`, "Arne uitgenodigd als Administrator: nee", en voeg een logboekregel toe. Commit in deze repo.

Meld op het einde wat klaar is en wat Arne of de klant nog moet doen.
