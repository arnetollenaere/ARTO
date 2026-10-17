#!/usr/bin/env bash
# Bouwt de site: kopieert src/ naar dist/.
# Wil je later een build-stap (bv. minify of een static site generator), voeg die hier toe.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
cp -r src dist
find dist -name '.gitkeep' -delete

echo "Gebouwd in dist/ ($(find dist -type f | wc -l | tr -d ' ') bestanden)"
