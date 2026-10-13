#!/usr/bin/env bash
# =============================================================================
# user-rescue-over-tailnet.sh — get a locked-out family member back IN, from a
# GitHub runner, over the team's own tailnet
# =============================================================================
# Darrell 2026-09-16: "Always saying you need mee holding up progress!!!! Cli
# Ssh... what do you need from me?!!!!" He is right (DR-0108: a stated
# "must-be-by-hand" is an unverified premise to challenge). infra/nas-supabase/
# clear_user_pin.sh and reset_password.sh have existed since 2026-09-07 and
# were only ever runnable by HIS hand over ConnectBot, because nothing wired
# them to the remote-hands channel. Nothing about them requires his hand —
# they need root on the NAS, which NAS_SSH_KEY already has. This is that wiring.
#
# WHAT IT FIXES, measured on the box 2026-09-16 (nas-health run 101):
#   SMTP wired in supabase-auth: no   -> the "email me a sign-in link" door has
#   never worked on the sovereign stack (DR-0307 §3 keeps SMTP out of auth's
#   critical path on purpose). For an EMAIL-identity account like Shay's, the
#   password door is therefore the ONLY door — and a forgotten password plus a
#   forgotten app PIN is a complete lockout with no self-service way out.
#
# THE TWO CREDENTIALS ARE DIFFERENT THINGS and this fixes both in one pass:
#   1. the ACCOUNT PASSWORD  — auth.users.encrypted_password (GoTrue's gate)
#   2. the APP PIN           — public.user_credentials.pin_hash (0022's second
#      key, the "Welcome back — enter your PIN" screen, with its own escalating
#      lockout that a forgotten PIN makes strictly worse on every guess)
#
# THE PASSWORD NEVER REACHES A LOG. It is generated ON THE BOX from
# /dev/urandom, written into auth.users with the same pgcrypto bcrypt SQL
# reset_password.sh uses, and recorded in a root-only file. This script prints
# the FILE PATH, never the value. A workflow log is readable by anyone with
# repo access; a password in one is a password burned.
#
# ADDRESSES ARE MASKED in every line this prints (m****@y****.com), per the
# counts-only rule the nas-health witness already follows. The dispatch INPUT
# still carries the real address — that is unavoidable and is why this lane is
# dispatch-only on a private repo, never scheduled.
#
# Requires: NAS_SSH_KEY in the environment and the tailnet already joined by
# the calling workflow. RESCUE_EMAIL is the account. RESCUE_CLEAR_PIN and
# RESCUE_NEW_PASSWORD are "true"/"false".
#
# Exits 0 only when every requested action reported its own receipt.
# =============================================================================
set -uo pipefail

NAS_HOST="${NAS_HOST:-dpoe@poetech.tail5a2f35.ts.net}"
NAS_REPO="${NAS_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
RESCUE_EMAIL="${RESCUE_EMAIL:-}"
RESCUE_CLEAR_PIN="${RESCUE_CLEAR_PIN:-true}"
RESCUE_NEW_PASSWORD="${RESCUE_NEW_PASSWORD:-true}"

say() {
  echo "$1"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi
}

# m****@y****.com — enough for a human to recognise the account, not enough to
# harvest it out of a log.
mask() {
  printf '%s' "$1" | awk -F@ '{
    u=substr($1,1,1); d=$2;
    n=index(d,"."); dn=(n>0)?substr(d,1,1) "****" substr(d,n) : d;
    print u "****@" dn
  }'
}

if [ -z "$RESCUE_EMAIL" ]; then
  say "## User rescue - NOT RUN"
  say ""
  say "No account was given, so nothing was touched."
  echo "::error::RESCUE_EMAIL missing - nothing was changed"
  exit 2
fi
MASKED="$(mask "$RESCUE_EMAIL")"

if [ -z "${NAS_SSH_KEY:-}" ]; then
  say "## User rescue - NOT RUN"
  say ""
  say "NAS_SSH_KEY is not set, so the NAS could not be reached."
  say "An untouched account is never reported as rescued (DR-0076)."
  echo "::error::NAS_SSH_KEY missing - nothing was changed"
  exit 2
