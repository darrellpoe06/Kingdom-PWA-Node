# 2026-07-02 — Transaction double-count: root cause + resolution + reconciled totals

## Signature
The group-by-payee view showed one transaction as TWO rows, often with two
categories: WF Home Mtg $2,622.83 as Debt-Payment **and** Vehicle; CHK …3322
transfers as Transfer **and** Other; University of IL payroll $2,099.93 doubled
on the same day. Totals inflated (device showed May IN ~$47,183).

## Root cause — TWO distinct sources
1. **Stale local cache (the visible cross-category doubles).** The cloud has NO
   Vehicle mortgage row (all 7 WF Home Mtg rows are Debt-Payment, one per month)
   and payroll is clean (bi-weekly, one per pay date). The second row on the
   device was a **stale localStorage** row from an earlier import, kept because
   the sync merge (`unionPreservingLocal`) keyed only on slug — a different slug
   survived beside the reconciled cloud row.
2. **18 real cloud duplicate pairs (same date+amount+payee+account, twice).**
   From the Option-A load preserving source multiplicity. Small: PayPal, Taco
   Bell, Walgreens, Jon's Pipe, Cash App, Zelle, remote deposits, Afterpay, two
   online transfers.

## Fix
- **Code (PR #499):** `lib/txn-dedupe.js` `mergeTransactionsPreferCloud`, wired as
  the transactions sync merge — drops a local row when a cloud row covers the
  same transaction by CONTENT (date+amount+payee+account), even if slugs differ;
  cloud wins. Never collapses two cloud rows, so a legit same-day/same-amount
  pair the bank really has survives. Self-heals every device on sync.
- **Data (DB writes, this session):** collapsed the 18 real cloud dupe pairs
  (1,932 → 1,914 rows) per Darrell's rule (same-calendar-day identical =
  duplicate; real bi-weekly income is ~14 days apart, never same-day). Then
  **recomputed each account's opening balance** so the derived balance
  re-reconciles to the bank's reported figure after the dedup.
- **Categorize in place** (PR #475/#496): recategorize updates the row + back-
  applies to the payee — never creates a second row.

## Reconciled figures (measured from the deduped cloud, 2026-07-02)
- Rows: **1,914** (was 1,932). Remaining exact-key dup groups: **0**.
- Per-account derived balance = bank ledger balance (as of 2026-05-27):
  …7206 **$317.17**, …3322 **$17.91**, …8168 **$38.00**, …1818 **−$9,948.35**.
- Totals — ALL-TIME: IN **$239,189.48** · OUT **−$242,839.13** · NET **−$3,649.65**.
- Totals — MAY 2026 (242 tx): IN **$26,899.04** · OUT **−$29,085.80** · NET **−$2,186.76**.
  (The device's inflated ~$47,183 May IN was stale-local cache; the true cloud
  figure is $26,899.04.)
- WF Home Mtg: 7 rows, all Debt-Payment, one per month. UNIV IL Payroll: 10 rows,
  $2,099.93, bi-weekly, zero same-day pairs.

## Notes / open
- Stale-local rows whose description differs slightly from the cloud row won't be
  caught by the exact-content merge; a one-time PWA reinstall/cache-clear pulls
  the fully-clean cloud on that device.
- "Reconcile against the bank" here = the cloud ledger was loaded from the bank
  QFX export and the per-account balances match the bank's reported figures.
  Christina's workbook, if it holds rows the bank export lacks, reconciles via the
  import reconciliation gate (PR #497), which reports ingested vs rejected.
