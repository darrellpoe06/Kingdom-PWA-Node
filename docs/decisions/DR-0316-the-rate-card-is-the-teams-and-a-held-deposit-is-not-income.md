# DR-0316 — The rate card is the team's, and a held deposit is never income

- **Date:** 2026-08-30
- **Status:** accepted
- **Tier:** B
- **Surfaces:** Church > Venues (EventManagement, staff console); the new Rate card tab; venue_bookings / venue_rate_cards / venue_rate_card_notes (migration 0162)
- **Pairs with:** DR-0076 (measure, don't claim; §3 proven-to-catch), DR-0065 (the app is the primary artifact), DR-0061 (reality-trace before building a surface), DR-0075 (perpetual improvement — this closes a documented follow-up), DR-0074 (the client gate is a courtesy, the database is the wall)

## What Christina said

Christina, Director of Ministries for The Love Corner (The Church of the Living
God, Champaign, Illinois), 2026-08-30, submitting the **Commercial Event
Facility Rental Proposal** — the first real dollar rates this platform has ever
carried for the church's own spaces: $1,000/hr facility, $50/hr per sound
person (2-4 typical), $35/hr per security person (5-10 typical), $500 cleaning,
$1,000 refundable damage deposit; 50% of the facility rental at signing, the
balance 30 days out, $0 on the day. Her document closes:

> "Proposed rates and terms are subject to approval."

Then, in the same conversation, the part that decided the architecture:

> "this will need to be able to be updated based on what the whole team and
> staff would like to see, however it's a great opportunity for default
> settings to be able to be discussed with the MVP in your account... inside
> the Love Corner App."

## What this closes

`app/src/lib/venue-rental.js` has carried this note since the booking table
shipped:

> "PRICING TRUTH (no fake money on a trust surface): the committed catalog
> carries a relative `tier` per campus but NO invented dollar rates... A
> staff-editable rate card is a documented follow-up."

Christina's proposal is the real rate card that note was waiting for. It is
entered as **her** numbers, under **her** name, with the status **she** gave
them — and the follow-up is closed the way she asked for it, not by freezing
her figures into code.

## The three decisions

**1. The committed numbers are the SEED; the team owns the live card.**
`DEFAULT_COMMERCIAL_RATE_CARD` holds her proposal in code. `venue_rate_cards`
(one row per instance) holds only what the team has **changed**; every
untouched field falls through to her defaults. `mergeRateCard()` is the single
seam every surface reads through, so an override can never blank out a rate by
omission, and a later default change still reaches every field nobody touched.
The staff surface says which it is showing — "as submitted by Christina" versus
"edited by the team" — and offers a one-tap return to her proposal.

**2. The status is DATA, and a proposal never renders as a settled price.**
The card ships `proposed` and only a staff action moves it to `under-review` or
`approved`. Status rides above every number on the rate card tab, on every
commercial booking card, and inside the quote builder. A bogus or missing
status falls back to `proposed` — it can never read as approved. Showing an
unapproved proposal as a firm price would be the painted-number failure DR-0061
and DR-0076 exist to prevent, on the surface where it costs the most: money
quoted to someone outside the church.

**3. A held deposit is NEVER income.** The refundable damage/security deposit
is collected before the event and returned after inspection. It is carried
separately from `eventCharges` through the whole quote, and only the event
charges reach `quoted_price` and the church's booked-revenue line. Counting
held money as income would overstate church income on a financial surface.

## Two supporting mechanics

- **Quotes store INPUTS, never totals.** A booking's `quote_detail` holds hours
  and headcounts only; every total is recomputed against the team's live card
  on each read. So an agreed rate change reprices every open booking instead of
  leaving stale money on the screen.
- **The discussion lives beside the numbers.** `venue_rate_card_notes` is
  append-only, staff-only, speaker stamped by the server — Christina's "let the
  defaults be discussed inside the Love Corner App," built where the discussion
  is actually useful, so the reasoning behind an agreed rate outlives whoever
  typed it.

## Proven-to-catch (DR-0076 §3)

`venue-commercial-quote.test.js` (36 tests) pins her two worked examples
verbatim (6 hr = $6,000; 12 hr = $12,000) and was **observed failing** on three
deliberate mutations before being trusted:

| Mutation | Caught by |
| --- | --- |
| refundable deposit folded into `eventCharges` | 4 tests fail — the revenue line, the payment split, the junk-input case, and the booking round-trip |
| unknown status passed through instead of falling back | "a bogus or missing status can NEVER read as approved" |
| signing share applied to the whole quote, not the facility rental | "50% of the FACILITY RENTAL at signing" (expected 3,000, got 5,040) |

Writing the tests also caught a real bug in `quoteInputsFrom()`: absent staff
hours stored as `0`, which silently dropped the sound and security lines from
every saved quote. Fixed to mirror the engine's own default (the whole reserved
window).

## Scope held

Pricing stays private — both new tables are owner/admin in **both** directions,
matching `venue_bookings`; the community front door still shows no price. The
`commercial` event type carries its own responsibilities checklist (contract,
insurance, balance, deposit, sound, security, cleaning, post-event inspection),
so a commercial booking cannot reach event day with an unsigned contract or
unassigned security. Every other event type keeps its hand-entered price — a
funeral has no rate card, and should not get one.

## Open, with a date

The **North vs South campus tier** (premium/standard) is still relative, with no
per-campus multiplier: Christina's proposal quotes one facility rate and does
not distinguish the two buildings. Rather than invent a differential, the card
is campus-neutral until the team says otherwise — which is exactly the sort of
thing the new discussion thread is for. **re-review: 2026-09-30.**
