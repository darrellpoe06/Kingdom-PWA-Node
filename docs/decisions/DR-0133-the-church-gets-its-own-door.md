# DR-0133 — The church gets its own door: thechurchofthelivinggod.com on the one door engine

- **Status:** accepted
- **Tier:** A/B for the strategy + staff-internal plan surface shipped here; **C for the public door and the domain cutover** (COLG-facing identity — Bishop Gwin doctrine sign-off + Governor review before either opens)
- **Scope:** `lib/church-own-door.js` (the plan model — facts, rails, phases, opportunities, constraints, readiness, resolution, gate), `components/ChurchInfraPlan.jsx` (the plan rendered in-app, combined with the infra plan), `lib/ari-notes.js` (the church-door standing duty), `__tests__/church-own-door.test.js` (proven-to-catch harness)
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST, APP-IS-PRIMARY, NO-STATIC-DATA (DR-0121), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), GOVERN-EXECUTE-ADVISE, WAYS-REVIEW (DR-0108), DECISION-RECORDS

## Directive

Darrell, 2026-07-10: *"Like or similar to Moore Divahs, The Church Of The Living God Pillar And Ground Of The Truth in Champaign, IL needs its own app — thechurchofthelivinggod.com. Opportunities and constraints? Strategies based on our hardware and missions. Again when we add features we need to update our Ways and documentation and find the opportunities and constraints; Ari's responsibility and reports should all update to reflect as well, all inside the PoeTech App. No static data — combine what makes sense and keep cleaning until we like it. Period. Make sure it has quality comprehensive process that adds the maximum value to the overall process."*

## Context

The church already owns and operates `thechurchofthelivinggod.com` (DR-0003 — canonical, doctrine-gated; Bishop Gwin's sermon-prep email lives on it and feeds the live ingest). The current site misidentifies the church — its title reads "THE LOVE CORNER - HOME" — and COLG is absent from local search despite being one of the largest African American congregations in Champaign-Urbana (observed 2026-05-31; platform Weebly-vs-Turbify discrepancy honestly unresolved, 2026-06-02 audit). Meanwhile the client-business factory is proven: Moore Divahs runs as a registry row on the ONE door engine (DR-0114; PR #703), and the church already has tenant plumbing (`join_church_instance`), a public home record, and verified sanctuary hardware (two RTX 4070 towers, the commissioned LED wall, the ATEM/PTZ broadcast chain, two Synology NAS — device register + 2026-07-08 scan). The full opportunities-and-constraints strategy is the Layer 4 note `docs/99-session-notes/2026-07-10-colg-own-app-opportunities-and-constraints.md`.

## Decision

1. **The church's app is a registry row on the one door engine — never a fork, never a second codebase.** Like Moore Divahs: a church row (brand, tabs, instance, manifest, entry page, share URL) rendered by the shared engine; public faces first (services, live worship, giving, sermon library), steward faces behind real church-staff roles; one CRM, one tenancy wall (APP-IS-PRIMARY).
2. **The strategy lives in the app, derived — no static data (DR-0121).** `lib/church-own-door.js` + the Infra Plan surface: site facts carry provenance, opportunities carry re-review dates (DR-0075), Tier C phases must NAME their governor gate or the plan fails its own validator, hardware readiness is READ from the device register, and every DR ref resolves against the live build-parsed ledger — a dead ref reads "not in the ledger" (DR-0076). All proven-to-catch in `church-own-door.test.js`.
3. **The bright lines hold:** the public door and the domain cutover are Tier C — Bishop Gwin governs what publishes on the church's name (DR-0003); DNS/commercial/brand steps are the governor's hand with paste-ready runbooks (DR-0114 §3); the cutover is proven on the church's domain before the old site is released (DR-0107); accessibility is the default (COMMUNITY-FIRST commitment 2); no inference on the livestream box during services (DR-0012).
4. **Ari carries the church-door plan as a standing duty**, and the process rule Darrell restated is recorded as the way: when a feature lands, the Ways, the documentation, the opportunities-and-constraints, and Ari's responsibilities and reports update WITH it, in the same session, inside the PoeTech App — derived from the same ledger, so the update cannot silently stall.

## Opportunities and constraints

Ranked opportunities (church door row `re-review: 2026-07-24`; platform reconciliation + cutover runbook `re-review: 2026-07-24`; on-domain sermon flywheel + structured data + Google Business Profile `re-review: 2026-08-07`; church-purpose giving `re-review: 2026-08-07`; the generalized church-door factory `re-review: 2026-08-21`) and the carried constraints (doctrine gate, Tier C lane, governor's hands, accessibility default, Sunday load-bearing, the 12 GB VRAM ceiling, no sandbox route to the live surfaces) are recorded in full in the session note and rendered live in-app.

## Supersedes / pairs

Pairs with DR-0114 (the factory this generalizes), DR-0003 (the domain + doctrine gate), DR-0121 (derived, never hand-kept), DR-0125 (the outside-in probe extends to the church's domain at cutover), DR-0107 (prove the deploy), COMMUNITY-FIRST-MISSION (COLG-first, then other churches). Supersedes nothing.
