# nas-ways — the sovereign "Ways brain" (the Ways, live in the app)

DR-0219 / DR-0083 sovereign-Python. `ways_ingest.py` parses the repo's Ways docs
(`docs/decisions/PRINCIPLES.md` + the `DR-*.md` files, including their `re-review:`
dates) into one queryable **`ways-brain.json`** — the binding principles, the
decision ledger, and the open re-review backlog. The app reads it same-origin at
`/ways/brain.json` (`app/src/lib/ways-brain.js`) so the Ways show up **live**,
updated whenever this runs on the NAS — not only at the last deploy — and the NAS
loops can ground themselves against the CURRENT Ways.

## Why this is safe (THREE-BRAKES / the 2026-06-06 quarantine lesson)

`ways_ingest.py` is **only a parser**. One `--run` reads the docs, writes one JSON
file (atomically), and **exits**. It calls **no LLM, spawns no compute, runs no
loop**, and **never writes into the repo** — so the run itself is bounded and
safe (DR-0186). The thing that would make it *continuous* — a timer that re-runs
it — is a doc-WATCHER, the exact class that ran away in 2026-06-06. So:

- **The systemd timer below ships DISABLED.** Arm it only with someone watching
  (Tier C). Nothing here self-schedules.
- **Kill-switch:** `systemctl stop poetech-ways.timer` (or delete the unit). The
  resting state is OFF.
- The parser is idempotent (same docs → same bytes, modulo `generated_at`).

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

## Optional: keep it fresh (DISABLED by default — arm only when watched)

`poetech-ways.service` (a `Type=oneshot` that runs the `--run` above) + a
`poetech-ways.timer`. **Do not `enable --now` unattended.** When you choose to
arm it (Tier C, watching), a modest cadence (e.g. `OnUnitActiveSec=30min`) keeps
`/ways/brain.json` current between deploys. It is a bounded single-shot each fire;
if a run overruns or the box is loaded, `stop` the timer — the app simply falls
back to the last good brain or the build snapshot.

## Verify (offline, no NAS)

```
python3 ways_ingest.py --selftest      # 9/9 checks — gated in CI
```
