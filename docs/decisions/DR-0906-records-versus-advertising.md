# DR-0906 — Records versus advertising

- **Status:** accepted
- **Tier:** B (what a stranger can see of a family's property, and of a tenant's home)
- **Date:** 2026-10-10
- **Type:** product (defect — an unsafe default)
- **Scope:** `app/src/modules/properties/DoorTabs.jsx` (`RECORD_KINDS`, `ADVERTISING_KINDS`, `isAdvertising`, `rememberedKind`, `rememberKind`, the grouped picker, the warning), `app/src/__tests__/properties-qr-gallery-files.test.jsx` (one case replaced, three added), `app/src/lib/heic.js` (the one-entry decode cache)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3), SURFACE-SAYS-THE-TRUTH, COMMUNITY-FIRST-MISSION
- **Grounds:** DR-0905 (HEIC — these photographs could not be uploaded at all until an hour before this), 0161 / `public_vacancy_photos`, config constraint C10 ("a photograph of an occupied home never becomes advertising"), 0153's `property_photos_kind_check`

## The word, as spoken

Darrell, 2026-10-10, the moment the HEIC fix let fourteen move-out condition
photographs of a returned unit upload at last:

> "Working... just don't want it to be advertised!!!"
>
> "Records vs advertising!!!"
>
> "Or workorders... etc... pictures for advertising are different..."

And, on why the photographs are kept at all:

> "we need them to be for historical reasons like tenants left status of the
> apartment... so we see how horrible it was or nice... either way"

## What was measured

**The wall itself is sound, and it is four-fold.** `public_vacancy_photos`
(0161) returns a picture to a stranger only when ALL of these hold:

```sql
WHERE ph.kind = 'listing'
  AND ph.archived_at IS NULL
  AND r.listed_at IS NOT NULL                       -- the door is advertised
  AND NOT EXISTS (… rental_tenancies t … status = 'active')   -- nobody lives there
```

So a move-out set tagged `move-out-condition` cannot be advertised — it fails
the first condition outright. That part of his worry is answered by the
database, not by a promise.

**What was NOT sound was the default.** Of the nine kinds the CHECK constraint
allows, **eight are records and exactly one is advertising**. The form opened
on the advertising one:

```js
const [f, setF] = useState({ caption: '', kind: 'listing', roomId: '' });
```

and, after every successful add, **reset back to it**. A move-out set is a
dozen photographs over several batches; between batches the app silently
returned the control to "advertise this". The sentence explaining what a
listing picture is sat below in grey body text — so on a panel whose ordinary
use is damage, work orders and condition, the warning was not a warning. It
was the standing state.

**A test asserted that state.** `properties-qr-gallery-files` had
*"warns that a LISTING shot is the only kind a stranger can see"*, which
rendered the panel with no interaction and expected the warning to be on
screen. It passed for years **because** the default was advertising. The gate
was pinned to the defect.

## Impact

The failure mode is quiet and one-directional: nothing breaks, nothing errors,
and a photograph of the inside of somebody's home — or of a unit at its worst
— becomes eligible for the public listing query the moment that door is next
advertised and empty. Both of those will be true of 805 Apt 2 soon, which is
why he raised it the same minute the upload started working.

What the call obligates: the two purposes stay structurally separate from here
— a reviewer can see which kinds are public by reading one frozen list, and
`isAdvertising` is the single question anything else asks.

**Not proven from this sandbox:** the live picker on his phone. The default,
the grouping, the memory and the warning are proven by rendering; what the
database does with each kind is proven by 0161's own SQL and the existing
isolation legs. `re-review: 2026-10-17`.

## The decision

1. **Name the two purposes in code.** `RECORD_KINDS` (eight) and
   `ADVERTISING_KINDS` (one, `listing`), with `PHOTO_KINDS` composed from them
   so the vocabulary cannot drift apart. `isAdvertising(kind)` is the one
   question.
2. **Open on a RECORD, never on advertising.** Advertising is something a
   person chooses each time they mean it, not a state the app can drift into.
3. **Keep the kind between batches.** Only the caption and the room clear
   after an add. Reverting to `listing` mid-set was the mechanism by which an
   advertising photo would have been made by accident.
4. **Remember the last RECORD kind used on this device** so a dozen move-out
   photographs are labelled once. `listing` is deliberately never remembered —
   see (2). Storage failures are swallowed: a private window must not break an
   upload.
5. **Group the picker.** "A record — stays inside the app" and "Advertising —
   a stranger can see this" are separate `<optgroup>`s, because they are not
   two flavours of one thing.
6. **The warning is an exception, and it is marked.** Shown only when
   advertising is actually chosen, in the red register with a rule beside it,
   opening "This is advertising, not a record."

Also folded in, from the same panel: **a HEIC is now decoded once, not twice.**
The picker compresses every file twice (image, then thumbnail), so fourteen
twelve-megapixel photographs meant twenty-eight WASM decodes — about a minute
of a panel that looks frozen. A **one-entry** cache halves it. One entry and
not a `WeakMap` keyed by File, deliberately: the picker holds all fourteen
Files alive for the whole loop, so a WeakMap would have retained every decoded
frame — ~48MB each, ~670MB for the batch.

## Outcome

`properties-qr-gallery-files.test.jsx` — **39 green**, four of them new or
rewritten.

**Proven-to-catch.** Restoring `useState({ kind: 'listing' })` fails
*"opens on a RECORD, never on advertising"* immediately:

```
expected [ 'move-in-condition', …(7) ] to include 'listing'
```

Also pinned, by rendering and interacting: a work order, damage, a move-out
set, a turn and an inspection are all records and none is advertising;
`ADVERTISING_KINDS` is exactly `['listing']`; choosing listing makes the
warning appear and say "This is advertising, not a record"; and the picker
carries two named groups rather than one flat list.

Re-run together: **552 green** across 26 Properties suites. eslint clean at
`--max-warnings 0`.

## Still open

His other two asks from this panel, both measured and neither shipped:

- **The shutter time.** `property_photos.taken_at` has existed since 0153
  ("when the shutter fired, if known"), is indexed, and is written **only when
  a photo is captured in the app right now**. For a photo chosen from the
  phone — all fourteen of these — it is null and the timeline falls back to
  the upload date, flagging itself `datedByUpload`. Reading EXIF
  `DateTimeOriginal` fills it. His constraint, stated when he asked:
  *"Just to use as information not to deny anything..."* — **no upload is ever
  refused because of what its metadata says.**
- **"Didn't take them."** Reported once and not yet reproduced; the gallery
  write passes `rental_ref: door?.id` while `property_photos.rental_ref` is
  documented as the rentals **ID** (PropertiesApp.jsx:380-387, the same key
  confusion that once emptied Rooms and Photos). Measured, not yet proven by a
  render. Next.
