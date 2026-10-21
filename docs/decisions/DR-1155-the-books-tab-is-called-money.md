# DR-1155: The Books tab is called Money — the word changes, the id does not

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (a label; no route, no schema, no money moves)
**Type:** product (naming)

**Area:** `app/src/lib/nav-items.jsx` (the tab, `NAV_WORDS`, the phone's bottom bar), `app/src/lib/life-hub.js` (the Hub tile "Money · Accounts & Debts"; the Quick Action "Open Money"), `app/src/lib/help-content.js` (the help title and link), `app/src/components/BigPictureDashboard.jsx` (the jump label), `app/src/__tests__/life-hub.test.jsx` (the tile's label).

**Principles:** DR-1046 (one list, three places: the strip, the sidebar, the bottom bar all draw `nav-items.jsx`); DR-0330 (a tab says what it opens); DR-1055 (the Books tile opens the ledger).
**Declared by:** Darrell, 2026-10-21: *"Can we call the Books tab the Money tab instead of the Books and not have issues with the the apps?"*

---

## Context

"Books" is the accountant's word; "Money" is the family's. The question in his sentence is the real one: can the word change without breaking anything. It can, because every route, deep link, feedback area, surface gate and door keys on the id `books`, and the id is untouched.

## What was measured

Every place the word is shown to a person, found by searching the source for the label: the tab pair in `navItems()`, `NAV_WORDS.books`, `BOTTOM_NAV` (`words`), the Hub tile and its Quick Action, the help entry and its link, the Big Picture jump label. Places that key on the id (`?view=books`, `VALID`, `FEEDBACK_AREAS`, `VALID_VIEWS`, `surfaces.js`, the Books sub-navigation ids) are unchanged, and the hub test still checks the tile against `view === 'books'` in the host.

## Decision

The tab, the sidebar entry, the phone's bottom-bar tab, the Hub tile, the Quick Action, the help title and the jump label say **Money**. The id stays `books` everywhere. The Books sub-tabs (Accounts, Owed, Plan, ...) keep their own names.

## Impact

No link, bookmark, feedback area or app changes behavior. The inside pages that still say "Books" in prose (help body text, older decision records) are history, not navigation; they are not swept.

`re-review: 2026-11-04` — whether the sub-tab names or the Books help body should follow the word.

## Verification

`life-hub.test.jsx` (35), `heritage-shell-navigation.test.jsx`, `feature-presence.test.jsx`, `one-tab-row-carries-the-brand.test.jsx`: green with the word changed and the id kept.
