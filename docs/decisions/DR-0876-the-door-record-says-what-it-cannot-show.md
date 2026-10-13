# DR-0876 — The door record says what it cannot show

- **Status:** accepted
- **Tier:** B (the record a family and its workers read back to settle what happened)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/modules/properties/cloud.js` (`loadDoorRecord` returns `unreadable`), `app/src/modules/properties/model.js` (`unseenByThisFace`, `unreadNote`), `app/src/modules/properties/PropertiesApp.jsx` (History + Messages), `app/src/__tests__/the-door-record-says-what-it-cannot-show.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076, especially §8 — unknown is never green), SURFACE-SAYS-TRUTH, REALITY-TRACE (DR-0061)
- **Grounds:** DR-0871 (every message reaches the timeline), DR-0870 (the door that must exist first), 0150 (the read policies this mirrors)

## The word, as spoken

Darrell, 2026-10-10, on what the record is for:

> "Messages to the 1099 workers or just historical notes for when things are
> being done... a place to make sure we have all-in-one information about this
> place... Messages in-between tenants go to the historical events and
> timelines for project work for users and management and workers to see...
> less questions for owners... **workers can deduce things from historical
> data**"

and then the standard, twice:

> "End to end.... historical accuracy and events... make sense?"

## What was measured

`loadDoorRecord` (cloud.js:125) fired five reads and discarded every error —
`msg.data || []`, five times — returning `ok()` whatever happened. So three
entirely different situations produced one identical answer:

| situation | what the reader saw |
| --- | --- |
| the read FAILED (network, a refusal, a bad column) | an empty list |
| the reader is NOT PERMITTED to see that part | an empty list |
| nothing has ever happened on this door | an empty list |

…all under a heading reading **"Everything that has happened on this door, in
order."** Somebody concluding "nothing was ever said here" could have been
concluding it from a dropped request.

**The quieter half is worse, and no error exists to report it.** Row-level
security does not fail a query — it FILTERS the rows and returns an empty set.
A manager without `message.tenant` and a brand-new door are indistinguishable
from the client. That cannot be fixed by checking errors.

This matters most for the exact use Darrell named: a worker arriving later and
deducing from the history **instead of asking the owner**. An absence the app
manufactured is the worst possible input to that.

## Impact

What this obligates: `unseenByThisFace` mirrors the 0150 read policies in the
client, and a mirror can drift from what it mirrors. That duplication is a
decision, not an accident — it is the same call already made for
`capabilitiesFor()`, which mirrors `claim_property_access()` so the invite UI
cannot offer what the database will refuse. Both are written down at the point
of duplication so the next person moving a policy knows to move this too.

Honest limit: this does not make anybody see more. It makes the gaps legible.
A manager still cannot read messages without the grant — he is simply told so
rather than shown a blank.

## The decision

1. **`loadDoorRecord` returns `unreadable`** — the named parts whose read
   errored. Still `ok()`, still returns everything it could read; the failure
   is reported rather than flattened into emptiness.
2. **`unreadNote()`** turns that into one sentence that says the missing part
   is **unknown rather than absent**, and says not to decide from it.
3. **`unseenByThisFace(role, grants)`** names, in plain words, what this
   particular face is never shown — the part RLS reports as nothing.
4. **The History tab carries both**, under "What this history does not
   include"; the Messages tab carries the unread warning.
5. **Both apps get it from one module.** `PropertiesApp` is mounted by the
   PoeTech shell at `?view=properties` and by the Poe Properties door at
   `/properties/app/`, so PoeTech and Poe Properties cannot tell different
   stories about the same door.

## Outcome

`the-door-record-says-what-it-cannot-show.test.js` — **15 green**. Proven-to-
catch: a stub client whose `tenant_messages` read returns an error is asserted
to produce `unreadable: ['messages']` where the previous version produced a
silent `[]` and nothing else. Pinned alongside: several failures all reported,
a genuinely empty door NOT reported as unreadable (the distinction the change
exists to make), the other parts still returned when one fails, every
`unseenByThisFace` branch, and the three testids on the real surfaces.

Not proven from here: the live behaviour against real RLS with a real manager
account. **Verify on the deployed build.** `re-review: 2026-10-17`.
