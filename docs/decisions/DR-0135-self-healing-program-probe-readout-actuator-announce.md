# DR-0135 — The self-healing program: every failure class gets a probe, a readout, an actuator, and an announce path

- **Status:** accepted
- **Tier:** A/B for the instruments shipped here (readouts + a dispatch-only workflow + a generator fix); the arming of any SCHEDULED actuator stays Tier C under the three-brakes law
- **Scope:** `scripts/choir-youtube-backfill.mjs` (emits ALL videos + the corpus manifest), `app/src/lib/corpus-manifest.json` + `lib/corpus-coverage.js` (the wholeness readout), `components/HarvestLedger.jsx` (the strip), `.github/workflows/corpus-reconcile.yml` (the dispatchable actuator), `app/src/lib/youtube-title-parse.js` (the apostrophe truncation fix), `lib/ari-notes.js` (the self-healing duty), the comprehensive review in the session note
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), NO-STATIC-DATA (DR-0121), PERPETUAL-IMPROVEMENT (DR-0075), WAYS-REVIEW (DR-0108), APP-IS-PRIMARY, THREE-BRAKES, SPEAK-ESTABLISHED-FACT (DR-0100)

## Directive

Darrell, 2026-07-10: *"Why doesn't the PoeTech App seem like it's self-healing yet? Can you do a comprehensive review of what could make that come to pass... What's not working well in our skills based on the outcomes of our orchestration? I could take pictures of the choir lists not having all 335 videos inside any of the tabs — we already requested repeatedly."*

## The verified trace — why it doesn't FEEL self-healing

Two independent inventories over the full record (session note carries both in full):

1. **The healing that exists is shell-plane; the data plane is detect-and-tell-a-human.** ACTIVE heals: chunk-reload, boot-fallback, the outside-in site probe, deploy-freshness, the auto-merge deploy hand-off. But every data-plane instrument — loop-health, db-health, harvest-stall, photo-source-health — DETECTS and then waits for a human; the transcript-backfill schedule ships commented out; and the intended tending actuator (the Local-LLM lane / orchestrator) is deliberately kill-switched. The system watches honestly, then stalls.
2. **The 335-video gap is the type specimen.** The 0013 seed carried **125 of 335** channel videos — the generator dropped every undated title with one `filter()` line, the debt lived only inside the migration's own comment ("left for manual entry"), and NO instrument compared what the channel has against what the app holds. Every tab told the truth about a corpus that was never whole — and the family photographed the gap the instruments never measured. (A parser bug also truncated real titles to `'I'` and `'YOU CAN'` on apostrophes — fixed, regression-pinned.)
3. **The skills review** (orchestration outcomes, cited in the session note): output failures got machine gates; the recurring failures are process-shaped — silent partial completion ("built-but-never-surfaced", "left for manual entry"), unwritten backlogs, claims not verified in the failure mode, the agent scoping to its own reach. The classes that keep recurring are exactly the ones with no gate.

## Decision

1. **The self-healing standard: probe → readout → actuator → announce.** A failure class is not "handled" until (a) something MEASURES it on a clock or at build time, (b) the measurement renders in-app derived (DR-0121), (c) something can FIX it — auto where safe under the three brakes, a named dispatchable action where not, and (d) the failure announces itself instead of waiting to be found. A detector without an actuator is a NAMED DEBT with a re-review date, never "done."
2. **Corpus wholeness is the first instrument, and the 125-of-335 class is machine-dead.** The generator now emits ALL channel videos (undated insert with NULL dates — labeled undated in-app per DR-0124, never dropped) and writes the committed corpus manifest; `corpus-coverage.js` compares live rows against the manifest and the Harvest Ledger renders the wholeness strip (amber until whole; an ungenerated manifest NEVER reads as coverage — unknown never reads whole, DR-0125's rule applied to data). `corpus-reconcile.yml` is the actuator: dispatch-only (three brakes), lists the channel on a runner, applies the idempotent full backfill over the same DB secret the migrate lane holds, and pushes the manifest through the gated lane.
3. **The routed gaps (each a dated commitment, DR-0075):** the read-outcome envelope distinguishing "empty" from "read failed (RLS/network)" on every data surface — the single highest-leverage missing primitive (`re-review: 2026-07-24`); the announce path (push on probe failure, not open-a-surface-and-find-out; `re-review: 2026-07-31`); a data-plane probe mirroring site-health (migrations all applied, transcripts current, derived artifacts fresh; `re-review: 2026-07-31`); actuators for the existing detectors (harvest-stall → dispatch the backfill; `re-review: 2026-07-31`); cross-device health aggregation for the device-local ledgers (`re-review: 2026-08-14`); arming the transcript-backfill schedule watched, Tier C (`re-review: 2026-07-24`).
4. **The skills findings become standing checks.** Every "all X" directive lands as a tracked backlog with per-item coverage at declaration (the P29 rule, now enforced by the ways-review question); the built-⇒-surfaced registry gate pattern (DR-0129's) extends to each new registry; no bare piped exit codes on gating commands; and the un-gate-able classes (self-deferral, re-asks, agent-limit-as-team-limit) stay measured in their ledgers with the counts treated as KPIs. Ari carries the self-healing duty.

## Supersedes / pairs

Pairs with DR-0125 (the outside-in probe this generalizes to the data plane), DR-0121 (derived readouts), DR-0122 (perpetual reports as the announce surface), DR-0132 (ops bus — the future actuator transport), the three-brakes law (every scheduled actuator), DR-0116/P29 (tracked backlogs), DR-0129 (built ⇒ surfaced). Supersedes nothing.
