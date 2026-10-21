# DR-1169: The Real Estate door opens on the portfolio, in the Poe Properties face

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one tab's opening band; no route, no schema, no money moves, no navigation change)
**Type:** product (surface)

**Area:** `app/src/lib/real-estate-door.js` (new — the pure derivation, including `serviceRecord()`), `app/src/components/RealEstateDoor.jsx` (new — the band), `app/src/components/PoePropertiesWelcome.jsx` (one appended block in `WELCOME_CSS`), `app/src/components/Rentals.jsx` (mounts it, and the bands narrow the list below), `app/src/lib/feature-registry.json` (the new surface and its three controls), `app/src/__tests__/the-real-estate-door-opens-on-the-portfolio.test.jsx`, `app/src/__tests__/feature-presence.test.jsx` (the walk).

**Principles:** DR-0061 (reality-trace: name the real rows, observe the running surface, write the premise down first); DR-0076 §4 and §8 (measure, never paint; unknown is never rendered as zero); DR-0065 (the app is the primary artifact); DR-0099 (true red is the Blood's alone); DR-0726 (every control carries a registry entry); DR-0075 (perpetual improvement).
**Declared by:** Darrell, 2026-10-21 at 01:35, on his phone: *"real estate needs a makeover too... it looks bland... boring..."* — and then, settling the question he had just raised himself: *"Maybe makeover Real Estate tab and the we keep it... make sense?"* The tab stays. It gets the makeover. And then, mid-build, two more words from him that shaped it: *"If a potential tenant uses the app they will be able to see the level of services that were provided by us."* And: *"Real Estate can also look like Properties... and have the new features we discussed earlier... the we could have the Real Estate features still inside the Poe Properties App... make sense?"*

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

## It looks like Properties by using Properties' own stylesheet

Not a fresh visual invention and not a copy of its hex values. `WELCOME_CSS` (`app/src/components/PoePropertiesWelcome.jsx`) scopes the whole `--pp-*` palette to a `.pp-door` element and remaps it once for midnight, which is why the file's own comment says to reuse it rather than lift colors out of it. The band mounts the same scoped island `app/src/modules/properties/PropertiesTab.jsx:79` already uses to host the front door inside the PoeTech shell — `<div data-theme={...} className="pp-door"><style>{WELCOME_CSS}</style>` — and then wears the front page's own classes: `.pp-panel`, `.pp-panel-title`, `.pp-kicker`, `.pp-rule` (the gold rule), `.pp-cards` (the auto-fit grid), `.pp-eyebrow`, `.pp-back`, Playfair Display throughout.

**What was added, and why it is one appended block.** The front page has no meter, no stat cell and no pill-shaped count, so `WELCOME_CSS` gains one clearly delimited block at its end (`.pp-meter`, `.pp-stat*`, `.pp-band*`, `.pp-re*`, `.pp-verse*`) plus two tokens — `--pp-good` and `--pp-watch`, the paid-and-clear and the look-at-this-but-not-urgent accents a portfolio needs that a marketing page does not. Both carry a midnight remap in the same shape as every token above them; no color is written inline, because an inline color cannot be remapped and goes dark-on-dark. The block sits at the end on purpose: a sibling branch is adding `.pp-cam-*` to the same stylesheet, and two appended blocks do not fight.

**Measured, not claimed:** every foreground this band paints, on the panel it sits on, in both palettes the stylesheet defines — ink **18.88 / 14.62**, muted **7.39 / 7.30**, brand red **5.04 / 5.21**, `--pp-good` **6.39 / 10.52**, `--pp-watch` **8.60 / 9.94** (light / midnight). Worst pair **5.04:1**, all clear of AA, and a case in the suite re-measures them from the stylesheet on every run.

**On the red (DR-0099).** `--pp-red` is Poe Properties' shipped brand red and is used here exactly as that door already uses it — on chrome: the kicker, the meter fill, the pill. It never marks the Scripture, which is set in `--pp-muted`; no color meaning is assigned to the Word on this surface, and a case asserts the verse carries no red class.

## The features live in one place, not on an island

Darrell's third sentence — *"we could have the Real Estate features still inside the Poe Properties App"* — is an architecture instruction, and it is answered by making there be only ONE of each thing:

- `lib/real-estate-door.js` is pure and takes rows in. It has no idea which app is asking.
- `components/RealEstateDoor.jsx` is presentational and standalone, and takes `scoped={false}` for exactly this: **inside the Poe Properties app the host already IS a `.pp-door`**, so the band skips its own island and inherits the palette already on the page. A case mounts it both ways and proves the inner one declares no second `<style>`.

**The mount point, named.** `app/src/modules/properties/PropertiesApp.jsx` — the landing it renders before a door is picked, above the board. That is the right place because `PropertiesApp` already holds its own `rentals` state read straight from the cloud table, so the band would be handed those rows and nothing new would be fetched.

**What this record does NOT do, plainly.** That one-line mount is **not made in this change.** `PropertiesApp.jsx` and `DoorTabs.jsx` are held open right now by PR #2346, and the Properties tab and its front door are another record's to move (DR-1155). Widening into a 2,000-line file two other sessions are editing would trade a mergeable change for a conflict. The seam is built, tested both ways, and the insertion is one line against whichever of those lands last.

**The Real Estate tab keeps its own route.** `?view=rentals` is unchanged, the tab row is untouched, and nothing about navigation moved — Darrell settled that himself with *"makeover Real Estate tab and the we keep it."*

## Decision

The Properties section — the one the tab opens on — leads with a band built from those same rows:

- **Who and how big** — `N doors · M properties`, and the owning entity's real name, in the house serif rather than a 10px label. The family's own home is named separately and never counted as a door.
- **Rent this month** — the lease ledger's received-vs-due with the established `PaidBar`, and how many doors paid. When fewer doors have a readable lease than the portfolio holds, it says so. **When no lease is synced at all, there is no bar: it says why in words.** An unknown month is never drawn as a 0% that would read as "nobody paid" (DR-0076 §8).
- **What it holds** — rent a month, mortgage a month, what is left after the note, and what is still owed. Each is a sum of figures actually on the rows; where some rows carry none, the cell says `4 of 5 entered` instead of letting a blank pass as a zero.
- **What wants you today** — a band per real condition (behind on rent, empty, in rehab, with an open issue, with no rent entered, with no mortgage figure), each carrying the count of rows that match. **Tapping one narrows the list below to exactly those doors**, by the same ids the band counted — never a second query — and offers the way back out. A band with nothing in it never appears; a band that empties while focused clears the focus itself.
- **The service on record** — the second half of the brief. A prospect judging whether to rent from this family is judging the level of service, so that figure is a TRUST figure and the last place a painted number belongs. Every one is counted off a row that already exists, named: issues **answered and closed** and the ones **open now** come from `data.incidents` filtered to `linkedTo.type === 'rental'`; the **typical days** is the MEDIAN of `resolvedAt` minus `date` on those incidents, and an incident missing either date is EXCLUDED from the timing, counted in `unmeasured`, and said out loud (`3 of 4 carry both dates`) rather than averaged in; **past the day promised** compares each open incident's own `dueDate` — set by the urgency band that opened it — against a day handed in, never a clock read inside the pure function, so no `today` in means no overdue figure out; and **on file** sums the six stores a property record keeps (`unitNotes`, `maintenanceLog`, `conversationLog`, `rooms`, `equipment`, `photos` — the same `STORES` list `lib/property-record-counts.js` owns), with the photo count taking the live NAS chat-channel archive total (`channelCounts`, fetched by `Rentals.jsx` through `lib/nas-photos.js`) where there is one, because that is the number of pictures a person actually sees. A portfolio that has logged nothing yet gets `known: false` and the line does not render at all — an empty record is never dressed as a fast one.
- **The payoff line and the verse** — the projection off the real mortgage rows, said plainly when the seventh year is not reachable as things stand, under Proverbs 27:23 (KJV, verbatim), which is what the whole tab is for.

Colors are the app's existing tokens as classes, so each theme remaps them. The rust sits on the white card (4.68:1, AA) rather than the cream base, where the same brand token is a known sub-AA warning. **True red appears nowhere, and a gate in the new test file proves it** (DR-0099).

## What was NOT touched

The `Properties` tab and its front door (another record owns that), `FamilyStories.jsx`, the tab row's order or labels, and every navigation route. The Real Estate tab stays exactly where it is — Darrell settled that himself.

## Impact

The prospect-facing door itself (the Poe Properties workspace) is NOT touched — another record owns it — but the facts a prospect would be shown now exist as a tested pure derivation (`serviceRecord()`), reading the same rows, ready for that surface to call.

The second tab keeps its fuller rollup unchanged; the door is the summary, not a replacement. `Rentals.jsx` grows one mount, one `useMemo`, one piece of focus state and one filter; all the arithmetic lives in a pure module with its own tests.

`re-review: 2026-11-21` — whether the two rollups (this band and Portfolio & payoff) should become one, now that both are on real rows and a person can see them side by side.

## Verification

- `the-real-estate-door-opens-on-the-portfolio.test.jsx` — 29 checks: the counts come off the rows, a band with nothing in it never shows, the unknown month is said rather than drawn, the payoff line appears only when there is a projection AND real debt, the rendered band carries the figures and the verse verbatim, every tap target is 44px, and nothing is marked in true red. Nine of them hold the service line to its own standard: the median is taken only over incidents that carry both dates, an untimeable one is counted and named rather than averaged in, no `today` in means no overdue figure out, the live NAS photo total wins over the device's, and a portfolio with no history renders no line at all. Its proven-to-catch case strips every rent from the rows and requires the door to follow them down rather than keep its old total.

- A per-theme contrast case measures the band's exact token/background pairs with `contrast-guard.mjs`'s own math, in all 11 themes, and fails on anything under AA. It is not decoration: the first draft used the urgency amber `#D97706` the incident row already uses, measured **3.08–3.19:1 on the card in ten of eleven themes**, and was replaced with the tracked blue `#2A5A8E` rather than shipped under a comment claiming AA — the exact failure DR-0076 was written about. After the fix: **165 measurements, every one at or above 4.5:1, worst 4.68:1** (rust on the card in rose / sapphire / slate / white / x).
- `feature-presence.test.jsx` — the new `real-estate-door` surface is walked on real-shaped rows, so the three controls cannot vanish silently (DR-0726).
- `scripts/chrome-layout-probe.mjs --sweep` — `rentals` is already in the swept views; measured at 360 / 768 / 1440 / 1920 with the band in place.
- Per-theme contrast measured with `scripts/contrast-guard.mjs`'s own math on the exact token pairs the band uses, in every theme.
