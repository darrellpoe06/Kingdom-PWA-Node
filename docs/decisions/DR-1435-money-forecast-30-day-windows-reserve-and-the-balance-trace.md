# DR-1435: The $10,000 is a goal, not a cushion — only money set aside is protected; every verified balance lists the rows that moved it; a row is cleared by its calendar day

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (Money surfaces and pure engine arithmetic; one new key on the plan snapshot, no table or sync change; financial records are never written by this change)
**Type:** fix + feature
**Area:** `app/src/lib/safe-to-spend.js` (`reserveStatus`, `DEFAULT_PERSONAL_RESERVE_GOAL`, `forScope`, `extraDebtCapacity`), `app/src/lib/money-plan.js` (`reserveGoalByEntity`, `reserveDesignations`), `app/src/lib/financial-engineering.js` (`deriveAccountBalances`, `balanceTrace`), `app/src/components/money/MoneyComingUp.jsx` (`ReservePanel`, `Trace`, the reserve and goal lines), `app/src/components/money/MoneyOverview.jsx`
**Sent in by:** Christina, 2026-11-11, the FOS Money go-live brief and her correction the same day: *"The $10,000 reserve is my SAVINGS GOAL, not my current reserve balance. I do not currently have $10,000 set aside... Only protect money I have actually designated as reserved... Help me determine how much I can safely contribute toward my reserve and additional debt payments after accounting for upcoming bills."*
**Stacked on:** PR #2609 (`fix/money-three-accounts`, Darrell's parallel session the same day: account matching by the name's digits, the owner question, bank spellings, the `11/07` row date, the checkpoint trail, 7/14/30-day and past-due windows, and `lib/cash-forecast.js`). This record carries only what that PR does not.
**Pairs with:** DR-0076 (no claim without evidence), DR-0061 (reality-trace before building), DR-1379 (a test may not pin today), PR #2540 / #2584

## Context

Two sessions worked Christina's brief at once. #2609 landed first on the forecast, the windows and the screenshot-matching causes. Measured against it, this session's work had three things #2609 did not, and one of them was wrong the first time:

1. **The reserve.** The first cut of this record made $10,000 the Personal cushion by default. Christina corrected it before anything merged: $10,000 is what she is saving toward, not money she holds. A cushion that subtracts a goal reads $0 spendable against every real balance and hides the one number she needs, which is how much she can safely move toward the goal today.
2. **The rows themselves.** #2609's trail says how many rows moved a verified figure and by how much (`sinceVerified: { count, net }`). It does not list them, so on the phone the $1,939.53 between the bank's $4,479.53 and the app's $2,540 still has no names. This session has no road to the live database (no route to the NAS; the tailnet key is revoked, DR-1283 / DR-1298 / DR-1302), so the cause is not asserted here; the surface names the rows.
3. **The day boundary.** `deriveAccountBalances` cleared a row by `new Date(t.date) <= asOf`. `new Date('2026-11-12')` is UTC midnight, 6pm on the 11th in Kansas, so a bill-pay row scheduled for tomorrow was subtracted from tonight's verified balance after 6pm. Reproduced under `TZ=America/Chicago`.

## What was measured

- **The reserve fallback before** (`forScope`): `reserveByEntity.personal` → `reserveByEntity[sc.id]` → `settings.minCushion` → `meta.bufferTarget`. The handoff of 2026-11-05 records the Overview showing the $2,000 buffer as the reserve. The buffer is the Accounts page's savings TARGET, so it too was a goal being subtracted.
- **The first cut, caught by her correction:** with $10,000 as the default cushion, the test fixture's $3,183 of verified cash read Safe to Spend $0 and a $6,817 shortfall. Under the corrected model the same fixture reads a positive Safe to Spend with $10,000 still to save.
- **The trail in #2609** (`balanceSources[].sinceVerified`): `{ count, net }` only; the rows are not on the surface. `balanceTrace` returns the same rows the engine nets, so the two never disagree: the test pins `balanceTrace(...).balance === deriveAccountBalances(...)[id]`.
- **The day boundary**: `deriveAccountBalances` line 113 on `main` `ac8a850` read `cleared: d <= asOf` with `d = new Date(t.date)`. Under `TZ=America/Chicago`, a row dated `2026-11-12` on an account checked at $4,479.53 on 11-09 with two rows after it read $540 at 8pm on the 11th (the old rule) against $2,540 (the calendar rule).
- **On `main` before the change**: 24 Money and intake suites, 311 cases green. On the stack after it: 24 Money suites, 315 green; the 137 dependent files green; `vite build` green.

