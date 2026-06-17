# Wake Orchestrator — in-app cockpit (control + observability)

**Date:** 2026-06-16 · **Layer 4 working artifact** · **Lane:** INFRA (behind the
July conference-critical lane). Follow-on to
[`2026-06-16-wake-handoff-bridge-research-build.md`](2026-06-16-wake-handoff-bridge-research-build.md)
(the engine, merged as #211).

> Darrell, 2026-06-16: *"inside poetech … the control + observability surface must
> live INSIDE the PoeTech app, not just as NAS scripts. The NAS runs the engine;
> the app is the cockpit."*

This is the "app is the primary artifact" rule (CLAUDE.md Layer 0) applied: the
wake/handoff engine ships on the NAS, but it is **operated and observed from
inside the app**, not from a terminal.

## What was built

### In-app cockpit (Governor-gated, on the Build board)
- `app/src/components/WakeOrchestrator.jsx` — the cockpit. Mounted in
  `BuildBoard.jsx` right after `QualityProof`, gated `{isGovernor && …}` (same gate
  and reasoning as OpsBoard / QualityProof — internal dev/ops state for the
  Governor). Surfaces, all from real state:
  - **Brakes & budget** — kill-switch, arm flag, wake-summon consent, budget cap
    (with a real %-used bar), concurrency lock — each a shared `KpiDot`.
  - **Controls** — Arm / Disarm / Kill-switch (panic) / Wake-arm / Wake-disarm,
    operable in-app. They POST to the NAS control endpoint, then **re-fetch** real
    state so the dots reflect the orchestrator, not the click (no fake success).
  - **Handoffs & scheduled wakes** — the handoff log (what the offline model left
    + the wake_at) with due/pending status.
  - **Recent vendor summons** — which vendor for which lane, with measured cost.
  - **Event reel** — the last 50 orchestrator events.
- `app/src/lib/wake-orchestrator.js` — the pure, tested shapers
  (`normalizeWakeState`, `wakeOrchestratorKpi`, `brakeRows`, `budgetStatus`,
  `wakeAtLabel`, `CONTROL_ACTIONS`).

### NAS engine feed + control (the cockpit's data source)
- `docs/00-foundations/n8n-workflows/wf-wake-orchestrator.json` — an n8n workflow
  with two same-origin endpoints:
  - **GET `/webhook/wake-orchestrator`** — reads the portable bundle's state files
    (KILL_SWITCH / ARMED / WAKE_SUMMON / lock / `.env` budgets / `spend-*.txt` /
    `state/handoffs/*.json` / `events/events.jsonl` / `charter.yml`) and serves the
    JSON the cockpit normalizes. Read-only, bearer-gated.
  - **POST `/webhook/wake-orchestrator-control`** — flips the brake state files for
    `arm`/`disarm`/`kill`/`unkill`/`wake-arm`/`wake-disarm`, **mirroring the shell
    scripts' preconditions** (arm refuses unless kill-switch clear + budgets set;
    wake-arm refuses unless armed too). Writes an audit event per action.
  - **Ships inert:** `active: false`. The bundle ships kill-switch ENGAGED.

## Reuse (Darrell's "reuse the Operations surface + role-gating primitives")
- **Role gate:** `isGovernor` prop derived from `isFamilyEmail` — the exact gate
  OpsBoard + QualityProof use.
- **Status palette:** `lib/kpi-status.js` + `KpiDot` — never re-picked colors.
- **Live NAS feed:** `lib/n8n-base.js` (`N8N_BASE` same-origin `/n8n` rewrite +
  `n8nAuthHeaders`) — the LlmHealth / WorkflowStatus pattern, including the honest
  "not connected" degrade.

## No fake green (Verification Doctrine, DR-0076 / P15-P16)
Every value traces to a real state file. When the feed isn't connected the cockpit
says so and shows how to connect it + the paste-ready arm step — it does **not**
paint a status. Controls never claim success on their own word; they re-read real
state after every action. The aggregate KPI reads **inert = good/safe**, **live
(armed + summon-consented) = attention** (autonomous spend worth watching),
**budget breach = problem**.

## Verification
- `app/src/__tests__/wake-orchestrator.test.js` — **16 proven-to-catch tests**:
  honest degrade on null/error; KPI inert→good, live→attention, breach→problem;
  per-brake green=safe / amber=gate-opening; measured budget %; control-confirm
  metadata (arming confirms, panic is instant).
- `npx vite build` — clean (the cockpit compiles into the bundle; integration
  proven). Lint clean. Full suite green except 3 unrelated failures in untracked
  `study-space.test.js` from a separate in-flight lane (not in this branch).
- **Live, signed-in-Governor + NAS-feed verification is the deploy-time step**
  (the surface is Governor-gated and needs the workflow imported + the bundle
  mounted) — the same "connect the feed" model as LlmHealth.

## Ships INERT — the arm step stays gated to Darrell
The cockpit lands inert: Governor-gated, the feed/control endpoints not yet
deployed, the bundle's kill-switch engaged, no `WAKE_SUMMON`. Arming is a
deliberate, confirmed, attended Tier C act — done either in-app (Governor, with a
confirm dialog) or via the paste-ready step:

```bash
cd /volume1/PoeTech/portable
sed -i 's/^BUDGET_PER_TASK_USD=.*/BUDGET_PER_TASK_USD=2/' .env
sed -i 's/^BUDGET_DAILY_USD=.*/BUDGET_DAILY_USD=25/' .env
./disarm.sh --off
./arm.sh
./wake-arm.sh
docker compose restart
```

## To light up the cockpit (deploy-time, on the NAS)
1. Deploy the portable bundle on the NAS (e.g. `/volume1/PoeTech/portable`) and
   mount it into the n8n container; set `WAKE_BUNDLE_DIR` if the path differs.
2. Import `wf-wake-orchestrator.json` and **activate** it.
3. The cockpit (Build board → Governor) then shows live state and the controls
   operate the real brakes.

## Open follow-ups
- Deploy + activate the workflow on the NAS (the "connect the feed" step).
- Have the scheduler invoke the host router on `wake_due` (the live Cage's job;
  attended for Tier-C turn-on).
- Optional: a compact wake-status chip on the Dispatch/Ops summary, reusing this
  feed.
