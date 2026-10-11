---
id: DR-0961
title: Move these to the listing — the button names the move, the checkmarks are on every picture, and the bar counts real writes
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND]
source: 2026-10-11 — Darrell, two messages, with a screenshot of the Poe Properties gallery
---

## Context

Darrell, 2026-10-11, looking at a door whose gallery header read
**MOVE IN CONDITION (18 of 40)** beside tabs for LISTING (10) and MOVE OUT
CONDITION (12) — with the bulk-move capability already shipped (DR-0951) and
already on that exact screen:

> "Still can move multiple pictures to listing!!!!!!!!"

> "Maybe it should say move to listing... checkmarks!!!!!!! For each photo on
> any section... make sense... the it has a progress bar to move..."

The feature was not missing. It was unfindable, and once found it gave no sign
it was working. Both of those were my decisions, made in DR-0949 and never
revisited.

## What was measured

Read on the real component, `app/src/modules/properties/DoorTabs.jsx` at the
commit in his hands (`e6d75403`):

| Line | What was there |
|---|---|
| `1873` | The control read **`'Choose several'`** — the mechanism, not the outcome. Nothing on the screen contained the word "listing" as an action. |
| `2006` | `{choosing && (` wrapped the per-picture checkbox, so **no checkmark existed on any picture** until that toggle was tapped. |
| `1871` | Tapping the toggle also cleared the set, so the arming step was a hard gate, not a hint. |
| `1929`–`1948` | The apply handler ran a serial `for` loop of one `onPatch` per picture with **no state published between writes** — the button text did not change, nothing rendered, and the only feedback was a sentence after the last write returned. For his 18-picture set that is 18 sequential round-trips behind a silent button. |

The comment I had written at `1347` is the finding in my own hand: *"a grid that
is always in selection mode makes tapping a picture to LOOK at it ambiguous."*
That ambiguity never arrived — the checkbox is its own small target in a tile
corner and the picture underneath still opens on tap. The cost I did not count
is the one that landed: a capability nobody can find.

The progress half is worse, because the answer already existed **in the same
file, six hundred lines above**: DR-0907 taught the upload panel to say "Saving
3 of 14…" on exactly this reasoning — *"a button that only greys out is how a
person decides it has hung and leaves."* The lesson was never carried down to
the move loop, which has the identical shape.

## Impact

A record-to-advertising move that cannot be found is a landlord re-uploading
photographs he already has — the specific waste he named in DR-0951 (*"I don't
want to have to re-upload when we already have them"*), still unsolved in
practice while the code said it was solved. And a silent 18-write loop is the
DR-0907 abandonment risk: a person who concludes it has hung and navigates away
mid-loop leaves a half-moved set, with some pictures public and some not.

Reversible: all three changes are presentational plus one extracted function.
Nothing about the database, the policies or the stored bytes changes — this is
the same `kind` patch DR-0951 already ships through.

## Decision

1. **The arming step is removed.** Checkmarks render on every picture, in every
   kind tab, whenever `canManage` and the door holds more than one picture. The
   reasoning recorded at `1347` is reversed, in the file, with his words and
   mine both quoted so the reversal is legible rather than silent.
2. **A first-class `Move N to listing` button**, named for the outcome, one tap,
   no field picker. The room and kind pickers from DR-0949/DR-0951 are kept
   exactly as they were — this is an added fast path, not a replacement.
3. **A real progress bar**, `role="progressbar"` with `aria-valuenow` driven by
   the loop's own saved-counter, published after each write. Both buttons read
   `Moving 3 of 18…` while it runs. One extracted `applyToChosen` helper serves
   both paths, so there is no second source of truth to drift.
4. **The red advertising sentence rides the new button** — it is one tap from
   public, so the warning is on screen the whole time the button is. The
   field-picker's own warning now excludes `listing` so the two never stack.
5. **The move reads the ticked set against what is SHOWN**, not against every
   photo, so a tick left behind in another tab cannot drag a picture he is not
   looking at into public view.

What was NOT decided: nothing about who may move a picture (unchanged), and
nothing about DR-0906's record-versus-advertising line, which stands. A
move-out photograph becoming a listing shot is still a deliberate act with a
red sentence over it; it is only easier to *find*.

## Verification

- `app/src/__tests__/move-these-to-the-listing.test.jsx` — 7 tests, mounted and
  clicked, no source reads.
- **Proven-to-catch, four mutations run against the real component** (DR-0076
  §3) — each reverting one decision above, each caught:

  | Mutation | Result |
  |---|---|
  | Checkmarks put back behind a mode | **6 of 7 fail** |
  | Button renamed back to "Choose several" | **1 fails** |
  | Progress published only at the end, not per write | **1 fails** |
  | Move reads `allShots` instead of `shown` | **1 fails** |

  Restored: 7 pass. The progress test holds each write open on a gate and reads
  `aria-valuenow` between them, so a bar that merely appears and fills instantly
  does not pass it.
- Two existing tests changed, both deliberately, both annotated in place:
  `a-room-for-many-pictures-at-once.test.jsx` asserted *"the grid is NOT in
  selection mode until asked"* — it now asserts the opposite, with the reversal
  and his words written into the test body;
  `a-record-can-become-an-advertisement.test.jsx` moves its listing-warning
  assertion to the new testid and additionally pins that the two red sentences
  never stack.
- Live proof after merge: the deploy run whose `head_sha` matches `main`
  (DR-0107 / P62 — by exact identity, never list position), then the move walked
  on the real door in his screenshot. `re-review: 2026-10-13`.

## Links

[DR-0949] (set the room for several at once — the record this reverses one
decision of), [DR-0951] (a record can become an advertisement), [DR-0906]
(records versus advertising — the red sentence), [DR-0907] (a picture is not
gone until it is saved — the progress lesson this carries down), [DR-0075]
(perpetual improvement), [DR-0076] (verification doctrine, §3 proven-to-catch).
