#!/usr/bin/env bash
# Shared helpers for the site scripts. Not a user-facing command.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/versions.sh"

usage_sites() {
  echo "site must be one of: portfolio, teaching, memoirs" >&2
}

site_dir() {
  local site="$1"
  case "$site" in
    portfolio|teaching|memoirs)
      echo "$ROOT/sites/$site"
      ;;
    *)
      usage_sites
      return 1
      ;;
  esac
}

hugo_version_for() {
  local site="$1"
  case "$site" in
    portfolio) echo "$HUGO_PORTFOLIO" ;;
    teaching) echo "$HUGO_TEACHING" ;;
    memoirs) echo "$HUGO_MEMOIRS" ;;
    *)
      usage_sites
      return 1
      ;;
  esac
}

baseurl_for() {
  local site="$1"
  case "$site" in
    portfolio) echo "$BASEURL_PORTFOLIO" ;;
    teaching) echo "$BASEURL_TEACHING" ;;
    memoirs) echo "$BASEURL_MEMOIRS" ;;
    *)
      usage_sites
      return 1
      ;;
  esac
}

port_for() {
  local site="$1"
  case "$site" in
    portfolio) echo "$PORT_PORTFOLIO" ;;
    teaching) echo "$PORT_TEACHING" ;;
    memoirs) echo "$PORT_MEMOIRS" ;;
    *)
      usage_sites
      return 1
      ;;
  esac
}

# Download the extended binary for one Hugo version into .hugo/bin.
hugo_bin() {
  local version="$1"
  local dest="$ROOT/.hugo/bin/hugo-${version}"
  if [[ -x "$dest" ]]; then
    echo "$dest"
    return 0
  fi
  mkdir -p "$ROOT/.hugo/bin"
  local tmp
  tmp="$(mktemp -d)"
  local url="https://github.com/gohugoio/hugo/releases/download/v${version}/hugo_extended_${version}_linux-amd64.tar.gz"
  echo "Downloading Hugo extended ${version}" >&2
  curl -fsSL "$url" -o "$tmp/hugo.tar.gz"
  tar -xzf "$tmp/hugo.tar.gz" -C "$tmp" hugo
  mv "$tmp/hugo" "$dest"
  chmod +x "$dest"
  rm -rf "$tmp"
  echo "$dest"
}

ensure_submodules() {
  git -C "$ROOT" submodule update --init --recursive
}

vendor_teaching_three() {
  local dir="$1"
  local three_root="${dir}/node_modules/three"
  local vendor_root="${dir}/static/js/vendor/three"
  if [[ ! -f "${three_root}/build/three.module.js" ]]; then
    echo "three package missing; run npm ci in sites/teaching first." >&2
    return 1
  fi
  mkdir -p "${vendor_root}/build" "${vendor_root}/examples"
  cp -f "${three_root}/build/three.module.js" "${vendor_root}/build/"
  rm -rf "${vendor_root}/examples/jsm"
  cp -R "${three_root}/examples/jsm" "${vendor_root}/examples/"
}

prepare_teaching_tools() {
  local dir="$1"
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required to build the teaching site." >&2
    return 1
  fi
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" != "$NODE_TEACHING" ]]; then
    echo "Warning: teaching .nvmrc asks for Node ${NODE_TEACHING}; this shell has Node $(node -v)." >&2
  fi
  (cd "$dir" && npm ci)
  vendor_teaching_three "$dir"
  # npm may link node_modules/.bin/sass to the JS "sass" package. Hugo's
  # dartsass transpiler needs the native binary shipped by sass-embedded.
  local pkg sass_bin os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "${os}-${arch}" in
    Linux-x86_64)
      if ldd --version 2>&1 | grep -qi musl; then
        pkg="sass-embedded-linux-musl-x64"
      else
        pkg="sass-embedded-linux-x64"
      fi
      ;;
    Linux-aarch64) pkg="sass-embedded-linux-arm64" ;;
    Darwin-arm64) pkg="sass-embedded-darwin-arm64" ;;
    Darwin-x86_64) pkg="sass-embedded-darwin-x64" ;;
    *)
      echo "No sass-embedded package mapped for ${os}-${arch}." >&2
      return 1
      ;;
  esac
  sass_bin="${dir}/node_modules/${pkg}/dart-sass/sass"
  if [[ ! -x "$sass_bin" ]]; then
    echo "Native Sass compiler not found at ${sass_bin}." >&2
    return 1
  fi
  export PATH="$(dirname "$sass_bin"):${dir}/node_modules/.bin:${PATH}"
}
