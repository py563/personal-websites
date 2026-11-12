#!/usr/bin/env bash
# Build portfolio, teaching, and memoirs with their own Hugo versions.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for site in portfolio teaching memoirs; do
  "$ROOT/scripts/build-one.sh" "$site"
done
