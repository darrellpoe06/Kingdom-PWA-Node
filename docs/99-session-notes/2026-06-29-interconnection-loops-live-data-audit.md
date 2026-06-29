# Interconnection-loop live-data audit — 2026-06-29

**Mandate (Darrell):** "The PoeTech App build has a lot of promises — make sure all
the loops of interconnected modules are actually moving LIVE data." Verify each
module-to-module data loop end-to-end (source → transform → destination → display),
fix the ones that aren't live, prove it in-app, guard against silent regression.

**Method.** Six flagship loops traced end-to-end against the real code (file:line),
adversarially (default to PARTIAL/STATIC unless propagation is provable). "Moves
live data" = all four hold: (1) source real + persisted to Supabase, (2) destination
reads the SAME persisted source (not a static copy), (3) destination renders the
live value, (4) a source change propagates. Verified shapes, not prose.

## The loop map (verdicts + evidence)

### 1. Church content fan-out (FLAGSHIP) — was PARTIAL → now improved
- **The Word** — CONFIRMED-LIVE. `choir-sync.js` writes `choir_sermons`; `Pulpit.jsx` `subscribeSermons` (realtime).
- **Choir / Songbook** — CONFIRMED-LIVE. `choir_songs` ← archive import; `Choir.jsx subscribeSongs` → `ChoirSongbook buildSongbook` (derived).
- **Scripture "appearances"** — was STATIC (engine starved with `[]`), **FIXED → LIVE**. The monolith holds no sermon/song state; passing `data.sermons` would have passed empties. `ScriptureLibrary.jsx` now subscribes `subscribeSermons`/`subscribeSongs` itself and feeds `ScriptureConnections` (`appearancesFor` reads `scriptureRef/title/serviceDate`, which `toSermonShape/toSongShape` provide — field contract verified).
- **Trivia** — BUILDING. `trivia_questions` table + review pipeline exist, but nothing WRITES questions yet (blocked on the church-inbox / Whisper extraction of Bishop Gwin's Wednesday questions) and `Engagement.jsx` renders the fixed anchor set. Surfaced honestly as *building*, never green.
- **Learn / Discernment** — STATIC-BY-DESIGN. Authored, version-controlled syllabus/issue content; no service-video producer feeds them (NAS-gated). Legitimate, not a defect.

### 2. CRM / revenue federation — was PARTIAL → now improved
- **crm_leads / inquiries** — CONFIRMED-LIVE.
- **practice_leads → CRM board** — was STATIC-OR-BROKEN (the board was blind to the revenue-team funnel; `leadFromPracticeAcquisition` existed but was never called). **FIXED → LIVE**: monolith passes `practiceLeads={data.practiceLeads}`; `CRM.jsx` federates them via `leadFromPracticeAcquisition`, deduped by id.
- **conference / subscriber / booking funnels** — BUILDING (no live source path; test-only adapters). Larger build, surfaced honestly.

### 3. Inventory → financial — inventory half LIVE, financial end BUILDING
- **Movement ledger → derived on-hand** — CONFIRMED-LIVE. `onHandByItem` reduces the append-only `inventory_movements`; no stored on-hand field.
- **Count → ledger reconcile** — CONFIRMED-LIVE. `reconcileCount → recordMovements` writes variance adjustments back.
- **Recipe costing** — CONFIRMED-LIVE. `costRecipe` prices against live `inventory_items` unit costs.
- **Purchasing draft → forecast** — BUILDING. `buildProjection` ingests cash/salaries/rentals only; `purchasing.js` is a pure engine with no surface, no sync, no forecast input. Honestly *building* (Chef Mario P4).

### 4. Choir shared content → order of service — CONFIRMED-LIVE (4/5)
- Songbook, renditions, SME notes, and the master **order-of-service** all read the ONE `choir_songs` stream live; the order soft-links real songs by id (`deriveSectorView`), not free text.
- **Presenter (worship set list)** — BUILDING. `worship-presenter.js` is built + tested but mounted by no component; needs a lyrics→sections mapper + a worship surface.

### 5. Feedback → Concerns → proof — CONFIRMED-LIVE
- `feedback` persists; `ConcernsBoard composeConcerns` auto-feeds from real feedback; concerns persist + render; QualityProof reads the real manifest + LIVE CI (never painted). **Added**: a `feedback-concerns` freshness row to `loop-health.js` so the loop now self-reports stagnation (closes the one gap the trace found).

### 6. Content → courses → books — sound (LIVE + by-design)
- Added recipes persist live; courses run one shared `lesson-flow` primitive over authored syllabus content (static-by-design); created documents present live via the shared `Presenter`. Recipe-cost → books is by-design display-only ("money stays the owner's hand"), not a defect.

## What was fixed (genuinely moves live data now)
1. **Scripture appearances** — `ScriptureLibrary` subscribes the live `choir_sermons`/`choir_songs`; the cross-module "where this verse shows up in our sermons/songs" web is live instead of always-empty.
2. **CRM practice-leads federation** — the revenue-team funnel now lands on the one CRM board.
3. **Feedback→Concerns freshness** — now self-reports in Loop Health.

## How it's proven in-app (QCHP / proof surface)
- New **`scripts/interconnect-manifest.mjs`** — a file-verified registry of every loop's source + the destination wiring tokens. Baked into the build as `__INTERCONNECT_LOOPS__`.
- New **"Interconnection loops"** section in **QualityProof** (C2S → SEE): each loop shows live source → destination, green only when wired live, honest *building* (slate) for the unbuilt arms, and **"went static — re-wire"** (red) if a destination ever stops reading its live source. Nothing painted.
- New **`scripts/interconnect-guard.mjs`** — fails the build (CI step + vitest, proven-to-catch) if any LIVE loop loses its wiring. A loop can no longer silently go static.

## Honest "not yet live" list (surfaced as BUILDING, never green)
Trivia producer; purchasing→forecast; presenter worship set list; conference/subscriber/booking → CRM. Each carries its real *why* in the manifest's `awaiting`.

## Gates (clean worktree, CI-equivalent)
lint 0-warnings ✓ · interconnect-guard ✓ · full vitest 2527/2527 ✓ · build ✓.
