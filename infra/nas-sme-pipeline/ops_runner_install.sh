#!/bin/sh
# ops-runner -- the app's operations queue, riding the ALREADY-ARMED
# services-sync clock (the transcript-trickle / choir-dates / funnel-watchdog
# pattern: zero new DSM entries, no human hands).
#
# WHY THIS EXISTS -- MEASURED, NOT GUESSED.
#
# DR-0088 built the app-first operations queue so "the user never opens a NAS
# shell to operate the system again": the app INSERTs a row into ops_commands,
# ops-runner.py polls outbound, executes a whitelisted job, and streams the log
# back. It WORKED -- four commands ran 2026-07-03 to 2026-07-06, the last one
# writing 8609 words of captions.
#
# Then it stopped, and stayed stopped for eight weeks. Measured 2026-08-31:
# every row in ops_commands is 'done' and none is newer than 2026-07-06, and a
# zero-effect probe (an unknown job, which the runner marks 'skipped' without
# executing) sat 'queued' with started_at NULL for over two minutes against a
# 60s poll. Nothing is listening.
#
# The cause was already written down, in services.json's own transcript-trickle
# note: "ops-runner.py, which is installed by nothing." DR-0088 shipped it
# INACTIVE, armed once by hand as a DSM boot task -- and a hand-placed daemon
# is exactly what does not survive a reboot, an upgrade, or a repo move. Every
# OTHER NAS service self-deploys through services.json; this one never got
# registered, so nothing reinstalled it and nothing restarted it.
#
# THE FIX IS NOT A BETTER DAEMON -- IT IS NO DAEMON.
#
# Re-arming a --loop process would rebuild the same trap: something that dies
# quietly and waits for a hand (DR-0247 waiting-by-default; DR-0236 nothing
# waits). Instead this drains the queue with --once on the 15-minute
# services-sync clock that is ALREADY armed and already self-repairing. There
# is no process to outlive a reboot, so there is nothing to re-arm, ever. A
# reboot costs one cycle, not eight weeks.
#
# THE TRADE, STATED HONESTLY: DR-0088 sized command latency at the ~1-minute
# poll. On this clock it becomes up to ~15 minutes. For backfills and resumes
# -- the only two whitelisted jobs -- that is invisible, and it is the whole
# distance between "usually nothing" and "every time."
#
# BRAKES (unchanged, DR-0248 deterministic class): the runner keeps its
# per-cycle budget (3 commands), its hard subprocess timeout, and its
# single-instance lock; services-sync's runner adds the cycle timeout and daily
# cap on top. --once means a cycle cannot outlive its slot.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
RUNNER="$REPO/infra/nas-sme-pipeline/ops-runner.py"
OUT="$REPO/infra/nas-sme-pipeline/out"
PAUSE="$OUT/.ops-runner-paused"
SECRETS="${OPS_RUNNER_SECRETS:-/volume1/PoeTech/secrets/supabase.json}"
# A pause older than this is treated as stale and cleared (see below).
PAUSE_DECAY="${OPS_RUNNER_PAUSE_DECAY_SECONDS:-21600}"

mkdir -p "$OUT"

if [ ! -f "$RUNNER" ]; then
  echo "ops-runner: runner missing at $RUNNER"
  exit 1
fi

# THE KILL-SWITCH MUST BE ABLE TO CLEAR ITSELF.
#
# ops-runner.py auto-pauses after 3 consecutive RUNNER failures and refuses to
# start until a human deletes out/.ops-runner-paused. On a box nobody opens,
# "until a human deletes it" means forever and silently -- the precise trap the
# 2026-08-05 ways review found in the transcript loader, whose pause pointed at
# this very runner. DR-0248 removed the manual kill-switch from the
# deterministic loop class for exactly this reason, and transcript-trickle
# already ships the replacement: a TIME-DECAYED backoff that clears ITSELF.
#
# So a pause still stops the runner -- for PAUSE_DECAY (default 6h), long
# enough for a real outage to pass -- and then clears, loudly, naming what it
# cleared. A genuinely broken runner simply re-pauses on its next 3 failures,
# so the brake still holds; what it can no longer do is hold forever unnoticed.
if [ -f "$PAUSE" ]; then
  now=$(date +%s)
  # BusyBox date on DSM has no -r; stat is the portable read here.
  paused_at=$(stat -c %Y "$PAUSE" 2>/dev/null || echo 0)
  case "$paused_at" in ''|*[!0-9]*) paused_at=0 ;; esac
  age=$((now - paused_at))
  if [ "$age" -lt "$PAUSE_DECAY" ]; then
    echo "ops-runner: paused ${age}s ago (< ${PAUSE_DECAY}s decay) - honoring the brake, no-op this cycle"
    echo "ops-runner: reason: $(head -1 "$PAUSE" 2>/dev/null || echo unknown)"
    exit 0
  fi
  echo "ops-runner: clearing a STALE pause (${age}s old, >= ${PAUSE_DECAY}s decay)"
  echo "ops-runner: it said: $(head -1 "$PAUSE" 2>/dev/null || echo unknown)"
  rm -f "$PAUSE"
fi

# NO CREDENTIAL = A POLITE NO-OP THAT NAMES WHAT IS MISSING (the agent-consumer
# pattern). A missing secrets file is a bootstrap gap, not a runner fault, and
# reddening every 15-minute cycle over it would train the alarm to be ignored.
if [ ! -f "$SECRETS" ] && [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "ops-runner: no credential - $SECRETS absent and SUPABASE_SERVICE_KEY unset; nothing to poll with"
  exit 0
fi

# One bounded cycle. Claims at most MAX_COMMANDS_PER_CYCLE queued rows, runs
# them under the runner's own timeout, writes status + log back, exits.
python3 "$RUNNER" --once --secrets "$SECRETS"
rc=$?

# Exit 4 is the runner's own "paused" verdict. It is honored above, so reaching
# it here means the pause landed DURING this cycle -- quiet, since the decay
# above is what resolves it.
if [ "$rc" -eq 4 ]; then
  echo "ops-runner: paused during this cycle (self-clears after ${PAUSE_DECAY}s)"
  exit 0
fi
exit "$rc"
