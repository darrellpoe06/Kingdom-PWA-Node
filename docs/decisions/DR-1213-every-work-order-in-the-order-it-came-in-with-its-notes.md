# DR-1213: Work order triage — every work order in the system, in the order it came in, with its notes

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (a read-only surface over records the reader can already see; no schema change, no write)
**Type:** surface (APP-IS-PRIMARY)
**Area:**
- `app/src/lib/work-order-triage.js` (new): the one queue
- `app/src/components/WorkOrderTriage.jsx` (new): the triage card
- `app/src/modules/properties/cloud.js`: `loadAllWorkOrders`
- `app/src/components/LifeHub.jsx` (under Recent Activity), `app/src/components/BigPictureDashboard.jsx` (Now → Work orders)

**Grounds:** Darrell, 2026-10-22, on the Life Hub with Recent Activity showing two work orders from 120 days ago: *"Where are the work orders in order that they came in with notes across the whole system?!!! Fix it...."* and *"Work order triage"*.
**Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076: measured first; proven to catch), APP-IS-PRIMARY (DR-0065)

## Context

Recent Activity (`lib/home-activity.js`) is a mix of the six newest things of every kind: notes, photos, goals, incidents. It was never a work-order list, so a work order showed there only while nothing newer had happened. Work orders live in two stores, and no surface showed them together:

- **`incidents`** is the Real Estate Action Queue. Each row carries a lifecycle log of time-stamped notes and a dispatch crew (`incidents-sync.js`).
- **`tenant_maintenance_requests`** holds Poe Properties' work orders, filed by a tenant, household member, manager or the owner. A row carries:
  - `detail`, `resolution_note` and `proof_note`
  - the worker's job notes (`request_documentation`)
  - every change, to the second (`door_events`, subject `work`)

## What was measured

Measured on the live database with `work-orders-probe` (temporary, removed in this change). It printed counts and dates only.

- **`incidents`:** 4 rows, all category maintenance, filed 2026-06-20 to 2026-08-03. 3 are open and 1 resolved; every one has lifecycle notes and 2 have a dispatch crew.
- **`tenant_maintenance_requests`:** 0 rows. No work order has been filed in Poe Properties yet.
- **`door_events` (work), `tenancy_notes`, the old `maintenance_requests`:** 0 rows each.

So the whole system holds four work orders, and Recent Activity was showing three of them. One of the three, *"or do in person Q&A…"*, came in from the Thinking Space and was filed as a maintenance incident. The triage shows it with its source rather than hiding it.

## Impact

- **Unresolved,** a work order is visible only while it is among the six newest things of any kind. Poe Properties' work orders reach no front screen, and nobody can see the order owed or the notes without opening each source.
- **The call obligates** one queue across both stores, numbered by arrival across the whole system. Open work comes first, oldest first, because the order they came in is the order they are owed. Closed work follows, and each work order carries every note it has, in time order. A store that cannot be read is said so, never shown as empty.

## Decision

`triageQueue` turns both stores into one queue:

- **Numbering:** each work order's number is its place in arrival order across both stores (#1 is the first ever filed).
- **Order:** the open ones are listed first, oldest first, then the closed.
- **Notes from an incident:** its lifecycle log, which records how it came in, each phase move, and every "dispatched to…" and assignment note.
- **Notes from a Poe Properties work order:** its detail, every `door_events` change, the worker's job notes, the proof note and the resolution note.

**Reading Poe Properties.** `loadAllWorkOrders` reads the work orders under the reader's own RLS; the client never scopes by tenancy.

**Where it lives.** The triage card sits on the Life Hub, under Recent Activity, and on Big Picture → Now → Work orders.

**Honest states.** The card shows one of four states:
- *Reading Poe Properties' work orders…* while the read runs.
- A read that fails names itself and says it is *not* saying Poe Properties has none.
- A missing part (job notes or change history) is named.
- *No open work orders* appears only after a successful read.

## Verification

- **`every-work-order-in-the-order-it-came-in.test.jsx`: 11/11.** It proves:
  - arrival numbering across both stores
  - the open-first order
  - every note in time order, from each store
  - every incident counts as a work order
  - the closed statuses
  - the card's three states
  - where the card is mounted
  - the read is never scoped by the client
- **Proven to catch:**
  - the newest-first order Recent Activity uses is not arrival order
  - a failed Poe Properties read is never shown as "none there"
- **Existing suites:** the 52 that render the Life Hub and Big Picture or read `properties/cloud.js` pass, 637/637.
- **Live:** read on the deployed build, on the Life Hub, before this is called done.

`re-review: 2026-11-05`. The decision then is whether the triage takes actions (assign, move status, close) here, or keeps opening each work order where it already lives.
