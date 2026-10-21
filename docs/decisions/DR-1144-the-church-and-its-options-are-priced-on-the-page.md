# DR-1144: The church and its options are priced on the page — $200 flat on the paid ladder, and the options above any tier each with a written amount

**Date:** 2026-10-20
**Status:** accepted
**Tier:** C (front-door publication of a real-money price; DR-1128 §8's one yes was given, below)
**Type:** product (front door) + pricing
**Area:**
- `app/src/lib/church-offer.js` (new, pure: the church tier read from `CHURCH_FLOOR_CENTS`, the three options), `app/src/components/ChurchOffer.jsx` (new: `ChurchCard`, `ChurchOptions`)
- `app/src/components/About.jsx` (the Paid tiers tab: the church card after Business; the options strip under the ladder), `app/src/components/shared.jsx` (`PricingTier` takes a price prefix and shows no yearly line when none exists)
- `app/src/__tests__/the-church-and-its-options-are-priced-on-the-page.test.jsx` (new, 10 cases)

**Amends:** DR-1128 §8 (front-door publication waited for one yes) and its "not yet changed: About.jsx". Grounds: DR-1128 (the number and its terms), DR-0076 §4 (measure, do not claim), DR-0381 (not hollow: every option says what it rests on), DR-0106 (a recommendation with a default, never a bare question).
**Declared by:** Darrell, 2026-10-20, from the Paid tiers page: *"I need the prices for church and other options like surveillance..."*

---

## Context

The Paid tiers tab showed PoeTech+, Household, Premium and Business. The church price was decided on 2026-10-20 (DR-1128: $200 a month at least, flat, no contract, 0% of giving) and built on the landing strip and the market card in #2295, held for the one yes §8 asked for. Darrell's words above are that yes, and they ask for one thing more: the options above the base, surveillance first.

## What was measured

- The page as he saw it: the four paid cards and the Free-for-justice cards; no church, no options. (His screenshot.)
- The one source for the church number: `CHURCH_FLOOR_CENTS = 20000` in `church-cost-to-serve.js`; the card reads it, the test pins it.
- Cameras: the consumer cloud plans run about $3–10 a camera a month in 2026 (Wyze Cam Plus about $2.99; Arlo Secure $4.99–7.99; Nest Aware about $10; Ring Home Multi $9.99 a location), and four of the five raised prices in the first quarter of 2026. Ours is a sovereign recorder (`cams_recorder.py`: ten-minute MP4 segments, retention per camera, one disk budget) plus support time. **Cameras do not yet pass their own witness** (camera-health; DR-1119's audit: "Cameras never work"), and DR-1128 §7 sells them only once proven on PoeTech's own.
- The minister's lessons: the lesson pipeline is sovereign (no marginal cash cost); the cost is the review time each month, which the cost-to-serve model prices as a standing workflow with the reserve (DR-1128 §5).

## Decision

1. **The church is on the paid ladder: `Church · Supported`, from $200/mo, flat, no contract, 0% of giving.** The card lists what $200 includes (DR-1128 §2), the four terms (no contract and export any time; free only where we do no work; the Community tier when a sponsor pays; the price is the higher of $200 and the whole cost to serve), and shows no yearly rate, because none was decided. Subscribe hands the cart the tier at $200 a month.
2. **The options above any tier are a strip under the ladder, each a fixed written amount with what it rests on:**
   - **Cameras: $10 a camera a month**, for a church or a household, recorded on PoeTech's own recorder, 30 days kept, no per-clip fee. **Marked "ships next · not sold yet"** until camera-health proves them on our own cameras. The number is the top of the consumer range so each camera covers its storage and support; it is a recommendation under this record's re-review, and one word from Darrell changes it.
   - **The minister's own lessons: $50 a month**, available now: sermons and teachings brought into the church's own space as lessons, reviewed before they publish. A recommendation on the same terms.
   - **A workflow built for your church: quoted up front** (DR-1128 §4), joining the base for every church when it ships.
3. **#2295's hold is released** on these words: the landing strip and the market card carry the same price.

## Impact

A church and a landlord see the same honesty the other cards have: what is live, what ships next, and what each number rests on. Nothing is gated by this: `tiers.js` is unchanged, and the church price remains a contract with a church, not a tier key (DR-1128 Verification).

What this does not do, with a why and a date: it does not sell cameras today (they are not proven; the card says so), and it does not add a yearly church rate (none decided). `re-review: 2026-11-20` with the first paying church, together with DR-1128's own re-review: confirm or change the two option numbers from a real quote.

## Verification

- `the-church-and-its-options-are-priced-on-the-page.test.jsx` (10 cases): the card's number IS `CHURCH_FLOOR_CENTS`; "from", "$200", no "/yr", "no contract · 0% of giving"; every §2 line; the terms; Subscribe hands the cart `Church · Supported` at `200`; every option has a what, a basis and a price label; cameras read `$10 a camera a month`, `ships next`, `Not sold yet: offered once proven on PoeTech's own cameras`, and the $3–10 market line; the minister's lessons `$50 a month · available now`; the built-for-you option `quoted up front`; the strip is a labelled region.
- `about-sections-render.test.jsx` still renders every About section with the two new pieces mounted.
- Lint, legibility (snapshot regenerated for the new page), decision-chain and the ledger guards pass.
