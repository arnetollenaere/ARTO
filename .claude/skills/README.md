# Skills

Skills zijn vaste werkwijzen voor Claude Code. Open deze repo in Claude Code en zeg gewoon wat je wil; Claude kiest zelf de juiste skill. Je kan er ook één rechtstreeks oproepen met `/<naam>`, bijvoorbeeld `/overzicht`.

| Skill | Wat het doet | Zeg bijvoorbeeld |
|---|---|---|
| [`overzicht`](overzicht/SKILL.md) | Tabel van alle klanten met status, domein en wat er nog moet gebeuren. | "Geef me een overzicht van alle klanten." |
| [`nieuwe-klant`](nieuwe-klant/SKILL.md) | Maakt de bedrijfsmap aan en zet een site klaar vanuit een template. | "Nieuwe klant: Bakkerij Peeters, bakkerijpeeters.be." |
| [`site-aanpassen`](site-aanpassen/SKILL.md) | Voert een wijziging door op een klantsite en houdt het logboek bij. | "Zet de nieuwe openingsuren op de site van House of Beauty by Alana." |
| [`site-publiceren`](site-publiceren/SKILL.md) | Bouwt en publiceert naar Cloudflare Pages (preview of live). | "Publiceer de site van Bakkerij Peeters live." |
| [`site-optimaliseren`](site-optimaliseren/SKILL.md) | Volledige check en verbetering van snelheid, SEO en toegankelijkheid, met scores voor en na. | "Optimaliseer de site van Orthopedie Depaepe." |
| [`klant-overdragen`](klant-overdragen/SKILL.md) | Begeleidt de overdracht van code en toegang aan de klant. | "Bakkerij Peeters wil alles zelf beheren, draag over." |

## Veiligheid

- Claude publiceert pas **live** als je dat uitdrukkelijk vraagt; anders maakt het een preview.
- Stappen die buiten deze repo iets veranderen en moeilijk terug te draaien zijn (repo overdragen, toegang wegnemen) vragen altijd eerst bevestiging.
- Wachtwoorden en tokens komen nooit in deze repo.

## Een skill toevoegen of aanpassen

Elke skill is een map met een `SKILL.md`. Bovenaan staan `name` en `description`; de description bepaalt wanneer Claude de skill gebruikt, dus schrijf daar duidelijk in bij welke vragen ze hoort. Daaronder staan de stappen. Verwijs zoveel mogelijk naar de procedures in `setup/` zodat de uitleg op één plek staat.
