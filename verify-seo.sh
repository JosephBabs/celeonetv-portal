#!/usr/bin/env bash
set -euo pipefail
SITE="${1:-https://celeonetv.com}"
PATHNAME="${2:-/spiritual-program}"
URL="${SITE%/}${PATHNAME}"
echo "Checking: $URL"
echo
curl -sL -A 'facebookexternalhit/1.1' "$URL" \
  | grep -Eio '<title>[^<]*</title>|<meta[^>]+(og:title|og:description|og:image|og:url|twitter:card|robots)[^>]*>|<link[^>]+rel=["'"']canonical["'"'][^>]*>|data-celeone-seo-snapshot' \
  || true
