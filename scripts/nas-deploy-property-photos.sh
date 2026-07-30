#!/bin/sh
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md — this mounts the
# /nas-photos funnel path (-> 127.0.0.1:8099, the sovereign photo server).
# Additive funnel path mount; never touch the root or use `serve` (DR-0250).
# nas-deploy-property-photos.sh   (run ON the NAS host, as dpoe)
#
# 2026-07-01  Sovereign property-photo image server (no n8n). Installs
# photo_server.py to /volume1/PoeTech/scripts/, proves it (selftest + probe),
# and starts it on 127.0.0.1:8099. Idempotent: re-running re-installs the latest
# server and restarts it cleanly.
#
# Run on the NAS:
#   wget -qO- https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/scripts/nas-deploy-property-photos.sh | sh
#
# The token is REUSED from the existing /volume1/PoeTech/secrets/chat-bridge-token.txt
# (the old n8n bridge already seeded it) -- nothing to seed.
#
# After it succeeds, two ONE-TIME steps (printed again at the end):
#   1. Front it on the sovereign path (prefix stripped -> server sees /property-photos):
#        tailscale serve --bg --set-path /nas-photos http://127.0.0.1:8099
#   2. Persist across reboot: DSM Task Scheduler -> Triggered Task -> Boot-up,
#      run-as dpoe, command:
#        PHOTO_BRIDGE_TOKEN=$(cat /volume1/PoeTech/secrets/photo-bridge-token) /usr/bin/python3 /volume1/PoeTech/scripts/photo_server.py --serve

set -e

RAW="https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/infra/nas-property-photos/photo_server.py"
DEST_DIR="/volume1/PoeTech/scripts"
DEST="$DEST_DIR/photo_server.py"
SECRETS="/volume1/PoeTech/secrets"
# Reuse the EXISTING family bridge token (seeded for the old n8n bridge) -- no
# second secret, no re-seeding. Falls back to a photo-specific file if present.
TOKEN_FILE="$SECRETS/chat-bridge-token.txt"
[ -s "$SECRETS/photo-bridge-token" ] && [ ! -s "$TOKEN_FILE" ] && TOKEN_FILE="$SECRETS/photo-bridge-token"
PORT="${PHOTO_PORT:-8099}"
TS=$(date +%Y%m%d-%H%M%S)

echo "============================================================"
echo "property-photo image server deploy -- $TS"
echo "============================================================"

PY=$(command -v python3 || echo /usr/bin/python3)
echo "    python3 = $PY"

# ---- 1. Install the server (backup any existing copy) ------------------------
mkdir -p "$DEST_DIR"
if [ -f "$DEST" ]; then cp "$DEST" "$DEST.bak-$TS"; echo "    backed up existing -> $DEST.bak-$TS"; fi
if wget -qO "$DEST.new" "$RAW"; then
  mv "$DEST.new" "$DEST"
  chmod 755 "$DEST"
  echo "    installed $DEST"
else
  echo "ERROR: could not fetch $RAW  (is the branch pushed?). Aborting."
  rm -f "$DEST.new"
  exit 1
fi

# ---- 2. Prove the logic (offline, no NAS state needed) -----------------------
echo "==> selftest:"
"$PY" "$DEST" --selftest || { echo "ERROR: selftest failed. NOT starting."; exit 1; }

# ---- 3. Token file present? --------------------------------------------------
mkdir -p "$SECRETS"; chmod 700 "$SECRETS" 2>/dev/null || true
if [ ! -s "$TOKEN_FILE" ]; then
  echo ""
  echo "!!  No token yet at $TOKEN_FILE"
  echo "!!  Seed it with the SAME value the PWA uses (localStorage poetech-chat-bridge-token /"
  echo "!!  the n8n 'property-history bridge token'), then re-run this script:"
  echo "!!      printf '%s' '<token>' > $TOKEN_FILE && chmod 600 $TOKEN_FILE"
  echo ""
  echo "Server installed but NOT started (it refuses to run without a token)."
  exit 0
fi
chmod 600 "$TOKEN_FILE" 2>/dev/null || true

# ---- 4. Install + (re)start as a systemd service (boot-persistent) -----------
UNIT_SRC="/volume1/PoeTech/scripts/poetech-photo-server.service"
UNIT_DST="/etc/systemd/system/poetech-photo-server.service"
# Fetch the unit alongside the server (best-effort; skip if already present).
wget -qO "$UNIT_SRC.new" "https://raw.githubusercontent.com/darrellpoe06/Kingdom-PWA-Node/main/infra/nas-property-photos/poetech-photo-server.service" \
  && mv "$UNIT_SRC.new" "$UNIT_SRC" || rm -f "$UNIT_SRC.new"
if [ -f "$UNIT_SRC" ]; then
  sudo cp "$UNIT_SRC" "$UNIT_DST"
  sudo systemctl daemon-reload
  sudo systemctl enable poetech-photo-server 2>&1 | tail -1
  sudo systemctl restart poetech-photo-server
  sleep 2
  echo "    service: $(sudo systemctl is-active poetech-photo-server) / $(sudo systemctl is-enabled poetech-photo-server)"
else
  echo "    (no unit file; falling back to nohup -- NOT boot-persistent)"
  PHOTO_PORT="$PORT" nohup "$PY" "$DEST" --serve >/volume1/PoeTech/scripts/photo_server.log 2>&1 < /dev/null &
  sleep 2
fi

# ---- 5. Liveness + a real probe (measures the fix) ---------------------------
echo "==> /healthz:"
wget -qO- "http://127.0.0.1:$PORT/healthz" || echo "(no response)"
echo ""
echo "==> probe 1003Koehn (real thumbnail resolution on this NAS):"
"$PY" "$DEST" --probe 1003Koehn || true

cat <<EOF

============================================================
Server active on 127.0.0.1:$PORT via systemd (poetech-photo-server).

REMAINING one-time step -- front it on the sovereign path (public Funnel):
    sudo tailscale funnel --bg --set-path=/nas-photos http://127.0.0.1:$PORT
    sudo tailscale serve status      # confirm /nas-photos -> localhost:$PORT

Then verify: curl https://poetech.us/nas-photos/healthz  -> {"ok":true}
and in-app: poetech.us -> Real Estate -> 1003 Koehn -> Records -> Browse.
============================================================
EOF
