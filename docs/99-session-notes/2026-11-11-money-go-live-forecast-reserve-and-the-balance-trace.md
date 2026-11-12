# 2026-11-11 — Money go-live: two sessions, one stack, and the goal that is not a cushion

Narrative for **[DR-1435](../decisions/DR-1435-money-forecast-30-day-windows-reserve-and-the-balance-trace.md)**.
Branch `ccr-f178819a-g2lhs2`, PR #2610, stacked on PR #2609 (`fix/money-three-accounts`).

## What Christina asked for, and what was already true

Her brief: finish the existing Money module today — correct the three Chase
balances, complete screenshot imports, bills and income in 7/14/30-day windows,
Safe to Spend on verified records with a $10,000 Personal reserve, and a
forecast whose +30/+60/+90 are not the same number.

Recovered first (`MONEY_HANDOFF.md`, PR #2540, PR #2584, the suites): the
engine, the checkpoint rule, the screenshot intake and the Bills review all
exist and are deployed; 24 Money and intake suites, 311 cases, green on `main`
`ac8a850`. Nothing was rebuilt.

## Two sessions on the same brief

This session built the forecast from the engine's events, the 30-day windows,
a per-row balance trace and a day-boundary fix, and pushed PR #2610. Checking
for concurrent changes before anything merged (section 7 of her brief) found
PR #2609, opened minutes earlier from Darrell's side on the same brief, already
held for approval. It carries the forecast, the 7/14/30 and past-due windows,
the checkpoint trail, and the screenshot-matching causes this session had not
reached. Two held PRs touching the same six files is the worst state, so this
branch was restacked on #2609 with only what #2609 lacks. #2609 is untouched.

## The correction that came before the merge

The first cut made $10,000 the Personal cushion by default. Christina stopped
it: *"The $10,000 reserve is my SAVINGS GOAL, not my current reserve balance.
I do not currently have $10,000 set aside... Only protect money I have actually
designated as reserved."* Measured on the test fixture, the first cut read Safe
to Spend $0 against $3,183 of verified cash and a $6,817 shortfall — the goal
was being subtracted as if it were held.

Now the goal and the money set aside are two records. `reserveGoalByEntity`
holds the goal ($10,000 for Personal until she saves another).
`reserveDesignations` holds every amount she sets aside, dated, with a note; a
negative amount takes money back out. The cushion Safe to Spend protects is the
designated money, never the goal; with nothing set aside, Personal protects $0
and the goal is tracked with what is still to save. The "extra debt" line is
one pool for both uses, "Safe to put toward your reserve or extra debt today",
with a suggested split that fills the goal first. Each amount set aside raises
the cushion by exactly that amount and lowers the pool by the same, pinned in
the tests, so nothing is counted twice.

## What else this stack adds

- **The rows.** #2609's trail gives the count and net of rows since the bank
  check. `balanceTrace` lists them under each account on Coming Up with the
  result to the cent and the fix named: today's screenshot becomes the new
  check and outranks the rows. This is the instrument for 3322 ($2,540 vs
  $4,479.53) and 8168 ($38 vs $370.69), whose live figures this sandbox cannot
  read (no road to the NAS; tailnet key revoked).
- **The day boundary.** A row dated tomorrow was cleared tonight after 6pm
  Central. Fixed by comparing calendar days; proven under `TZ=America/Chicago`.

## Verified

- 24 Money suites, 315 green; the 137 test files that import the changed
  modules green. Lint clean; new files Prettier-formatted. Ledger guards green.
  `vite build` green.
- CI on the stack: lint, guards, all four vitest shards, selftests, build,
  probes, layout and surface sweep green on the previous head. The thirteen
  PostgreSQL legs failed twice in "Install postgresql-client" on the runner's
  apt mirror before any test ran; #2610 adds no SQL, migration or workflow
  file, and the same legs passed on #2609's head.

## Not verified, said plainly

- The live figures and entity assignment for 7206, 3322 and 8168.
- Real OCR on a real Fold screenshot (unchanged since PR #2540).
- The deployed site: both PRs carry `hold`; her approval merges #2609, then
  #2610 after a fresh green run on `main`. Prove the deploy (DR-0107), then
  `site-health.yml`.

## Her hand

After deploy, on the Fold: Money → Overview → "Current cash" → open 3322 and
8168; read the rows after each bank check; upload today's screenshot of any
account whose rows the bank does not show. Books → Accounts: 7206 Personal,
3322 Poe Properties, 8168 TLC. Then "Protected cash reserve (money set aside)"
→ Add to reserve: the amount she can set aside now, from the "Safe to put
toward your reserve or extra debt today" line.
