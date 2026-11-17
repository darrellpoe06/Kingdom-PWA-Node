# DR-1518: The HEAD is read without git

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (one census function; no migration, no new road, no new secret)
**Type:** decision
**Area:** `infra/nas-loops/lesson-queue-census.py`
**Measurement:** `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-1517 (the field this makes actually arrive), DR-0076 §8 (unknown is never an answer), DR-1269 (the keyless replay road), DR-0621 (a flag is where the work starts)

## Context

DR-1517 shipped `census_code_sha` as `git -C <repo> rev-parse HEAD` so a verdict
could be read against the code that produced it. On the live road the field
never arrived.

## What was measured

- **59 minutes, about four services-sync cycles, and still absent.** DR-1517
  merged 09:28:01Z; reads at 10:12 and 10:26 both printed *the census did not
  name its own code*.
- **It is not a pull delay, and there is a counter-example.** DR-1511's census
  change reached the box and showed in the receipt **16 minutes** after its
  merge — one cycle. Code refresh works; this one call was failing.
- **Every likely cause is a property of the subprocess**, not of the question:
  `git` off the PATH of whichever user the clock runs the census as, or git
  refusing a mirror it does not own — *fatal: detected dubious ownership*. The
  shape test turned that prose into `None`, which is why the reader said
  UNKNOWN instead of publishing a sentence.
- **The answer is in files.** `.git/HEAD` is a symbolic ref, the ref file holds
  the sha, `packed-refs` holds it once the loose ref is packed away.

## Impact

The field can arrive. No PATH, no ownership check, no subprocess on the path
that matters — and DR-1517's honesty is preserved: still absent, never faked.

## Decision

1. **Read the files first; `git` is the fallback**, because the subprocess is
   the part that failed in practice.
2. **Three file shapes are handled** — a detached HEAD, a loose ref, a packed
   ref — and a peeled `^` line is never mistaken for the ref.
3. **Unreadable still means absent.** Nothing is inferred from a repo that
   cannot be read.

## Verification

- 64 Python cases, 8 new. A test harness that **raises if `git` is called**
  proves the files are asked first, not merely preferred.
- **Proven to catch:** git answering *fatal: detected dubious ownership in
  repository…* reads `None`, so the refusal this record exists for cannot
  publish prose as a sha.
- A HEAD that is neither a sha nor a ref, a missing ref file with no
  packed-refs, and a missing `.git` all read unknown rather than raising.
- **Not claimed:** the cause on the NAS is **not** confirmed — I cannot reach
  the box. What is measured is that the subprocess form never answered in four
  cycles while a file read cannot fail for any of those reasons. The next
  census stamped with a sha is the proof. `re-review: 2026-11-24`.
