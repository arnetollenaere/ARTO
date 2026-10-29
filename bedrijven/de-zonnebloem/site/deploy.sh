#!/usr/bin/env bash
# Publiceert dist/ naar Cloudflare Pages.
# Gebruik: ./deploy.sh            -> productie
#          ./deploy.sh preview    -> testversie op een aparte URL
set -euo pipefail
cd "$(dirname "$0")"

PROJECT="de-zonnebloem"

if [ ! -d dist ]; then
  echo "dist/ bestaat niet. Voer eerst ./build.sh uit." >&2
  exit 1
fi

# Account-ID van de klant (geen geheim). Zie ARTO/setup/hosting-cloudflare.md.
if [ -s .cloudflare-account ]; then
  CLOUDFLARE_ACCOUNT_ID="$(tr -d '[:space:]' < .cloudflare-account)"
  export CLOUDFLARE_ACCOUNT_ID
fi

# Toon het rekeningnummer dat met deze versie online komt, en controleer het.
IBAN="$(node -e 'console.log(require("./src/instellingen.json").betaling.iban)')"
if node -e '
  const s = require("./src/instellingen.json").betaling.iban.replace(/\s+/g, "").toUpperCase();
  const o = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let r = 0; for (const c of o) r = (r * 10 + Number(c)) % 97;
  process.exit(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s) && r === 1 ? 0 : 1);'; then
  echo "Rekeningnummer in deze versie: $IBAN (geldig)"
else
  echo "LET OP: rekeningnummer in deze versie is ongeldig of een voorbeeld: $IBAN" >&2
fi

if [ "${1:-}" = "preview" ]; then
  npx wrangler pages deploy dist --project-name="$PROJECT" --branch=preview
else
  npx wrangler pages deploy dist --project-name="$PROJECT" --branch=main
fi
