#!/usr/bin/env bash
# Controleert of alle tools voor ARTO op deze computer staan.
# Gebruik: ./setup/scripts/check-tools.sh

ok=0
check() {
  if command -v "$1" >/dev/null 2>&1; then
    printf '  ✓ %-10s %s\n' "$1" "$($1 --version 2>&1 | head -n1)"
  else
    printf '  ✗ %-10s ontbreekt: %s\n' "$1" "$2"
    ok=1
  fi
}

echo "Tools voor ARTO:"
check git    "installeer via https://git-scm.com"
check node   "installeer Node.js LTS via https://nodejs.org"
check npx    "komt mee met Node.js"
check claude "installeer Claude Code: https://claude.com/claude-code"

if command -v npx >/dev/null 2>&1; then
  if npx --no-install wrangler --version >/dev/null 2>&1; then
    echo "  ✓ wrangler   $(npx --no-install wrangler --version 2>&1 | tail -n1)"
  else
    echo "  ○ wrangler   niet globaal; wordt bij deploy via 'npx wrangler' opgehaald"
  fi
fi

exit $ok
