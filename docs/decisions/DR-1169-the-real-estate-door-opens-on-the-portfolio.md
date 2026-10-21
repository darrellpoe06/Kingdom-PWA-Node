# DR-1169: The Real Estate door opens on the portfolio, not on a 10px label

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one tab's opening band; no route, no schema, no money moves, no navigation change)
**Type:** product (surface)

**Area:** `app/src/lib/real-estate-door.js` (new — the pure derivation), `app/src/components/RealEstateDoor.jsx` (new — the band), `app/src/components/Rentals.jsx` (mounts it, and the bands narrow the list below), `app/src/lib/feature-registry.json` (the new surface and its three controls), `app/src/__tests__/the-real-estate-door-opens-on-the-portfolio.test.jsx`, `app/src/__tests__/feature-presence.test.jsx` (the walk).

**Principles:** DR-0061 (reality-trace: name the real rows, observe the running surface, write the premise down first); DR-0076 §4 and §8 (measure, never paint; unknown is never rendered as zero); DR-0065 (the app is the primary artifact); DR-0099 (true red is the Blood's alone); DR-0726 (every control carries a registry entry); DR-0075 (perpetual improvement).
**Declared by:** Darrell, 2026-10-21 at 01:35, on his phone: *"real estate needs a makeover too... it looks bland... boring..."* — and then, settling the question he had just raised himself: *"Maybe makeover Real Estate tab and the we keep it... make sense?"* The tab stays. It gets the makeover.

---

## Context

The Real Estate tab (`view: 'rentals'`, `app/src/lib/life-hub.js:85`) is where the family's eleven-ish doors live: leases, tenants, equipment, rooms, maintenance, the payoff cascade, the photo archive. It is one of the richest surfaces in the app, and it opened on nothing.

## What was measured

Before a line was styled, the built `dist` was loaded in a real Chromium at 360px, 768px and 1440px (the same static server `scripts/chrome-layout-probe.mjs` uses, driven by a scratch script, with the help tour and the profile picker already answered so the real page rendered). What a phone actually met at the top of `?view=rentals`:

1. the tier band (signed-out only),
2. the section tab strip,
3. a 10px grey uppercase `PROPERTIES · 1` with a 10px `+ ADD PROPERTY` beside it,
4. a second 10px grey uppercase `INCOME-PRODUCING · 1`,
5. the cards.

Not one figure about the portfolio itself was on the first screen. On a signed-in family device that reads: a tiny grey label, then eleven near-identical white cards.

**The blandness was a DATA PLACEMENT problem wearing a style problem's clothes.** Every number a landlord opens this tab for already existed in the component:

- `derivePortfolio()` (`app/src/lib/rental-portfolio.js`) — door count, the owning business's own name, monthly rent, monthly P&I, mortgage debt, the rent gap, and which rows are still missing a figure. Rendered only inside the **Portfolio & payoff** tab, one tap away.
- `loadPortfolioPaid()` (`app/src/lib/rent-portfolio-paid.js`) — this month's received-vs-due across every door with a synced lease, read in ONE query off the cloud `leases` + `rent_payments` tables. Loaded on mount by `Rentals.jsx`, and also rendered only in the second tab.
- The rows themselves — `data.inflows.rentals`, the Supabase `rentals` table synced by `app/src/lib/rentals-sync.js` — which already carry `status` (`late`, `vacant`, `rehab`), and `data.incidents`, which already point at a property through `linkedTo.type === 'rental'`.

Nothing had to be invented. It had to be brought to the door.

## Decision

The Properties section — the one the tab opens on — leads with a band built from those same rows:

- **Who and how big** — `N doors · M properties`, and the owning entity's real name, in the house serif rather than a 10px label. The family's own home is named separately and never counted as a door.
- **Rent this month** — the lease ledger's received-vs-due with the established `PaidBar`, and how many doors paid. When fewer doors have a readable lease than the portfolio holds, it says so. **When no lease is synced at all, there is no bar: it says why in words.** An unknown month is never drawn as a 0% that would read as "nobody paid" (DR-0076 §8).
- **What it holds** — rent a month, mortgage a month, what is left after the note, and what is still owed. Each is a sum of figures actually on the rows; where some rows carry none, the cell says `4 of 5 entered` instead of letting a blank pass as a zero.
- **What wants you today** — a band per real condition (behind on rent, empty, in rehab, with an open issue, with no rent entered, with no mortgage figure), each carrying the count of rows that match. **Tapping one narrows the list below to exactly those doors**, by the same ids the band counted — never a second query — and offers the way back out. A band with nothing in it never appears; a band that empties while focused clears the focus itself.
- **The payoff line and the verse** — the projection off the real mortgage rows, said plainly when the seventh year is not reachable as things stand, under Proverbs 27:23 (KJV, verbatim), which is what the whole tab is for.

Colors are the app's existing tokens as classes, so each theme remaps them. The rust sits on the white card (4.68:1, AA) rather than the cream base, where the same brand token is a known sub-AA warning. **True red appears nowhere, and a gate in the new test file proves it** (DR-0099).

## What was NOT touched

The `Properties` tab and its front door (another record owns that), `FamilyStories.jsx`, the tab row's order or labels, and every navigation route. The Real Estate tab stays exactly where it is — Darrell settled that himself.

## Impact

The second tab keeps its fuller rollup unchanged; the door is the summary, not a replacement. `Rentals.jsx` grows one mount, one `useMemo`, one piece of focus state and one filter; all the arithmetic lives in a pure module with its own tests.

`re-review: 2026-11-21` — whether the two rollups (this band and Portfolio & payoff) should become one, now that both are on real rows and a person can see them side by side.

## Verification

- `the-real-estate-door-opens-on-the-portfolio.test.jsx` — 20 checks: the counts come off the rows, a band with nothing in it never shows, the unknown month is said rather than drawn, the payoff line appears only when there is a projection AND real debt, the rendered band carries the figures and the verse verbatim, every tap target is 44px, and nothing is marked in true red. Its proven-to-catch case strips every rent from the rows and requires the door to follow them down rather than keep its old total.
- `feature-presence.test.jsx` — the new `real-estate-door` surface is walked on real-shaped rows, so the three controls cannot vanish silently (DR-0726).
- `scripts/chrome-layout-probe.mjs --sweep` — `rentals` is already in the swept views; measured at 360 / 768 / 1440 / 1920 with the band in place.
- Per-theme contrast measured with `scripts/contrast-guard.mjs`'s own math on the exact token pairs the band uses, in every theme.
