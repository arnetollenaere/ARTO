# ARTO

Dit is de centrale repository van ARTO ([artowebdesign.com](https://artowebdesign.com)), mijn web agency. Van hieruit beheer ik alle klanten, hun websites, de vaste werkwijze en de sjablonen waarmee ik nieuwe sites bouw.

## Wat staat waar

| Map | Waarvoor |
|---|---|
| [`bedrijven/`](bedrijven/README.md) | Eén map per klant waarvoor ik een website heb gemaakt: gegevens, toegang, status en logboek. |
| [`setup/`](setup/README.md) | Alles wat ik één keer moet instellen (accounts, tools op mijn computer), de vaste procedures (nieuwe klant, hosting, domein, optimalisatie, overdracht) en sjablonen zoals de klantfiche en de offerte. |
| [`paneel/`](paneel/README.md) | Het besloten controlepaneel van de agency: alle klanten, sitestatus, open punten en opdrachten voor Claude. Draait op Cloudflare Pages achter Cloudflare Access. |
| [`templates/`](templates/README.md) | Websitetemplates om snel een nieuwe klantsite te starten. |
| [`.claude/skills/`](.claude/skills/README.md) | Skills voor Claude Code, zodat ik de agency met gewone opdrachten kan beheren ("maak een nieuwe klant", "publiceer de site van X"). |

## Hoe ik werk

1. **Nieuwe klant**: ik vraag Claude "maak een nieuwe klant aan voor Bakkerij Peeters". Die maakt `bedrijven/bakkerij-peeters/` aan en zet een nieuwe site klaar vanuit een template in `templates/`.
2. **Bouwen**: de site zelf staat in een eigen GitHub-repo per klant (zoals de site van AMC). Zo kan ik de code later makkelijk aan de klant overdragen.
3. **Publiceren**: elke site draait op Cloudflare Pages. De klant bezit het domein en een eigen Cloudflare-account; ik ben daar uitgenodigd als beheerder. Zie [`setup/hosting-cloudflare.md`](setup/hosting-cloudflare.md).
4. **Onderhouden en optimaliseren**: aanpassingen, snelheid, SEO en toegankelijkheid doe ik met de skills `site-aanpassen` en `site-optimaliseren`. Elke wijziging komt in het logboek van de klant.
5. **Overdragen**: als een klant vertrekt of alles zelf wil beheren, volg ik [`setup/overdracht.md`](setup/overdracht.md).

## Snel starten met Claude Code

Open deze repo in Claude Code en zeg wat je wil. Voorbeelden:

- "Geef me een overzicht van alle klanten."
- "Maak een nieuwe klant aan: Bakkerij Peeters, domein bakkerijpeeters.be."
- "Publiceer de site van AMC."
- "Optimaliseer de site van Bakkerij Peeters."
- "Verander het telefoonnummer op de site van AMC."
- "Draag de site van Bakkerij Peeters over aan de klant."

Claude leest eerst [`CLAUDE.md`](CLAUDE.md) en kiest dan de juiste skill.

## Afspraken

- Alles in deze repo is in het Nederlands.
- Mapnamen van klanten zijn kleine letters met streepjes: `bakkerij-peeters`.
- Wachtwoorden en API-tokens komen **nooit** in deze repo. Ik noteer alleen *waar* ze staan (bijvoorbeeld "in de wachtwoordmanager onder ARTO / Bakkerij Peeters").
