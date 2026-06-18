# Hybrid Modular — Implementation & Orchestration Plan

**Status:** PLAN ONLY. No monolith decomposition is executed by this document. Execution waits for Darrell's go after he reviews, and (per the ADR) for the July conference to ship.
**Date:** 2026-06-17
**Decision it implements:** [`DR-0078`](../decisions/DR-0078-hybrid-modular-shell-plus-feature-modules.md) + the full spec [`MODULE-ARCHITECTURE-ADR.md`](MODULE-ARCHITECTURE-ADR.md).
**Tier:** INFRA lane, **behind the July conference.** This is the highest-risk class of change in the repo (it touches the single most-contended file). Per `feedback-risk-clarify-before-change`, it is surfaced as a plan for joint review before any code moves.
**Grounds:** DR-0078, DR-0061 (one app), DR-0077 (orchestrated lanes), DR-0076 (verification doctrine), DR-0075 (perpetual improvement), `project_new_surface_new_module`, the conflict-evaluation loop.

> **What this adds over the ADR.** `MODULE-ARCHITECTURE-ADR.md` is the *decision* (what target, why, the staged shape). This document is the *execution layer beneath it*: the exact choke-points by **line number** as they exist on 2026-06-17, the concrete registry API, a per-stage risk / blast-radius / rollback / conference-safety table tied to real files, the orchestration mechanics (which scripts, which lane, how the serialize-gate runs), and the openclaw verdict. Where the two disagree, the ADR governs the decision; this governs the mechanics.

---

## STEP 1 — Review of the researched target

### 1.1 What the research concluded (DR-0078 / the ADR)

The repo was read directly on 2026-06-17 (not from memory). The findings, re-verified for this plan:

- `app/src/poe-financial-mvp-v28.jsx` is **9,513 lines** (re-counted today; the ADR said 9,481 — it is still growing, which is itself the argument).
- It already **imports 74 component/lib modules** (re-counted via `grep -c "^import .* from './\(components\|lib\)/"`). There are **82 component files** and **83 lib files** in `app/src/`. The monolith is already mostly a *composition root*, not a content blob.
- `main.jsx` (130 lines) already behaves like a shell: it boots **eight** standalone surfaces by URL param (`?join`, `?invites`, `?register`, `?audience`, `?teach`, `?login`, `?request-space`, `?oauth_popup`) **without** loading the heavy app or its Supabase/auth init. Independent mountability is already proven in production.
- The pain is measured, not felt: `node scripts/orchestration/conflict-analytics.mjs` over `docs/orchestration/conflict-events.jsonl` ranks the monolith and `migrations-auto` **tied #1** (3× each), trend **UP**. **Every recorded monolith collision was mount-wiring** — the import block and a render branch — never a feature.

**The recommended target = Hybrid Modular** (largely already true): a small **stable shared core/shell** + **independent feature modules** that plug in through a **surface-mount registry** and the **Events spine**, and never import each other.

The core/shell owns exactly six things (verbatim from the ADR §4.1): (1) app shell + the new surface-mount registry, (2) auth + session, (3) role-gating (King → Family → Servant-king/Governor → sheep), (4) the Operations/Events spine, (5) **the design system + shared primitives**, (6) the instance-scoped sync substrate. Everything else — Conference, Choir, Pulpit, Video Wall, Learn, Rentals, Books, Council Chamber, every future surface — is a feature module.

### 1.2 Tie to the consistency standard — one effort, not two

The instruction to ground this in a `CONSISTENCY-STANDARD.md` is **structurally correct, and the file does not exist yet** (verified 2026-06-17: no `CONSISTENCY-STANDARD.md` anywhere in the repo; no doc contains the string `CONSISTENCY-STANDARD`). Reported honestly per DR-0076 rather than cited as if present.

The point it names is exactly **core/shell item #5**: the shared primitives — the design system (`index.css` themes, default = midnight), the contrast/overlap gates, and `components/shared.jsx` + the shared dots/legends (`KpiDot`, `FreshnessDot`, `TraceableNumber`, `SectionBoundary`, `ErrorBoundary`) — **are the core/shell.** A "consistency standard" and "the module shell" are not two efforts. The standard is the *spec* for the shared layer; the shell is its *runtime*. Every feature module consumes those primitives and may not fork them; that is what makes the composed app feel like **one app** (DR-0061) even though it is assembled from independent modules.

