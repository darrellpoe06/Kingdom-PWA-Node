#!/usr/bin/env bash
# =============================================================================
# church-site-archive-over-tailnet — carry the collector's folder to the NAS
# and keep what is new (DR-1596)
# =============================================================================
# The road sovereign-read and push-outbox-drain already walk: tailnet -> ssh.
# The folder (manifest.json + files/) and church_archive_keep.py go over in one
# tar stream to a fresh temp folder on the NAS; the keeper runs there against
# kong on 127.0.0.1 with the box's own service key; the temp folder is removed
# whatever happens. Nothing new is trusted, nothing secret is printed.
# Usage: church-site-archive-over-tailnet.sh <collector folder>
# =============================================================================
set -uo pipefail

DIR="${1:?usage: church-site-archive-over-tailnet.sh <collector folder>}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
KEEPER="$HERE/infra/nas-church-archive/church_archive_keep.py"

say() { echo "$1"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "$1" >> "$GITHUB_STEP_SUMMARY"; }

[ -f "$DIR/manifest.json" ] || { echo "::error::no manifest.json in $DIR"; exit 2; }
COUNT="$(jq '.items | length' "$DIR/manifest.json")"
say "## Church site archive: ${COUNT} picture(s) read from the site"
if [ "${COUNT:-0}" = "0" ]; then say "Nothing to keep this run."; exit 0; fi
if [ -z "${NAS_SSH_KEY:-}" ]; then say "NOT KEPT: NAS_SSH_KEY is not set."; echo "::error::NAS_SSH_KEY missing"; exit 2; fi

umask 077
KEYFILE="$(mktemp)"; printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"; trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o ServerAliveInterval=15 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

ok=""
for _ in 1 2 3; do
  if $SSH 'echo READY' 2>/dev/null | grep -q READY; then ok=1; break; fi
  sleep 5
done
[ -n "$ok" ] || { say "NOT KEPT: the NAS was not reachable over the tailnet."; echo "::error::NAS unreachable"; exit 3; }

cp "$KEEPER" "$DIR/church_archive_keep.py"
cat > "$DIR/run.sh" <<'RUN'
set -u
T="$1"
PY=$(command -v python3 2>/dev/null || true)
for c in /usr/local/bin/python3 /usr/bin/python3 /opt/bin/python3; do [ -z "$PY" ] && [ -x "$c" ] && PY="$c"; done
[ -n "$PY" ] || { echo "python3 not found on the NAS"; exit 4; }
if [ -r /volume1/docker/supabase/.env ]; then "$PY" "$T/church_archive_keep.py" "$T"; else sudo -n "$PY" "$T/church_archive_keep.py" "$T"; fi
RUN

# One stream over: a fresh temp folder on the NAS, removed whatever happens.
OUT="$(tar -C "$DIR" -czf - manifest.json files church_archive_keep.py run.sh \
  | $SSH 'T=$(mktemp -d /tmp/church-archive.XXXXXX) || exit 5; tar -C "$T" -xzf - || { rm -rf "$T"; exit 6; }; bash "$T/run.sh" "$T"; rc=$?; rm -rf "$T"; exit $rc' 2>&1)"
RC=$?
printf '%s\n' "$OUT"
say "$(printf '%s\n' "$OUT" | grep -E '^(ARCHIVE-RESULT|kept:)' || echo 'no result line')"
exit $RC
