# Order of Service — closed learning loop (plan → actual → blueprint → next plan)

**Date:** 2026-06-25
**Branch / worktree:** `feat/service-order-learning-loop` (worktree `C:\Users\dpoe\kpn-wt-service-loop`, off `origin/main` @ 6876e7f)
**Directive (Darrell):** *"Order of service can also be updated based on what occurred and becomes a blueprint for the next service."* Build the order-of-service as a closed learning loop, not a one-off plan.

## What existed (the PLANNED side — already merged on main)

- `lib/service-program.js` — ONE master `church_service_programs` row/service + ordered `church_service_segments`; pure `deriveSectorView` (per-sector lens), `reflowProgram` (proportional time reflow, sermon fixed), finalizer-circle access (`user_is_worship_finalizer`), `church_service_program_changes` (who-changed-what trail).
- `components/ServiceProgram.jsx` — Church → **Order of Service** tab; lens strip, reflow control, finalizer management, change trail.
- `0042-service-program.sql`, `0043-worship-finalizers.sql`.
- `lib/worship-presenter.js` `masterProgramToSetList()` seam; `lib/choir-renditions.js` Song→Renditions descriptive model; `lib/conference-variance.js` `varianceCell` primitive.

The "full-harvest pipeline" (lane `local_1c5ad610`) and choir lane (`local_e20f36cb`) are **Cowork orchestrator lane ids, not code**. The real source of "what occurred" is the service video (`choir_schedule.youtube_url`) → the NAS SME pipeline (`infra/nas-sme-pipeline`, Whisper→Ollama, sovereign, manual) + the real `choir_songs` / `choir_sermons` rows.

## What this build adds (the ACTUAL side + the loop)

The loop: **PLAN → execute → HARVEST what occurred → RECONCILE planned-vs-actual → the reconciled actual becomes the BLUEPRINT that seeds the next service of the same type → next PLAN.** Each service improves the next.

1. **PLANNED** — unchanged (confirmed). The master program is what we intend.
2. **ACTUAL** — `lib/service-actuals.js` + `church_service_segment_actuals` (0045): one row per thing that actually occurred, in actual order, soft-linked to its planned segment (`planned_segment_id` null = added live). Carries `actual_minutes`, real `actual_songs` / `actual_sermon_id`, a note, and **honest provenance** (`source: manual | harvest`, `confidence`, `video_id`, `at_seconds`, `needs_review`) mirroring the renditions archive honesty.
3. **RECONCILE** — pure `reconcileService(plannedSegments, actualItems, { reconciled })` derives, deterministically: **as-planned / ran-long / ran-short / reordered** (from minutes drift + position) | **added** (actual with no plan) | **skipped** (planned segment with no actual, once reconciled — derived, never invented). Plus planned-vs-actual totals + `varianceCell`. `markReconciled()` stamps the program recap (real start/total/notes + the harvest source it was reconciled from).
4. **UPDATE** — the program record gains `actual_start_time / actual_total_minutes / actual_notes / harvest_source / reconciled_at / reconciled_by` and the reconcile feeds the existing change-log (institutional memory) with `reconcile` / `capture-actual` / `blueprint-seed` actions.
5. **BLUEPRINT** — pure `blueprintFromActual(...)` turns the reconciled actual into `seedDefaultOrder`-shaped template segments for the NEXT service: **actual timing becomes the new plan**, skipped segments dropped, added ones carried, run-of-show structure + per-sector cues + flexible flag kept, date-specific content (this sermon/these songs) dropped with a *"Last time: …"* descriptive breadcrumb. `pickBlueprintProgram(...)` keeps the lanes separate (Sunday→last reconciled Sunday, Wednesday→Wednesday). `seedSegmentsFromBlueprint()` inserts it and records `blueprint_source_id`, closing the loop.

**Descriptive, never prescriptive** (mirrors choir Song→Renditions): a faithful record of how we did it, offered as a starting template — available to reproduce OR depart from. The finalizer circle still finalizes the next program with wired buttons (preview → execute).

### Where ACTUAL comes from (honest, no painting — DR-0076)

Two capture paths, both descriptive: (1) **quick reconcile from plan** — pre-fill the actual run from the planned segments, then adjust to reality (always available, no pipeline); (2) **harvest-assisted** — `captureActualFromHarvest()` lands items mined from the service video by the NAS SME pipeline as `needs_review` until a finalizer confirms. The PWA can't run Whisper; the bridge is the design.

## Surface

`components/ServiceActuals.jsx`, mounted under the flow in `ServiceProgram.jsx` (all lenses; whole team reads, finalizer circle reconciles):
- planned-vs-actual variance banner + one-line recap (everyone),
- the reconciled flow with disposition badges (as-planned / long / short / reordered / added / skipped),
- finalizer controls: **Reconcile from plan**, per-row Adjust (minutes / note / real songs / sermon), Add unplanned, mark-skipped, and the recap form,
- on a fresh service: **"Start from last Sunday's actual (blueprint)"** beside "Start from standard order" → seeds the next plan from what worked.

## Verification (gates green)

- ESLint `--max-warnings 0`: clean.
- vitest: **1970 passed** (160 files), incl. new `service-actuals.test.js` (21 tests locking reconcile math + blueprint derivation + lane separation) and module-boundary-guard.
- `npm run build`: passes (the named-export CI gate).
- contrast-guard: PASS (AA all themes incl. midnight). charter:check: fresh.

Live in-app verification (signed-in finalizer, real instance) follows the validate-by-using-the-app rule.

## Three-brakes note

No autonomous/timer automation — reconcile and blueprint are human-triggered by a finalizer (no cron, no self-firing). The three-brakes rule does not apply.

## Follow-ups

- After merge: **apply `0045-service-actuals.sql`** to the cloud (Supabase Studio / db-migrate) — adds the `actual_*` columns + `church_service_segment_actuals`.
- Wire the NAS SME pipeline output to `captureActualFromHarvest()` (the harvest hook) so detected songs/sermon/timings land as `needs_review` actuals automatically.
