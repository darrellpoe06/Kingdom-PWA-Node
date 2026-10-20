#!/usr/bin/env bash
# =============================================================================
# place_lesson_mail_key.sh -- put the lesson mailbox's app password into
# agent.env, PROVEN against Gmail before a byte of it is written (DR-1132)
# =============================================================================
# The sibling of place_church_mail_key.sh (DR-1091), deliberately: that script
# already solved this exact problem for the church mailbox, and one shape for
# placing a mailbox credential beats two.
#
# Reads ONE line, "address=app-password", from standard input. It logs in to
# Gmail over IMAP, READ-ONLY, counts the lesson forwards it can actually see,
# and writes LESSON_MAIL_USER and LESSON_MAIL_APP_PASSWORD to agent.env ONLY
# when Gmail accepts them. The password is never printed, never on a command
# line, never in the process list. NEVER a password prompt for the NAS (Darrell,
# 2026-10-16): `sudo -n` runs on the ssh key's standing grant or fails at once.
#
# THIS IS THE ONE VALUE ONLY DARRELL CAN MINT. A Google App Password is created
# behind 2-Step Verification on his own account, and no amount of SSH reaches
# it. That is a real DR-0111 §2 carve-out -- a value only he holds -- and not
# the must-be-by-hand premise DR-0108 says to challenge. Everything else about
# this reader installs itself.
#
#   Get-Content -Raw C:\Users\dpoe\.poetech-secrets\gmail-lesson-mail.txt | ssh dpoe@192.168.1.26 "bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-lesson-mail/place_lesson_mail_key.sh"
#
# IT ALSO PROVES THE ROSTER, which the credential alone does not. A row needs a
# real instance and account (agent_inbox.created_by is NOT NULL), and this
# reader REFUSES to invent one -- so a placed credential with no roster is still
# a no-op. The check below says which of the two is missing, rather than letting
# the next cycle report "dormant" and leave the reason to be guessed.
# =============================================================================
set -u
AGENT_ENV="${AGENT_ENV:-/volume1/docker/poetech/agent.env}"
SECRETS="${POETECH_SECRETS:-/volume1/PoeTech/secrets}"
ROSTER="$SECRETS/lesson-mail-roster.json"
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
    # The same two senders lesson-mail-watch.yml selected, so the count says
    # what this reader will actually be able to see rather than a bare "ok".
    typ2, data = box.uid("SEARCH", None, "OR", "FROM", '"darrellpoe06@gmail.com"',
                         "FROM", '"dpoe@illinois.edu"')
    n = len((data[0] or b"").split()) if typ2 == "OK" else 0
    box.logout()
except Exception as e:
    print("Gmail refused it (%s); nothing written" % str(e)[:160]); sys.exit(3)
print("Gmail accepted it: %d emails from Darrell's two addresses in this mailbox" % n)
open(sys.argv[2], "w").write("LESSON_MAIL_USER=%s\nLESSON_MAIL_APP_PASSWORD=%s\n" % (user, password))
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
echo "placed: LESSON_MAIL_USER and LESSON_MAIL_APP_PASSWORD in $AGENT_ENV."

# THE SECOND HALF, SAID NOW RATHER THAN DISCOVERED NEXT CYCLE.
if "$PY" -c "
import json, sys
try:
    r = json.load(open('$ROSTER'))
except Exception:
    sys.exit(1)
ok = [a for a, w in (r or {}).items() if isinstance(w, dict) and w.get('instance_id') and w.get('created_by')]
print('roster: %d address(es) attributable -- %s' % (len(ok), ', '.join(sorted(ok)) or 'none'))
sys.exit(0 if ok else 1)
"; then
  echo "The next services-sync cycle (within 15 minutes) starts reading lesson mail into agent_inbox."
else
  echo "STILL A NO-OP: no usable roster at $ROSTER."
  echo "A row needs a real instance and account, and this reader refuses to invent one."
  echo "Write it as: {\"darrellpoe06@gmail.com\": {\"instance_id\": \"<uuid>\", \"created_by\": \"<uuid>\"}}"
  echo "The credential above is placed and proven; only the attribution is missing."
fi
exit 0
