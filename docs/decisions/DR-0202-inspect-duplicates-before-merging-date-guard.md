---
id: DR-0202
title: Inspect duplicates before merging — inline candidate view + a different-dates guard so two-paychecks-a-month is never merged
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: DR-0189 (learned dedupe), the manual Combine flow
principles: [VERIFICATION-DOCTRINE (DR-0076), INLINE-NO-JUMPING (DR-0201), ANXIETY-CLARITY-PRINCIPLE, DATA-AS-EMPOWERMENT]
---

## Context

Darrell, 2026-07-20, two messages while reviewing the Imported register:

> "I'll need to inspect the duplicates after they are noticed so maybe a dropdown
> menu will work? ... date time same exactly or differences etc... need to be able
> to inspect the dates of the duplicates..."

and, with a Salary-category screenshot (University of IL Payroll posting on Jul 01 =
$2,271.97 AND Jul 15 = $2,274.78; two Church payroll rows on Jul 15 at different
amounts):

> "there should be two entries per month for this salary..."

The real-world truth this surfaces: a salary legitimately posts **twice a month**.
Same payee, different date (and often a slightly different amount) is NOT a
duplicate — it is two separate paychecks. The family needs to *inspect the dates*
before merging, and the merge flow must not let two real paychecks collapse into one.

## Reality-trace (DR-0076)

- Learned-duplicate groups are keyed by `dedupeSignature = payeeKey | date | amount |
  account` (`learned-dedupe.js`). Every member of a learned group therefore already
  shares the exact date, amount, and account — the two-paychecks case (different date
  or amount) can never enter a learned group. That path was already safe.
- The gap was the **manual multi-select Combine**, which warned only on *amount*
  difference, not *date* difference. Selecting Jul 01 + Jul 15 payroll would slip
  through.
- Bank rows carry a **date only** (`t.date`), no clock time. "Same date/time exactly"
  resolves to same-date; we never fabricate a timestamp.

## The decision

1. **Inline inspection on learned-duplicate groups.** Each learned group gets an
   **Inspect** toggle that expands IN PLACE (DR-0201, no jumping) to list every
   candidate row's **date · account · full description · amount**, plus a plain note:
   all members share the same date/amount/account, and whether their full
   descriptions match exactly (true duplicate) or differ (check before combining).
   The full description is the real differentiator, since date/amount/account are
   identical by signature.
2. **Different-dates guard on manual Combine.** If the selected rows span more than
   one `posted` date, Combine warns distinctly — *"these are on DIFFERENT dates
   (…, …); different dates usually mean SEPARATE payments — like a salary that posts
   twice a month — not duplicates."* — and lists the dates so the family decides with
   the facts in front of them.
3. **Learning only from a confident combine.** A combine now teaches the payee
   (`teachDedupe`) only when the rows are BOTH same-amount AND same-date, so a
   different-date merge never trains a false duplicate shape.

## Opportunities & Constraints

- **Opportunity:** removes the "did I just merge two real paychecks?" fear
  (ANXIETY-CLARITY) — inspection shows the dates before the irreversible merge, and
  the guard catches the exact two-per-month case Darrell named.
- **Constraint:** bank feeds give a date, not a time; the inspection shows the date
  honestly and labels same-date matches rather than inventing a clock time (DR-0076).
  Since learned-group members are same-date by construction, the inspection's value is
  exposing the full descriptions (e.g. PPD-ID suffixes).

## Verification (DR-0076)

`imported-render.test.jsx` (+2): (a) selecting two same-amount rows on different
dates warns with a "DIFFERENT dates" message listing both dates and does NOT merge
when declined; (b) a learned group's **Inspect** toggle expands inline
(`aria-expanded` false→true) and reveals each candidate row's date + account + the
same-date/amount confirmation. Consistency + contrast + full suite green. REV-0174;
memory `feedback_inspect_duplicates_before_merge`.
