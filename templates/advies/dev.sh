#!/usr/bin/env bash
# Start de site lokaal met werkend beheerpaneel: http://localhost:8790 en /beheer/
set -euo pipefail
cd "$(dirname "$0")"
KERN=arto; [ -d "$KERN" ] || KERN=../_kern
node "$KERN/dev.mjs" . "$@"
