# Setup

Alles wat je moet instellen om ARTO te draaien, en de vaste procedures die je bij elke klant volgt.

## Eenmalig (bij de start, of op een nieuwe computer)

1. [Accounts](accounts.md): welke accounts ARTO zelf nodig heeft (GitHub, Cloudflare, wachtwoordmanager, e-mail).
2. [Werkplek](werkplek.md): de tools op je computer (git, Node.js, Wrangler, Claude Code) en hoe je deze repo opent.

Controleer daarna of alles staat:

```bash
./setup/scripts/check-tools.sh
```

## Bij elke klant

| Stap | Document | Skill |
|---|---|---|
| 1. Nieuwe klant aanmaken en site opzetten | [nieuwe-klant.md](nieuwe-klant.md) | `nieuwe-klant` |
| 2. Hosting en domein koppelen | [hosting-cloudflare.md](hosting-cloudflare.md) | `site-publiceren` |
| 3. Publiceren en aanpassen | [hosting-cloudflare.md](hosting-cloudflare.md#publiceren) | `site-publiceren`, `site-aanpassen` |
| 4. Beheerpaneel online activeren | [beheerpaneel.md](beheerpaneel.md) | |
| 5. Optimaliseren | [optimalisatie.md](optimalisatie.md) | `site-optimaliseren` |
| 6. Overdragen aan de klant | [overdracht.md](overdracht.md) | `klant-overdragen` |

## Scripts

| Script | Wat het doet |
|---|---|
| [`scripts/nieuwe-klant.sh`](scripts/nieuwe-klant.sh) | Maakt `bedrijven/<slug>/` aan vanuit het sjabloon. |
| [`scripts/nieuwe-site.sh`](scripts/nieuwe-site.sh) | Maakt een nieuwe site aan vanuit een template en vult de klantgegevens in. |
| [`scripts/beheer-activeren.sh`](scripts/beheer-activeren.sh) | Zet de wachtwoorden en het GitHub-token voor het online beheerpaneel in Cloudflare. |
| [`scripts/kern-bijwerken.sh`](scripts/kern-bijwerken.sh) | Zet de nieuwste versie van het beheerpaneel en de build in een bestaande site. |
| [`scripts/check-tools.sh`](scripts/check-tools.sh) | Controleert of de nodige tools geïnstalleerd zijn. |

## Sjablonen

| Sjabloon | Waarvoor |
|---|---|
| [`sjablonen/bedrijf/`](sjablonen/bedrijf/) | Fiche en logboek voor een nieuwe klant (gebruikt door `nieuwe-klant.sh`). |
| [`sjablonen/documenten/offerte.md`](sjablonen/documenten/offerte.md) | Offerte voor een nieuwe website. |
| [`sjablonen/documenten/overdracht.md`](sjablonen/documenten/overdracht.md) | Document voor de klant bij overdracht. |

Websitetemplates staan apart in [`templates/`](../templates/README.md).

## Waarom deze keuzes

De hostingkeuze (Cloudflare) en het eigendomsmodel (klant bezit domein en account) komen uit het onderzoek van 17 oktober 2026. Kort: Cloudflare laat commercieel gebruik toe op het gratis plan, heeft geen bandbreedtelimiet voor statische sites, en een site blijft online als je een limiet raakt. Vercel Hobby en GitHub Pages verbieden commercieel gebruik; Netlify Free pauzeert sites als de credits op zijn.
