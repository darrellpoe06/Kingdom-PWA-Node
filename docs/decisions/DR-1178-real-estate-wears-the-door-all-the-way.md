# DR-1178: Real Estate wears the door all the way, and its fields are one chain instead of three blanks

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a surface Darrell reads daily; changes what figures SAY, never what they are, and moves no data)
**Type:** fix

**Area:** `app/src/lib/rental-portfolio.js`, `app/src/lib/real-estate-door.js`, `app/src/components/Rentals.jsx`, `app/src/components/PoePropertiesWelcome.jsx`, `app/src/__tests__/the-real-estate-fields-fit-together.test.jsx` (new).

**Principles:** DR-0076 (measure, do not claim — and do not UNDER-claim either); DR-0061 (reality-trace); DR-1169 (the band this completes); DR-1156 (a theme remaps tokens, never literals); DR-0099 (red stays chrome); DR-0621 (a flag is where the work starts).

## Context

**Darrell, 2026-10-21, with two screenshots of the live tab**, in order:

> *"This isn't like the other tab enough... it only changed or added things to the top... why... we need the look of the Properties tab all the way and the colors can change with the color choices like the other tab."*
>
> *"Real estate should be flowing end to end data flows and fields should be concise ... made to work together."*
>
> *"And Properties tab... and Real-estate should work already if not fix it!!!!!"*
>
> *"Real Estate is more accurate than the other."* · *"However that's just data... we need them to fit together."*
>
> *"Each should or may have data that should be combined and we will upload all data after the system is actually tight."*

He was right on every count, and his screenshots carried the evidence.

## What was measured — from his own screenshots and the code behind them

**The look stopped at the top.** DR-1169 mounted `RealEstateDoor` as its **own** `.pp-door` island, so the `--pp-*` palette existed for the band and ended at its edge. Everything below kept the old shape: a 10px grey `PROPERTIES · 13`, a 10px grey `INCOME-PRODUCING · 12`, Fraunces card titles, bare text links for Edit / Records / Split / Delete. **The colors were already following the theme** — both screenshots are midnight and both the band and the cards are dark; what stopped at the top was the **shape**.

**The note fields were three blanks that are really one broken chain.** On every card:

```
Mortgage: —    Rate: 6.5%    P&I: —
```

A rate is not an independent fact. It is the multiplier between a balance and a payment, and the app made a person type all three by hand or see nothing.

**And the door reported a partial sum as a whole one:**

| cell | his screenshot | honest? |
|---|---|---|
| Rent a month | `$11,700` · **11 of 12 entered** | yes |
| Mortgage a month | `$950` · *(no sub-line)* | **no** — one payment in twelve |
| Left after the note | `$10,750` · *(no sub-line)* | **no** — rent minus one note |
| Still owed | `$0` · **0 of 12 entered** | yes |

Both bad cells were arithmetically correct and both read as complete. That is the under-claim half of DR-0076 in reverse: a partial sum wearing a full sum's clothes, inside the very file whose comment promises *"a property missing a figure is counted as needs-input and flagged, never silently zeroed."*

**A label was being drawn as a measurement.** Every card read **PAYING** while the band above it read *"No lease is synced yet, so this month has nothing to measure against."* Two fields about one fact, disagreeing, on one screen.

**They already share a key, and nothing joined on it.** A `rentals` row's `remoteUuid` **is** the `rentals` table id (`rentals-sync.js:118`) that a Poe Properties tenancy points at through `rental_id`. `paidPortfolio.byDoor[r.remoteUuid]` proves the key works — it was loaded on every card and never read for this.

## Decision

**The island moves up to wrap the whole section**, and the band drops its own scope (`scoped={false}` — the prop it already carried for exactly this). One stylesheet now dresses the band **and** the list; `data-theme` rides the same `useThemePref` the band used, so the colors keep following the person's choice.

**The list wears the door's own shape:** `.pp-list-head` / `.pp-list-title` (Playfair, with the gold rule), `.pp-eyebrow` for the group headers, `.pp-row-card` / `.pp-row-head` / `.pp-row-title` for a property, `.pp-pill` for Add property, `.pp-act` for the action row. **Tokens only — not one literal color** except `#FFFFFF` on the brand-red pill, so every class remaps with the theme instead of going dark-on-dark.

**The note chain closes, and it runs BOTH directions.** Darrell corrected an earlier draft of this that refused to read a blank rate at all:

