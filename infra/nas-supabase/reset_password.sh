#!/bin/sh
# =============================================================================
# reset_password.sh — sovereign password reset for an EMAIL account
# =============================================================================
# The sibling of reset_phone_pin.sh, for the other half of the family's
# accounts. reset_phone_pin.sh only ever accepted a phone number and only ever
# touched `<digits>@phone.poetech.us` — so the person whose identity IS a real
# email address (Shay at mooredivahs1@yahoo.com, 2026-09-07) had no recovery
# path on the sovereign box at all.
#
# WHY THERE IS NO EMAIL PATH TO FALL BACK ON. DR-0307 §3 keeps SMTP out of
# sovereign auth's critical path on purpose: phone+PIN and password lead,
# magic links are a later optional add. The app's own sign-in screen says so
# in its own voice ("email sending may not be set up yet ... use a password or
# the phone number + PIN door instead"). That is honest, and it is also the
# whole problem for an email-identity account whose owner does not remember
# their password: the "Prefer a password? Use one" door is the only one their
# account can open, and nothing could reset that password. This closes it —
# the same shape reset_phone_pin.sh already proved: the family's own hand, on
# the family's own box, resets the family's own credential. Run as root
# (sudo) on the NAS:
#
#   sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/reset_password.sh mooredivahs1@yahoo.com
#
# Prompts for the new password silently (never in shell history, never on
# screen, never in any log), hashes it with bcrypt via pgcrypto — the same
# format GoTrue verifies — and updates ONLY the matching account. Prints the
# number of rows changed (must be 1) so the result is a receipt, not a claim
# (DR-0076).
#
# WHAT IT WILL NOT DO, and why each refusal is deliberate:
#   * It will not touch a `@phone.poetech.us` account — that is
#     reset_phone_pin.sh's job, and only that script enforces the 6-digit PIN
#     shape the phone door validates client-side.
#   * It will not CREATE an account. A typo'd address must fail loudly, not
#     quietly mint a second identity with no instance seat (the trap that
#     makes a signed-in person land in an empty world instead of their own).
#   * It will not confirm an unconfirmed email on its own. GoTrue refuses to
#     issue a token for an unconfirmed address, so a reset there would look
#     like it worked and still not let anyone in — the script SAYS SO and
#     stops; `--confirm-email` is an explicit second decision, never a silent
#     widening of who can sign in.
set -eu

EMAIL_RAW="${1:-}"
CONFIRM_EMAIL="${2:-}"
[ -n "$EMAIL_RAW" ] || { echo "usage: reset_password.sh <email> [--confirm-email]"; exit 1; }

# Lowercase: GoTrue stores the address lowercased, and DSM's ash has no ${x,,}.
EMAIL=$(printf '%s' "$EMAIL_RAW" | tr '[:upper:]' '[:lower:]')

# Shape check before any connection. Deliberately loose (one @, something on
# each side, no whitespace or quote) — the account-exists check below is the
# real gate; this only refuses input that could never be an address.
case "$EMAIL" in
  *[!-a-z0-9._+@]*) echo "reset_password: '$EMAIL_RAW' has characters an address cannot hold"; exit 1 ;;
  *@*@*|@*|*@)      echo "reset_password: '$EMAIL_RAW' is not a valid email address"; exit 1 ;;
  *@*.*)            : ;;
  *)                echo "reset_password: '$EMAIL_RAW' is not a valid email address"; exit 1 ;;
esac

# The phone door is a different credential with a different rule. Send the
# operator to the script that enforces it rather than setting a "password" on
# an account whose client only ever submits 6 digits.
case "$EMAIL" in
  *@phone.poetech.us)
    echo "reset_password: that is a phone+PIN account — use reset_phone_pin.sh instead:"
    echo "  sudo sh $(dirname "$0")/reset_phone_pin.sh ${EMAIL%@*}"
    exit 1 ;;
esac

ENV_FILE="/volume1/docker/supabase/.env"
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
[ -n "$PW" ] || { echo "reset_password: no POSTGRES_PASSWORD in $ENV_FILE"; exit 1; }
# DSM does not put docker on the PATH of a non-login ssh shell — the root cause
# of DR-0322, where a whole migration lane exited before it ran. Resolve the
# binary, never assume it (scripts/nas-docker-path-guard.mjs enforces this).
DOCKER=$(command -v docker || echo /usr/local/bin/docker)

