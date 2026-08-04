# nas-loops — the braked, headless, deterministic NAS loop runner

**What this is.** The native replacement for the timer-driven n8n loops, per the
2026-06-29 research-review (`docs/99-session-notes/2026-06-29-research-review-sustainable-headless-nas-loops.md`).
Small **deterministic** jobs (no LLM, no vendor) run continuously on the always-on
NAS via **Synology DSM Task Scheduler** — boot-persistent, root-owned, no login,
survives reboot — each fire gated by the three brakes. Because the loops are
deterministic, **they keep running headless whether or not Claude/Dispatch is
online**: routine work does not wait on the vendor AI. Only AI-needed steps wait,
and those ride the separate cap-resume/wake gate (`scripts/cap-resume.mjs`), not
this dispatcher.

**Why a script that exits, not a service.** A job that exits holds no RAM at idle
and cannot wedge a shared process — the structural fix for the n8n crash/runaway
class (research-review §3a). DSM relaunches it on the next schedule.

## The three brakes (binding — CLAUDE.md "Autonomous Automation Requires Three Brakes")

| Brake | How it's enforced here | Disarm in one step |
|---|---|---|
| **Budget** | per-run wall-clock **timeout** (a hung loop is killed at its ceiling) + per-day **call cap** (`max_calls_per_day`; an unset cap is a *missing* brake → no-go) | lower the cap in a PR |
| **Concurrency lock** | per-loop atomic **lockdir** (`state/<loop>.lock`); a second fire that finds it held **skips** | automatic |
| **Observability** | one JSONL line per run to the **event reel** (the same `_reel.jsonl` the Dispatch Status surface reads) + `events/events.jsonl`; **ntfy** on failure | — |

