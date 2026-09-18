# DR-0512 — The catalog courses get the elision ratchet the series has had since DR-0473

- **Status:** accepted
- **Tier:** B (a gate over content the whole school serves)
- **Type:** gate
- **Date:** 2026-09-18
- **Scope:** `app/src/__tests__/course-quotation-integrity.test.js` (new, 8 checks), `app/src/lib/course-quotation-integrity-baseline.json` (new, shrink-only)
- **Principles:** NO-ELISION-IN-A-QUOTATION (DR-0459), VERIFICATION-DOCTRINE (DR-0076 §2 §3 §4), WORD-FIRST (DR-0098), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the instrument and the series ratchet), DR-0511 (the reading that surfaced it)

## The gap, stated plainly

DR-0473 measured 736 elisions in the **Living Lessons series**, built a scanner for them, and ratcheted the debt so it could only shrink. That scanner has been sitting in `scripts/quotation-integrity.mjs` ever since, pointed at exactly one population.

The **catalog courses** — every self-paced course in Learn, the A.I. class the youth sit in, the Broadcast class the media team runs on, Infrastructure, Kingdom Economics, Legacy Provisions, Sovereign A.I. and the rest — were never scanned. Not "scanned and found clean." Never scanned. The debt there was invisible rather than absent, which is the most expensive kind.

It surfaced the way these things usually do: by reading. Authoring the Send-off out of 69 bare lessons (DR-0511) meant going through eight course files closely, and eight quotations with an ellipsis in them turned up and were repaired by hand. Eight found by eye is never eight total.

## Measured, not estimated

The same instrument, pointed at all **438** catalog lessons:

- **908** elided spans
- **156** lessons carrying at least one
- **798** of them **His own words**
- **767** with a **contiguous verbatim span available** — the remedy DR-0459 requires already exists in the text for 96% of the Scripture cases
- **82** lessons reciting a decision-record ID at a reader

That last number is the same class DR-0473 names: a reader should meet the teaching, not the file name of the decision that produced it.

## Why a ratchet and not 908 repairs tonight

Because rushing them would be the exact failure DR-0459 exists to prevent. The rule's remedy is *a shorter genuinely-verbatim span* — which means reading the surrounding prose and choosing what the sentence can afford to lose, 908 times. Doing that carelessly would produce 908 new quotations that are technically verbatim and argumentatively wrong, and no gate would catch it.

So the debt is frozen where it stands and may only fall. A fresh elision anywhere in the catalog fails the build, including a **second** one inside a lesson the baseline already lists — the gate counts, it does not merely check membership. Healing is reported by name so the baseline gets shrunk deliberately rather than drifting.

**re-review: 2026-09-25**, to start working the 767 down.

## Proven to catch

8 checks, and two of them are the ones that matter at this size:

- A lesson the baseline records as **clean** that gains an ellipsis is reported fresh. Built from a genuinely clean id, so the report can only come from the ellipsis just introduced.
- A lesson **already in the baseline** that gains ANOTHER elision is reported fresh too. This is the harder case and the one a membership check would miss: without it the debt could grow silently inside a listed id.

Three more hold the baseline honest rather than decorative: the lesson count must match or the baseline is re-measured; most of the debt must still be Scripture with the contiguous remedy available, or the file has stopped describing the problem it was written for; and a baseline id that has fallen out of the catalog is reported, because a ghost can never heal.
