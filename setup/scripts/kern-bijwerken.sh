#!/usr/bin/env bash
# Zet de nieuwste ARTO-kern (beheerpaneel, build, API) in een bestaande klantsite.
# Raakt de inhoud (inhoud.json, src/) niet aan.
# Gebruik: ./setup/scripts/kern-bijwerken.sh ../bakkerij-peeters
set -euo pipefail
doel="${1:?Geef de map van de klantsite}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
[ -f "$doel/template.json" ] || { echo "$doel is geen site met een sectortemplate (geen template.json)" >&2; exit 1; }

rm -rf "$doel/arto"
mkdir -p "$doel/arto" "$doel/.github/workflows"
( cd "$root/templates/_kern" && find . -type f \
    ! -path './proefsite/*' ! -path './sjabloon/*' ! -name 'nieuw-template.sh' \
    -exec sh -c 'mkdir -p "$0/$(dirname "$1")" && cp "$1" "$0/$1"' "$doel/arto" {} \; )
cp "$root/templates/_kern/sjabloon/github/publiceer.yml" "$doel/.github/workflows/publiceer.yml"
( cd "$doel" && ./build.sh )
echo "Kern bijgewerkt in $doel. Controleer met ./dev.sh, commit en push (dat publiceert ook)."
