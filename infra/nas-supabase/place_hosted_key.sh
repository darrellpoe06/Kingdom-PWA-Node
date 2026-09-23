#!/usr/bin/env bash
# =============================================================================
# place_hosted_key.sh -- put the hosted project's service key into agent.env,
# PROVEN against the hosted project before a byte of it is written
# =============================================================================
# WHY THIS EXISTS. 2026-09-23, four dispatches of nas-storage-sync read the
# value Darrell placed in HOSTED_SERVICE_ROLE_KEY and hosted's own answer to
# it: 57 characters, prefix "cdn", no dots, a colon / equals / backslash and
# one control byte inside, HTTP 400 over HTTP/1.1 (the same answer hosted gives
# a dummy value and no value at all), and curl 7.86 refusing to put it on an
# HTTP/2 wire at all. A paste through a terminal can wrap, gain a carriage
# return, or land the wrong field, and nothing on the box said so until a
# GitHub runner read it four times. This script closes that loop AT THE
# KEYBOARD: it reads the paste, strips what a terminal adds, names the family
# by prefix (legacy JWT "eyJ", new secret "sb_secret_", publishable "sb_publi
# shable_" -- refused), asks hosted to list its buckets with that value, and
# writes agent.env ONLY when hosted lists a private bucket, i.e. only when the
# value is service-grade in hosted's own judgment. The value is never echoed;
# the screen shows its length, its prefix, and hosted's answer.
#
# Run on the NAS (ssh / ConnectBot), as the ssh user; sudo is used for the
# write when agent.env is root-owned:
#
#     bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/place_hosted_key.sh
#
# Then dispatch nas-storage-sync (bucket empty = every bucket) from Actions,
# or wait for the next scheduled run; the lane prints "verdict GO" when every
# bucket is whole and served back.
# =============================================================================
set -u

AGENT_ENV="${AGENT_ENV:-/volume1/docker/poetech/agent.env}"
HOSTED_URL="${HOSTED_SB_URL:-https://mjjlevhdufpaplypnqrv.supabase.co}"
EXPECTED_REF="$(printf '%s' "$HOSTED_URL" | sed -E 's#https?://([^.]+)\..*#\1#')"

CURL=$(command -v curl 2>/dev/null || true)
[ -n "$CURL" ] || for c in /usr/bin/curl /usr/local/bin/curl /bin/curl /opt/bin/curl; do [ -x "$c" ] && CURL="$c" && break; done
PY=$(command -v python3 2>/dev/null || true)
[ -n "$PY" ] || for c in /usr/local/bin/python3 /usr/bin/python3 /opt/bin/python3; do [ -x "$c" ] && PY="$c" && break; done
if [ -z "$CURL" ] || [ -z "$PY" ]; then
  echo "curl or python3 not found on this shell's PATH; nothing written" >&2
  exit 4
fi

echo "Paste the hosted project's SERVICE key and press Enter."
echo "  Legacy tab  -> the service_role row (starts eyJ, about 200 characters)"
echo "  API Keys tab -> the Secret key      (starts sb_secret_)"
echo "The value is not shown as you paste it and is never printed."
IFS= read -r -s -p "> " RAW
echo

# What a terminal or a clipboard adds: carriage returns, newlines, quotes,
# spaces, and the "Bearer " a copied header sometimes carries.
K=$(printf '%s' "$RAW" | tr -d '\r\n\t "'"'"' ')
K=${K#Bearer}
unset RAW
LEN=${#K}
PREFIX=$(printf '%.3s' "$K")

if [ "$LEN" -eq 0 ]; then
  echo "nothing was pasted; nothing written"
  exit 2
fi

FAMILY=""
case "$K" in
  eyJ*)            FAMILY="legacy-jwt" ;;
  sb_secret_*)     FAMILY="secret" ;;
  sb_publishable_*) echo "that is the PUBLISHABLE key (anon role); it cannot read a private bucket. Nothing written."; exit 2 ;;
  *) echo "that value (len $LEN, starts \"$PREFIX\") is not a Supabase API key of any family: a legacy key starts eyJ, a new secret key sb_secret_. Nothing written."; exit 2 ;;
esac
echo "shape: len $LEN, starts \"$PREFIX\", family $FAMILY"

