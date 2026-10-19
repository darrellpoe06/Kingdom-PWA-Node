#!/usr/bin/env bash
# =============================================================================
# place_church_mail_key.sh -- put the church mailbox's app password into
# agent.env, PROVEN against Gmail before a byte of it is written (DR-1091)
# =============================================================================
# Reads ONE line, "address=app-password" (the format of
# C:\Users\dpoe\.poetech-secrets\gmail-mrspoe06.txt, which the PC import scripts
# already read), from standard input. It logs in to Gmail over IMAP, read-only,
# and writes CHURCH_MAIL_USER and CHURCH_MAIL_APP_PASSWORD to agent.env ONLY
# when Gmail accepts them. The password is never printed or put on a command
# line. NEVER a password prompt for the NAS (Darrell, 2026-10-16): `sudo -n`
# runs on the ssh key's standing grant or fails at once.
#
#   Get-Content -Raw C:\Users\dpoe\.poetech-secrets\gmail-mrspoe06.txt | ssh dpoe@192.168.1.26 "bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-church-mail/place_church_mail_key.sh"
# =============================================================================
set -u
AGENT_ENV="${AGENT_ENV:-/volume1/docker/poetech/agent.env}"
PY=$(command -v python3 2>/dev/null || true)
[ -n "$PY" ] || for c in /usr/local/bin/python3 /usr/bin/python3 /bin/python3; do [ -x "$c" ] && PY="$c" && break; done
[ -n "$PY" ] || { echo "python3 not found; nothing written" >&2; exit 4; }

TMP=$(mktemp); chmod 600 "$TMP"
IN=$(mktemp); chmod 600 "$IN"
# The paste goes stdin -> a 0600 file first (python's own stdin carries its
# script below), then python -> a 0600 file; never argv, never the screen.
cat > "$IN"
"$PY" - "$IN" "$TMP" <<'PYEOF'
import imaplib, sys
raw = open(sys.argv[1]).read().replace("\r", "").strip().splitlines()
line = next((l for l in raw if "=" in l), "")
user, _, password = line.partition("=")
user, password = user.strip().strip('"'), password.strip().strip('"').replace(" ", "")
if not user or not password:
    print("expected one line 'address=app-password'; nothing written"); sys.exit(2)
print("address: %s, password: %d characters" % (user, len(password)))
try:
    box = imaplib.IMAP4_SSL("imap.gmail.com", 993, timeout=30)
    box.login(user, password)
    typ, _ = box.select('"[Gmail]/All Mail"', readonly=True)
    typ2, data = box.uid("SEARCH", None, "FROM", '"bg@thechurchofthelivinggod.com"')
    n = len((data[0] or b"").split()) if typ2 == "OK" else 0
    box.logout()
except Exception as e:
    print("Gmail refused it (%s); nothing written" % str(e)[:160]); sys.exit(3)
print("Gmail accepted it: %d emails from the church office in this mailbox" % n)
open(sys.argv[2], "w").write("CHURCH_MAIL_USER=%s\nCHURCH_MAIL_APP_PASSWORD=%s\n" % (user, password))
PYEOF
rc=$?
rm -f "$IN"
if [ "$rc" -ne 0 ]; then rm -f "$TMP"; exit "$rc"; fi

WRITER=""
[ -w "$AGENT_ENV" ] || WRITER="sudo -n"
$WRITER "$PY" - "$AGENT_ENV" "$TMP" <<'PYEOF'
import sys
path, new_file = sys.argv[1], sys.argv[2]
new = [l for l in open(new_file).read().split("\n") if l]
keys = {l.split("=", 1)[0] for l in new}
try:
    old = open(path).read().split("\n")
except FileNotFoundError:
    old = []
kept = [l for l in old if l.split("=", 1)[0] not in keys]
while kept and kept[-1] == "":
    kept.pop()
open(path, "w").write("\n".join(kept + new) + "\n")
PYEOF
rc=$?
rm -f "$TMP"
if [ "$rc" -ne 0 ]; then
  echo "write to $AGENT_ENV failed (exit $rc); nothing was written and no password is asked for"
  exit 5
fi
echo "placed: CHURCH_MAIL_USER and CHURCH_MAIL_APP_PASSWORD in $AGENT_ENV."
echo "The next services-sync cycle (within 15 minutes) starts reading the church office's emails."
exit 0
