# DR-0954 — Signing in comes back through the door

**Date:** 2026-10-11 · **Status:** Accepted · **Reported by:** Christina (relayed by Darrell)
**Code:** `app/src/components/PropertiesDoor.jsx` (the `PasswordAuth` call site)
**Gate:** `app/src/__tests__/signing-in-comes-back-through-the-door.test.jsx`

## Context

Christina, 2026-10-11:

> "When I sign in as then I click on I live here. I then go to the other sign
> in page and it is a loop as it goes straight to these 3 pages over and over.
> Can you fix this. This is Christina"

Her three screenshots are the loop: "Who are you?" → "I live here" → the
sign-in form → back to "Who are you?" with *"You signed out of Poe Properties
on this device."*

## What was measured

Leaving this door writes a per-door flag (`leaveDoor`), and `doorSession`
hides the session while it is set — this is the deliberate separation between
the Poe Properties door and PoeTech (both are one origin and therefore one
Supabase session, so the separation is at the door, not the token).

`enterDoor` clears that flag. **Its own docstring says it is "called whenever
a sign-in succeeds at that door."** The one sign-in call site in
`PropertiesDoor.jsx` read:

```js
onSignedIn={() => window.location.reload()}
```

It never called it. So she signed in **successfully**, the page reloaded,
`setLeft(doorSession(...).left)` read the flag, found it still set, and the
door showed her the signed-out banner and the role picker again.

The only escape was the small "Come back in" link on that banner — the one
control that did call `enterDoor`. Nobody who has just signed in has any
reason to go looking for a way to come back in.

## Impact

**A tenant could not get into the app at all**, on a door whose whole purpose
is her unit, her work orders, her messages and her payment history. It is not
degraded service; it is a closed door with no handle, and the person affected
has no way to diagnose it and no reason to suspect anything but herself. It
would have hit every tenant and every 1099 worker who had ever signed out.

## Decision

Clear the flag first, then reload:

```js
onSignedIn={() => { enterDoor(DOORS.properties); window.location.reload(); }}
```

The reload is kept — the shell reads the session at mount in several places
and a reload is the honest way to re-read them all. Only the order is new,
and it matches what `onReturn` in the same file already does.

## Verification

Four cases. The contract ones show that a successful session alone does **not**
clear the flag (so the loop was real and not a mis-read), that re-entering
ends it, that leaving still leaves, and that one door's flag never touches
another's. The wiring case pins the call site, because the loop only appears
across a reload jsdom does not perform.

Proven to catch: restoring `onSignedIn={() => window.location.reload()}` fails
with *"signing in does not re-enter the door, so a person who left it loops
for ever."* The order is pinned too — clearing the flag after a reload never
runs.

**Not proven from this sandbox:** Christina's own phone. She is the one who
found it and she is the one who can confirm it. **re-review: 2026-10-18.**
