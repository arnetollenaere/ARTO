#!/usr/bin/env bash
# Bouwt de site: rendert src/ met inhoud.json naar dist/ en voegt het beheerpaneel toe.
# De ARTO-kern staat in arto/ (in een klantrepo) of in ../_kern (in de ARTO-repo zelf).
set -euo pipefail
cd "$(dirname "$0")"
KERN=arto; [ -d "$KERN" ] || KERN=../_kern
node "$KERN/bouw.mjs" .
