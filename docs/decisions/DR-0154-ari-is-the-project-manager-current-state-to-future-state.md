# DR-0154 — Ari is the project manager: Current State → Future State → Gaps → Decisions → Timelines, managed and documented as seeds

- **Status:** accepted
- **Tier:** A for the method + duty + derived readouts (documented process over live sources); **Tier C for any autonomous PM cadence** (a timer that spawns analysis or work rides the three brakes and ships inactive)
- **Scope:** `docs/00-foundations/_root/PM-METHOD.md` (the seed methodology, new), `app/src/lib/ari-notes.js` (the standing duty), the derived gap surface (next build item on the board), every future project this seed plants
- **Date:** 2026-07-10
- **Principles:** GOVERN-EXECUTE-ADVISE (Darrell governs; the PM engine executes and advises), PERPETUAL-IMPROVEMENT (DR-0075 — the gap loop IS the improvement loop made structural), VERIFICATION-DOCTRINE, APP-IS-PRIMARY, NO-STATIC-DATA, THREE-BRAKES

## Directive

Darrell, 2026-07-10, verbatim intent: *"Ari needs to be better at quality improvements continuously — can we use Ari as our project manager of our PoeTech App build, like I have done with Shay and the IL Union project for UIUC: find the current state of the PoeTech App, then the Future State based on feedback, request requirements and content and context inside the Ways and documentation, then find the Gaps and then create Decisions and Project timelines and implement the solutions and project manage them, and document the process so we can use it as seeds for better future and current projects."*

This is the same discipline he runs professionally, now assigned to Ari as a standing role — not a one-time analysis.

## Decision — the PM loop, each stage bound to a LIVE source (no static data)

1. **Current State is DERIVED, never described.** The app already records what it is: the decision ledger (`__DR_LEDGER__`), the review registry (`__UIUX_REVIEWS__`), the incident ledger (`incident`-labeled issues), the boards/timelines, the error journal, the quality/test census, site-health and boot-check verdicts. The Current State readout is a roll-up of those sources at build/render time — a hand-typed "state of the app" document is the anti-pattern this DR forbids.
2. **Future State is the governed intake.** Feedback rows, promote queues, Darrell's directives (DRs with open opportunities), the re-review dates ledger, and the foundation docs' own commitments (the Ways) ARE the requirements record. Nothing invents scope: the Future State is what the family and the Ways have actually asked for, with its source cited.
3. **Gaps are the measured delta.** Future-State items with no shipped/verified counterpart (opportunities past their `re-review:` date, feedback unpromoted beyond queue-freshness, incidents without structural closes, directives without DRs) — each gap carries its evidence line. A gap without a source is not a gap; it is an opinion.
4. **Every accepted gap becomes a Decision and a lane.** DR on the ledger (the record), board item with an owner and a real date (the timeline). The delivery lanes implement (DR-0103); the gates verify (DR-0076); the merge deploys; the live-review confirms (DR-0104).
5. **Ari manages the loop and reports it in-app** — the same posture as every duty: derived readouts always current; judgment calls (prioritization proposals, scope questions) surface as recommendations to the Governor, never as silent re-scoping. Any timer-driven PM cadence ships INACTIVE under the three brakes; until armed, the loop advances whenever a session or lane runs it.
6. **The process is a SEED.** `PM-METHOD.md` documents the method project-agnostically — PoeTech is worked example #1; Moore Divahs, the Church door, client builds (DR-0140's growth engine) reuse the same loop with their own sources.

## Opportunities and constraints (routed)

- **Opportunity:** a derived "Gap Board" surface — Current vs Future with evidence lines, rendered from the sources in §1–§3 (the first PM readout in the app). `re-review: 2026-07-17`.
- **Opportunity:** the seeds become a client-facing offering (the consulting method productized inside PoeTech Business). `re-review: 2026-08-07`.
- **Constraint (held):** the PM engine proposes; the Governor decides. No gap self-promotes into scope, no timeline commits the family's time without the standing consent boundaries (DR-0089).
- **Constraint (held):** ~half the Future-State record lives in family-instance rows the cloud build agent cannot read (RLS, by design) — the derived readouts state that boundary honestly rather than pretending completeness (DR-0076 §8).

## Supersedes / pairs

Pairs with DR-0075 (perpetual improvement — this is its engine), DR-0102 (the work reviews itself), DR-0108 (ways-review), DR-0120/0121 (derived tending, no static data), DR-0141 (Ari the input manager — PM is the output half), GOVERNANCE-EXECUTION-ADVISORY. No supersession.
