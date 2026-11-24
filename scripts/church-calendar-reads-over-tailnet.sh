#!/usr/bin/env bash
# =============================================================================
# church-calendar-reads-over-tailnet — the office's pictures to the runner and
# what was read in them back to the NAS (DR-1644)
# =============================================================================
# The same road church-site-archive-over-tailnet.sh walks (tailnet -> ssh, a
# fresh temp folder on the NAS removed whatever happens, the box's own service
# key never leaves the box):
#   pull <folder> [max]  the archive's calendars and flyers not yet read onto
#                        the calendar come back as <folder>/manifest.json +
#                        <folder>/files/ (church_calendar_reads.py pull)
#   file <folder>        <folder>/reads.json goes over and is filed through
#                        church_calendar_keep_read() (church_calendar_reads.py file)
# =============================================================================
set -uo pipefail

MODE="${1:?usage: church-calendar-reads-over-tailnet.sh pull|file <folder> [max]}"
DIR="${2:?usage: church-calendar-reads-over-tailnet.sh pull|file <folder> [max]}"
MAX="${3:-6}"
NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
TOOL="$HERE/infra/nas-church-archive/church_calendar_reads.py"

say() { echo "$1"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "$1" >> "$GITHUB_STEP_SUMMARY"; }
case "$MODE" in pull|file) ;; *) echo "::error::mode is pull or file"; exit 2 ;; esac
[[ "$MAX" =~ ^[0-9]+$ ]] || { echo "::error::max is a number"; exit 2; }
if [ -z "${NAS_SSH_KEY:-}" ]; then say "NOT ${MODE^^}ED: NAS_SSH_KEY is not set."; echo "::error::NAS_SSH_KEY missing"; exit 2; fi

umask 077
mkdir -p "$DIR"
KEYFILE="$(mktemp)"; printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"; trap 'rm -f "$KEYFILE"' EXIT
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o ServerAliveInterval=15 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

STAGE="$(mktemp -d)"
cp "$TOOL" "$STAGE/church_calendar_reads.py"
[ "$MODE" = "file" ] && [ -f "$DIR/reads.json" ] && cp "$DIR/reads.json" "$STAGE/reads.json"
cat > "$STAGE/run.sh" <<RUN
set -u
T="\$1"
PY=\$(command -v python3 2>/dev/null || true)
for c in /usr/local/bin/python3 /usr/bin/python3 /opt/bin/python3; do [ -z "\$PY" ] && [ -x "\$c" ] && PY="\$c"; done
[ -n "\$PY" ] || { echo "python3 not found on the NAS" >&2; exit 4; }
mkdir -p "\$T/out"
[ -f "\$T/reads.json" ] && cp "\$T/reads.json" "\$T/out/reads.json"
if [ -r /volume1/docker/supabase/.env ]; then "\$PY" "\$T/church_calendar_reads.py" $MODE "\$T/out" --max $MAX >&2; else sudo -n "\$PY" "\$T/church_calendar_reads.py" $MODE "\$T/out" --max $MAX >&2; fi
RUN
# The file mode's tool does not take --max; strip it there.
[ "$MODE" = "file" ] && sed -i "s/ --max $MAX//g" "$STAGE/run.sh"

# Over: the tool (+ reads.json). Back on stdout: the out folder as a tar (pull), nothing (file). The log comes on stderr.
LOG="$(mktemp)"
if [ "$MODE" = "pull" ]; then
  tar -C "$STAGE" -czf - . | $SSH 'T=$(mktemp -d /tmp/church-reads.XXXXXX) || exit 5; tar -C "$T" -xzf - || { rm -rf "$T"; exit 6; }; bash "$T/run.sh" "$T"; rc=$?; tar -C "$T/out" -czf - .; rm -rf "$T"; exit $rc' 2>"$LOG" | tar -C "$DIR" -xzf -
  RC=${PIPESTATUS[1]}
else
  tar -C "$STAGE" -czf - . | $SSH 'T=$(mktemp -d /tmp/church-reads.XXXXXX) || exit 5; tar -C "$T" -xzf - || { rm -rf "$T"; exit 6; }; bash "$T/run.sh" "$T"; rc=$?; rm -rf "$T"; exit $rc' 2>"$LOG"
  RC=${PIPESTATUS[1]}
fi
rm -rf "$STAGE"
cat "$LOG"
say "$(grep -E '^(PULL-RESULT|READ-RESULT|filed:)' "$LOG" || echo "no result line from the NAS ($MODE)")"
rm -f "$LOG"
exit "$RC"