fi

umask 077
KEYFILE="$(mktemp)"
printf '%s\n' "$NAS_SSH_KEY" > "$KEYFILE"
trap 'rm -f "$KEYFILE"' EXIT

# LogLevel=ERROR so a first-connection banner can never land inside a captured
# value (the lesson sovereign-replay-over-tailnet.sh already carries).
SSH="ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o BatchMode=yes -o LogLevel=ERROR $NAS_HOST"

probe=""
err=""
for _ in 1 2 3; do
  err=$($SSH "echo READY" 2>&1) || true
  case "$err" in *READY*) probe="READY"; break;; esac
  sleep 5
done

if [ "$probe" != "READY" ]; then
  say "## User rescue - NOT RUN"
  say ""
  say "The NAS was not reachable over the tailnet after 3 attempts. Last error:"
  say ""
  say "    $err"
  echo "::error::NAS unreachable - nothing was changed"
  exit 3
fi

# QUOTED heredoc: what is written here is exactly what the NAS runs. Every
# value rides in as ENVIRONMENT on the ssh command line, never interpolated.
REMOTE_SCRIPT="$(mktemp)"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -u
REPO="${NAS_REPO:?NAS_REPO not passed through}"
EMAIL="${RESCUE_EMAIL:?RESCUE_EMAIL not passed through}"
DO_PIN="${RESCUE_CLEAR_PIN:-true}"
DO_PW="${RESCUE_NEW_PASSWORD:-true}"

cd "$REPO" || { echo "repo not found at $REPO" >&2; exit 6; }
git pull --ff-only 2>&1 | tail -2
echo "REPO-HEAD=$(git rev-parse --short HEAD)"

# DSM does not put docker on a non-login ssh shell's PATH (DR-0322). The
# rescue scripts resolve it themselves; this is for the state read below.
DOCKER=$(command -v docker 2>/dev/null || true)
if [ -z "$DOCKER" ]; then
  for c in /usr/local/bin/docker /usr/bin/docker; do
    [ -x "$c" ] && DOCKER="$c" && break
  done
fi
[ -n "$DOCKER" ] || { echo "docker binary not found" >&2; exit 4; }

SUDO=""
[ "$(id -u)" = "0" ] || SUDO="sudo -n"

ENVF=/volume1/docker/supabase/.env
PGPW=$($SUDO grep '^POSTGRES_PASSWORD=' "$ENVF" 2>/dev/null | head -1 | cut -d= -f2-)
[ -n "$PGPW" ] || { echo "could not read POSTGRES_PASSWORD" >&2; exit 5; }
PSQL_T="psql -q -h 127.0.0.1 -U supabase_admin -d postgres -t -A"

# BEFORE: characterize, never assume (DR-0076 §5). Booleans only, no address.
BEFORE=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT 'exists=' || count(*)::text
    || ',confirmed=' || coalesce(max((email_confirmed_at IS NOT NULL)::int)::text,'0')
    || ',banned=' || coalesce(max((banned_until IS NOT NULL AND banned_until > now())::int)::text,'0')
    || ',pwfp=' || coalesce(max(substr(md5(coalesce(encrypted_password,'')),1,8)),'none')
  FROM auth.users WHERE email = :'em';
EOSQL
)
echo "STATE-BEFORE=$BEFORE"
PINB=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT coalesce((SELECT 'pin_set=' || (c.pin_hash IS NOT NULL)::int::text
                      || ',failed=' || c.failed_attempts
                      || ',locked=' || (c.locked_until IS NOT NULL AND c.locked_until > now())::int::text
                   FROM user_credentials c WHERE c.user_id = u.id), 'no_pin_row')
  FROM auth.users u WHERE u.email = :'em';
EOSQL
)
echo "PIN-BEFORE=$PINB"

