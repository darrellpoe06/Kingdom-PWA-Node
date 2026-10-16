# DR-1076: Nineteen collisions in seven days — the next number is the next FREE number

**Date:** 2026-10-16
**Status:** accepted
**Tier:** A (a read-only tool; it writes nothing and changes no convention)
**Type:** orchestration
**Area:**
- `scripts/claim-decision-number.mjs` (new — read-only)
- `app/src/__tests__/claim-decision-number.test.js` (new — 10 cases, proven to catch twice)

**Grounds:** DR-1021's own re-review, due 2026-10-21 and run five days early: **"count the week's collisions; if the rate holds, that convention is the next conversation."** Darrell, 2026-10-16, when I listed the collision as a question for him rather than work for me: **"What happened to the other questions?!!!!!!"** — and the ari-guard stop-hook, which refused my reply for saying the convention change was "your call": *"re-ask-permission — asks permission for work already directed (do the work — DR-0111)."*
**Principles:** DR-1021 (the fourth renumber is a tool; this is its re-review); DR-0644 (the resolver REFUSES rather than folds, after folding silently deleted two real decisions); DR-0111 (do the work; a measurement is not a question); DR-0076 §3 (proven-to-catch), §4 (measure, do not claim)

## Context

DR-1021 recorded the fourth hand-renumber of a decision record in a single
session and built `renumber-decision-record.mjs` to perform it safely. It
deliberately did **not** try to prevent the collision, and said why: the fixes
that would *"actually stop a collision change a convention every session and
every past record depends on, which is a Governor's call rather than a tooling
change."* It left a dated re-review to find out whether the rate justified that
conversation.

Today lesson 248 had to move its record from DR-1072 to DR-1074, because my own
pair took 1072 and 1073 while that branch sat in CI. That made it the fifth,
and it is what sent me to the count.

## What was measured

**Nineteen renumber events in seven days.** About 2.7 a day.

That is not an edge case being monitored. It is the normal operating condition
of a repository with concurrent sessions, and DR-1021's condition — *"if the
rate holds"* — is met several times over.

**Why it happens, exactly.** `**Next ID:**` is one shared line and the resolver
computes it as `maxRowId(INDEX) + 1` — **from what is on disk**. Two sessions
branching off the same main both read the same number and both take it. Neither
session did anything wrong: the number really was free when each of them
looked. Disk simply cannot see a branch that has not landed.

**And it is live right now.** Running the tool against the real repository, on
real branches:

```
next free decision number: DR-1077
  on disk:   976 record(s), highest DR-1075
  in flight: 60 number(s) held by unlanded branches, 1 of them at or above DR-1076
    DR-1076 — origin/ccr-9c70f297-ct1dox

  Taking DR-1076 would collide. DR-1077 is free on disk AND in flight.
```

**DR-1076 — this record's own number — was already claimed by another branch.**
The pointer would have handed it to me, and the tool caught it on its first
real run. (This record keeps 1076 deliberately: that branch has not landed, and
a record about collisions that quietly dodged one would teach the wrong thing.
If it lands first, this renumbers with DR-1021's tool, which is exactly the
sequence being measured.)

## Impact

A session can now ask what is free rather than what is next, before taking a
number — and see who holds the ones it steps over.

## Decision

**Widen the question, change nothing else.** `**Next ID:**` stays one line. The
resolver still owns it and still computes it from disk. DR-0644's refusal still
refuses. No past record moves, and no citation changes. The only thing that
changes is the question asked *before* a number is taken:

> from *"what is free on disk?"*
> to *"what is free on disk **and** not already claimed by a branch still in
> flight?"*

**Unmerged branches only, and that is what keeps it cheap.** A merged branch's
decision files are already in main, so `maxRowId` has counted them. Only work
that has not landed can hold a number disk cannot see. There are **892**
branches in this repository and a handful in flight, so the scan stays small
however many accumulate. It is further bounded at the 60 most recently touched
refs.

**It decides nothing and writes nothing.** It reports the lowest free number
and names the branch holding each number it skipped. The resolver remains the
only thing that writes the pointer, because two things computing one line is
how they drift — which is the same reason DR-1021 left `**Next ID:**` alone
when it built the renumber tool.

**This is not the convention change DR-1021 reserved for the Governor.** That
one — replacing the shared counter with something per-session — would touch
every past record. This is additive, read-only, and reversible by deleting one
file.

## Verification

- **10 cases.** The claim-reading half is weighted at what must NOT count as a
  claim: `INDEX.md` names every number there has ever been, so reading it as
  claims would make every number look taken; `README.md` and `PRINCIPLES.md`
  likewise; a DR mentioned in prose is not a file claim; and a three- or
  five-digit number is not a decision record.
- **The arithmetic half** pins stepping over one held number, stepping over a
  *run* of them (two sessions in flight, the ordinary case), and **never
  returning below the pointer** — reusing a retired number would point every
  existing citation at the wrong record.
- **Proven to catch, by two mutations** (DR-0076 §3):
  - ignoring what branches hold → both "steps over" cases **fail**;
  - loosening the path match so `INDEX.md` counts as a claim → the
    not-a-file-claim case **and** the digit-length case **fail**.
  - File restored byte-identical after each (`git diff --stat` empty).
- **Proven on the live repository, which a fixture cannot do:** the real
  decision files are read (976 records, DR-1021 and DR-1075 both present), and
  the scan found a real branch holding a real number on its first run.
- 23 gates green by exit code; lint clean; full suite run.

## What this does not do

- **It is not wired into anything yet**, on purpose. It is a tool a session
  runs, like `renumber-decision-record.mjs` beside it — and DR-1021's reasoning
  holds: a rename or a renumber happening automatically inside a merge step is
  where a mistake is least visible. **`re-review: 2026-10-23`** — read the
  renumber count for the week after this; if it does not fall, the next move is
  to make the lane itself run this before a decision file is written, and that
  is a change to the lane rather than to the convention.
- **It does not stop a collision between two sessions that both run it in the
  same minute**, before either pushes. Nothing short of a reservation that is
  itself written somewhere shared can, and that is the convention change
  DR-1021 reserved.
- **It does not renumber anything.** `renumber-decision-record.mjs` (DR-1021)
  still does that, still refuses four ways, and is still run by a person who
  reads what it renamed.
