#!/usr/bin/env bash
# Build every site, then check files the production build must contain.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT/scripts/build-all.sh"

require() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "Missing ${path}" >&2
    exit 1
  fi
  echo "ok ${path#"$ROOT/"}"
}

require "$ROOT/sites/portfolio/public/index.html"
require "$ROOT/sites/portfolio/public/sitemap.xml"
require "$ROOT/sites/portfolio/public/index.json"
require "$ROOT/sites/portfolio/public/CNAME"
require "$ROOT/sites/portfolio/public/CV.pdf"
require "$ROOT/sites/portfolio/public/PYM_HIP_Resume.pdf"

require "$ROOT/sites/teaching/public/index.html"
require "$ROOT/sites/teaching/public/sitemap.xml"
require "$ROOT/sites/teaching/public/index.xml"
require "$ROOT/sites/teaching/public/llms.txt"
require "$ROOT/sites/teaching/public/CNAME"
require "$ROOT/sites/teaching/public/pagefind/pagefind.js"

require "$ROOT/sites/memoirs/public/index.html"
require "$ROOT/sites/memoirs/public/sitemap.xml"
require "$ROOT/sites/memoirs/public/index.xml"

echo "Validation passed."
