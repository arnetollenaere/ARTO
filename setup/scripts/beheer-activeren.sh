#!/usr/bin/env bash
# Zet de geheimen voor het online beheerpaneel in het Cloudflare Pages-project van een klant.
# Gebruik: ./setup/scripts/beheer-activeren.sh ../bakkerij-peeters arto-sites/bakkerij-peeters
# Vraagt het klantwachtwoord, het ARTO-wachtwoord en het GitHub-token (niets komt in de repo).
# Uitleg: setup/beheerpaneel.md
set -euo pipefail
doel="${1:?Geef de map van de klantsite}"
repo="${2:?Geef de GitHub-repo als eigenaar/naam}"
cd "$doel"
project="$(sed -n 's/^PROJECT="\(.*\)"/\1/p' deploy.sh)"
[ -n "$project" ] && [ "$project" != "{{PROJECT}}" ] || { echo "PROJECT ontbreekt in deploy.sh" >&2; exit 1; }
if [ -s .cloudflare-account ]; then export CLOUDFLARE_ACCOUNT_ID="$(tr -d '[:space:]' < .cloudflare-account)"; fi

zet() { printf '%s' "$2" | npx wrangler pages secret put "$1" --project-name="$project" >/dev/null && echo "  $1 ingesteld"; }

read -rsp "Wachtwoord voor de klant (beheerpaneel): " klant; echo
read -rsp "Wachtwoord voor ARTO (leeg = overslaan): " arto; echo
read -rsp "GitHub-token (fine-grained, Contents + Actions lezen/schrijven op $repo): " token; echo

zet BEHEER_WACHTWOORD "$klant"
[ -n "$arto" ] && zet ARTO_WACHTWOORD "$arto"
zet SESSIE_GEHEIM "$(openssl rand -hex 32)"
zet GITHUB_TOKEN "$token"
zet GITHUB_REPO "$repo"
zet GITHUB_BRANCH "main"
echo "Klaar. Publiceer de site opnieuw (./build.sh && ./deploy.sh) en open https://<domein>/beheer/"
echo "Bewaar de wachtwoorden in de wachtwoordmanager onder ARTO / $project."
