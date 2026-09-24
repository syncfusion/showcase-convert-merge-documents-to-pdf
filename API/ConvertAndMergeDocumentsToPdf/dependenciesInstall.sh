#!/bin/bash
# Chromium shared libraries for HTML to PDF. Ubuntu 24.04 renamed several of these to t64 packages.
set -eu

has_lib() {
  ldconfig -p 2>/dev/null | grep -q "$1"
}

if has_lib 'libnss3.so' && has_lib 'libgbm.so' && has_lib 'libgtk-3.so'; then
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

packages=()
add() {
  for name in "$@"; do
    if apt-cache show "$name" >/dev/null 2>&1; then
      packages+=("$name")
      return 0
    fi
  done
  echo "Blink dependency not in apt: $*" >&2
  return 1
}

add libasound2t64 libasound2
add libatk1.0-0t64 libatk1.0-0
add libatk-bridge2.0-0t64 libatk-bridge2.0-0
add libatspi2.0-0t64 libatspi2.0-0
add libc6
add libcairo2
add libcups2t64 libcups2
add libdbus-1-3
add libdrm2
add libexpat1
add libfontconfig1
add libgcc-s1 libgcc1
add libgdk-pixbuf-2.0-0 libgdk-pixbuf2.0-0
add libglib2.0-0t64 libglib2.0-0
add libgtk-3-0t64 libgtk-3-0
add libnspr4
add libnss3
add libgbm1
add libpango-1.0-0
add libpangocairo-1.0-0
add libstdc++6
add libx11-6
add libx11-xcb1
add libxcb1
add libxcomposite1
add libxcursor1
add libxdamage1
add libxext6
add libxfixes3
add libxi6
add libxkbcommon0
add libxrandr2
add libxrender1
add libxshmfence1
add libxss1
add libxtst6
add fonts-liberation || true
add libgconf-2-4 || true

if [ ${#packages[@]} -eq 0 ]; then
  echo "No Blink packages could be resolved." >&2
  exit 1
fi

apt-get install -yq --no-install-recommends "${packages[@]}"
ldconfig || true
