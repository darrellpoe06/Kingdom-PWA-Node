# PoeTech App — Completion Roadmap (Grounded Review + Pathway to Done)

**Status:** Orienting synthesis · **Author:** Claude (advisory; GOVERN-EXECUTE-ADVISE) · **Date:** 2026-06-29
**Verified against:** `origin/main` @ `d6a5e25` (PR #388, merged 2026-06-26) · CI green
**Method:** Grounded per VERIFICATION-DOCTRINE (DR-0076). Every claim is labeled **[CONFIRMED]** (verified against the live repo/PRs/CI this session), **[CORRECTED]** (prior framing adjusted to match reality), or **[UNVERIFIED]** (could not confirm read-only; needs a check before it is trusted). This document does not change app code.

> **Why this doc exists.** The repo already holds the *parts* of a completion plan — `BUILD-ROADMAP.md` (R1–R21), DR-0013 (four-phase sovereignty), DR-0078 (hybrid-modular), DR-0079 (unified surfaces), `RELEASE-TIERS.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `LESSONS-LEARNED.md`. What it did **not** have is one orienting document that says, in one place, *where we are, what "done" means, and the sequence to get there.* This is that document. It synthesizes; it does not replace those sources. Cross-references are explicit so future sessions inherit the map instead of re-deriving it.

---

## 0. What "Complete" Means (the definition that was missing)

"Complete" for the PoeTech App is **not** a feature count. Synthesized from the binding sources, completion is reached when all five hold:

1. **Every surface is a live view of real state (DR-0061).** No painted numbers, no hand-typed lists standing in for data. Every page reads from, and writes to, a real record — and shows it honestly when it can't.
2. **Persistence is app-wide.** Every user-meaningful collection survives device loss and syncs cross-device under RLS multi-tenancy — no local-only islands of data the family can lose.
3. **Serving is sovereign-leaning and cost-sustainable.** The app is served without a per-branch vendor cap throttling the build lane, and the heavy AI paths run on owned hardware (SOVEREIGN-FIRST) with vendor reserved-but-optional (DR-0013).
4. **The architecture is the small-shell + feature-modules target (DR-0078/0079), not a 9k-line monolith** — so the build lane stops colliding and new verticals land "in days" (DR-0030).
5. **It measurably improves quality of life (QUALITY-OF-LIFE-AS-NORTH-STAR) and passes the gates** — the Tier-C bar (`RELEASE-TIERS.md`) plus the deterministic CI gates, every one proven-to-catch (DR-0076). QoL — not engagement — is the merge question.
6. **Every repetitive/predictable path runs on deterministic code, not an LLM (see §0.5, BINDING).** The AI is reserved for novel reasoning, generation, judgment, explanation, and hard cases. A surface that calls an LLM where a deterministic path exists is *not* done.

A vertical (Books, Church, Chef's Corner, Voice, CRM, Conference) is "done" when it satisfies 1–2, 5, and 6 on its own surface. The *platform* is "done" when 3–4 also hold and the autonomy layer (DR-0037/0056/0057) runs behind its three brakes.

---

## 0.5 BINDING REQUIREMENT — Deterministic-First, AI-Only-When-Necessary

**Declared by Darrell, 2026-06-29. Binding architectural requirement + standing design-review check.**

> "Only want the AI to run for necessary items; build the repetitive workflows in for load reduction so the AI can keep up with the demand of new systems."

**The rule.** Repetitive and predictable work is built as **plain deterministic code / scheduled jobs — NO LLM call.** The AI/LLM is reserved for **novel reasoning, generation, judgment, explanation, and genuinely hard cases.** The default is deterministic; an LLM is invoked **only when no deterministic path works.**

**Deterministic by default (build it in — never an LLM):** scheduled pulls and syncs · format conversions · rule-based transforms · threshold / health / status checks · known field mappings · routine loops · validation against a fixed schema · idempotent reconciliation · anything whose output is a pure function of its input.

**AI-needed (the reserved budget):** novel reasoning over unseen input · open-ended generation (drafts, teaching, summaries that aren't templated) · judgment calls and disambiguation · explaining the unfamiliar · classification where rules genuinely don't generalize · the hard tail a deterministic path can't cover.

**Why (the rationale — load reduction).** Every deterministic path that does *not* call an LLM is freed AI capacity. As new systems are added, demand on the AI grows; pushing the repetitive mass onto deterministic code is what lets the AI **keep up with the demand of new systems** instead of drowning in routine. This pairs with cost-discipline, the SOVEREIGN-FIRST tier ladder (DR-0056: cheapest-capable tier first; deterministic is *below* the cheapest model), and the three-brakes law (P10–P12) — deterministic work needs no budget/lock/kill-switch because it never enters the autonomy loop.

**Standing design-review check (every new workflow/loop must answer, in the PR/DR):**
1. Is this output a pure function of its input, or rule-expressible? → **build deterministic, no LLM.**
2. If it calls an LLM: *what specifically can't a deterministic path do here?* (State it. "It's easier" is not an answer.)
3. Is there a deterministic pre-filter that handles the common case so the LLM only sees the hard tail?
4. If sovereign/scheduled: does the deterministic core run without the LLM being reachable at all (honest-offline)?

A workflow that calls an LLM without answering #2 does not pass review. This is the verification-doctrine posture (DR-0076) applied to *compute allocation*: the burden of proof is on invoking the AI, not on avoiding it. (Recorded for the ledger as **DR-0080**; future workflows cite it.)

### 0.5.1 Classification pass — every loop/workflow labeled

The standing inventory. Each row is **DETERMINISTIC** (build in, no AI) or **AI-NEEDED** (reserved). This pass is re-run as new workflows are designed; the default verdict for a new row is DETERMINISTIC until #2 above is answered.

| Loop / workflow | Verdict | Why |
|---|---|---|
| Supabase table syncs (`createTableSync`, ~35 tables) | **DETERMINISTIC** | pure upload/patch/subscribe; no reasoning |
| Migration apply (`db-migrate.yml`) + the planned applied-ledger | **DETERMINISTIC** | idempotent SQL in filename order |
| CI gates (lint, vitest, build, module-boundary, contrast/legibility/consistency/tab guards, wf36) | **DETERMINISTIC** | rule/threshold checks; this is the model |
| Derived on-hand / balances / costing / forecast math (`inventory.js`, `account-balances.js`, `recipe-costing.js`, `financial-scenarios.js`) | **DETERMINISTIC** | pure functions over the ledger |
| Par-based purchase-order drafts (`purchasing.js`) | **DETERMINISTIC** | `order_qty = par − on-hand`; arithmetic, not judgment |
| Scheduled pulls (financial-doc email import wf18, video-harvest fan-out) | **DETERMINISTIC** transport; **AI-NEEDED** only at the extract/classify step | route/parse deterministically; LLM only where content is genuinely unstructured |
| Health / freshness / coverage loops (`loop-health.js`, daily-review scan) | **DETERMINISTIC** | threshold + status; no LLM |
| Reading-voice playback, format/unit conversions (`recipe-units.js`, TTS routing) | **DETERMINISTIC** | fixed factors / device API |
| Known-mapping transforms (speaker canonicalization, taxonomy mapping) | **DETERMINISTIC** | lookup table + trigger |
| Class tutor / ChurchLearn chat, broadcast editorial drafts, novel summarization | **AI-NEEDED** | open-ended generation over unseen input |
| Transcription (Whisper), real voice-clone (XTTS) | **AI-NEEDED** (model, not LLM-reasoning) | perceptual task; still off the vendor-LLM budget — runs sovereign |
| Discernment/world-issues reasoning, judgment/disambiguation, hard-tail classification | **AI-NEEDED** | rules don't generalize; the reserved budget |

---

## 1. Current-State Review (grounded)

### 1.1 The build **[CONFIRMED]**
- **Real main:** `d6a5e25` — PR #388 "Chef Mario's direct-to-purchasing north star," merged 2026-06-26. (Note: the *local* `main` ref is stale at `f48ea87`; the team operates on feature branches and does not fast-forward local main. Treat `origin/main` as truth.)
- **Tests:** ~2,500 across **203 test files** (`app/src/__tests__`). CI on main is green (latest runs 2026-06-26). *(Prior memory figures of "2424 / 1281 green" were point-in-time snapshots — [CORRECTED] upward to ~2,500.)*
- **PRs:** latest merged is #388; ~14 PRs open, several intentionally `hold`-labelled for Tier-C soak (#250 Creation Workspace, #255 dynamic financial figures, #273 Sovereign A.I. course) plus a cluster of strategy/research docs (#284, #336, #340, #363).

### 1.2 The pipeline **[CONFIRMED]**
- **Required gate:** one status check named exactly **`app — lint + vitest`** (`.github/workflows/ci.yml`). It runs, in order: ESLint → **module-boundary-guard** (DR-0078 re-tangle guard) → vitest → **production build** (Rollup; catches missing named exports) → **wf36 Quality Gatekeeper** (n8n conformance).
- **Perpetual UI/UX guards** also run: `contrast-guard` (WCAG AA per-theme), `legibility-guard` (per-page dark-on-dark, baseline-ratchet), `consistency-guard` (one-primitive-per-axis ratchet), `tab-overflow-guard`. These are ratchet gates: they block *new* debt and trend existing debt down (ITIL CSI).
- **Auto-merge lane:** push a `feat/|fix/|merge/|docs/` branch → `auto-open-pr.yml` opens the PR → `auto-merge.yml` squash-merges on green, **unless** the `hold` label is present (the Tier-C opt-out). 0 human reviews required on main; **the green gate is the reviewer**, and `hold` is the human veto.

### 1.3 The data / persistence layer **[CORRECTED]**
The framing of "static-vs-shared-persistence" understated reality. Ground truth:
- **Real Supabase backend is fully wired** (`app/src/lib/supabase.js`): real auth (email+password primary, OTP, Google/Apple OAuth), session persistence, auto-refresh. **RLS multi-tenancy is enforced** (`tenants`/`tenant_members`, `user_in_tenant()` policies; DR-0060 tenancy-guard proven-to-catch).
- **~35 tables sync cross-device** via `createTableSync()` (`app/src/lib/table-sync.js`) — accounts, transactions, entities, debts, projects, rentals, incidents, recipes, kitchen counts, choir renditions, conference, voice profiles, CRM leads, inventory items/movements, and more.
- **Migrations:** 61 SQL files in `infra/supabase/migrations-auto/`, applied idempotently on push-to-main by `db-migrate.yml`. There is **no explicit applied-vs-authored ledger** — the GitHub Actions run log is the only receipt. Latest authored: `0053-kitchen-inventory-counts`, `0054-kitchen-purchasing`.
- **The real gap (smaller than feared):** ~7 collections remain **local-only / no sync module** — `recurringObligations`, `taxCalendar`, `events`, `capexItems`, `prayerRequests`, `skillProfiles`, `scopes`. These are the concrete "persistence app-wide" backlog, plus formalizing a migration-applied ledger.

### 1.4 The architecture **[CONFIRMED, with one estimate flagged]**
- **Hybrid-modular Stage 1 is LIVE.** `app/src/surfaces.js` (122 lines) is the single mount point: **31 registered surfaces** *(agent estimate of "38" — [CORRECTED] to 31 confirmed)*, each `React.lazy()`-loaded. `module-boundary-guard.mjs` enforces that feature modules don't statically re-import each other (no re-tangle).
- **The monolith remains:** `app/src/poe-financial-mvp-v28.jsx` is **9,361 lines** — now the *shell/orchestrator* (auth gate, nav wiring, sync subscriptions, render switch), not the features. Features live in 170 `lib/*.js` modules + 130 components.
- **Bundle:** real code-splitting. `main.jsx` routes ~8 lightweight standalone boots (registration, projector/NDI output, login, teach-mode) via dynamic import; the full monolith loads only on the normal app path.
- **Decomposition progress: ~65% [UNVERIFIED estimate]** — the agent's figure; directionally right (registry + 170 libs extracted, shell wiring still monolithic) but not precisely measured. Stage 2 (derive nav/route-allowlist/feedback-map from the registry; extract the Church home composer) is the remaining structural work, planned in `HYBRID-MODULAR-IMPLEMENTATION-PLAN.md` + DR-0079's five unified surfaces.

### 1.5 The AI layer — Ari **[CONFIRMED]**
- **Ari is a real identity/persona layer** (`app/src/lib/ari.js`): the one A.I. name (Black Lion / Lion of Judah; "the unseen, made seen"), applied as the persona preamble to every AI-touching surface (default reading voice "Ari (system voice)," every course tutor, ChurchLearn chat).
- **There is no vendor LLM call in the browser** (sovereign-first). LLM paths route same-origin through the `/n8n` rewrite to **Ollama (qwen2.5) on the NAS** (class tutor), with an honest authored fallback when the NAS is unreachable. Editorial/transcription work is NAS/server-side (Whisper). Ari is the *character applied to those calls*, not a standalone chatbot.

### 1.6 The sovereign local stack **[CONFIRMED: partially stood up]**
- **Live:** NAS (Synology, CPU-only) running n8n + Ollama small models; class tutor reaches it via `/n8n`. Whisper pipeline documented/ready NAS-side. XTTS-v2 **voice cloning bridge** exists (Replicate, behind `VITE_VOICE_BRIDGE`); voice falls back to a *labeled* stand-in, never misreported as a real clone (the bright line).
- **Not stood up:** the **GPU box** (procurement-stage projects `pr-cuda-home-box` active, `pr-cuda-colg-node` planning; BOM in `CUDA-BOX-PROCUREMENT-*`). It is the destination for the sovereign voice studio, Whisper-at-scale, and 70B+ local inference (`voice-service.js` is model-agnostic, ready to point at `VITE_VOICE_SERVICE_URL`). **Not reachable from the app yet.**

### 1.7 Major in-flight workstreams **[CONFIRMED]**
1. **Chef's Corner Kitchen → direct-to-purchasing (P4).** Uncommitted on the working branch right now: `app/src/lib/purchasing.js` (par-based PO drafts, approve-to-purchase gate — never places an order or moves money) + `0054-kitchen-purchasing.sql`. Follows a clean phased PRD (P1 shipped → P5). This vertical is the **model** for "phased to completion."
2. **Hybrid-modular Stage 2** (DR-0078/0079).
3. **Off-Vercel serving cutover** (built, gated off — see §2).
4. **GPU sovereignty** (procurement → deploy voice studio + heavy inference).
5. **Autonomy layer behind three brakes** (DR-0037/0056/0057/0058 — all ship inactive today).

---

## 2. Opportunities + Constraints

### Constraints (the real ones, grounded)
| # | Constraint | Evidence | Bite |
|---|-----------|----------|------|
| C1 | **Vercel serving model** | `app/vercel.json` disables per-branch previews; Cloudflare path built but **gated off** (`CF_PAGES_ENABLED` unset) | Build lane works today, but the off-Vercel cutover is unfinished; the cap risk is mitigated, not eliminated |
| C2 | **GPU box not stood up** | procurement-stage projects; no `VITE_VOICE_SERVICE_URL` live | Sovereign voice clone, heavy local LLM, sanctuary media-gen all blocked on hardware |
| C3 | **Persistence not fully app-wide** | ~7 local-only collections (§1.3) | Family-meaningful data (capex, tax calendar, prayer log, scopes) can be lost on device loss |
| C4 | **Monolith still 9.3k lines** | `poe-financial-mvp-v28.jsx` | Merge collisions concentrate here; Stage 2 not done |
| C5 | **Vendor-LLM autonomy cap + three-brakes law** | DR-0037, P10–P12, CLAUDE.md | No timer-driven autonomy ships active; bounded by design (a feature, but it gates "self-running") |
| C6 | **Two-session git race + ~45 worktrees** | `git worktree list`; CLAUDE.md race rule | Concurrent sessions can tear `.git`; coordination overhead is real |
| C7 | **UI/UX standards just being enforced** | legibility/consistency baselines carry existing debt | Trending down, not yet zero |

### Opportunities (the leverage)
- **The shared-persistence + RLS + table-sync foundation is built** — closing C3 is *replication of a proven pattern*, not invention.
- **The sovereign local stack** (NAS + coming GPU box) is a genuine moat: serve-not-extract, data-as-empowerment, no vendor lock — the structural difference *is* the competitive advantage (DATA-AS-EMPOWERMENT).
- **The church content flywheel** — one service recording fans out to sermon/songs/lessons/scripture/discernment (video-harvest ledger) — is a perpetual content engine COLG-first.
- **Chef's Corner / Kitchen** is a near-complete, **sellable vertical** with a clean phased PRD — the proof that the Industry/Role Module template (DR-0030) produces shippable products.
- **Ari** unifies the AI identity across every surface — a coherent brand + posture (honest, test-everything) already wired.
- **The gate discipline (QCHP + ratchet guards + wf36 + verification doctrine)** means "perpetual improvement" (DR-0075) is enforced, not aspirational.

---

## 3. Strategies + Skills Required to Finish

| Workstream | Strategy | Skills / inputs required |
|-----------|----------|--------------------------|
| **Data-layer standardization (C3)** | Replicate `createTableSync()` for the 7 local-only collections; add migrations + RLS; add an explicit migration-applied ledger | JS/React, Supabase/Postgres + RLS, the existing sync pattern. **No human-only input** — agent-drivable. |
| **Off-Vercel cutover (C1)** | Flip `CF_PAGES_ENABLED`, set CF secrets, deploy, verify on `pages.dev`, then DNS cutover | **Darrell's hand:** Cloudflare account/token/Account-ID + the one irreversible **DNS** step. Runbook exists (`2026-06-16-cutover-plan-*`). |
| **Modular Stage 2 (C4)** | Derive nav/route-allowlist/feedback-map from `surfaces.js`; extract Church home composer; pursue DR-0079 five unified surfaces | Architecture/refactor discipline; the boundary-guard already enforces correctness. Conference-safe sequencing (nothing destabilizing before events). |
| **Sovereign GPU/voice (C2)** | Procure box → deploy XTTS/Whisper/local LLM → point `voice-service.js` at it | **Darrell's hand:** hardware purchase ($5k farm / $9k church node per DR-0014), physical install, network. Then agent wires the endpoint. |
| **Test-until-tight / QCHP (C7)** | Keep ratchets trending debt to zero; every "looked-fine-but-wasn't" incident becomes a new proven-to-catch gate | Verification-doctrine discipline; already the team's default. |
| **Autonomy layer (C5)** | Arm DR-0037/0056/0057 engines *only* with budget + concurrency-lock + kill-switch, attended | **Darrell governs**; arming is reserved to him, never while traveling. |
| **SME/human inputs** | Chef Mario (kitchen), keyboardist/choir SMEs, Christina (TLC/money review), specialist (dyslexia module) | Domain SMEs + the family-voice review loop; these set content correctness the agent cannot self-certify. |
| **Deterministic-first (§0.5, DR-0080)** | Run the classification pass on every loop; build the repetitive mass as plain code/scheduled jobs; reserve the LLM for the AI-needed tail; add the design-review check to the PR/DR template | Plain JS + scheduling discipline; the judgment to tell rule-expressible from genuinely-novel. Agent-drivable; **the load-reduction multiplier that lets new systems scale.** |

---

## 4. Timeline + Pathway to Comprehensive Completion

Phases are **dependency-ordered, not calendar-promised** (PROJECTIONS-NOT-PROMISES). Each phase names what lands, what gates it, and what is gated on Darrell's-hand infra. The ordering principle: **finish a flagship end-to-end loop first, then make persistence app-wide, then fix serving, then complete the verticals, then earn sovereign autonomy.**

**Deterministic-first (§0.5, DR-0080) is a cross-cutting requirement, not a phase** — it applies to every workflow built in every phase. The classification pass is run as each phase's workflows are designed; the design-review check (§0.5) gates each PR/DR. It is *load-bearing for sequencing*: pushing the repetitive mass onto deterministic code in early phases is what frees the AI capacity later phases (5–6, the autonomy layer) depend on.

### Phase 1 — Flagship end-to-end loop (agent-drivable, now → ~2 wks)
**Goal:** one vertical proven *fully* complete against the §0 definition, as the template.
- **Land Kitchen Purchasing P4** — commit `purchasing.js` + `0054`, wire the approve-to-purchase gate, tests, apply migration. Then P5 close-out per PRD. *(Note: `purchasing.js` is the deterministic-first exemplar — the reorder draft is pure arithmetic, no LLM; §0.5.)*
- **Run the §0.5 classification pass on this vertical's loops** and add the deterministic-first design-review check to the PR/DR template — so the flagship also establishes the *compute-allocation* pattern, not just the data pattern.
- **Acceptance:** Chef's Corner satisfies live-data (DR-0061) + persistence + QoL + deterministic-first (§0.5) + green gates end to end. This becomes the **reference implementation** every other vertical is measured against.
- **Gated on:** nothing external. *(Resolve the ~45-worktree / uncommitted-purchasing state first to avoid a git race.)*

### Phase 2 — Persistence app-wide (agent-drivable, ~2–3 wks, parallel to P1)
**Goal:** close C3 — no local-only islands.
- Add sync + migration + RLS for the 7 collections (§1.3). Add an explicit **migration-applied ledger** (closes the implicit-receipt gap).
- **Acceptance:** every user-meaningful collection survives device loss; tenancy-guard (DR-0060) green for each.
- **Gated on:** nothing external.

### Phase 3 — Off-Vercel serving cutover (Darrell's-hand gate, ~1 day work + soak)
**Goal:** close C1 — sovereign-leaning, cap-free serving.
- Flip `CF_PAGES_ENABLED`, set CF secrets, deploy, verify `pages.dev` + `/n8n` proxy health, **then DNS cutover** (the one irreversible step; fast rollback via DNS revert).
- **Acceptance:** main serves from Cloudflare Pages; n8n same-origin proxy healthy; security headers byte-match (guarded by the headers test).
- **Gated on:** **Darrell** — CF account/token/Account-ID + DNS. Everything else is staged.

### Phase 4 — Modular Stage 2 + vertical completion (agent-drivable, ~4–6 wks)
**Goal:** close C4 + finish the verticals to the §0 bar.
- Derive nav/route-allowlist/feedback-map from `surfaces.js`; extract the Church home composer; progress DR-0079 unified surfaces. Shrink the monolith toward a true shell.
- Bring each remaining vertical (Church learn/service/choir, Books/Finance, CRM, Conference, Voice, Creation, Command & Serve) to live-data + persistence + QoL + green.
- Land/clear the `hold` PRs intentionally (Creation Workspace, dynamic financial figures, Sovereign A.I. course) after their soak/review.
- **Acceptance:** monolith is shell-only; module-boundary-guard green; every vertical passes §0 (1,2,5).
- **Gated on:** SME content reviews (Christina, specialists) for specific modules; conference-safe timing.

### Phase 5 — Sovereign GPU + voice studio (Darrell's-hand gate, hardware-paced)
**Goal:** close C2 — heavy AI on owned hardware.
- After box procurement/install: deploy sovereign XTTS (real clone), Whisper-at-scale, local 70B+; point `voice-service.js` at `VITE_VOICE_SERVICE_URL`; sanctuary media-gen workflows.
- **Acceptance:** cloned-timbre voice is real (no stand-in), heavy inference is local, vendor reserved-but-optional (DR-0013 Phase 3–4).
- **Gated on:** **Darrell** — hardware purchase + physical/network install. Maps to DR-0013 Phase 4 (hardware-gated) and `BUILD-ROADMAP.md` R5–R7.

### Phase 6 — Earned sovereign autonomy (Darrell-governed, attended-only)
**Goal:** the self-extending layer runs — safely.
- Arm DR-0037 (anticipate→govern→build), DR-0056 (tiered orchestrator), DR-0057 (continuous fruit loop), DR-0058 (review cadence) **only** with all three brakes (budget + concurrency-lock + kill-switch), attended, never while traveling.
- **Acceptance:** the system proposes and (within the Cage) executes governed improvements; every run is bounded, single-flight, and dead-man-switched.
- **Gated on:** **Darrell governs** the arming; this class is Tier-C-always (P10–P12).

**Definition of comprehensive completion:** Phases 1–4 deliver a *complete app* by the §0 definition (live-data, persistent, cap-free serving, modular, QoL-passing). Phases 5–6 deliver the *sovereign, self-improving* platform — the long-arc north star. The app is "done enough to be the family/community's daily tool" at the end of Phase 4; it is "the sovereign platform" at the end of Phase 6.

---

## 5. Cross-references (don't re-derive — read these)
- `BUILD-ROADMAP.md` — the active R1–R21 worklist this synthesizes.
- DR-0013 (four-phase sovereignty), DR-0078 (hybrid-modular), DR-0079 (unified surfaces), DR-0061 (live-views), DR-0060 (tenancy-guard), DR-0076 (verification doctrine), DR-0030 (industry-module template), DR-0037/0056/0057/0058 (autonomy engines), DR-0075 (perpetual improvement), DR-0014 (hardware budget), **DR-0080 (deterministic-first, AI-only-when-necessary — §0.5)**.
- `RELEASE-TIERS.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `LESSONS-LEARNED.md` (P10–P21), `HYBRID-MODULAR-IMPLEMENTATION-PLAN.md`.
- Cutover runbook: `docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md`.
- Kitchen PRD (phased-build model): `docs/kitchen-inventory/PRD.md`.

## 6. What could not be verified this session **[UNVERIFIED]**
- Exact monolith-decomposition percentage (estimated ~65%).
- Whether the `/n8n` rewrite is *currently* reachable from production (class-tutor has a fallback; status unconfirmed).
- GitHub branch-protection rule contents (the required check name is inferred from `ci.yml`, not read from Settings).
- Current Vercel utilization vs. the 100/day cap (not in-repo).
- GPU box arrival/config dates (procurement active; timeline unknown).

---

*Run the Test (Phil 4:8) on this doc: it is grounded (true), labels its own uncertainty (honorable/just), and points to the real sources (commendable). Where it could be wrong, it says so. Verification is the bar for "done" (DR-0076).*
