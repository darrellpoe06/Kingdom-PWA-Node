# Bounded Auto-Resume after a Vendor Cap/Outage — Contract & Runbook

> **What this is.** A pragmatic MVP bridge: after a vendor outage or daily cap, the
> previously-**approved, queued** work resumes **automatically** on the always-on NAS
> — *without* waiting on the full local-LLM conductor or the GPU box.
>
> **What this is NOT.** Open-ended autonomy. This is **BOUNDED resume of
> already-approved work**. It only continues an explicit, human-greenlit queue and
> **makes no new decisions**. That lower risk class is the whole design premise — and
> it is enforced in code, not promised in prose (`selectEligible` in
> `scripts/lib/resume-queue.mjs` drops any item that is not `approved: true`).
>
> **It ships INERT.** Arming is the one thing reserved for Darrell (see *Arm/Disarm*).

---

## 1. Research-review — the options we weighed

The goal: "the cap reset, so continue the work I already approved" — reliably,
sovereignly, cheaply, and safely. Five candidate mechanisms:

| # | Option | How it would resume | Verdict |
|---|--------|---------------------|---------|
| A | **Wait for the full local-LLM conductor** (`project-success-metric-247-local-wakes-vendor`) | KPI/throughput-aware local orchestrator routes + resumes everything | **Destination, not now.** It is the real end-state, but it is not built; the cap problem is here today. This MVP is the bridge to it, not a competitor. |
| B | **GPU box runs it locally** | Local model finishes the work, no vendor cap at all | **Blocked on hardware.** Right answer for *private* lanes eventually; doesn't help today and doesn't cover vendor-affinity (code) work. |
| C | **Desktop retry loop / keep-alive** | The capped desktop session keeps retrying until the cap clears | **Rejected.** It runs on the very machine that is capped, has no brakes, and is exactly the runaway shape the June-6 rule forbids. |
| D | **n8n cron on the NAS that calls the vendor API directly** | A workflow fires after reset and POSTs the task to Claude | **Partial.** Good trigger location (NAS, uncapped), but n8n alone has no approved-queue gate, no $/call budget brake, no idempotent status. Usable as the *scheduler* feeding option E. |
| E | **NAS scheduler -> braked headless runner over an approved queue** (THIS) | Cron/timer on the NAS fires after the cap window; a headless Claude API runner continues only the `approved + pending` items, behind the three brakes, idempotently | **Chosen.** Sovereign trigger location, explicit bounded queue, real brakes, reuses the existing wake bridge + brakes, ships inert. |

**Recommendation (chosen): Option E**, implemented as a thin extension of the
already-built portable orchestrator bundle rather than a new system:

- **Trigger location** = the always-on **NAS** (DS1621xs), which is *not* subject to
  the desktop vendor account cap. A scheduler (cron / systemd timer / n8n — all three
  documented below) fires **after** the cap-reset window. The reset is **configurable**
  (`CAP_RESET_LOCAL`, default `04:30`; `CAP_RESET_TZ`, default `America/Chicago`) with a
  **buffer** (`CAP_RESET_BUFFER_MIN`) and a **retry** loop (`resume-cron.sh`).
- **Approved queue** = `state/approved-queue.json` on the NAS — a materialized, explicit
  list; only `approved: true && status: pending` items are eligible (this file).
- **Resume runner** = `scripts/cap-resume.mjs`, a headless Claude API / Agent-SDK-style
  invocation **on the NAS** (sovereign), reusing the wake bridge's vendor layer.
- **Three brakes** = budget (per-task + daily `$` **and** per-run + per-day **call caps**),
  lock (single-flight + idempotent status), kill-switch (global + a dedicated
  `RESUME_ARMED` consent flag). Plus ntfy alerting + the append-only event log.

### Honest constraints (documented, not hidden)

- **API limits + billing are finite.** The resume runs against the **Claude API**, which
  has its *own* rate limits and **costs real money** — separate from, but not infinite
  beyond, the desktop cap. The budget + call caps exist precisely because this is not
  free, unbounded resume. Reaching a ceiling **stops**; it does not continue.
- **The approved queue must be explicit.** There is no blank-check autonomy. An item the
  human did not mark `approved: true` is never eligible. **No approved item = no-op.**
