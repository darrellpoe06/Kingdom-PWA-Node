# DR-0358 — What is owed, what was paid, and the document that proves it

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

- *"validate our accounting systems for evaluating our process for payable and receivables... use language that businesses use for house hold workflows to support families and educate our children etc..."*
- *"Accounting module needs to be tight..."*
- *"like pay this bill or you paid this bill and this is the supporting documents associated with this bill or priority or paid in full documents so people can review their documents that came in that day and sort them to their respective products and locations for users to see a now or later whenever they want"*

## What is true (SHOULD / ARE / GAPS) — the validation he asked for

**SHOULD:** the books say what is owed, by whom, when it is due, whether it has been paid, and hold the paper that proves it.

**ARE, traced before writing a line:**

| Claim | Reality |
|---|---|
| The app has A/P and A/R | **It has neither, and no vocabulary for either.** "accounts payable", "accounts receivable", "A/R", "aging", "net 30", "chart of accounts", "write-off" return **zero hits** in `app/src`. |
| `invoices` models an obligation | The table is in `schema-v2.4-contractor.sql` with the right shape — **and does not exist in the live database.** Never applied, never in the sync registry, never queried. |
| `debts` tracks what the household owes | It tracks a balance and a rate and **has no due date**. The app's own screens say so: *"the payment DUE DATE above all, without which on-time/late cannot be computed from anything we store."* |
| There is a bill list | It is `recurringObligations`, a JSON array inside the monolith's state, with one rolling `nextDue` and **no paid state per period**. |
| Reconciliation ties money to obligations | It proves **arithmetic** — that parts sum to the whole. **No imported bank row has ever marked a bill or invoice paid.** |
| Rent works | **Yes.** `rent_payments` (expected vs received vs status) posting once into the books under DR-0313's trigger is the one real obligation→settlement→books chain in the system. |
| The children are taught about money | `child-books-view.js` teaches income, giving, saving, spending against real rows — **and never owing or being owed**, exactly as the schema never modelled them. |

**GAPS:** everything outside rent was settlement-only. The ledger held cash *movement* and nothing that said a thing was *owed*.

## Decisions

1. **Three tables, and the discipline is in what they refuse** (migration 0202). `obligations` — a promise of money, one direction, with a due date the database itself requires (`obligations_dated_chk`): standard terms need an issue date to count from, agreed terms need the agreed date. That check is precisely the hole `debts` has. `obligation_settlements` — money that actually moved, **append-only**: no INSERT, UPDATE or DELETE policy exists, so a payment is added through the function and can never be quietly rewritten. `obligation_documents` — the paper, in Darrell's own three roles: `the-bill`, `proof-of-payment`, `supporting`.
2. **Status is never stored.** Open, partially paid, paid, past due are worked out from the settlements and the calendar every time they are read (`lib/obligations.js`). A stored status is a status that eventually disagrees with its own rows; this one cannot. The word `status` is not a column on any of the three tables.
3. **Money is integer cents.** Never a float, anywhere — a ledger that rounds is a ledger that argues. The test proves the classic trap: ten times ten cents is exactly one dollar here.
4. **Aging is the standard business ladder** — current, 1–30, 31–60, 61–90, 90+ — with the boundaries exactly where a business puts them (due today is not late; one day past is `1-30`). Every bucket total is a sum of rows you can open.
5. **Net position always shows both halves.** Receivables minus payables is reported with `weOweCents` and `owedToUsCents` beside it, never as one number that hides which direction it came from.
6. **Settling from a real bank row closes the loop that was never closed.** `transactions.linked_to_kind` / `linked_to_id` have been in the schema since the first version and nothing ever resolved them. A settlement carrying a transaction now writes them, and a unique index means one bank row settles one obligation once — the no-double-count rule the rent ledger already learned.
7. **The business words ARE the household words, and they carry the lesson.** Every term in `ACCOUNTING_TERMS` has the phrase a business uses, the same thing said plainly, and the one sentence a child gets — defined against this household's own rows rather than a textbook's. This is the household's first accounting class, and it runs on real bills.
8. **A write-off is recorded, never deleted, and never without a reason.** Voiding (it was never really owed) and writing off (we are not going to collect) are distinct states, both audited, both requiring words.
9. **The day's post.** A document that arrives is sorted — what it means (`bill-to-pay`, `proof-of-payment`, `for-the-record`), which product (`poetech`, `properties`, `tlc`), which place — reversibly, recorded, by the person who filed it or an owner/admin. Unsorted is a real state, so "now or later" is a choice the pile itself supports.
10. **The role wall is the books' own, not a new one.** Read is denied to `child` and `assistant` exactly as `transactions` and `debts` deny them (0082/0100). A child does not meet the household's debts by walking into a tab; what a child sees stays the guardian's decision under DR-0094.

## What this deliberately did NOT do

- **No surface yet.** The ledger, the walls, the seam and the arithmetic are in. The screen that shows the two columns, the aging ladder, the day's post and the glossary is the next commit. *re-review: 2026-09-14.*
- **`debts` still has no due date.** Giving it one, or migrating debts into obligations, is the next slice — named here so it is not lost.
- **Recurring bills are still a JSON array in monolith state.** Turning each period into a real obligation row is the slice after that.
- **Rent is not yet unified.** `rent_payments` already works and posts under DR-0313's trigger; folding it into this ledger without breaking that trigger is its own change.

## Proof

`0202-obligations-smoke.sql` on the `product-forms` isolation leg (the child and assistant refused, a member refused a write, an owner of another household refused, one transaction refused twice, a settlement refused rewriting and deletion, a void refused settlement, a write-off refused without a reason, an unshared document refused attachment, sorting proven reversible); `obligations.test.js` (21).
