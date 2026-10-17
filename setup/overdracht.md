# Overdracht aan de klant

Als een klant alles zelf wil beheren of de samenwerking stopt. Omdat de klant het domein en het Cloudflare-account al bezit, gaat het vooral om de code en jouw toegang. Claude doet dit met de skill `klant-overdragen`.

## Stappen

1. **Controleer het contract**: wie bezit de code? Staat in `bedrijf.md` onder "Afspraken".
2. **Code overdragen**
   - Klant bezit de code: GitHub-repo → **Settings → Transfer ownership** naar het GitHub-account van de klant. Heeft de klant geen GitHub, geef dan een zip van de repo.
   - ARTO bezit de code: geef de klant een zip van de gebouwde site (`dist/`) zodat die ergens anders kan draaien, of spreek een licentie af.
3. **Automatisch publiceren**: was de site via Git gekoppeld (manier B), koppel het project dan opnieuw aan de overgedragen repo, of zet het om naar manier A.
4. **Overdrachtsdocument**: vul [`setup/sjablonen/documenten/overdracht.md`](sjablonen/documenten/overdracht.md) in en stuur het naar de klant. Het legt uit waar alles staat en hoe ze de site aanpassen.
5. **Toegang**: de klant verwijdert Arne uit het Cloudflare-account (**Manage Account → Members**). Arne verwijdert eventuele API-tokens die hij voor deze klant maakte en ruimt de map in de wachtwoordmanager op.
6. **Fiche bijwerken**: status `overgedragen`, "Arne uitgenodigd als Administrator: nee", en een regel in het logboek.

## Wat niet verandert

- Het domein en de site blijven gewoon online.
- De map `bedrijven/<slug>/` blijft bestaan als archief.
