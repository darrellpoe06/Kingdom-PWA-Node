# DR-0956 — A guard that reads one of its two inputs is not a guard

**Date:** 2026-10-11 · **Status:** Accepted
**Code:** `scripts/migration-replay-order-guard.mjs`, `.github/workflows/ci.yml`
**Gates:** `app/src/__tests__/migration-replay-order.test.js`

## Context

PR #2112 (DR-0952, 0273) went red on CI's `door-work` leg:

```
psql:0154-photo-captions-editable-and-archivable.sql:217:
  ERROR:  cannot change return type of existing function
  DETAIL:  Row type defined by OUT parameters is different.
  HINT:  Use DROP FUNCTION public_vacancy_photos(uuid) first.
```

**The rule this breaks was already written, and already enforced — on the other
file.** `migration-replay-order-guard` exists for exactly this class, and when
0273 was built it caught the identical collision on `rls-isolation.yml`. The fix
went where the guard was looking. `ci.yml` replays migrations too, the guard had
never read it, and so the second leg shipped broken.

The guard's own header documents three earlier versions of this same miss, and
names the lesson: *"a guard that cannot see part of its own input is the P55
shape again."* This is the fourth.

## What was measured

Executed on a real **PostgreSQL 16.15**, replaying the `door-work` leg's chain
exactly as CI does:

1. Chain through 0270, then 0160/0161, then **0273 twice → `SHARED HOME SMOKE:
   PASS`**.
2. Replay 0153, then **0154 with no drop → the CI error reproduced byte for
   byte**, same file, same line 217, same hint.
3. With `DROP FUNCTION IF EXISTS public.public_vacancy_photos(uuid)` first →
   0153/0154 apply, 0271 twice, **`PHOTO DATES SMOKE: PASS`**.
4. **The revert is real, and this is the number that matters:** after the 0154
   replay, `from_sibling` on `public_vacancy_photos` is **GONE** — count `0`.
   The function is back to four columns, so **a door would silently stop
   borrowing its sibling's pictures.**
5. Re-apply 0273 twice → **`SHARED HOME SMOKE: PASS` again.**

Why a shell leg needs its own reader: `rls-isolation.yml` declares legs as a
matrix (`- feature: … migrations: "…"`), while `ci.yml` writes plain shell —
`for f in A.sql B.sql; do psql … $f; done`. Same hazard, unrecognisable syntax.

## Impact

Two costs, and the second is the larger one.

**The leg was red for an hour** on a PR that was otherwise green, and `app —
lint + vitest` is the required gate, so DR-0952 could not reach `main` — which
means the shared-home listing could not reach Darrell.

**And the guard was reporting OK while the thing it exists to prevent was
happening.** That is worse than no guard, because the green check is read as an
answer (DR-0076 §3). A gate that cannot see a surface is not protecting it.

## Decision

1. **The guard reads both workflows.** `shellLegs()` parses `ci.yml`'s shell
   replay legs — both forms, the inline `migrations-auto/<file>.sql` path and
   the `for f in …` list — in the order the shell runs them. Only a file that
   really exists counts, so a filename in prose cannot invent a step, and a
   commented line is not a step.
2. **The shell check is POSITIONAL, and stricter than the matrix one.** A
   matrix leg has only a leg-level `pre`; a shell leg's drops and applies
   interleave in one readable order, so a drop counts **only where it actually
   falls**. A drop after the clash does not excuse it — something the matrix
   check cannot tell apart.
3. **`door-work` drops the function before replaying 0153/0154.**
4. **And the leg proves the chain CONVERGES.** 0273 goes on again afterwards
   and **its smoke runs a second time**, because a replay that does not error
   is not the same as a chain that ends where it should — step 4 above is
   exactly that gap, measured. This follows DR-0944: halfway through a chain is
   a real state somebody can read.

## Verification

**29 green** in the guard's own suite (9 new). The widened guard reproduces
CI's failure from a local run, naming the job, the file, the function and the
remedy; and the whole leg was executed against real PostgreSQL 16.15 as above.

**Proven to catch**, by deleting the one `DROP` line from `ci.yml`:

- the guard CLI fails, naming `ci.yml job "door-work"`, `0154`, `0273` and the
  exact `psql -c 'DROP FUNCTION …'` to add;
- two live-repo cases in the suite go red with it.

And on synthetic legs: a newer shape then an older with no drop between is
caught; a drop **between** them passes; a drop **after** the clash still fails;
a file that drops what it defines may be replayed back to back (0273 does);
a same-shape redefinition needs no drop, since dropping needlessly discards
grants.

Two cases keep the rule from going idle rather than passing quietly: that
`ci.yml` has replay legs at all, and that `door-work` genuinely carries two
shapes of `public_vacancy_photos` with a drop between them.

**Not proven from this sandbox:** nothing material — this one is fully
measurable here, and was measured.

## The standing question this raises

Both of this evening's other findings were the same shape: a gate pinning the
old code rather than the behaviour (DR-0955), and now a gate reading one of two
inputs. **The question to ask of any new gate is not "does it pass" but "what
is it not looking at".** `replay-completeness-guard` and the other
workflow-reading guards are worth the same audit — do they read every workflow
that does the thing they police? **re-review: 2026-10-18.**
