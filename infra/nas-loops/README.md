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
| **Budget** | per-run wall-clock **timeout** (a hung loop is killed at its ceiling) + per-day **call cap** (`max_calls_per_day`; an unset cap is a *missing* brake → no-go) | lower the cap / `touch KILL_SWITCH` |
| **Concurrency lock** | per-loop atomic **lockdir** (`state/<loop>.lock`); a second fire that finds it held **skips** | automatic |
| **Kill-switch** | `state/KILL_SWITCH` present → every loop **inert** (fleet-wide panic). PLUS `state/LOOPS_ARMED` (the deterministic-class arm; **ships ABSENT** → inert) | `touch state/KILL_SWITCH` |
| **Observability** | one JSONL line per run to the **event reel** (the same `_reel.jsonl` the Dispatch Status surface reads) + `events/events.jsonl`; **ntfy** on failure | — |

**Ships inert.** With no `LOOPS_ARMED` flag and no `--run`, the runner only logs
what it *would* do. Live runs need BOTH `--run` AND every brake GO. The decision
authority is the pure, unit-tested core `scripts/lib/nas-loops.mjs` (proven-to-catch,
DR-0076); this runner only does the I/O around it.

## Local commands (any host)

```
node infra/nas-loops/run.mjs --list                       # registry + live brake state
node infra/nas-loops/run.mjs --loop=health-check          # plan-only (logs intent)
node infra/nas-loops/run.mjs --loop=health-check --run     # LIVE (needs all brakes GO)
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
> SSH user `dpoe`. Substitute `<repo>` with the NAS repo-checkout path.

### Step 1 — get the code on the NAS (it's already in the repo; just pull)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "cd /volume1/PoeTech/<repo>; git pull"
ssh dpoe@192.168.1.26 "node /volume1/PoeTech/<repo>/infra/nas-loops/run.mjs --list"
```
The `--list` should print the registry with `runner=disarmed (inert)`.

### Step 2 — point the reel at the live Dispatch sink + set the cap (optional .env)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "printf 'REEL_FILE=/data/poetech-briefing/_reel.jsonl\nNTFY_URL=\nNTFY_TOPIC=\n' > /volume1/PoeTech/<repo>/infra/nas-loops/.env"
```
(Leave `NTFY_*` blank to log-only; fill them to get failure pings. The defaults
already probe `127.0.0.1:5678/healthz` (n8n) + `127.0.0.1:11434` (Ollama) — override
with `HEALTH_TARGETS` in `.env` if those ports differ.)

### Step 3 — prove it INERT, then ARM it (this is the one deliberate, attended step)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "node /volume1/PoeTech/<repo>/infra/nas-loops/run.mjs --loop=health-check --run"
ssh dpoe@192.168.1.26 "touch /volume1/PoeTech/<repo>/infra/nas-loops/state/LOOPS_ARMED"
ssh dpoe@192.168.1.26 "node /volume1/PoeTech/<repo>/infra/nas-loops/run.mjs --loop=health-check --run"
```
First run: `[inert] ... disarmed`. After the `touch`: it actually probes and writes
a reel line. **Arming is your hand, attended — never while you travel** (the June-6
rule). Deterministic loops are the safe class, but the discipline holds.

### Step 4 — register the DSM Task Scheduler entry (DSM UI; one-time, by hand)
DSM is the governance UI — the entry is a named task you enable/disable, root-owned,
boot-persistent. There is no paste for this; it's the DSM web UI:

1. **DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script.**
2. **General:** Task = `nas-loop health-check`; **User = `root`**.
3. **Schedule:** repeat every **10 minutes** (matches the registry's documented schedule).
4. **Task Settings → Run command:**
   ```
   bash /volume1/PoeTech/<repo>/infra/nas-loops/run.sh health-check --run
   ```
5. Save. (For a daemon-style loop you'd use a **Triggered Task → Boot-up** instead;
   the health-check is periodic, so Scheduled is correct.)

Watch the reel confirm runs:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "tail -5 /data/poetech-briefing/_reel.jsonl"
```

### Panic / disarm (one step, your hand)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "touch /volume1/PoeTech/<repo>/infra/nas-loops/state/KILL_SWITCH"   # halt ALL loops now
ssh dpoe@192.168.1.26 "rm /volume1/PoeTech/<repo>/infra/nas-loops/state/LOOPS_ARMED"       # disarm (stay deployed)
```
To resume: `rm` the `KILL_SWITCH`. To halt the **whole fleet** (this runner AND the
AI orchestrator) with a single file, set `KILL_SWITCH_FILE` in `.env` to the shared
bundle path `infra/ai-orchestrator/portable/state/KILL_SWITCH`.

### Migrate the rest (per the research-review §6)
Non-LLM loops first (health/probe class), then reconciliation, then the autonomous
wf06/wf27 class **last and Tier C** (those go through the AI gate, not this one).
The 21 SAFE webhook workflows stay in n8n untouched.
