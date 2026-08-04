#!/bin/sh
# services-sync -- the self-deploy loop (DR-0236: nothing waits for a hand).
# Reads infra/nas-loops/services.json and runs each enabled service's
# IDEMPOTENT installer from the repo checkout the NAS mirror keeps fresh.
# Merge to main -> mirror pulls -> this loop installs/repairs/starts the
# service. The runner (run.mjs) owns the brakes: timeout, daily cap, lock,
# LOOPS_ARMED, KILL_SWITCH. A failing installer fails THIS run loudly (ntfy
# via the runner) -- never silently.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
MANIFEST="$REPO/infra/nas-loops/services.json"

# FRESHEN THE MIRROR FIRST (2026-08-04, measured: the checkout sat a night
# stale at 254809ba while six merges — including a new manifest service —
# waited; every 15-min cycle faithfully synced YESTERDAY. "Merge to main ->
# mirror pulls -> this loop installs" is only true if THIS loop does the pull.
# Fail-soft: offline/diverged keeps the current checkout and says so — the
# cycle still runs what it has (an old-but-real manifest beats a dead run).
if ! git -C "$REPO" pull --ff-only 2>&1; then
  echo "services-sync: mirror pull failed (offline or diverged) — running with the existing checkout" >&2
fi

if [ ! -f "$MANIFEST" ]; then
  echo "services-sync: no manifest at $MANIFEST" >&2
  exit 1
fi

# DSM ships python3; use it as the JSON reader (no jq dependency on the NAS).
python3 - "$MANIFEST" "$REPO" <<'EOF'
import json, os, subprocess, sys
manifest, repo = sys.argv[1], sys.argv[2]
doc = json.load(open(manifest, encoding="utf-8"))
failed = []
for svc in doc.get("services", []):
    if not svc.get("enabled"):
        print(f"services-sync: {svc.get('name')} disabled, skip")
        continue
    path = os.path.join(repo, svc.get("install", ""))
    if not os.path.isfile(path):
        print(f"services-sync: {svc.get('name')} installer MISSING at {path}", file=sys.stderr)
        failed.append(svc.get("name"))
        continue
    print(f"services-sync: installing {svc.get('name')} ...")
    r = subprocess.run(["sh", path], timeout=480)
    if r.returncode != 0:
        failed.append(svc.get("name"))
if failed:
    print(f"services-sync: FAILED: {', '.join(failed)}", file=sys.stderr)
    sys.exit(1)
print("services-sync: all services synced")
EOF
