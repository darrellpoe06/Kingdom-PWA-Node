#!/bin/sh
# Install nas-openers as a systemd service on the NAS. Shipped DISABLED in
# infra/nas-loops/services.json, so services-sync does not install it until
# Darrell turns it on. Pressing a garage door is a physical, outward action, so
# it is armed on purpose and never by a merge.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
PORT="${OPENERS_PORT:-8119}"
python3 -m pip install --user --quiet fastapi uvicorn >/dev/null 2>&1 || true
if [ ! -f "$HERE/devices.json" ]; then
  echo "nas-openers: no devices.json, so NOTHING is armed. Copy devices.json.example and fill it in."
fi
cat > /etc/systemd/system/poetech-openers.service <<UNIT
[Unit]
Description=PoeTech house openers (garage door and any other opener)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$HERE
Environment=OPENERS_DEVICES=$HERE/devices.json
ExecStart=/usr/bin/env python3 -m uvicorn openers:app --host 127.0.0.1 --port $PORT
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now poetech-openers.service
echo "nas-openers: listening on 127.0.0.1:$PORT. Route /openers to it in Caddy."
