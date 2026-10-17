#!/usr/bin/env bash
# Maakt een nieuwe site aan vanuit een template (standaard templates/site-basis/) en vult de velden in.
# Gebruik:
#   ./setup/scripts/nieuwe-site.sh ../bakkerij-peeters \
#     NAAM="Bakkerij Peeters" DOMEIN=bakkerijpeeters.be PROJECT=bakkerij-peeters \
#     BESCHRIJVING="Ambachtelijke bakker in Gent." TELEFOON="+32 9 123 45 67" \
#     EMAIL=info@bakkerijpeeters.be ADRES="Kerkstraat 1, 9000 Gent"
# Ander template: TEMPLATE=horeca ./setup/scripts/nieuwe-site.sh ...
# Velden die je niet opgeeft blijven als {{VELD}} staan; het script toont welke.
set -euo pipefail

if [ $# -lt 1 ]; then
  sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi

doel="$1"; shift
root="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -e "$doel" ]; then
  echo "Bestaat al: $doel" >&2
  exit 1
fi

template="${TEMPLATE:-site-basis}"
if [ ! -d "$root/templates/$template" ]; then
  echo "Template bestaat niet: templates/$template" >&2
  exit 1
fi

cp -r "$root/templates/$template" "$doel"

for paar in "$@"; do
  veld="${paar%%=*}"
  waarde="${paar#*=}"
  # Escape tekens die sed speciaal vindt in de vervanging.
  waarde_esc="$(printf '%s' "$waarde" | sed -e 's/[\/&|]/\\&/g')"
  { grep -rlF "{{$veld}}" "$doel" || true; } | while read -r f; do
    sed -i.bak "s|{{$veld}}|$waarde_esc|g" "$f" && rm -f "$f.bak"
  done
done

echo "Site aangemaakt in $doel"
over="$(grep -rhoE '\{\{[A-Z]+\}\}' "$doel" --exclude=README.md | sort -u | tr '\n' ' ' || true)"
if [ -n "$over" ]; then
  echo "Nog in te vullen: $over"
fi
