# Portable PoeTech Orchestrator — copy-paste to a new NAS, control right away

A **self-contained** orchestrator bundle. Drop this folder on a brand-new NAS,
run one command, and you have a live, observable, fully-braked orchestrator
presence — with **no external dependency** beyond one pinned container image.

> Built on the Cage (`infra/ai-orchestrator/`). The two-tier Cage
> (`registry/` on the NAS + `node1/` on the GPU box) is the full production
> engine and depends on that real infrastructure. **This `portable/` bundle is
> the opposite**: zero external reliance, so it stands up anywhere, instantly,
> and gives you control. It ships **inert** — it does not self-drive or summon
> any vendor LLM until deliberately armed, and the live self-drive logic is not
> in this skeleton at all (it arms later, behind the full Cage, with Darrell's go).

## What it is

- A small supervisor container that reads its **Charter** (policy as mounted
  config), evaluates its **three brakes** every tick, and writes an
  **append-only JSONL event log** local to the bundle.
- **Inert by default.** The kill-switch ships *engaged*; there is no ARM flag;
  budgets are unset (an unset budget is treated as a *missing brake*). In this
  state the orchestrator only heartbeats and obeys policy — it takes no action.
- **No phone-home.** The only external artifact is the pinned base image in
  `docker-compose.yml`. No cloud, no external registry, no GPU, no Tailscale
  required to run.

## Copy-paste to a new NAS (the one command)

```bash
# 1. Copy this whole folder onto the NAS (scp, rsync, Synology File Station,
#    or git archive -- any way you like). Then:
cd /path/to/portable
./bootstrap.sh
```

`bootstrap.sh` is **idempotent** — safe to run again any time. It self-checks
Docker, ensures the kill-switch is engaged and no ARM flag exists, creates `.env`
from `.env.example` (never clobbering an existing one), pulls the pinned image,
and starts the container. Re-running just reconciles to the safe default and
restarts.

### Verify it's up and inert

```bash
docker compose ps                 # orchestrator: running
tail -f events/events.jsonl       # heartbeat lines: "inert: kill-switch engaged"
```

## The three brakes + kill-switch (June-6 runaway rule)

This bundle ships with **all three brakes** wired and the **kill-switch engaged**.
Nothing in this class self-activates unattended — ever.

| Brake | Where | Default | Effect |
|-------|-------|---------|--------|
| **Budget** | `.env` `BUDGET_PER_TASK_USD` + `BUDGET_DAILY_USD` | `0` (unset) | Per-task and daily $ ceiling for any vendor-LLM summon. Unset = missing brake = inert. Reaching the daily ceiling refuses; it never continues. |
| **Concurrency** | `state/orchestrator.lock/` (atomic lockdir) | single-instance | A second start that finds the lock held **skips** — it never stacks on a live run. |
| **Kill-switch** | `state/KILL_SWITCH` | **present (engaged)** | While present, the orchestrator is **inert** (auto-pause). Never auto-continues into a runaway. |
| **ARM flag** | `state/ARMED` | **absent (disarmed)** | Autonomy + vendor-summoning stay OFF until this is deliberately set. |

There is also a **hard Charter gate**: `autonomy.self_drive_implemented` ships
`false`, and the supervisor honors it *above* the ARM flag — so a stray `ARMED`
file can never trip autonomy that doesn't exist.

## Arm / disarm (later, deliberately)

Arming autonomy is a **Tier C** act (`docs/00-foundations/_root/RELEASE-TIERS.md`):
reviewed, signed off, and turned on **only with someone watching** — never while
the principal is traveling.

```bash
# Arm (all preconditions are checked; refuses if any brake is missing):
#   1. set real budgets in .env  (BUDGET_PER_TASK_USD, BUDGET_DAILY_USD > 0)
./disarm.sh --off     # disengage the kill-switch
./arm.sh              # set the ARM flag (refuses unless budgets are configured)
docker compose restart

# Return to safe default:
./disarm.sh           # remove the ARM flag

# Panic stop (full inert, any time):
./disarm.sh --on      # re-engage the kill-switch + unarm
```

Even fully armed, **this skeleton does nothing dangerous** — it logs
`armed_standby` ("standing by, no vendor summon") because the live dispatch logic
is intentionally not implemented here.

## Resource caps (host-safety brake)

`docker-compose.yml` caps the container at **`cpus: '1'` / `mem_limit: 1g`** (plus
a 256m reservation). On a shared NAS the orchestrator must never starve DSM,
storage, or the host's n8n + ntfy + ollama workflows. The caps are the floor of
good-neighbor behavior, and they are a brake in their own right.

## Layout

```
portable/
  README.md            # this file
  bootstrap.sh         # one-command, idempotent setup
  docker-compose.yml   # the orchestrator container, cpus 1 / mem 1g
  .env.example         # copy to .env (bootstrap does this); budgets default 0
  arm.sh / disarm.sh   # deliberate, audited arm/disarm + panic stop
  charter/
    charter.yml        # POLICY AS CONFIG (skeleton) -- read at runtime, read-only
    README.md          # what the Charter is; canonical version approved separately
  orchestrator/
    entrypoint.sh      # the supervisor loop (POSIX sh; inert skeleton)
    lib/
      eventlog.sh      # append-only JSONL writer
      brakes.sh        # budget + concurrency + kill-switch + ARM gate
  state/
    KILL_SWITCH        # ships ENGAGED (tracked); ARM flag + lock + spend are runtime
  events/
    events.jsonl       # append-only event log (runtime; gitignored)
  MANIFEST.json        # freshness manifest (sha256 of every shipped file) -- see below
```

## Staying current (the freshness gate)

This bundle is the client-handoff artifact, so it must never silently drift from
our processes. That guarantee is **enforced, not remembered**: `MANIFEST.json`
pins a sha256 of every shipped file here plus a small set of tracked upstream
sources, and a build gate (`app/src/__tests__/portable-bundle-fresh.test.js`,
run by `npm run verify` and CI) **fails the build** if anything drifts —
a changed file, a new uncovered file, or a moved upstream source.

After any intentional change to this bundle — or after reconciling it to a
changed upstream source the gate flagged — re-stamp:

```bash
node scripts/stamp-portable-manifest.mjs
```

Re-stamping is the deliberate "this bundle is current and client-ready" review.
You cannot ship a stale bundle past the gate without consciously re-stamping it.

## The self-contained guarantee

## The self-contained guarantee

To **run**, this bundle needs exactly one thing it doesn't already carry: the
pinned `alpine:3.20` image. Everything else — policy, brakes, supervisor,
observability — is in the folder. No database, no cloud account, no GPU, no
network egress. That is what "copy-paste this orchestrator on a new NAS and have
control right away" means here.
