# DR-0953 — A scan that could not be checked is not a unit that is gone

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/components/PropertiesDoor.jsx`, `app/src/modules/properties/apply-link.js` (`applyOptionLabel`), `infra/supabase/migrations-auto/0274-the-shelf-names-the-unit-never-the-street.sql`
**Gate:** `app/src/__tests__/the-door-does-not-invent-an-empty-shelf.test.jsx`

## Context

Darrell, 2026-10-11, three things on the public door in one sitting:

> "Why didn't it pop up right away when scanning the qrcode?"
> "Got to be able to close the apply button..."
> "...and also identify the Apartments in the drop down... make sense?"

## What was measured

**The scan.** Two screenshots a minute apart. At 7:59 the scanned card landed
on *"That unit is not available right now."* and *"Nothing is listed right
now."* At 8:00 the same page showed **two listings**. Nothing changed but the
network. The cause was one line:

```js
setVacancies(r.ok ? r.vacancies : []);
```

A failed read became an empty list; the app then looked for the scanned unit
in that empty list, did not find it, and stated both absences as fact. The
scan itself had resolved correctly all along.

**The form.** It opens three ways — the card's Apply, a printed QR, its own
button — and had **no way out**. On a phone it fills the screen.

**The picker.** Its options read "1-bed multi-family in Champaign, Illinois"
and "multi-family in Champaign, Illinois". `PropertiesDoor` already rendered
`v.unit` beside the label; it was always null, because `public_vacancies()`
withheld the unit **together with** the street.

## Impact

This is the **third surface in one evening** collapsing a failed read into an
empty one (DR-0946 was the owner's gallery), and by far the worst, because the
reader is a **stranger standing at the door with a camera**. They are told the
unit is taken and they leave; we never hear about it. With Pages Functions
dark (#2057) the app is on the throttled Funnel road, so this is not rare —
it is most of the time.

A form with no exit costs a mis-tap the whole page. A picker whose options
cannot be told apart files an application on the wrong door.

## Decision

1. **A failed listings read is held as a failure.** `vacanciesFailed` is its
   own state; the page says "We could not reach the listings just now — this
   is not an empty list" and offers Try again. The scan's "that unit is not
   available" and the "nothing is listed" sentence both require a **successful**
   read first. A genuinely empty shelf still says so.
2. **The form closes**, keeping what was typed — `values` lives above the
   branch, so a mis-tap is not punished by throwing the work away.
3. **0274 publishes the unit designator, never the street.** Those are not the
   same secret: DR-0935 protects *805 North Prospect Avenue* because a street
   plus a city locates a front door. "Apt 4" beside a city locates nobody.
   `applyOptionLabel` then builds a tellable option: unit, then rent, then the
   shared marker — and never says "shared" twice.

## Verification

Proven to catch: restoring `r.ok ? r.vacancies : []` fails two cases, the
first with *"a stranger at the door was told the unit is taken, when we simply
had no answer"*; removing the close control fails a third. The preserved
guarantee passes against both versions — a real empty shelf still says so.
8 green; eslint clean.

**The pattern, named:** `x.ok ? x.rows : []` is an idiom throughout this
codebase and every instance is a latent manufactured absence. Three were found
and fixed in one evening by accident. A machine check for the class — a
surface that renders an absence must distinguish *failed* from *empty* — is
the right durable answer and is **not** attempted here, because a blunt
version would false-alarm on every legitimate use and a false alarm is a
broken gate too. **re-review: 2026-10-18.**