**Started by record (AMENDED 2026-07-29 — DR-0247/DR-0248).** The committed
`ARMED-BY-RECORD` file arms the fleet by merge: agreed work starts itself
through the lane; the Governor's hand is the BRAKE, never the starter. The
manual kill-switch override is REMOVED from this deterministic class
(*"Get rid of the kill switch... we have over 6000 checks... they are all
switching deterministic logic"* — rebuild tracked in DR-0248). The stop-paths
are deterministic: registry `enabled:false` (a PR), deleting `ARMED-BY-RECORD`
(a PR), or the DSM Task Scheduler toggle. Env/`.env` `LOOPS_ARMED` and the
legacy state-file arm still work for a local hand-run. The decision authority is
the pure, unit-tested core `scripts/lib/nas-loops.mjs` (proven-to-catch, DR-0076);
this runner only does the I/O around it.

## Local commands (any host)

```
node infra/nas-loops/run.mjs --list                            # registry + live brake state
node infra/nas-loops/run.mjs --loop=health-check --dry-run     # preview the decision, run nothing
LOOPS_ARMED=1 node infra/nas-loops/run.mjs --loop=health-check # LIVE (armed; brakes govern)
```

## Adding a loop

1. Drop a deterministic script in `loops/<name>.sh` (no LLM; brakes are the runner's job, not the script's).
2. Add an entry to `registry.json` (`enabled: true` is the committed greenlight; set a real `max_calls_per_day` and `timeout_seconds` — both required).
3. Register a DSM Task Scheduler entry for it (below). Adding to the registry does **not** arm it.

`kind: "ai"` entries are **refused** by this dispatcher and pointed at the
cap-resume/wake gate (a strict superset of brakes). The registry can carry both
kinds; the dispatcher routes by kind.

---

## Darrell's-hand deploy + arm (the NAS steps)

> Nothing below has been run. Each block is self-contained from any PowerShell
> directory (binding rule), ASCII-only, one command per line. NAS IP `192.168.1.26`,
> SSH user `dpoe`. NAS repo checkout: `/volume1/PoeTech/repos/Kingdom-PWA-Node`.

### Step 1 — get the code on the NAS (it's already in the repo; just pull)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "cd /volume1/PoeTech/repos/Kingdom-PWA-Node; git pull"
ssh dpoe@192.168.1.26 "node /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.mjs --list"
```
The `--list` should print the registry with `runner=disarmed (inert)`.

### Step 2 — point the reel at the live Dispatch sink + set the cap (optional .env)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "printf 'REEL_FILE=/data/poetech-briefing/_reel.jsonl\nNTFY_URL=\nNTFY_TOPIC=\n' > /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/.env"
```
(Leave `NTFY_*` blank to log-only; fill them to get failure pings. The defaults
already probe `127.0.0.1:5678/healthz` (n8n) + `127.0.0.1:11434` (Ollama) — override
with `HEALTH_TARGETS` in `.env` if those ports differ.)

### Step 3 — prove it INERT, then ARM it (this is the one deliberate, attended step)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "node /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.mjs --loop=health-check --dry-run"
ssh dpoe@192.168.1.26 "LOOPS_ARMED=1 node /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.mjs --loop=health-check"
```
First line (`--dry-run`): a `[dry-run] ... HOLD(...disarmed...)` preview, runs nothing.
Second line: with the `LOOPS_ARMED=1` parameter set, it actually probes and writes a
reel line. To arm PERSISTENTLY for the scheduler, put `LOOPS_ARMED=1` in
`infra/nas-loops/.env` (one parameter, governs every fire). **Arming is your hand,
attended — never while you travel** (the June-6 rule). Deterministic loops are the
safe class, but the discipline holds.

### Step 4 — register the schedule (one-time; two equal ways)

**Way 4B below is the proven paste-path** (DR-0108: "no paste for this" was an
unverified must-be-by-hand premise — disproven 2026-08-04 when the choir-dates
registration went in over SSH from a phone; REV-0230, DR-0272). Way 4A remains
right when you want the task visible and toggleable in the DSM web UI.

#### Way 4A — DSM Task Scheduler (web UI; governance-visible)

1. **DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script.**
2. **General:** Task = `nas-loop health-check`; **User = `root`**.
3. **Schedule:** repeat every **10 minutes** (matches the registry's documented schedule).
4. **Task Settings → Run command** (arm persistently first via `.env`, above):
   ```
   bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.sh health-check
   ```
5. Save. (For a daemon-style loop you'd use a **Triggered Task → Boot-up** instead;
   the health-check is periodic, so Scheduled is correct.)

#### Way 4B — root crontab over SSH (paste-ready; what registered the fleet 2026-08-04)

Synology's Task Scheduler is root's `/etc/crontab` underneath (TAB-separated
fields — the `\t` in the printf below is load-bearing). Idempotent: appends only
if the line is missing, restarts crond, echoes the line as proof. Works from
ConnectBot on a phone the same as from a desktop. Requires password sudo (the
narrow NOPASSWD grant covers only the loop runner, by design):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26
```

then at the NAS prompt:

```
sudo sh -c 'grep -q "nas-loops/run.sh" /etc/crontab || printf "*/15\t*\t*\t*\t*\troot\tbash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.sh >> /volume1/PoeTech/state/nas-loops-cron.log 2>&1\n" >> /etc/crontab; systemctl restart crond 2>/dev/null || synoservice -restart crond; grep nas-loops /etc/crontab'
```

Two caveats, known and accepted (REV-0230): the entry does NOT appear in the
DSM Task Scheduler UI (cron runs it all the same; the log is
`/volume1/PoeTech/state/nas-loops-cron.log`), and a later task edit in the DSM
UI can rewrite `/etc/crontab` and drop hand-added lines — if the fleet goes
quiet after a UI change, re-paste the block (idempotent). Verification is
measured, never assumed (DR-0076): the next `nas-bootstrap` log's
`usedToday` counter accumulating beyond the dispatched runs is the proof the
clock fires on its own.

Watch the reel confirm runs:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "tail -5 /data/poetech-briefing/_reel.jsonl"
```

### Stop-paths (deterministic — DR-0248; the manual kill-switch is removed)
- Set the loop `enabled: false` in `registry.json` in a PR (the gates review it).
- Delete `infra/nas-loops/ARMED-BY-RECORD` in a PR (disarms the whole fleet by record).
- Toggle the DSM Task Scheduler entry off on the NAS (per-loop, boot-persistent).

### Migrate the rest (per the research-review §6)
Non-LLM loops first (health/probe class), then reconciliation, then the autonomous
wf06/wf27 class **last and Tier C** (those go through the AI gate, not this one).
The 21 SAFE webhook workflows stay in n8n untouched.
