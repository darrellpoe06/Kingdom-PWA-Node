#!/bin/sh
# install.sh -- idempotent installer for the NAS-resident build loop.
# Run ON THE NAS (as dpoe; uses sudo -n for the systemd unit install only).
#   ssh dpoe@192.168.1.26 'sh /volume1/homes/dpoe/poetech-build/install.sh'
#
# It: creates the build home + state dirs, deploys loop.py, installs the
# systemd service+timer, reloads systemd, and enables the timer. It ships the
# loop INERT: it does NOT create the ARMED file. Arming is a separate,
# deliberate, attended step (see README "Arm").
set -e

HOME_DIR=/volume1/homes/dpoe/poetech-build
STATE_DIR="$HOME_DIR/state"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
TOKEN_FILE=/volume1/PoeTech/secrets/github-token.txt

echo "== install: build home =="
mkdir -p "$HOME_DIR" "$STATE_DIR"

echo "== install: deploy loop.py =="
# If install.sh runs from the deployed home it is copying onto itself; guard it.
if [ "$SRC_DIR/loop.py" != "$HOME_DIR/loop.py" ]; then
  cp "$SRC_DIR/loop.py" "$HOME_DIR/loop.py"
fi
chmod 0755 "$HOME_DIR/loop.py"

echo "== install: token check =="
if [ ! -s "$TOKEN_FILE" ]; then
  echo "  WARNING: $TOKEN_FILE is missing/empty."
  echo "  The loop needs a GitHub token (repo + workflow scopes) there, mode 0600."
  echo "  It will exit with an error until the token is present -- brakes hold; no harm."
else
  echo "  token present."
fi

echo "== install: systemd units (sudo) =="
sudo -n cp "$SRC_DIR/poetech-build-loop.service" /etc/systemd/system/poetech-build-loop.service
sudo -n cp "$SRC_DIR/poetech-build-loop.timer" /etc/systemd/system/poetech-build-loop.timer
sudo -n systemctl daemon-reload
# systemd 219 (Synology DSM) has no `enable --now`; enable + start separately.
sudo -n systemctl enable poetech-build-loop.timer
sudo -n systemctl start poetech-build-loop.timer

echo "== install: selftest (prove the brakes) =="
/usr/bin/python3 "$HOME_DIR/loop.py" --selftest

echo ""
echo "== installed. Loop is INERT (no ARMED file). Timer is enabled. =="
echo "   Next fire:   sudo systemctl list-timers poetech-build-loop.timer"
echo "   Arm:         touch $HOME_DIR/ARMED"
echo "   Kill now:    touch $HOME_DIR/STOP        (instant inert; leave file in place)"
echo "   Disarm:      rm -f $HOME_DIR/ARMED"
echo "   Stop timer:  sudo systemctl stop poetech-build-loop.timer; sudo systemctl disable poetech-build-loop.timer"
