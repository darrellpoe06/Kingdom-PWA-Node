# Overnight brief — 2026-05-28 (Phases 2B.2, 2C, 2E)

This is the second push of the night. Phase 2B already landed and you tested it green on cellular. This push layers three more pieces on top of the same `bank_balances` data so you can actually work down the 1923 unexplained transactions instead of just staring at them.

## What's in this push

### Phase 2B.2 — Big Picture bank reconciliation strip

New section on the Big Picture dashboard, between the hero row and the cross-reference strip. Three clickable cells:

- **Bank cash · linked** — sum of bank LEDGERBAL for accounts that match a QFX institution by last-4. Shows `N of M accounts · K feeds`. This is "what the banks actually say you have right now."
- **Manual vs bank** — Δ between your manual cash total and the bank-derived total. Green when reconciled (under 50¢ off), amber when bank shows more than you have on file, red when bank shows less.
- **Needs attention** — count of bank rows flagged unexplained or unconfirmed by workflow 16. Currently 1923 in your data. Clicking jumps straight to Books → Tx; you tap the matching filter pill once you're there (one tap, not two).

Hidden entirely if `bank_balances` is empty so the dashboard stays clean when the Funnel is down.

### Phase 2C — Reconcile-status filter on Books → Tx

New pill row above the transaction table, only shows up when there are any ingest rows in the feed. Six pills with live counts:

- **All** — everything
- **Needs attention** — unexplained + unconfirmed combined; the working surface
- **Unexplained** — bank rows workflow 16 couldn't match to anything
- **Unconfirmed** — bank rows partially matched
- **Verified** — green-light reconciled
- **Noise** — bank rows workflow 16 already classified as not-worth-reviewing (internal transfers, fee reversals, etc.)

Manual entries always show regardless of which pill is active — the filter only narrows the bank ingest side, since manual is your record-of-truth.

### Phase 2E — Accept ingest row as manual entry

This is the big workflow unlock. Every bank row in Tx now has two action buttons instead of nothing:

- **✎ Review** — opens the new-transaction form pre-filled with date, amount, description, and a category guess based on the merchant name. You eyeball it, tweak the category if needed, save.
- **✓ Accept** — files it immediately with the suggested category. One tap per row. Fastest path through the unexplained backlog.

The category guesser is rough but covers the obvious cases: payroll/direct-deposit → salary, Zelle/Venmo/Cash App → transfer, gas stations → fuel, grocery stores → groceries, restaurants → dining, utility names → utilities, streaming services → subscription, insurance carriers → insurance, pharmacies → medical, etc. Everything else falls through to "other."

Once you accept a row, the next ingest refresh (≤5 min) dedupes it: the bank ingest row drops off the list and the manual entry you just created gets a green **✓ bank-confirmed** badge.

### Phase 2B.2 (under the hood) — lifted ingest fetch

The workflow 18 fetch now happens once at the top-level `PoeFinancialSystem` component instead of duplicated inside `BooksTransactions` and `BooksAccounts`. One network call per 5 minutes instead of three; one state machine to reason about; the same `ingestData` object passed down as a prop to Tx, Accounts, and Big Picture. Faster, simpler, easier to extend.

## Single-step deploy

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx docs/00-foundations/n8n-workflows/15-bank-ofx-watcher.json docs/00-foundations/n8n-workflows/18-imported-transactions-api.json docs/99-session-notes/2026-05-28-overnight-brief.md
git commit -m "Phase 2B.2 + 2C + 2E: Big Picture bank-reconciliation strip; Tx status filter (all/needs-attention/unexplained/unconfirmed/verified/noise); Accept-as-manual workflow on ingest rows; lifted ingest fetch to top-level for shared state"
git push
```

The two workflow JSON edits are just shorter titles (under n8n's 128-char limit) for files you've already re-imported. No re-import needed unless n8n shows them as out-of-sync.

## Verifying on your phone

Once Vercel finishes building (look for the build-SHA marker in the header to change), open kingdom-pwa-node.vercel.app. Then:

1. **Big Picture** — between the hero row and the property/equipment cross-reference, you should see a new 3-cell strip: Bank cash · linked, Manual vs bank, Needs attention.
2. **Books → Tx** — above the transaction table, a new row of colored pills: All / Needs attention / Unexplained / Unconfirmed / Verified / Noise. Tap "Needs attention" to filter to the 1923+ rows that want a manual entry.
3. **Every bank row** — the right-side actions cell now shows blue **✎ Review** and green **✓ Accept** buttons instead of nothing.

## The morning workflow

1. Open Books → Tx, tap the "Needs attention" filter pill.
2. Scroll through. For each row, hit ✓ Accept if the category guess looks right, ✎ Review if you want to adjust.
3. Every ~50 rows the page picks up the next ingest refresh and your accepted rows drop off the unexplained list and start showing up on the History view with the green bank-confirmed badge.

A few hundred rows in, the Big Picture's Manual vs bank Δ should start closing. Once it's under 50¢, you're fully reconciled with the bank — that's the milestone.

## Files touched

- `app/src/poe-financial-mvp-v28.jsx` — top-level ingest fetch lifted from BooksTransactions/BooksAccounts; Phase 2C status filter UI + logic; Phase 2E acceptIngest + button row; Phase 2B.2 Big Picture reconciliation strip.
- `docs/00-foundations/n8n-workflows/15-bank-ofx-watcher.json` — shorter workflow title.
- `docs/00-foundations/n8n-workflows/18-imported-transactions-api.json` — shorter workflow title.
- `docs/99-session-notes/2026-05-28-overnight-brief.md` — this file.

## What's next

- **Phase 2D — Gmail finance events as suggestions.** When you add a manual entry that matches a recent Gmail receipt (same vendor + similar amount), prompt "looks like the $X charge from <vendor> on <date>?" with one-click apply.
- **Phase 2F — Mark as noise.** Per-row "this is noise, ignore" that writes back to workflow 16's state file so the row stays out of "Needs attention" forever.
- **vite-plugin-pwa with autoUpdate.** Real PWA with offline + update banner. The Cache-Control headers solve the immediate problem; this is the proper architecture.
