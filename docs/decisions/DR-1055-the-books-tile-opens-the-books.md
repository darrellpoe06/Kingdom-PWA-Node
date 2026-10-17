# DR-1055: The Books tile opens the Books — DR-0464 §g's open question, answered

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (the family's front screen)
**Type:** word
**Area:**
- `app/src/lib/life-hub.js` (the tile, the sub-label, `HOST_VIEWS`, the per-tile trace)
- `app/src/components/LifeHub.jsx` (the tile's icon)
- `app/src/__tests__/life-hub.test.jsx` (three checks retargeted, one added, one made to fail loudly)
- `docs/decisions/DR-0464-*.md` §g (the question is closed where it was asked)

**Grounds:** Darrell, 2026-10-15, with a screenshot of the Big Picture home grid: **"Books doesn't currently go to the Books tab it goes to Church Learn..."**
**Principles:** DR-0330 (a tile that opens nothing — or opens the wrong thing — is a lie); DR-0076 §5 (characterize before you change); DR-0075 (a recorded open question gets answered, not left); WORD-FIRST on his own words

## Context

Christina's mockup carried a tile reading **"Books"** with the sub-label
**"Learn & Grow"**. Those are two different places in this app: "Books" is the
financial surface (BooksAccounts / BooksEntities / Debts), and "Learn & Grow"
plainly describes the Learn door.

When the hub was built, the ambiguity was **named rather than guessed**. The
tile opened Learn, on the reading that the sub-label was the clearer statement
of intent, and `life-hub.js` recorded in its own header: *"If she meant the
money books, it is one line here — and the question is in DR-0464 rather than
silently resolved."* DR-0464 §g carried it as **"FYI for Christina, not a
blocker."**

Darrell has now answered it. This record closes the question where it was
asked rather than leaving a second place to look.

## What was measured

Traced in the host before changing anything, because a tile that opens nothing
is the defect this file was written against (DR-0330):

- **`view === 'books'` exists in the host** — `poe-financial-mvp-v28.jsx`
  lines 4269, 4307, 5010. The destination is real.
- **`HOST_VIEWS` did not contain `'books'`**, so pointing at it without adding
  it there would have failed `life-hub.test.jsx`'s own route check — the check
  doing its job.
- **Books is "the ledger of record — accounts, transactions, debts, calendar"**
  (`help-content.js:728`), which is what the new sub-label must agree with.
- **Three places pinned the old routing**, each keyed on the string
  `"Learn & Grow"`, and a fourth listed `'learn'` among the no-count tiles.

## Impact

**What it buys.** The tile does what it says. One tap from the family's front
screen to the ledger of record.

**The honest consequence, stated rather than hidden: Learn loses its home
tile.** It stays two taps away at Church → Learn, and one tap away in the Quick
Actions as "Open a lesson". That is a real cost and it is Darrell's call to
make; he made it.

**The sub-label moved with the destination**, from "Learn & Grow" to "Accounts
& Debts" — and so did the icon, from an open book to stacked coins. Pointing
the tile at the ledger while leaving either behind would be **the same lie
inverted, and a worse one**: a tile that says it teaches and opens the family's
money.

**No count on it, and that is deliberate.** The ledger's honest number is a
balance, and a balance is not a badge: a bare figure on the front screen, with
no account beside it and no sign of whether it is an asset or a debt, is the
painted-number defect `life-hub.js` exists to refuse (DR-0061). The Books tab
itself says it properly.

## Decision

1. The tile is `{ key: 'books', label: 'Books', sub: 'Accounts & Debts',
   view: 'books', churchView: null }`.
2. `'books'` joins `HOST_VIEWS`, which is the pinned list of the host's real
   routes — so a renamed route fails a check instead of a family member's tap.
3. **The check that guarded the Learn tile is retargeted, not deleted.** Its
   property — `view === 'learn'` does not exist in this app, so anything aimed
   at Learn must travel as `church` + `learn` — is still true, and now guards
   the `lesson` Quick Action, which is the thing that still carries it. It also
   now asserts that **no tile** may quietly re-acquire the dead route.
4. DR-0464 §g is closed in place.

## Verification

- **35 cases in `life-hub.test.jsx` green**, plus `contrast-guard` (22) and
  `consistency-guard` (21) for the icon and fill change. Lint clean, 21 gates.
- **A new check pins the whole of his sentence**: the tile opens `books`, the
  host routes `books`, and the sub-label does **not** match `/learn/i` — so the
  half-fix that keeps the old sub-label cannot ship.
- **One existing check was made to fail loudly, because it would have passed
  vacuously.** The no-count list said `'learn'`; when that key became `'books'`,
  `tiles.find(...)` returned `undefined` and `hasRealCount(undefined)` is
  falsy — the assertion would have "passed" against a tile that no longer
  exists. It now asserts the tile is found first. That is a gate that was green
  for the wrong reason, which is the anti-theater rule (DR-0076 §3) applied to
  a check rather than to a guard.
