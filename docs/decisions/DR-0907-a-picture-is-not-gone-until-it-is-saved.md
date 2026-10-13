# DR-0907 — A picture is not gone until it is saved

- **Status:** accepted
- **Tier:** B (evidence that cannot be re-taken — a unit's condition on the day it was handed back)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/modules/properties/DoorTabs.jsx` (`submit`, the add button), `app/src/modules/properties/PropertiesApp.jsx` (`onAdd` returns its result), `app/src/__tests__/properties-qr-gallery-files.test.jsx` (four cases added)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3), SURFACE-SAYS-THE-TRUTH, HOLD-THE-HAND-OF-THE-PROCESS (DR-0621)
- **Grounds:** DR-0905 (HEIC — these photographs could not be uploaded at all an hour earlier), DR-0906 (records versus advertising, same panel), DR-0876 (a record that could not be read is not an empty record — this is its write-side twin)

## The word, as spoken

Darrell, 2026-10-10, minutes after the HEIC fix let fourteen move-out condition
photographs into the queue at last:

> "Would let me upload however didn't take them"

And on why they are kept:

> "we need them to be for historical reasons like tenants left status of the
> apartment... so we see how horrible it was or nice"

## What was measured

Two theories were wrong before the right one, and both are worth recording
because each was plausible from the code alone.

**Wrong 1:** that the gallery wrote the wrong key. `rental_ref: door?.id` with
`door={{ id: rentalId }}` is the rentals **UUID**, which is exactly what
`property_photos.rental_ref` holds (PropertiesApp.jsx:380-387). Correct.

**Wrong 2:** that `activeRental` would be null once `ensureDoor` set
`activeId` to a tenancy id, leaving `rentalId` null. It resolves by
`activeDoor.rental_ref === rental.slug` first, so it holds in both directions.

**The actual defect is in `submit`, and it has three compounding parts:**

```js
pending.forEach((pic, i) => { onAdd?.({ … }); });   // async, NEVER awaited
setPending([]);                                      // cleared regardless
```

1. **Fourteen inserts fired at once**, each carrying a ~226KB data URL, and
   each handler then calling `loadDoorData()` and `boot()` — twenty-eight more
   reads on top of fourteen large writes.
2. **The queue was emptied before a single result came back.** Anything that
   failed — size, a dropped connection, RLS, a hiccup under fourteen-way
   concurrency — was gone from the screen, with nothing to retry and no copy
   of the file. The thumbnails disappearing is what the app does on success,
   so a failure LOOKED like a save.
3. **`onAdd` could not report failure anyway.** Its body was
   `{ const r = await addPhoto(row); say(…); loadDoorData(); boot(); }` — no
   `return`, so the gallery received `undefined` whatever happened. Failures
   went only to `say()`, a six-second toast called fourteen times, each
   stomping the last.

So a partial failure was indistinguishable from a complete success, and the
pictures it lost were move-out condition shots of a unit already handed back.
**They cannot be re-taken.**

## Impact

This is the write-side twin of DR-0876: there the record could not say what it
failed to READ; here it could not say what it failed to WRITE, and destroyed
the only copy while claiming nothing. Both make an app assert a state of the
world it has not established.

What the call obligates: anything added to this queue now leaves it only on a
result, and any future caller of `onAdd` must return one — an `undefined`
answer is read as success, deliberately, because every caller before this
change behaved that way and a false "lost" would be its own lie.

**Not proven from this sandbox:** his fourteen, on his phone, against the live
database. The save path is proven by rendering, including a failing insert and
a thrown error. `re-review: 2026-10-17`.

## The decision

1. **One at a time, awaited.** The picker already reads files serially; the
   save now matches. Fourteen large concurrent writes plus twenty-eight
   concurrent reloads was a self-inflicted failure mode.
2. **Only what saved leaves the queue.** A picture that failed stays on screen
   with its caption and its thumbnail, ready to try again.
3. **The tally is the truth**: "2 of 3 added. 1 still here and NOT saved:
   b.jpg (write-failed). They are still in the list — try again."
4. **`onAdd` returns its result.** The gallery can finally tell a saved
   picture from a lost one.
5. **A throw is caught and treated as a failure**, not as a crash that takes
   the rest of the batch with it.
6. **The button says where it has got to** — "Saving 9 of 14…" — because
   fourteen serial saves is a real wait, and a button that only greys out is
   how a person decides it has hung and leaves, which under the old code
   genuinely lost whatever had not been written yet.

## Outcome

`properties-qr-gallery-files.test.jsx` — **43 green**, four cases added.

**Proven-to-catch.** Restoring the fire-and-forget shape (no await, clear the
queue regardless) fails two cases, the first with the report in its own words:

```
the failed picture was discarded: expected +0 to be 1
a thrown error lost the picture:  expected +0 to be 1
```

The cases drive the **real picker** — files go through the change event and
build the queue the way the app builds it — then click the real button and
read the DOM. `compressImageFile` is mocked for exactly one reason, stated in
the file: jsdom cannot decode an image, so the real compressor refuses every
file and nothing would ever reach the queue. The decode itself is proven
against a genuine `.heic` in `a-heic-photo-is-a-photo.test.js`;
`isLikelyImageFile` stays real.

Also pinned: a clean run empties the queue and claims nothing lost; an `onAdd`
that answers nothing is treated as saved; a thrown error keeps the picture and
names the error.

Re-run together: **559 green** across 27 Properties suites. eslint clean at
`--max-warnings 0`.

## Still open

**The shutter time** (DR-0906's own open item). `property_photos.taken_at` has
existed since 0153 and is written only for in-app captures, so all fourteen of
these are dated by upload. Reading EXIF `DateTimeOriginal` fills it — as
**information only**, on his explicit instruction: *"Just to use as information
not to deny anything..."* No upload is ever refused because of what its
metadata says.
