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
- **Cadence + no idling (DR-0255):** watch in-flight work EVENT-DRIVEN first
  (the PR webhook, site-health, review-watcher, OpsBoard — no cadence to guess);
  a timer is a short FALLBACK matched to the real change rate (~3–5 min for a
  ~3-min CI, re-armed short — never a reflexive hour; a 60-min timer for a 3-min
  CI is the defect). A longer heartbeat is only for a genuinely slow external
  wait, named. Between prompts, pull the next dated backlog item forward instead
  of parking on a timer. Every processing lane is watched (Ari + bots/LLMs),
  fail-visible on OpsBoard.
- **In the app:** the OpsBoard renders the live lane (auto-merge armed / `hold`
  parked / land order / merged SHAs, read live from the repo) beside a short
  statement of this model — the model and its proof in one place (DR-0065).

## 9. The proof ladder — what "not a fake test" means here (added 2026-09-10, DR-0347)

Darrell, 2026-09-10, after two findings in one hour (a database function silently rewritten; a Cloudflare error page printed as a message): *"we need to be creating tests that catch these failures... did we?"* and *"not fake test... also documenting the best workflows behavior."* The answer is a ladder, and every rung has a rule.

| Rung | What it proves | What it can NOT prove | The rule |
|---|---|---|---|
| **1. Pure unit** (node, no DOM) | The data and the arithmetic: a plan, a rule registry, a verse against the corpus | Anything that touches a screen or a database | Every figure a surface shows has a pure test that computes it from the real data file, never from a fixture that copies the answer |
| **2. Source pin** | A file still says what a decision says (a gate string, an import, an absent url, a NULL-safe guard) | Behaviour | A source pin names the exact line it guards and fails on the exact breaking edit (proven-to-catch, DR-0076 §3); it is never the only rung for behaviour |
| **3. Real component render** (jsdom, the seam mocked) | The surface the person meets: the tab exists, the click lands, the words are right, the write goes through the seam once with the right arguments | The database's answer | The mock is the seam's contract, captured (`sent.*`), never a stand-in for the policy; the mocked seam must have a rung-4 twin |
| **4. Database smoke on the real database** (`infra/supabase/tests/*-smoke.sql`, the rls-isolation matrix, rolled back) | The policy itself: who may write, who may read, what a trigger keeps, what an overlay denies | The app's wiring | Every migration that creates an instance-scoped table or redefines a shared function gets a leg or joins one; the smoke asserts the deny as well as the allow; it runs after every db-migrate, and a red leg on `main` is work now, never "pre-existing" |
| **5. Live verification** | What production actually holds: a policy's text (`pg_policies`), a deploy's head sha, the site's own answer (site-health) | Tomorrow | A claim of "applied", "deployed", "live" is a query or a run id in the record, never a sentence |

**The two failures of 2026-09-10, on the ladder.** The overlay drop lived at rung 4 (the smoke was red for four days) with no rung-2 gate for the class; `viewer-overlay-lineage.test.js` is that gate, proven against 0181's own body. The 502 page lived at rung 3 with no pin on the artifact; `tlc-error-text.test.js` pins the exact body from the screen and the seams' source. The TLC office tables lived at rungs 1–3 and 5 with no rung 4; `0189-tlc-office-smoke.sql` is the leg.

**The incident workflow that worked, written as the way (DR-0108):**
1. A red check on `main` is pulled as the next item the moment the current increment ships; it is never left as "flagged".
2. Trace on the real database first (`pg_policies`, `pg_proc`), then in the migrations in order; name the exact commit that broke it and the exact reason the gate did not catch it.
3. One PR carries the fix, the gate for the class (proven-to-catch against the real breaking body, not a synthetic one only), the matrix leg that proves it on the database, the DR, the LESSONS principle, and the ledger row.
4. The record states the live proof still pending, with a date, and the check-in is armed before the turn ends.

**The delivery behaviours that worked today, kept:** ship in increments of one directive each, roughly every forty minutes, each with its own DR or amendment, INDEX row and session-note section in the same commit; merge `main` by merge commit and resolve by taking the branch's files, never rewriting history; the PR body carries the proof and the honest limits; the deploy is proven by run id after every merge; a screenshot from Darrell is treated as a failing test on the real artifact and pinned before it is fixed.

## 10. Cross-references

DR-0076 (Verification Doctrine), DR-0075 (perpetual improvement), DR-0073
(capability-aware routing), DR-0063 (learn-from-experience), DR-0062/0066
(sovereign-first / local source of truth), DR-0065 (app is the primary artifact),
DR-0061 (surfaces are live views of real flow), GOVERNANCE-EXECUTION-ADVISORY,
`app/package.json` (`verify`), `scripts/tenancy-guard.mjs`,
`scripts/contrast-guard.mjs`, `scripts/fab-overlap-guard.mjs`.
