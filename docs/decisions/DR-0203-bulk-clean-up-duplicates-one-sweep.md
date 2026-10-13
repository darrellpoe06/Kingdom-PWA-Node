---
id: DR-0203
title: Clean up duplicates in one sweep — the AI clears exact copies up front, keep-exceptions by uncheck; one consolidated duplicates surface
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: DR-0189 (learned dedupe), DR-0202 (inspect before merging)
principles: [VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT, ANXIETY-CLARITY-PRINCIPLE, INLINE-NO-JUMPING (DR-0201), PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-20, across several messages while cleaning the imported ledger
(screenshots: CASH APP, FIRST MID-ILLINOIS, ATM, WM SUPERCENTER groups; and the
deployed "Duplicates the system learned from you" panel showing 17 two-copy groups):

> "This is a thorough way of going through, however everyone has been a duplicate —
> can we clean this up for our users and they can add back what is not there, and
> that would be less work... AI cleans up these obvious duplicates that are exactly
> the same date and amount of money... we don't pay twice for the exact same thing...
> almost ever."

and then, on the shipped per-group flow:

> "It already works great, however initially this should be cleaned up especially
> since I'm just agreeing because it's right."

The per-group Inspect/Combine (DR-0202) is correct but makes the family stamp
"Combine" on group after group — 17 rubber-stamps in the screenshot — when every one
is an obvious exact duplicate. "Initially" is the key word: on a first import nothing
is taught yet, so the learned-only panel is empty exactly when the duplicates are
worst.

## Reality-trace (DR-0076)

- `findExactDuplicates(transactions)` (new, in `learned-dedupe.js`) groups the WHOLE
  ledger by `dedupeSignature` = payee + date + amount + account, needs NO prior
  teaching, keeps the fullest row of each group and returns the extra copies to
  remove. It is a superset of the taught-only `suggestLearnedDuplicates`.
- Real duplicate imports carry IDENTICAL descriptions (one row minted twice), so the
  strict full-payee signature matches them; genuinely different payees (differing
  words) never collapse.
- Different-DATE rows (two paychecks a month) can never share a signature, so the
  salary case is safe by construction (DR-0202 continues to hold on the manual path).

## The decision

1. **One-tap bulk clean-up.** A "Clean up duplicates" panel lists every exact-copy
   group, pre-checked to remove (keeping the fullest), with the total copy count. One
   **Remove N duplicates** clears them all — replacing N individual Combine taps.
2. **Keep-exceptions by uncheck ("add back", done safely up front).** The rare real
   repeat — "almost ever" we don't pay twice — is a single uncheck that keeps both
   rows. The keep decision happens BEFORE deletion, so nothing is destroyed and no
   post-hoc restore is needed. (True post-deletion undo is a bigger soft-delete
   architecture — scoped as a dated follow-up, `re-review: 2026-10-20`, not blocking.)
3. **One consolidated duplicates surface.** The separate "Duplicates the system
   learned from you" list is folded INTO this panel: per-row **Inspect** (inline
   date · account · full description, DR-0201) is carried over, so there is a single
   place to bulk-remove, keep, or inspect — less clutter, not more.
4. **The sweep teaches.** Removing via the sweep records each payee (`teachDedupe`),
   so future identical imports are recognized too.

## Opportunities & Constraints

- **Opportunity:** turns the whole duplicate mess into one reviewed tap; removes the
  rubber-stamp fatigue Darrell named; works on the FIRST import with zero teaching.
- **Constraint:** bulk removal of financial rows is destructive, so every removal is
  PREVIEWED and per-group opt-out-able (safer than the one-tap DEBIT/CREDIT remover
  already shipping). Only EXACT same-payee+date+amount+account copies sweep; the
  fullest row's category wins when copies were categorized differently. Post-deletion
  undo deferred with a re-review date (DR-0075).

## Verification (DR-0076)

`learned-dedupe.test.js` (+2): `findExactDuplicates` groups every exact repeat, keeps
the fullest, ignores a solo charge, and never groups two different-date paychecks.
`imported-render.test.jsx` (+1, and the DR-0202 inspect test re-pointed to this
panel): the bulk panel renders, unchecking a group (a real second ATM withdrawal)
keeps it and drops the Remove count, and Remove targets only the still-checked copies;
Inspect expands inline to show date + account. Lint clean; consistency + contrast +
legibility green; full suite green. REV-0175; memory `feedback_bulk_clean_duplicates`.
