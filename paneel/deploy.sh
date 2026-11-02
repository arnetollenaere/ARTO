#!/usr/bin/env bash
# Bouwt en publiceert het ARTO-controlepaneel naar Cloudflare Pages (project arto-paneel).
# Gebruik: ./deploy.sh            -> productie
#          ./deploy.sh preview    -> testversie op een aparte URL
# Nodig: CLOUDFLARE_API_TOKEN en CLOUDFLARE_ACCOUNT_ID in de omgeving
# (of eenmalig `npx wrangler login`). Zie README.md.
set -euo pipefail
cd "$(dirname "$0")"

node build.mjs

TAK=main
[ "${1:-}" = "preview" ] && TAK=preview

# Maak het project aan als het nog niet bestaat.
if ! npx --yes wrangler@4 pages project list 2>/dev/null | grep -q "arto-paneel"; then
  npx --yes wrangler@4 pages project create arto-paneel --production-branch=main
fi

npx --yes wrangler@4 pages deploy --branch="$TAK" --commit-dirty=true
