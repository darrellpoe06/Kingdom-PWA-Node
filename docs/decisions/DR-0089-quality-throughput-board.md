# DR-0089 — The Quality & Throughput board: the system watches itself, numbers and their why together

- **Status:** accepted
- **Tier:** B (new feature surface in the steward seat; soaks on the feature-branch preview; read-only — it watches, it never executes)
- **Scope:** the Command, Control & Serve Center's See faculty; every quality/throughput metric the platform records
- **Date:** 2026-07-03
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-03: the quantitative record (tests and their pass state, legibility health, harvest coverage, surface-audit findings opened vs auto-resolved, the migration ledger, loop run-states, every ops command with timing and outcome) and the qualitative record (LESSONS-LEARNED principles, decision records with their reasoning, the Concerns & Solutions board, family feedback) belong on ONE steward-gated page, read live from their existing sources, "with the qualitative record (the DR, the lesson, the concern) linked right beside each number. One change ripples fifteen connected things — and this page is where you watch it ripple, and catch the one thing that didn't."

## Decision

Ship `QualityThroughput` (app/src/components/QualityThroughput.jsx) mounted at the top of the C2S **See** faculty — the steward seat, governor-gated and no-leak there — as the roll-up above OpsBoard and QualityProof. Two halves on one card:

**The numbers** — each row a real measurement with its source artifact named on the row:
- **Test suite**: a build-time census measured from the real test tree (`scripts/test-census.mjs` → `__TEST_CENSUS__`) — files, `it`/`test` call sites, parameterized suites called out separately so the runtime-count gap is explained, not hidden. Pass/fail stays the LIVE CI verdict on the served SHA (lib/github-ops.js), never a claim. The suite's size had been recorded nowhere; any typed count would have been painted the moment it landed.
- **Legibility**: lib/legibility-health.json (the vitest-synced per-theme WCAG scan) via the existing reader.
- **Surface audit**: lib/audit-findings.json (DR-0086) — open findings, criticals, auto-resolved-since-last.
- **Migration ledger**: the `schema_migrations_health()` RPC over `public._schema_migrations` (DR-0084), applied/failed live.
- **Harvest coverage**: the live `video_harvests ⋈ choir_sermons ⋈ video_transcripts` join — the SAME `fetchLedger` math the Harvest page renders (one truth, two views).
- **Ops commands**: `ops_commands` rows (DR-0088) via the realtime subscription — done/failed/in-flight counts and the measured average run duration from real `started_at`/`finished_at` pairs; rows without both timestamps contribute nothing.
- **Interconnection loops**: the file-verified interconnect manifest summary; per-loop detail stays in Quality/Proof (one home each).

**The why** — the judgment layer, from the same real files:
- `scripts/lessons-manifest.mjs` parses LESSONS-LEARNED.md at build (`__LESSONS_PRINCIPLES__`) — the first in-app surface for the extracted principles (P1–P23 at ship).
- Each metric carries a WHY registry entry naming the Decision Records + principles that govern it, resolved at render against the REAL `__DR_LEDGER__` and lessons manifest. **A ref that stops resolving renders as "not in the ledger" — missing is surfaced, never fabricated** — and a vitest cross-seam guard fails the suite if any WHY id stops resolving against docs/decisions or LESSONS-LEARNED, so the number-to-why pairing can never silently rot.

## Guards

- `quality-throughput.test.js`: census counting proven-to-catch on fixtures; lessons parsing proven-to-catch (malformed doc degrades honestly); ops math over real-timestamp rows only; WHY ids verified against the real ledger + doc; mount + live-source tokens guarded.
- `quality-throughput-render.test.js`: the board renders the real measured census, the real legibility line, the real audit artifact — and the missing-ref honesty path.
- Interconnect registry entry `quality-throughput` (status live): the board's wiring to its live sources is file-verified at build; `interconnect-guard` + vitest fail the build if the board goes static.
- The board is read-only. Doing stays where it lives (the ops queue card, the deploy lane, the Cage) — observing can never break a loop (DR-0083 posture).

## Consequences

- The steward reads system health and the reasoning behind it in one place, in the app (DR-0065), instead of across CI, repo JSON, Supabase Studio, and markdown files.
- LESSONS-LEARNED principles now travel with the numbers they explain; a future metric added without its why is visibly bare.
- The test-suite census becomes a real, regenerating artifact; the "how many tests stand behind this" question stops being answered from memory.
- Known gap, stated: loop run-state records (lib/loop-runs, localStorage) are device-local and appear via Loop Health / Quality Proof; the NAS loop reel (infra/nas-loops/events) has no cloud feed yet — when it gets one, it joins this board rather than a new page.
