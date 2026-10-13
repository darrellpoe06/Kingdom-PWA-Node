# DR-0713 — Books reports read on every theme, and the filter chips pick together or separately

- **Status:** accepted
- **Tier:** A (a theme fix, one surface made visible, a filter made multi-select, a demo-only control taken off the real ledger; no data change, no money, no schema)
- **Type:** gates + surface
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/theme-css.js` (midnight hover remaps for six light hover fills; the `poe-selected` token); `scripts/contrast-guard.mjs` (`checkHoverCoverage`, `checkSelectedState`); `app/src/components/Imported.jsx` (one Reports section, open by default, one tab row; multi-select account and category chips; Together / Separately); `app/src/lib/imported-multi-filter.js` (new, pure); `app/src/components/BooksEntities.jsx` (selected chip token); `app/src/poe-financial-mvp-v28.jsx` (footer "Reset to seed data" demo-only); tests `books-reports-theme`, `imported-multi-filter`, `imported-render`, `kpi-visibility`, `reviewer-mode`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure), REALITY-TRACE (P15), COMPREHENSIVE-REVIEW (DR-0239 dim 3 and 4), P68 (a control lives where its scope lives)
- **Grounds:** Darrell, 2026-09-30, two screenshots of Books → Imported on his phone. First, on the black theme: *"Reports tab is hidden unless you know... also... it looks bad on black view... check it on all and find solutions."* Second, filtered to Mortgage: *"want to be able to choose multiple tabs and they add to the bottom together or separately... like mortgage and Mortgage 2111... currently I can only see them individually."*

## Context

The Imported tab grouped its seven standard reports under a collapsible "KPI's · Standard reports" header, closed by default. On the Midnight theme, that header became a white bar after a tap. The only report buttons outside the collapse were a row of chips (DR from 2026-08-11), and a second row of the same seven buttons appeared once the header was opened. The account and category chips each held one pick. The live footer showed "Reset to seed data" under the family's real ledger.

## What was measured

- **The white bar.** The header button carried `hover:bg-white` (`Imported.jsx`, former header at the KPI section), and midnight had no hover remap for it (`theme-css.js`, the midnight block). A phone keeps `:hover` on the last element tapped. Measured in Chromium with touch emulation: after the tap, the title was `#E5E5E5` on `rgb(255,255,255)`, **1.26:1**. The guard missed it because `parseMidnightRemap` skips every `:hover` rule. The app uses 58 `hover:bg-white` and five other light hover fills (`#E8E4DC`, `#F0ECE4`, `#F2F4EC`, `#E4EED6`, `#FAF1EC`), all with the same gap.
- **The selected state on black.** A selected chip was `bg-[#1A1815]` → `#1F1F1F`, and an unselected chip was `bg-white` → `#141414`: **1.12:1** apart, so nothing looked selected.
- **Before and after, header title / selected label / selected vs unselected**, measured on the rendered page at 412 and 1440px (identical at both widths):

| Theme | Title after tap (before → after) | Selected label | Selected vs unselected (before → after) |
|---|---|---|---|
| Cream | 17.72 → 16.70 | 17.72 | 17.72 → 17.72 |
| Snow (white) | 16.83 → 15.08 | 16.83 | 16.83 → 16.83 |
| Glacier (slate) | 16.91 → 15.23 | 5.91 | 5.91 → 5.91 |
| Sapphire | 10.36 → 9.52 | 10.36 | 10.36 → 10.36 |
| Rose | 9.65 → 8.84 | 9.65 | 9.65 → 9.65 |
| Midnight | **1.26 → 16.67** | 15.72 | **1.12 → 14.62** |

  In the light themes, the "before" title reading was taken on the white hover fill. The "after" reading is on the theme's own base, and it passes AA on every theme.
- **The seed reset.** The footer link was gated on `isFamilyMember || isAnyDemoMode`. `resetToSeed` calls `setData(SEED_DATA)`, which replaces the loaded ledger. The persistence effect then saves that over this device's snapshot. The cloud push is refused for seed data (`remainderIsSeed`), and no table rows are deleted. Its effect was that one confirm made the family's books on this device read as the sample family until a pull restored them.

## Decision

1. **Hover fills are themed.** Midnight remaps every light hover fill in use to a dark one. `checkHoverCoverage` fails the build if any `hover:bg-*` used anywhere under `app/src` renders light in midnight.
2. **Selection is themed.** The `poe-selected` class inverts the selected fill in midnight (`#0A0A0A` on `#E5E5E5`). `checkSelectedState` requires an AA label and a 3:1 difference from an unselected chip on every theme in the `THEMES` registry. It covers the report tabs, the filter chips, the period and Group-by controls, and the Books entity chips.
3. **Reports are visible without prior knowledge.** The section is one `<section>` titled "Reports". It opens by default, and a person's choice to hide it is remembered on this device. Show and hide use a button labeled with words, never a bare arrow. The report names stay on screen while the report is hidden, and picking a name opens it.
4. **One set of report controls.** There is one `tablist` with each report once, and exactly one tab is `aria-selected`. The second row is removed.
5. **Multi-select chips.** Tap a chip to add it and tap again to remove it. The "All" chip clears its row. Picks combine with OR within a row and AND across rows. When a row holds two or more picks, a Together / Separately switch appears. Separately stacks one section per picked chip, each with its own in/out/net. Categories split first. The sections partition the rows, so their subtotals add up to the Together line. Group-by works inside each section. The selection is remembered on this device (`poe-imported-picks`) and written to the address bar (`icat`, `iacct`, `ilayout`); a shared link wins over this device's copy. A single pick behaves as the old one-chip filter did.
6. **The footer seed reset is demo-only.** The guarded Admin action (explicit preview, danger confirm) remains for the steward.

## Impact

- Midnight users no longer get a white bar, or light-on-light text, after tapping any of the 58 `hover:bg-white` controls or the other five light hover fills across the app.
- Out of scope, listed for the lane that owns them: the selected chips in `BooksTransactions.jsx:1280`, `:1281`, `:1796` and `Debts.jsx:317`, `:482` use the same plain dark fill (1.12:1 in midnight). They are left untouched because open PR #1912 is editing those files. The fix is to add `poe-selected` to each ternary. **re-review: 2026-10-03**, or when #1912 merges. The inline badge colors in `BooksAccounts.jsx:364` and `BooksTransactions.jsx:1002-1027` are already tracked as WARN-tier by the contrast guard.

## Verification

- `books-reports-theme.test.jsx` (12 tests). Six of them failed against the pre-change `Imported.jsx` and shell: visible by default, one tablist, theme-token header, multi-select with Separately, shared-link boot, and demo-only reset. The six guard tests carry injected breaks. Removing the `hover:bg-white` remap yields `#FFFFFF`. Removing `poe-selected` yields midnight at 1.12:1.
- `imported-multi-filter.test.js` (12 tests) pins OR/AND, Separately sums equal to Together (and a double-counting rule that fails), the URL round trip, and the single-pick equivalence.
- `node scripts/contrast-guard.mjs` passes, and on the old `theme-css.js` it fails on all six hover fills and the midnight selection. `legibility-guard --check` passes, and `legibility-health.json` is unchanged (273/286).
- Playwright screenshots on all six themes at 412 and 1440px, before and after, plus the multi-select Separately view at 412px (cream, rose, midnight). The page does not scroll horizontally at 360 or 412px. The live check with Groceries and Housing picked read $6,048 + $17,400 = $23,448, the Together total.
