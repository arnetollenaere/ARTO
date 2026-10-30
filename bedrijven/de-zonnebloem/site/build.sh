#!/usr/bin/env bash
# Bouwt de site: kopieert src/ naar dist/.
# Daarna vult scripts/bouw.mjs de pagina aan met inhoud uit wijnen.json en instellingen.json.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
cp -r src dist
find dist -name '.gitkeep' -delete

# Wijnen, FAQ, gestructureerde gegevens, llms.txt en sitemap uit de JSON-bestanden.
node scripts/bouw.mjs

echo "Gebouwd in dist/ ($(find dist -type f | wc -l | tr -d ' ') bestanden)"
