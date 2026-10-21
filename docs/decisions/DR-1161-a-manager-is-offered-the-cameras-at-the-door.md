# DR-1161: A manager is offered the cameras at the door's address and no others — the family's own are the owner's to give

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a tenant- and manager-facing surface over the family's cameras; the NAS still enforces every grant; nothing new reaches the LAN)
**Type:** feature (access scoping)

**Area:** `app/src/modules/properties/door-cameras.js` (`splitCamerasByDoor`, `offeredCameras`), `app/src/modules/properties/DoorCameras.jsx` (`DoorCamerasTab` takes `role`; every list reads the offered set; the owner's fold "Not at this address"; the manager's counts), `app/src/modules/properties/PropertiesApp.jsx` (passes `role`), `app/src/__tests__/properties-door-cameras.test.jsx` (four cases).

**Principles:** DR-0778 (access is given and taken back by the owner), DR-0841 (a door shares its cameras; "an apartment's own camera is not shared to another door"), DR-0938 (asked for and given to whoever the family chooses), DR-0060 (tenancy guard: judgment encoded as a gate), DR-0076 (proven to catch), DR-0061 (reality-trace).
**Declared by:** Darrell, 2026-10-21, from the "Seen as a manager" view of 805 North Prospect Avenue Apt 1, Cameras: *"my personal home cameras should be an option only I can give... not a property manager... camera location should be a significant issue for kpi... so they shouldn't be able to see my home cameras unless I give them that... so far only 805... until we get cameras at other addresses... make sense?"*

---

## Context

A door shares its cameras with its household (DR-0841) from the NAS's whole list, read with the family key on the device. The same tab is drawn for the manager face, and nothing between the list and the face asked where each camera is.

## What was measured

- The tab read the NAS's whole list with the family key on the device (33 cameras; `camera-health` run 39553333996 lists 33 streams) and offered every one of them to the manager face: the picker, "Not shared, so the tenant does not see these (21)" with every name, and the access desk's "cameras people can ask for". The family's home cameras (`front_cam`, `basketball_cam`, the kitchen) were among the 21, named on a manager's screen.
- A camera's place lives nowhere but its name (the NAS list carries `id`, `name`, `kind`, `road`). The 805 cameras all carry the house number; the home's carry none; DR-0841 already used the number to suggest a door's cameras.
- A real manager on his own device holds no family key and is told so; the exposure is the owner previewing as a manager, and any family member seated as a manager on a family device. The rule is the same either way: what a face is offered is decided by the face, not by the device.

## Decision

1. **Three places from one list.** `splitCamerasByDoor` sorts the NAS list for a door: **here** (carrying the door's address), **elsewhere** (another house number), **unplaced** (no address in the name: the family's own, or a camera not yet named). The location is a finding in its own right: the owner's count says how many are at this address, at another, and unplaced.
2. **A manager is offered the door's own only.** `offeredCameras('manager')` is the here-group. On the manager face no other camera is listed, named or counted as "not shared"; the access desk's menu is the same set; a camera beyond the address that the owner shared is **counted** ("1 more camera beyond this address is shared with this door by the owner; not shown here") and kept through the manager's Share, never named.
3. **The owner is offered everything, set apart.** The door's own first, ticked by the address; the rest in a fold "Not at this address (N): a at another address, b with no address in the name" with the warning that ticking one shares another address, or the home, with this household. The owner alone can give them.
4. **The note on the row stays the owner's.** A manager's "Shared now" reads a count from the NAS's grant, not the owner's note, so the note cannot leak a name.

## Impact

Unresolved, a property manager (or the owner previewing as one) is shown, by name, every camera the family owns, the home's among them, and can tick them into a door's grant; the location of a camera is nowhere a decision can read it. With the split, a manager's screen holds only the door's own cameras, the owner's fold names the rest with the warning, and the counts make the location a measured thing.

## What is deferred, and why

The place of a camera should be a field, not a word in its name, the day cameras exist at a second address ("so far only 805"). A NAS-side registry entry per camera (address, room) and the forwarder listing it would let the split read a fact instead of a prefix. `re-review: 2026-11-11`, or the first camera installed at another address, whichever comes first.

## Verification

- `properties-door-cameras.test.jsx`: the split and the offer (pure); **proven to catch**: the manager's tab lists the two 805 cameras and the text never contains the home's or 1003's names; the owner's fold counts 3 (1 elsewhere, 2 unplaced) with the warning; a grant holding the kitchen reads as "1 beyond it set by the owner" on the manager face, the kitchen is never named, its tile is not asked for, and the manager's Share re-mints with the kitchen kept.
- The nine earlier cases in the suite unchanged and green (the owner face is the default `role`).
