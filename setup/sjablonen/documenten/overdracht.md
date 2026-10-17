# Overdracht website — {{NAAM}}

**Datum:** {{DATUM}}

Vanaf vandaag beheer je je website zelf. Hieronder staat waar alles staat.

## Wat je bezit

| Wat | Waar | Inloggen met |
|---|---|---|
| Domein {{DOMEIN}} | {{registrar}} | {{e-mail}} |
| Hosting | Cloudflare, project {{PROJECT}} | {{e-mail}} |
| Code van de site | {{GitHub-repo of meegeleverde zip}} | {{GitHub-account}} |

## Wat je moet doen

1. Verwijder ARTO uit je Cloudflare-account: **Manage Account → Members**, verwijder {{e-mail van Arne}}.
2. Verleng je domein elk jaar (zet automatisch verlengen aan bij {{registrar}}).
3. Zet tweestapsverificatie aan op je Cloudflare-account.

## De site aanpassen

De site bestaat uit gewone HTML- en CSS-bestanden in de map `src/`. Een webontwikkelaar kan ze meteen aanpassen. Publiceren gaat met:

```bash
./build.sh && ./deploy.sh
```

## Vragen

Hulp nodig na de overdracht? Contacteer ARTO via {{e-mail}}; dat kan aan het uurtarief.
