# DR-0087 — Universal ingestion (reconciliation gate) + deterministic categorization rule layer

- **Status:** accepted
- **Tier:** B (additive reusable primitives + a deterministic DB reclassify; no autonomous timer)
- **Scope:** money loop now; reusable app-wide
- **Date:** 2026-07-01
- **Principles:** VERIFICATION-DOCTRINE, DETERMINISTIC-FIRST, REALITY-TRACE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-01, two linked money-loop defects:

1. **Silent data loss** — months rendered uneven (April showing 2 transactions). "Build the permanent architecture that makes silent data loss impossible... one reusable ingestion primitive with a reconciliation gate... every import proves ingested + rejected = total-in-source or FAILS LOUDLY. No row is ever silently dropped."
2. **Mis-categorization** — "WF HOME MTG AUTO PAY" (a Wells Fargo home mortgage autopay) tagged **Vehicle** because a naive matcher found the substring "auto" in "AUTO PAY". "Fix the class, not the one row... deterministic rule layer, token/payee based, mortgage-first; correctable + sticks; low-confidence flags; reclassify existing."

## Finding (reality-trace, stated first)

The **April = 2** symptom was **NOT** an ingestion/parse loss. The cloud DB is complete (1,932 transactions, April 2026 = 296) — it was the **sync layer** truncating to Supabase's 1,000-row cap (fixed in the prior change: `table-sync.js` now paginates). The current ledger is sourced from the **bank QFX exports** (through 2026-05-27), not Christina's Excel; her workbook is a *separate* source that, when imported, now runs through the reconciliation gate below. This DR builds the permanent safeguard so the *class* of silent loss is impossible regardless of source.

## Decision

Two reusable, deterministic, pure primitives (no n8n, no LLM in the hot path):

1. **`app/src/lib/ingest-reconcile.js` — the reconciliation gate.** `ingestRows(rows, opts)` classifies **every** source row as either ACCEPTED (typed) or REJECTED-with-a-reason (`blank-row`, `repeated-header`, `subtotal-or-separator`, `unparseable-date`, `unparseable-amount`) — it never stops early and never silently drops a tail. `reconcile(sourceTotal, ingested, rejected)` proves `ingested + rejected === sourceTotal`; if not, `balanced:false` with a message naming the unaccounted count — the import fails loudly. Rejected rows are returned (visible list, not hidden). Tolerant of blank/subtotal/repeated-header rows and mixed date formats. Proven-to-catch: `ingest-reconcile.test.js` feeds a sheet with a blank + repeated-header + subtotal + bad-date + bad-amount row and asserts each is rejected-with-reason, the tail survives, and the counts balance.

2. **`app/src/lib/categorize.js` — the ONE categorization rule layer.** Ordered, **most-specific-first**, token/payee-pattern rules (never a bare substring): mortgage/servicer signals win before the vehicle rule, and the vehicle rule matches real auto payees (`autozone`, `oil change`, `\bauto (parts|repair|...)\b`) — never the "auto" inside "autopay". Each rule carries a **confidence**; ≤ `LOW_CONFIDENCE` flags for review instead of posting a wrong label. **Learned per-payee overrides** (`learnRule` + `payeeKey`, keyed on the description with account tails stripped) win over the built-ins — one correction re-categorizes every past + future row from that payee. Proven-to-catch: `categorize.test.js` asserts "WF HOME MTG AUTO PAY" → debt-payment (not vehicle), real auto payees → vehicle, and a learned override wins at full confidence.

**Wiring + sweep.** `BooksTransactions.suggestCategory` now delegates to `categorize()` (fixes every import/accept call site at once) and honors `data.categoryRules` (learned). A deterministic sweep re-ran `categorize()` over the live ledger: the mortgage rows read **debt-payment**, and 14 stale rows were corrected (e.g. "D&S SEWER SERVICE" dining→utilities). The per-month coverage self-check (DR-0086 rubric item `ledger-month-coverage`) monitors completeness continuously.

## Consequences

- **Kills the class app-wide:** any future importer adopts `ingestRows` and gets the reconciliation guarantee; any categorization uses the one rule layer. No row vanishes silently; no obvious payee is mislabeled by substring.
- **Remaining increment (honest):** the reconciliation gate is built + tested + reusable; wiring its **rejected-row list + "N source / N ingested / 0 unaccounted" tile into the live import UI** (and running Christina's actual workbook through it) is the next step, gated on having that file. The categorization fix is live + verified on the served DB.

## Verification

`categorize.test.js` (7) + `ingest-reconcile.test.js` (6) proven-to-catch; live sweep confirmed WF HOME MTG = debt-payment + 14 corrections; full suite + build + guards green.
