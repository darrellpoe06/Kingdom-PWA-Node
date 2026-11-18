# DR-1530: Every door at once

**Date:** 2026-11-18
**Status:** Accepted (built, gated, shipped through the lane)
**Tier:** A (a new read-only view over records the reader already reads under RLS; no schema, no auth, no money, no write)
**Type:** decision
**Area:** `app/src/modules/properties/portfolio.js` (the roll-up, pure); `app/src/modules/properties/cloud.js` (`loadPortfolioPulse`); `app/src/modules/properties/PortfolioTab.jsx`; `app/src/modules/properties/model.js` (`overview` on `MANAGER_TABS`); `app/src/modules/properties/PropertiesApp.jsx` (the case); `app/src/__tests__/every-door-at-once.test.jsx`
**Sent in by:** Darrell, 2026-11-18, a tablet frame of one door's empty Messages tab: *"We need to be able to see all active work orders in the Poe Properties App... we should not need to look individually to find open work orders... or messages... the latest ones and sorting by KPI's or something instead of each asset individually... I need to see all at the same time in a list... maybe a list of each property with the latest everything... like messages... work orders... etc... another view... make sense?"*
**Pairs with:** DR-1213 (work-order triage in the PoeTech shell), DR-0837 (the work is an option of the door), DR-0904 (a door's thread follows `rental_ref`), DR-1199 (the owner's preview is one door through that face's wall), DR-0076 (an unread part is never a zero)

## Context (SHOULD / ARE)

- **SHOULD:** the landlord sees, in one list, every door with its open work, its latest message and what waits on him, sorted by what needs him.
- **ARE (before):** in the Poe Properties App every one of Work board, Dispatch, Messages and Rent reads ONE door (`DOOR_SCOPED`, `loadDoorRecord`). The only cross-door work queue, `WorkOrderTriage` (DR-1213), is mounted in the PoeTech shell (Projects, LifeHub, Big Picture), not in the Poe Properties App, and it holds work orders only, not messages or payments. To find an open job or an unanswered message he had to open each door in turn.

## Decision

1. **An `Overview` tab, first in the landlord/manager row** (the landing tab stays Doors). One bounded read (`loadPortfolioPulse`) of every work order, the newest 1,000 messages and the newest 1,000 payments the reader can see; RLS decides the rows, the client never scopes by door.
2. **Three views over that read.** *By door*: one row per door with open work (urgent/high named), the oldest open job's age, the latest message and whether the last word was the tenant's / household's / worker's ("waiting on your reply"), payments reported and not yet confirmed, the last payment, the last activity. *Open work*: every open work order across every door, most pressing first. *Latest*: the newest messages and work-order moves, every door mixed.
3. **KPIs and sorts.** Totals across the top (doors, open work, urgent, waiting on you, payments to confirm), each the sum of the rows beneath. Sort by *Needs me first* (urgent work > a reply owed > a payment to confirm > open work, age breaking ties up to 30 days, stated in `portfolio.js`), *Latest activity*, *Most open work*, *Oldest open work*, *Waiting on a reply*, *Name*; and "only doors with something open".
4. **Acting stays where it works.** A tap opens that door on the tab that holds the thing: work on the Work board, a message on Messages, a payment on Rent.
5. **Nothing disappears.** A record whose door cannot be matched lands on a "Not tied to a door" row, so the totals always equal the rows. In the owner's preview of another face the doors are already cut (DR-1199), so there an unmatched record is left out rather than shown.
6. **Honest states.** Reading says so; a failed read says it is not a zero; a part that could not be read is named; the read is bounded (`boundedRead`, 12 s) so a stalled road cannot freeze the tab.

## Verification

- `every-door-at-once.test.jsx` (11): tenancy→door by slug or id; per-door open work, latest message, reply owed, payments to confirm; the untied row keeps the totals equal to the rows (proven to catch: the orphan job is counted); strict preview drops it; every sort key; the open-work list and mixed feed order; the rendered tab opens the right door on the right tab; a failed read shows no KPIs; an unread part is named; a read that never answers ends bounded.
- `every-poe-properties-page-is-reportable.test.jsx`: the surface count tripwire moves 27 → 28 knowingly; the Feedback form gains `properties-overview` automatically.
- Legibility guard: the first amber (`#8A5A00`) failed on night/midnight at 2.95:1 and was replaced by the themed `#8A6510`; PASS. Lint clean.
- Not yet observed on the live build with Darrell's own doors (the sandbox has no route to poetech.us). `re-review: 2026-11-25` — the Overview on the deployed Poe Properties App, signed in, shows his doors with real counts, or a why.
