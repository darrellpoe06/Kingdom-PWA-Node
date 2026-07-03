# DR-0090 — Receipts: the paper trail rides the ledger row

- **Status:** accepted
- **Tier:** B (new feature on a family money surface; additive; no autonomous timer)
- **Scope:** money loop
- **Date:** 2026-07-03
- **Principles:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, DATA-EMPOWERMENT, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-03, holding a real Aspen Tap House receipt ($48.59 + tip): "How do we upload receipts etc?" Reality-trace answer, stated first: the app had NO receipt path — "receipt" existed only in reconciliation copy; the photo machinery served the family album and property photos. Then: "build receipts."

## Decision

Two flows, one storage rule, following the app's own precedents exactly:

1. **Attach** — every transaction row carries a `+receipt` affordance; the photo (compressed client-side via the existing `compressImageFile`, ~80–250 KB data URL) stores ON the transaction (`receipt` jsonb: `{ id, src, amount, merchant, note, capturedAt }`), mapped through `transactions-sync` `toRow`/`fromRow` and the update-patch whitelist, column added by migration 0069. A matched receipt is therefore exactly as private, synced, and exportable as the transaction it evidences — no new bucket, no dashboard-side storage policy (which the migration lane cannot create, per 0021's note).
2. **Snap now, match later** — the paper exists days before the bank row settles. "+ Receipt" in the Transactions toolbar opens a still-screen overlay (no scroll-jump, per the 2026-07-03 UX rule) that saves the photo to a **pending pool**; each waiting receipt shows its suggested matches — same absolute amount to the cent within a 4-day settlement window, nearest date first (`suggestMatches`, pure, tested against the real Aspen case) — and one tap attaches + drains the pool.

**Deliberate Phase-1 limits (why + re-review, per DR-0075):**
- The pending pool is per-device localStorage (same persistence posture as the financial blob), capped at 20 with an honest cap message. Cross-device pending needs a synced table — **re-review: 2026-08-01** or when Christina snaps on her phone and matches on the laptop, whichever first.
- No OCR: merchant/total are optional manual fields. Reading them off the photo is the NAS's job later (deterministic-first; the ops-runner lane from DR-0088 is the natural carrier) — **re-review: with the Phase-2 receipts follow-up.**

## Guards (proven-to-catch)

`receipts.test.js`: the real Aspen receipt matches its settling charge to the cent inside the window and rejects out-of-window/wrong-amount/already-receipted rows; the pool caps loudly, survives reload, removes cleanly; wiring guards pin the sync mapping (toRow/fromRow/update patch), the migration column, and the capture-on-overlay surface. Full suite 3,881/3,881; the legibility gate caught the first draft's inline chip color (3.27:1 in midnight) — fixed to theme-remapped class tokens.

## Cross-refs

DR-0087 (deterministic money-loop primitives), DR-0088 (ops queue — Phase-2 OCR rides it), DR-0089 (standing consent — this build ran on the original yes), migration 0069, `app/src/lib/receipts.js`.
