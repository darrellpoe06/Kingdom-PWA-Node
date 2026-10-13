# DR-0908 — The upload says what it did, and a picture carries the day it was taken

- **Status:** accepted
- **Tier:** B (the evidence path; and a live failure the family is hitting now)
- **Date:** 2026-10-10
- **Type:** product (defect + capability)
- **Scope:** `app/src/modules/properties/cloud.js` (`WRITE_DEADLINE_MS`, `withDeadline`, `addPhoto`), `app/src/modules/properties/DoorTabs.jsx` (progress bar, finalize list, kind filter, `takenAtIso`, `nowLocalInput`, the date/time field), `app/src/__tests__/properties-qr-gallery-files.test.jsx`, `app/src/__tests__/a-heic-photo-is-a-photo.test.js`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3, §8), SURFACE-SAYS-THE-TRUTH, HOLD-THE-HAND-OF-THE-PROCESS (DR-0621)
- **Grounds:** DR-0905 (HEIC), DR-0906 (records vs advertising), DR-0907 (a picture is not gone until it is saved), 0153 (`taken_at`, "when the shutter fired, if known"), 0154 (the freeze trigger), #2057 (the Pages Functions outage)

## The word, as spoken

Darrell, 2026-10-10, on build **21F4C39** — the one that already carried
DR-0907's serial save:

> "After trying to upload it did not work.... pictures looked like they would
> upload and never did... can we get a progress bar and a finalize list of
> uploaded images and a where to store... or store it in the prechosen
> location"

then, in four more lines:

> "Maybe choosing a move out conditions should show those images etc..."
> "All options show their images... also allow me to enter the correct dates
> for photos... they will sort my move out dates"
> "Calendar to choose those dates and times... or it defaults to today...
> update times for photos"

## What was measured

**He was on the fixed build and it still did nothing.** That is the finding.
DR-0907 made the save serial and honest, so a failure would have shown a
tally. He saw neither a tally nor a save — which is the signature of a promise
that **never settles**, not one that fails.

**Nothing in `cloud.js` had a deadline.** Reads got one long ago (`boundedRead`
in PropertiesApp); writes were left to the network on the assumption they would
either land or error.

**Why they stall, traced:** the Pages Functions outage (#2057) killed the
same-origin `/sb` road, so the deploy points the client at the **absolute
Funnel URL** (`deploy-cloudflare-pages.yml:147`). CLAUDE.md's own standing note
says why that is a stopgap and not a home — the app must reach the NAS
same-origin, *"never the absolute Funnel URL (it throttles cross-origin)"*.
Small reads pass. Fourteen cross-origin POSTs each carrying a ~300KB base64
data URL do not. With no deadline the promise never settles, the loop blocks on
picture one, and the button sits at "Saving 1 of 14" forever.

**A deadline cannot make the write succeed.** It makes the failure visible and
the picture recoverable, which is the difference between a stall and a loss.

## Impact

Until the Functions outage is fixed, large photo writes will keep failing —
that is outside this repository and needs the Cloudflare Pages dashboard. What
changes here is that the app stops lying about it: the bar moves or it does
not, the list names every file and its outcome, and nothing is discarded.

**A REQUEST I DID NOT BUILD, and why.** "update times for photos" is refused by
the database on purpose. 0154 freezes `taken_at` with a trigger whose own
message is `'a photo''s taken_at cannot be changed — it is what the camera
recorded'`, and the migration explains: *"re-pointing a move-out condition
photo at another door or another date is exactly the tampering the append-only
rule existed to stop."* That rule protects **him**: a move-out date a landlord
can edit afterwards is worth nothing in a deposit dispute.

The honest middle, not built here because it changes an evidence rule and that
is the Governor's call: allow `taken_at` to be set **once, when it is NULL**,
and never changed after. Filling a blank is not re-dating, and it would let him
date the sets that have none while leaving every recorded date immutable.
Surfaced, with its reasoning, rather than either quietly breaking the
protection or quietly ignoring the ask. `re-review: 2026-10-17`.

**Not proven from this sandbox:** his fourteen, on his phone, against the live
database. Everything below is proven by rendering and by executing the
deadline.

## The decision

1. **Every photo write has a deadline** (45s). A stall now reports "the picture
   server did not answer in 45s" and the picture stays in the queue.
2. **A progress bar**, asked for by name — and not decoration: a button that
   only greys out is how a person decides the app has hung and leaves, which
   under the old code lost whatever was not yet written.
3. **A finalize list that STAYS**: every file named, saved or not saved with
   its reason, and **where the saved ones went** — the door, the kind, the
   room. A six-second toast cannot be that, and fourteen of them overwrite
   each other.
4. **The prechosen location is used and SHOWN.** It always was used; it was
   never stated, so there was no way to know.
5. **Look by kind.** Every option is offered with its count, the chosen one
   always appears even at zero, and picking what to ADD points the view at it.
   A door accumulates move-in, move-out, damage, before, after and listing in
   one pile; the kinds were on every row and were never a way to look.
6. **A date AND time, with a calendar, defaulting to now.** `taken_at` is what
   `photo-order` and the door timeline already sort by, and it was written only
   for in-app captures — so a set chosen from the phone sorted as though taken
   the moment it was uploaded. A bare day is stored at **noon**, never midnight:
   Champaign is UTC-5, and midnight-UTC renders as the day before on his own
   screen. "Unknown" is one tap away, because a guessed day is a false record.

## Outcome

**53 green** in the gallery suite, **14** in the photo suite, **572 green**
across 27 Properties suites. eslint clean.

**Proven-to-catch, twice, and the second is the one that matters.** Removing
the deadline from `addPhoto` makes the hung-insert case fail with
`Test timed out in 5000ms` — the test hangs exactly as his upload did. The
kind filter fails on a listing shot leaking into the move-out view.

**TWO OF MY OWN ASSERTIONS WERE SUPERSEDED BY HIM WITHIN THE HOUR**, and both
are named in the test file rather than quietly changed:

- *"the strip is not offered when a door has only one kind"* — a reasonable
  call ("an answer that can only be 'all of them' is not a question worth
  asking") that he overruled in one line: "All options show their images". The
  strip is how a person SEES which kinds a door holds, so hiding it hid the
  answer.
- *"a blank date writes nothing rather than claiming the upload day"* — I
  defaulted the field to blank for honesty; he asked for "or it defaults to
  today". Today is right for the common case, and **"Unknown" survives as one
  tap**, so the honest answer stays reachable instead of being the only one.

Also pinned: a typed day and time both survive the round trip; a typo writes
nothing; the finalize list names saved and lost files separately and says
where; the camera path still stamps its own `takenAt` and the typed date is
for the chosen set.
