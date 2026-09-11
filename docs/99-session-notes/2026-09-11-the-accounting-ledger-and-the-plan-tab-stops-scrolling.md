# 2026-09-11 — The accounting ledger lands, and the Plan tab stops being a scroll

## What shipped

### 1. The obligation ledger (DR-0358, migration 0202) — PR #1521

Darrell: *"validate our accounting systems for evaluating our process for payable
and receivables... Accounting module needs to be tight..."*

The validation came first and it was not flattering. The app had **no accounts
payable and no accounts receivable, and no vocabulary for either** — "accounts
payable", "accounts receivable", "aging", "net 30", "chart of accounts",
"write-off" all return zero hits in `app/src`. `invoices` has the right shape in
`schema-v2.4-contractor.sql` and **does not exist in the live database**. `debts`
tracks a balance and a rate and **has no due date**, so on-time and late cannot be
computed from anything we store. Reconciliation proves arithmetic and has never
closed an obligation. Rent was the one working chain.

Migration 0202 adds the half that was missing: `obligations` (with a due basis the
database itself requires), `obligation_settlements` (append-only — no insert,
update or delete policy exists at all), and `obligation_documents` (the-bill /
proof-of-payment / supporting). Status is derived, never stored. Money is integer
cents. Settling from a real bank row finally writes
`transactions.linked_to_kind` / `linked_to_id`, which have sat in the schema since
the first version with nothing ever resolving them.

Proof: `0202-obligations-smoke.sql` on the product-forms isolation leg;
`obligations.test.js` (21); full suite 13,327 passing; lint clean; 15 guards green;
layout sweep green.

**One real defect found and fixed in the same commit:** appending 0202 to the
product-forms leg broke an *earlier* test's pin, because that pin asserted the
smoke list ended at 0201. Both pins (in `product-forms.test.js` and
`obligations.test.js`) now match *within* the quoted list instead of at its end, so
the next migration to ride this leg will not break an older assertion. This is the
second time the same brittleness bit — it is now gone from both sides.

### 2. The Plan tab stops being a death scroll

Darrell, with a screenshot of Books → Plan: *"The plan tab needs the sub-tab scroll
feature so the information doesn't get lost on the death scroll... fix it... using
our Ways and documentation."*

He is right, and the Way was already written. `SectionTabs` exists precisely for
this (Darrell 2026-07-04: *"let's use the sliding tabs for all tabs instead of a
long scroll on any tab"*), and its own header says *"other long tabs follow the
same call."* The Plan tab never did. It stacked eight worksheets plus the Legacy
Provisions system down one page — so the **bill calendar, the part you actually
need on a Tuesday, sat past eight screens of scrolling.**

`FamilyPlan.jsx` now renders one `variant="sub"` strip (the third row: nav slides,
Books' sub-tabs slide, and now the Plan's sections slide):

The plan · Dashboard · Debt tracker · Monthly budget · Cash & catch-up ·
Payoff checkpoints · Bill calendar · **Legacy provisions**

Three things that matter about how it was done:

- **Only worksheets the plan row actually carries become tabs.** A plan without a
  cash plan does not grow an empty "Cash & catch-up" tab. The surface still shows
  what IS and only that (DR-0076) — exactly as the stacked version did.
- **Legacy provisions is a peer tab, not a footer.** It was the most-lost content
  on the page, below everything else. It is now one tap from the top, and it still
  renders whether or not a plan row exists — the loading / failed / not-yet-published
  states are about the *document*, and the trust system is not the document.
- **Panels mount lazily**, so opening the Plan tab is now cheaper than it was, not
  more expensive.

This is not a new decision — it is the 2026-07-04 sliding-tabs Way applied to one
more tab, which is the perpetual-improvement default (DR-0075), so it rides the
lane as normal flow rather than minting a DR.

**Proven-to-catch (DR-0076 §3), not asserted.** The new tests were deliberately
broken before being trusted:
- forcing the cash section to render unconditionally → *"a worksheet the plan does
  not carry never becomes an empty tab"* fails.
- renaming "Bill calendar" to "Calendar" → both reachability tests fail.
Restored, all 9 green.

The render test was rewritten rather than relaxed: because only the open panel is
mounted, each test now *clicks to* its section before asserting. That is a stronger
proof than the old one — it shows every worksheet is still reachable, and reachable
in one tap.

## Answers Darrell gave that are now queued work

1. **Debts join the obligation ledger with a real due date** — closes the gap
   DR-0358 named.
2. **Mortgage payments become line items that sum to the total** (principal and
   interest, taxes, insurance, and the rest), and **each door's tenant payments are
   set against that total so the monthly gap / profit is visible.** This also folds
   `rent_payments` into the same ledger without disturbing DR-0313's posting trigger.
3. **A child may sort the day's post** — *"We want our children to learn the process
   and a system helps them to learn how we work."* The design that honors both this
   and the books' role wall: a child sorts what a guardian has released into the
   tray (meaning, product, place), and never meets the ledger or the amounts. The
   sorting is the lesson; the books are not (0082/0100, DR-0094).
4. **A spreadsheet-shaped surface over the real rows** — *"an excel type system that
   makes connections between money and data flows inside our systems."* Every cell
   must trace to the record it came from; a painted grid would be worse than none
   (DR-0061). This one gets a reality-trace before any code.

## Still open

- **No accounting surface yet** — the ledger, the walls, the seam and the arithmetic
  are in; the two-column view, the aging ladder, the day's post and the glossary are
  next. *re-review: 2026-09-14.*
- Poe Properties' own instance — approved by Darrell, not yet built.
- The typed split of the three composite intake questions — still his call.
  *re-review: 2026-09-17.*
- Darrell still needs to delete the CAQH password cell from the responses sheet.
