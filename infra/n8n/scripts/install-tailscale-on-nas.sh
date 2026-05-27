#!/bin/bash
# ============================================================================
# install-tailscale-on-nas.sh — get Tailscale onto the Synology
# ============================================================================
# Synology doesn't ship Tailscale in Package Center, so we install the SPK
# directly via DSM's package manager CLI (`synopkg`).
#
# What this does:
#   1. Detects the CPU architecture (DS1621xs is x86_64).
#   2. Downloads the latest Tailscale SPK from Tailscale's official pkg
#      mirror.
#   3. Installs it via synopkg (DSM7 syntax).
#   4. Starts the Tailscale daemon.
#   5. Prints the one-time auth URL that needs to be visited in a browser
#      while signed into the same `darrellpoe06.github` Tailscale account
#      the family phones use.
#
# After running, click the printed URL, approve, and the NAS shows up in
# your Tailscale device list as something like `poetech` on
# `tail5a2f35.ts.net`. Then any client on the tailnet can reach the NAS at
# `poetech.tail5a2f35.ts.net` from any network.
#
# Run on Synology: sudo bash /tmp/install-tailscale-on-nas.sh
# Idempotent — safe to re-run; will skip download/install if already there.
# ============================================================================

set -e

ARCH="x86_64"  # DS1621xs is x86_64. If you ever move to ARM, override here.
TS_PKG_BASE="https://pkgs.tailscale.com/stable/synology"
DSM_MAJOR="7"

echo "=== Detect Synology arch ==="
uname -a

echo
echo "=== Check if Tailscale already installed ==="
if [ -d /var/packages/Tailscale ]; then
  echo "Tailscale package directory present at /var/packages/Tailscale — skipping install."
  INSTALLED="yes"
else
  INSTALLED="no"
fi

if [ "$INSTALLED" = "no" ]; then
  echo
  echo "=== Determine latest Tailscale SPK URL ==="
  # Tailscale's Synology SPKs live at the root of https://pkgs.tailscale.com/stable/
  # The filename pattern is: tailscale-<arch>-<version>-<build>-dsm<7|6>.spk
  # We scrape the listing page (the / root) for our arch + DSM combination.
  LISTING_URL="https://pkgs.tailscale.com/stable/"
  echo "Scanning: $LISTING_URL"
  PATTERN="tailscale-${ARCH}-[0-9.]+-[0-9]+-dsm${DSM_MAJOR}\\.spk"
  SPK_FILENAME=$(curl -sSL "$LISTING_URL" | grep -oE "$PATTERN" | sort -V | tail -1)
  if [ -z "$SPK_FILENAME" ]; then
    echo "ERROR: could not find a ${ARCH} DSM${DSM_MAJOR} SPK in $LISTING_URL"
    echo "Manual fallback: download from https://pkgs.tailscale.com/stable/#synology and install via DSM Package Center → Manual Install."
    exit 1
  fi
  SPK_URL="${LISTING_URL}${SPK_FILENAME}"
  echo "Found SPK: $SPK_URL"

  echo
  echo "=== Download SPK to /tmp ==="
  cd /tmp
  curl -sSL -o "$SPK_FILENAME" "$SPK_URL"
  ls -la "$SPK_FILENAME"

  echo
  echo "=== Locate synopkg ==="
  # Sudo on Synology drops the standard PATH; synopkg lives in /usr/syno/bin
  # but isn't on the sudo PATH by default. Find it explicitly.
  SYNOPKG=""
  for candidate in /usr/syno/bin/synopkg /usr/syno/sbin/synopkg /usr/bin/synopkg; do
    if [ -x "$candidate" ]; then
      SYNOPKG="$candidate"
      break
    fi
  done
  if [ -z "$SYNOPKG" ]; then
    echo "ERROR: synopkg not found. Try \`find / -name synopkg -type f 2>/dev/null\` to locate it."
    exit 1
  fi
  echo "Using: $SYNOPKG"

  echo
  echo "=== Install via synopkg ==="
  "$SYNOPKG" install "/tmp/$SPK_FILENAME"

  echo
  echo "=== Start Tailscale service ==="
  "$SYNOPKG" start Tailscale
fi

echo
echo "=== Wait for tailscaled to come up ==="
sleep 3

TAILSCALE_BIN="/var/packages/Tailscale/target/bin/tailscale"
if [ ! -x "$TAILSCALE_BIN" ]; then
  echo "ERROR: tailscale binary not found at $TAILSCALE_BIN"
  ls -la /var/packages/Tailscale/target/ 2>&1 || true
  exit 1
fi

echo
echo "=== Show current status ==="
"$TAILSCALE_BIN" status 2>&1 || true

echo
echo "=== Bring Tailscale up (will print auth URL if not logged in) ==="
echo "If you see a URL below starting with https://login.tailscale.com/... — open it in your browser while signed in to your darrellpoe06.github Tailscale account, approve, and the NAS will join your tailnet."
echo
"$TAILSCALE_BIN" up --hostname=poetech 2>&1 || true

echo
echo "=== Done. ==="
echo "After approval:"
echo "  - Check status: ssh dpoe@192.168.1.26 \"sudo /var/packages/Tailscale/target/bin/tailscale status\""
echo "  - Family phones can reach the NAS at: poetech.tail5a2f35.ts.net (or whatever Magic DNS name shows in your phone's Tailscale app)"
