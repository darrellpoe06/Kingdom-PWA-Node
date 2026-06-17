# Concern note — Books → Tx financial figures were static literals, now derived

**Date:** 2026-06-17
**Branch:** `feat/dynamic-financial-figures`
**Severity:** data-integrity (a trust surface displaying numbers that do not move with the data)
**Governs:** Verification Doctrine (DR-0076 — measure, don't claim) · Reality-Trace (DR-0061, P15 — a surface is a live view of real state) · App-is-primary

## The concern (confirmed from live screenshots)

In **Books → Tx**, the cash figures read as live but did not move with the underlying data:

- **"Chase Personal Checking …8168"** showed **$4,223** for *Right now* **and** *After upcoming charges clear* — identical, despite a **-$65** upcoming Phone charge that should have lowered the projected number.
- The **30 / 60 / 90 forecast** showed **$4,223 flat** across Now / +30d / +60d / +90d.
- The **prior 30 / 60 / 90 actuals** repeated **+$7,165** in all three columns.

A figure that never changes when the data changes is, functionally, a hardcoded literal — even when it is computed — because the inputs are degenerate. That is exactly the "looks-right-but-isn't" class the Verification Doctrine names.

## Root cause (characterize-before-change)

The math was *already* computed in code, but three degeneracies made every output collapse to the stored literal:

1. **"Right now" read the stored literal `account.balance`** rather than deriving from the account's own transactions. So it could only ever equal the seed number.
2. **Upcoming recurring obligations carried no `accountId`.** The "after upcoming" card and the forward forecast only count upcoming items whose `accountId` matches the account — so obligations (the Phone charge, insurance, etc.) never reduced the projection. `4223 + 0 = 4223`.
3. **All seed transactions fell inside a single 30-day window** (demo `currentDate` = 2026-05-15; all five Chase rows dated 2026-05-01…05-15). The trailing −30/−60/−90 windows therefore captured the *same* set every time → the repeated +$7,165.

## The fix (make the math live; keep the seed)

Seed *values* are intentional demo data and were **not** replaced. Instead the math now recomputes from underlying transactions, and minimal underlying seed entries were added so the computed figures are plausible and genuinely vary:

1. **`Right now` is derived** = `openingBalance` + cleared (settled, date ≤ today) history for that account. Added an explicit `openingBalance` to each seed account so the derived "now" equals the intended seed display on first load, then moves as real entries clear.
2. **`After upcoming charges clear`** = `Right now` + that account's upcoming items. Recurring obligations now carry an `accountId`, so the **-$65 Phone** (and the other personal bill-pay obligations) actually flow through and the number differs.
3. **30 / 60 / 90 forecast** = derived `Right now` + obligations dated within each horizon → genuinely different per column.
4. **Prior 30 / 60 / 90 actuals** = real per-period sums; older seed transactions were added so the windows differ instead of repeating one constant.
5. **Inline per-row `(now $X)`** balances use the same derived source.

Anything entered later (a real transaction or obligation) flows through and updates all five surfaces.

## Follow-up concern (logged, not yet fixed)

`account.balance` is still read as a literal by **non-Books** surfaces (Accounts list, dashboards — ~45 reads across the monolith). After a user adds a *cleared* transaction, the Books → Tx "now" will move while those other surfaces will not, until they adopt the same derived helper. **re-review:** 2026-07-15 — fold the derived-balance helper into the remaining `.balance` reads (or recompute `balance` on tx mutation) so every surface agrees. Scoped out of this change to keep the blast radius small and the gates green.