> *"Blank rates should reflect the rate.... 0% interest... 0 means no mortgage or we dont know it we have our payments and other information and we should be able to deduce from there or need to say its based on this or that... make sense?"*

He was right, and the correction is the whole shape of `mortgageFacts(row)`. **A zero is not one thing:**

- **No balance and no payment is FREE AND CLEAR** — the best state a door can be in, and the old code drew it as three em-dashes indistinguishable from "nobody typed anything." It now says so: *"No mortgage on record — nothing owed and no payment going out."*
- **What we have deduces the rest.** `monthlyPIFrom` gives the payment from a balance and a rate; **`solveRate` gives the rate from a balance and the payment we already collect** — bisected, because `P = B·i/(1−(1+i)^−n)` has no closed form. The rate solve runs **first**, because a payment someone actually pays is better evidence than a term we assumed.
- **0% interest is a real answer.** When the payment covers the balance over the term with nothing left for interest, it says *"0% interest"* rather than refusing.
- **Every deduced figure says what it is based on** — his *"need to say its based on this or that"* — and carries a `~` so it can never pass for one somebody typed. A partial record names the one field that would complete it.

**The door counts the note column** like it already counted rent and debt, and **the derived cell inherits the weaker of the two columns it subtracts** — because a difference is only as complete as its least complete side.

**A label says it is a label.** `rentFact(row, paid)` reads the door's own ledger entry. **And its direction is his:** *"Real Estate is more accurate than the other"* — so an unbacked status is a gap in the **ledger**, never doubt about the row, and the words say so. Getting that backwards would have the app second-guessing its own best data.

**Where the two tabs meet is said once, not guessed at.** Each side owns a different half: the **property** (address, rent, mortgage, photos, records) is this tab's; the **tenancy** (lease, tenant, cameras, work orders) is the door's, because that is where the workflow writes it and where RLS governs it. One line on the list says it when the ledger is empty.

**No data is moved, deliberately** — *"we will upload all data after the system is actually tight."* The join key is named, each half's ownership is stated, and not one row is migrated, merged or auto-matched. The bulk load is his, on his timing, after this is tight.

## Impact

**The tab reads as one surface instead of a hat on an unchanged body**, in every theme.

**Two figures stop over-claiming**, and a rate that was entered finally does something.

**What this does NOT do:** it does not make a lease exist. `loadPortfolioPaid` runs on mount for a signed-in person and returned nothing because there genuinely is no lease row for these doors — the surface now says that in the ledger's own terms rather than letting a PAYING pill imply otherwise. **`re-review: 2026-10-28`** with the data load.

**Still in the old shape:** the deep sub-panels behind Edit / Records / Split (the market form, the room editor, the photo archive) keep their house literals. They are a second pass, not this one — the list is what he was looking at. **`re-review: 2026-10-28`.**

## Verification

**22 new cases**, and the existing set unchanged and green: **61 passed** across `rental-portfolio`, `the-real-estate-door-opens-on-the-portfolio`, `real-estate-says-whether-its-door-is-linked` and `rent-portfolio-paid`.

**Two proven to catch by breaking the code:**

| what was broken | what went red |
| --- | --- |
| free-and-clear collapsed back into "not enough on the record" | **1** — *"expected 'partial' to be 'none'"* |
| the rate deduction removed — a dash where the payment is known | **1** — *"expected +0 to be close to 6.5"* |

Restored each time: **22 passed**.

**The suite caught a real design error of mine before it shipped**, and his correction then caught the fix. An earlier `piFor` derived a payment from `{balance: 200000, rate: 0}` — because the row stores `rate: parseFloat(...) || 0`, so a blank and a genuine zero are the same value, and `monthlyPIFrom`'s correct zero-rate branch returned the straight-line payment, **inventing a payment from an empty field**. My repair was to refuse a zero rate outright, and *that* was also wrong: it threw away the 0%-interest case and ignored the payments we do hold. Darrell's correction produced the right model — deduce from whatever two figures exist, name the basis, and treat no-balance-no-payment as free and clear. Both of my versions are recorded here rather than only the one that shipped.

The math is pinned against **lender's figures, not our own output**: $200,000 at 6.5% over 30 years = **$1,264.14** forward, and the same figures solve back to **6.5%**; the round trip holds at 3.25, 4.75, 6.5 and 7.875%. `solveRate` returns **null** rather than a number when a payment cannot service the balance at any rate.

`npm run lint` exit **0**, read without a pipe.
