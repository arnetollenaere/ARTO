# Accounts van ARTO

Dit zijn de accounts die ARTO zelf heeft. De accounts van klanten (hun Cloudflare, hun domein) staan in de fiche van elke klant.

| Account | Waarvoor | Notitie |
|---|---|---|
| **GitHub** (`arnetollenaere`) | Deze beheerrepo en de repo van elke klantsite. | Overweeg later een organisatie (bv. `arto-sites`) zodat klantrepo's los van je persoonlijke account staan en makkelijk over te dragen zijn. |
| **Cloudflare** (eigen account) | Om sites te testen voor ze naar de klant gaan, en om uitgenodigd te worden in klantaccounts. | Gebruik dezelfde e-mail als waarmee klanten je uitnodigen. Zet tweestapsverificatie aan. |
| **Wachtwoordmanager** | Alle wachtwoorden en API-tokens, per klant een map "ARTO / Klantnaam". | Bijvoorbeeld Bitwarden of 1Password. Nooit in deze repo. |
| **Zakelijke e-mail** | Communicatie met klanten en uitnodigingen. | |
| **Claude** | Claude Code om de agency vanuit deze repo te beheren. | |

## Tweestapsverificatie

Zet op GitHub en Cloudflare tweestapsverificatie aan. Wie je Cloudflare-account heeft, kan via de uitnodigingen in alle klantaccounts.

## API-tokens

Voor publiceren vanaf je computer of vanuit Claude Code gebruik je meestal `npx wrangler login` (inloggen in de browser). Heb je toch een API-token nodig (bv. voor automatisch publiceren via GitHub Actions):

- Maak per klant een token **in het account van de klant**, met alleen de rechten `Cloudflare Pages: Edit`.
- Bewaar het in de wachtwoordmanager en, als het voor GitHub Actions is, als secret in de repo van de klant.
- Noteer in `bedrijf.md` alleen dat er een token is en waar het staat.
