#!/bin/sh
# fill-versions -- the library is filled perpetually (DR-1261). Rides the
# ALREADY-ARMED services-sync clock as an idempotent installer. Installs the
# oneshot service and its timer; the timer is ENABLED only while services.json
# says fill-versions enabled:true (the registry is the switch, DR-0248), and
# disabled again the cycle after it is flipped off. The job itself re-reads the
# registry before every run (fill_versions.kill_state), so a flip stops the
# next pass even before this installer runs. No credential is ever printed.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-lesson-builder"
UNIT=/etc/systemd/system/poetech-fill-versions.service
TIMER=/etc/systemd/system/poetech-fill-versions.timer
REG="$REPO/infra/nas-loops/services.json"

changed=0
for pair in "$SRC/poetech-fill-versions.service:$UNIT" "$SRC/poetech-fill-versions.timer:$TIMER"; do
  from="${pair%%:*}"; to="${pair##*:}"
  if ! cmp -s "$from" "$to" 2>/dev/null; then cp "$from" "$to" && changed=1; fi
done
[ "$changed" = 1 ] && systemctl daemon-reload >/dev/null 2>&1

enabled=$(python3 -c "import json,sys; d=json.load(open('$REG')); print(1 if any(s.get('name')=='fill-versions' and s.get('enabled') for s in d.get('services',[])) else 0)" 2>/dev/null || echo 0)
if [ "$enabled" = 1 ]; then
  systemctl is-enabled poetech-fill-versions.timer >/dev/null 2>&1 || systemctl enable --now poetech-fill-versions.timer >/dev/null 2>&1
  echo "fill-versions: timer armed (registry enabled:true)"
else
  systemctl is-enabled poetech-fill-versions.timer >/dev/null 2>&1 && systemctl disable --now poetech-fill-versions.timer >/dev/null 2>&1
  echo "fill-versions: installed, timer OFF (registry enabled:false)"
fi
exit 0
