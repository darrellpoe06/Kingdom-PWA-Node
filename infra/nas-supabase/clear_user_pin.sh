#!/bin/sh
# =============================================================================
# clear_user_pin.sh — sovereign PIN reset for the app's SECOND key
# =============================================================================
# Born 2026-09-07 17:00 CDT, Shay's screen: "Welcome back — enter your PIN"
# then "Too many attempts. Please wait 134 seconds." She set that PIN on
# 2026-06-17 and does not have it; her row already carried 8 failed attempts
# across the cutover, so every wrong try now buys a longer wait (0022:
# 30s doubling to 300s). "Forgot your PIN?" signs her out, and the next
# sign-in finds the same row and asks again. There was no way in.
#
# This is NOT the phone-door PIN (that is the GoTrue password behind
# reset_phone_pin.sh) and NOT the account password (reset_password.sh). It is
# the app's own second key in public.user_credentials (migration 0022), the
# one "Secure your space" asks for after sign-in. Clearing it is SAFE by the
# design's own rule (multi-point-auth.js): a signed-in person with no PIN is
# sent to SET one, never stranded, and set_user_pin is always allowed for the
# authenticated user. Identity (the password or phone sign-in) stays the
# gate; only the forgotten second key is cleared. Run as root (sudo) on the
# NAS:
#
#   sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/clear_user_pin.sh mooredivahs1@yahoo.com
#
# Then she signs in as usual and the app asks her to CHOOSE a new PIN.
# Prints the number of rows changed (must be 1) — a receipt, not a claim.
set -eu

EMAIL_RAW="${1:-}"
[ -n "$EMAIL_RAW" ] || { echo "usage: clear_user_pin.sh <account email, or <digits>@phone.poetech.us for a phone door>"; exit 1; }
EMAIL=$(printf '%s' "$EMAIL_RAW" | tr '[:upper:]' '[:lower:]')
case "$EMAIL" in
  *[!-a-z0-9._+@]*) echo "clear_user_pin: '$EMAIL_RAW' has characters an address cannot hold"; exit 1 ;;
  *@*@*|@*|*@)      echo "clear_user_pin: '$EMAIL_RAW' is not a valid email address"; exit 1 ;;
  *@*.*)            : ;;
  *)                echo "clear_user_pin: '$EMAIL_RAW' is not a valid email address"; exit 1 ;;
esac

ENV_FILE="/volume1/docker/supabase/.env"
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
[ -n "$PW" ] || { echo "clear_user_pin: no POSTGRES_PASSWORD in $ENV_FILE"; exit 1; }
# DSM does not put docker on the PATH of a non-login ssh shell (DR-0322).
DOCKER=$(command -v docker || echo /usr/local/bin/docker)
PSQL_T="psql -q -h 127.0.0.1 -U supabase_admin -d postgres -t -A"

# The account must exist. -v keeps the address out of SQL text.
FOUND=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT count(*) FROM auth.users WHERE email = :'em';
EOSQL
)
[ "$FOUND" = "1" ] || { echo "clear_user_pin: no account for $EMAIL (found $FOUND). This script never creates one."; exit 1; }

# Say what is there BEFORE changing it (DR-0076 §5: characterize first).
STATE=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
SELECT coalesce((SELECT 'pin_set=' || (c.pin_hash IS NOT NULL)::text || ',failed=' || c.failed_attempts || ',locked=' || (c.locked_until IS NOT NULL AND c.locked_until > now())::text
                   FROM user_credentials c WHERE c.user_id = u.id), 'no_row')
  FROM auth.users u WHERE u.email = :'em';
EOSQL
)
echo "clear_user_pin: before -> $STATE"
if [ "$STATE" = "no_row" ]; then
  echo "clear_user_pin: this account has no PIN row — the app already asks it to SET one. Nothing to clear."
  exit 0
fi

# Clear the second key and its lockout. The row stays (device-trust and the
# app's own bookkeeping hang off it); only the hash and the backoff go. The
# next signed-in load reads has_user_pin() = false and opens SET-PIN.
CHANGED=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db $PSQL_T -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
UPDATE user_credentials c
   SET pin_hash = NULL, pin_set_at = NULL, failed_attempts = 0, locked_until = NULL, updated_at = now()
  FROM auth.users u
 WHERE u.id = c.user_id AND u.email = :'em'
RETURNING 1;
EOSQL
)
if [ "$CHANGED" = "1" ]; then
  echo "clear_user_pin: PIN cleared for $EMAIL — sign in as usual; the app will ask for a NEW PIN."
else
  echo "clear_user_pin: UPDATE changed nothing — the row was found but not updated. Investigate before retrying."
  exit 1
fi
