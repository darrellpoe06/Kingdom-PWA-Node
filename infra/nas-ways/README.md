# nas-ways — the sovereign "Ways brain" (the Ways, live in the app)

DR-0219 / DR-0083 sovereign-Python. `ways_ingest.py` parses the repo's Ways docs
(`docs/decisions/PRINCIPLES.md` + the `DR-*.md` files, including their `re-review:`
dates) into one queryable **`ways-brain.json`** — the binding principles, the
decision ledger, and the open re-review backlog. The app reads it same-origin at
`/ways/brain.json` (`app/src/lib/ways-brain.js`) so the Ways show up **live**,
updated whenever this runs on the NAS — not only at the last deploy — and the NAS
loops can ground themselves against the CURRENT Ways.

## Why it RUNS by default (DR-0186), and the three brakes

`ways_ingest.py` is the **bounded, single-shot, idempotent, spawns-no-compute-and-
no-LLM** class: one `--run` reads the docs, writes one JSON file (atomically), and
**exits**; it cannot loop (the scheduler is the clock) and never writes into the
repo. **DR-0186** is explicit that this class **RUNS by default and writes to
production the moment it is fired** — the tests are the gate, not an arming
ceremony ("the over-braking WAS the failure… you did nothing today"). It is **not**
the 2026-06-06 runaway class (which LOOPED and SPAWNED compute/LLM). So the timer
below **ships ENABLED**.

The three brakes (DR-0083, unchanged — they prevent *malfunction*, none gates a
normal run):
- **Budget** — a wall-clock ceiling: the parser's `WAYS_TIMEOUT_SEC` SIGALRM
  (default 120s) + the `.service` `TimeoutStartSec`.
- **Concurrency** — a single-flight `mkdir` lock (`<out-dir>/.ways-state/run.lock`);
  a fire that finds a run live SKIPS.
- **Kill-switch** — `touch <out-dir>/.ways-state/KILL_SWITCH` halts it instantly;
  it **ships ABSENT**, so the resting state is **running**. (`systemctl stop
  poetech-ways.timer` is the other stop.)

## Run it once (NAS, SSH / ConnectBot)

```
cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-ways
python3 ways_ingest.py --run \
  --repo /volume1/PoeTech/repos/Kingdom-PWA-Node \
  --out  /volume1/PoeTech/caddy/site/poetech-app/ways/brain.json
```

Serve it same-origin in the Caddy site block (it's a static file — no server):

```
handle /ways/* {
    root * /volume1/PoeTech/caddy/site/poetech-app
    file_server
}
```

For public poetech.us the `/ways/*` path is a static file behind the same
transport as `/reviews/*` and `/finance/*`. Until the file exists the app shows
this build's snapshot (a designed floor, not a break).

## Keep it fresh — the timer ships ENABLED (DR-0186)

`poetech-ways.service` (a `Type=oneshot` that runs the `--run` above) +
`poetech-ways.timer` (every 30 min). Install and **enable** them as the normal
deploy step — no arming ceremony (DR-0186):

```
sudo cp poetech-ways.service poetech-ways.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now poetech-ways.timer
```

`/ways/brain.json` then stays current between deploys. Each fire is a bounded
single-shot; if a run overruns the budget kills it, a stacked fire skips on the
lock, and `touch <out-dir>/.ways-state/KILL_SWITCH` (or `systemctl stop
poetech-ways.timer`) halts it — and the app simply falls back to the last good
brain or the build snapshot.

## Verify (offline, no NAS)

```
python3 ways_ingest.py --selftest      # 9/9 checks — gated in CI
```
