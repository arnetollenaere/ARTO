# Instructies voor Claude in de ARTO-repo

Dit is de beheerrepo van ARTO, de web agency van Arne. Schrijf altijd in het Nederlands.

## Structuur

- `bedrijven/<slug>/` is één klant. `bedrijf.md` bevat de gegevens (contact, domein, repo, Cloudflare-project, status). `logboek.md` houdt elke wijziging bij, nieuwste bovenaan.
- `setup/` bevat de eenmalige setup, de vaste procedures, scripts en sjablonen (klantfiche, offerte, overdracht). Volg die procedures in plaats van zelf een werkwijze te verzinnen.
- `templates/` bevat websitetemplates. Pas sjablonen alleen aan als Arne dat vraagt; voor één klant werk je in de kopie.
- `.claude/skills/` bevat de skills voor het dagelijkse beheer.

## Regels

- De site van een klant staat in een eigen GitHub-repo (veld `Repo` in `bedrijf.md`). Clone die repo naast deze repo, niet erin, tenzij de fiche zegt dat de site in `bedrijven/<slug>/site/` staat.
- Hosting is Cloudflare Pages. De klant bezit het domein en het Cloudflare-account; Arne is daar Administrator.
- Zet nooit wachtwoorden, API-tokens of andere geheimen in deze repo. Noteer alleen waar ze bewaard worden.
- Na elke wijziging aan een klantsite: voeg een regel toe aan `bedrijven/<slug>/logboek.md` met datum, wat er veranderde en of het gepubliceerd is.
- Publiceren naar productie doe je pas als Arne dat in dit gesprek vraagt.
- Ontbreekt een gegeven in `bedrijf.md`, vraag het dan aan Arne en vul het daarna in.
