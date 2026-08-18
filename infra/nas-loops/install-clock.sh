#!/bin/sh
# =============================================================================
# install-clock.sh -- give the loop fleet a clock, idempotently
# =============================================================================
# Darrell 2026-08-14: "fix the clock and the ytzero failure."
#
# THE MEASUREMENT THAT PRODUCED THIS (nas-health run 31820238770):
#     root crontab: no nas-loops entry
#     dpoe crontab: no nas-loops entry
#     /etc/crontab: no nas-loops entry
#     events.jsonl last entry: 2026-08-11T21:19:36Z
#     newest call-count file: calls-services-sync-2026-08-11.txt
#
# NOTHING FIRES THE FLEET. The runner header says "Fired by Synology DSM Task
# Scheduler"; no such entry is visible anywhere on the box. The recorded run
# times confirm it -- 01:37, 02:03, 13:15, 20:58, 21:17 is not a 15-minute
# clock, it is occasional hand-firing, and then nothing for three days.
#
# The consequence is worse than a stalled drain: services-sync PULLS THE MIRROR
# before it installs, so with no clock the checkout froze at dffb6546
# (2026-08-11 21:14) and every merge to main since has deployed nothing to the
# NAS. Merge = deploy has been false for three days while CI stayed green.
#
# WHY CRON AND NOT THE DSM UI: REVIEWS.md already recorded this correction --
# the DSM registration was documented as UI-only-by-hand while root-crontab-
# over-SSH worked in one paste. This installer is the channel-driven version of
# that: no clicks, no human (DR-0108).
#
# WHY NOT services.json: that would be circular. services-sync is the thing
# with no clock; it cannot install its own clock. This runs over the
# remote-hands channel (.github/workflows/nas-clock.yml).
#
# IDEMPOTENT: re-running replaces its own managed block and touches no other
# crontab line. Safe every time, forever.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
RUNNER="$REPO/infra/nas-loops/run.mjs"
LOGDIR="$REPO/infra/nas-loops/events"
MARK_BEGIN="# >>> poetech-loops (managed by infra/nas-loops/install-clock.sh) >>>"
MARK_END="# <<< poetech-loops <<<"

[ -f "$RUNNER" ] || { echo "install-clock: no runner at $RUNNER" >&2; exit 1; }
mkdir -p "$LOGDIR"

# node is NOT on cron's PATH on DSM. Measured present at /usr/local/bin/node
# (v20.19.5, nas-health 31820238770) -- resolve it now and write the ABSOLUTE
# path into the entry, because a cron line that cannot find node fails silently
# every 15 minutes forever, which is indistinguishable from having no clock.
NODE="$(command -v node 2>/dev/null || true)"
[ -n "$NODE" ] || for c in /usr/local/bin/node /opt/bin/node /usr/bin/node; do
  [ -x "$c" ] && NODE="$c" && break
done
[ -n "$NODE" ] || { echo "install-clock: node not found; the runner cannot execute" >&2; exit 1; }
echo "install-clock: node at $NODE ($("$NODE" -v 2>/dev/null))"

# HOW THIS BOX ACTUALLY TAKES A CRON ENTRY (measured, nas-clock run 31857444724).
# The first version used `crontab -l` / `crontab -` and died with exit 127 --
# command not found. DSM does not ship a per-user `crontab` binary; Synology's
# mechanism is /etc/crontab, which carries an extra USER column and wants TABS
# between fields. That is also what DSM Task Scheduler writes into, which is why
# the Task Scheduler entry the runner's header assumes was never visible to a
# crontab query -- there was no crontab command to query with.
#
# So: prefer /etc/crontab (the real mechanism here), and keep `crontab` as a
# fallback for any host that does have it. Either way the block is marker-
# delimited and replaced wholesale, so re-running is safe forever.
SUDO=""
if [ "$(id -u)" != "0" ]; then
  sudo -n true 2>/dev/null && SUDO="sudo -n"
fi

