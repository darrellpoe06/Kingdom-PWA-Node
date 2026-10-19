#!/bin/sh
# church-mail -- the church office's emails become the app's documents, riding
# the ALREADY-ARMED services-sync clock (the transcript-trickle / lesson-voice
# pattern: zero new DSM entries, no human hands). DR-1091.
#
# Each cycle (stamp-gated to CHURCH_MAIL_GAP_SECONDS, default 900 = every
# 15-minute cycle) runs ONE braked pass of church_mail.py: at most 25 messages
# and 360 s (inside services-sync's 480 s installer ceiling), a single-flight
# lock, progress saved per message, and a message that fails 3 times set aside
# with its reason. The backlog of the office's past emails drains 25 per pass,
# then each new week's email lands within 15 minutes of arriving.
#
# No mailbox credential yet = the reader says so and exits 0 (quiet no-op).
# Every other failure propagates and reds the cycle (reel + ntfy), never silent.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/nas-church-mail"
OUT="$DIR/out"
STAMP="$OUT/.church-mail.last"
GAP="${CHURCH_MAIL_GAP_SECONDS:-900}"

mkdir -p "$OUT"
now=$(date +%s)
last=0
[ -f "$STAMP" ] && last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$GAP" ]; then
  echo "church-mail: ran $((now - last))s ago (< ${GAP}s gap) - no-op this cycle"
  exit 0
fi
echo "$now" > "$STAMP"

PY=$(command -v python3 2>/dev/null || true)
[ -n "$PY" ] || for c in /usr/local/bin/python3 /usr/bin/python3 /bin/python3; do [ -x "$c" ] && PY="$c" && break; done
if [ -z "$PY" ]; then
  echo "church-mail: FAILED - python3 not found on this shell's PATH"
  exit 1
fi

CHURCH_MAIL_OUT="$OUT" "$PY" "$DIR/church_mail.py" --once \
  --max-messages="${CHURCH_MAIL_MAX:-25}" --max-seconds="${CHURCH_MAIL_SECONDS:-360}"
