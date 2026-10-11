---
id: DR-0973
title: The public shelf has a witness — and it takes the reading a browser cannot take
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech, poe-properties]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-SAYS-TRUTH, THREE-BRAKES]
source: 2026-10-11 — after telling Darrell a fix was live when it rendered nothing
---

## Context

On 2026-10-11 Darrell found three faults on his own public listing, from his
phone, while every check in the system was green:

> "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
> "None say co-living!!!!!!!!!!!!!!!!!!!!!!"
> "Why don't we show the same photos for both listings??????!!!!!!!!!"

All three came from **one NULL column** — `rentals.rentable_level`, added by
0160 and written by nothing — read as though it had been filled in. And
DR-0952's co-living sentence had been **reported to him as live** while it
rendered nothing for nine days: the code was correct and completely inert.

**He was the only instrument that could see it.**

## What was measured

Every instrument watches the **pipeline**:

| instrument | what it proves | did it catch this? |
|---|---|---|
| CI (24,378 tests) | the code behaves | no — the code was right |
| db-migrate ledger | the migration applied | no — it applied fine |
| deploy on exact SHA | the bundle shipped | no — it shipped fine |
| boot-check | the app mounts | no — it mounted |
| site-health (DR-0125) | the site is up and fresh | no — it was up and fresh |

**Not one of them reads the page a stranger sees.** A listing could be
confidently, specifically wrong — advertising half of a shared room as a
one-bedroom apartment — with every light green.

**AND A DOM-ONLY WITNESS WOULD NOT HAVE CAUGHT IT EITHER.** This is the part
that nearly shipped as theater. Before the fix, Bed B's card read
`1-bed multi-family in Champaign, Illinois` — **character for character what
a genuine one-bedroom reads**. The fact that makes it wrong (the door is a bed
in a shared room) is **not on the page**. No rule over rendered text can
recover information the page does not contain. Measured: the first version of
these rules, run against his real pre-fix shelf, raised **zero findings**.

A witness that cannot catch its founding incident is theater (DR-0076 §3).

## Impact

The cost is trust, in both directions. Darrell cannot rely on "it's shipped"
— he has been told that and been wrong — so every change costs him a manual
check on a phone. And a stranger meeting a wrong listing has no way to know;
the harm lands on move-in day with a car full of belongings.

Unresolved, the next inert fix is found the same way: by him, by accident,
days later. The gap is structural, not a lapse — nothing was *supposed* to be
watching the glass.

Reversible: one workflow, one pure rules module, one thin browser shell, one
thin comparator. Read-only against the product and the database alike; no
schema, no app surface, no money.

## Decision

1. **Two readings, compared.** Reading one is the rendered page from a real
   browser on a runner. Reading two is **what each advertised door is
   CALLED** (`rentals.unit` + `display_name`), read-only over Tailscale, with
   the level derived by its own regex — **independently of
   `rentable_level`**, the column that was NULL and broke three surfaces at
   once. A door called a bed that the shelf advertises as "1-bed" is the
   disagreement, and it is the founding incident exactly.
2. **The rules are pure and unit-tested.** `scripts/public-shelf-rules.mjs`
   holds `judgeShelf` (the DOM reading), `judgeDoorsAgainstShelf` (the
   database reading) and `parseDoorRows`. The witness imports
   `playwright-core` at module scope and therefore **cannot be loaded by a
   test at all** — the same trap `boot-check.mjs` hit, solved the same way as
   `boot-markers.mjs` (#2120).
3. **Rules about ANY door, never a named one.** Pinning "Bed B must say X"
   would break the day a door is renamed — and a rename is precisely what
   broke the old `room_label` photo match. A rule that survives his renaming
   is an instrument; a snapshot is not.
4. **UNKNOWN IS NOT PASS** (DR-0076 §8). An empty shelf **fails**: "nothing is
   advertised" and "the page is broken" look identical from a browser, and the
   second is the worse of the two. A database read that fails is itself the
   finding.
5. **A shared door with no photographs is a WARNING, not a finding.** A bed
   nobody has photographed, in an apartment with none either, is honest.
   Failing on it would be a guard that cries wolf and gets ignored (P46).
6. **It reads labels and counts ONLY** — never `storage_path`, `thumb_path`,
   a caption, a street address or a tenant name. The apt2-photos-probe rule,
   kept: a diagnostic has no business printing the inside of somebody's home
   into an Actions log.
7. **Brakes** (deterministic class, DR-0248: budget + lock): one runner, hard
   12-minute timeout, one page load and one query; concurrency group
   `public-shelf-witness`; stop via `PUBLIC_SHELF_WITNESS_ENABLED='false'`.
   Daily at 14:41 UTC, off the hour. A finding files on the rolling
   `incident` ledger, where site-health already writes.
8. **NOT decided:** asserting prices, availability or the apply flow. This
   witness answers one question — *does the card say what the door IS* — and
   a witness that checks everything checks nothing. `re-review: 2026-11-11`.

## Verification

- `the-public-shelf-has-a-witness.test.js` — **17 tests**.
- **PROVEN-TO-CATCH against the founding incident**, on his real pre-fix rows:
  `judgeDoorsAgainstShelf(BEFORE_ROWS)` → `checked: 2`, **3 findings**, naming
  *"a bedroom count on a shared door is the 2026-10-11 fault"* and *"it never
  says it is shared"*. The corrected rows raise nothing.
- **THE LIMIT IS ITSELF A TEST, not a sentence in a doc.** A named case runs
  the DOM rules against the same pre-fix shelf, asserts they find **nothing**,
  and records why — so nobody later mistakes the DOM half for the whole
  instrument. If that case ever starts finding something, the limit has moved
  and the case must be rewritten.
- **A false positive caught before shipping:** `/\bbed\b/` matches **"1-bed"**,
  because a hyphen is a word boundary — so the first version flagged his
  legitimate Apt 2 one-bedroom as a shared bed. The rules are now anchored to
  the exact phrases 0278 composes (`Bed in a shared`, `Private room in a
  shared`). Same `\b` subtlety the SQL had to dodge, found twice in one day.
- Empty-shelf and junk-input cases both fail rather than passing; the
  comparator on an empty file exits 0 with `shared doors checked: 0`,
  measured.
- Workflow YAML parses (`yaml.safe_load`).
- **Not proven:** a live run against poetech.us. The sandbox has no route
  (egress gateway returns 403, measured 2026-08-13), which is the whole reason
  the witness is a runner workflow. Its first scheduled or dispatched run is
  the live proof. `re-review: 2026-10-13`.

## Links

[DR-0971] (the NULL column and the three symptoms this witness exists to
catch), [DR-0952] (the co-living line reported live while inert), [DR-0125]
(site-health — the pipeline witness this complements; it proves the site is
up, this proves the card is true), [DR-0076] §3 and §8 (proven-to-catch;
unknown is not pass), `scripts/boot-markers.mjs` (#2120, the precedent for
splitting a pure core out from a playwright entry point),
`apt2-photos-probe.yml` (the read-only Tailscale + `live-sql.sh` pattern this
reuses).
