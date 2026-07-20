---
id: DR-0196
title: The static-data audit becomes a STANDARD REPORT — a live, growing data-integrity scoreboard
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: institutionalizes the DR-0061/P15 painted-data audit as a standing in-app report
principles: [REALITY-TRACE (DR-0061 / P15), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-PRIMARY (DR-0065), TEACH-THROUGH-THE-SYSTEM (DR-0195)]
---

## Context

Darrell, 2026-07-20, after asking whether all the app's data is truly live (not
static) and having 10 read-only audit agents sweep the surfaces:

> "Add these data-driven audits to the reports as a standard so we can see our
> growth."

The painted-data check (DR-0061/P15 — every trust-surface value traces to real
state) had been run as one-off AI sweeps. Darrell wants it made a **permanent,
visible report** so the family watches painted findings trend DOWN over time —
that downward trend is the growth.

## The decision

**Ship a Data Integrity standard report, driven by a committed audit ledger.**

1. **The ledger is the real data** — `app/src/data/data-integrity-audit.json`
   records each audited area: its files, verdict (`clean` / `findings` /
   `pending`), finding counts by severity (high/med/low), a note, and an
   append-only `history` for the trend. Audit runs write real results here; the
   report never hardcodes a count. `pending` = honestly not-yet-audited (never
   counted clean OR dirty).

2. **A pure summarizer** — `app/src/lib/data-integrity-audit.js` derives coverage,
   clean%, open-findings-by-severity, an escalating KPI status, and the
   newest-vs-previous trend. Scoped to AUDITED areas so it neither under- nor
   over-claims (DR-0100). Named `-audit` to avoid collision with the pre-existing
   `data-integrity.test.js` (a different, data-consistency concern).

3. **The report surface** — `app/src/components/DataIntegrityReport.jsx` renders
   coverage / clean / open-findings / per-area verdicts / trend, and TEACHES what
   it measures (DR-0195). Placed on the **OpsBoard** (the steward system-state
   home), beside the uptime strip.

4. **The report is held to its own standard** — every number it shows is derived
   from the ledger's real records; it paints nothing (DR-0076). The summarizer and
   the ledger's well-formedness are proven-to-catch tested.

## First results (this sweep — 10 area slices)

Verified so far (4 of 10): **App root/Big Picture, Inbound & business, Learn &
progress, Church ops & media — all clean**, only one LOW seam (Practice.jsx:436
hardcoded 50% conversion under an explicit "Estimates" banner). Six areas
(dashboards, ops-health, build/project boards, books-money, real-estate,
community) were still in review at ship and carry `pending` verdicts; their real
verdicts are appended as the audit completes. Coverage rising 4 → 10 and any HIGH
finding fixed is the first visible growth increment.

## Opportunities & Constraints

### Opportunities
- A machine-checkable, always-visible answer to "is any tab lying?" — the exact
  question that recurs (DR-0061 origin). Turns trust into a tracked metric.
- "See our growth" is literal: coverage up + open findings down, run over run.
- Each HIGH finding becomes a wiring job and, ideally, a new gate (DR-0076) so it
  can't recur — the durable output.

### Constraints (named honestly, with dates)
- **The ledger is currently written from AI-run audits, not a deterministic
  scanner.** A conservative smell-scanner that re-counts candidate painted values
  on every CI run (a canary beside the reviewed verdict) is the next iteration.
  `re-review: 2026-10-20`.
- **Verdict is per-AREA, not per-value.** A finding count is exact; the "clean"
  claim is as strong as the audit that produced it (independent read, DR-0076 §7),
  refreshed when the area changes.
- **History starts at one baseline point** — the trend line is meaningful only
  after the second run; the report says "baseline" until then (honest).
- **Coverage is scoped to the audited surface slices**, not all 175 components —
  authored content (lessons, scripture, catalogs) is intentionally static and out
  of scope; the ledger's areas name exactly what is tracked.

## Verification (DR-0076)

- `data-integrity-audit.test.js` (7): coverage/clean scoping to audited, severity
  sums excluding pending, status escalation, trend baseline-vs-deltas, garbage-safe,
  and the committed ledger is well-formed (findings⇒≥1, clean⇒0).
- `data-integrity-report-render.test.jsx` (2): real mount renders coverage/areas/
  note/trend and survives the empty ledger.
- Lint clean; contrast + legibility guards green (legibility health regenerated).
  REV-0166; memory `feedback_data_integrity_audit_standard_report`.
