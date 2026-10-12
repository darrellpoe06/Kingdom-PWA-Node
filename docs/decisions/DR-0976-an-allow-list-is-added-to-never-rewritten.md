---
id: DR-0976
title: An allow-list is added to, never rewritten — 0275 deleted two subjects and broke lease signing and camera access for 28 hours
date: 2026-10-12
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0957]
tier: B
entities: [poe-properties]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-SAYS-TRUTH, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-12 — found while asking why rls-isolation had been red for 28 hours
---

## Context

**Document signing and door-camera access have been broken on the live
database for about 28 hours, and the check that caught it immediately was
read by nobody.**

It surfaced sideways. DR-0975 had just shipped — the site witness had been a
constant for 65 hours — and the item DR-0970 left open pointed at
`db-migrate.yml:182`, a `curl -sS … && echo` of the same class as the dead
bell. Reading that line to see whether it had ever actually failed meant
looking at what it dispatches, which is `rls-isolation` — **the tenancy and
data-isolation proof matrix, the most safety-critical check in this
repository.** It has failed every run since 2026-10-11T04:44:22Z.

The `curl` line turned out to be working. What it dispatches was not.

## What was measured

**The failure, identical in every run 8 hours apart:**

```
isolate — poe-properties (1 of 23 jobs)
psql:infra/supabase/tests/0263-document-signing-smoke.sql:203: ERROR:
  DOCUMENT SIGNING SMOKE FAIL: the family asks for both signatures
  (expected succeeds=t, got f)
```

**How long, and the exact commit:**

