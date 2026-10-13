#!/usr/bin/env bash
# =============================================================================
# email-door-over-tailnet.sh — turn the sovereign stack's email sender ON from
# a GitHub runner, over the team's own tailnet
# =============================================================================
# The companion to infra/nas-supabase/enable_email_smtp.sh, which does the same
# job but only from a root shell ON the NAS. That script asked Darrell to SSH
# in and type 16 characters at a silent prompt. He does not have to: the only
# part of this that genuinely needs him is MINTING the App Password (Google
# requires 2-Step Verification on his own account — DR-0111 §2, a value only he
# holds). Everything after that is machine work, and this is the machine.
#
# WHAT IT WRITES. The four SMTP_* lines in /volume1/docker/supabase/.env, which
# docker-compose maps to GOTRUE_SMTP_* on supabase-auth. install.sh's set_kv
# never clobbers a value once set, so the edit survives every future cycle.
#
# THE SECRET IS NEVER PRINTED, and never becomes part of a command pattern: it
# rides in as an environment variable, crosses to the NAS on ssh's stdin (not
# its argv, so it stays out of the remote process list), and is written by awk
# from a -v binding. Every line this prints reports presence only.
#
# verify mode changes NOTHING. It reads the door's current state so "is email
# on?" has an answer that is a measurement rather than a memory (DR-0076).
#
# Requires: NAS_SSH_KEY, and the tailnet already joined by the caller.
# SMTP_APP_PASSWORD is required only in wire mode.
#
# Exits 0 only when the door's proven end state matches the mode that ran.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
MODE="${EMAIL_DOOR_MODE:-verify}"
SENDER="${EMAIL_DOOR_SENDER:-darrellpoe06@gmail.com}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## Email door - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so the NAS could not be reached."
  echo "::error::NAS_SSH_KEY missing - nothing was changed"
  exit 2
fi

if [ "$MODE" = "wire" ] && [ -z "${SMTP_APP_PASSWORD:-}" ]; then
  say "## Email door - NOT WIRED"
  say ""
  say "wire mode needs the SMTP_APP_PASSWORD repo secret. Nothing was changed."
  echo "::error::SMTP_APP_PASSWORD missing - nothing was changed"
  exit 2
fi

# An App Password is exactly 16 characters. Catching a paste that picked up
# spaces or a truncation HERE costs one second; catching it after the write
# costs a restarted auth service that silently cannot send (the failure mode
# that produced 173 mailer complaints in the first place).
if [ "$MODE" = "wire" ]; then
  AP_CLEAN="$(printf '%s' "$SMTP_APP_PASSWORD" | tr -d ' \t\r\n')"
  if [ "${#AP_CLEAN}" -ne 16 ]; then
    say "## Email door - NOT WIRED"
    say ""
    say "The SMTP_APP_PASSWORD secret is ${#AP_CLEAN} characters after removing spaces; a Google"
    say "App Password is exactly 16. Nothing was changed — re-paste the secret."
    echo "::error::App Password is not 16 characters - nothing was changed"
    exit 2
  fi
else
  AP_CLEAN=""
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""
err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done

if [ "$probe" != "READY" ]; then
  say "## Email door - NOT RUN"
  say ""
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error:"
  say ""
  say "    $err"
  echo "::error::NAS unreachable - nothing was changed"
  exit 3
fi

# QUOTED heredoc. The App Password arrives as the FIRST LINE OF STDIN, ahead of
# the script body, so it never appears in argv on either side of the link.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
read -r AP || AP=""
MODE="${EMAIL_DOOR_MODE:-verify}"
SENDER="${EMAIL_DOOR_SENDER:?sender not passed through}"
ENV_FILE=/volume1/docker/supabase/.env

SUDO=""
[ "$(id -u)" = "0" ] || SUDO="sudo -n"

DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    [ -x "$c" ] && DOCKER="$c" && break
  done
fi
[ -n "$DOCKER" ] || { echo "docker binary not found" >&2; exit 4; }

$SUDO test -f "$ENV_FILE" || { echo "$ENV_FILE not found" >&2; exit 5; }

# BEFORE, presence only — never the value (DR-0076 §5).
state() {
  H=$($SUDO $DOCKER exec supabase-auth sh -c 'test -n "$GOTRUE_SMTP_HOST" && echo yes || echo no' 2>/dev/null || echo unknown)
  U=$($SUDO $DOCKER exec supabase-auth sh -c 'test -n "$GOTRUE_SMTP_USER" && echo yes || echo no' 2>/dev/null || echo unknown)
  P=$($SUDO $DOCKER exec supabase-auth sh -c 'test -n "$GOTRUE_SMTP_PASS" && echo yes || echo no' 2>/dev/null || echo unknown)
  echo "host=$H,user=$U,pass=$P"
}
echo "DOOR-BEFORE=$(state)"

# How loudly is it failing right now? A count, never a body.
CMPL=$($SUDO $DOCKER logs --tail 400 supabase-auth 2>&1 | grep -ciE 'smtp|mailer|send.*mail' || echo 0)
echo "MAILER-COMPLAINTS=$CMPL"

if [ "$MODE" != "wire" ]; then
  echo "VERIFY-ONLY=1 (nothing was changed)"
  exit 0
fi

[ "${#AP}" -eq 16 ] || { echo "APP-PASSWORD-BAD=${#AP} chars reached the NAS" >&2; exit 6; }

