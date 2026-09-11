#!/bin/sh
# =============================================================================
# enable_google_oauth.sh — turn ON Google sign-in for the sovereign stack
# =============================================================================
# 2026-09-11, 11:58am: a Love Corner meeting tapped "Continue with Google" and
# got GoTrue's raw 400 JSON -- "Unsupported provider: provider is not enabled".
# On hosted Supabase, Google was enabled in the DASHBOARD, and a dashboard
# setting is not a file, so it never travelled with the cutover (DR-0361).
#
# The compose file now carries the provider (delivered by services-sync like
# everything else here). What no channel of ours may carry is the client
# SECRET -- it must never reach a GitHub Actions log or a chat transcript. So
# this is the lawful tail: a secret value, typed by the person who holds it,
# onto the family's own box. Run as root (sudo) on the NAS:
#
#   sudo sh /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/enable_google_oauth.sh
#
# BEFORE running this, in the Google Cloud console (a console click no channel
# of ours reaches), on the OAuth 2.0 Client ID used for poetech.us, add this
# to "Authorized redirect URIs" EXACTLY:
#
#   https://poetech.us/sb/auth/v1/callback
#
#   https://console.cloud.google.com/apis/credentials
#
# Prompts for the client secret silently (never in shell history, never on
# screen, never in any log), rewrites the GOOGLE_* lines in
# /volume1/docker/supabase/.env in place, restarts supabase-auth, and then
# PROVES the result by reading GoTrue's own settings and requiring
# "google":true -- a receipt, not a claim (DR-0076). That endpoint is the
# exact one the app's pre-flight guard reads, so a pass here is a pass there.
set -eu

ENV_FILE="/volume1/docker/supabase/.env"
[ -f "$ENV_FILE" ] || { echo "enable_google_oauth: $ENV_FILE not found"; exit 1; }
DOCKER=$(command -v docker || echo /usr/local/bin/docker)
CALLBACK="https://poetech.us/sb/auth/v1/callback"

# Client ID is not a secret (it ships in every OAuth redirect), so it may be
# passed as an argument or typed in the clear.
CID="${1:-}"
if [ -z "$CID" ]; then
  printf 'Google OAuth client ID (ends in .apps.googleusercontent.com): '
  read -r CID
fi
case "$CID" in
  *.apps.googleusercontent.com) : ;;
  *) echo "enable_google_oauth: that does not look like a client ID (expected it to end .apps.googleusercontent.com) - nothing changed"; exit 1 ;;
esac

printf 'Google OAuth client SECRET (typing is hidden): '
stty -echo; read -r CSEC; stty echo; printf '\n'
CSEC=$(printf '%s' "$CSEC" | tr -d ' ')
if [ -z "$CSEC" ]; then
  echo "enable_google_oauth: empty secret - nothing changed"; exit 1
fi

# Rewrite in place. awk (not sed) so the secret is never part of a command
# pattern. install.sh's set_kv never clobbers a key that exists, so this edit
# is durable across every future services-sync cycle.
TMP="$ENV_FILE.tmp.$$"
awk -v cid="$CID" -v csec="$CSEC" -v cb="$CALLBACK" '
  /^GOOGLE_ENABLED=/       { print "GOOGLE_ENABLED=true";        seen_en=1; next }
  /^GOOGLE_CLIENT_ID=/     { print "GOOGLE_CLIENT_ID=" cid;      seen_id=1; next }
  /^GOOGLE_SECRET=/        { print "GOOGLE_SECRET=" csec;        seen_sec=1; next }
  /^GOOGLE_REDIRECT_URI=/  { print "GOOGLE_REDIRECT_URI=" cb;    seen_cb=1; next }
  { print }
  END {
    if (!seen_en)  print "GOOGLE_ENABLED=true";
    if (!seen_id)  print "GOOGLE_CLIENT_ID=" cid;
    if (!seen_sec) print "GOOGLE_SECRET=" csec;
    if (!seen_cb)  print "GOOGLE_REDIRECT_URI=" cb;
  }
' "$ENV_FILE" > "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$ENV_FILE"

# The return trip needs the app's own routes in the allow-list. The church
# lives at /love-corner, and the seeded list named only the root and
# /poetech-app/ -- so without this, sign-in would succeed and GoTrue would
# bounce the browser to SITE_URL, silently dropping the popup handshake
# marker. install.sh converges this too; doing it here means one restart.
if ! grep -q 'poetech.us/\*\*' "$ENV_FILE" 2>/dev/null; then
  CUR=$(grep '^ADDITIONAL_REDIRECT_URLS=' "$ENV_FILE" | head -1 | cut -d= -f2-)
  TMP2="$ENV_FILE.tmp2.$$"
  awk -v val="$CUR,https://poetech.us/**" '
    /^ADDITIONAL_REDIRECT_URLS=/ { print "ADDITIONAL_REDIRECT_URLS=" val; next }
    { print }
  ' "$ENV_FILE" > "$TMP2"
  chmod 600 "$TMP2"
  mv "$TMP2" "$ENV_FILE"
  echo "enable_google_oauth: added https://poetech.us/** to the redirect allow-list"
fi

echo "enable_google_oauth: provider wired - restarting the auth service"
$DOCKER restart supabase-auth >/dev/null

# PROOF. Not "it should work now" -- read GoTrue's own description of itself
# and require the one field that was false all along.
i=0
while [ $i -lt 12 ]; do
  BODY=$(curl -s --max-time 5 http://127.0.0.1:8800/auth/v1/settings 2>/dev/null || echo '')
  case "$BODY" in
    *'"google":true'*)
      echo "enable_google_oauth: GoTrue reports google:true - Google sign-in is ON."
      echo "enable_google_oauth: verify from the outside next:"
      echo "  curl -s https://poetech.us/sb/auth/v1/settings | grep -o '\"google\":[a-z]*'"
      exit 0 ;;
    *'"google":false'*)
      echo "enable_google_oauth: auth is up but still reports google:false." >&2
      echo "  GOOGLE_ENABLED / GOOGLE_CLIENT_ID / GOOGLE_SECRET must all be non-empty in $ENV_FILE." >&2
      echo "  check: sudo docker logs --tail 30 supabase-auth" >&2
      exit 1 ;;
  esac
  i=$((i + 1)); sleep 5
done
echo "enable_google_oauth: auth did not answer within 60s - check: sudo docker logs --tail 30 supabase-auth" >&2
exit 1
