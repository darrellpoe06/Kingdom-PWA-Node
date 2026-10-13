# DR-0871 — Every message reaches the timeline, and the timeline names who spoke

- **Status:** accepted
- **Tier:** B (the record a family reads back to settle what happened)
- **Date:** 2026-10-10
- **Type:** product (defect + capability)
- **Scope:** `app/src/modules/properties/people.js` (`namesByUserId`), `app/src/modules/properties/model.js` (`buildHistory` gains an optional `names` map), `app/src/modules/properties/PropertiesApp.jsx` (`sendMessage`, `addNote`, `speakerNames`, `ThreadTab`)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SURFACE-SAYS-TRUTH, REALITY-TRACE (DR-0061)
- **Grounds:** DR-0869 (the name), DR-0870 (the door that has to exist first), DR-0837 (a dispatch is a record)

## The word, as spoken

Darrell, 2026-10-10, with the Messages tab open on a vacant door:

> "Messages... don't work appropriately... we need to be able to make sure
> every text is in the historical timeline..."

and immediately after:

> "So we can tell what has happened and who has been misled or misunderstood
> from historical accuracy and situations etc... make sense?"

## What was measured

Two separate things were wrong, and one thing was already right.

**Already right:** `buildHistory` has folded `tenant_messages` into the door's
history since 0150 — `model.js:254`. The timeline was never missing the
message *type*.

**Wrong, first:** `sendMessage` began `if (!activeDoor || !body.trim()) return;`
On a property with no tenancy row — his exact situation — the message was
never written at all, so there was nothing for the history to fold. Same
silent return in `addNote`. (Root cause shared with DR-0870.)

**Wrong, second, and this is the one he is actually asking for:** the history
printed `m.from_role`. A year of conversation read

```
landlord · tenant · landlord · worker · tenant
```

with no way to tell WHICH worker or WHICH household member said a given thing.
That cannot answer "who has been misled or misunderstood" — it is precisely
the question a role label erases.

And the join was already available: `tenant_messages.sender_user_id` is stored
(0055:274, written by `cloud.js:195`), and `property_access_invites` holds both
`display_name` and `claimed_by` once the person signs in. The name and the
speaker could be joined with **no new column and no migration** — the data had
been sitting in two tables that were never introduced to each other.

## Impact

What this obligates: a message can only be named once that person has signed
in and claimed their invite, because `claimed_by` is what joins them. Before
that the thread still reads by role, honestly, rather than guessing. Unknown
is rendered as role, never as a confident wrong name (DR-0076 §8).

What this does NOT cover: texts sent from the landlord's own messaging app.
A dispatch writes a note naming who was sent (DR-0837), so the *fact* of it is
on the record — but the words he typed in his own SMS app are not, and no
honest design can capture them. Named, not papered over.

## The decision

1. **`sendMessage` and `addNote` route through `ensureDoor`** (DR-0870), so a
   message on a vacant unit creates the unit record and lands. The
   confirmation is "Sent, and on the record." — which is now true.
2. **`namesByUserId(invites)`** builds `Map(userId -> name)` over the people
   who have actually signed in, skipping anyone with no name rather than
   emitting a placeholder.
3. **`buildHistory` takes an optional `names` map.** With it a message reads
   `Marcus Webb · worker`; without it the history reads exactly as before, by
   role. The parameter is additive, so no existing caller changes behaviour.
4. **The Messages thread names the speaker** on the same join.

## Outcome

Properties suites green (**108 tests**), eslint clean. The change is additive
at every seam: `buildHistory` with no `names` is byte-identical in behaviour
to the previous version, which is what keeps the twenty-five existing history
assertions passing unchanged.

Not proven from here: the end-to-end join against live rows, which needs a
real signed-in worker with a claimed invite. **Verify on the deployed build.**
`re-review: 2026-10-17`.