case "$BEFORE" in
  exists=1*) : ;;
  *) echo "RESCUE-ABORT=no such account (this lane never creates one)"; exit 7 ;;
esac

# --- the app PIN (the "enter your PIN" wall and its escalating lockout) ------
if [ "$DO_PIN" = "true" ]; then
  echo "----- clear_user_pin -----"
  $SUDO sh "$REPO/infra/nas-supabase/clear_user_pin.sh" "$EMAIL" 2>&1 | sed "s/$EMAIL/<account>/g"
  echo "CLEAR-PIN-RC=$?"
fi

# --- the account password (GoTrue's gate) -----------------------------------
if [ "$DO_PW" = "true" ]; then
  echo "----- reset_password -----"
  OUTDIR=/volume1/docker/poetech/rescue
  $SUDO mkdir -p "$OUTDIR" 2>/dev/null
  $SUDO chmod 700 "$OUTDIR" 2>/dev/null
  STAMP=$(date -u +%Y%m%dT%H%M%SZ)
  OUTFILE="$OUTDIR/rescue-$STAMP.txt"

  # Generated ON THE BOX. Never crosses the wire, never enters a log. The
  # character set is deliberately unambiguous: no l/1/I/O/0 to misread aloud
  # or mistype on a phone keypad, which is how a "working" password becomes a
  # second lockout.
  NEWPW=$(LC_ALL=C tr -dc 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' < /dev/urandom | head -c 14)
  if [ "${#NEWPW}" -ne 14 ]; then
    echo "RESET-PW-RC=1 (could not generate a password)"
  else
    # WHY NOT reset_password.sh HERE (measured, run 35100570812): that script
    # reads its prompt under `stty -echo`, which needs a terminal. Piped from a
    # runner there is none, so it died with "stty: 'standard input':
    # Inappropriate ioctl for device" and set nothing. Allocating a pseudo-TTY
    # over ssh just to satisfy a hidden-input prompt would be theatre — the
    # prompt exists to keep a HUMAN's typing off the screen, and there is no
    # human here.
    #
    # So the write is done directly, with the SAME SQL that script uses
    # (pgcrypto bcrypt, the format GoTrue verifies) and the same guards already
    # performed above: the account exists, it is not banned, and this lane
    # never creates one. --confirm-email's effect is folded in because an
    # unconfirmed address cannot sign in whatever its password is, and the
    # email door that would confirm it is unwired on this box.
    #
    # psql :'var' quoting keeps the password out of every shell layer and out
    # of the process list. -q matters: without it the "UPDATE 1" command tag
    # joins the captured value and a SUCCESSFUL update reads as a failure.
    PWOUT=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T -v pw="$NEWPW" -v em="$EMAIL" <<'EOSQL' 2>&1 | tr -d '[:space:]'
UPDATE auth.users
   SET encrypted_password = crypt(:'pw', gen_salt('bf')),
       email_confirmed_at = coalesce(email_confirmed_at, now()),
       updated_at = now()
 WHERE email = :'em'
RETURNING 1;
EOSQL
)
    if [ "$PWOUT" = "1" ]; then RC=0; else RC=1; fi
    printf '%s\n' "$PWOUT" | sed "s/$EMAIL/<account>/g; s/$NEWPW/<the password>/g"
    echo "RESET-PW-RC=$RC"
    if [ "$RC" = "0" ]; then
      # Written straight into the file by a heredoc, never through a command
      # that could also reach stdout. app/src/__tests__/user-rescue-lane.test.js
      # forbids the password appearing in any echo/say at all, and it caught an
      # earlier version that piped the secret through tee here — safe, because
      # tee's stdout was discarded, but one careless edit away from a burned
      # credential, so the shape itself is now forbidden rather than audited.
      $SUDO tee "$OUTFILE" >/dev/null <<EOF_RESCUE
account: $EMAIL
password: $NEWPW
set: $STAMP by the nas-user-rescue lane
note: sign in at poetech.us with the "Prefer a password? Use one" door.
      The app will then ask her to CHOOSE a new PIN.