**Recommendation (not executed here):** when this plan is approved, create `docs/00-foundations/CONSISTENCY-STANDARD.md` as the design-system half of the core/shell contract — enumerating the shared primitives a module MUST reuse and MUST NOT re-roll (colors via theme tokens not raw hex, the dot system, the boundary wrapper, type scale, text-size + TTS primitives) — and make "modules consume shared primitives, never fork them" a clause the boundary gate (Stage 4) can check. That keeps consistency and modularity as **one** standard. If Darrell intended an existing doc by that name, confirm the path and this plan re-points to it.

---

## STEP 2 — Staged implementation plan (the senior deliverable)

### 2.0 The concrete choke-points as they exist today (line-grounded)

These are the exact textual collision sites inside `app/src/poe-financial-mvp-v28.jsx` on 2026-06-17. Every recorded monolith conflict touched one of the first three:

| # | Choke-point | Location (2026-06-17) | Why it collides |
|---|---|---|---|
| C1 | **Import block** | L1–L90 (74 imports) | Every new surface adds an `import` line here → textual conflict with any other in-flight surface. |
| C2 | **Section render switch** | L4663–L5015 (`{view === '…' && …}` / `{view === 'church' && churchView === '…' && …}`) | Every new surface adds a render branch here → the #1 recorded conflict region (video-wall #206, pulpit #208, login #189 all collided here). |
| C3 | **Top-nav array** | L4620–L4660 (the `[['overview','Big Picture'], …]` tab list) | Every new top-level tab adds a row here. |
| C4 | **Church sub-nav** + **Books sub-nav** | church sub-nav drives L4754–L4918; books sub-nav array L4667–L4669 | Sub-tab adds collide the same way at a finer grain. |
| C5 | **Route-validation allow-list** | L1732 (`const VALID = ['overview','books',…,'center']`) | A new top-level view must be added here or it silently fails the URL-restore guard. A hidden fourth edit-site most new-surface PRs forget. |
| C6 | **Feedback-area map** | L5562–L5577 (`if (currentView === 'x') return 'area'`) | Tied to the feedback-area-coverage gate; a new surface needs a row or CI goes red. |

The registry (below) **absorbs C1, C2, C3, C4, and C5 into one data array.** C6 is folded in as a field on the registry entry.

### 2.1 The shared core/shell contract — what the shell owns

The shell is the only thing every module may depend on. After decomposition it owns, and nothing else:

1. **Composition root + surface registry** — `main.jsx` + a thin `PoeFinancialSystem()` that *iterates a registry* instead of hard-coding a render switch.
2. **Auth/session** — `lib/supabase.js`, `lib/multi-point-auth.js`, `lib/access-gate.js`, `lib/device-trust.js`, `lib/pin.js`. Single source of "who is signed in." A module **reads** identity; it never **sets** it.
3. **Role-gating** — `isFamilyMember` / `isChurchStaff` / `isStudyCircle` / `tierMeets` + `VIEW_TIER_REQUIREMENTS`. A module **declares** the role/tier it needs (registry field); it never re-implements the check.
4. **Operations / Events spine** — the orchestration reel, conflict-loop, governance queue, KPI/freshness, loop-health, dispatch. The typed event contract modules emit to and read from.
5. **Design system + shared primitives** — item #5 above; the consistency standard.
6. **Sync substrate** — `lib/table-sync.js` + `lib/sync-identity.js` (instance-scoped, RLS-aware), the base every `*-sync.js` is built on.

**Boundary law (machine-checkable, DR-0076):** a feature module may import core; **the core imports no feature; feature modules do not import each other's internals.** They interoperate via core sync (read another module's rows) or a typed event — never `import B`. This becomes a green check in Stage 4.

### 2.2 The module contract — the surface-mount registry

Mounting a surface becomes a **data entry**, not a code edit to a shared switch:

```js
// app/src/surfaces.js   (NEW core file — the registry)
export const SURFACES = [
  {
    id: 'church-video-wall',
    label: 'Video Wall',
    nav: 'church',                 // 'top' | 'church' | 'books' | 'projects' | …
    order: 60,                     // position within its nav group
    requires: { role: 'governor', tier: null, flag: 'church-video-wall' },
    feedbackArea: 'church-videowall',   // folds in C6
    boundary: true,                // wrap in <SectionBoundary> (default true)
    load: () => import('./components/ChurchVideoWall.jsx'),  // lazy → own chunk
  },
  // … one entry per surface …
];
```

