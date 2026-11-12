#!/usr/bin/env bash
# Production build for one site, using that site's pinned extended Hugo.
# Usage: ./scripts/build-one.sh <portfolio|teaching|memoirs>

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/build-one.sh <portfolio|teaching|memoirs>" >&2
  exit 1
fi

site="$1"
dir="$(site_dir "$site")"
version="$(hugo_version_for "$site")"
baseurl="$(baseurl_for "$site")"
if [[ ! -d "$dir" ]]; then
  echo "Missing ${dir}. Import the site before building." >&2
  exit 1
fi

ensure_submodules
hugo="$(hugo_bin "$version")"
echo "Building ${site} with $("$hugo" version)"

case "$site" in
  portfolio)
    (cd "$dir" && "$hugo" --minify --baseURL "$baseurl")
    ;;
  memoirs)
    (cd "$dir" && "$hugo" --minify --baseURL "$baseurl")
    ;;
  teaching)
    prepare_teaching_tools "$dir"
    (cd "$dir" && "$hugo" --minify --configDir=config --baseURL "$baseurl")
    (cd "$dir" && npx -y pagefind --site public)
    ;;
esac

echo "Built ${dir}/public"
