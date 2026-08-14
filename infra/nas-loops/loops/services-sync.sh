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
    # CAPTURE THE REASON, NOT JUST THE VERDICT (2026-08-14). Measured: every
    # recorded services-sync run since 2026-08-04 failed, and the loop event
    # log preserved only "installing ytzero ..." -- the last line of STDOUT --
    # while the actual error went to a stderr no one kept. Six identical
    # failures over a week and the cause was never once recorded, so diagnosing
    # it meant guessing. A failure that does not say WHY is barely better than
    # a silent one (DR-0076).
    try:
        r = subprocess.run(["sh", path], timeout=480,
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        out = (r.stdout or b"").decode("utf-8", "replace")
    except subprocess.TimeoutExpired as e:
        partial = getattr(e, "output", None) or b""
        out = partial.decode("utf-8", "replace") if isinstance(partial, bytes) else str(partial)
        print(out, end="" if out.endswith("\n") else "\n")
        print(f"services-sync: {svc.get('name')} TIMED OUT after 480s", file=sys.stderr)
        failed.append(f"{svc.get('name')} (timeout 480s)")
        continue
    # Always echo the installer's own output so a GOOD run stays as readable as
    # it was before this change.
    print(out, end="" if out.endswith("\n") else "\n")
    if r.returncode != 0:
        tail = [ln for ln in out.strip().splitlines() if ln.strip()][-3:]
        why = " | ".join(tail) if tail else "(no output)"
        print(f"services-sync: {svc.get('name')} exit={r.returncode} :: {why}", file=sys.stderr)
        failed.append(f"{svc.get('name')} (exit {r.returncode}: {why[:180]})")
if failed:
    print(f"services-sync: FAILED: {'; '.join(failed)}", file=sys.stderr)
    # ALSO to stdout: the loop runner records the last stdout line in its event
    # detail, which is how six failures logged the service name and never the
    # cause. Now the cause rides the channel that is actually kept.
    print(f"services-sync: FAILED: {'; '.join(failed)}")
    sys.exit(1)
print("services-sync: all services synced")
EOF
