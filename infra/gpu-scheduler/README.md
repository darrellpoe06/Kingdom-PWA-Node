# Idle-GPU Opportunistic Scheduler — inert scaffolding

The church CUDA GPUs (2× RTX 4070) sit idle overnight and between services. This
is the **deterministic, brake-gated** scheduler that *would* queue heavy jobs
(voice clone, harvest transcription, batch local-LLM) to run only when a capable
node is free, the idle window is open, and every Cage brake is go.

**It ships INERT.** Nothing here puts load on a GPU. The runner plans and logs;
dispatch is a deliberate stub. Arming is reserved for Darrell, attended (Tier C).
This is the structural promise of "Autonomous Automation Requires Three Brakes"
(CLAUDE.md) and `feedback-no-autonomous-automation-without-brakes`.

## How it is deterministic-first

The decision logic is **plain code, no LLM** — the pure core in
`app/src/lib/gpu-scheduler.js` (proven by `app/src/__tests__/gpu-scheduler.test.js`).
A model never decides what runs. The GPU runs an AI job only when that job is the
*necessary work*, it is *approved*, a *capable node is free*, and the *brakes pass*.
Routing is a capability match against the device register (`church_devices`,
surfaced in the app's Church → Devices tab): a `transcription` job goes only to a
node whose `capabilities` include `transcription`.

## The brakes (all required, all shipped engaged/absent)

1. **Kill-switch** — `state/KILL_SWITCH` present ⇒ engaged ⇒ nothing runs. *Ships present.*
   Recreate it any time to panic-stop.
2. **Streaming hold** — `state/STREAMING_HOLD` present ⇒ a live stream is in
   progress ⇒ the CUDA towers (LEFT `tlcmediadpt`, RIGHT `livestream-main-pc`)
   are reserved for the stream ⇒ nothing runs. This is DR-0012 as a physical
   brake, senior to every arm and budget: create the file when streaming
   starts, delete it only when the stream has ended. When in doubt, leave it
   engaged. *Ships absent* — see the staleness note below.

   **A brake that never clears stops meaning anything.** This shipped engaged
   2026-07-14 ("dont use the left or right cuda right now we are streaming!")
   and was still engaged on 2026-08-14 — a month, against a stream that ended
   the same day. Cleared then. When every flag in a directory reads ENGAGED
   permanently, nobody notices the one that matters, which is the failure mode
   this note exists to prevent. **Put the date and the reason in the file when
   you engage it**, so the next reader can tell a live hold from a forgotten
   one at a glance. Clearing it is not the risk it looks like: the kill-switch,
   the two absent arms, the unset budgets, the stubbed dispatch, and having no
   clock each block the scheduler independently.
3. **Arm (×2)** — both `state/ARMED` and `state/GPU_SCHED_ARMED` must exist
   (master arm + dedicated scheduler arm). *Ship absent.*
4. **Budget** — `GPU_SCHED_MAX_JOBS_PER_RUN` and `GPU_SCHED_MAX_JOBS_PER_DAY`
   env vars must be > 0. *Unset = 0 = missing brake = inert.*

A device whose register status is `streaming` is additionally never a routing
candidate (it is not in `IDLE_STATES`) — so even with the hold cleared, a box
still marked live can't be picked.

Plus a **single-flight lock** (`state/run.lock/`; a second run skips) and an
**append-only event log** (`state/events.jsonl`; every decision recorded).

`brakeGate(makeInertState())` is `{ go: false }` — and a unit test asserts it,
so the inert default can never silently loosen (proven-to-catch, DR-0076).

## Run it (safe — plan only)

```
node scripts/gpu-scheduler.mjs
```

Reads `devices.json` + `queue.json` + the brake flags, prints what *would* run and
why each job is skipped, appends one `plan` event to `state/events.jsonl`, and
dispatches nothing. With the shipped state it prints `INERT: KILL_SWITCH engaged`.

Even `node scripts/gpu-scheduler.mjs --run` will not dispatch: the dispatch path
is a stub that logs `DISPATCH NOT WIRED (inert scaffold)`.

## Arming — Darrell's deliberate, attended steps (do NOT automate)

> Not now. This is the runbook for *when* you choose to turn it on, with someone
> watching. It is Tier C. Never arm unattended; never while traveling.

1. Export the device manifest from the register into `devices.json` (the nodes +
   their capabilities the router matches against).
2. Set the budgets: `GPU_SCHED_MAX_JOBS_PER_RUN`, `GPU_SCHED_MAX_JOBS_PER_DAY`.
3. Add real jobs to `queue.json` with `approved: true`, `status: "queued"`.
4. Wire the dispatch stub in `scripts/gpu-scheduler.mjs` to the real GPU endpoints
   (`ollama:11434` / `voice-studio:8770` / `whisper-gpu:8771`) — a separate,
   reviewed change.
5. Arm: create `state/ARMED` and `state/GPU_SCHED_ARMED`, then remove
   `state/KILL_SWITCH` — and remove `state/STREAMING_HOLD` ONLY if no service
   is streaming or about to.
6. Watch `state/events.jsonl`. Disarm by recreating `state/KILL_SWITCH`;
   protect a live stream by recreating `state/STREAMING_HOLD`.

DR-0012: inference never runs on the box encoding a live stream during a service.
