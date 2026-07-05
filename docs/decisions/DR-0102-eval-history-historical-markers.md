# DR-0102 — History & Markers: quality/throughput evaluations over time, with the record pinned to the timeline

- **Status:** accepted
- **Tier:** B (new read-only feature surface in the steward seat; soaks on the feature-branch preview; it watches, it never executes)
- **Scope:** the Command, Control & Serve Center's See faculty; the time dimension of every quality/throughput evaluation; the sovereign usage stream's historical aggregate
- **Date:** 2026-07-05
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE, DATA-AS-EMPOWERMENT, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, DECISION-RECORDS
- **Builds on:** DR-0091 (the Quality & Throughput board — the NOW view this adds time to), 0073 (usage_events + the aggregate-only trust model), DR-0088 (ops_commands with real timing + outcome), DR-0043 (aggregate-only usage ranking precedent)

## Directive

Darrell, 2026-07-05: "Quality and throughput evaluations with historical markers to review user behavior and system behavior for better quality and control of what we can."

## What the recon found (characterize before change, DR-0076)

- The Quality & Throughput board (DR-0091) reads every number live — but only NOW. No surface answered "how has this moved, and what landed when it moved."
- The sovereign usage stream (0073) already records every tab view with an owner-deletable trail, and `usage_flow_metrics` already serves the governor a window AGGREGATE — but no per-day series existed, so behavior over time was invisible.
- `ops_commands` rows (DR-0088) already carry real `created_at`/outcome — system behavior history existed as data with no view.
- The Decision-Record ledger and LESSONS-LEARNED incidents carry real dates — but the 16 newest DR files (0086–0101, bullet-style headers) parsed with EMPTY date/title/status into the app ledger, so they could never have been placed on a timeline.

## Decision

Ship `EvalHistory` (app/src/components/EvalHistory.jsx) mounted directly under the Quality & Throughput board in the C2S **See** faculty — same governor gate, same read-only posture. One card, two lanes on ONE shared day axis, split by what we can actually control:

- **People — what we observe (to serve):** per-day views + active people from the new `usage_flow_series(days)` RPC (migration 0078) — the SAME poe-family gate and aggregate-only trust model as 0073 (counts only, never a person's rows; each person still owns and can delete their own trail; no engagement-farming). The RPC covers every day in the window via `generate_series`, so a quiet day is a measured zero, never a client-side invention. An older-half vs newer-half delta states the trend honestly (no percentage against a quiet baseline).
- **System — what we control:** per-day `ops_commands` outcomes (completed vs failed, failures in the reserved status red with a labeled legend) bucketed from real rows; a row without a parseable timestamp contributes nothing.
- **Historical markers:** every Decision Record and LESSONS-LEARNED incident whose date lands in the window, pinned to the same axis as a marker rail + labeled list. A number that moved beside a marker has its explanation; a number that moved with NO marker is the question to chase. A dateless record is skipped, never guessed onto a day.
- **The ledger parser fix that makes markers possible:** vite.config's decision-ledger reader now falls back to the bullet-style header (`- **Date:** …` + the H1 title) when a DR has no YAML block — repairing real date/title/status for all 16 newer records everywhere the ledger renders (Decisions tab, the board's why-strip, this rail). Measured: 16 repaired, 0 still missing a field.

## Guards

- `eval-history.test.js`: day bucketing proven-to-catch on fixture rows with a fixed clock; unparseable ops timestamps proven to contribute nothing; dateless records proven to never become markers; honest empties (`ok:false`) on absent feeds; delta never divides by a quiet baseline; chart geometry never lies about scale (true zero renders zero; any real event is visible); mount + live-source + migration-lane + WHY-pairing wiring guards.
- The shared WHY cross-seam guard (quality-throughput.test.js) now also verifies the `history` pairing against the real INDEX.md ledger row — this pairing can never silently rot.
- Interconnect registry entry `eval-history` (status live): the layer's wiring to `usage_flow_series`, `ops_commands`, and `buildMarkers` is file-verified at build; `interconnect-guard` + vitest fail the build if it goes static.
- Read-only end to end (DR-0083 posture): observing the history can never break a loop; the RPC is `SECURITY DEFINER` gated to poe-family and returns counts only.

## Consequences

- The steward evaluates quality and throughput as trajectories, not snapshots — user behavior reviewed to guide what we fix and build, system behavior answerable for its own failure rate, and the qualitative record standing at the exact spot on the timeline where each number moved.
- The 16 newest Decision Records regain their dates/titles across the whole app ledger.
- Known gap, stated: user-behavior history begins where 0073's recording began (2026-07-04) — earlier days render as measured zeros of the recorded stream, and the window honestly shows a young series until the trail grows. CI/test-suite history is not yet a series (the census is per-build); when a recorded census ledger exists it joins this card rather than a new page.