| | |
|---|---|
| last green rls-isolation | 2026-10-10T23:44:45Z, `fd4463f` |
| first red | 2026-10-11T04:44:22Z, **`eccda88`** |
| red since | **10 consecutive runs, ~28 hours** |
| `eccda88` is | *"the 0275 portal-approval smoke gets a CI leg, so it proves something"* (#2118) |

`eccda88` added `0275-a-tenant-waits-for-the-landlords-yes.sql` to the
poe-properties replay leg. Adding it is correct — a migration not in the leg
is a migration nothing proves. **Adding it is what made 0275's own defect
visible.**

**The constraint's whole history, read from the files:**

| migration | `door_events_subject_check` allows |
|---|---|
| 0263 | rent, work, **document** |
| 0266 | rent, work, **document**, **camera** |
| 0269 | rent, work, **document**, **camera**, stay |
| **0275** | rent, work, application, stay, portal-request |

**Proven on PostgreSQL 16.15**, by applying those four `ADD CONSTRAINT`
statements in order — *extracted verbatim from the real files by script, not
retyped* — then performing the exact `INSERT` the signature function performs:

```
ERROR:  new row for relation "door_events" violates check constraint
        "door_events_subject_check"
DETAIL:  Failing row contains (..., document, ..., signature-requested, ...)
```

**Three faults, not one:**

1. **`document` — document signing, end to end.** 0263 writes it three times:
   `signature-requested`, `signed`, `fully-signed`. Requesting a lease
   signature, signing one and completing one all raise.
2. **`camera` — door-camera access.** 0266 writes it from a **trigger** on
   `door_camera_access`, so the insert on that table itself raises: asking for
   or granting camera access fails outright. **This has not even been reported
   yet** — the leg stops at the first failing smoke and 0263's runs first, so
   the measured damage understates the real damage.
3. **`portal-request` — the mirror image, and 0275's own feature.** 0275 added
   that value to the constraint and never touched the `door_events_read`
   policy, which still ends at 0269's arms and falls through to `ELSE false`.
   Its audit rows are written successfully and are **invisible to every
   authenticated reader**. Found by hand while reading the policy beside the
   constraint.

**It is live.** 0275 landed on `main` at 2026-10-11 04:41:33 and db-migrate
runs 675, 676 and 677 all succeeded on 2026-10-11.

**Why it happened, and why "be more careful" is not the answer.** 0275's own
comment reasons about this exact hazard, at length:

> *"ITS `subject` CHECK IS AN ALLOW-LIST and this widens it. Two things are
> deliberate: the widened list NAMES 'application' as well, because 0272 (open
> on PR #2106) adds that value and this file carries the higher number — so if
> it merges first and mine rebuilt the constraint from 0262's two values, this
> migration would SILENTLY DELETE its value and 0272's writes would start
> failing."*

The author guarded against an **unmerged sibling branch** and then did the
feared thing to the **already-merged** files: the list was reconstructed from
0262's two values plus `stay`, so 0263's `document` and 0266's `camera` fell
out. The comment says *"widens"*; the statement narrows. Someone who
understood the failure mode precisely still got the set wrong, because
reconstructing an allow-list from memory across four files is not something
prose can be trusted to do.

## Impact

For the family, this is a **product outage they have not hit yet only because
they have not tried**: a lease cannot be sent for signature, signed, or
completed, and a camera cannot be granted. Nothing warned anybody, and the
feature fails at the database with a constraint violation rather than
gracefully.

**The deeper cost is the one worth recording.** The safety matrix **did its
job perfectly** — it went red on the exact commit, within minutes, with the
precise file, line and assertion. It then stayed red through **seven merges
yesterday**, including every one of this session's, because `rls-isolation`
is **not a required check** on a PR: it is dispatched by `db-migrate` after
the merge, and its result lands in a list nobody opens. A correct alarm that
reaches no one is indistinguishable from no alarm. That is DR-0975's finding
one layer down — and this one is worse, because there the instrument was
saturated and here it was *right*.

Reversible: one additive migration, one smoke, one guard, two replay legs, and
a corrective comment on 0275 that changes none of its SQL. No data is touched;
the allowed set only grows. Tier B — it changes the live schema's constraints,
so it carries real-database proof rather than a reading.

## Decision

1. **`0279-an-allow-list-is-added-to-never-rewritten.sql`** restores
   `door_events_subject_check` to the **union of every value any migration has
   ever allowed**: rent, work, document, camera, stay, application,
   portal-request. Nothing 0275 added is dropped in turn — fixing a narrowing
   by narrowing the other way would be the same mistake wearing a different
   hat, and a test asserts both directions.
2. **The read policy gets an arm for every subject that has a table**,
   including the `portal-request` arm 0275 never added. The arms are
   **composed** and `EXECUTE`d rather than written flat, so the file applies
   both before and after 0275 — naming a table that does not exist yet would
   fail at policy-creation time and roll the whole file back.
3. **`application` deliberately gets NO arm.** 0272 (open on PR #2106) is the
   file that adds that value and defines the table it points at; inventing a
   table name would be a guess that does not compile. The value stays
   **allowed** — never narrow — and its arm ships with 0272. The smoke asserts
   the arm is *absent*, so whoever lands 0272 is sent here.
4. **`scripts/constraint-allow-list-guard.mjs` is the durable output**, in
   `verify:gates`. Walking the migrations in replay order, every
   `ADD CONSTRAINT … CHECK (col IN (…))` must carry every value an earlier
   file allowed. The historical union is the proxy for "values something
   writes", because a value joined an allow-list precisely because a writer
   needed it.
5. **A removal is DECLARED, not silent**, with
   `-- allow-list-change: <constraint> <value> -- <why>`. That turns a side
   effect of retyping into a sentence a human had to write, which is the whole
   difference between what 0275 did and what it meant to do.
6. **A declaration binds ONLY the file that carries it.** My own mutation test
   caught this hole: accumulating declarations across the chain meant that once
   0275 declared `document` removable, **every later file could drop it again
   in silence** — reverting 0279's union produced no finding at all. One file's
   recorded mistake must never become a standing licence for the next.
7. **0275 is corrected in place by COMMENT ONLY.** Its SQL stays exactly as it
   was applied — an applied migration's effect is never edited — but the
   paragraph claiming it "widens" the list now carries the correction, the
   measured consequence, and the pointer to 0279, where the next reader will
   actually look. Both dropped values are declared there as **defects, not
   intent**, so the guard's green means "recorded", never "fine".
8. **A SECOND GUARD RULE WAS BUILT, PROVEN USELESS, AND REMOVED.** The intent
   was to check rule 2's class automatically — every allowed value must have a
   read arm. A regex cannot do it, and shipping it would have been worse than
   nothing:
   - matching policy to allow-list **by column name** flagged four policies on
     entirely different tables (`rent_payee_read`, `door_camera_menu_read`,
     `door_stays_family_read`, `property_document_signatures_read`) that merely
     `CASE` over a column of the same name — a guard that cries wolf is deleted
     within a week (P46);
   - worse, **it could not read 0279**, the file it exists to protect, because
     that policy composes its arms into a variable. Loosening the regex to scan
     the whole file would make it **pass without checking** (DR-0076 §3).

   So the arm parity is proven where it can be — on a real PostgreSQL, reading
   `pg_policy` back — and pinned by a test against the `arms :=` block. The
   removal is recorded in the script's own header so it is not re-attempted
   blind.
9. **NOT decided: making `rls-isolation` a required PR check.** It is the fix
   that would have caught this in minutes instead of 28 hours, and it is a
   change to the merge lane (DR-0107 territory, Tier C) with a real cost — the
   matrix is 23 jobs and would sit on every PR. Naming it rather than slipping
   it in. `re-review: 2026-10-19`.
10. **NOT decided: 0272.** It is open on #2106 and adds `application`. When it
    lands it must add its own read arm, and the 0279 smoke will fail until it
    does — deliberately. `re-review:` on 0272's merge.
11. **NOT fixed here: `db-migrate.yml:182`.** The `curl -sS … && echo` that
    started this trail is genuinely of DR-0970's class, and it was MEASURED to
    be working: every recent `rls-isolation` run exists and carries
    `event: workflow_dispatch`. It remains latent rather than live.
    DR-0970's `re-review: 2026-10-18` stands.

## Verification

- **Reproduced on real PostgreSQL 16.15, not predicted.** The four
  `ADD CONSTRAINT` statements were extracted from the real migration files **by
  script** so the reproduction could not be a paraphrase — the mistake 0275
  made was precisely a retyped list. Before 0279, `document` and `camera` are
  both rejected with the measured error; after, all ten inserts across all
  seven subjects are accepted.
- **Replay-safe:** 0279 applied **twice in a row**, as every leg does, under
  `ON_ERROR_STOP=1`, clean both times; the `portal-request` arm present, the
  `application` arm correctly absent, and writes still accepted after the
  second application.
- `0279-allow-list-smoke.sql` — **proven-to-catch on the live schema, twice:**

  | mutation | smoke |
  |---|---|
  | restore 0275's narrow constraint | **FAIL** — *"'document' is gone again — lease signing writes it three times (0263)"*, exit 3 |
  | constraint restored, `portal-request` arm removed | **FAIL** — *"no arm for portal-request, so those rows are written and then invisible"* |
  | the real 0279 re-applied | **PASS** |

  The smoke reads the allowed values **out of the constraint itself** rather
  than retyping them, for the same reason.
- `constraint-allow-list-guard.mjs` — **run against all 278 migrations.** It
  reported exactly one finding, the real one, naming both dropped values and
  the fix; **no false alarms anywhere in the chain.** With 0279 and the
  declarations in place: *"OK — 23 allow-list(s) across 278 migrations; none
  narrows what an earlier file allowed."* Proven-to-catch: deleting 0275's
  declarations fails it; narrowing 0279 fails it and names 0279.
- `an-allow-list-is-added-to.test.js` — **18 tests**, with the constraint
  values read from the real files rather than written into the test.
- All 17 prior `verify:gates` green, including `migration-replay-order-guard`
  and the `rls-isolation` matrix guard, after 0279 and its smoke joined both
  the rls-isolation poe-properties leg and ci.yml's leg.
- **Not verified from this sandbox:** the live database's current constraint,
  read directly. The sandbox has no tailnet route, so the live state is
  inferred from db-migrate 675–677 succeeding on a tree containing 0275 — which
  is strong but is an inference, not a reading. The reading arrives when
  db-migrate applies 0279. `re-review: 2026-10-13`.
- **Not verified:** whether anybody tried to sign a lease or grant a camera in
  those 28 hours. The events table would answer it and the sandbox cannot reach
  it. Recorded as unknown rather than assumed to be nobody.

## Links

[DR-0957] (a tenant waits for the landlord's yes — 0275, amended here: its
comment is corrected and its two deletions declared), [DR-0975] (the witness
is not a constant — the same "a correct alarm nobody reads" shape one layer
up, found an hour earlier), [DR-0970] (the dead bell, whose open `curl` item
led here), [DR-0076] (§3 a check that cannot fail is theater; §5 characterize
before you change), [DR-0060] (the tenancy guard this matrix exists to prove),
[DR-0107] (prove the deploy — why decision 9 is Tier C), [DR-0621] (hold the
hand of the process — a flag is where the work starts).
