# DR-1080: A sentence outside a comment is not SQL — and my own test passed because of the broken line

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the 24th gate; it blocks the build)
**Type:** orchestration
**Area:**
- `scripts/migration-prose-guard.mjs` (new — the 24th gate)
- `app/src/__tests__/migration-prose-guard.test.js` (new — 9 cases, proven on the real line)
- `app/package.json` (`verify:gates`, 23 → 24)

**Grounds:** the 0298 incident, 2026-10-16 — a migration I wrote was refused by both databases and stopped the migration queue behind it, and another session had to fix it (#2236). DR-0076 §3 (a gate must be shown to catch); the standing rule of this repository that **every "a human would have known" failure becomes a machine check**.
**Principles:** DR-0076 (no claim without evidence; proven-to-catch); DR-1075 (the record whose migration this was); DR-1079 (the collision tool I built and then did not run — see the postscript); DR-0621 (a flag is where the work starts)

## Context

While rebuilding migration `0298` on top of `0257`, a script sliced the source
from `body.index('CREATE OR REPLACE FUNCTION')`. **The first occurrence of that
phrase was inside 0257's own header comment:**

```
-- IDEMPOTENT: CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
```

So the slice began in the middle of a comment and left this behind, with no
`--`:

```
CREATE OR REPLACE FUNCTION, same RETURNS shape (jsonb).
```

Postgres refused the file. **Both databases refused it, and every migration
queued behind it waited** until a person noticed and fixed it.

## What was measured

**What did not catch it:**

| | |
|---|---|
| 23 deterministic gates | **not one of them parses SQL** |
| 26,422 tests | none applies a migration |
| the migration's own test | **passed because of the broken line** |

That third row is the finding. My test asserted the file still contained
`CREATE OR REPLACE FUNCTION`, to prove its comment-stripper had not blanked the
file. The stripper dropped `--` lines. **The corrupted line had no `--`, so it
survived the stripping and satisfied the very assertion written to prove the
file was whole.** A check was satisfied by the defect it existed to find.

That is the fifth time in one session a test in this repository was satisfied
by something other than the thing it was testing, and the first time it cost a
production database.

## Impact

A paste or slice that drops a comment marker now fails the build instead of
the migration queue.

## Decision

**One question, one honest answer: SQL statements end in `;`, English sentences
end in `.`** A line that is outside a comment, outside a dollar-quoted body,
and ends in a period is prose that has lost its marker — which is exactly the
shape of this failure and of the copy-paste that produces it.

**It does not try to parse SQL.** A half-parser would cry wolf and get switched
off, which is worse than no gate at all.

**IT CRIED WOLF ON ITS FIRST RUN, AND THAT IS RECORDED HERE RATHER THAN
QUIETLY FIXED.** The first version flagged **ten real lines** across the
repository — every one a legitimate column definition whose *trailing* comment
ends in a period:

```
  notes         text,                 -- arrangement notes, who leads, etc.
  rental_ref    uuid,                 -- the door. Survives every tenancy on it.
```

The period belonged to the comment, not the statement. The guard now strips a
trailing `--` comment and the whole of any `/* … */` banner before it looks at
the line ending, and both shapes are pinned as cases. Had I shipped the first
version, the 24th gate would have been a gate everyone learned to ignore.

## Verification

- **Proven on the real line, in the real file.** The exact sentence that
  stopped the queue was restored verbatim into
  `0298-our-own-probe-is-not-a-person.sql:55`; the guard went **red**, naming
  file and line, and **two test cases failed**. The file was restored
  byte-identical (`git diff --stat` empty) and everything went green again.
- **A first mutation attempt did not apply** — the anchor text I guessed was
  not what the fix commit had written, so the run proved nothing. It is
  recorded because that is the "mutation that does not mutate" trap, named in
  `HOW-WE-WORK-AND-HOW-WE-PROVE-IT.md` this same day, and I nearly reported its
  green as proof.
- **9 cases**, weighted at crying wolf rather than at catching: a column
  definition with a trailing period-comment (two real examples, verbatim from
  `0011` and `0153`), a whole-line comment, a multi-line `/* … */` banner (the
  real `0202:403`), a function body containing `RAISE NOTICE 'ends in a
  period.'`, and a decimal at end of line.
- **The tree-wide case asserts it READ something** — `files > 300` — because a
  guard that scanned nothing would also report nothing wrong.
- Clean over **381 SQL files**. 24 gates green by exit code; lint clean; full
  suite run.

## What this does not do

- **It does not validate SQL.** A statement can be perfectly commented and
  still be wrong; only applying it to a database proves it applies. The
  rls-isolation legs and the NAS replay do that, and they are what finally
  reported 0298.
- **It does not catch a dropped marker that ends in something other than a
  period** — a sliced header line ending in a comma or a word would pass. The
  rule is narrow because a wider one cried wolf ten times on its first run.
  **`re-review: 2026-10-30`** — if another marker-loss gets through in a shape
  this misses, widen it with that real line as the new case.
- **It does not address the deeper habit**: a script that slices a file by
  searching for a phrase will find that phrase in a comment. The durable fix
  there is to slice on a marker that cannot appear in prose, and that is a
  practice rather than a check.


## Postscript — I built the collision tool, then collided twice in one hour

This record was written as DR-1077 and is numbered DR-1080, because **both
1076 and 1077 were already taken** by records that landed on main while I
worked. DR-1079 — this session's own tool, written ninety minutes earlier —
exists to answer exactly that question before a number is taken, and **I did
not run it.** I took `maxRowId + 1` by hand, the way every one of the week's
nineteen collisions was taken.

It cost more than a rename. Recovering from it, I also:

- **committed six conflict markers into `INDEX.md`** — the precise thing
  DR-0644 was built after, and the thing its guard refuses. I ran
  `git add -A && git commit` while the resolver was failing, instead of reading
  why it failed. The index was rebuilt from main plus this branch's one row,
  and verified at zero markers.
- **nearly destroyed DR-1079 on the remote.** An earlier `git checkout -B
  <branch> origin/main` had quietly moved the local branch off the pushed
  commit; a `--force-with-lease` push at that moment would have wiped the
  pushed record while its pull request stayed open. Caught by checking
  ancestry before pushing rather than after.

Both are recorded because `HOW-WE-WORK-AND-HOW-WE-PROVE-IT.md` says a method
that only records its wins cannot be trusted to find its losses — and because
the lesson is sharper than the tool. **A tool nobody runs is a tool nobody
has.** DR-1079's own "what this does not do" already named the next step:
*"if the renumber count does not fall, the next move is to make the lane run
this before a decision file is written."* One hour of evidence says it should
not wait for the week.