PSQL_T="psql -q -h 127.0.0.1 -U supabase_admin -d postgres -t -A"

# The account must exist before we prompt for anything. -v so the address is
# never spliced into SQL text (an apostrophe in a local-part is legal).
FOUND=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
  $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT count(*) FROM auth.users WHERE email = :'em';
EOSQL
)
[ "$FOUND" = "1" ] || {
  echo "reset_password: no account for $EMAIL (found $FOUND)."
  echo "  This script never creates one — check the address for a typo."
  exit 1
}

# Say what the reset will and will not accomplish BEFORE asking for a secret.
# An unconfirmed address cannot sign in no matter what its password is, and
# finding that out after the reset is how a fix gets reported as done while
# the person is still locked out (DR-0076 §1).
CONFIRMED=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
  $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT (email_confirmed_at IS NOT NULL)::text || ',' || (banned_until IS NOT NULL AND banned_until > now())::text
  FROM auth.users WHERE email = :'em';
EOSQL
)
IS_CONFIRMED=${CONFIRMED%,*}
IS_BANNED=${CONFIRMED#*,}

if [ "$IS_BANNED" = "true" ]; then
  echo "reset_password: $EMAIL is BANNED (banned_until is in the future)."
  echo "  A new password cannot sign in past a ban — lift it deliberately first."
  exit 1
fi

if [ "$IS_CONFIRMED" != "true" ]; then
  if [ "$CONFIRM_EMAIL" = "--confirm-email" ]; then
    echo "reset_password: $EMAIL is UNCONFIRMED — confirming it as well (--confirm-email given)."
  else
    echo "reset_password: $EMAIL exists but its address is UNCONFIRMED."
    echo "  GoTrue will refuse to sign it in whatever the password is, so a reset"
    echo "  alone would look like it worked and still lock the person out."
    echo "  Re-run with --confirm-email to confirm the address AND set the password:"
    echo "  sudo sh $0 $EMAIL --confirm-email"
    exit 1
  fi
fi

printf 'New password for %s (at least 8 characters, typing is hidden): ' "$EMAIL"
stty -echo; read -r NEWPW; stty echo; printf '\n'
printf 'Type it again: '
stty -echo; read -r NEWPW2; stty echo; printf '\n'
[ "$NEWPW" = "$NEWPW2" ] || { echo "reset_password: the two passwords don't match — nothing changed"; exit 1; }
# 8 is the app's own floor (validateCredentials in app/src/lib/supabase.js):
# a shorter one would be set here and then rejected by the sign-in form before
# it ever reached the server, which is a lockout wearing a success message.
[ "${#NEWPW}" -ge 8 ] || { echo "reset_password: the password must be at least 8 characters — nothing changed"; exit 1; }

# pgcrypto's crypt(..., gen_salt('bf')) emits the $2a$ bcrypt GoTrue verifies.
# psql :'var' quoting keeps the password out of every shell-quoting layer and
# out of the process list. -q matters: without it psql prints the "UPDATE 1"
# command tag even in tuples-only mode, so the capture reads "1UPDATE1" and a
# SUCCESSFUL update is reported as a failure (measured 2026-08-20 on the phone
# sibling, run 32389158714).
if [ "$IS_CONFIRMED" != "true" ]; then
  CHANGED=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
    $PSQL_T -v pw="$NEWPW" -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
UPDATE auth.users
   SET encrypted_password = crypt(:'pw', gen_salt('bf')),
       email_confirmed_at = coalesce(email_confirmed_at, now()),
       updated_at = now()
 WHERE email = :'em'
RETURNING 1;
EOSQL
  )
else
  CHANGED=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
    $PSQL_T -v pw="$NEWPW" -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
UPDATE auth.users
   SET encrypted_password = crypt(:'pw', gen_salt('bf')), updated_at = now()
 WHERE email = :'em'
RETURNING 1;
EOSQL
  )
fi

if [ "$CHANGED" = "1" ]; then
  echo "reset_password: password updated for $EMAIL — sign in with it now at the"
  echo "  \"Prefer a password? Use one\" door. No email is involved in that door."
else
  echo "reset_password: UPDATE changed nothing — the account was found but not updated. Investigate before retrying."
  exit 1
fi
