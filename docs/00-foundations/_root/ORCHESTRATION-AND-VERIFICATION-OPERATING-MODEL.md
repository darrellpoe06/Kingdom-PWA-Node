# Orchestration & Verification Operating Model

> **ESV — 1 Corinthians 14:40:** *"But all things should be done decently and in order."*

**Foundation doc, Layer 3 (reference). Declared by Darrell 2026-06-15.** This is the
durable, OWNED home for how PoeTech work gets built fast *and* right. It lives here
(repo) and is surfaced in the app — **locked, not in ephemeral AI memory** (which
empties). Memory is a fast cache only; this doc + the Decision Records + the app
surface are the truth.

---

## 1. Why this exists

Darrell, 2026-06-15: *"I want this all in the PoeTech app and outside to create it
so we have it locked and not just in your memory which we know is going to empty."*
And: *"Multi-lane one orchestrator — isn't that your superpower?"* And: *"I always
want the best, data-driven ways with verification and tests, then we don't have
issues."*

The operating model below was forged in a session where the agent **hand-cranked**
git worktrees and fought `node_modules` junctions one lane at a time — the opposite
of orchestration. This doc locks the better way so it is never re-discovered.

## 2. The model: parallel lanes + one orchestrator

- **Lanes** — each a unit of work in an **isolated worktree**, created and cleaned by
  the **agent-orchestration tooling** (the Workflow tool's parallel/pipeline fan-out;
  the Agent tool's `isolation: 'worktree'`). **Not** hand-cranked `git worktree` /
  `mklink` / junctions. Many small lanes run in parallel = fast.
- **One orchestrator** — directs, verifies, and **integrates lanes into `main` in
  order**. It does NOT hand-edit. It is the conductor (GOVERNANCE-EXECUTION-ADVISORY:
  the human governs, the orchestrator executes/integrates, the agent advises).
- **The orchestrator runs on the actual computer (CLI) watching work live AND in the
  cloud**, and is ultimately the **sovereign local LLM** — vendor LLMs are attached
  for capability, never required (DR-0062/0066).

## 3. Verification in EVERY lane and the orchestrator (sovereign)

- **`npm run verify`** (in `app/`) = `eslint + vitest run` — the full deterministic
  gate suite: `tenancy-guard`, `contrast-guard`, `fab-overlap-guard`, and every
  behavior/characterization test. **Pure Node, no AI.**
- **Each lane self-verifies** (`npm run verify` green) before it may report "done."
- **The orchestrator re-verifies** before integrating a lane into `main`.
- **Runnable by the local LLM, a human, or no LLM at all** — vendor-independent by
  construction. Claude is never in the trust path. New "looked-fine-but-wasn't"
  classes become new gates (DR-0076 Verification Doctrine; DR-0060 proven-to-catch).
- **Durable worktree env:** use `npm ci` once per long-lived worktree (real deps),
  **not** a `node_modules` junction (flaky — the root friction this model retired).

## 4. The data-driven choice: parallel vs. sequential

Parallelism is not free; the per-lane setup (worktree + deps + verify + integrate)
is overhead. **Choose by data**, not habit:

- **Sequential** (one durable verified worktree) wins for a SMALL batch of small
  tasks — the overhead exceeds the parallel savings.
- **Parallel lanes** (the Workflow superpower) win for MANY *independent, non-trivial*
  lanes. **Prove the process on one measured lane first** (confirm a lane runs
  `verify` end-to-end) before scaling to N.
- The deciding KPI ≈ `lane_count × lane_size × independence`. The orchestrator
  **learns the threshold from real runs** (DR-0063), it does not guess.

## 5. The KPI / model / token-aware orchestrator (build toward)

The local-LLM orchestrator should:

- know each model's **timelines + limitations** (speed, context, cost) and our **real
  internal throughput**; route work by capability (DR-0073);
- **hold or dispatch** work by **KPIs**, and **adapt from recorded experience** to
  produce the best outcomes (DR-0063 historical-decision framework / competence
  collection; DR-0068 autonomy trajectory);
- track **tokens remaining per vendor** (Gemini, Claude, and whatever else helps the
  stack/pipelines) and spend them where they most help — the Workflow tool's native
  token `budget` primitive is the seed of this;
- spawn a **team of agents** to orchestrate fast enough when needed.

## 6. Where it is LOCKED (repo + app, never only memory)

- **Repo (the spine + memory):** this doc, the Decision Records (DR-0076 Verification
  Doctrine; DR-0075 perpetual improvement; the forthcoming operating-model DR), the
  `verify` command, and the gate scripts. Version-controlled = never purged.
- **App (where the user lives — the planned counterpart):** a Governor-gated
  **System / Orchestration** surface showing the **live** verify/gate status, the
  active lanes, the KPIs, and the per-vendor token budgets — real data (DR-0061
  reality-trace), one source surfaced where the user is (DR-0065).
- **Memory is a cache only.** It speeds the agent up between context windows; it is
  never the system of record. If it and this doc disagree, this doc governs.

## 8. The delivery lane — work lands on green without a manual merge (DR-0103)

The lanes in §2 describe how work is *built*; this is how it *lands*. The default
state of the work is **motion**, not waiting on Darrell to push each step
(declared 2026-07-05: *"we don't move when I'm not pushing... remedy asap"*).

- **The lane:** `auto-open-pr.yml` opens a PR to `main` for a pushed
  `claude/*` / `feat|fix|merge|docs` branch and arms native auto-merge (squash);
  `ci.yml` runs the required gates on the commit; `auto-merge.yml` sweeps eligible
  open PRs (belt-and-suspenders). The PR **squash-merges the instant the gates
  pass** — lint + the full Vitest suite + tenancy/contrast/isolation guards + a
  real production build. Merge = deploy (DR-0054). No human click.
- **The `claude/*` fix (2026-07-05):** the lane originally filtered head branches
  to `^(feat|fix|merge|docs)/`, excluding the `claude/*` branches every remote/web
  session uses — so every agent PR was invisible to it and only a manual merge
  could land it. `claude/**` was added to the CI push trigger, the auto-open-PR
  trigger, and the auto-merge eligibility. That exclusion was the stall; keep it
  fixed.
- **The gate is the brake; `hold` is the governor's hand.** A red PR never merges
  (DR-0076). The `hold` label parks a PR out of the lane to soak or await Governor
  review (Tier B/C; RELEASE-TIERS). Reverting the three workflows is the
  off-switch. This is the integration gate deferring to verified truth — NOT the
  timer-driven, compute-spawning class the three-brakes rule governs.
- **Cadence + no idling:** watch in-flight work on a cadence matched to how fast
  it changes (minutes for a ~3-min CI, never a reflexive hour); between prompts,
  pull the next dated backlog item forward instead of parking on a timer.
- **In the app:** the OpsBoard renders the live lane (auto-merge armed / `hold`
  parked / land order / merged SHAs, read live from the repo) beside a short
  statement of this model — the model and its proof in one place (DR-0065).

## 9. Cross-references

DR-0076 (Verification Doctrine), DR-0075 (perpetual improvement), DR-0073
(capability-aware routing), DR-0063 (learn-from-experience), DR-0062/0066
(sovereign-first / local source of truth), DR-0065 (app is the primary artifact),
DR-0061 (surfaces are live views of real flow), GOVERNANCE-EXECUTION-ADVISORY,
`app/package.json` (`verify`), `scripts/tenancy-guard.mjs`,
`scripts/contrast-guard.mjs`, `scripts/fab-overlap-guard.mjs`.