- **This is the MVP bridge, not the destination.** The full local-LLM conductor
  (`project-orchestrated-lanes-operating-model`, the 24/7 local-wakes-vendor metric)
  remains the goal. This buys reliable bounded resume *today* while that is built.

---

## 2. How it fits the existing orchestrator (reuse, not duplicate)

This lane is built **on top of** the portable bundle — it adds files, it does not fork
the engine:

- **Reuses** the wake/handoff contract (`handoff/schema.json`, `scripts/lib/handoff.mjs`):
  each queue item's resume payload **is** a handoff, validated by the same
  `validateHandoff`. The vendor call layer (`scripts/lib/vendors.mjs`), tiered
  `pickVendor`, and measured `estimateCostUsd` are reused verbatim.
- **Mirrors** `orchestrator/lib/brakes.sh`: the same kill-switch / ARM / budget files and
  the same "unset == missing brake == inert" rule, extended with the count caps.
- **Sibling to** the wake bridge (`scripts/wake-router.mjs`): that bridge resumes off a
  *per-handoff event* on a tiered schedule; this lane resumes a *bounded approved queue*
  on the *cap-reset poll*. Same brakes, same event log, same secrets handling.

### The DR-0071 reconciliation (event-driven vs. timer — read this)

The standing rule (DR-0071) is *event-driven self-activation off a real handoff, never a
bare timer loop*. A cron firing at 04:35 looks like a bare timer. It is not, and here is
the honest reconciliation:

> The scheduler is only a **poll**. It does not decide to do work; it asks "is there
> approved work whose precondition (the cap has reset) is now met?" The **real event** is
> *(a)* the cap-reset window being open **and** *(b)* a human having set `approved: true`.
> With no approved item, the poll is a no-op. The clock cannot manufacture work — it can
> only notice that already-approved, already-gated work is now runnable. That is the
> bounded-resume guarantee, and it is why this stays inside the June-6 rule.

---

## 3. The approved-queue format

Schema: [`approved-queue.schema.json`](approved-queue.schema.json). Worked example (with
one approved + one deliberately-unapproved item, to show the gate):
[`example.approved-queue.json`](example.approved-queue.json).

```jsonc
{
  "v": 1,
  "items": [
    {
      "id": "resume-darrells-study-001",   // stable, unique; idempotency + audit key
      "approved": true,                      // THE gate. Only true is eligible. Darrell sets it.
      "status": "pending",                   // pending -> in_progress -> done|failed (runner writes back)
      "not_before": "2026-06-24T09:00:00Z",  // optional UTC floor (even when approved + window open)
      "handoff": { /* a full wake/handoff: lane, task, work_type, private, state_pointer */ }
    }
  ]
}
```

- The **live** queue is `state/approved-queue.json` on the NAS (gitignored — real task
  text never lands in the public repo). Seed it from the example, then edit.
- `approved` defaults to **nothing eligible**: it must be an explicit boolean `true`.
- `status` makes the runner **idempotent**: a `done` item is never resumed twice.
- `handoff.private: true` forces **local-only** resume (sovereignty gate) — a private
  lane never goes to a vendor, in any mode.

---

## 4. The three brakes (binding — built in, not bolted on)

| Brake | Where | Default (inert) | Effect |
|-------|-------|-----------------|--------|
| **Budget — $** | `.env` `BUDGET_PER_TASK_USD` + `BUDGET_DAILY_USD` | `0` (unset = missing brake) | Per-task + daily dollar ceiling; **measured** real spend (`estimateCostUsd`), not estimated. Reaching the daily ceiling stops the run. |
| **Budget — calls** | `.env` `RESUME_MAX_TASKS_PER_RUN` + `RESUME_MAX_CALLS_PER_DAY` | `0` (unset = missing brake) | Hard cap on tasks resumed **per run** and API calls **per day**. Both must be > 0 or the lane stays inert. |
| **Lock** | `state/resume.lock/` (atomic mkdir) + per-item `status` | single-flight | A second fire that finds the lock held **SKIPS** (never stacks/loops on itself). A `done` item is never re-run (idempotent). |
| **Kill-switch** | `state/KILL_SWITCH` (global) **+** dedicated `state/RESUME_ARMED` | KILL_SWITCH **present**; RESUME_ARMED **absent** | KILL_SWITCH present => INERT everywhere (panic stop). RESUME_ARMED absent => this lane is inert even if everything else is armed. |

