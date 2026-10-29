# Money — Phase 3 functional audit (2026-10-28)

**Asked by:** Christina, 2026-10-28 — "I want to try to break this application before approving it for production." Eight tests, synthetic data only, every result stated as tested / expected / actual / verdict / severity, defects listed in priority, fixes only with separate approval.

**Where the evidence lives.** TEST 1–5 are executable: `app/src/__tests__/money-functional-audit.test.js` (45 cases, every expectation written before the run; where the engine differs the case is marked DEFECT-n and asserts the measured behaviour). TEST 6–8 ran in a browser against the branch build on Playwright's Galaxy Z Fold 7 Cover descriptor (360 × 764, Samsung user agent, touch) and the localhost device world. The security findings came from reading the shell and from read-only queries of the live database.

**Branch:** `money/phase-2-safe-to-spend` (PR #2464, draft + `hold`). Nothing merged, nothing deployed, no production record modified by this audit.

---

## The security finding that paused the audit (resolved on the branch, one item open)

| # | Finding | Status |
|---|---|---|
| S-1 | The Vercel branch preview was built with the production connection, so a signed-in family member on it was in production: real obligations rendered inside the "sample"; a test debt was written to the live `accounts` table at 17:24:54 UTC. | **Closed on the branch.** `lib/preview-isolation.js`: any `*.vercel.app` host or Pages branch alias is a preview; the data client is built against a stub that reaches nothing; sample mode is forced regardless of the URL; the header sign-in is not rendered. Pinned by `preview-isolation.test.js`. |
| S-2 | Inside sample mode, four tabs fetched the family's real rows with the session: Owed, Plan, Taxes, 1099s. | **Closed on the branch.** Each takes `demo` and renders `SampleModeNotice` with no read; `sample-mode-tabs.test.jsx` counts zero calls in sample mode and one call outside it (proven to catch). |
| S-3 | The "Test Debt" row (credit, the values Christina entered) is in the production `accounts` table. | **Open — awaits Christina's approval.** Identified exactly: row id `f4fe402b-f25c-4f88-a780-d63a4d5b91ca`, created 2026-10-28 17:24:54 UTC, zero linked transactions. Safest removal: delete it inside the app on the same phone (cloud + local copy together), then sign out of the preview and clear that site's data; or a single SQL delete by id plus clearing the preview's site data. |
| S-4 | Anonymous visitors. | Not exposed: row-level security is on for every family table and every policy requires instance membership; anonymous sees the fictional Reeves sample only. |

Access for the environment split: this session has **no** Vercel credentials and no Cloudflare token; it has Supabase management access to the live project (used read-only). The Vercel Preview-environment variables can only be changed in the Vercel dashboard (Darrell's account); a separate Supabase test project can be created through the management API but is a billing action that needs Christina's or Darrell's word. The code-level isolation above holds without either.

---

## TEST 1 · Safe to Spend recalculates

Synthetic household: personal checking and savings, a Visa and an auto loan, PoeTech, Poe Properties (one rental with a mortgage) and TLC operating accounts; two salaries on biweekly and semimonthly schedules; six recurring bills; a tax item; a transfer pair; a pending row dated today; a scheduled future row. 30-day window from 2026-10-28. The ANCHOR case is hand-computed to the cent with no accruals.

| Case | Tested | Expected | Actual | Verdict |
|---|---|---|---|---|
| ANCHOR | The walk with no undated accruals | cash 11,115; lowest 10,715 on 10-30; safe 9,715 | identical | PASS |
| 1.1a | Bill added before the low point | safe falls by its amount | −400 exactly | PASS |
| 1.1b | Bill edited / deleted | moves by the difference / restores | +125 / −150 exactly | PASS |
| 1.1c | Bill disabled | leaves the walk | leaves | PASS |
| 1.1d | **Bill marked PAID in Money → Bills** | its occurrence leaves the walk | **still subtracted** — the engine never reads `moneyPlan.billStatus` | **FAIL · DEFECT-1 · HIGH** |
| 1.1e | **Bill paid early through the ledger** (row dated today, `nextDue` unchanged) | net effect on safe = 0 | **safe falls by the bill again** (double count until `nextDue` is edited by hand) | **FAIL · DEFECT-1 · HIGH** |
| 1.2a | Paycheck added (schedule entered) | counted only on its day | day before identical; pay lands on its day | PASS |
| 1.2b | Paycheck delayed a week | money moves, low point moves | both move | PASS |
| 1.2c | Paycheck removed | income gone, missing named | gone, named | PASS |
| 1.3 | Unexpected expense (dated incident, overdue incident, ledger row today) | reserved on its day / due today / cash lower | all three | PASS |
| 1.4 | Debt minimum 60 → 160 | +100 on its due day | +100 on 11-15 | PASS |
| 1.5 | Savings 600/mo | accrued daily from day 1, pro-rated | 600 × 30 / 30.44 | PASS |
| 1.6 | Cushion 1,000 → 2,500 / → 12,000 | safe −1,500 / safe 0 + shortfall | exact | PASS |
| 1.7 | Negative balance | safe 0, shortfall = cushion − lowest, overdraft today | −885 lowest, shortfall 1,885, overdraft 10-28 | PASS |
| 1.8 | Recurring crosses the month (10-30 → 11-30; the 31st clamps) | two occurrences; 31→30→31→31→28 | identical | PASS |
| 1.9 | Pending row today / future row | inside the balance, never an event / one event | identical | PASS |
| 1.10 | Transfers (own accounts, future-dated, to the card) | never income, cash unchanged / not an event / cash lower | identical | PASS |
| — | Projected income never available | cash = ledger; income only on the timeline, dated after today | holds | PASS |

## TEST 2 · Debt Freedom against an independent calculation

Four debts (Visa 22.99 %, auto 6.5 %, medical 0 %, personal loan 11.9 %) with due days. An independent month-by-month simulator written from the stated rules, not from the engine.

| Case | Verdict |
|---|---|
| 2.1 Snowball clears the smallest first (medical → Visa → loan → auto) | PASS |
| 2.2 Minimums continue on every open debt every month | PASS |
| 2.3 A cleared debt's minimum joins the pool the next month (300 + 50) | PASS |
| 2.4 Interest, payoff months and totals match the simulator, snowball and avalanche | PASS |
| 2.5 Payoff dates shift with the start date | PASS |
| 2.6 More extra → shorter and cheaper; less → longer and costlier | PASS |
| 2.7 Zero-interest debt: no interest, 14 months, 700 paid | PASS |
| 2.8 Missing rate / missing minimum are excluded by name with the reason; never projected at 0 % or $0 | PASS |
| 2.9 Inputs untouched; the ledger-derived debt list unchanged after planning | PASS |
| 2.10 Custom order honoured; a debt left out is paid last | PASS |

Also green: `debt-freedom.test.js` (30 cases incl. the realistic household with due dates) and `debt-engine-audit.test.js` (the legacy engine's four measured defects, still present in the legacy Debts tab and Big Picture — the switch awaits approval, DR-1280 item 6).

## TEST 3 · Budget by paycheck

| Case | Verdict |
|---|---|
| 3.1 Weekly: a period opens on every payday; period 0 is cash-only | PASS |
| 3.2 Biweekly with three paychecks in a month (Nov 6, Nov 20, Dec 4), each its own period | PASS |
| 3.3 Monthly cuts on the 1st and carries the right bills (auto 11-05 and electric 11-12 in the paycheck period; insurance and dentist in period 0) | PASS |
| 3.3 **Semimonthly anchored on the 1st** | second payday on the **16th**, not the 15th (the engine steps anchor + 15 days; the label says "1st & 15th") | **FAIL · DEFECT-2 · MEDIUM** |
| 3.4 Irregular income inferred from deposits and labeled; none → "No upcoming pay dates" | PASS |
| 3.5 Rental income on the rent day inside Properties only | PASS |
| 3.6 Missed paycheck: period 0 longer, cash-only (215 against 950), shortfall 735 named, nothing carried | PASS |

## TEST 4 · Bills and recurring payments

| Case | Verdict |
|---|---|
| 4.1 A bill whose `nextDue` is months old rolls to its next occurrence, once | PASS |
| 4.2 Due days 29 / 30 / 31 clamp and return; leap year keeps the 29th | PASS |
| 4.3 Overdue vs scheduled from the date (Bills screen) | PASS |
| 4.3 **Partially paid bill** | no status exists and no amount can be recorded against an occurrence; a half payment lowers cash while the full bill is still projected | **GAP-1 · MEDIUM** |
| 4.4 No duplicates: obligation + debt minimum; scheduled row + debt minimum; inferred autopay for a debt; inferred utility + obligation | PASS (all four count once) |
| 4.5 Consolidated view never counts an obligation under two entities | PASS |

## TEST 5 · Accounts and transactions

| Case | Verdict |
|---|---|
| 5.1 Deposits and withdrawals move the derived balance; a future row waits for its day | PASS |
| 5.2 Internal transfer (also across entities) is never income; total cash unchanged | PASS |
| 5.3 Reconciliation: a balance chain reconciles; a missing row breaks it and is reported; no balances → "not enough" | PASS |
| 5.4 Personal, Poe Properties, PoeTech, TLC never mix unless the combined view is chosen | PASS |
| 5.5 A business shortfall never subsidises personal money in the combined view | PASS |
| 5.6 The mortgage (P&I + escrow) is a dated Properties item; the debt/mortgage buckets are never accrued on top | PASS |

## TEST 6 · Data preservation

- All twelve original tabs mount inside their sections on the cover screen (entities, legal, imported, upcoming, calendar, cart, owed, plan, debts, taxes, k1099, plus transactions and accounts): 20 of 20 sub-ids rendered, 0 page errors, every `?sub=` deep link resolved. Suites green: `books-upload-every-tab`, `feature-presence`, `surface-mount-integrity`, `help-content`, `nav-history`, `money-nav`.
- Reports hub mounts with its links (Imported reports, Tax years, Forecast). Taxes and 1099s show the sample notice in sample mode by design (S-2).
- **Not exercised:** CSV download and print in Imported, because the sample blocks Imported by its existing guard, and a signed-in test needs the isolated environment. Permissions: code paths unchanged (`feature-presence`); not exercised live for the same reason.

## TEST 7 · Saving and synchronization

| World | Entered | After navigate-away + reload | On a fresh browser profile (another device, no cloud) |
|---|---|---|---|
| Device (localhost = trusted host, anonymous persists on the device) | cushion 750, pay schedule, a bill marked paid, avalanche, extra 425 | **all present** (cushion 750, paid, avalanche, 425; schedule read as biweekly on the earlier run) | nothing (expected: cloud is the only road between devices) |
| Sample (`?demo=`) | same | **nothing** (expected: the sample never saves) | nothing |

Findings:
- **DEFECT-3 · LOW:** in sample mode the Setup page still reads "Saved on this device". Nothing is saved. Wording only.
- **DEFECT-4 · MEDIUM (data loss across devices):** for a real account, `data.moneyPlan` rides the family snapshot, but the push is gated by `remainderIsSeed`, which looks only at obligations, tax items, events and capital items. A household whose only real edits are Money settings never publishes them; a second device, or a replaced phone, starts without them. Proposal in `2026-10-28-money-phase-2-review-answers.md` §4, awaiting approval.
- Debt terms entered on the legacy Debts tab ride the `accounts` table sync when signed in (verified by the production write on S-1, which is also why that path must never run from a preview).
- Sign-out and cross-device behaviour for real accounts were not exercised: they need the isolated test project.

## TEST 8 · Mobile functionality, Galaxy Z Fold 7 cover screen (360 × 764)

All nine sections and all twelve legacy tabs: 0 px horizontal overflow, the five-button bar present, 0 page errors, 0 outbound write requests. Interactions verified: entity dropdown, period chips, the explanation disclosure, Setup frequency + next pay date + cushion (Overview recalculated from $19,186 to $25,027 at cushion 750), Budget → By paycheck (8 periods, shortages flagged per period), Bills status select, Debt Freedom strategy chip, the monthly plan toggle, Transactions, Reports. Entering a rate and a minimum on the Debts tab and watching the plan populate was verified on the earlier S24 run.

- **DEFECT-5 · HIGH on a small screen during a service window:** the church's app-wide live-service bar opens on the published schedule (Wednesday 1 PM and 6 PM, Sunday) and is pinned to the top at 276 of 764 px. Until it is collapsed or closed it covers the content and swallows taps on Money's controls; my own harness could not tap a strategy chip until it closed the bar. This is the church module's bar (Darrell's), not Money's; the call is his.
- **LOW:** three tap targets under 24 px on the legacy Debts tab ("+ rate", "+ pay", "edit").

---

## Prioritized defect list

| Priority | Id | What | Severity | Where |
|---|---|---|---|---|
| 1 | S-3 | "Test Debt" row in the production accounts table | security / data integrity | production DB; needs Christina's approval to remove |
| 1 | DEFECT-1 | A bill marked paid, or paid early through the ledger, is still projected: Safe to Spend understates spendable money (double count) | HIGH, wrong calculation | `lib/safe-to-spend.js obligationEvents` ignores `moneyPlan.billStatus` and the ledger's own payment |
| 1 | DEFECT-4 | Settings-only households never publish `moneyPlan` to the cloud; a second device starts blank | MEDIUM–HIGH, lost data | shell `remainderIsSeed`; proposal §4 of the review answers |
| 2 | DEFECT-2 | Semimonthly second payday lands on the 16th, not the 15th | MEDIUM, wrong timing by one day | `expandOccurrences('semimonthly')` |
| 2 | GAP-1 | No partial-payment status or amount on a bill occurrence | MEDIUM | Bills screen + engine |
| 2 | legacy | The Debts tab and Big Picture still use the old engine with its four measured defects; they can disagree with Debt Freedom | MEDIUM, contradictory numbers | DR-1280 item 6, awaiting approval |
| 2 | DEFECT-5 | Live-service bar covers 36 % of a cover screen and intercepts taps while open | HIGH during service windows; church module | Darrell's call |
| 3 | DEFECT-3 | "Saved on this device" shown in sample mode | LOW | `MoneySetup` / `syncStatus` |
| 3 | tiny | Three sub-24 px tap targets on the legacy Debts tab | LOW | `Debts.jsx` |
| 3 | untested | CSV, print, permissions, sign-out and cross-device sync need the isolated signed-in environment | — | environment |

## The answers Christina asked for

1. **What works:** the Safe to Spend walk and every recalculation except the paid-bill case; income never counted before its day; transfers never income; pending rows never double counted; entity separation; the corrected Debt Freedom engine against an independent calculation in every case; Budget by paycheck for weekly, biweekly (three-paycheck months), monthly, irregular and rental income, with shortages named; roll-forward and month-end clamping; all four dedupe rules; every original tab and deep link; device persistence of every Money setting; the cover-screen layout and every interaction once the live bar is out of the way.
2. **What is broken:** a bill marked paid or paid early is still projected (DEFECT-1); the semimonthly 16th (DEFECT-2); no partial payments (GAP-1); the sample badge wording (DEFECT-3); the live bar on small screens (DEFECT-5); and, resolved on the branch, the preview that was production (S-1, S-2).
3. **What could produce incorrect financial calculations:** DEFECT-1 (understates Safe to Spend after paying a bill), DEFECT-2 (one day), and the legacy engine still behind the Debts tab and Big Picture (overpays cleared debts, dates a debt that never clears, reads unknown terms as free money).
4. **What could cause lost data:** DEFECT-4 (settings never reach the cloud for a settings-only household); by design the sample never saves and anonymous visitors on a public host never save, which the badge must say honestly (DEFECT-3).
5. **Must be fixed before production:** S-3 removal, DEFECT-1, DEFECT-4, and the preview isolation merged so no future preview is production (S-1/S-2, done on the branch).
6. **Can wait:** DEFECT-2, GAP-1, DEFECT-3, the tiny targets, the legacy-engine switch (its own decision), DEFECT-5 (Darrell's module).

This is not a statement that the app is production-ready. It is the evidence of what is right, what is wrong, and what was not reachable from here.
