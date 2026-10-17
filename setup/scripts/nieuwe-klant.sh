#!/usr/bin/env bash
# Maakt een nieuwe bedrijfsmap aan vanuit setup/sjablonen/bedrijf/.
# Gebruik: ./setup/scripts/nieuwe-klant.sh "Bakkerij Peeters" [slug]
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Gebruik: $0 \"Naam van het bedrijf\" [slug]" >&2
  exit 1
fi

naam="$1"
# Slug: kleine letters, accenten weg, alles behalve letters en cijfers wordt een streepje.
maak_slug() {
  printf '%s' "$1" \
    | sed -E 's/(à|á|â|ä|ã|å|À|Á|Â|Ä|Ã|Å)/a/g; s/(è|é|ê|ë|È|É|Ê|Ë)/e/g; s/(ì|í|î|ï|Ì|Í|Î|Ï)/i/g; s/(ò|ó|ô|ö|õ|Ò|Ó|Ô|Ö|Õ)/o/g; s/(ù|ú|û|ü|Ù|Ú|Û|Ü)/u/g; s/(ç|Ç)/c/g; s/(ñ|Ñ)/n/g; s/&/en/g' \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}
slug="${2:-$(maak_slug "$naam")}"
datum="$(date +%Y-%m-%d)"

root="$(cd "$(dirname "$0")/../.." && pwd)"
doel="$root/bedrijven/$slug"

if [ -z "$slug" ]; then
  echo "Kon geen slug maken uit '$naam'. Geef er zelf een op als tweede argument." >&2
  exit 1
fi
if [ -e "$doel" ]; then
  echo "Bestaat al: bedrijven/$slug" >&2
  exit 1
fi

if ! ls "$root"/setup/sjablonen/bedrijf/*.md >/dev/null 2>&1; then
  echo "Sjabloon ontbreekt: setup/sjablonen/bedrijf/" >&2
  exit 1
fi

mkdir -p "$doel/bestanden"
for f in "$root"/setup/sjablonen/bedrijf/*.md; do
  sed -e "s|{{NAAM}}|$naam|g" -e "s|{{SLUG}}|$slug|g" -e "s|{{DATUM}}|$datum|g" "$f" > "$doel/$(basename "$f")"
done
touch "$doel/bestanden/.gitkeep"

echo "Aangemaakt: bedrijven/$slug"
echo "Vul nu bedrijven/$slug/bedrijf.md in."