ENTRY_SYNC="*/15\t*\t*\t*\t*\troot\t$NODE $RUNNER --loop=services-sync >> $LOGDIR/cron-services-sync.log 2>&1"
ENTRY_HEALTH="7\t*\t*\t*\t*\troot\t$NODE $RUNNER --loop=health-check >> $LOGDIR/cron-health-check.log 2>&1"

installed=""

if [ -f /etc/crontab ]; then
  echo "install-clock: using /etc/crontab (Synology's mechanism; user column + tabs)"
  TMP=/tmp/poetech-crontab.$$
  # Strip any previously managed block; every other line is preserved verbatim.
  $SUDO awk -v b="$MARK_BEGIN" -v e="$MARK_END" '
    $0==b {skip=1; next} $0==e {skip=0; next} !skip {print}' /etc/crontab > "$TMP" 2>/dev/null || {
      echo "install-clock: cannot read /etc/crontab" >&2; rm -f "$TMP"; exit 1; }
  {
    printf '%s\n' "$MARK_BEGIN"
    printf '# Every 15 minutes: the self-deploy loop (mirror pull + service installers).\n'
    printf '# ARMED-BY-RECORD in the repo is the arm (DR-0247); this is only the clock.\n'
    # %b (not the variable as a FORMAT string): expands the \t separators
    # Synology wants, while a '%' anywhere in a path can never be read as a
    # format directive and corrupt a system file.
    printf '%b\n' "$ENTRY_SYNC"
    printf '%b\n' "$ENTRY_HEALTH"
    printf '%s\n' "$MARK_END"
  } >> "$TMP"
  if $SUDO cp "$TMP" /etc/crontab; then
    installed="/etc/crontab"
  fi
  rm -f "$TMP"
fi

if [ -z "$installed" ] && command -v crontab >/dev/null 2>&1; then
  echo "install-clock: /etc/crontab unavailable; falling back to user crontab"
  CUR="$(crontab -l 2>/dev/null || true)"
  NEW="$(printf '%s\n' "$CUR" | awk -v b="$MARK_BEGIN" -v e="$MARK_END" '
    $0==b {skip=1; next} $0==e {skip=0; next} !skip {print}')"
  printf '%s\n%s\n*/15 * * * * %s %s --loop=services-sync >> %s/cron-services-sync.log 2>&1\n7 * * * * %s %s --loop=health-check >> %s/cron-health-check.log 2>&1\n%s\n' \
    "$NEW" "$MARK_BEGIN" "$NODE" "$RUNNER" "$LOGDIR" "$NODE" "$RUNNER" "$LOGDIR" "$MARK_END" | crontab - \
    && installed="user crontab"
fi

if [ -z "$installed" ]; then
  echo "install-clock: FAILED -- no /etc/crontab and no crontab command on this host" >&2
  exit 1
fi
echo "install-clock: wrote the clock to $installed"

# PROVE IT, do not claim it (DR-0076). A cron write that did not take is the
# same silent nothing we are fixing.
FOUND=0
if [ "$installed" = "/etc/crontab" ]; then
  $SUDO grep -n "run.mjs --loop=services-sync" /etc/crontab && FOUND=1
else
  crontab -l 2>/dev/null | grep -n "run.mjs --loop=services-sync" && FOUND=1
fi
if [ "$FOUND" != "1" ]; then
  echo "install-clock: FAILED -- the entry is not present after writing it" >&2
  exit 1
fi
echo "install-clock: VERIFIED -- the entry is present"

# Synology keeps its own crond; the file is not live until it reloads. Best
# effort and never fatal -- the entry survives a reboot either way, so a failed
# reload costs one cycle, not the fix.
if command -v synoservicectl >/dev/null 2>&1; then
  $SUDO synoservicectl --reload crond >/dev/null 2>&1 && echo "install-clock: crond reloaded (synoservicectl)" || echo "install-clock: crond reload skipped (picks up on its own schedule/reboot)"
elif command -v systemctl >/dev/null 2>&1; then
  $SUDO systemctl reload crond >/dev/null 2>&1 || $SUDO systemctl restart crond >/dev/null 2>&1 || true
fi
echo "install-clock: done"
