---
id: DR-0200
title: The subscription audit lives on the Imported Recurring-payments KPI (real auto-detected data), not a manual empty tab
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: moves the keep/review/cancel audit function onto Books → Imported; Cart kept as the manual catch-all
principles: [APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061 / P15), VERIFICATION-DOCTRINE (DR-0076), ANXIETY-CLARITY-PRINCIPLE, DATA-AS-EMPOWERMENT]
---

## Context

Darrell, 2026-07-20 (Cart screenshot — the "Subscriptions Audit" — empty; Imported
screenshot — the Recurring payments KPI detecting 32 patterns):

> "Can we add this function to the Imported Tab instead of its own tab?
> Opportunities and constraints." → "I don't believe it works, I believe it's
> static."

**Verified first (DR-0076):** the Cart is NOT painted — `Cart.jsx` renders a real
`subscriptions` prop through a real synced doc-rail (`subscriptionsSync`,
monolith 2958-2959); this session's data-integrity audit classified it clean/live.
But it is **manual-entry only, so it sits empty** — live plumbing, no water. It
*feels* static because it does nothing until you hand-enter every subscription.
Meanwhile the Imported **Recurring payments KPI already auto-detects** every
recurring charge from the real ledger (`detectRecurring(data.transactions)`) — the
working version of what the Cart only promised via "future Plaid build."

## The decision (Darrell chose "build in Imported, keep Cart")

**The keep / review / cancel subscription audit now lives ON the auto-detected
Recurring payments KPI.** Each detected pattern carries a decision the family sets;
the flagged ones (review + cancel) total the **potential savings** — the number
that makes the audit worth doing. Powered by real data, it is never empty and needs
no manual entry or Plaid.

- `lib/recurring-decisions.js` — a device-local, fail-soft decision store keyed by
  the pattern's stable `key` (mirrors `report-usage.js`); `summarizeDecisions`
  computes total/cycle, flagged count, and potential savings. Pure + tested. No
  monolith growth (stays frozen).
- The Recurring KPI node renders Keep / Review / Cancel per pattern (green / coral /
  brown — the Cart's own status palette; NO true red, DR-0099 color theology),
  strikes through a cancelled amount, and shows the savings summary in the header.
- Full list + grows to any (DR-0197); one opt-in report at a time (DR-0195).

**Cart kept** as the manual catch-all (annual renewals / irregular cadence the
detector can miss). Retiring the Cart tab is a separate nav decision, deferred.

## Opportunities & Constraints

- **Opportunity:** the audit runs on real auto-detected data — never empty, no
  manual entry (the exact friction that left the Cart blank). Serves ANXIETY-CLARITY
  (what am I actually paying? what can I cut?) with live numbers, and
  DATA-AS-EMPOWERMENT (the family sees + decides on their own recurring spend).
- **Constraint — decisions are device-local for now.** They persist per browser
  (like the usage-ranking), not synced across devices or into the Cart's rail. A
  synced version would touch the frozen monolith; deferred. `re-review: 2026-10-20`.
- **Constraint — detector coverage.** Irregular/annual charges may not be detected;
  the Cart remains the manual catch-all until (if) it's retired.

## Verification (DR-0076)

`recurring-decisions.test.js` (5): set/persist, toggle-off, potential-savings =
review+cancel amounts (keep excluded), fail-soft + hostile-value drop, empty→zeros.
`imported-render.test.jsx` (+1): real mount — expand Recurring, click Cancel → the
pattern is flagged, the savings line appears, and the decision persists to
localStorage. Lint + consistency-guard + legibility (regenerated) + full suite
(6228) green. REV-0172; memory `feedback_subscription_audit_on_imported_recurring`.
