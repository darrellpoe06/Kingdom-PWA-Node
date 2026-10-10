# DR-0909 — The upload date is the anchor; the taken date is a claim

- **Status:** accepted
- **Tier:** B (evidence rules on condition photographs — what a deposit argument turns on)
- **Date:** 2026-10-10
- **Type:** product + schema
- **Scope:** `infra/supabase/migrations-auto/0261-the-upload-date-is-the-anchor-the-taken-date-is-a-claim.sql` (new), `infra/supabase/tests/0261-photo-dates-smoke.sql` (new), `.github/workflows/ci.yml` (the door-work leg), `.github/workflows/rls-isolation.yml` (the poe-properties leg), `app/src/modules/properties/DoorTabs.jsx` (`PhotoEditor`, `isoToLocalInput`), `app/src/__tests__/properties-qr-gallery-files.test.jsx`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §7 adversarial verification), EDITABLE-EVERYWHERE and its exception 2 (immutable historical facts), SURFACE-SAYS-THE-TRUTH
- **Grounds:** 0153 (`taken_at`, `uploaded_at`), 0154 (the freeze trigger and its reasoning), DR-0908 (the date field at upload, and the conflict this record resolves)

## The word, as spoken

DR-0908 surfaced a conflict rather than guessing: Darrell asked to "update
times for photos", and 0154 refuses it with
`'a photo''s taken_at cannot be changed — it is what the camera recorded'`,
a rule that protects him. He answered the conflict himself, and the answer is
better than the one this session proposed:

> "Or have all options... always put the uploaded dates... and the other
> option is default however editable... however the upload dat never is...
> make sense?"

It makes sense, and this record is it.

## What was measured

**0154 protected the wrong timestamp.** Two columns, two entirely different
kinds of fact, and the freeze was on the one a person asserts rather than the
one the system observes:

| column | what it is | 0154 | should be |
| --- | --- | --- | --- |
| `uploaded_at` | what the SYSTEM observed. `NOT NULL DEFAULT now()`, true by construction, asserted by nobody | **writable** | frozen |
| `taken_at` | what a PERSON says about the world | **frozen** | correctable |

Verified on a real PostgreSQL 16.15 before changing anything: on the schema as
it stands today, dating a photograph that never had a date is refused —

```
ERROR:  a photo's taken_at cannot be changed — it is what the camera recorded
```

— which is the exact wall he hit. And `uploaded_at` could be moved freely.

**Freezing `taken_at` protected nothing in practice**, because the app only
ever WROTE it for an in-app capture (`captured ? new Date()... : null`,
DoorTabs.jsx). A set chosen from a phone — the fourteen move-out photographs
of DR-0905 — had none, could never be given one, and sorted as though taken
the moment it was uploaded, since `photo-order.js` and the door timeline both
order by `taken_at`. The freeze guaranteed only that an honest blank stayed
blank forever and an honest mistake stayed wrong forever.

## Impact

**Why this does not weaken the evidence**, which was the whole worry when the
conflict was raised. The protection never came from freezing the human's
claim. It comes from an immutable record of **when the picture actually
arrived**, which the claimant does not control. With `uploaded_at` frozen, a
photograph that says "taken 28 September" and arrived on 10 October says
**both**, permanently, to anyone reading the record — and `edited_at` already
moves on every update (0154), so a correction is visible as a correction
rather than indistinguishable from the original.

What the call obligates: `uploaded_at` and `uploaded_by` are now load-bearing.
Nothing may move them, and the smoke below fails if anything can.

**Not proven from this sandbox:** his own photographs on the live database.
The migration is proven on a real engine here, and the smoke joins the live
rls-isolation leg so it is proven there on every run.

## The decision

1. **Freeze `uploaded_at` and `uploaded_by`.** The anchor. 0154 left both
   writable, so until now the app's own protection was the only thing
   stopping them moving.
2. **Unfreeze `taken_at`**, and widen the column grant to match — a trigger
   that permits a change is not enough when `UPDATE` was never granted on the
   column (0154 granted four).
3. **A sanity CHECK, not a freeze.** `taken_at` must be after 1900 and no more
   than a day after the upload. A photograph cannot have been taken after it
   arrived, and the year 1200 is a typo rather than a claim.
4. **Everything else 0154 froze stays frozen**: the image, and the door /
   tenancy / instance. The photograph is the evidence and where it belongs is
   not a matter of opinion.
5. **The editor shows both and offers one.** The upload date is rendered as
   text with "that never changes" beside it; the taken date is a
   `datetime-local` input. Clearing it sends **NULL**, never `''`, because an
   empty string into a `timestamptz` is an error and not a clearing.

## Outcome

**Executed against a real PostgreSQL 16.15**, not reasoned about. The
migration applies twice cleanly (idempotent), and all ten behaviours were run:

```
1 ALLOW  set a never-set date : UPDATE 1
2 ALLOW  correct it again     : UPDATE 1
3 ALLOW  clear to unknown     : UPDATE 1
4 REFUSE move uploaded_at     : ERROR: when a photo was uploaded cannot be changed…
5 REFUSE change uploaded_by   : ERROR: who uploaded a photo cannot be changed
6 REFUSE change the image     : ERROR: a photo's image cannot be changed…
7 REFUSE move to another door : ERROR: a photo cannot be moved to another door…
8 REFUSE year 1200            : ERROR: violates check constraint …_taken_at_sane
9 REFUSE long after upload    : ERROR: violates check constraint …_taken_at_sane
10 ALLOW a sane date          : UPDATE 1
edited_at moved on correction : t
```

`0261-photo-dates-smoke.sql` encodes all ten and runs in two places: the CI
`door-work` leg on a throwaway PostgreSQL, and the **live** database in the
rls-isolation `poe-properties` leg.

**A GUARD CAUGHT A REAL HAZARD IN THIS CHANGE, and it is the best thing that
happened here.** `migration-replay-order-guard` refused the first version:

> rls-isolation leg "poe-properties" re-applies 0154…, which redefines
> `property_photos_freeze_evidence` — 0261 redefines the same and is not
> listed after it, so a replay REVERTS it.

Exactly right. The live leg replays 0154, which would have silently restored
the old trigger and re-frozen `taken_at` on every run — the change would have
appeared to work and quietly undone itself. 0261 is now listed after 0154 in
that leg, and the guard is green.

App side: **57 green** in the gallery suite, **576 green** across 27
Properties suites. eslint clean. Pinned by rendering: the taken date is
editable, the upload date is shown as text and is never an input, clearing
sends `null`, and a corrected date is sent as a real instant.