## Impact

- A Personal pocket with nothing set aside protects $0 and shows the $10,000 goal with $10,000 still to save; Safe to Spend is what the chronological walk allows above the bills. Each amount she sets aside raises the protected cushion by exactly that amount and lowers Safe to Spend by the same, so nothing is counted twice. A figure typed under the pocket's reserve key is honored as money set aside (the records already saved under it keep their meaning).
- The "extra debt" line becomes one pool for both uses, "Safe to put toward your reserve or extra debt today", with a suggested split that fills the goal first.
- Coming Up's cash line lists, under each account, every row dated after the bank check with its day, description and amount, so an old figure explains itself on the phone and the fix is one upload.
- A row scheduled for tomorrow no longer lowers tonight's verified balance after 6pm Central.
- Business pockets keep their existing cushion chain (their own key or designations, else the household cushion, else the buffer target); the Personal goal never leaks into them; a designation for one pocket never reaches another, in the combined view too.

## Decision

- **Two records, never one.** `settings.reserveGoalByEntity[key]` is the goal (Personal defaults to `DEFAULT_PERSONAL_RESERVE_GOAL = 10000` until one is saved); `moneyPlan.reserveDesignations[]` (`{ id, scope, date, amount, note }`) is money set aside, recorded as funds become available, a negative amount taking it back out; `reserveByEntity[key]` remains honored as money set aside by hand.
- **`reserveStatus(data, settings, sc)`** (pure) returns `designated`, `goal`, `remaining`, `pct`, `designations`, and the `cushion` the walk protects: the designated money when anything is set aside; else an explicit household cushion for Personal, or nothing (a target is never subtracted); business pockets unchanged. `lines.reserve` carries it; `windows.reserveSource` is `designated | household | none`.
- **`extraDebtCapacity`** adds `reserve: { remaining, suggested, debtAfter }`: the pool is unchanged (the smaller of the chosen period's and the 30-day Safe to Spend), the suggestion fills the goal first.
- **The panel** (`ReservePanel`): set aside so far / goal / still to save with a progress bar; Save goal; Add to reserve (amount, date, note) with the list of designations and remove; the by-hand reserve kept. The Emergency reserve goal line sits under the protected-cushion line and says what the goal is for.
- **`balanceTrace(data, accountId, asOf)`** and the `Trace` under each account on Coming Up, with the fix named: a screenshot of today's balance becomes the new bank check and outranks every row before it.
- **A row is cleared by its local calendar day.**

## What this does NOT decide

- Whether 3322's and 8168's live figures are wrong because of rows after a check, a check never recorded, or an older screenshot. The trace shows the rows; Christina reads them on the Fold. No financial record is changed.
- Which bank account the reserve physically lives in. A designation records a decision, not a transfer; moving money to a savings account is a transfer row like any other.
- The six First State Bank loans and the loan→property map (deferred by Darrell).

## Verification

- `money-coming-up-30-days.test.jsx` (13): the 7 ⊆ 14 ⊆ 30 windows; **proven to catch** — nothing set aside protects $0, Safe to Spend is positive, the buffer target is not protected, the goal reads $10,000 with $10,000 to save; a designation ledger with a withdrawal protects $1,300 to the cent and lowers Safe to Spend by exactly $1,300; a typed reserve plus designations with a saved $12,000 goal; an explicit household cushion still holds; a business pocket unchanged and never inheriting the goal; a designation for one pocket never reaching another, in the combined view too; the one pool and its split, falling by exactly what is set aside; the plan carries both records through a later patch; the real panel at 360px shows the lines, the designations list and the suggested split; Set aside and Save goal call their handlers with the exact records; no editor without handlers, no trace without data.
- `money-balance-trace.test.js` (5): 3322 = $4,479.53 check + two rows = $2,540.00 with both rows named; TLC with no check = anchor + rows; a newer check outranks the rows; **proven to catch** under Central time — a row dated tomorrow is not subtracted at 8pm tonight and is counted the next morning.
- `money-entities.test.jsx` and `money-personal-reserve.test.jsx` keep their pins: a reserve typed per entity is that entity's cushion (now labeled `designated`), never another's.
- On the stack: 24 Money suites, 315 green; the 137 test files that import the changed modules green; lint clean; the new files Prettier-formatted (DR-1343); `vite build` green.

`re-review: 2026-11-18` — read what the trace showed for 3322 and 8168 and close the cause as a fix or a record; read the first week of designations against the goal.
