# DR-1597: A 1099 worker sees every job sent to them, and the bell rings

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (app surface and the bell; reads through 0337's caller-only RPC)
**Type:** fix
**Area:** Poe Properties (`MyWorkOrders.jsx`), `lib/assigned-work.js`, the arrivals bell
**Pairs with:** DR-1594 (the access fix this builds on), DR-0728 (the bell), DR-1506 (the last kind added to it), DR-0076

## Context

Darrell, 2026-11-19: *"We add Coreyon as a 1099 worker and he is not getting the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!?"*

DR-1594 lets a worker READ a job sent to him. Two gaps stayed between that and him getting it:

1. **The worker's job list was per door.** The Work tab's `mine` is `myJobs(openWork, …)`, and `openWork` comes from `loadDoorRecord` of the ONE selected door (PropertiesApp.jsx, `record`). A worker opening the app saw nothing unless he picked the right door, and a door he held no grant for could not be picked at all.
2. **Nothing told him a job was sent.** The dispatch opens the landlord's own messaging app; if he does not press send, the worker hears nothing.

## Decision

1. **My work orders**, first where a worker lands (My doors, My jobs) and on any tab he cannot open: one read of `my_assigned_work_orders()` (0337, his jobs only, with the door's label and street), open jobs urgent first. Each row shows what, where (the street opens in maps), the detail, and any proof needed for payment. He can mark it Fixed or Not fixed, add a note, and add a picture, written as his own documentation (0337's assigned-worker insert). "Open the door" appears only for a door he can open. A person sent a job with no grant is still shown the field worker's face.
2. **The bell:** a new arrival kind `job-new`, one per open job sent to the signed-in person, read by the app-wide watcher each heartbeat. It is named on the bell ("Work order") and rings the phone's own notification like every other kind. A tap lands on `/properties/app/?p=jobs&door=…`, and the card marks the kind seen when it opens. No SMS is sent.
3. The card loads no part of the bell's model (two strings, pinned equal to `arrivals.js` by test), so the properties chunk does not grow by the lesson graph.

## Verification

`a-worker-sees-every-job-sent-to-them.test.jsx` (18). With the watcher's job read removed, the watcher test fails. The cross-door card, the refusal text and the landing are each pinned. 139 related files, 2166 tests pass. PropertiesApp's ceiling is raised 2684 → 2693 for the wiring, with the reason in `file-budgets.json`.

## Not done

The landlord's "why isn't he getting them" view is the next PR on this directive. A video can still be added only from the door's own Work tab. `re-review: 2026-12-03`.
