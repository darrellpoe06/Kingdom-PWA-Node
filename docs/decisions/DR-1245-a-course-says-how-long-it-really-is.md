# DR-1245: A course says how long it really is — the format line said 9 sessions against 48

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `app/src/lib/sovereign-ai-class.js`, `app/src/__tests__/a-course-says-how-long-it-really-is.test.js`
**Follows:** DR-0677 (the count is derived, never a literal)

## Context

Reported by a builder agent finishing sov51, as a finding it deliberately did
not fix to avoid widening its one-lesson scope: `SOVEREIGN_AI_META.format` read
**"9 weekly sessions"** while the course held 48.

## What was measured

`church-classes.js:526-530` renders a course's `meta.format` and then, **two
lines later**, a `**Length:**` line counted from the modules themselves. So this
was not a stale string that merely under-reported — the same exported document
contradicted itself in adjacent lines:

```
**Format:** 9 weekly sessions · ~75 min each …
**Length:** 48 weekly sessions · ~75 min each
```

All six courses whose `format` states a count were measured against their own
module arrays, not just the one reported:

| course | said | real |
| --- | --- | --- |
| economics | 8 | 8 |
| infrastructure | 10 | 10 |
| **sovereign-ai** | **9** | **48** |
| broadcast | 9 | 9 |
| succession | 5 | 5 |
| ai-legal-blueprint | 6 | 6 |

Five were right. One was wrong by 39 sessions.

**Why nothing caught it is the useful part.** The literal sat **two lines above
a comment that already forbids it** — DR-0677's note on `weeks`: *"the count is
the series' own length, read at use — never a literal a new lesson must edit."*
The principle was written down, adjacent, and the violation still shipped,
because a comment is not a check.

## The decision

1. `format` becomes a getter deriving its count from `this.weeks`, exactly as
   `weeks` derives from the array. It survives `JSON.stringify` and spread
   (verified, not assumed), so every existing reader is unaffected.
2. The property is gated for **every** course that states a count, not only the
   one that was wrong — the next course added is the one that will drift.

## Verification — proven to catch

Restoring the literal `'9 weekly sessions'` fails two cases with the sentence
*"sovereign-ai says 9 sessions but holds 48"*; restored, 9 pass.

The gate is built so it **cannot pass vacuously**: a course stating no count at
all returns early (that is honest), so a separate case asserts at least five
courses do state one — otherwise stripping every number everywhere would leave a
suite of silent early-returns reading green (DR-0076 §3). A fourth case feeds
the parser each of the three real phrasings in use (`9 weekly sessions`,
`Self-paced or 8 sessions`, `6 sessions`) plus a string with no number, since a
parser matching none of them would make every other case a no-op.

Rendered output checked directly: both lines now read `48 weekly sessions`.
Also green: `church-classes` and `sovereign-ai-class` (38 tests), lint exit 0,
`verify:gates` exit 0.

## Impact — what this obligates, and the limits named rather than left

A reader of the exported course document was told two different lengths two
lines apart, and the wrong one was the headline. What the fix obligates is
small and permanent: the count is now derived, so **no new lesson may
reintroduce a literal there** — and the gate holds that for every course, not
just the one that broke. The limits:

- The count moves with the array, so when sov51 (#2432) lands this reads 49 with
  nothing edited — which is the point. The `~75 min each` and the prose around it
  are still literals; they are not derivable from anything and are not claimed to
  be checked.
- This gate reads the six course metas by import. A seventh course is covered
  only when it is added to the list — the honest weakness of a hand-kept
  registry, and the reason the vacuity case pins a floor of five rather than
  trusting the list to be complete.
