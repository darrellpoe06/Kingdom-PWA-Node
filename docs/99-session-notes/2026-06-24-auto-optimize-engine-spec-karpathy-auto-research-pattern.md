# Spec — Sovereign In-App AUTO-OPTIMIZE Engine (Karpathy "Auto-Research" Pattern)

**Date:** 2026-06-24
**Author:** Claude (research-review + spec on Darrell's commission, per `feedback-research-first` + Verification Doctrine DR-0076)
**Status:** SPEC. **Design-only. Nothing built, nothing armed, no loop running, no model pulled.** The engine described here ships **INERT** by construction (kill-switch engaged, no ARM flag, budgets unset) and is armed per-target only on Darrell's explicit go.
**Triggered by:** Darrell — adopt Karpathy's "Auto-Research" pattern (an autonomous loop that iterates an *asset* against a *locked objective score* it cannot tamper with) as a sovereign in-app **AUTO-OPTIMIZE** engine running on the local GPU box; identify and prioritize the first scorable targets; lock the guardrails.
**Pairs with / extends:** `CLAUDE.md` "Autonomous Automation Requires Three Brakes" (the law) · `infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh` (the brakes) · the Cage (`infra/ai-orchestrator/`, `ARCHITECTURE-PRINCIPLES-COMPOSABLE-SPINE.md`) · the wake/handoff bridge (`HANDOFF-CONTRACT.md`, `scripts/wake-router.mjs`, `scripts/lib/vendors.mjs`) · `MODEL-LAB-SPEC.md` · `PERFORMANCE-REVIEW-AND-ROADMAP.md` · `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` · `QUALITY-OF-LIFE-AS-NORTH-STAR.md`. Lanes: `local_e84c7702` (modular cutover), `local_54684623` + `local_3a58c309` (revenue/outreach), `local_00897763` (Model Lab), `success-metric-247-local-wakes-vendor`, `project-workflow-module-library`.

---

## TL;DR (the honest answer)

- **The pattern is sound and we already own every primitive it needs.** Karpathy's Auto-Research loop = three pieces: a **LOCKED instruction/objective**, the **ASSET** being optimized, and a **LOCKED SCORER** (an objective number the optimizer can run but cannot edit). The AI mutates the asset, the scorer scores it, better-keeps-worse-discards, repeat — thousands of cheap iterations. We already have the brakes (`brakes.sh`), the Cage, the event reel, and a local-LLM call layer (`vendors.mjs` → Ollama on the GPU box). AUTO-OPTIMIZE is a new **lane** over those primitives, not a new stack.
- **The eligibility gate is the whole game — and it disqualifies most candidates.** A target is eligible **only** if it has (a) an **objective quantifiable score**, (b) a **fast feedback loop** (minutes/hours, not days), and (c) **AI write-access to the asset**. Applied ruthlessly, only **one** of Darrell's four candidates is a clean fast-loop fit today.
- **Prioritized verdict:**
  1. **APP PERF / modular cutover — SHIP FIRST.** ✅ all three gates. Score = gzip KB + cold-load total, measured at every `vite build`; loop = minutes; asset = build config + chunk-split + lazy boundaries. This is the Shopify-perf analog. **First armed target.**
  2. **PROMPT optimization against a labeled eval set** (the *real* fast-loop slice of "model/prompt routing") — ✅ eligible *where a labeled set exists* (router classification accuracy, clinical-tag/structured-output validity rate). Distinct from Model Lab's *human-vote* model ranking, which is human-paced and **not** a fast loop.
  3. **OUTREACH copy — candidate-generation half only**, behind a **proxy scorer** + **human-approve-outbound**. The *real* score (open/reply/conversion) takes days → **not** a closed fast loop. The engine ranks drafts offline; the human sends; real outcomes feed back slowly as analytics.
  4. **LESSONS — NOT eligible for the autonomous loop.** The completion/quiz score exists, but the feedback loop is *weeks* (real learners), and optimizing content toward a quiz score is teaching-to-the-test that brushes doctrinal material. Keep it human-reviewed analytics.
- **The bright line, named explicitly:** AUTO-OPTIMIZE **never** points at subjective or doctrinal content — Scripture, theology, the Word, worship, pastoral copy, anything where "better" is a human or Bishop judgment rather than a number. Objective-score-only. This is a hard gate in the manifest, not a guideline.
- **Anti-tamper is the load-bearing wall.** The scorer is hash-pinned and write-protected; the optimizer gets read-only access to the scorer and the score, write-access only to a *scratch copy* of the asset. The scorer encodes the **hard constraints** (tests green, behavior pinned) so the optimizer can't "win" by deleting features (the Goodhart failure). A candidate that breaks a constraint scores as invalid and is discarded.
- **Sovereign, braked, governed.** Loop runs local (Ollama on the 2x4070 / future GPU box). Three brakes + ARM flag + per-target arm. Ships inert. Nothing ships *out* (a live perf change, a sent email) without the existing per-domain approval gate. LLMs iterate; **humans govern.**

---

## 1. The pattern (Karpathy "Auto-Research"), stated precisely

An autonomous optimization loop with a **deliberate separation of powers** between three artifacts:

| Artifact | Mutable? | Who touches it | Role |
|---|---|---|---|
| **LOCKED INSTRUCTION / OBJECTIVE** | **No** (locked for the run) | Human authors it; optimizer reads it | Declares the goal and the direction ("minimize gzip KB subject to: all tests green, no public API removed"). |
| **THE ASSET** | **Yes** | Optimizer writes a *scratch copy* | The thing being improved (build config, prompt template, draft copy). |
| **LOCKED SCORER** | **No** (hash-pinned) | Optimizer *runs* it, never edits it | Emits one objective number + a pass/fail on the hard constraints. The single source of truth for "better." |

**The loop:**

```
load best-asset + best-score (incumbent)
repeat until a brake stops it:
    candidate  = LLM.mutate(asset, instruction, best-score, recent-history)   # local model, GPU box
    apply candidate -> scratch worktree (asset writable_globs only)
    verify scorer hash unchanged (abort+kill if touched)
    result = run LOCKED SCORER on scratch                                     # clean subprocess
    if result.constraints_failed:  discard (score := WORST)                   # anti-Goodhart
    elif result.score better than best-score:  best := candidate; log "accept"
    else:                                       discard;          log "reject"
    record event to reel  (iteration, score, delta, cost, brake-status)
emit: ranked candidates + score-over-time curve + winning diff  ->  Governor review
```

**Why the locks matter (the failure they prevent):** if the optimizer can edit the scorer, it optimizes the *scorer* instead of the asset (declares victory by changing the ruler). If the scorer doesn't encode the constraints, the optimizer games the metric (shrinks the bundle by deleting a feature; "passes" a quiz-score by trivializing the lesson). Both are **Goodhart's law** — "when a measure becomes a target, it ceases to be a good measure." The locked, constraint-bearing, hash-pinned scorer is the structural answer. This is the same posture as DR-0076's **proven-to-catch** gates: the number must *mean* something, and a green result must be earned.

---

## 2. THE MANDATORY ELIGIBILITY GATE (applied, not assumed)

A target is admitted to AUTO-OPTIMIZE **only if all three are true.** This is enforced in the manifest (`eligibility` block) and re-checked at arm-time; a target that can't fill all three fields cannot be armed.

| Gate | Test | Why it's hard-required |
|---|---|---|
| **(a) Objective score** | A script emits a single number from the asset, deterministically. No human-in-the-loop to produce the number. | Without a number there is nothing to optimize against — only opinion, which the loop can't iterate on and which invites doctrinal/subjective drift. |
| **(b) Fast feedback loop** | One score takes **minutes to low hours**, repeatable thousands of times within a budget. | The loop's value is *many cheap iterations*. A score that takes days (real learners, real email opens) makes closed-loop optimization impossible — at most you get one data point per cycle. |
| **(c) AI write-access to the asset** | The optimizer can mutate the asset in a scratch copy and the change is meaningful to the score. | If the AI can't change the thing, there's no asset to optimize. |

**Applying it to the four candidates (the honest table):**

| Candidate | (a) Objective score | (b) Fast loop | (c) AI access | Verdict |
|---|---|---|---|---|
| **1. App perf / modular** | ✅ gzip KB + cold-load total, measured every `vite build` | ✅ a build+test is minutes | ✅ build config, chunk-split, lazy boundaries are code | **ELIGIBLE — ship first** |
| **2a. Prompt vs labeled set** | ✅ accuracy / validity-rate on a fixed labeled eval set | ✅ a local-model eval pass is minutes | ✅ the prompt template is the asset | **ELIGIBLE — where a labeled set exists** |
| **2b. Model ranking (Model Lab)** | ⚠️ Elo/mean-rank, but from **human votes** | ❌ human-vote-paced (hours–days per matchup) | ✅ (model choice) | **NOT a fast loop** — keep as human-paced Model Lab |
| **3. Outreach copy** | ⚠️ real score (open/reply/conv) is objective but **slow**; a *proxy* score is fast | ❌ real outcomes take days; ✅ only the proxy is fast | ✅ subject/copy is the asset, but **send is gated** | **PARTIAL** — proxy-scored candidate generation only, human-approve-outbound |
| **4. Lessons** | ✅ completion/quiz score exists | ❌ real learners = weeks | ✅ content is editable | **NOT eligible** — slow loop + teach-to-test + doctrinal proximity |

This is the gate doing its job: of four candidates, **one** is a clean fast-loop fit, **one** is eligible only on a labeled slice, **one** is eligible only for an offline proxy half, and **one** is excluded. That selectivity is the point — AUTO-OPTIMIZE is a scalpel, not a paintbrush.

---

## 3. Engine design (locked instruction / asset / locked scorer + local-LLM loop)

### 3.1 The Target Manifest (the locked contract for a run)

One JSON per target, source-of-truth in the repo at `infra/auto-optimize/targets/<id>.json`, mirrored to the NAS bind mount for the runner. Schema:

```jsonc
{
  "id": "perf-bundle-gzip",
  "title": "Minimize PWA cold-load gzip without behavior regression",
  "instruction_path": "infra/auto-optimize/targets/perf-bundle-gzip.INSTRUCTION.md", // LOCKED
  "asset": {
    "repo_path": "app/",
    "writable_globs": ["app/vite.config.js", "app/src/main.jsx", "app/src/**/lazy/**"]
    // the optimizer may ONLY write these; everything else is read-only to it
  },
  "scorer": {
    "cmd": "infra/auto-optimize/scorers/perf-bundle.sh",   // LOCKED, hash-pinned
    "hash": "sha256:<pinned>",
    "direction": "minimize",
    "metric": "cold_load_gzip_kb",
    "constraints": ["vitest_green", "build_ok", "lint_ok"]   // fail => candidate invalid
  },
  "eligibility": { "objective_score": true, "loop_seconds_p50": 240, "ai_write_access": true },
  "brakes": { "max_iterations": 200, "budget_usd": 0, "wallclock_minutes": 120, "min_delta_to_accept_kb": 1 },
  "ships_out": "proposal-only",            // perf winner = a PR candidate a human reviews
  "armed": false                            // ships INERT; Darrell flips this per target
}
```

The `instruction_path` and `scorer.cmd` are **locked for the duration of a run**: the runner records their hashes at start and aborts if either changes mid-run. The optimizer process never has write permission to either path.

### 3.2 The locked scorer (objective metric + anti-Goodhart constraints)

A scorer is a standalone script that takes a scratch worktree and prints a JSON line: `{ "score": <number>, "constraints_failed": [...], "detail": {...} }`. **The constraints are inside the scorer**, not advisory — a candidate that shrinks the bundle but reds a test returns `constraints_failed: ["vitest_green"]` and is scored `WORST` (rejected). That is what stops the optimizer from "winning" by deleting features.

For the perf target the scorer is essentially: `npm run build` (parse gzip KB of the entry + monolith + cold-load total from the build manifest) **AND** `npm run -s test` (must be green) **AND** lint. Score = cold-load gzip KB; invalid unless all three constraints pass. This reuses the exact numbers `PERFORMANCE-REVIEW-AND-ROADMAP.md` already measures (entry 50 KB gz, supabase 55 KB gz, monolith 302 KB gz, cold-load ~432 KB gz baseline) — the optimizer is racing a real, already-instrumented number.

**Anti-tamper, concretely:**
- Scorer file is `chmod a-w` on the runner and hash-pinned in the manifest; verified before **and after** every iteration.
- Optimizer runs as a separate OS user/process with write access scoped to the scratch worktree's `writable_globs` only (enforced by running each candidate in its own `git worktree`, the pattern already used for parallel-safe writes, e.g. `kpn-wt-*`).
- The scorer runs in a **clean subprocess** with no inherited file handles to the optimizer's context.
- If any guard trips (scorer hash changed, write outside `writable_globs`, scorer process killed), the run **engages the kill-switch and pauses** — it never silently continues.

### 3.3 The local-LLM loop (sovereign, on the GPU box)

The mutation step calls a **local model** through the existing `scripts/lib/vendors.mjs` → `callOllama` path (`VENDORS.local`, `OLLAMA_URL`, default coder model per `LOCAL-LLM-MODEL-PICKS.md`). On the 2x4070 the coder candidate is `Qwen3.6-27B` / `GLM-4.7-Flash` (per the open-model landscape review); on the future RTX PRO 6000, the heavier coders. **Cost per local iteration = $0** (`PRICE_PER_MTOK.local = { in: 0, out: 0 }`), which is what makes "thousands of cheap iterations" affordable and *sovereign* — no data leaves, no per-token vendor bill. The budget brake still applies (wall-clock + iteration ceilings) even at $0 token cost, because compute and electricity are real.

The loop runs as a **new lane in the portable orchestrator** — it sits behind `all_brakes_go()` exactly like the wake-router does, emits to the same event reel (`events.jsonl` → NAS `_reel.jsonl`), and is single-flighted by the same `mkdir` lock. It is *not* timer-driven: a run is **started by an explicit arm** (Darrell flips `armed` + sets a budget) or by a handoff event — never by a bare clock, per DR-0071 and the three-brakes law.

### 3.4 Observability (every run, no silent caps)

Each iteration appends one event: `{ ts, lane:"auto-optimize", target, iter, score, best, delta, accepted, cost_usd, brake_status }`. The in-app surface plots **score-over-time** (the curve flattening = converged), shows the current incumbent diff, the accept/reject ratio, and the brake panel (armed? budget left? kill-switch?). If a run hits a ceiling it logs *why it stopped* (budget / max-iter / wall-clock / plateau) — a truncated search is never dressed as "done," per DR-0076.

---

## 4. Where it runs (sovereign mesh)

| Concern | Home | Note |
|---|---|---|
| **Optimizer model** | GPU box (2x4070 now, RTX PRO 6000 later), Ollama | sovereign; `$0`/token; data never leaves |
| **Scorer execution** | a build runner (NAS container or CI runner) | clean subprocess; reproducible; hash-pinned |
| **Manifests + scorers** | **repo** (source of truth) + NAS bind-mount mirror | versioned, reviewable, locked per run |
| **Event reel + candidate store** | NAS `/data/poetech-briefing/` bind mount | same dispatch-status convention; LAN/Tailscale-only |
| **Arm / review surface** | **in-app**, Governor-gated `AUTO-OPTIMIZE` tab | per "The App Is the Primary Artifact"; where Darrell arms a target + approves a winner |

The in-app tab is the human end: it reads the reel and the candidate store (real data — a real run, a real score, a real diff; no painted numbers, per the Reality-Trace rule), and it's where arming and approval happen. The repo holds the spine (manifests, locked scorers); the app surfaces it. Both, where each belongs.

---

## 5. Prioritized scorable targets + their metrics

### Target 1 — APP PERF / modular cutover  ·  **SHIP FIRST**  ·  lane `local_e84c7702`
- **Asset:** `app/vite.config.js`, lazy boundaries (`main.jsx`, `React.lazy` split points), chunk-split strategy. Builds on `project_bundle_lazy_load` (PR #282) and the `PERFORMANCE-REVIEW-AND-ROADMAP.md` fast-wins (defer Leaflet, vendor split, finish monolith trim, drop recharts).
- **Score (minimize):** cold-load **gzip KB** (entry + supabase + monolith), and a derived **load-time ms** estimate. Baseline already measured: ~432 KB gz cold-load; monolith 302 KB gz.
- **Constraints (hard):** `vitest` green, `npm run build` ok (the CI build gate `project_ci_no_vite_build_gap` already fails on missing exports), lint ok, **no public route/feature removed** (a snapshot of nav ids must be unchanged — stops "shrink by deletion").
- **Ships out:** **proposal-only.** The winning diff is a candidate PR a human reviews and merges through the normal lane — AUTO-OPTIMIZE proposes, it does not push to main.
- **Why first:** the only candidate that passes all three gates cleanly today, the score is already instrumented, and the blast radius of a wrong answer is caught by the constraints (tests/build). This is the Shopify-perf use case, sovereign.

### Target 2 — PROMPT optimization vs a labeled eval set  ·  lane `local_00897763`
- **Asset:** a **prompt template** (e.g., the router/classifier prompt, or a clinical-tag / structured-output extraction prompt).
- **Score (maximize):** **accuracy** (router classification) or **validity rate** (fraction of outputs that parse against the required schema) on a **fixed, human-curated labeled set**. Objective and fast (a local-model eval pass over N labeled items is minutes).
- **Constraints:** output must parse; latency under a ceiling (so it doesn't "win" by going slower/larger).
- **Distinct from Model Lab:** Model Lab ranks *models* by *human vote* (human-paced — keep it as the human surface in `MODEL-LAB-SPEC.md`). AUTO-OPTIMIZE here optimizes the *prompt* against an *objective labeled metric* — the genuinely fast, scorable slice. **Prereq:** a labeled set must exist; if one doesn't yet for a given task, that's the first build, not the loop.
- **Ships out:** proposal-only (a prompt change is reviewed before it becomes the default).

### Target 3 — OUTREACH copy (candidate generation only)  ·  lanes `local_54684623` + `local_3a58c309`
- **Asset:** subject lines / opening angles / offer framing for TLC + GTM outreach (built over `inquiries-sync.js`'s lead pipeline).
- **The honest split:**
  - **Fast, objective PROXY score (eligible):** a deterministic rubric — spam-trigger score, readability grade, length, banned-claim check, and a *local-LLM rubric pass* scored against a fixed checklist — produces ranked draft candidates in minutes. This half fits the loop.
  - **Real score (NOT a fast loop):** open / reply / conversion %, computable from `inquiries` state transitions (contacted/new, scheduled/contacted by source) but only after **days** of real outcomes. This is **analytics, not closed-loop** — it feeds back slowly to retune the proxy rubric, with a human in the loop.
- **Ships out:** **`human-approve-outbound` — hard gate.** The engine never sends. It ranks drafts; Darrell/the revenue team pick and send. Outbound to real people is a bright line that respects the existing per-domain approval. (Also: TLC is HIPAA-walled — no PHI ever touches the optimizer; the asset is generic marketing copy only.)
- **Verdict:** eligible for the **offline candidate-generation half** behind a proxy scorer + outbound approval; the live-outcome half stays human-governed analytics.

### Target 4 — LESSONS  ·  **NOT ELIGIBLE for the autonomous loop**
- The score exists (`learn-framework.js` `courseAssessment` → completion %, quiz pass %, engagement weights), **but**: (b) the feedback loop is **weeks** (real learners), and optimizing lesson *content* toward a *quiz score* is **teaching-to-the-test** — a textbook Goodhart failure — and Learn content sits adjacent to **doctrinal/Scripture material**, which is a hard exclusion (Section 6).
- **Disposition:** keep the completion/engagement numbers as a **human-reviewed Governor analytics** surface (flag stalling age-band cohorts, suggest pacing) — *not* an autonomous optimizer. If a *non-doctrinal, fast-scorable* sub-asset ever emerges (e.g., quiz-item difficulty calibration against item-response data), it can be re-evaluated against the gate on its own merits. Re-review: revisit only if such an asset is identified.

---

## 6. BINDING GUARDRAILS

### 6.1 The bright line — never subjective or doctrinal  (hard exclusion)
AUTO-OPTIMIZE is **objective-score-only.** It is **never** pointed at:
- Scripture, theology, the Word, worship content, sermon/teaching substance.
- Pastoral, counseling, or relational copy where tone is a human judgment.
- Anything where "better" is a **Bishop / family / human** call rather than a number.

This is enforced in the manifest: a target whose `scorer` cannot produce a deterministic number **without a human judgment** fails eligibility gate (a) and cannot be armed. "Optimize the lesson" is rejected at the gate; "minimize the bundle" passes. The reason is doctrinal *and* technical: a number standing in for a human/Bishop judgment is exactly the Goodhart trap, and the Worldview is the source of those answers — not a scorer. Stated plainly so no future session re-opens it.

### 6.2 The three brakes + arm  (the law, reused not reinvented)
Per `CLAUDE.md` "Autonomous Automation Requires Three Brakes" and `brakes.sh` (`all_brakes_go()`):
1. **Budget** — per-run iteration ceiling + wall-clock ceiling + (for any non-local escalation) a `$` ceiling. A run that hits a ceiling **terminates itself**. Unset budget = missing brake = inert (`budget_ok` returns false when ceilings are 0).
2. **Concurrency lock** — single-flight via the existing `mkdir` lock; a second start **skips**, never stacks.
3. **Kill-switch** — `KILL_SWITCH` file present = **INERT**, engaged by default; ships present. A guard trip (tamper, constraint-impossible, repeated failure) **engages it and pauses** — never auto-continues.
4. **ARM flag** — absent by default. Autonomy stays OFF until Darrell flips `armed` **per target**. **This class is Tier C, never Tier A** — sovereignty of location does not bound blast radius. Ships inert; armed only with someone watching.

### 6.3 Anti-tamper (the locked scorer)
Scorer hash-pinned + write-protected + re-verified each iteration; optimizer write-scoped to the scratch worktree's `writable_globs`; scorer runs in a clean subprocess; constraints live *inside* the scorer. Any breach → kill-switch + pause. (Section 3.2.)

### 6.4 Nothing ships out without the per-domain gate
A winning candidate is a **proposal**, not an action. Perf winner = a PR a human merges. Prompt winner = a default a human promotes. Outreach winner = a draft a human **sends** (`human-approve-outbound`). The optimizer's authority ends at "here is the ranked, scored candidate." Humans govern the bright lines; the engine advises with receipts (DR-0076 §9).

### 6.5 Sovereign + verified
Local model, `$0`/token, data never leaves the mesh (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`). Every claim the engine makes is backed by a real scorer run on the real artifact (DR-0076 §1/§4 — measure, don't claim). The score-over-time curve and the diff are the evidence.

---

## 7. Options / trade-offs / recommendation

**A. Pure local loop (recommended).** Optimizer = Ollama on the GPU box; scorer = local build runner; `$0`/token. *Trade-off:* local coder models are good-not-frontier, so convergence may need more iterations than a frontier model would. *Why recommended:* sovereign, free per-iteration (so "more iterations" is cheap), no data egress, and the constraints catch any bad candidate regardless of model strength.

**B. Local loop + optional vendor escalation for the hardest mutations.** Same as A, but a stuck run may escalate a *single* mutation to a cloud coder via `vendors.mjs` under a strict `$` budget. *Trade-off:* data egress + cost on the escalated call; only ever for **non-sensitive** assets (perf config — never clinical/family/church). *Use:* keep as a future, budget-gated option; **off by default.**

**C. Vendor-first loop.** Rejected — violates sovereignty, costs real money per iteration (kills "thousands of cheap iterations"), and isn't needed when the constraint-bearing scorer guarantees correctness regardless of optimizer strength.

**Recommendation: A now** (pure local, perf target, ships inert, armed on Darrell's go), with **B reserved** as a budget-gated escalation for non-sensitive targets only once A is proven.

---

## 8. Cost

| Item | Cost |
|---|---|
| Per local iteration (tokens) | **$0** (`PRICE_PER_MTOK.local = 0/0`) |
| Per run (compute/electricity) | real but small; bounded by the wall-clock + iteration brakes |
| Scorer run (build+test) | existing CI/build cost; minutes |
| Vendor escalation (option B, off by default) | per `vendors.mjs` pricing, hard-capped by budget brake; non-sensitive assets only |
| New infra | **none** — reuses brakes, Cage, event reel, vendors layer, worktree isolation |

The sovereign-local design is what makes the economics work: the loop's whole premise (many cheap iterations) is only affordable at `$0`/token, which only a local model gives.

---

## 9. MVP / pragmatism — what actually ships

**MVP-now (inert, smallest viable):**
1. `infra/auto-optimize/targets/perf-bundle-gzip.json` + `.INSTRUCTION.md` (locked) + `scorers/perf-bundle.sh` (build+test+measure, hash-pinned, constraints inside).
2. A thin loop runner as a new lane behind `all_brakes_go()`, reusing `vendors.mjs` `callOllama` and `git worktree` isolation, emitting to the existing reel.
3. A read-only in-app `AUTO-OPTIMIZE` tab (Governor-gated): score-over-time curve, incumbent diff, brake panel, arm toggle (disabled until Darrell). **Reads real reel data only.**
4. Ships **inert** — kill-switch engaged, no ARM, budget unset. Proves the *plumbing* (loop scores, logs, surfaces) with zero autonomy.

**Then:** arm the perf target with a small budget under watch → confirm it produces a *real* winning diff that passes constraints → review + merge that diff through the normal lane. Only after perf is proven do targets 2/3 get built (each needs its own scorer + labeled set / proxy rubric first).

**Not in MVP:** any live auto-merge of a winner; outreach send; vendor escalation; lessons. Those are later, gated, and per-target.

---

## 10. TO CONFIRM (open questions for Darrell)

- **Perf scorer "no-deletion" guard:** is "nav-id snapshot unchanged" the right behavior-pin, or do we want a fuller route/feature contract? (Stops shrink-by-deletion; want to confirm the contract surface.)
- **GPU box readiness:** the loop assumes Ollama reachable on the GPU box. On the 2x4070 today vs the future RTX box — start MVP on whichever is warm; confirm which.
- **Arm authority:** arming is reserved to Darrell (like cap-resume). Confirm no one else can flip `armed` — propose Governor-gated + a second confirm.
- **Labeled set for target 2:** which task gets the first labeled eval set (router classification looks easiest to label)?

---

## Verdict

The Auto-Research pattern maps cleanly onto primitives we already own; the engine is a **new lane**, not a new stack. The eligibility gate, applied honestly, yields **one** ship-first target (app perf), **one** labeled-slice target (prompts), **one** proxy-half target (outreach drafts), and **one** exclusion (lessons) — plus a hard doctrinal bright line. Built behind the three brakes, locked-scorer anti-tamper, per-target arming, and per-domain outbound approval, it is sovereign, governed, and verifiable. Ship the plumbing inert; arm perf first, under watch.
