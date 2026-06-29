# NAS-LOOP-RUNNER-PATTERN — the braked-native discipline every routine loop inherits

**Added 2026-06-29.** Layer 3 foundation. Companion to `LESSONS-LEARNED.md` (P10/P11/P12,
the June-6 runaway), `RELEASE-TIERS.md` (autonomy is Tier C), and the
`feedback_autonomous_automation_three_brakes` binding rule. Grounded by the
2026-06-29 research-review (`docs/99-session-notes/2026-06-29-research-review-sustainable-headless-nas-loops.md`).

## The pattern, in one paragraph

Routine, timer-driven NAS work runs as **small deterministic scripts that EXIT**,
fired by **Synology DSM Task Scheduler** (boot-persistent, root-owned, no login,
survives reboot), each gated by **one shared braked dispatcher** — never as a
long-lived service and never inside the n8n single process. A script that exits
holds no RAM at idle and cannot wedge a shared process; the dispatcher carries the
three brakes so headless never means unbraked. The reference implementation is
`infra/nas-loops/` (runner `run.mjs`, pure decision core `scripts/lib/nas-loops.mjs`,
DSM entry `run.sh`).

## The two-workload split (the reframe that makes this tractable)

| Workload | Home | Why |
|---|---|---|
| **Request-response webhooks** (the PWA's live data plane: imported-tx, briefing, feedback, dispatch-status…) | **Keep in n8n, hardened** | Bounded, reactive, already wired same-origin through the Funnel. n8n is good at this. |
| **Timer-driven loops** (health probes, digests, reconciliation, the reel…) | **This runner** (DSM + braked dispatcher) | These are both the n8n crash driver and the runaway-risk class. They gain nothing from a visual single-process orchestrator. |

Do **not** rip n8n out — it serves the webhook side the PWA depends on
(`project_n8n_same_origin_rewrite`). Move the *loops* out; harden n8n for the rest.

## The two loop kinds — and which gate runs them

- **`deterministic`** — no LLM, no vendor, makes **no new decisions**. Run by THIS
  dispatcher. Keeps going headless whether or not Claude/Dispatch is online. This is
  the lower-risk class and the bulk of routine work.
- **`ai`** — needs a vendor/local-LLM. **Refused** by this dispatcher and delegated
  to the cap-resume/wake gate (`scripts/cap-resume.mjs`), a **strict superset** of
  brakes (adds ARMED + RESUME_ARMED + $-budget + cap-reset window). Arming the
  autonomous AI class stays **Tier C** — attended only, never while the principal
  travels.

One registry can carry both; the dispatcher routes by `kind`. This keeps the
"deterministic-first" rule structural: routine loops never block on the AI, and the
AI class never escapes its heavier gate by riding the lighter one.

## The brakes — binding, non-negotiable, the same files for the whole fleet

1. **Budget** — per-run **wall-clock timeout** (a hung loop is killed at its ceiling)
   + per-day **call cap**. For AI loops, a `$`/token ceiling too. An unset ceiling is
   a *missing* brake, and a missing brake means **do not act**.
2. **Concurrency lock** — atomic **lockdir** per loop; a second fire that finds it
   held **skips**, never stacks.
3. **Kill-switch** — a `KILL_SWITCH` file → every loop **inert** (one touch halts the
   fleet). PLUS a class **arm flag** (`LOOPS_ARMED` here; `RESUME_ARMED` for the AI
   class) that **ships ABSENT** → the runner ships inert and is armed once, by hand.
4. **Observability** — one append-only JSONL line per run to the **event reel**
   (`_reel.jsonl`, the Dispatch Status data source) + an events log; **ntfy** on
   failure. Silence is not success; every run leaves a trace.

**The NAS is the governance point.** The brakes are files on the NAS filesystem;
`touch KILL_SWITCH` halts everything, counters and locks are inspectable with
`ls`/`cat`, the reel is the audit trail, and **DSM Task Scheduler is itself the
governance UI** — each loop is a named task you enable/disable. No cloud in the
control loop (Tailscale/LAN-only, no public attack surface). Headless changes *who
clicks* (a daemon, not a human at an editor); it does **not** change *what's allowed*.

## Verification discipline (DR-0076)

The decision authority is **pure and unit-tested proven-to-catch** — each brake is
proven to BOTH block when it should AND open only when every condition is genuinely
met (a gate that always passes is a lie). The runner is the I/O shell around that
core; the two mirror each other so neither drifts unproven. Ship inert; arm
deliberately; observe every run.

*Diagnose before you fix. Separate the workloads. Brake before you arm. The NAS is
the governance point. Deterministic-first, so building continues when the vendor AI
is down. We all win. We create.*
