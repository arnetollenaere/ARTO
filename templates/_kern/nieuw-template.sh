#!/usr/bin/env bash
# Zet een lege map klaar voor een nieuw sectortemplate met de vaste ARTO-bestanden.
# Gebruik: ./templates/_kern/nieuw-template.sh <sector>
set -euo pipefail
kern="$(cd "$(dirname "$0")" && pwd)"
doel="$kern/../${1:?Geef de naam van het template, bv. horeca}"
[ -e "$doel" ] && { echo "Bestaat al: $doel" >&2; exit 1; }
mkdir -p "$doel"
cp -r "$kern/sjabloon/." "$doel/"
rm -rf "$doel/github"
mkdir -p "$doel/src/css" "$doel/src/js" "$doel/src/img/uploads" "$doel/src/fonts"
touch "$doel/src/img/uploads/.gitkeep"
echo "Klaar: templates/$1. Maak nu template.json, inhoud.json, src/index.html, src/404.html, README.md en CLAUDE.md."
