# DR-1602: A decision's row is placed, not appended

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (repo tooling and one guard; no app surface, no schema)
**Type:** lane
**Area:** new `scripts/index-row.mjs`, `scripts/lib/decision-pointer.mjs`, `scripts/business-systems-guard.mjs`, `scripts/ai-usage-ledger.mjs`, `docs/decisions/README.md`, `.gitattributes` (comment)
**Pairs with:** DR-1536 (the usage ledger places its entries), DR-0644 (the ledger merges resolve themselves), DR-1477 (the derived pointer), DR-1601 / DR-1605 (this lane fix)

## Context

Measured 2026-11-19: every landing made the other open PRs conflict, only in `docs/decisions/INDEX.md` and `app/src/lib/ai-usage-ledger.json`. Resolving took a merge of main and a push, which restarted that PR's CI at the back of the queue (#2788 was re-synced five times). Every branch appended its row at the end of the live table, the same spot.

`.gitattributes` names a `dr-ledger` merge driver for INDEX.md. Tested the same day on throwaway PRs against throwaway bases (never main): with `merge=union`, git's own built-in driver, set for both files on the base and both branches, the second PR still answered "405 Pull Request has merge conflicts" (#2815), the same as its control without it (#2813). GitHub's PR merge runs no merge driver.

## Decision

A row is placed, not appended. `node scripts/index-row.mjs --add '<row>'` inserts it in the live table at a slot read from its own number (FNV-1a, the function DR-1536 uses for ledger entries), never among the table's last 40 rows. `ai-usage-ledger.mjs --add` already placed entries that way. Row order carries no meaning: every reader (the guards, the resolver, the claim tool, the app's readers) finds a row by its id. Checked: none reads the last row as the newest.

Two checks keep it: `business-systems-guard` names any row numbered DR-1607 or higher in the table's last 40 rows, and `ai-usage-ledger --check` names any entry for DR-1607 or higher in the ledger's last 40. Both say how to fix it (delete the row or entry and re-add it with the tool). Every number already reserved when this was written (to DR-1606, some on open PRs from other sessions) keeps the spot its branch gave it, so no in-flight PR turns red; no history is rewritten.

## Proof

On GitHub: two throwaway PRs, each adding a row with `index-row` and an entry with the ledger's placement, both merged into one base (#2817, #2818); the base then held both rows and a valid ledger with both entries. `two-decisions-merge-without-a-conflict.test.js` (7 tests) does the same with real `git merge` and no merge driver, on the real INDEX.md and ledger; proven to catch: two tail appends conflict. Consecutive numbers land on adjacent slots twice in the next 200 records (a conflict then needs both in flight at once).

## Not changed

`resolve-ledger-conflicts.mjs` still resolves a conflict that does happen, and refuses what it refused. `claim-decision-number.mjs` still reserves the number. The `dr-ledger` attribute stays for local merges, with a comment that GitHub ignores it.

re-review: 2026-12-03 (count INDEX/ledger conflicts on PRs over a week; target zero between two placed records).
