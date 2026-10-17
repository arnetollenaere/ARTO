# Werkplek

Wat je op je computer nodig hebt om met ARTO te werken.

## Tools

| Tool | Waarvoor | Installeren |
|---|---|---|
| git | Code bijhouden en naar GitHub sturen. | https://git-scm.com |
| Node.js (LTS) | Nodig voor Wrangler en eventuele build-stappen. | https://nodejs.org |
| Wrangler | Cloudflare-tool om sites te publiceren. | Hoeft niet apart: `npx wrangler ...` haalt het op. |
| Claude Code | De agency beheren met gewone opdrachten. | https://claude.com/claude-code |

Controleer alles in één keer:

```bash
./setup/scripts/check-tools.sh
```

## Mappen op je computer

Zet de beheerrepo en de klantsites naast elkaar:

```
~/arto/
├── ARTO/          # deze repo
├── amc/           # site van een klant
└── bakkerij-peeters/
```

```bash
mkdir -p ~/arto && cd ~/arto
git clone https://github.com/arnetollenaere/ARTO.git
```

De skills gaan ervan uit dat een klantsite in `../<repo-naam>` staat, naast deze repo. Staat ze er nog niet, dan cloned Claude ze daar.

## Inloggen bij Cloudflare

```bash
npx wrangler login
```

Dit opent de browser. Omdat je in de klantaccounts als Administrator bent uitgenodigd, kan je na het inloggen ook naar die accounts publiceren. Heb je toegang tot meerdere accounts, dan zegt Wrangler welk account je moet kiezen. Het `deploy.sh`-script van elke site leest daarom het account-ID uit het bestand `.cloudflare-account` in de site-repo (het ID vind je rechts op de overzichtspagina van het account in het Cloudflare-dashboard). Een account-ID is geen geheim; het mag in de repo.
