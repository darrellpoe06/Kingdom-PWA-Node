#!/bin/sh
# lesson-builder -- a lesson starts THE MOMENT the words land (DR-0669).
# Rides the ALREADY-ARMED services-sync clock as an idempotent installer
# (merge to main IS the deploy, DR-0236). Each cycle (every step no-ops when
# already done):
#   1. data dir, owned by the signed-in user (dpoe) the builds run as;
#   2. the Claude Code CLI for dpoe -- the official native installer
#      (curl -fsSL https://claude.ai/install.sh | bash, Claude Code docs),
#      tried at most once a day and logged; the SIGN-IN is Darrell's one step
#      (it opens his browser), never automated here;
#   3. the builder's own clone (never the services-sync mirror);
#   4. poetech-lesson-builder.service (the LISTENer), restarted when its code
#      changes, then a SIGHUP -- the per-cycle safety sweep;
#   5. one status line: "ready", "waiting on a writer" (naming every writer
#      tried and why) or "stopped".
# DORMANT UNTIL A WRITER: with no writer reachable the service runs, claims
# nothing, and the hourly Routine remains the builder.
# No credential is ever printed. Exit 0 unless a step itself breaks.
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
SRC="$REPO/infra/nas-lesson-builder"
DATA=/volume1/PoeTech/lesson-builder
UNIT=/etc/systemd/system/poetech-lesson-builder.service
RUN_AS=dpoe
STAMP="$DATA/.cli-install-attempt"
SPENT=""

mkdir -p "$DATA/locks" "$DATA/versions" "$DATA/worktrees"
chown -R "$RUN_AS" "$DATA" 2>/dev/null || true
# The writer list is NAS config; the builds (as dpoe) must be able to read it.
for f in /volume1/PoeTech/secrets/lesson-writers.json /volume1/PoeTech/secrets/lesson-builder.env; do
  [ -f "$f" ] && chown "$RUN_AS" "$f" 2>/dev/null && chmod 0600 "$f"
done

echo "== lesson-builder: the Claude Code CLI for $RUN_AS =="
HOME_DIR=$(getent passwd "$RUN_AS" 2>/dev/null | cut -d: -f6)
[ -n "$HOME_DIR" ] || HOME_DIR=/var/services/homes/$RUN_AS
if [ -x "$HOME_DIR/.local/bin/claude" ]; then
  echo "  present: $(sudo -n -u "$RUN_AS" -H "$HOME_DIR/.local/bin/claude" --version 2>&1 | head -1)"
else
  now=$(date +%s); last=$(cat "$STAMP" 2>/dev/null || echo 0)
  case "$last" in ''|*[!0-9]*) last=0 ;; esac
  if [ $((now - last)) -ge 86400 ]; then
    echo "$now" > "$STAMP"
    SPENT=1
    if timeout 180 sudo -n -u "$RUN_AS" -H sh -c 'curl -fsSL https://claude.ai/install.sh | bash' > "$DATA/cli-install.log" 2>&1; then
      echo "  installed (sign-in is the one step left: see DR-0669)"
    else
      echo "  CLI install did not finish this cycle: $(tail -2 "$DATA/cli-install.log" | tr '\n' ' ' | cut -c1-240) (log: $DATA/cli-install.log)"
    fi
  else
    echo "  not installed; next try after the daily stamp (log: $DATA/cli-install.log)"
  fi
fi

echo "== lesson-builder: its own clone =="
if [ ! -d "$DATA/repo/.git" ] && [ -n "$SPENT" ]; then
  echo "  the CLI install used this cycle; the clone runs next cycle (or at the first build)"
elif [ ! -d "$DATA/repo/.git" ]; then
  timeout 240 sudo -n -u "$RUN_AS" -H git clone --no-tags -q https://github.com/darrellpoe06/Kingdom-PWA-Node.git "$DATA/repo" \
    && echo "  cloned" || echo "  clone not finished this cycle (the first build will finish it)"
else
  echo "  present"
fi

echo "== lesson-builder: the service =="
NEED_RELOAD=0
if [ ! -f "$UNIT" ] || [ "$(sha256sum < "$SRC/poetech-lesson-builder.service")" != "$(sha256sum < "$UNIT")" ]; then
  cp "$SRC/poetech-lesson-builder.service" "$UNIT"
  NEED_RELOAD=1
  systemctl daemon-reload
fi
systemctl enable poetech-lesson-builder >/dev/null 2>&1 || true
CODE_SHA=$(cat "$SRC/lesson_builder.py" "$SRC/lesson_writer.py" "$SRC/lesson_gates.py" | sha256sum | cut -c1-16)
if [ "$NEED_RELOAD" = "1" ] || [ "$(cat "$DATA/.code.sha" 2>/dev/null)" != "$CODE_SHA" ]; then
  systemctl restart poetech-lesson-builder && echo "$CODE_SHA" > "$DATA/.code.sha" && echo "  restarted (code $CODE_SHA)"
else
  systemctl is-active --quiet poetech-lesson-builder || systemctl restart poetech-lesson-builder
  # The per-cycle safety sweep: a notification missed while it was down is
  # picked up now (the LISTEN itself is instant; this is the backstop).
  systemctl kill -s HUP poetech-lesson-builder 2>/dev/null || true
fi

echo "== lesson-builder: status =="
cd "$SRC" || exit 1
STATUS=$(LESSON_BUILDER_DATA="$DATA" timeout 120 python3 lesson_builder.py --status 2>&1)
printf '%s\n' "$STATUS" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    s = json.loads(raw)
except ValueError:
    print("  status unreadable: " + raw[-300:].replace("\n", " ")); sys.exit(0)
print("  state: {} | kill: {} | push credential: {}".format(s.get("state"), s.get("kill", {}).get("why"), s.get("push_credential")))
for w in s.get("writers", []):
    print("  writer {} ({}): {} -- {}".format(w.get("writer"), w.get("family"), "READY" if w.get("ok") else "not ready", w.get("why")))
'
exit 0
