#!/bin/sh
# =============================================================================
# reset_phone_pin.sh — sovereign self-service PIN reset for a phone-pin account
# =============================================================================
# Born 2026-08-19, first post-cutover sign-in: the account and its bcrypt hash
# crossed to the sovereign box byte-perfect (md5 fingerprints identical), but
# the PIN in a person's memory can drift — and with SMTP deliberately absent
# (DR-0307 §3) there is no email recovery. The sovereign answer: the family's
# own hand, on the family's own box, resets the family's own PIN. Run as root
# (sudo) on the NAS:
#
#   sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/reset_phone_pin.sh 5636502416
#
# Prompts for the new 6-digit PIN silently (never in shell history, never on
# screen), hashes it with bcrypt via pgcrypto — the same format GoTrue
# verifies — and updates ONLY the matching phone-pin user. Prints the number
# of rows changed (must be 1) so the result is a receipt, not a claim.
set -eu

PHONE_RAW="${1:-}"
[ -n "$PHONE_RAW" ] || { echo "usage: reset_phone_pin.sh <10-digit phone>"; exit 1; }

# Same normalization the app uses (app/src/lib/supabase.js normalizePhone):
# strip non-digits; a US 10-digit number gains the leading 1.
DIGITS=$(printf '%s' "$PHONE_RAW" | tr -cd '0-9')
case "${#DIGITS}" in
  10) DIGITS="1$DIGITS" ;;
  11|12|13|14|15) : ;;
  *) echo "reset_phone_pin: '$PHONE_RAW' is not a valid phone number"; exit 1 ;;
esac
EMAIL="${DIGITS}@phone.poetech.us"

ENV_FILE="/volume1/docker/supabase/.env"
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
[ -n "$PW" ] || { echo "reset_phone_pin: no POSTGRES_PASSWORD in $ENV_FILE"; exit 1; }
DOCKER=$(command -v docker || echo /usr/local/bin/docker)

# The account must exist before we prompt for anything.
FOUND=$($DOCKER exec -e PGPASSWORD="$PW" supabase-db \
  psql -h 127.0.0.1 -U supabase_admin -d postgres -t -A \
  -c "SELECT count(*) FROM auth.users WHERE email='$EMAIL';")
[ "$FOUND" = "1" ] || { echo "reset_phone_pin: no account for $EMAIL (found $FOUND)"; exit 1; }

printf 'New 6-digit PIN for %s (typing is hidden): ' "$EMAIL"
stty -echo; read -r PIN; stty echo; printf '\n'
printf 'Type it again: '
stty -echo; read -r PIN2; stty echo; printf '\n'
[ "$PIN" = "$PIN2" ] || { echo "reset_phone_pin: the two PINs don't match — nothing changed"; exit 1; }
case "$PIN" in
  [0-9][0-9][0-9][0-9][0-9][0-9]) : ;;
  *) echo "reset_phone_pin: the PIN must be exactly 6 digits — nothing changed"; exit 1 ;;
esac

# pgcrypto's crypt(..., gen_salt('bf')) emits the $2a$ bcrypt GoTrue verifies.
# psql :'var' quoting keeps the PIN out of every shell-quoting layer.
# -q: without it psql prints the "UPDATE 1" command tag even in tuples-only
# mode, so the capture read "1UPDATE1" and a SUCCESSFUL update was reported
# as "found but not updated" (measured 2026-08-20, run 32389158714).
CHANGED=$($DOCKER exec -i -e PGPASSWORD="$PW" supabase-db \
  psql -q -h 127.0.0.1 -U supabase_admin -d postgres -t -A \
  -v pin="$PIN" -v em="$EMAIL" <<'EOSQL' | tr -d '[:space:]'
UPDATE auth.users
   SET encrypted_password = crypt(:'pin', gen_salt('bf')), updated_at = now()
 WHERE email = :'em'
RETURNING 1;
EOSQL
)
if [ "$CHANGED" = "1" ]; then
  echo "reset_phone_pin: PIN updated for $EMAIL — sign in with it now."
else
  echo "reset_phone_pin: UPDATE changed nothing — the account was found but not updated. Investigate before retrying."
  exit 1
fi