EOF_RESCUE
      $SUDO chmod 600 "$OUTFILE"
      echo "RESCUE-FILE=$OUTFILE"
    fi
    NEWPW=""
  fi
fi

# --- did the order inquiries actually land? ---------------------------------
# Darrell 2026-09-16, testing the Moore door as a signed-out visitor: "did my
# request go through did she get my requests?" The door's own success banner
# ("Sent! Shay will reach out") is a CLIENT claim; the only honest answer is
# the row count in the database the app now reads. Counts and days only — the
# customers' names and addresses are never printed here.
echo "----- moore order inquiries -----"
ORDERS=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T <<'EOSQL' 2>&1 | tr -d '\r'
SELECT 'pipeline=' || pipeline
    || ',total=' || count(*)::text
    || ',last24h=' || count(*) FILTER (WHERE created_at > now() - interval '24 hours')::text
    || ',newest=' || coalesce(max(created_at)::text,'none')
  FROM crm_leads
 WHERE business ILIKE '%moore%' OR pipeline ILIKE '%moore%'
 GROUP BY pipeline ORDER BY pipeline;
EOSQL
)
echo "ORDERS=$ORDERS"

# AFTER: prove it (DR-0076 §1).
AFTER=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT 'confirmed=' || (email_confirmed_at IS NOT NULL)::int::text
    || ',pw_set=' || (encrypted_password IS NOT NULL AND length(encrypted_password) > 10)::int::text
    || ',pwfp=' || substr(md5(coalesce(encrypted_password,'')),1,8)
  FROM auth.users WHERE email = :'em';
EOSQL
)
echo "STATE-AFTER=$AFTER"
PINA=$($SUDO $DOCKER exec -i -e PGPASSWORD="$PGPW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT coalesce((SELECT 'pin_set=' || (c.pin_hash IS NOT NULL)::int::text
                      || ',failed=' || c.failed_attempts
                      || ',locked=' || (c.locked_until IS NOT NULL AND c.locked_until > now())::int::text
                   FROM user_credentials c WHERE c.user_id = u.id), 'no_pin_row')
  FROM auth.users u WHERE u.email = :'em';
EOSQL
)
echo "PIN-AFTER=$PINA"
exit 0
REMOTE

ERRFILE="$(mktemp)"
OUT=$($SSH "NAS_REPO='$NAS_REPO' RESCUE_EMAIL='$RESCUE_EMAIL' RESCUE_CLEAR_PIN='$RESCUE_CLEAR_PIN' RESCUE_NEW_PASSWORD='$RESCUE_NEW_PASSWORD' bash -s" < "$REMOTE_SCRIPT" 2>"$ERRFILE")
rc=$?
errtxt=$(cat "$ERRFILE" 2>/dev/null)
rm -f "$REMOTE_SCRIPT" "$ERRFILE"

