#!/bin/sh
# =============================================================================
# deploy-pwa.sh — sovereign PoeTech PWA build + deploy on the NAS
# =============================================================================
# Builds the PWA from the NAS repo checkout and serves the result via the
# `poetech-web` Caddy container (host :8088), exposed publicly over Tailscale
# Funnel :8443 at https://poetech.tail5a2f35.ts.net:8443/poetech-app/.
#
# Idempotent + reversible. Run after pulling new commits:
#   sh /volume1/PoeTech/scripts/deploy-pwa.sh
#
# Notes:
#  - .env.local (Supabase + n8n base + bearer) is NOT in git; it is created
#    once and reused. This script never overwrites it.
#  - The NAS main checkout currently carries a local patch to
#    app/src/lib/church-live.js (the pending "rolling-latest embed" helpers from
#    Darrell's feature branch). origin/main's vite build is BROKEN without it
#    (missing liveStreamEmbedUrl / latestUploadEmbedUrl exports; CI has no
#    vite-build gate). Once that fix merges to main, drop the local patch:
#       git -C $REPO checkout -- app/src/lib/church-live.js   (then pull)
# =============================================================================
set -e
export PATH=/var/packages/Node.js_v20/target/usr/local/bin:$PATH
NPM="node /var/packages/Node.js_v20/target/usr/local/lib/node_modules/npm/bin/npm-cli.js"
REPO=/volume1/PoeTech/repos/Kingdom-PWA-Node
CADDY=/volume1/PoeTech/caddy
DOCKER=/usr/local/bin/docker

cd "$REPO/app"

# Pull latest main (best-effort; never clobber the local church-live patch or .env.local).
git -C "$REPO" fetch origin --quiet || true
git -C "$REPO" pull --ff-only origin main || echo "[deploy] pull skipped (local changes / non-ff) — building current tree"

echo "[deploy] npm ci"
$NPM ci

echo "[deploy] vite build (sha-stamped sw)"
GITHUB_SHA=$(git -C "$REPO" rev-parse HEAD) $NPM run build

echo "[deploy] publish dist -> caddy site"
rm -rf "$CADDY/site/poetech-app"
cp -r "$REPO/app/dist" "$CADDY/site/poetech-app"

echo "[deploy] reload caddy"
sudo "$DOCKER" restart poetech-web >/dev/null

echo "[deploy] DONE — https://poetech.tail5a2f35.ts.net:8443/poetech-app/"
