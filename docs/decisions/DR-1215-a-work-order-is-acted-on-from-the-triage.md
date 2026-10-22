# DR-1215: A work order is acted on from the triage, end to end, and a thought filed as one is moved to where it belongs

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (writes through the stores' own existing writers and rules; no schema change)
**Type:** surface + process (APP-IS-PRIMARY, HOLD-THE-HAND-OF-THE-PROCESS)
**Area:**
- `app/src/lib/work-order-triage.js`: `actionsFor`, `MOVE_TARGETS`, `fullText`, a Poe Properties work order's `tenancy_notes`
- `app/src/components/WorkOrderTriage.jsx`: the open view, the actions, the card-level result
- `app/src/modules/properties/cloud.js`: `loadAllWorkOrders` reads `tenancy_notes`
- `app/src/components/BigPictureDashboard.jsx`, `app/src/components/LifeHub.jsx`: the writers handed to the triage
- `app/src/poe-financial-mvp-v28.jsx`: four props added to the existing Home mount line; line count unchanged

**Grounds:** Darrell, 2026-10-22, on the triage DR-1213 shipped view-only:
- *"Fix it!!! Never wait!!!"*
- *"So I click it then what?!... Fix it end to end!!!"*, with a screenshot of #4 printing a whole recorded conversation as its title
- *"Comprehensive review of the process!!! Did you???"*
- on #4: *"That long text was for a feature and or requirements for the Ohio church... we should be able to move that to the place that makes sense for those notes!!!!"*

**Principles:** HOLD-THE-HAND, SPEC-CONFORMANCE-REVIEW, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE

## Context

DR-1213 showed every work order in the order it came in, with its notes, and it dated "acting from the triage" for 2026-11-05. That date was a wait with no blocker: every writer already existed.
- **Real Estate incidents:** the shell's `updateIncident` and `workerOps`.
- **Poe Properties:** `setWorkOrderStatus`, `assignWorkOrder` and `postNote`, along `MAINTENANCE_TRANSITIONS`.
- **Moving a thought:** the Thinking Space's own destinations, through `sendNoteToPoeTech`, `addChurchVoice`, `addPrayerRequest` and `addNote`.

A tap opened only notes, and the title had no limit, so a recorded conversation buried the queue.

## What was measured: the comprehensive review (COMPREHENSIVE-REVIEW-STANDARD.md, all ten)

1. **SHOULD/ARE.**
   - SHOULD: every work order, in the order it came in, with its notes, triaged. That means acted on, not only seen.
   - ARE, before this change, four gaps:
     - view-only
     - a title with no limit
     - Poe Properties' work-order notes (`tenancy_notes.request_id`) never read
     - a thought filed as a work order, with no road out of the queue
   - Every gap is closed here.
2. **Journeys.**
   - The owner, on a phone, on the Life Hub: tap a work order, read it whole, Start / Resolve / Move it / Give it to / Add note, and see the result. The same on Big Picture → Now → Work orders.
   - Walked in Chromium on the real card. Found and fixed on the walk: a move or a close takes the row out of the open list, so a result message shown on the row vanished with it. The card now says what happened at its top.
3. **Surface says truth.**
   - "Not saved: …" names the store's refusal.
   - A move never closes the work order unless the words were handed on first. Proven to catch.
   - "No open work orders" appears only after a read.
   - "tap to open" tells the user the row opens.
4. **Form factor, measured** in Chromium at 360, 768 and 1280 px:
   - page overflow 0
   - the long title at 2 lines
   - every control 36 px or taller
   - no page errors
5. **Delivery context / channels.** There is no step only Darrell can do. #4 is closed from his own app (open #4 → Move it to → PoeTech: a feature or requirements → Move it), not by a database channel. The incident list lives on his device and is written whole to the cloud (`incidents-sync.js`, wholesale replace), so a change made only in the cloud could be overwritten by his next sync. The tap is the road that sticks, and choosing where his own words go is his.
6. **Findings are work.** Every finding above is DONE in this change. Nothing is dated.
7. **Gate the class.** `a-work-order-is-acted-on-from-the-triage.test.jsx`, 11 tests. Proven to catch:
   - a title wall
   - a request offered a move its machine forbids
   - a move that closes without the words being handed on
   - a result lost with its row

   The upstream class, long text auto-routed to work, is already pinned in `one-voice-routing.test.js` (`SUGGEST_MAX_CHARS`).
8. **The Word.** Not Scripture-bearing content. Skipped, for that reason.
9. **Not hollow.** The authored asset is the work order's own words and notes. When opened, the whole text appears verbatim (asserted, and seen at 1,415 characters).
10. **Continuity.**
    - Reads: `incidents` (live: 4), `tenant_maintenance_requests` (live: 0), `request_documentation`, `door_events`, `tenancy_notes`.
    - Writes:
      - an incident's lifecycle log, through `incidentsSync.updateRow`
      - a Poe Properties status, through `door_events` (0262 trigger)
      - an assignment
      - a note
    - A move seeds:
      - `appDirectives`, then `agent_inbox` and the steward's Feedback queue (DR-0622)
      - the pastors' church voice
      - the prayer list
      - the Thinking Space

## Impact

- **Unresolved:** the triage shows work and cannot move it. Each work order is still acted on screens away. A thought filed as a work order sits open forever with no way out, and its text buries the queue.
- **The call obligates:**
  - every action goes through the store the work order lives in, by that store's own rules
  - nothing closes unless what it carries has been handed on
  - every result is said where the person will still see it

## Decision

- **A tap opens the work order:** the whole text, the notes in order, then what can be done next by its store's own rules (`actionsFor`).
- **An incident can be:**
  - started or resolved
  - given to a 1099 worker
  - noted
  - when it is not a work order, moved to a Thinking Space destination and closed as `converted`, its words kept.
- **A Poe Properties work order:**
  - moves only along `MAINTENANCE_TRANSITIONS`
  - takes a worker's name and a note, under RLS
  - is re-read after each write
- **The title is two lines in the queue;** the full text appears when it is opened.

## Verification

- **New suite** `a-work-order-is-acted-on-from-the-triage.test.jsx`: 11/11.
- **The 125 related suites** (the triage, the Life Hub, Big Picture, One Voice, `properties/cloud`, the monolith budget): 1,814/1,814.
- **Lint** clean.
- **Chromium measurement** at three widths, as in dimension 4.
- **Closes DR-1213's dated item** (`re-review: 2026-11-05`) the same day it was set.
