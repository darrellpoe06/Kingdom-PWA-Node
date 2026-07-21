# FEATURE / WORKFLOW REGISTER — "No Feature Left Behind"

**Status:** Layer 3 foundation (reference). The grounded inventory contract for the upcoming modular rebuild.
**Author:** Claude Code (read-only inventory pass), 2026-06-23.
**Repo:** `C:\Users\dpoe\Kingdom-PWA-Node` · **Branch inventoried:** `fix/church-live-build-exports` (= `origin/main` + a 3-file church-live build fix).

---

## Purpose

Darrell is migrating the PoeTech PWA off the 9,545-line monolith (`app/src/poe-financial-mvp-v28.jsx`) onto a new **modular** build, and demands **ZERO feature loss**. This register is the contract that guarantees it: every workflow that works is preserved, every one that's broken is redeployed/fixed, the feedback loop is made to close, and only orchestration that *actually works* is carried forward. Each row is grounded in a real file (`file:symbol`) — no guessing. Where I could not verify, the status is **UNKNOWN** and says why.

## How STATUS was determined (evidence basis)

- **CONFIRMED** — the app builds (`vite build` exit 0, verified 2026-06-23), AND the feature has a passing test and/or is wired into a live nav view AND its PR is on `origin/main`.
- **BROKEN** — a verified failure: doesn't build, a known incident, or a held/un-merged PR is the only home for a feature `main` already references.
- **UNKNOWN** — genuinely not verifiable from this read-only session: live n8n/NAS state (LAN/Tailscale-only, not reachable here), cloud-DB migration apply-state (no cloud query in hand), or a held PR not yet on `main`. Marked honestly; not asserted.

**Verification run on the inventoried branch (2026-06-23):**
- `vite build` → **exit 0, builds clean** (`dist/poe-financial-mvp-v28-*.js` 1,043 KB / 291 KB gzip).
- `vitest run` → **120 test files, 1,281 tests, all passing.**
- ⚠️ **`origin/main` does NOT build.** Its `app/src/lib/church-live.js` is missing the `liveStreamEmbedUrl` / `latestUploadEmbedUrl` exports the monolith imports → white screen on render. The fix lives only in the **un-merged PR #283** (this branch), which also finally adds the `npm run build` CI gate. **This is the #1 feature-loss threat and it blocks everything until merged.**

---

## 1. BUILD & CI — the foundation everything else rides on

| Item | What | Where | STATUS | Notes |
|---|---|---|---|---|
| Production vite build | Compiles the PWA | `app/package.json:build` | **BROKEN on main / CONFIRMED on this branch** | main missing church-live exports; fix = PR #283. |
| CI: lint + vitest | Gate on every PR | `.github/workflows/ci.yml:50-51` | CONFIRMED | 1,281 tests green. |
| CI: **vite build gate** | NEW — fails CI on broken build | `.github/workflows/ci.yml:54` | CONFIRMED (this branch only) | Closes the long-standing "CI is lint+test only, no build gate" gap (white-screen class of bug). **Carry forward — non-negotiable.** |
| CI: wf36 gatekeeper harness | Tests the quality-gatekeeper workflow logic | `ci.yml:64` → `scripts/test-wf36-quality-gatekeeper.js` | CONFIRMED | |

---

## 2. MODULE REGISTER

Nav top-level views (monolith `poe-financial-mvp-v28.jsx:1733`): `overview, books, inbound, rentals, projects, practice, opportunities, about, church, markets, notes, create, admin, center`.

### 2.1 Books / Finance (`view === 'books'`)

