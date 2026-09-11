# DR-0364 — The plan becomes rows: the dated bills import into the ledger

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## The measurement that produced this decision

Traced against the live database, 2026-09-11, before any code:

| Table | Rows |
|---|---|
| `family_plans` | **1** — Christina's August workbook: **36** debt-tracker entries, **61** dated monthly bills, **13** cash-plan rows |
| `transactions` | **2,949** |
| `rentals` | 12 doors — 1 with a rent figure, 1 with a mortgage payment, 0 with escrow |
| `debts` | **0** |
| `obligations` | **0** |
| `family_documents` | **0** |

**The household's entire financial picture existed as JSON inside one row, while every structured table the accounting module reads was empty.** That is why the Owed surface, the aging ladder and the per-door gap all correctly showed "nothing entered" — they were honest about a database that held nothing.

This also corrects a plan I had stated: I intended to "bring `debts` into the obligation ledger". `debts` has **zero rows**. There was nothing to migrate. The bottleneck was never the schema; it is that the numbers never became rows.

## Decisions

1. **The 61 dated bills import; the 36 debts do not, and the difference is a finding.** A dated bill carries a `day` (measured: integers 1–29, and all 61 carry both a day and an amount), so each becomes a payable with a **real due date** — the thing `debts` has never had (DR-0358). A debt in the plan carries balance, APR, minimum payment and a payoff timeline and **no day it is due**. An obligation without a day cannot be late, and inventing one would be the painted number this ledger exists to refuse. The function reports `debtsNotImported` with the reason, every run.
2. **Preview before write.** `dry_run` defaults **true**: the function returns exactly what it would create and writes nothing until called again with `dry_run false`. Ninety-seven rows landing in someone's books unannounced is not an import, it is an accident.
3. **Idempotent by construction.** Every imported row carries `external_ref = 'plan-bill:<ordinal>:<day>:<payee>'`, and a run skips what it finds. A second run cannot double-count the household's bills — the exact failure this ledger was built to prevent.
4. **The ordinal is in the key because of a measured bug.** See below.
5. **An incomplete bill is refused, never guessed** (no payee, no day, or a non-positive amount), and counted in `refusedIncomplete`.
6. **A day past the end of a short month lands on that month's last day**, never rolling into the next one — day 31 in February is the 28th, because moving a bill to another month is a worse error than clamping it.
7. **Owner or admin only.** A member and a child are both refused.

## The $184.99 bug — caught by running it against the real plan

The first key was `plan-bill:<day>:<payee>`. Running the import against Christina's actual workbook before shipping it:

| Step | proposed | created | skipped | total |
|---|---|---|---|---|
| dry run | 59 | 0 | 0 | $11,360.19 |
| apply | 59 | **56** | **3** | **$11,175.20** |

**Three of the 61 bills share a payee *and* a day with another bill.** The key collapsed them, so the import silently dropped three real bills worth **$184.99** — a dedupe key swallowing genuine duplicates, which is precisely the class of error this ledger exists to prevent. `WITH ORDINALITY`, with the ordinal in the key, fixes it. The plan array's order is stable, so the ordinal is stable, so idempotency survives.

After the fix, against the same real plan: **59 proposed → 59 created → 0 skipped → $11,360.19 in the table**, and a second run **skipped all 59** with the row count unchanged.

**Independent cross-check** (DR-0076 §7): the plan's own stated `datedBillsTotal` is **$11,360.19**; the sum of all 61 entries is **$11,360.19**; the import's total is **$11,360.19**. To the cent, against a number computed by someone else. The 2 refused entries carry $0, so nothing is lost.

Every one of these runs was inside a rolled-back transaction; production still holds **0 obligations** and the function is confirmed absent from it.

## Proof

- The live reproduction and fix above, rollback verified.
- `0206-plan-import-smoke.sql` on the `product-forms` leg — dry run writes nothing; apply creates every complete bill; **both bills sharing a payee and a day survive**; a second apply duplicates nothing; the incomplete bill is refused; the debt never becomes an obligation; day 31 of February lands on the 28th; the total is exact in integer cents; a member and a child are refused. All 15 assertions run green against the live schema before pushing.
- `plan-import.test.js` (11).
- The smoke carried its own defect, caught the same way: it inserted `family_plans (created_by)`, a column that does not exist — the table has `slug` and `updated_by`. Fixed before pushing rather than on the leg, which is the lesson of DR-0361 applied one migration later.

## What this deliberately did NOT do

- **It does not run itself, and nothing schedules it.** The import exists; pressing it is a person's act.
- **No debt import**, until a due day exists for one. That is the next real slice, and it needs a number only the household holds.
- **No surface yet** — the function and its proof land first. *re-review: 2026-09-16.*