# A legacy JWT carries its role and project ref in its payload (unverified
# claims, read only to name the paste, exactly as storage_sync.py does).
if [ "$FAMILY" = "legacy-jwt" ]; then
  CLAIMS=$(printf '%s' "$K" | "$PY" -c '
import base64, json, sys
t = sys.stdin.read().strip().split(".")
try:
    p = t[1] + "=" * (-len(t[1]) % 4)
    d = json.loads(base64.urlsafe_b64decode(p))
    print("role=%s ref=%s" % (d.get("role"), d.get("ref")))
except Exception:
    print("role=? ref=?")')
  echo "claims: $CLAIMS"
  case "$CLAIMS" in
    *"role=service_role"*) : ;;
    *) echo "that JWT is not the service_role key (its role claim is above). Nothing written."; exit 2 ;;
  esac
  case "$CLAIMS" in
    *"ref=$EXPECTED_REF"*) : ;;
    *) echo "that key belongs to a different project than $EXPECTED_REF. Nothing written."; exit 2 ;;
  esac
fi

# HOSTED'S OWN ANSWER decides. A service-grade key lists every bucket,
# private ones included; anything less is refused before it is written.
BODY=$(mktemp); ERR=$(mktemp)
STATUS=$("$CURL" -sS -m 30 --http1.1 -o "$BODY" -w '%{http_code}' \
  -H "apikey: $K" -H "Authorization: Bearer $K" "$HOSTED_URL/storage/v1/bucket" 2>"$ERR"); CE=$?
ANSWER=$("$PY" - "$BODY" <<'PYEOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print("unreadable 0 0"); sys.exit(0)
if isinstance(d, list):
    names = sorted(str(b.get("name") or b.get("id") or "") for b in d if isinstance(b, dict))
    private = sum(1 for b in d if isinstance(b, dict) and not b.get("public"))
    print("listed %d %d %s" % (len(names), private, ",".join(names)))
elif isinstance(d, dict):
    print("error 0 0 %s" % (d.get("message") or d.get("error") or d.get("msg") or d))
else:
    print("unreadable 0 0")
PYEOF
)
rm -f "$BODY"
echo "hosted answers: HTTP $STATUS (curl exit $CE) $(head -c 160 "$ERR" | tr '\n' ' ')$ANSWER"
rm -f "$ERR"

set -- $ANSWER
if [ "${1:-}" != "listed" ] || [ "${3:-0}" -lt 1 ]; then
  echo "hosted did not list a private bucket for that value, so it is not the service key. Nothing written."
  unset K
  exit 3
fi

# Write: replace the line if present, append if absent; root-owned file ->
# sudo. The value goes through a file with 0600, never through a shell
# argument list another user could read from ps.
TMP=$(mktemp); chmod 600 "$TMP"
printf 'HOSTED_SERVICE_ROLE_KEY=%s\n' "$K" > "$TMP"
unset K
WRITER=""
[ -w "$AGENT_ENV" ] || WRITER="sudo"
if $WRITER grep -q '^HOSTED_SERVICE_ROLE_KEY=' "$AGENT_ENV" 2>/dev/null; then
  $WRITER "$PY" - "$AGENT_ENV" "$TMP" <<'PYEOF'
import sys
path, newline_file = sys.argv[1], sys.argv[2]
new = open(newline_file).read()
lines = open(path).read().split("\n")
out, done = [], False
for l in lines:
    if l.startswith("HOSTED_SERVICE_ROLE_KEY=") and not done:
        out.append(new.rstrip("\n")); done = True
    else:
        out.append(l)
open(path, "w").write("\n".join(out))
PYEOF
else
  $WRITER sh -c "cat '$TMP' >> '$AGENT_ENV'"
fi
rc=$?
rm -f "$TMP"
if [ "$rc" -ne 0 ]; then
  echo "write to $AGENT_ENV failed (exit $rc)"
  exit 5
fi
COUNT=$($WRITER grep -c '^HOSTED_SERVICE_ROLE_KEY=' "$AGENT_ENV" 2>/dev/null | tail -1)
echo "placed: $AGENT_ENV now holds $COUNT HOSTED_SERVICE_ROLE_KEY line(s); hosted listed $2 buckets, $3 private."
echo "Next: dispatch nas-storage-sync with bucket empty (every bucket), or wait for its next run."
exit 0
