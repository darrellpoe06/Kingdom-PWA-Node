# DR-1059: A picture is opened, and removing one takes two taps — the Church Spaces console, and the fourth dialog on one surface

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (church-facing; a destructive control that could not be trusted either way)
**Type:** word
**Area:**
- `app/src/lib/space-photos.js` (new — cover, order, removal, and a confirm sentence that is true for *this* store)
- `app/src/components/SpacePhotoConsole.jsx` (new — the console)
- `app/src/components/ChurchObservation.jsx` (four browser dialogs removed; the strip becomes the console)
- `app/src/__tests__/space-photo-console.test.jsx` (new)

**Grounds:** Darrell, 2026-10-15, on Observation → Church Spaces: **"Fix it... the images need to be able to be like Poe Properties Apps pictures console... make sense? We need a better flow... pictures can be deleted easily not doing what we expected... make sense?"**
**Principles:** DR-0076 §3 (proven-to-catch), §5 (characterize before you change); DR-0330 (a control that does nothing is a lie); DR-0061 (the surface says the truth it measured)

## Context

He sent the Church Spaces board — 13 spaces, 20 photos — and asked for the Poe
Properties pictures console, a better flow, and said pictures "can be deleted
easily not doing what we expected."

## What was measured

**Fault 1 — the delete was a browser dialog, on a PWA.** Every thumbnail carried
a bare 16px `×` whose handler was:

```js
if (!window.confirm('Remove this photo?')) return;
```

This repository already learned what that costs. `no-prompt-guard` exists
because Darrell reported the Books → Debts button *"not working when you push
it"* — a `window.prompt()` that silently no-ops in the installed standalone app.
A suppressed `confirm` returns falsy, the handler returns, and the delete
**neither deletes nor says why**.

**His sentence reads two ways, and both land on the same cure, so no guess was
needed.** If the dialog never appears, the delete does nothing — "not doing what
we expected." If it does appear, a fingernail-sized `×` on the corner of a 48px
thumbnail is a destructive control one stray tap away — "deleted easily." The
fix for either is: no browser dialog, and no one-tap destroy.

**Fault 2 — there was no console, only a strip.** Tapping a thumbnail did
nothing at all. The single gesture a person naturally makes on a picture was
inert, and the control beside it was destructive. There was also no ordering and
no cover: the tile's cover was whichever file happened to be picked first and
**could never be changed**. Poe Properties has had both since 0161 ("the
landlord orders a door's pictures").

**Fault 3, and this one the test found, not me.** `ChurchObservation.jsx`
carried **four** `window.confirm` gates, not two: the photo delete, the space
delete, and — in a part of the file I had not read — **the camera removal**. My
first assertions checked the two lines I had edited. The whole-file check caught
the fourth. (Second time today: the same mistake broke the build in DR-1057
an hour earlier, when a file I had not read still imported a function I had
deleted. The lesson took twice.)

## Impact

**What it buys.** A thumbnail opens the picture large. Every action lives in
that open view with room to read it: make this the cover, move it earlier or
later, remove it. Removal takes two deliberate taps and needs no browser dialog,
so it works in the installed app and cannot fire by accident. The same two-step
now guards deleting a space and removing a camera.

**What it costs.** One more tap to remove a photo — which is the point.

**What it does not do.** It does not add a trash or an undo, because this store
has no second copy to restore from (below).

## Decision

1. **No browser dialog on a destructive path in this surface.** Removal is an
   inline two-step: `Remove` → `Remove for good` / `Keep it`.
2. **A thumbnail opens.** Actions live in the open view, not on a 48px tile.
3. **There is a cover and an order**, mirroring Poe Properties — `setCover`
   moves a photo to the front, and `movePhoto` shifts it one place.
4. **The ends do not wrap.** `movePhoto` returns the space unchanged at either
   end and the control is disabled, because a picture that jumps from last to
   first on one tap is a surprise.
5. **The confirm copy is written for THIS store, not copied.**
   `property-photo-edit.js` can honestly say a photo *"can be brought back"* —
   it moves to a Trash folder on the NAS. These are data URLs on one device, as
   the surface's own banner says; nothing is uploaded, so there is no trash and
   no second copy. The sentence says *"these pictures are held on this device
   only — nothing was uploaded, so there is no copy to restore."* Copying the
   friendlier sentence would have been the exact class of comfortable lie this
   app keeps removing.

## Verification

- **18 cases.** The ones that matter assert the destruction *does not happen*:
  the first `Remove` tap calls the handler **zero** times, `Keep it` calls it
  zero times, and only the second tap calls it — with the right space and photo
  id.
- **Proven to catch (DR-0076 §3):** the two exact shipped lines
  (`window.confirm('Remove this photo?')`,
  `window.confirm('Delete this space from the board?')`) are asserted absent,
  the bare `aria-label="Remove photo"` × is asserted gone, and the whole file —
  **comments stripped, since a comment legitimately names the dialog** — must
  contain no `window.confirm` at all. That last assertion is the one that found
  the camera gate.
- **The legacy single-photo record is pinned**: an old `photo` string still
  displays, and the field must be **dropped** on the first write, or it keeps
  winning in `photosOf` and a steward's new uploads would never show.
- **The wrap-around refusal is pinned in both directions**, and
  `removeConfirmText` is asserted **not** to contain "brought back", "restored"
  or "Trash" — so the untrue-but-kinder sentence cannot be pasted in later.
- Lint clean; **439 cases run across 21 suites, 438 green**, the one failure
  being the committed legibility artifact needing regeneration for the new
  page — regenerated (328/341), green. 21 gates.

## What this does not do

- **The other 76 dialogs stand.** `window.confirm` gates **77** destructive
  actions across `app/src`, in 12+ components. Every one of them is the same
  risk in the installed app. This record fixes the four on the surface he
  photographed; the sweep is its own change, and it wants the two-step extracted
  into one shared control rather than hand-written thirteen more times.
  **`re-review: 2026-10-22`.**
- **The photos are still device-local.** The surface says so, and the confirm
  sentence now says so too. Sovereign NAS storage for these bytes remains the
  Tier-C follow-up the component's own header names; until it lands, a removal
  here is final and the steward is told that before the second tap, not after.
