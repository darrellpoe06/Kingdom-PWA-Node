# DR-0170 — Ari (PM) dates the plan so the timeline fills: the seed boards carry target dates, and a gap-fill heal never overwrites a family-set date

- **Status:** accepted
- **Tier:** B shipped through the lane (fills a real planning surface with the PM's forecast; no schema, no money; the gap-fill heal only writes into EMPTY date fields, client-side)
- **Scope:** `app/src/lib/board.js` (target `dueDate` on every open SEED item + `seedDueDate` lookup), `app/src/lib/use-board-tasks.js` (`reconcileSeedDueDates` gap-fill heal), `app/src/__tests__/board.test.js` (the no-undated-open-item invariant + heal-source tests)
- **Date:** 2026-07-11
- **Principles:** GOVERNANCE-EXECUTE-ADVISE (Ari advises with a dated plan; the governor's date is senior), VERIFICATION-DOCTRINE (DR-0076 — never overwrite real state), NO-STATIC-DATA (DR-0121 — the timeline was empty because it was honest, not painted), APP-IS-PRIMARY, the Ari PM/teams charter (DR-0154/DR-0158)

## Directive

Darrell, 2026-07-11, with three board/timeline screenshots: *"Populate the correct places with data and we keep creating new spaces for data we know also I love the projects specific breakdowns of swim lanes so more of that and also timelines haven't and aren't filled why does Ari know and have plans or strategies for governance tests and fixes?"*

## The reality-trace (the "why", measured)

1. **The 12-Month Workload Forecast was empty because the board items were UNDATED.** `boardDueByMonth` (board.js) buckets a board item onto the forecast ONLY if it has a `dueDate` (`if (!t.dueDate) continue`). The App Firm-Up header confirmed it: *"20 open items undated."* The forecast was honest, not broken — there was simply no plan date to place.
2. **Ari DID have the plans/strategies — they were just undated.** The SEED_BOARDS specs already carry detailed, owned strategies for governance/tests/fixes (e.g. the modular-cutover stages, the gmail-ingest three-brakes plan, the pre-service GO/NO-GO check) — each with `owner: Ari` and a real note. What was missing was a target DATE on each, so "the plan" never became "the timeline."
3. **Two failure modes, both closed here:** a board not yet loaded shows *"N real items ready to load"* (the family taps load — the cloud agent cannot write instance rows, DR-0060); a board already loaded carried its items with NO date (load fills gaps; it never back-dated).

## Decision

1. **Every OPEN seed item carries a target `dueDate` — Ari's PM forecast, sequenced by the dependency each item's own notes already state.** (e.g. `inf-network` AFTER `inf-walkthrough`; cutover `s5` AFTER `s3` drains; the media pipeline ingest before go-live.) 33 open items dated Jul 2026 → Dec 2026. Done items need no target. A build-failing invariant (`board.test.js`) now forbids a future open seed item landing undated.
2. **A gap-fill heal back-dates already-loaded rows** (`reconcileSeedDueDates`, beside the existing owner heal). A loaded seed row with NO `dueDate` adopts its seed's planned date, so the timeline fills for boards loaded before this shipped. **Gap-fill ONLY — it never overwrites a date the family set;** the governor's real date is always senior to the forecast (GOVERNANCE-EXECUTE-ADVISE). Idempotent, client-side (where the instance is writable).
3. **Honesty held:** these are Ari's PM *targets* on a surface the app already frames as *"Projections, not promises · 12-Month Workload Forecast."* Proposing a dated sequence is the planning act, not painted data — and the heal's never-overwrite rule means the moment the governor sets a real date, the forecast yields to it. The forecast still COUNTS real dated items; it never invents hours (the pre-existing DR-0076 line stands).

## Answering the rest of the directive

- *"does Ari know and have plans or strategies for governance/tests/fixes?"* — Yes, and now they are **dated and on the timeline**, not buried undated in the seed spec. This is the Ari-PM function (DR-0154) made visible.
- *"more of the swim-lane breakdowns"* — routed: the board swim-lanes (group lanes with per-lane progress) are the pattern Darrell named; extending that lane treatment to more surfaces is the next pull, `re-review: 2026-07-18`.
- *"we keep creating new spaces for data we know"* — the seed items ARE the known data; this lands their dates so the existing timeline fills instead of a new surface. The load-tap that still gates un-loaded boards (RLS) is the residual; an auto-offer-load-on-first-visit is routed `re-review: 2026-07-18`.

## Opportunities and constraints (routed)

- **Opportunity:** auto-offer to load a board's real items on first visit (gap-fill, idempotent — safe) so "N ready to load" doesn't sit waiting. `re-review: 2026-07-18`.
- **Opportunity:** more swim-lane breakdowns across surfaces (Darrell loves them). `re-review: 2026-07-18`.
- **Constraint (held):** the cloud agent cannot write family instance rows (DR-0060) — both the seed dating and the heal are the honest way to reach the family's timeline without that write; the heal runs in their browser.
- **Constraint (held):** targets are Ari's forecast; the governor's date always wins (never overwritten).

## Supersedes / pairs

Pairs with DR-0154/DR-0158 (Ari the PM/teams lead — this is the plan made visible), DR-0061 (surfaces are live views of real flow — the boards ARE the timeline), DR-0076 (never overwrite real state), DR-0121 (no static data). No supersession.
