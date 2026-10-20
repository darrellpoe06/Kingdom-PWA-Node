#!/bin/sh
# lesson-mail -- an emailed lesson becomes an APP ROW, riding the ALREADY-ARMED
# services-sync clock (the church-mail / transcript-trickle pattern: zero new
# DSM entries, no human hands). DR-1132.
#
# Darrell 2026-10-20: "why can't we have something inside the app itself be the
# pipeline for collecting the lessons that come from email?" Every other way a
# lesson arrives writes an agent_inbox row and the app's own machinery takes it
# from there -- "Your lessons" reads it back, the bell rings if it waits, the NAS
# builder picks it up. Email alone poked a pull request to wake a Claude session,
# so no session meant no lesson and the app never saw it. This closes that.
#
# Each cycle (stamp-gated to LESSON_MAIL_GAP_SECONDS, default 900 = every
# 15-minute cycle) runs ONE braked pass of lesson_mail.py: at most 25 messages
# and 360 s (inside services-sync's 480 s installer ceiling), a single-flight
# PID lock, progress saved per message, and a message that fails 3 times set
# aside with its reason.
#
# No mailbox credential, or no roster to attribute a sender to a real account =
# the reader says which is missing and exits 0 (quiet no-op). A set-aside
# message exits 3 on purpose, so the cycle reds and a person looks.
#
# FIRST RUN IS INERT BY DESIGN: the credential is a Google App Password only
# Darrell can mint (behind 2-Step Verification), and the roster names which
# account a sender's rows belong to. Until both are placed by
# place_lesson_mail_key.sh, every cycle is a named no-op rather than a failure.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/nas-lesson-mail"
OUT="${LESSON_MAIL_HOME:-/volume1/PoeTech/lesson-mail}"
STAMP="$OUT/.lesson-mail.last"
GAP="${LESSON_MAIL_GAP_SECONDS:-900}"

mkdir -p "$OUT"
now=$(date +%s)
last=0
[ -f "$STAMP" ] && last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$GAP" ]; then
  echo "lesson-mail: ran $((now - last))s ago (< ${GAP}s gap) - no-op this cycle"
  exit 0
fi
echo "$now" > "$STAMP"

PY=$(command -v python3 2>/dev/null || true)
[ -n "$PY" ] || for c in /usr/local/bin/python3 /usr/bin/python3 /bin/python3; do [ -x "$c" ] && PY="$c" && break; done
if [ -z "$PY" ]; then
  echo "lesson-mail: FAILED - python3 not found on this shell's PATH"
  exit 1
fi

# The selftest runs first, every cycle: it needs no network and no database, so
# a reader that has been broken by an edit says so BEFORE it touches the
# mailbox. church_mail.py earned this -- a pass that cannot parse is not a pass.
if ! "$PY" "$DIR/lesson_mail.py" --selftest >/dev/null 2>&1; then
  echo "lesson-mail: FAILED - the reader's own selftest does not pass; not reading the mailbox"
  "$PY" "$DIR/lesson_mail.py" --selftest 2>&1 | tail -20
  exit 1
fi

LESSON_MAIL_HOME="$OUT" "$PY" "$DIR/lesson_mail.py" \
  --max-messages "${LESSON_MAIL_MAX:-25}" --max-seconds "${LESSON_MAIL_SECONDS:-360}"