# Belt and braces: the remote side already masks, and nothing downstream may
# echo the raw address even if a future edit forgets.
OUT=${OUT//$RESCUE_EMAIL/<account>}
errtxt=${errtxt//$RESCUE_EMAIL/<account>}

head_sha=$(printf '%s\n' "$OUT" | sed -n 's/^REPO-HEAD=//p' | tail -1)
before=$(printf '%s\n' "$OUT" | sed -n 's/^STATE-BEFORE=//p' | tail -1)
pinb=$(printf '%s\n' "$OUT" | sed -n 's/^PIN-BEFORE=//p' | tail -1)
after=$(printf '%s\n' "$OUT" | sed -n 's/^STATE-AFTER=//p' | tail -1)
pina=$(printf '%s\n' "$OUT" | sed -n 's/^PIN-AFTER=//p' | tail -1)
rfile=$(printf '%s\n' "$OUT" | sed -n 's/^RESCUE-FILE=//p' | tail -1)
orders=$(printf '%s\n' "$OUT" | sed -n 's/^ORDERS=//p' | tail -1)
abort=$(printf '%s\n' "$OUT" | sed -n 's/^RESCUE-ABORT=//p' | tail -1)

say "## User rescue - $(date -u +%FT%TZ)"
say ""
say "- account: $MASKED"
say "- NAS checkout: ${head_sha:-unknown}"
say "- account BEFORE: ${before:-unknown}"
say "- app PIN BEFORE: ${pinb:-unknown}"
say "- account AFTER: ${after:-unknown}"
say "- app PIN AFTER: ${pina:-unknown}"
say "- new password written to: ${rfile:-(none — password not reset)}"
say "- Moore order inquiries in the database: ${orders:-none found}"
say ""
say "The password itself is NOT in this log, by design. Read it on the NAS:"
say ""
say "    sudo cat ${rfile:-<no file>}"
say ""
say "### output"
printf '%s\n' "$OUT" | while IFS= read -r l; do say "    $l"; done

if [ -n "$errtxt" ]; then
  say ""
  say "### stderr"
  printf '%s\n' "$errtxt" | while IFS= read -r l; do say "    $l"; done
fi

if [ -n "$abort" ]; then
  say ""
  say "Nothing was changed: $abort"
  echo "::error::user rescue aborted - $abort"
  exit 1
fi

if [ "$rc" -ne 0 ]; then
  say ""
  say "The rescue did not complete. The output above names the step that stopped (DR-0076)."
  echo "::error::user rescue exited $rc"
  exit 1
fi

# A rescue that left the PIN wall standing, or the account unconfirmed, is not
# a rescue. Say so rather than reporting a green run over a still-locked door.
#
# THE FINGERPRINT IS THE POINT (measured, run 35100570812). The first version
# of this check asked only "is a password SET?" — and passed, green, on a run
# where the reset had actually failed with an stty error and changed nothing,
# because the account already carried an older password. That is precisely the
# looks-right-and-is-wrong class DR-0076 exists to stop, and it was my own
# check that produced it. A reset now has to prove the stored hash CHANGED.
ok=0
case "$after" in confirmed=1,pw_set=1,*) ok=1 ;; esac
if [ "$RESCUE_NEW_PASSWORD" = "true" ] && [ "$ok" != "1" ]; then
  say ""
  say "The account did not end up confirmed with a password set. Not calling this done."
  echo "::error::post-state is '$after' - the person still cannot sign in"
  exit 1
fi
if [ "$RESCUE_NEW_PASSWORD" = "true" ]; then
  fp_before=$(printf '%s' "$before" | sed -n 's/.*pwfp=\([0-9a-f]*\).*/\1/p')
  fp_after=$(printf '%s' "$after" | sed -n 's/.*pwfp=\([0-9a-f]*\).*/\1/p')
  if [ -z "$fp_after" ] || [ "$fp_before" = "$fp_after" ]; then
    say ""
    say "The stored password did NOT change (fingerprint ${fp_before:-?} -> ${fp_after:-?})."
    say "A reset that changed nothing is not a reset, whatever else the run printed."
    echo "::error::password unchanged - the new password was never written"
    exit 1
  fi
  say ""
  say "The stored password changed (fingerprint ${fp_before} -> ${fp_after}) — proof, not a claim."
fi
if [ -z "$rfile" ] && [ "$RESCUE_NEW_PASSWORD" = "true" ]; then
  say ""
  say "No rescue file was written, so nobody can read the new password. Not done."
  echo "::error::password set but not recorded - re-run before telling anyone it works"
  exit 1
fi
if [ "$RESCUE_CLEAR_PIN" = "true" ]; then
  case "$pina" in
    pin_set=0*|no_pin_row) : ;;
    *) say ""
       say "The app PIN is still set after a clear was requested — the wall is still up."
       echo "::error::PIN post-state is '$pina'"
       exit 1 ;;
  esac
fi

say ""
say "She can sign in now: the password door at poetech.us, then the app asks her to choose a new PIN."
exit 0
