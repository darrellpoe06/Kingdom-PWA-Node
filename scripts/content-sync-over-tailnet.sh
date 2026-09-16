#!/usr/bin/env bash
# =============================================================================
# content-sync-over-tailnet.sh — carry the content rows the NAS pipelines filed
# on the HOSTED project across to the SOVEREIGN database the app reads, from a
# GitHub runner, over the team's own tailnet (DR-0442)
# =============================================================================
# WHY THIS EXISTS. The app has read the sovereign stack since REPOINT-ARMED
# (2026-08-19, DR-0310). The NAS ingest scripts kept writing to the hosted
# project, so The Word showed "0 of 901 messages" for September 2026 while the
# hosted project held 911 with four September services (measured 2026-09-16).
# Same class as the blobs (DR-0317) and the migrations (sovereign-replay): the
# repoint moved the readers and left a writer behind.
#
# ONE SCRIPT, CALLED BY THE WORKFLOW in both modes: MODE=dry-run reads both
# databases and reports the drift (exit 1 when any hosted-only row remains, so
# a red run IS the witness); MODE=apply copies and re-measures. The remote
# step also prints which backend the loaders now resolve to on the box, and
# probes the sovereign REST door with the box's own service key (HTTP code
# only, never the key) — the two facts a reader needs to trust the repoint.
#
# SAFE BY CONSTRUCTION: content_sync.py is idempotent (ON CONFLICT DO NOTHING,
# updates only where hosted is newer), reads no human credential (the runner
# authenticates with NAS_SSH_KEY; the box reads its own .env files), and
# re-counts after writing. Requires the tailnet already joined by the caller.
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_REPO="${NAS_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
NAS_ENV="${NAS_ENV:-/volume1/docker/supabase/.env}"
MODE="${MODE:-dry-run}"
ONLY_TABLE="${ONLY_TABLE:-}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Sovereign content sync - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so neither database could be reached. Unmeasured is never reported as in sync (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - content drift is UNKNOWN, not zero"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""; err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done
if [ "$probe" != "READY" ]; then
  say "## Sovereign content sync - NOT RUN"
  say ""
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error:"
  say ""
  say "    $err"
  echo "::error::NAS unreachable - content drift is UNKNOWN, not zero"
  exit 3
fi

REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
REPO="${NAS_REPO:?NAS_REPO not passed through}"
ENV_FILE="${NAS_ENV:?NAS_ENV not passed through}"
MODE="${MODE:?MODE not passed through}"
ONLY_TABLE="${ONLY_TABLE:-}"
PATH=/usr/local/bin:/opt/bin:/usr/bin:/bin:$PATH; export PATH
cd "$REPO" || { echo "repo not found at $REPO" >&2; exit 6; }
git pull --ff-only 2>&1 | tail -2
echo "REPO-HEAD=$(git rev-parse --short HEAD)"
cd "$REPO/infra/nas-supabase" || exit 6
# Which backend do the loaders resolve to on THIS box now? (source + url only)
echo "LOADER-TARGET=$(python3 -c 'import sovereign_target as t; s=t.resolve_target("/volume1/PoeTech/secrets/supabase.json"); print(str(s[0])+" "+str(s[1]))' 2>&1)"
# Does the sovereign REST door answer this box's own service key? HTTP code only.
SK=$(sed -n 's/^SERVICE_ROLE_KEY=//p' "$ENV_FILE" 2>/dev/null | tr -d '[:space:]"')
if [ -n "$SK" ]; then
  C=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -H "apikey: $SK" -H "Authorization: Bearer $SK" \
      "http://127.0.0.1:8800/rest/v1/choir_sermons?select=id&limit=1" 2>/dev/null || echo 000)
  echo "SOVEREIGN-REST=HTTP $C"
else
  echo "SOVEREIGN-REST=service key not readable from $ENV_FILE by $(id -un)"
fi
echo "----- content_sync ($MODE) -----"
ARGS=""
[ "$MODE" = "apply" ] && ARGS="--commit"
[ -n "$ONLY_TABLE" ] && ARGS="$ARGS --table $ONLY_TABLE"
python3 content_sync.py $ARGS 2>&1
rc=$?
echo "----- end content_sync (exit $rc) -----"
exit $rc
REMOTE

ERRFILE="$(mktemp)"
OUT=$($SSH "NAS_REPO='$NAS_REPO' NAS_ENV='$NAS_ENV' MODE='$MODE' ONLY_TABLE='$ONLY_TABLE' bash -s" < "$REMOTE_SCRIPT" 2>"$ERRFILE")
rc=$?
errtxt=$(cat "$ERRFILE" 2>/dev/null)
rm -f "$REMOTE_SCRIPT" "$ERRFILE"

head_sha=$(printf '%s\n' "$OUT" | sed -n 's/^REPO-HEAD=//p' | tail -1)
target=$(printf '%s\n' "$OUT" | sed -n 's/^LOADER-TARGET=//p' | tail -1)
door=$(printf '%s\n' "$OUT" | sed -n 's/^SOVEREIGN-REST=//p' | tail -1)
verdict=$(printf '%s\n' "$OUT" | sed -n 's/^content-sync: verdict //p' | tail -1)

say "## Sovereign content sync ($MODE) - $(date -u +%FT%TZ)"
say ""
say "- NAS checkout: ${head_sha:-unknown}"
say "- loaders now resolve to: ${target:-unknown}"
say "- sovereign REST door with the box's service key: ${door:-unknown}"
say "- verdict: ${verdict:-none (the tool did not reach a verdict)}"
say ""
say "### per-table"
printf '%s\n' "$OUT" | grep '^content-sync: ' | grep -v '^content-sync: summary' | while IFS= read -r l; do say "    $l"; done
if [ -n "$errtxt" ]; then
  say ""
  say "### stderr"
  printf '%s\n' "$errtxt" | while IFS= read -r l; do say "    $l"; done
fi

if [ "$rc" -ne 0 ]; then
  say ""
  if [ "$MODE" = "apply" ]; then
    say "Rows remain hosted-only after the copy, or a table could not be measured. The lines above name which. Nothing is rounded to zero (DR-0076)."
    echo "::error::content sync exited $rc - the app's database is still BEHIND the hosted project"
  else
    say "DRIFT FOUND: rows exist on the hosted project that the app's database does not hold. Dispatch this workflow with mode=apply to carry them across."
    echo "::error::content drift exited $rc - hosted-only rows exist (the app cannot see them)"
  fi
  exit 1
fi
say ""
say "Every content table is whole on the sovereign side: nothing hosted-only remains."
exit 0
