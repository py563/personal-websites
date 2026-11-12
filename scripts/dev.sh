#!/usr/bin/env bash
# Start one site's development server on a fixed port.
# Usage: ./scripts/dev.sh <portfolio|teaching|memoirs>

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/dev.sh <portfolio|teaching|memoirs>" >&2
  exit 1
fi

site="$1"
dir="$(site_dir "$site")"
version="$(hugo_version_for "$site")"
port="$(port_for "$site")"
if [[ ! -d "$dir" ]]; then
  echo "Missing ${dir}. Import the site before serving." >&2
  exit 1
fi

ensure_submodules
hugo="$(hugo_bin "$version")"
local_url="http://localhost:${port}/"
echo "Serving ${site} at ${local_url} with $("$hugo" version)"

case "$site" in
  portfolio|memoirs)
    cd "$dir"
    exec "$hugo" server --bind 127.0.0.1 --port "$port" --baseURL "$local_url"
    ;;
  teaching)
    prepare_teaching_tools "$dir"
    cd "$dir"
    exec "$hugo" server --bind 127.0.0.1 --port "$port" --baseURL "$local_url" --configDir=config
    ;;
esac
