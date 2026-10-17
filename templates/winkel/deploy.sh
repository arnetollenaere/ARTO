#!/usr/bin/env bash
# Publiceert dist/ naar Cloudflare Pages.
# Gebruik: ./deploy.sh            -> productie
#          ./deploy.sh preview    -> testversie op een aparte URL
set -euo pipefail
cd "$(dirname "$0")"

PROJECT="{{PROJECT}}"

if [ ! -d dist ]; then
  echo "dist/ bestaat niet. Voer eerst ./build.sh uit." >&2
  exit 1
fi

# Account-ID van de klant (geen geheim). Zie ARTO/setup/hosting-cloudflare.md.
if [ -s .cloudflare-account ]; then
  CLOUDFLARE_ACCOUNT_ID="$(tr -d '[:space:]' < .cloudflare-account)"
  export CLOUDFLARE_ACCOUNT_ID
fi

if [ "${1:-}" = "preview" ]; then
  npx wrangler pages deploy dist --project-name="$PROJECT" --branch=preview
else
  npx wrangler pages deploy dist --project-name="$PROJECT" --branch=main
fi