| Feature | What it does | Where (file:symbol) | STATUS | DB-backed (migration) |
|---|---|---|---|---|
| Entities & accounts | Multi-entity (personal + 3 LLCs) account book | `components/BooksEntities.jsx` · `lib/entities-sync.js`, `lib/accounts-sync.js` | CONFIRMED (`entity-pollution.test.js`, `sync-data-safety.test.js`) | yes — sync tables (0007 indexes) · apply-state UNKNOWN |
| Derived account balances | Balances computed from ledger, not stored field | `lib/account-balances.js` (via `financial-calcs.js`) | CONFIRMED (`calc-engines.test.js`) | derived — no table |
| Transactions CRUD + sync | Full transaction ledger | `lib/transactions-sync.js` | CONFIRMED (`sync-data-safety.test.js`) | yes — sync table |
| Derived Tx cash figures | right-now / after-upcoming / 30-60-90 from real tx | monolith books view; `lib/finance-activity.js` | **PARTIAL** — landed on main (#256) but a fuller version sits in **held PR #255** | derived |
| Debts / payoff | Debt list + payoff modeling | `components/Debts.jsx` · `lib/debts-sync.js` | CONFIRMED (`projectDebt.basic.test.js`) | yes — sync table |
| Contractors / 1099 | 1099-NEC tracking for the practice | `components/Contractors1099.jsx` · `lib/contractors-sync.js` | CONFIRMED (`flag-11-practice-annual-revenue.test.js`) | yes (0008) |
| Verify Balances gate | Reconcile-before-trust balance gate | `components/VerifyBalances.jsx` · `lib/reconciliation.js` | CONFIRMED (`reconciliation.test.js`) | yes (0036-transaction-reconciliation) · apply UNKNOWN |
| Incidents & reserves | Unexpected-outflow tracking | monolith seed `incidents`; `lib/incidents-sync.js` | CONFIRMED (`flag-10-incidents-reserves.test.js`) | yes — sync table |

### 2.2 Real Estate (`view === 'rentals'`)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Rentals portfolio (11 doors) | Per-door rent/mortgage/status | `components/Rentals.jsx` · `lib/rental-portfolio.js`, `lib/rentals-sync.js` | CONFIRMED (`rental-portfolio.test.js`, `rentals-sync.merge.test.js`) | yes — top-level rentals sync (slug in `links` jsonb) |
| Derived "11 Doors" rollup | Header derived from real records (#271) | `lib/rental-portfolio.js` | CONFIRMED | derived |
| Leases / rent_payments sync | Per-lease payment sync | (follow-up, per memory `rentals_sync_state`) | **UNKNOWN** — follow-up not confirmed landed | yes (planned) |
| Property photos (NAS bridge) | Photos served from NAS | `lib/nas-photos.js`, `lib/photo-source-health.js` · `infra/n8n/wf-property-photos.json` | CONFIRMED app-side (`nas-photos.test.js`, `photo-source-health.test.js`); **NAS workflow import UNKNOWN** | NAS bind-mount |

### 2.3 Inbound / Practice / Markets / Opportunities

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Inbound inquiries (TLC) | Counseling intake → status pipeline | `components/Inbound.jsx` · `lib/inquiries-sync.js` | CONFIRMED (`inbound-convert.test.js`) | yes — sync table |
| Practice ops (TLC) | MSW practice revenue/contractors | `components/Practice.jsx` | CONFIRMED (`flag-11-practice-annual-revenue.test.js`) | partial |
| Markets | Market/opportunity surface | `components/Markets.jsx` | CONFIRMED (builds; no dedicated test) | no |
| Opportunities / DevOps | Business dev surface | `components/DevOps.jsx:Opportunities` | CONFIRMED (builds) | no |
| Cart / commerce scaffold | Cart surface | `components/Cart.jsx` | UNKNOWN — present, no test, usage unclear | no |
| Imported transactions | Bank-imported tx view | `components/Imported.jsx` | CONFIRMED — direct-Funnel fix (#265) | reads n8n `/imported` |

### 2.4 Church (`view === 'church'`) — sub-views: home, engagement, choir, pulpit, videowall, observe, learn, conference, events

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Church home + giving | Service times, prayer, **Give** floater/panel | monolith `Church`; `components/ChurchGiving.jsx` · `lib/giving.js` | CONFIRMED (#261; `church-giving-render.test.jsx`, `giving.test.js`) | — |
| **Church Live** (stream embed) | Rolling latest-upload / live embed | `lib/church-live.js:liveStreamEmbedUrl,latestUploadEmbedUrl` | **BROKEN on main / FIXED in PR #283** | YouTube channel embed |
| Engagement (trivia + messages) | Sun/Wed message → trivia wedge | `components/Engagement.jsx` · `lib/engagement-sync.js` | CONFIRMED (wired) | yes (0009, 0010, 0019-rescope) |
| Choir module | Director surface: music/schedule/roster | `components/Choir.jsx` · `lib/choir-sync.js` | CONFIRMED (`choir-sync.test.js`, `choir-sync-writes.test.js`) | yes (0011) · apply confirmed (memory) |
| Choir Song Workshop | Lead/co-lead assignment, lyrics | `components/ChoirSongWorkshop.jsx` · `lib/song-workshop-sync.js` | CONFIRMED (#241; `song-workshop-sync.test.js`, `choir-song-workshop-render.test.jsx`) | yes (0036-choir-song-workshop, 0018-song-lyrics) |
| Pulpit (BG's study) | Staff-gated sermon study + corpus prep | `components/Pulpit.jsx` · `lib/pulpit-prep.js` | **UNKNOWN** — built in **held PR #200**; reads `choir_sermons` (no new migration) | reuses choir_sermons |
| The Word / re-preach lineage | Speaker canonicalization + re-preach credit | `lib/youtube-title-parse.js`; speaker entity | CONFIRMED (#249; `speaker-canonical.test.js`, `theword-public-library.test.js`) | yes (0037-speaker-canonical, 0038-sermon-repreach-lineage) |
| Video Wall (CapEx) | Sanctuary LED wall facilities project | `components/ChurchVideoWall.jsx` · `lib/video-wall-sync.js` | **UNKNOWN** — gated; migration 0030 schema-only, **seed/apply UNKNOWN** | yes (0030-church-capital-projects) |
| Church Observation/Security | Sanctuary observation surface | `components/ChurchObservation.jsx` | UNKNOWN — staff-gated, no dedicated test | — |
| One Voice (church → PoeTech) | Routed congregation input | `components/ChurchOneVoice.jsx`, `OneVoiceInput.jsx` · `lib/one-voice-routing.js`, `one-voice-surfaces.js` | CONFIRMED (`one-voice-routing.test.js`, `one-voice-surfaces.test.js`, `one-voice-dispatch.test.js`) | yes — routed |

### 2.5 Conference / Event Center (Church > conference / events)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Conference module | Conference hub | `components/ConferenceModule.jsx` · `lib/conference.js` | CONFIRMED (`conference.test.js`) | yes (0023-conference-event-center) |
| Public registration (no-login) | Open signup funnel | `components/ConferenceRegister.jsx`, `ConferenceRegisterForm.jsx` · `lib/conference-register.js` | CONFIRMED (`conference-register.test.js`, `conference-register-closed-loop.test.js`, `conference-public-registration-security.test.js`) | yes (0027) · **applied (memory)** |
| Account on-ramp | Optional reg → account link | `components/ConferenceAccountOnRamp.jsx` · `lib/conference-identity.js`, `conference-link.js` | CONFIRMED (#225/#226; `conference-onramp-render.test.jsx`, `conference-signup-funnel.test.js`) | yes (0032) · **applied** |
| Anticipated vs Actual variance | Day-of check-in + variance | `components/ConferenceVariance.jsx` · `lib/conference-variance.js` | CONFIRMED (#223; `conference-variance.test.js`, `-closed-loop`) | yes (0031) · **applied** |
| Setup checklist | Conference setup gate | `components/ConferenceSetupChecklist.jsx` · `lib/conference-setup.js` | CONFIRMED (`conference-setup.test.js`) | — |
| Event Center / Venues | Community venue bookings (no-double-book) | `components/EventCenterModule.jsx`, `EventManagement.jsx`, `VenueRequest*.jsx` · `lib/venue-rental.js`, `venue-cast.js` | **UNKNOWN** — held Tier C (PR #220) behind July conference; tests pass (`venue-rental.test.js`) | yes (0034-venue-bookings, 0024-conference-venues) |

### 2.6 Learn (Church > learn)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Learn framework | Shared skill-levels/quiz/graduate engine | `lib/learn-framework.js`, `learn-engagement.js` | CONFIRMED (`learn-framework.test.js`, `learn-integration.test.js`) | yes (church classes) |
| Youth A.I. class | Church LLM youth course | `components/ChurchLearn.jsx` · `lib/church-classes.js`, `class-tutor.js` | CONFIRMED app-side (#167/#179; `church-classes.test.js`, `class-tutor.test.js`); **live tutor route UNKNOWN** (awaits NAS deploy of `wf-class-tutor.json`) | yes |
| All-ages conference class | 3 paced lanes | (branch `feat/conference-all-ages-class`) | **UNKNOWN** — Tier C, not merged | yes |
| Broadcast / media class | 9-wk media-team course | `lib/broadcast-class.js`, `broadcast-sops.js` | CONFIRMED tests (`broadcast-class.test.js`); **branch not PR'd** | yes |
| Infrastructure class + SOPs | Infra course | `lib/infrastructure-class.js`, `infrastructure-sops.js` | CONFIRMED (`infrastructure-class.test.js`) | yes |
| Sovereign A.I. course | "Why We Build Local" 4th course | (held **PR #273**) | **UNKNOWN** — held, not on main | yes |

### 2.7 Workspace / Creation (`view === 'create'`, Notes group)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Creation Workspace | In-app doc/image compose → PNG/JPG export | `components/CreationWorkspace.jsx` · `lib/creation-workspace.js`, `workspaces-sync.js` | CONFIRMED on main (lazy-imported `monolith:86`; `creation-workspace.test.js`) — **note PR #250 still shows open/hold; treat as superseded/landed, verify** | yes (0037-creation-workspaces) |
| Thinking Space | Notes/thinking surface | `components/ThinkingSpace.jsx` | CONFIRMED (builds) | local/sync |

### 2.8 Study (`view === 'notes'`/Study)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Study (Darrell's Yahweh study) | Renders dated Yahweh/Word discussions | `components/Study.jsx` · `lib/study-space.js` | CONFIRMED (`study-space.test.js`) | reads `docs/.../yahweh-discussions.md` |
| Eternal Algorithms library | Frameworks↔outcomes library | `components/EternalAlgorithms.jsx` · `lib/eternal-algorithms.js` | CONFIRMED (#209; `eternal-algorithms.test.js`, `-render`) | yes |

### 2.9 Projects / Build (`view === 'projects'`)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Projects management cockpit | Lifecycle stages, archive, discussions | `components/Projects.jsx` · `lib/project-management.js`, `projects-sync.js` | CONFIRMED (#237; `project-management.test.js`, `projects-lifecycle-sync.test.js`, `projects-scope.test.js`) | yes (0035-discussions, 0008-lifecycle) |
| Discussions | Directive/decision/reflection/handoff | `components/Discussions.jsx` · `lib/discussions-sync.js`, `discussions.js` | CONFIRMED (`discussions.test.js`) | yes (0035) · apply UNKNOWN |
| Build Board | Build/ship status board | `components/BuildBoard.jsx` | CONFIRMED (`build-board-sort.test.js`) | reads orchestration data |
| **Concerns & Solutions board** | feedback → CONCERN/SOLUTION/TARGET/STATUS | **held PR #277** `feat/concerns-board-screen` | **BROKEN (not on main)** — the feedback-loop closure surface; see §4 | yes (PR #277 migration 0038 — **number collision** with re-preach 0038) |
| Loop Health self-review | App reviews its own loops | `components/LoopHealth.jsx` · `lib/loop-health.js` | CONFIRMED (#166; `loop-health.test.js`) | yes |
| Orchestrator hand-off (braked) | Records intent, never dispatches | `lib/orchestrator-handoff.js` | CONFIRMED (`orchestrator-handoff.test.js`, `wake-handoff.test.js`) | yes — Cage default-deny |

### 2.10 Command, Control & Serve Center — C2S (`view === 'center'`, family-gated)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| C2S capstone seat | Composes ops surfaces under See/Command/Control/Serve | `components/CommandServeCenter.jsx` · `lib/command-serve-center.js` | CONFIRMED (#238 on main; `command-serve-center.test.js`) | composes existing |
| Ops Board | Operational board | `components/OpsBoard.jsx` | CONFIRMED (builds) | yes |
| Quality Proof | Quality-gate receipts surface | `components/QualityProof.jsx` · `lib/quality-proof.js` | CONFIRMED (`quality-proof.test.js`, `-render`) | yes |
| Wake Orchestrator | Wake/dispatch cockpit (braked) | `components/WakeOrchestrator.jsx` · `lib/wake-orchestrator.js` | CONFIRMED (`wake-orchestrator.test.js`) | yes |
| Conflict Loop | Conflict-rate trend surface | `components/ConflictLoop.jsx` · `lib/conflict-loop.js` | CONFIRMED (`conflict-loop.test.js`) | reads `conflict-events.jsonl` |
| LLM Health card | Live Ollama `/api/ps` health | `components/LlmHealth.jsx` · `lib/kpi-status.js` | CONFIRMED app-side (#173; `llm-health.test.js`); feed **LIVE-verified (memory)** via `wf-llm-health` | n8n `/n8n`→Ollama |
| Dispatch panel | System-visibility readout | `components/DispatchPanel.jsx` · `lib/dispatch.js` | CONFIRMED (`dispatch.test.js`); **NAS page pair live-state UNKNOWN** | NAS bind-mount JSONL |

### 2.11 Admin / Governance (`view === 'admin'`)

| Feature | What it does | Where | STATUS | DB-backed |
|---|---|---|---|---|
| Governance / Decision queue | Governor-gated review of decisions | `components/GovernanceQueue.jsx` | CONFIRMED (`governance-queue.test.js`) | yes |
| Governor Review feed | Freshness-only review feed | `components/ReviewFeed.jsx`, `FreshnessDot.jsx` · `lib/freshness.js`, `review` | CONFIRMED built (#105; `review-feed.test.js`, `freshness.test.js`); **needs `VITE_REVIEW_TOKEN` env to light up → UNKNOWN if set** | reads `wf-review-feed` |
| LLM Review | In-app LLM-review surface | `components/LlmReview.jsx` · `lib/llm-review.js` | CONFIRMED (`llm-review.test.js`) | `wf-llm-review` |
| App Interest capture/admin | Waitlist/interest | `components/AppInterestCapture.jsx`, `AppInterestAdmin.jsx` · `lib/interest-sync.js` | CONFIRMED (`install-help.test.js`) | yes (0025-app-interest) |
| Workflow status | n8n workflow status surface | `components/WorkflowStatus.jsx` | CONFIRMED (`workflow-status.test.js`) | `wf-workflow-status` |

### 2.12 Cross-cutting primitives (used by every module — must survive the rebuild)

| Primitive | What it does | Where | STATUS |
|---|---|---|---|
| Multi-point auth | ≥2-of-3 sign-in (identity+PIN+device) | `lib/multi-point-auth.js`; `PasswordAuth.jsx`, `PinGate.jsx`, `PrivateGate.jsx`, `TrustedDevices.jsx` | CONFIRMED — on main (#133; `multi-point-auth.test.js`, `-family-gating`, `-no-lockout`) · migration 0022 **applied** |
| Tenancy / identity boundary | RLS instance_id + family-email gating | `lib/sync-identity.js`, `church-instance.js`, `access-gate.js`; `scripts/tenancy-guard.mjs` | CONFIRMED (`tenancy-guard.test.js`, `access-gate.test.js`, `sync-identity.test.js`) |
| Voice input (type-or-speak) | One hook reused everywhere | `lib/voice-dictation.js:useVoiceDictation` | CONFIRMED (`voice-dictation.test.js`) — ~11 surfaces still to wire |
| Text size (SEE a11y) | Root-rem large-print scaling | `lib/text-size.js`; `TextSizeControl.jsx` | CONFIRMED (#232; `text-size.test.js`) |
| Read-aloud TTS (HEAR a11y) | Segmented utterance TTS | `lib/tts.js`; `TTSControl.jsx` | CONFIRMED (`tts.test.js`) |
| Photo lightbox | Reusable gallery lightbox | `components/Lightbox.jsx` | CONFIRMED (`lightbox-render.test.js`, `lightbox-interaction.test.js`) |
| Life Gallery | Family photo gallery | `components/LifeGallery.jsx` · `lib/nas-photos.js` | CONFIRMED app-side; NAS feed UNKNOWN |
| Section error boundary | Per-tab white-screen brake | `components/SectionBoundary.jsx`, `ErrorBoundary.jsx` · `lib/net.js` | CONFIRMED (break-it ship gate) |
| Input sanitization | Anon-form hardening | `lib/sanitize-input.js` | CONFIRMED (`sanitize-input.test.js`, `public-form-*`) · migration 0033 |
| Number trace / traceable number | Every figure traces to source | `lib/number-trace.js`; `TraceableNumber.jsx` | CONFIRMED (`number-trace.test.js`) |

---

## 3. ORCHESTRATION — what actually works vs. needs-redeploy

### 3.1 GitHub automation (CONFIRMED — runs in CI, verifiable here)

| System | What | Where | STATUS |
|---|---|---|---|
| Auto-open PR | push `feat/|fix/|merge/|docs/` branch → opens PR | `.github/workflows/auto-open-pr.yml` | CONFIRMED |
| Auto-merge lane | green `check_suite` → merge + sweep-all eligible; `hold` label opts out | `.github/workflows/auto-merge.yml` | CONFIRMED — **but see migration gap below** |
| db-migrate | push to `infra/supabase/migrations-auto/**` → apply to cloud | `.github/workflows/db-migrate.yml` | **BROKEN-by-design gap** — auto-merge via `GITHUB_TOKEN` does **not** trigger `db-migrate` (GitHub suppresses token-triggered workflows). Merged migrations silently un-applied. Recover: `gh workflow run db-migrate.yml`. **Top rebuild risk — wire a real trigger.** |
| Cloudflare Pages deploy | off-Vercel deploy pipeline | `.github/workflows/deploy-cloudflare-pages.yml` | **GATED OFF** (`CF_PAGES_ENABLED`) — awaiting Darrell's CF creds + DNS cutover (PR #210, #278) |
| daily-review | freshness review | `.github/workflows/daily-review.yml` | **INACTIVE** — cron commented out, manual `workflow_dispatch` only |
| pm-synth | PM synthesis | `.github/workflows/pm-synth.yml` · `scripts/pm-synth.mjs` | manual `workflow_dispatch` only |

### 3.2 Quality guards (CONFIRMED — proven-to-catch gates, run via `npm run verify` / dedicated scripts)

`scripts/contrast-guard.mjs` · `fab-overlap-guard.mjs` · `tab-overflow-guard.mjs` · `grant-guard.mjs` · `tenancy-guard.mjs` · `conference-link-guard.mjs` · `conference-rls-guard.mjs` · `feedback-area-guard.mjs` · `security-headers-guard.mjs` · `workflow-conformance.mjs` · `quality-manifest.mjs` — **all CONFIRMED** (each has a matching `*-guard.test.js` / proven-to-catch test). These ARE the sellable "prove-it, don't claim-it" product. **Carry every one forward.**

### 3.3 Local orchestrators (scripts — present, runnable; "as Darrell needs" = caveated)

| Orchestrator | What | Where | STATUS |
|---|---|---|---|
| Orchestrator v0 / v05 | Lane dispatch / integration | `scripts/orchestrator-v0.mjs`, `orchestrator-v05.mjs`, `scripts/orchestration/lanes.sh` | PRESENT — **caveat:** memory `feedback_orchestration_not_working_well` (2026-06-16): multi-lane in practice causes tree-contention/collisions. Darrell's stated preference: **ONE coherent owner end-to-end**, build into the app through the safety gate. Carry the *tooling* (Workflow/Agent worktree isolation), not the hand-cranked multi-lane git. |
| Conflict analytics | Ranks hot files (monolith #1), conflict-rate trend | `scripts/orchestration/conflict-analytics.mjs`, `conflict-map.sh` | CONFIRMED (`conflict-analytics.test.js`) |
| LLM review | Offload review to an LLM | `scripts/orchestration/llm-review.mjs` | CONFIRMED (`llm-review.test.js`) |
| Wake router | Routes wake events | `scripts/wake-router.mjs` | CONFIRMED (`wake-handoff.test.js`) |
| Fruit scout | Scouts improvement opportunities | `scripts/fruit-scout.mjs` | PRESENT — no test |

### 3.4 n8n workflows — **LIVE STATE UNKNOWN FROM HERE**

47 workflow definitions live at `docs/00-foundations/n8n-workflows/*.json`; only 7 photo/bank workflows are mirrored in `infra/n8n/`. **The repo-exported `active` flag is a stale snapshot, NOT live NAS state** — n8n's real active/failing status sits on the NAS (LAN/Tailscale-only, not reachable in this read-only session). Marked UNKNOWN except where memory/CI gives a confirmed signal:

| Workflow | Purpose | Confirmed signal | LLM? |
|---|---|---|---|
| `wf-llm-health` | Reads Ollama `/api/ps` | **LIVE-verified** (memory; n8n id `ofRyws51r5kqSHxp`, Ollama via `host.docker.internal`) | reads local |
| `wf-dispatch-status` + `-page` | NAS system-visibility readout | deployed via `nas-update-wf-dispatch-status-pair.sh` — **live UNKNOWN** | no |
| `36-quality-gatekeeper` | Quality gate (wf36) | CI harness CONFIRMED; NAS-active UNKNOWN | yes (classify) |
| `wf-class-tutor` | Church class tutor | **NOT deployed** — awaits NAS deploy (memory) | yes (local qwen2.5) |
| `wf27`/`wf31` feedback reel + **autonomous builder** | 5-min feedback reel / self-build | **QUARANTINED** after 2026-06-06 runaway (`docs/00-foundations/_quarantine/wf-autonomous-builder.json`); three-brakes rule now binding | yes |
| `14-gmail-finance-ingest`, `15-bank-ofx-watcher`, `18-imported-transactions-api` | Finance ingest | app-side Imported CONFIRMED (#265); NAS-active UNKNOWN | no |
| `37-whisper-stt-voice-input` | Sovereign STT | UNKNOWN (NAS) | local Whisper |
| `wf-photo-upload`, `wf-property-photos`, `wf-family-photos`, `wf-property-history`, `wf-link-title`, `wf-bank-statement-attachments(-christina)` | Photo/bank bridges | `infra/n8n/` JSON present; import/active UNKNOWN | no |

**Rebuild action:** a live `n8n` active-status audit must be run **from the NAS-capable session** (this cloud session cannot reach the LAN). Until then every n8n row is UNKNOWN-live.

---

## 4. FEEDBACK LOOP — does in-app feedback → Concerns board CLOSE end-to-end?

**Verdict (updated 2026-07-21, DR-0219 spec-conformance review): the UI loop CLOSED — the Concerns board landed. The remaining open item is narrower: confirming a human dispositions to `closed` in live production.**

- **Capture (works):** `lib/feedback-sync.js:uploadFeedback()` writes feedback (with screenshots) to the Supabase `feedback` table (migrations 0003, 0026). A feedback panel is threaded into Projects (`Projects.jsx feedbackPanel`). Tests: `feedback-screenshots.test.js`, `feedback-area-coverage.test.js`. ✅
- **Closure (LANDED — the earlier "only in held PR #277" verdict is now stale):** the **Concerns & Solutions board** is on the tree and wired: `app/src/components/ConcernsBoard.jsx`, `app/src/lib/concerns.js` (+ `evaluateFeedback` from `feedback-triage.js` auto-triages each row at `concerns.js:340`), cross-device `app/src/lib/concerns-sync.js` registered in the monolith's sync registry, and the migration shipped as **`0039-concerns-board.sql`** — the exact 0038→0039 renumber this doc said "must" happen. `CONCERN → SOLUTION → TARGET → STATUS` status columns exist (`CONCERN_COLUMN_OF`). ✅
- **Migration collision:** RESOLVED — the board migration is `0039-concerns-board.sql`; no longer colliding with `0038-sermon-repreach-lineage.sql`. ✅
- **Still open (live-verify, not a build gap):** that a human/Governor actually moves each concern to `closed` **in production** is the live-review item (DR-0104 "review as a user") — the mechanism is present; the habit/throughput is what remains to confirm. **re-review: 2026-08-04.**
- **Also open (separate):** the **24h-acknowledge digest + evening ship-summary** (BUSINESS-PROCESS-CONNECTIONS "every family voice acknowledged within 24h") has **no in-repo implementation** — it was an n8n cron (now zero-n8n, DR-0218) and its sovereign rebuild is timer-driven → Tier C + three brakes (DR-0068). **re-review: 2026-08-04.**

**Net:** the long-standing "loop doesn't close" gap is substantially closed at the UI/data layer; what remains is the human-disposition throughput (live-verify) and the acknowledgement digest (a Tier-C sovereign rebuild), both dated above rather than left silent.

---

## 5. OPEN-SOURCE / LOCAL-LLM FALLBACK (cap-resilience requirement)

Requirement: when the vendor LLM (Claude/Gemini) is capped or offline, work continues on local Ollama/Hermes on the NAS. Per-workflow routing readiness:

| Workflow / surface | LLM task | Local-able NOW (Ollama/Hermes/qwen2.5 on NAS)? | Needs GPU "Forge" node? |
|---|---|---|---|
| `wf-class-tutor` | Tutoring Q&A | ✅ YES — memory: local-first qwen2.5 already designed | no |
| `wf-llm-review` / `scripts/orchestration/llm-review.mjs` | Drafting review notes | ✅ YES (routine drafting) | no |
| `27-foundation-agent` | Summarizing foundation docs | ✅ YES (summarize) | no |
| `36-quality-gatekeeper` | Classify pass/fail | ✅ YES (classify/tag) | no |
| `wf-freshness-review` / `wf-review-action` | Tag/triage freshness | ✅ YES (tagging) | no |
| Engagement trivia generation | Generate Qs from sermon | ✅ YES (generate/summarize) | no |
| Sermon/speaker tagging | Canonicalize/tag | ✅ YES (tag) | no |
| `wf-llm-health` | Reads Ollama status | ✅ already local | no |
| `16-cross-verify-engine` | Deep cross-verification | ⚠️ partial — light checks local; deep reasoning | **likely Forge** |
| `17-gemini-deeper-reasoning` | Heavy reasoning (vendor today) | ❌ vendor-bound now | **Forge** |
| Autonomous builder (quarantined) | Agentic code-gen | ❌ | **Forge** (+ three-brakes) |

**Design rule for the rebuild:** every LLM call site routes through one model-broker (KPI/token-aware, per memory `orchestrated_lanes_operating_model`) that prefers local for **drafting / summarizing / tagging / classifying** and only escalates **agentic coding / deep reasoning** to vendor (or the not-yet-procured GPU Forge node). `wf-llm-health` already provides the local-availability signal to gate on. This makes orchestration cap-resilient **by design**, not by luck.

---

## 6. DB MIGRATIONS — applied-to-cloud status

Migrations `0001`–`0038` in `infra/supabase/migrations-auto/`. **Cloud apply-state cannot be queried from this session** → UNKNOWN unless memory confirms applied.

**Confirmed applied (memory):** 0022 (multi-point auth), 0027 (conference public reg), 0031 (anticipated/actual), 0032 (reg account link), 0037-speaker-canonical.
**Confirmed applied-risk:** any migration merged via the **GITHUB_TOKEN auto-merge path may be silently un-applied** (§3.1 db-migrate gap) — re-broke Choir reads on 2026-06-16. **Audit every migration's cloud presence before the rebuild trusts it.**

⚠️ **DUPLICATE MIGRATION NUMBERS** (must be deduped/ordered for the new build's allocator):
- `0019` — engagement-rescope **and** restore-service-role-grants
- `0022` — church-team-documents **and** multi-point-auth
- `0024` — conference-venues **and** restore-authenticated-grants
- `0036` — choir-song-workshop **and** transaction-reconciliation
- `0037` — creation-workspaces **and** speaker-canonical-entity
- `0038` (merged: sermon-repreach-lineage) collides with **held PR #277**'s Concerns board 0038.

---

## 7. SUMMARY

### Counts (feature/workflow rows across §2; primitives + orchestration counted)

- **CONFIRMED: ~58** — builds + test + on-main + wired. The large majority of the app is intact and verifiable.
- **BROKEN: 4** — (1) `origin/main` production build (church-live exports, fix in PR #283); (2) Concerns & Solutions board / feedback-loop closure (held PR #277, not on main); (3) `db-migrate` token-trigger gap (silently un-applies merged migrations); (4) duplicate migration numbering (apply-order hazard).
- **UNKNOWN: ~22** — every live n8n/NAS workflow state (not reachable here), held-PR features (#220 venues, #200 Pulpit, #273 Sovereign AI, all-ages class, broadcast branch), cloud migration apply-state, Video Wall seed/apply, Review-feed env token, Cart usage.

### Top BROKEN / UNKNOWN items that threaten feature loss

1. **`origin/main` does not build** — the whole PWA white-screens until **PR #283** merges (this branch fixes it + adds the build CI gate). *Merge this first.*
2. **Feedback loop does not close** — capture works, but the Concerns board is stuck in held **PR #277** with a 0038 migration collision. The loop's human-disposition back-half is also unbuilt.
3. **db-migrate trigger gap** — auto-merged migrations are silently un-applied; cloud schema may not match the repo. Audit + re-wire before the modular build trusts any table.
4. **Live n8n/NAS orchestration is UNKNOWN from here** — 47 workflow defs, real active/failing state only knowable from the NAS-capable session. Several Darrell-critical pieces (class-tutor live route, dispatch-status pair, finance ingest, Whisper STT) are unverified-live.
5. **Held Tier-C features at feature-loss risk if abandoned:** Venues/Event Center (#220), Pulpit (#200), Sovereign A.I. course (#273), all-ages + broadcast classes (un-PR'd branches). The hybrid-modular plan itself is in held **PR #266 (DR-0078)** — the rebuild's own blueprint.
6. **Duplicate migration numbers** (0019/0022/0024/0036/0037/0038) — the new allocator must dedupe before replaying schema.

### Feedback-loop verdict (one line)

**OPEN GAP — confirmed.** In-app feedback is captured to Supabase, but the surface that reads it back into tracked Concerns → Solutions → closed status is **not on `main`** (held PR #277, with a migration collision), so the loop **does not close end-to-end** today. Closing it — UI **and** the human-disposition back-half — is a first-class requirement for the modular rebuild.

---

*Read-only inventory. No app behavior was changed. Live NAS/n8n state and cloud-DB apply-state must be confirmed from the NAS-capable session before the rebuild treats any UNKNOWN row as preserved.*
