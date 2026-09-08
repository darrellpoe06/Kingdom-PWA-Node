#!/usr/bin/env bash
# =============================================================================
# storage-sync-over-tailnet.sh — copy the Storage BLOBS hosted -> sovereign,
# from a GitHub runner, over the team's own tailnet
# =============================================================================
# WHY THIS EXISTS. DR-0317 built infra/nas-supabase/storage_sync.py and then
# parked THE RUN on Darrell's hand — a paste block over ssh — because the copy
# was framed as needing the hosted service_role key, the one value only he
# holds. Darrell 2026-09-08: "you have cli and ssh..." He is right on both
# counts (DR-0108: account for the WHOLE team's reach, and a stated "must be by
# hand" is an unverified premise to challenge, not a place to stop):
#
#   * The remote-hands channel — tailnet join + NAS_SSH_KEY — is this team's
#     CLI on the box. nas-health, nas-clock, db-migrate's sovereign replay and
#     sovereign-drift all ride it. So does this.
#   * A PUBLIC bucket needs no hosted key at all: its objects are readable at
#     /storage/v1/object/public/... with no credential. Shay's gallery
#     (moore-showcase) is public. It can be copied by this lane TODAY.
#
# The private buckets (church-team-documents, sermon-documents) still need
# HOSTED_SERVICE_ROLE_KEY in /volume1/docker/poetech/agent.env; storage_sync.py
# NAMES what it withheld rather than silently skipping it, and the same
# dispatch copies them the moment the key is there.
#
# ONE SCRIPT, the same shape as sovereign-replay-over-tailnet.sh on purpose:
# quoted heredoc (what is written here is exactly what the NAS runs), paths in
# as ENVIRONMENT, reachability probed separately and never swallowed, and the
# verdict line parsed from the real output rather than assumed (DR-0076 §1).
#
# Requires: NAS_SSH_KEY in the environment, and the tailnet already joined by
# the calling workflow (tailscale/github-action). STORAGE_BUCKET (optional)
# limits the copy to one bucket; empty means every bucket in scope.
#
# Exits 0 only when storage_sync.py reported "verdict GO". A copy that cannot be
# served back is not done, and this lane never says it is.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_REPO="${NAS_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
STORAGE_BUCKET="${STORAGE_BUCKET:-}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Storage blob copy - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so the NAS could not be reached."
  say "An uncopied bucket is never reported as copied (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - nothing was copied"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

# LogLevel=ERROR is correctness, not tidiness (see sovereign-replay-over-tailnet.sh):
# a fresh runner's first-connection banner must never enter a captured value.
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""
err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done

if [ "$probe" != "READY" ]; then
  say "## Storage blob copy - NOT RUN"
  say ""
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error:"
  say ""
  say "    $err"
  say ""
  echo "::error::NAS unreachable - nothing was copied"
  exit 3
fi

# QUOTED heredoc; the repo path and bucket ride in as ENVIRONMENT on the ssh
# command line. Nothing here is interpolated locally.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
REPO="${NAS_REPO:?NAS_REPO not passed through}"
BUCKET="${STORAGE_BUCKET:-}"

# The copy reads storage_sync.py from the NAS checkout, so it can only run what
# that checkout holds. Pull first and say which commit ran.
cd "$REPO" || { echo "repo not found at $REPO" >&2; exit 6; }
git pull --ff-only 2>&1 | tail -3
echo "REPO-HEAD=$(git rev-parse --short HEAD)"

# DSM does not put every binary on a non-login ssh shell's PATH (the docker
# lesson, scripts/nas-docker-path-guard.mjs). Resolve python3 the same way.
PY=$(command -v python3 2>/dev/null || true)
if [ -z "$PY" ]; then
  for c in /usr/local/bin/python3 /usr/bin/python3 /opt/bin/python3; do
    [ -x "$c" ] && PY="$c" && break
  done
fi
[ -n "$PY" ] || { echo "python3 not found (PATH, /usr/local/bin, /usr/bin, /opt/bin)" >&2; exit 4; }

# agent.env and the stack's .env are root-readable on the box; run as root only
# when the ssh user cannot read them (the replay lane's own sudo -n idiom).
RUN="$PY"
if [ ! -r /volume1/docker/poetech/agent.env ] || [ ! -r /volume1/docker/supabase/.env ]; then
  RUN="sudo -n $PY"
fi
# Presence only — the key itself is never read into the log.
if grep -q '^HOSTED_SERVICE_ROLE_KEY=.' /volume1/docker/poetech/agent.env 2>/dev/null \
   || sudo -n grep -q '^HOSTED_SERVICE_ROLE_KEY=.' /volume1/docker/poetech/agent.env 2>/dev/null; then
  echo "HOSTED-KEY-PRESENT=yes"
else
  echo "HOSTED-KEY-PRESENT=no"
fi

cd "$REPO/infra/nas-supabase" || { echo "infra/nas-supabase missing in checkout" >&2; exit 6; }
echo "----- storage-sync output -----"
if [ -n "$BUCKET" ]; then
  $RUN storage_sync.py "--bucket=$BUCKET" 2>&1
else
  $RUN storage_sync.py 2>&1
fi
rc=$?
echo "----- end storage-sync (exit $rc) -----"
exit $rc
REMOTE

ERRFILE="$(mktemp)"
OUT=$($SSH "NAS_REPO='$NAS_REPO' STORAGE_BUCKET='$STORAGE_BUCKET' bash -s" < "$REMOTE_SCRIPT" 2>"$ERRFILE")
rc=$?
errtxt=$(cat "$ERRFILE" 2>/dev/null)
rm -f "$REMOTE_SCRIPT" "$ERRFILE"

head_sha=$(printf '%s\n' "$OUT" | sed -n 's/^REPO-HEAD=//p' | tail -1)
key_present=$(printf '%s\n' "$OUT" | sed -n 's/^HOSTED-KEY-PRESENT=//p' | tail -1)
scope=$(printf '%s\n' "$OUT" | sed -n 's/^storage-sync: scope //p' | tail -1)
proof=$(printf '%s\n' "$OUT" | sed -n 's/^storage-sync: proof //p' | tail -1)
verdict=$(printf '%s\n' "$OUT" | sed -n 's/^storage-sync: verdict //p' | tail -1)

say "## Storage blob copy - $(date -u +%FT%TZ)"
say ""
say "- NAS checkout: ${head_sha:-unknown}"
say "- bucket: ${STORAGE_BUCKET:-(every bucket in scope)}"
say "- hosted service key in agent.env: ${key_present:-unknown} (presence only; never printed)"
say "- scope: ${scope:-unknown}"
say "- served-back proof: ${proof:-none}"
say "- verdict: ${verdict:-none}"
say ""
say "### output"
printf '%s\n' "$OUT" | while IFS= read -r l; do say "    $l"; done

if [ -n "$errtxt" ]; then
  say ""
  say "### stderr"
  printf '%s\n' "$errtxt" | while IFS= read -r l; do say "    $l"; done
fi

if [ "$rc" -ne 0 ] || [ "$verdict" != "GO" ]; then
  say ""
  say "The copy did NOT reach parity, or its proof read failed. The output above names the bucket and the object (DR-0076)."
  echo "::error::storage sync exited $rc with verdict '${verdict:-none}'"
  exit 1
fi

say ""
say "Every bucket in scope is whole on the sovereign side and served back anonymously through kong."
exit 0