Observability (also binding): every run + every task logs an append-only event to
`events/events.jsonl` (`resume_run_start`, `resume_task_done`, `resume_cap_stop`, ...),
and a per-run summary fires an **ntfy** alert when `NTFY_URL` + `NTFY_TOPIC` are set
(`execution-outcome-observability`). Default plan-only mode logs exactly what it *would*
resume and calls nothing.

---

## 5. Arm / disarm — the exact steps (the ONE thing reserved for Darrell)

It ships **inert**: KILL_SWITCH engaged, RESUME_ARMED absent, budgets + caps unset. Even
fully scheduled, the runner refuses until armed. Arming is **Tier C**: only with someone
watching, never while traveling.

**Paste-ready (works from anywhere; adjust the bundle path to where it lives on the NAS):**

```bash
cd /volume1/PoeTech/Kingdom-PWA-Node/infra/ai-orchestrator/portable   # the deployed bundle dir

# 1) Set REAL budgets + caps (a missing budget/cap is a missing brake):
sed -i 's/^BUDGET_PER_TASK_USD=.*/BUDGET_PER_TASK_USD=2/' .env
sed -i 's/^BUDGET_DAILY_USD=.*/BUDGET_DAILY_USD=15/' .env
sed -i 's/^RESUME_MAX_TASKS_PER_RUN=.*/RESUME_MAX_TASKS_PER_RUN=3/' .env
sed -i 's/^RESUME_MAX_CALLS_PER_DAY=.*/RESUME_MAX_CALLS_PER_DAY=10/' .env

# 2) Put the API key on the NAS (NOT in the repo). Either env or the secrets file:
#    echo 'sk-ant-...' > /volume1/PoeTech/secrets/anthropic-api-key.txt   # chmod 600

# 3) Seed the approved queue (real task text stays on the NAS, gitignored):
mkdir -p state && cp resume/example.approved-queue.json state/approved-queue.json
#    then edit state/approved-queue.json: set approved:true only on what you greenlight.

# 4) Dry-run it FIRST (plan-only; calls nothing) to confirm what it would resume:
node ../../../scripts/cap-resume.mjs

# 5) ARM (each step is audited; resume-arm.sh refuses unless every precondition holds):
./disarm.sh --off     # disengage the global kill-switch
./arm.sh              # set the general ARM flag (refuses unless $ budgets are set)
./resume-arm.sh       # set RESUME_ARMED (refuses unless ARM + budgets + caps are set)

# 6) Schedule the NAS poll AFTER the cap reset (pick ONE):
#    cron (Synology Task Scheduler or crontab):
#      35 4 * * *  /volume1/PoeTech/Kingdom-PWA-Node/infra/ai-orchestrator/portable/resume-cron.sh >> /var/log/poetech-resume.log 2>&1
#    systemd timer: OnCalendar=*-*-* 04:35:00 (TZ America/Chicago) -> resume-cron.sh
#    n8n: Schedule node (35 4 * * *) -> Execute Command node -> resume-cron.sh
```

**Disarm / panic — any time:**

```bash
cd /volume1/PoeTech/Kingdom-PWA-Node/infra/ai-orchestrator/portable
./resume-disarm.sh    # turn bounded resume OFF (planning/observing continues); OR
./disarm.sh --on      # FULL panic stop: re-engage the global kill-switch, all lanes inert
```

To stop it firing at all, also remove the cron/timer/n8n schedule. The kill-switch makes
the runner inert immediately regardless of the schedule, so `./disarm.sh --on` is the
instant brake; removing the schedule is the durable off.

---

## 6. Verify it's inert (before and after arming)

```bash
# Plan-only dry run — shows eligibility + brake state, calls nothing:
node ../../../scripts/cap-resume.mjs --now=2026-06-24T11:00:00Z
# => [plan-only] ... cap_window=OPEN ... brakes=HOLD:... (kill-switch / RESUME_ARMED / budgets)

# After arming, a CLOSED window still holds (proves the reset gate):
node ../../../scripts/cap-resume.mjs --run --now=2026-06-24T08:00:00Z   # 03:00 Chicago -> [hold] window closed
```

The proven-to-catch unit tests for the bounded gate, the cap window, and the caps live in
`app/src/__tests__/cap-resume.test.js` (run by `npm run verify` + CI).
