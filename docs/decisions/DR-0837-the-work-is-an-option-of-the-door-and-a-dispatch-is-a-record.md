# DR-0837 — The work is an option of the door, and a dispatch is a record

- **Status:** accepted
- **Tier:** A (the Poe Properties module's own tabs and the rows it already writes; no table, no policy, no new grant)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `app/src/modules/properties/dispatch-roster.js` (new, pure: `workerRoster`, `someoneElse`, `dispatchText`, `nextStatusOnDispatch`, `dispatchRecord`, `myJobs`, `dispatchable`), `app/src/modules/properties/model.js` (the manager's Doors tab first, the board and the dispatch after it), `app/src/modules/properties/PropertiesApp.jsx` (`DOOR_SCOPED` carries the work tabs; `DoorContext` counts open work; the invites and the session are read at boot; `dispatchJob`; `WorkTab` with `mine` and a roster-fed `AssignRow`; `DispatchTab` rebuilt), `app/src/__tests__/properties-work-inside-the-door.test.jsx` (8), three mounting tests' cloud mocks gain `loadInvites`.
- **Principles:** DR-0219 (SHOULD, ARE, GAPS, CLOSE), DR-0061 (a surface is a live view of, and a control for, real state), DR-0065 (the app is the primary artifact), DR-0076 (every write below is named by table), DR-0111 (the trace was run and the gaps closed in one pass).
- **Grounds:** Darrell, 2026-10-09, two screenshots of the Poe Properties door (Work Board: Report something, Open (0); Dispatch: Worker's phone): *"How does this work... this seems to be not evaluated end to end... does the workflow work with sending data driven review this field needs etc... has to connect to etc..."* and *"How can you not have some entities to be inside before getting to these tabs... they should be options inside the apartment... make sense... doesn't make sense separate... does it..."*

## Context

**SHOULD** (`app/src/lib/dispatch.js` header): a maintenance need becomes a work order, a worker is assigned from the roster, the job rides out in one tap as a text or call, done comes back as a resolve, every hop timestamped. **ARE**, traced: the Work board, Dispatch, My jobs and Document tabs read ONE door's requests (`loadDoorRecord(activeDoor.id)`) yet were not in `DOOR_SCOPED`, so no header said which door, and the manager's face put the board and the dispatch BEFORE the doors. The Dispatch tab was a phone box over every open request; *Text it* opened the messaging app and wrote nothing: no assignment, no status, no note. Assign was free text. A worker's *My jobs* was every open request on the door, assigned or not. The roster already existed in `property_access_invites` (field_worker rows with a phone or a phone-door email, a display name, `claimed_by` once signed in) and nothing read it.

## What was measured

- `PropertiesApp.jsx` before: `DOOR_SCOPED` at lines 64-67 without `work`, `board`, `jobs`, `document`, `dispatch`; `DispatchTab` at 1210-1222 with `useState('')` for a phone and `smsHref` only; `AssignRow` at 1159-1174 an input; `WorkTab` rendering `open` for every role.
- `model.js` `MANAGER_TABS`: `board`, `dispatch`, then `doors`.
- The screenshot: *Open (0)* with no door named above it; *Dispatch a job* with nothing to pick a job or a worker from.
- 105 properties cases green before the change, 113 after (8 new).

## Impact

- Unresolved: a dispatch that leaves no record is a text message, not a workflow; the family cannot see who was sent, when, or whether the job moved; a worker cannot see which jobs are theirs; a landlord with many doors files and dispatches against a door the screen never names.
- The call obligates: the door first, the work inside it; every dispatch writes three rows the record already has columns for; the worker's jobs are theirs by user id or invited name.

## Decision

1. **The door first.** The manager's Doors tab leads; Work board and Dispatch follow and are door-scoped: they carry the *You are in* header, the *Change property* way back, and an *N open work orders* count chip that opens the board.
2. **The roster is the invited 1099 workers** (`workerRoster`): not revoked, this instance, named by their invite, reached by their phone, assigned by their user id once they have signed in. *Someone else, by phone* remains for a one-off.
3. **Text it writes the record** (`dispatchJob`): `tenant_maintenance_requests.assigned_to` and `assigned_to_label`, the status to `scheduled` (a filed or received job; one already moving keeps its state; a closed one cannot be sent), and a `tenancy_notes` row *Dispatched to NAME (PHONE) by text: TITLE* on the door's history. The text itself carries the door's real address, city, state and zip, the area, the priority in words, and the detail.
4. **My jobs is theirs** (`myJobs`): assigned by user id, or by the name they were invited under for a job assigned before they first signed in; the count of other open jobs on the door is said.
5. **Assign on the board picks from the same roster**, with a typed name still allowed.

## Verification

- `properties-work-inside-the-door.test.jsx`: the roster (phone or phone-door email, named, deduplicated, sorted; revoked, other roles and other instances left out); the text with the real address, area, priority and detail, and the unit; the record (submitted and received become scheduled, in-progress stays, resolved is null; the assignment by user id or by number; the note); the worker's jobs by id or invited name; the landlord mounted with a door, an invite and two requests: Doors before Work board before Dispatch, the header and *1 open work order* on both, *Jobs to send (1)* without the resolved one, the worker option *Mike · (555) 010-0142*, the `sms:` link with the address in its body, and after the tap exactly one assignment (`u-mike`, Mike), one status (`scheduled`) and one note with the sentence; with nobody invited the dispatch says so and a typed number still works; the worker mounted with a session sees *My jobs (1)* and *1 other open work order on this door is not assigned to you*.
- The journeys, door-tabs, owner-sees-doors, never-hangs and door suites: 105 green with the change; eslint clean at zero warnings.
- `re-review: 2026-10-23`: the first real dispatch on a Poe door read back from `tenancy_notes`, and whether a worker's *Document it* should close the loop by moving the job to resolved on *Fixed* without the landlord's hand (today it does).
