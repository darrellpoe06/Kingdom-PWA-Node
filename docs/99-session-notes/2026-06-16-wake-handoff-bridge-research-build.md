# Wake / Handoff Bridge — research-review + build note

**Date:** 2026-06-16 · **Layer 4 working artifact** · **Lane:** INFRA (behind the
July conference-critical lane — this did not touch conference work).

> Darrell's design (2026-06-16): *the local AI reads Claude's LAST offline message
> (which states the time it'll be back up + what to resume) and SCHEDULES A
> WAKEUP, and the local LLM also routes work to Gemini (and other vendors) — all
> orchestrated by the local LLM.* Spec + build the bridge version.

## 1. What this is

The bridge that turns "a vendor session ended, the work just stops" into "the
NAS wakes the work back up." A vendor (Claude/Gemini), before going offline,
emits a **structured handoff** stating *when* to wake, *what* to resume, and
*where* the durable state lives. The always-on NAS scheduler reads it, schedules
the wake, and at wake-time summons the right vendor — tiered, cheapest-capable-
first — with the Charter + lane/task + state pointer. Humans are freed to govern;
the system keeps the work moving (Charter §0 prime directive).

## 2. Research grounding (what it builds on)

- **PoeTech Orchestrator Charter** (`infra/ai-orchestrator/portable/charter/CHARTER.md`,
  §3 "Sovereignty & the bridge"). The Charter *already* states the orchestrator
  "wakes, starts, and instructs vendor models when the need is real, and it
  restarts a vendor session (including Claude) after that session has gone
  offline." This build is the **implementation of that existing policy**, not a
  new authority. Routing is tiered cheapest-first: local → Gemini (grounded) →
  Claude (code/heavy).
- **Portable orchestrator bundle** (`infra/ai-orchestrator/portable/`, session
  `local_d3a4a2c1`, PR #169/#174). The inert, copy-paste, three-brakes skeleton.
  The wake scheduler is added as a new bundle half (`orchestrator/lib/wake.sh`)
  that obeys the same brakes; the manifest freshness gate covers the new files.
- **Tiered-routing strategy** (`2026-06-13-vendor-llm-routing-strategy.md`,
  DR-0056 tiered orchestrator, DR-0073 capability-aware routing). The affinity
  map (code→Claude, research/multimodal/longcontext→Gemini), the vendor-first
  default while local is a small CPU model, and the sovereignty gate (private →
  local-only, every mode) are reused verbatim. Mirrors `scripts/orchestrator-v0.mjs`.
- **DR-0071** (braked self-activation from real events). The wake fires off a
  **real handoff event**, bounded by the three brakes — *not* a bare timer loop.
  This is the precedent that makes scheduled wake legitimate rather than a
  June-6-class runaway.
- **Three-brakes rule** (`CLAUDE.md`, LESSONS-LEARNED 2026-06-06 / P10-P12).
  Budget + concurrency lock + kill-switch, all present or inert.
- **Gemini API** (Google AI `generativelanguage.googleapis.com/v1beta`,
  `models/{model}:generateContent`). The router reads `usageMetadata`
  (`promptTokenCount` / `candidatesTokenCount`) to record **measured** spend, not
  an estimate (Verification Doctrine). Endpoint + token fields match the existing
  `orchestrator-v0.mjs` Gemini call.

## 3. What was built

### 3.1 The handoff / wake contract
`infra/ai-orchestrator/portable/handoff/` — `HANDOFF-CONTRACT.md` (spec),
`schema.json` (JSON Schema draft-07), `example.handoff.json`. Fields:
`{ v, id, issued_at, issued_by, wake_at, lane, task, work_type, private,
state_pointer{kind,ref,note}, suggested_vendor, offline_message, budget_hint_usd }`.
`wake_at` supports `at` (absolute UTC) / `after_seconds` / `condition` (pluggable
predicate) + a `not_before` floor. Handoffs are written to the bundle's runtime
inbox `state/handoffs/<id>.json` (gitignored).

### 3.2 The always-on scheduler (NAS, GPU-free, in the bundle)
`orchestrator/lib/wake.sh` — POSIX sh, dependency-free, runs in the capped
1-CPU supervisor every tick. Scans the inbox, decides due/pending/deferred via
**lexicographic ISO comparison** (no `date -d`; busybox-safe), logs one event per
handoff. It **never** summons — the self-contained bundle carries no vendor stack.
Wired into `entrypoint.sh`'s supervisor loop.

### 3.3 The multi-vendor router (host-side, real, behind the Cage)
`scripts/wake-router.mjs` + `scripts/lib/handoff.mjs` (pure logic) +
`scripts/lib/vendors.mjs` (pluggable vendor registry: local/Claude/Gemini, with a
price table for measured cost). The router validates the handoff, enforces the
brakes against the bundle's state files, computes due, picks the tiered vendor,
and — only when fully armed + due — summons with the Charter + lane/task + state
pointer, recording real spend. **Default is plan-only** (logs intent, calls
nothing). Pluggable: a new vendor is one entry in `VENDORS` + one price row.

### 3.4 Brakes + ship-inert
A summon fires only when **every** brake is GO: kill-switch clear (`state/KILL_SWITCH`
ships engaged), ARM flag set, budget configured + under the daily ceiling, single-
instance lock, **and** a dedicated **`WAKE_SUMMON`** consent flag (ships absent).
The fourth gate is defense in depth: an armed orchestrator still won't summon
vendors on wake without explicit summon-consent — arming standby and consenting
to autonomous vendor-summon are separate, deliberate, attended acts. Controls:
`wake-arm.sh` / `wake-disarm.sh` (consent), reusing `arm.sh` / `disarm.sh` /
`disarm.sh --on` (panic stop).

## 4. Verification (Verification Doctrine — evidence, not claims)

- **Unit logic, proven-to-catch:** `app/src/__tests__/wake-handoff.test.js` — 25
  tests. Validation rejects each dropped required field; two wake-drivers is
  invalid; an unknown condition is **not** due (never invents a wake); private →
  local-only; affinity map (code→Claude, research→Gemini); measured cost from
  token usage; unknown model flagged not fabricated. The schema `required` list
  is cross-checked against the runtime validator.
- **Freshness gate:** `portable-bundle-fresh.test.js` — 7 tests green; manifest
  re-stamped to cover the new bundle files; `charter.yml` still generates byte-
  identical from `CHARTER.md` (the §3 wake-bridge prose is documentation, not
  parsed config).
- **Behavioral, end-to-end (inert):** ran `wake-router.mjs --latest` against the
  shipped example. Clock before `wake_at` → `wake_pending`; clock after → DUE but
  `wake_plan` (plan-only, no call); `--summon` with brakes HOLD → `wake_inert`,
  **no vendor called**. The ships-inert guarantee is demonstrated, not asserted.
- Full `npm run verify`: the wake-bridge + freshness suites pass. (3 unrelated
  failures exist in untracked `study-space.test.js` from a separate in-flight
  lane; not part of this branch's committed set.)

## 5. The arm step (gated to Darrell — Tier C, attended, never while traveling)

From the deployed bundle dir on the NAS (inside a repo checkout):

```bash
cd /volume1/PoeTech/portable
sed -i 's/^BUDGET_PER_TASK_USD=.*/BUDGET_PER_TASK_USD=2/' .env
sed -i 's/^BUDGET_DAILY_USD=.*/BUDGET_DAILY_USD=25/' .env
./disarm.sh --off          # disengage kill-switch
./arm.sh                   # arm standby
./wake-arm.sh              # consent to vendor-summon on wake (the 4th gate)
docker compose restart
node ../../../scripts/wake-router.mjs --latest --summon
```

Off again: `./wake-disarm.sh` (scheduling continues). Panic stop: `./disarm.sh --on`.

## 6. Open follow-ups

- Wire the scheduler to invoke the host router automatically on `wake_due` (today
  the router is run on demand / by a host cron that the Cage governs). That step
  is the live Cage's job and stays attended for Tier-C turn-on.
- `condition` predicates: implement real checkers (CI-green, file-exists) in the
  router's `conditionChecker`; today an unknown condition is honestly not-due.
- Outcome-judge + affinity tuning loop (strategy §3) once the audit ledger has
  enough routed outcomes to learn from.
- Surface the wake reel in-app (the Build/Ops board) reading `events.jsonl`, per
  "the app is the primary artifact."
