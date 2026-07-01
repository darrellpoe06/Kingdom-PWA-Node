# DR-0086 — Proactive surface audit: the app reviews its own served surfaces against a human-needs rubric

- **Status:** accepted
- **Tier:** B (additive tooling + a NAS loop that ships inert; the loop's own arming is Tier C per THREE-BRAKES)
- **Scope:** all
- **Date:** 2026-07-01
- **Principles:** VERIFICATION-DOCTRINE, DETERMINISTIC-FIRST, THREE-BRAKES, APP-IS-PRIMARY, REALITY-TRACE, PERPETUAL-IMPROVEMENT, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-01:

> "everything I brought up this morning literally didn't need me to name if our orchestrator and uiux etc teams were working... Why do I have to catch you failing to deliver my requirements instead of you being proactive?"

He is the **GOVERNOR, not the QA.** The morning's misses — an endless-scroll transaction list, oldest-first sort, static IN/OUT tiles, admin not reachable in-app, harvest stuck at 0 transcripts — are a **class** a human with full context catches by reflex. Encoding that reflex as a standing check is the same move `tenancy-guard` (DR-0060) made for data-isolation: judgment captured as a gate so it never again depends on a given session noticing.

## Decision

A **deterministic, $0, no-LLM proactive surface audit** walks **every served surface** in the `surfaces.js` registry every NAS-loop cycle, scores each against a **human-needs rubric**, **auto-files** each finding to the in-app **Concerns & Solutions board**, and **auto-resolves** a finding when a re-audit no longer produces it.

1. **The rubric is a real, inspectable config file** — `scripts/surface-audit-rubric.json`. Six dimensions (dynamic-not-static, intuitive-ux, reachability, freshness, no-dead-ends, works-when-used). Extensible: add an item and the engine enforces it. Deterministic checks are regexes over real source or a cross-check of the real registry against the real render; a `judgment` kind is reserved for a model and is **refused by the deterministic loop** (like the NAS runner refuses `kind:'ai'`), so the always-on loop never waits on a vendor.

2. **The engine is pure and proven-to-catch** — `scripts/lib/surface-audit-core.mjs` (no I/O). Every finding is a deterministic function of (surface metadata, source, rubric). `app/src/__tests__/surface-audit.test.js` shows each rubric item **CATCHES a synthetic break AND stays silent on clean source** (DR-0076 §3 anti-theater). A noisy check is treated as a lie too: the percent check deliberately does **not** match layout `width:'100%'`; the currency check matches only a pure painted tile (`>$48,200<`), not a labeled figure.

3. **Findings feed the Concerns board** — the CLI (`scripts/surface-audit.mjs`) writes `app/src/lib/audit-findings.json`; `lib/concerns.js` reads it through in `composeConcerns` as a fourth feed (`auditToConcernCards`), beside seeds, DB concerns, and feedback. The board was always meant to auto-eval; this is its automated machine-voice feeder, paired with the human-voice feedback feed (DR-0039 / feedback-triage).

4. **Dispatch + auto-resolve are the artifact's diff** — each finding carries a suggested fix and lands as an `open` concern the Governor/build lanes pick up. When the fix lands, the surface passes re-audit, the finding stops being produced, and `diffFindings` reports it **resolved** — no human, no LLM marks it done.

5. **It runs 24/7 on the NAS deterministic loop** — `infra/nas-loops/loops/surface-audit.sh`, registered in `registry.json` (every 30 min). **Observe-only** (writes the artifact + event reel; never commits or merges), the same read-only discipline as `health-check`. It **ships inert** behind the three brakes (per-day cap, single-flight lock, kill-switch + LOOPS_ARMED); arming is the Tier C step.

## Reality-trace (what is real)

- **Real data:** the `surfaces.js` registry (36 surfaces), each surface's real component source, and the shell render (`poe-financial-mvp-v28.jsx`). Reachability asserts the `view === '<id>'` branch a top surface literally needs.
- **First real run (2026-07-01):** on `origin/main` the audit found the morning's issues **already fixed** — `BooksTransactions` paginates (`pageSize=25`) and sorts newest-first; `admin` is reachable (`poe-financial-mvp-v28.jsx` nav + render, family-gated). Strong evidence the live failure was **deploy/serving skew**, not the code. The audit then **independently found 4 real, verified endless-scroll risks of the same class** on sibling long-list surfaces — **CRM, Harvest, Library, Scripture** (many `.map` lists, zero pagination) — which are now `open` concerns on the board.
- **Documented limitation (no silent caps):** deterministic reachability covers top-level surfaces only; church/books sub-surfaces route through a composite the shell resolves dynamically and are reported as skipped, not silently passed. Live freshness probes (served-app reachable, harvest count > 0) ship **empty** — no invented endpoints (Verification Doctrine) — and are added when a real endpoint is confirmed.

## Why this shape

- **Deterministic-first (DR-0080):** the whole audit is a pure function of source + registry; a model is reserved only for judgment items the loop refuses.
- **Verification Doctrine (DR-0076):** the audit exists to make "does this surface actually serve a human" cheap to verify and a regression expensive to ship; proven-to-catch is the bar.
- **Three brakes (2026-06-08):** it is timer-driven automation, so it ships inert and only observes.

## Consequences

- A new served surface that ships a static tile, an endless-scroll list, a dead-end, or an unreachable registration is caught and filed to the board **before Darrell sees it.** New "a human would have known" classes become new rubric items.
- Registered in the quality manifest (`scripts/quality-manifest.mjs`) so the panel counts it among the proven gates.
