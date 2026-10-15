# DR-1058: A surface must not wait on a WebSocket to show its own work — the Campus Rentals checkbox that did nothing

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (church-facing; a staff control that did not work)
**Type:** word
**Area:**
- `app/src/lib/venue-rental.js` (`updateBooking` / `deleteBooking` ask for their rows back; `nextResponsibilities`)
- `app/src/components/EventManagement.jsx` (apply the write's own answer; optimistic tick; the refusal is said)
- `app/src/__tests__/the-checkbox-shows-its-own-work.test.js` (new)

**Grounds:** Darrell, 2026-10-15, on Campus Rentals → Requests to review, screenshot showing the focus ring on a still-unchecked "Setup & décor": **"Doesn't work!!!! Fix it please... thanks in advance...."**
**Principles:** DR-0076 §3 (proven-to-catch), §5 (characterize before you change), §6 (reality-trace); DR-0330 (a control that does nothing is a lie); DR-1053 (unknown is never a no — this is its write-side twin)

## Context

He tapped a responsibility checkbox. The focus ring landed on it. The tick
never appeared, the card still read "1/8 ready", and nothing on screen said
why.

## What was measured

**Four likely causes were ruled OUT before the real one was written down.** Each
by reading the thing itself, not by reasoning about it:

| candidate | what the source says | verdict |
|---|---|---|
| RLS refused the update | `venue_bookings_admin_read` and `venue_bookings_admin_update` carry the **identical** predicate, `user_role_in_instance(instance_id) IN ('owner','admin')` (0034). He can SEE the three requests, so the read policy passed — so the update policy passes too. | not it |
| a missing grant | `GRANT SELECT, INSERT, UPDATE, DELETE ON venue_bookings TO authenticated` (0034) | not it |
| the column is absent | `responsibilities jsonb NOT NULL DEFAULT '{}'::jsonb` (0034:55) | not it |
| the guard trigger wipes it | `venue_booking_force_public` does set `responsibilities := '{}'` — but it is **`BEFORE INSERT` only**, so it cannot touch an update | not it |

**What it actually is.** `setBookings` was called from exactly **one** place:

```js
useEffect(() => {
  const unsub = subscribeBookings((rows) => { setBookings(rows); setLoaded(true); });
}, []);

const onToggle = async (booking, key) => { await toggleResponsibility(booking, key); };
```

Every staff control — the checkboxes, the status buttons, the quoted price, the
delete — wrote to the database and then **waited for a realtime
`postgres_changes` event to come back and tell it what it had just done.** The
checkbox is fully controlled by `booking.responsibilities`, so until that event
arrives the tick cannot move. The result of the write was discarded.

So when that WebSocket is not delivering, the write lands, the screen never
moves, the tick springs back, and nothing is said. **The app currently reaches
the NAS cross-origin over the Tailscale Funnel, because every Pages Function is
dark (#2057)** — a long-lived WebSocket over that road is exactly the thing most
likely not to be running.

**And underneath it, the quietest failure in the app.** A PostgREST update whose
row is filtered out by RLS returns **no error and zero rows**. So
`updateBooking` returned `{ ok: true }` whether it had saved or done nothing at
all, and no caller could tell the difference even if one had looked.

**The right pattern was already in this file.** The correspondence thread does
`if (res.ok) { setDraft(''); await load(); }` — it refreshes on its own answer.
The bookings did not. Same file, two write paths, opposite discipline. (That is
the third time today the cure was already present one call site over; see
DR-1057.)

## Impact

**What it buys.** The controls work whether or not realtime is up. The tick
moves on the tap, is replaced by the server's own saved row a moment later, and
goes **back** if the save was refused. A refusal is stated in plain words,
naming the RLS case specifically, because that case is otherwise unknowable.

**What it costs.** One extra returned row per write (`.select()`), and a small
amount of state handling. No new round trip.

**What it does NOT do.** It does not remove realtime — that still runs and still
carries *other people's* changes. It stops being the only way this screen learns
what *this* person did.

## Decision

1. **A write asks what it actually did.** `.update(...).select()` and
   `.delete(...).select()`; zero rows returned is `{ ok: false, error:
   'refused' }`, never a quiet success.
2. **A successful write hands its saved row back**, and the surface applies it
   directly.
3. **The tick is optimistic and reconciled**, computed by the pure
   `nextResponsibilities` — the *same* function the persisted write uses, so an
   optimistic tick can never predict something the write would not do.
4. **A refusal is said**, and the RLS case is named rather than rendered as a
   generic "could not save".

## Verification

- **Proven to catch, by mutation, twice** (DR-0076 §3):
  1. removed `.select()` from the update → **FAIL**, *"the update asks for its
     rows back, so a silent refusal is visible"*;
  2. left the optimistic tick in place after a refusal → **FAIL**, *"the tick
     moves on the tap, and goes BACK if the save is refused."*

  Both reverted; 15/15 green after each.
- **The four ruled-out causes are pinned**, against the migration itself, so
  they stay ruled out: read and update must keep the identical predicate, the
  UPDATE grant must exist, and the wiping trigger must stay `BEFORE INSERT` —
  if it ever became `BEFORE INSERT OR UPDATE` it would blank the checklist on
  every save, a different bug wearing this exact symptom.
- **The optimistic arithmetic is pinned against the readout he photographed:**
  a wedding with `officiant` ticked reads 1 of 8; ticking `setup` must read 2
  of the same 8.
- **Unticking removes the key** rather than storing `false`, asserted — the
  stored shape is `{ key: true }` only.
- Lint clean; **187 cases green** across all 14 venue/event/rental suites.

## What this does not do

- **It does not prove the WebSocket is down.** The sandbox has no route to the
  Funnel, so "realtime is not delivering" is the *best-supported* explanation
  for the symptom, not a measured fact — the ruled-out list is measured, this
  is inference. The fix makes the surface correct **either way**: if realtime
  was fine all along, the controls now simply respond faster and say refusals
  out loud. **`re-review: 2026-10-16`** — once #2057 is cured, confirm whether
  realtime was the trigger, and record it.
- **The same pattern exists elsewhere.** Any surface whose only `setX` is a
  realtime callback has this defect. That sweep is its own change with its own
  proof. **`re-review: 2026-10-22`.**
