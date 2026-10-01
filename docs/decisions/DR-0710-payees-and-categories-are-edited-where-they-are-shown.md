---
id: DR-0710
title: Payees and categories are edited where they are shown, through the one write path Tx uses
date: 2026-09-30
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE]
source: Darrell, 2026-09-30, verbatim - "Tx is the only place to edit names or categories!!!!! That is not what we want... we want to edit everywhere it makes sense... make sense?"
---

# DR-0710 - Payees and categories are edited where they are shown

## Context

Darrell found that a transaction's name could only be changed on Books -> Tx. Other tabs show the same payees and categories (Imported, the KPI reports, Debts, Accounts), and he wants to fix a name or a category wherever he sees it, without going to Tx.

## What was measured

Characterized on `main` at aae49f96 before the change:

- **Tx** (`components/BooksTransactions.jsx:352-367`): the full row Edit form. It renames only that one row (`updateTransaction`). The category applies to one row, or to every row from the payee (`recategorizePayee`, default on). There was no way to rename every row from a payee.
- **Imported** (`components/Imported.jsx:448-457`, `:814`, `:873`, `:1321`): a category select in the register, All income and All outputs. Every pick went to `recategorizePayee`, so "just this one" was impossible. Names could not be edited anywhere on the tab. Top payees, Top categories, Recurring payments and Material changes were read-only text (`:1001`, `:1018`, `:967`, `:913`).
- **Debts** (`components/Debts.jsx:594-599`): the spending drill-down had a payee-wide category select only; the low-priority list (`:656`) and the "looks like a debt" payees (`:278`) were read-only. `lib/spending-priorities.js:58` re-derived each row's category from the rules and ignored the stored one, so a one-row category edit never moved the Debts tiers.
- **Accounts** (`components/BooksAccounts.jsx:126`): the "looks like a debt" payees were read-only.
- **Checked, no ledger payee or category shown:** Entities, Owed, Plan, Cart (its own subscription records with their own editor), 1099s (its findings list receipt row ids, not payees), Calendar (its own recurring and incident records), Big Picture, Properties (rent records; a posted payment shows only "in the books"), Projects. Unusual months shows month totals, not payees.
- The shell (`poe-financial-mvp-v28.jsx`) sat at its frozen budget of 5312 lines.

## Impact

Before the change, a wrong name on Imported or a report had to be found again on Tx, and a category edit made anywhere except through a payee-wide rule did not show on Debts. The change adds no new write path: every save calls the same `updateTransaction` / `recategorizePayee` as Tx, so the cloud sync, demo guard and record history are the existing ones. It does not touch RLS or sync code. Reversible by reverting the PR.

## Decision

1. **One editor.** `components/LedgerEdit.jsx` wraps any payee or category a surface shows. Tapping it opens one sheet: rename this transaction or every transaction from the payee; set the category for this one or for every one from the payee (which also teaches future imports, as on Tx); or type a new category. On a category rollup it moves every row in that category. After a save, the trigger shows "edited" with Undo.
2. **One write path.** `lib/ledger-edit.js` holds the shell's live `updateTransaction` + `recategorizePayee`, which the shell publishes on its existing `recategorizePayee` line (+0 shell lines; the import rides the categorize import). Surfaces read them when the person taps. The shell's single `data` object stays the only copy, so every tab re-renders from the same rows.
3. **Where it is shown now:** Imported (register payee and category, the row drawer, All income and All outputs member rows, Top payees, Top categories, Recurring payments, Material changes drivers); Debts (the spending drill-down rows, the low-priority list, the "looks like a debt" payees); Accounts (the "looks like a debt" payees); Tx ledger rows, beside the full Edit form. Bank-ingest and projected recurring rows on Tx are not ledger rows and stay plain.
4. **Demo mode writes nothing.** The sheet says so, Save is disabled, and `applyLedgerEdit` refuses.
5. **A stored category wins on Debts.** `spendingByPriority` uses a row's own known category and falls back to the rules only for blank, `other` or raw bank codes.

Not decided: a rename rule for FUTURE imports. A renamed payee's later bank rows arrive under the bank's name, and the category rule keyed to that name still applies. That rule would live in the import path, which the Books Upload work (claude/books-one-upload) holds right now. *re-review: 2026-10-14*, after that branch lands.

## Rationale

The shell is line-frozen (DR-0078), and a second write path would drift from the Tx one. Publishing the two existing functions once keeps one source of truth at zero shell cost. The editor renders plain text when the mount has no books (the standalone Properties door), so it never shows a control that cannot save.

## Verification

- `app/src/__tests__/ledger-edit-everywhere.test.jsx` (15): the walk on real mounts of Imported, every KPI report, Debts, Accounts and Tx; an Imported edit calls `updateTransaction(id, {category})` for one row and `recategorizePayee` for the payee; renaming every row from a payee folds Top payees into one line, and Undo splits it again; a category rollup move recomputes Top categories; demo mode calls neither write path; the Debts tier follows a stored category. Proven to catch: with the Imported register chip reverted to plain text, 4 of the 15 tests fail.
- `imported-render.test.jsx` updated: the category cell opens the shared sheet, which offers "+ New category".
- Phone check (Playwright, Chromium, 360 and 412 px): no horizontal page scroll before or after a save; every trigger and the Undo button measure 44 px tall; the sheet spans the viewport width. Renaming the 4-row card autopay payee moved Top payees to one "4x $600" line.
- `monolith-budget-guard`: 5312 of 5312, the shell did not grow.

## Links

DR-0078 (the shell freeze), DR-0076 (verification), DR-0061 (surfaces are live views of real state).