The shell reads `SURFACES`, renders the nav from the entries (replacing C3/C4), applies the declarative role/tier/flag gate from core (§2.1.3), lazy-loads the chunk, wraps it in `SectionBoundary`, and derives the `VALID` route allow-list (C5) and the feedback-area map (C6) from the same array. **Adding a surface = appending one entry** — and in the end-state, dropping a co-located `components/<Feature>.surface.js` the registry globs, so even the array stops being shared. This is the fix the conflict-analytics tool independently recommended ([P1] "extract a surface-mount registry").

### 2.3 The staged sequence — risk / blast radius / rollback / conference-safety

Hard rule: **nothing in Stages 1–6 ships before the July conference.** Stage 0 is already in force, so the conference surfaces are already isolated modules and untouched by any of this. Order within Stages 2–3 follows the conflict-loop's ranked hot-file output (`conflict-analytics.mjs`), highest-contention first.

| Stage | What | Six-test? | Risk | Blast radius | Rollback | Conference-safe because |
|---|---|---|---|---|---|---|
| **0** | new-surface=new-module (already in force) | passes (isolated) | none | — | — | Already true; conference adds #214/#218 touched the monolith **not at all**. |
| **1** | **Introduce `surfaces.js` (NEW file) + ONE final serialized monolith edit** so the shell iterates the registry. After this edit the import block (C1) + render switch (C2) are **frozen**. | ⚠️ **FAILS six-test — touches the hot file.** **Joint review + serialized lane required.** | **High** (the one genuinely dangerous step) | Whole app if the iterate-loop is wrong, but each surface stays behind its own `SectionBoundary`. | `git revert` the single PR; the registry file is additive and the monolith edit is one localized diff. Vercel/Cloudflare prior deploy stays warm. | It is **post-conference** and is the *last* time C1/C2 are ever touched. Gated by full `npm run verify`. |
| **2** | **Migrate existing surfaces onto the registry**, a few per PR. Appends to `SURFACES`; no logic moves. | borderline — edits `surfaces.js` (now shared) but only **appends** | Low | One nav group per PR | Revert the per-surface PR; entry removal is a list-delete. | Conference surfaces already isolated; migrate them **last** or not at all until after soak. |
| **3** | **Peel the largest remaining IN-FILE sections** into `components/*.jsx`, mounted via the registry. Work queue = ranked hot-file output. Candidates that are still *inline in the monolith* (not yet their own file): `Church` wrapper, `BigPicture`/overview block, `Admin`, the feedback/TTS/install banners, `FeedbackModal` (L5562). | ⚠️ section-by-section; each peel **touches the hot file once** → serialized | Medium | The peeled section only (behavior pinned by existing tests) | Revert the per-section PR; characterize-before-change (DR-0076 §5) means the section's tests pin behavior. | Post-conference, incremental, one section per PR. |
| **4** | **Add the boundary gate** (core-imports-no-feature; features-don't-import-each-other; modules-consume-shared-primitives) + the **migration-numbering fix** (timestamped names). | passes (additive gate, own files) | Low | CI only | Disable the gate job | Gates are additive + proven-to-catch before merge; no runtime change. |
| **5** | **Full decomposition** — monolith is now a thin composition root over `surfaces.js` + core; rename to reflect that. | n/a | — | — | — | After the in-flight queue drains + soak confirms the conflict trend turned DOWN. |

**Structural dependencies across files (explicit — no placeholders):**
- The registry's `requires` field depends on the role/tier helpers currently *inside* the monolith (`isFamilyMember`, `isChurchStaff`, `isStudyCircle`, `tierMeets`, `VIEW_TIER_REQUIREMENTS`). **Stage 1 must first lift these into a core module** (e.g. `lib/role-gate.js`) so both the monolith-during-transition and `surfaces.js` import them from one place. This is a prerequisite sub-step of Stage 1, not a separate stage.
- `main.jsx` already imports eight standalone components directly (L5–L11). Those eight (`AppInterestCapture`, `ConferenceRegister`, `AudienceWindow`, `TeachMode`, `PasswordAuth`, `VenueRequest`, etc.) are the **proof model** for the registry's lazy `load`; the registry generalizes what `main.jsx` already does by hand. No change to `main.jsx`'s standalone boots is required in Stages 1–4.
- The feedback-area-coverage gate (`scripts/feedback-area-guard.mjs`) reads the literal `currentView ===` pairs (C6). When C6 moves onto the registry (Stage 2/3), **that guard must be updated in the same PR** to read `feedbackArea` from `SURFACES`, or it goes red. Named dependency, not a TODO.

**The six-test flag, stated plainly:** Stages **1 and 3 fail the six low-risk tests** (they touch the hot file and are not fully isolated). They are **Tier B/C, joint-review-before-execution.** Stages 0, 2, 4 are low-risk/isolated. This is the gate Darrell's `feedback-risk-clarify-before-change` requires; it is surfaced here so nothing in the dangerous class executes without his explicit go.

---

## STEP 3 — Orchestration: driving the decomposition without collisions

The decomposition is itself multi-PR work on the hottest file, so it must run through the **same swimlane/merge-queue engine** the rest of the repo uses (`docs/orchestration/SWIMLANES.md`, DR-0077). It is an **INFRA-lane (lane 4)** body of work, scheduled behind the conference critical path (lane 1).

### 3.1 Serialized lane for every monolith-touching stage

Stages 1 and 3 each touch `poe-financial-mvp-v28.jsx`. Per the SWIMLANES partition rule (§2), shared-core files **serialize within reach**: at most one monolith-touching PR in flight; the next rebases onto main after the prior merges. Mechanically:

- `scripts/orchestration/conflict-map.sh --gate` **refuses 2+ shared-file branches in flight at once** — this is the existing brake that keeps Stage-1/Stage-3 PRs from stacking. Run it before opening each decomposition PR.
- Stages 0, 2, 4 are disjoint-file work and run **in parallel** across other lanes — they never wait on the serialized monolith lane (SWIMLANES §3).
- Label every decomposition PR `lane:4-infra` so it is filed (an unlabeled PR is UNFILED and must not land). Within the lane, order by least-conflict / least-behind first.

### 3.2 Conflict-map gating + the work queue

- The **work queue for Stage 3** is literally the output of `node scripts/orchestration/conflict-analytics.mjs` — extract the highest-contention in-file section first, re-run after each merge, and **stop when the monolith leaves the #1 slot** (the loop's own success signal: trend DOWN).
- `scripts/orchestration/conflict-map.sh` computes `PARALLEL-SAFE` vs `MUST-SERIALIZE` + land order each cycle; `scripts/orchestration/lanes.sh` is the re-attach entrypoint for a returning session.
- Log each decomposition conflict/resolution to `docs/orchestration/conflict-events.jsonl` (the same loop that justified this work measures whether it worked).

### 3.3 Migration allocator (the co-#1 hot file)

Stage 4 includes the migration-number fix. Until then, any migration a decomposition PR needs must claim its number to avoid the duplicate-0019/0022 class. The end-state allocator = **timestamped migration names** (`YYYYMMDDHHMM-<slug>.sql`, collision-free by construction; apply order = lexical = chronological) — ADR §4.5 option (a), recommended.

### 3.4 Honest gap — referenced orchestration scripts that do NOT exist yet

Per DR-0076, verified by `find` on 2026-06-17 — **these are cited by `SWIMLANES.md` and/or `conflict-events.jsonl` but are not present in the repo:**

- `scripts/orchestration/ground.sh` — **missing.** (The canonical re-attach step #1.)
- `scripts/orchestration/promote.sh` — **missing.** (Cited in the #188→#190 stacked-PR conflict event as "the failure promote.sh now closes.")
- `scripts/orchestration/migration-order-check.mjs` — **missing.** (Cited as the proven-to-catch migration gate in two conflict events and in ADR §4.5.)

**What DOES exist:** `scripts/orchestration/{conflict-map.sh, lanes.sh, conflict-analytics.mjs, llm-review.mjs, llm-review.sh}` and `.github/workflows/{auto-merge.yml, auto-open-pr.yml}`. The missing three appear in worktree copies under `.claude/worktrees/*` but not on the primary tree's `scripts/orchestration/`. **Implication:** before the decomposition lane runs, either (a) land the missing scripts on main, or (b) update SWIMLANES.md to reference only what exists. The migration-numbering gate (Stage 4) should formalize `migration-order-check.mjs` as a real, on-main, proven-to-catch gate rather than a cited-but-absent one. Flagged so the orchestration plan isn't built on a script that isn't there.

---

## STEP 4 — "openclaw" research (honest findings)

**Verdict: I can identify a real, plausibly-matching tool — but because the name reached me as a likely voice transcription, confirm it's the one you meant before we wire anything.**

The name resolves to **two distinct real projects**, only one of which is build-pipeline relevant:

1. **`openclaw/openclaw`** ([github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)) — the relevant one. A **self-hosted, open-source personal AI agent**. Confirmed directly from the repo: **MIT-licensed core** (third-party deps noted separately), **self-hostable**, runs as a single long-lived **Gateway** process (a daemon installed via `openclaw onboard --install-daemon`) that handles channels, sessions, tool execution, and memory. **Model-agnostic** — Claude / GPT-4o / Gemini, and (per secondary sources) local models via Ollama; the repo itself says "prefer a current flagship model from the provider you trust." It connects to **many chat channels including Synology Chat, Slack, Signal, iMessage, Telegram, WhatsApp** — notably Synology Chat, given your NAS. It has a **coding-agent skill** (`openclaw/openclaw/skills/coding-agent`) and markets actions like "diagnose build failures, change deployment configs, submit pull requests." It reportedly crossed 100k GitHub stars in late January 2026.
2. **`pjasicek/OpenClaw`** ([github.com/pjasicek/OpenClaw](https://github.com/pjasicek/OpenClaw)) — a C++ reimplementation of the **1997 Captain Claw platformer game.** Almost certainly **not** what you meant; listed only to disambiguate.

**Does it fit the sovereign / open-source-only rule?** On the evidence, **yes for the core**: MIT, self-hostable on the NAS, model-agnostic including local Ollama, and it speaks Synology Chat — it aligns with AI-FOUNDATION-INTERNAL-OPERATIONS (sovereign, internal surfaces on the NAS) and DATA-AS-EMPOWERMENT (open-source core, exportable). Caveats held honestly:

- **It is a chat-ops *gateway*, not a CI/merge-queue engine.** It would not *replace* the swimlane/conflict-map/auto-merge machinery in STEP 3 — it would sit *in front of* it as a sovereign control surface: you (or the local orchestrator) drive lanes from Synology Chat, openclaw executes the existing scripts. That is a genuine fit with the "sovereign-resume bridge" in SWIMLANES §5 and the orchestrator-as-boss design — but it is an **addition**, not a swap.
- **Coding-agent maturity for *this* pipeline is unverified.** The repo *claims* PR-submission; I have not seen it drive a real multi-PR decomposition under the three-brakes rule (`feedback_autonomous_automation_three_brakes`). Any autonomous, timer-driven use is **Tier C, ships inactive, needs budget + concurrency-lock + kill-switch** — the 2026-06-06 runaway makes that non-negotiable.
- **Residual identification uncertainty:** "openclaw" could still be a transcription of something else (e.g. a different agent/build tool). If `openclaw/openclaw` is not what you meant, the closest adjacent candidates surfaced were **`nearai/ironclaw`** (an "Agent OS focused on privacy/security/extensibility") and **`Gen-Verse/OpenClaw-RL`** (RL agent training). Tell me which and the plan re-points.

**Recommendation:** treat openclaw as a **Tier-C, inactive, NAS-hosted evaluation** — stand up the Gateway on the NAS wired to Synology Chat + local Ollama, give it **read-only** access to the orchestration scripts first, and judge its coding-agent on a *throwaway* task before it ever touches a real decomposition PR. Do **not** put it in the autonomous loop until it has all three brakes and you've watched it run. No capability is assumed beyond what's verified above.

---

## Appendix — verification trace for this plan (DR-0076)

Every structural claim above was read from the repo on 2026-06-17, not from memory:

- Monolith size: `wc -l` → **9,513**. Imports: `grep -c` → **74**. Components: **82** files. Libs: **83** files.
- Choke-points C1–C6: line numbers from direct `Read`/`Grep` of `poe-financial-mvp-v28.jsx` (import block L1–90; render switch L4663–5015; top-nav L4620–4660; books sub-nav L4667–4669; `VALID` allow-list L1732; feedback-area map L5562–5577).
- `main.jsx` standalone boots: L41–L107 (eight URL params).
- Conflict ranking: `docs/orchestration/conflict-events.jsonl` + `conflict-analytics.mjs` (monolith + migrations tied #1, 3× each, trend UP).
- Missing scripts: `find` confirmed `ground.sh` / `promote.sh` / `migration-order-check.mjs` absent from `scripts/orchestration/` (present only in `.claude/worktrees/*` copies for the first, none for the latter two).
- `CONSISTENCY-STANDARD.md`: `grep`/`glob` confirmed **no such file** and no doc containing the string.
- openclaw: license + self-hostable + gateway model verified by fetching `github.com/openclaw/openclaw` directly; Ollama/channel/star-count details from search snippets (flagged as such).

*This is a plan. The first thing that would actually move — Stage 1, the `surfaces.js` registry — does not run until Darrell says go and the conference has shipped.*