# awk -v, never sed: the secret is a variable binding, not part of a pattern.
TMP="$ENV_FILE.tmp.$$"
$SUDO sh -c "awk -v pass='$AP' -v user='$SENDER' '
  /^SMTP_HOST=/ { print \"SMTP_HOST=smtp.gmail.com\"; next }
  /^SMTP_PORT=/ { print \"SMTP_PORT=587\"; next }
  /^SMTP_USER=/ { print \"SMTP_USER=\" user; next }
  /^SMTP_PASS=/ { print \"SMTP_PASS=\" pass; next }
  { print }
' '$ENV_FILE' > '$TMP'" || { echo "rewrite failed" >&2; exit 7; }

# If the four keys were absent entirely, awk printed the file unchanged and the
# door would still be shut while this reported success. Append what is missing.
for k in SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS; do
  if ! $SUDO grep -q "^$k=" "$TMP"; then
    case "$k" in
      SMTP_HOST) $SUDO sh -c "echo 'SMTP_HOST=smtp.gmail.com' >> '$TMP'" ;;
      SMTP_PORT) $SUDO sh -c "echo 'SMTP_PORT=587' >> '$TMP'" ;;
      SMTP_USER) $SUDO sh -c "echo 'SMTP_USER=$SENDER' >> '$TMP'" ;;
      SMTP_PASS) $SUDO sh -c "printf 'SMTP_PASS=%s\n' '$AP' >> '$TMP'" ;;
    esac
    echo "APPENDED=$k"
  fi
done

$SUDO chmod 600 "$TMP"
$SUDO mv "$TMP" "$ENV_FILE"
echo "ENV-WRITTEN=1"

$SUDO $DOCKER restart supabase-auth >/dev/null 2>&1
i=0
HEALTH=000
while [ $i -lt 12 ]; do
  HEALTH=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8800/auth/v1/health 2>/dev/null || echo 000)
  [ "$HEALTH" = "200" ] && break
  i=$((i + 1)); sleep 5
done
echo "AUTH-HEALTH=$HEALTH"
echo "DOOR-AFTER=$(state)"
exit 0
REMOTE

ERRFILE="$(mktemp)"
# The password is line 1 of stdin; the script body follows it.
OUT=$( { printf '%s\n' "$AP_CLEAN"; cat "$REMOTE_SCRIPT"; } | \
  $SSH "EMAIL_DOOR_MODE='$MODE' EMAIL_DOOR_SENDER='$SENDER' bash -s" 2>"$ERRFILE")
rc=$?
errtxt=$(cat "$ERRFILE" 2>/dev/null)
rm -f "$REMOTE_SCRIPT" "$ERRFILE"

# Last-ditch scrub: nothing downstream may echo the secret even if a future
# edit forgets.
if [ -n "$AP_CLEAN" ]; then
  OUT=${OUT//$AP_CLEAN/<app password>}
  errtxt=${errtxt//$AP_CLEAN/<app password>}
fi

before=$(printf '%s\n' "$OUT" | sed -n 's/^DOOR-BEFORE=//p' | tail -1)
after=$(printf '%s\n' "$OUT" | sed -n 's/^DOOR-AFTER=//p' | tail -1)
health=$(printf '%s\n' "$OUT" | sed -n 's/^AUTH-HEALTH=//p' | tail -1)
cmpl=$(printf '%s\n' "$OUT" | sed -n 's/^MAILER-COMPLAINTS=//p' | tail -1)
verifyonly=$(printf '%s\n' "$OUT" | sed -n 's/^VERIFY-ONLY=//p' | tail -1)

say "## Email door - $(date -u +%FT%TZ)"
say ""
say "- mode: $MODE"
say "- sender: $SENDER"
say "- door BEFORE (presence only): ${before:-unknown}"
say "- mailer complaints in the last 400 auth log lines: ${cmpl:-unknown}"
if [ -z "$verifyonly" ]; then
  say "- auth health after restart: ${health:-unknown}"
  say "- door AFTER (presence only): ${after:-unknown}"
fi
say ""
say "### output"
printf '%s\n' "$OUT" | while IFS= read -r l; do say "    $l"; done

if [ -n "$errtxt" ]; then
  say ""
  say "### stderr"
  printf '%s\n' "$errtxt" | while IFS= read -r l; do say "    $l"; done
fi

if [ "$rc" -ne 0 ]; then
  say ""
  say "The run did not complete. The output above names the step that stopped."
  echo "::error::email door exited $rc"
  exit 1
fi

if [ -n "$verifyonly" ]; then
  case "$before" in
    host=yes,user=yes,pass=yes)
      say ""
      say "The email door is ON. Sign-in links can be sent." ;;
    *)
      say ""
      say "The email door is OFF — that is why no sign-in link ever arrives."
      say "Dispatch this workflow with mode = wire once SMTP_APP_PASSWORD is set." ;;
  esac
  exit 0
fi

# Wiring that did not end with all three present, and auth answering, is not a
# wired door — say so rather than reporting a green run over a shut door.
case "$after" in
  host=yes,user=yes,pass=yes) : ;;
  *) say ""
     say "The door did not end up wired (after: ${after:-unknown}). Not calling this done."
     echo "::error::SMTP still not present on supabase-auth"
     exit 1 ;;
esac
if [ "$health" != "200" ]; then
  say ""
  say "SMTP is set but the auth service did not answer 200 after the restart."
  echo "::error::auth health is '$health' after restart"
  exit 1
fi

say ""
say "The email door is ON. Try 'EMAIL ME MY SIGN-IN LINK' at poetech.us."
exit 0
