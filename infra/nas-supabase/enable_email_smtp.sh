#!/bin/sh
# =============================================================================
# enable_email_smtp.sh — turn ON email sending for the sovereign stack
# =============================================================================
# Darrell 2026-08-20: "Are we done with the email fix yet!!!!!" The sovereign
# stack deliberately shipped with SMTP unset (DR-0307 §3: phone+PIN and
# password lead; email sending is the ONE dependency self-hosting does not
# remove). This is the finish: the family's own hand, on the family's own box,
# wires the family's own Gmail as the sender. Run as root (sudo) on the NAS:
#
#   sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/enable_email_smtp.sh
#
# Prompts for the 16-character Google App Password silently (never in shell
# history, never on screen, never in any log), rewrites the four SMTP_* lines
# in /volume1/docker/supabase/.env in place, restarts supabase-auth so GoTrue
# picks them up, and PROVES the result by asking GoTrue's health endpoint —
# a receipt, not a claim (DR-0076).
#
# Make the App Password at: https://myaccount.google.com/apppasswords
# (requires 2-Step Verification on the Google account; type the 16 characters
# here WITHOUT spaces).
set -eu

ENV_FILE="/volume1/docker/supabase/.env"
[ -f "$ENV_FILE" ] || { echo "enable_email_smtp: $ENV_FILE not found"; exit 1; }
DOCKER=$(command -v docker || echo /usr/local/bin/docker)

SENDER="${1:-darrellpoe06@gmail.com}"

printf 'Google App Password for %s (typing is hidden, no spaces): ' "$SENDER"
stty -echo; read -r AP; stty echo; printf '\n'
AP=$(printf '%s' "$AP" | tr -d ' ')
case "$AP" in
  ????????????????) : ;;
  *) echo "enable_email_smtp: an App Password is exactly 16 characters (got ${#AP}) — nothing changed"; exit 1 ;;
esac

# Rewrite in place; set_kv in install.sh never clobbers these once set, so
# this edit is durable across every future cycle. awk (not sed) so the
# password is never part of a command pattern.
TMP="$ENV_FILE.tmp.$$"
awk -v pass="$AP" -v user="$SENDER" '
  /^SMTP_HOST=/ { print "SMTP_HOST=smtp.gmail.com"; next }
  /^SMTP_PORT=/ { print "SMTP_PORT=587"; next }
  /^SMTP_USER=/ { print "SMTP_USER=" user; next }
  /^SMTP_PASS=/ { print "SMTP_PASS=" pass; next }
  { print }
' "$ENV_FILE" > "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$ENV_FILE"

echo "enable_email_smtp: SMTP wired (smtp.gmail.com:587 as $SENDER) — restarting the auth service"
$DOCKER restart supabase-auth >/dev/null

i=0
while [ $i -lt 12 ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8800/auth/v1/health 2>/dev/null || echo 000)
  [ "$code" = "200" ] && { echo "enable_email_smtp: auth answers 200 — email sending is ON. Try 'EMAIL ME MY SIGN-IN LINK' at poetech.us."; exit 0; }
  i=$((i + 1)); sleep 5
done
echo "enable_email_smtp: auth did not answer 200 within 60s — check: sudo docker logs --tail 20 supabase-auth" >&2
exit 1
