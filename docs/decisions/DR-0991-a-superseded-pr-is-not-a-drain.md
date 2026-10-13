---
id: DR-0991
title: A superseded pull request is not a drain — seven of 41 would have regressed main, and neither existing tool could see it
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0990, DR-0146]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — PR #789, found while choosing the next drain under DR-0990's corrected rule
---

## Context

DR-0990 corrected DR-0986's selection rule to three structural questions and
produced a list: 24 drain, 19 rebuild. Taking the oldest small `DRAIN` from that
list led to **PR #789**, *"The Love Corner door is APPROVED and shipping
(DR-0174)"* — 7 files, 236 insertions, and its decision record already on `main`,
which looked like the ideal next drain: small, and its product question already
answered.

It was not a drain. It was already shipped, and merging it would have gone
backwards.

## What was measured

**PR #789's own body says it:** *"shipped via PR #787."* **#787 merged
2026-07-11T21:49:37Z** — the same day #789 was opened. Every line verified
present on `main`:

| what #789 adds | on `main` |
|---|---|
| `SHARE_DOOR_URL = 'https://poetech.us/lovecorner/'` | `church-own-door.js:37` |
| `SHARE_DOOR_ALIASES = ['/church', '/thelovecorner']` | `church-own-door.js:38` |
| `INSTALL_MANIFEST = '/manifest-lovecorner.webmanifest'` | `church-own-door.js:44` |
| `phase-install-identity` → `status: 'verified'` | `church-own-door.js:200` |
| `DR-0174` cited | 4 times in that file |
| `app/public/lovecorner/index.html` | present |
| `manifest-lovecorner.webmanifest` | present |
| `/lovecorner` redirects | 23 lines in `_redirects` |
| `DR-0174-…md` | present, **byte-identical** to the PR's copy |

**And merging it would have REGRESSED the door**, not been a no-op: `main`'s
`lovecorner-door.test.js` differs from the PR's by **165 lines** and
`church-own-door.js` by **66**, in main's favour. The PR would have dragged the
church's front door back toward its 2026-07-11 shape — the door the congregation
uses, ahead of the National Assembly.

**Neither existing tool could see it:**

- `pr-janitor` (DR-0146) closes only *provably empty* PRs
  (`git diff --quiet origin/main...branch`). #789 is **not empty** — its diff
  against its **own merge-base** is real. It is `main` that moved. The emptiness
  test asks the wrong question for a PR whose content shipped by another route.
- `drain-triage`'s three questions (DR-0990) ask about the frozen monolith, the
  budget ceiling and migration ordinals. None of them notices that the work
  already landed.

**Across the backlog, with the fourth question added:**

| | before | after |
|---|---|---|
| drain | 24 | **17** |
| rebuild | 19 | **17** |
| superseded? | — | **7** |

Seven PRs read as drainable and would have been merged into a regression:
**#284, #286, #311, #432, #1196, #1731, #2059**.

## Impact

Seven live invitations to walk `main` backwards, each wearing a green check and
a plausible title. #789 is the sharpest: a door the congregation actually uses,
regressed by 165 lines of test and 66 of logic, in service of "draining the
backlog."

This is the third time in one night that a *plan* — not a check — was the thing
at fault. DR-0990 caught a plan that would have raised the frozen monolith
ceiling; this catches a plan that would have regressed shipped work. The gates
were right both times.

Nothing is damaged: none of the seven is on the merge path.

## Decision

1. **A fourth question joins the triage: is every file it ADDS already on
   `main`?** If yes, the verdict is **`superseded?`** — with the question mark,
   deliberately. Only a reader can say whether the PR still carries something
   `main` lacks; the tool flags and stops.
2. **The structural reasons are reported ALONGSIDE it, not instead.** The first
   version returned early, so #286 — which is *both* superseded-looking and a
   frozen-monolith toucher — reported only the supersession, throwing away
   exactly what a reader who rules out supersession needs next. Caught by
   reading the tool's own output, and now asserted in a test.
3. **PR #789 is closed with a preserving comment** naming #787, the merge
   timestamp, the nine verified facts, and the regression it would have caused.
   Branch kept, per `pr-janitor`'s convention.
4. **`pr-janitor` is NOT changed.** Its emptiness test is correct for what it
   does — *"real work is never auto-closed (DR-0076: the diff is the evidence)"*
   — and widening it to close on "looks superseded" would auto-close work on a
   heuristic. Supersession is read by a person; emptiness is proven by a
   command. The record names the gap rather than papering it with automation.
5. **NOT decided: what becomes of the other six.** Each needs a read of what,
   if anything, it still carries that `main` lacks. Six reads, and the answer
   per PR is either "close it" or "here is the one thing still missing" — which
   is real work, not a sweep. `re-review: 2026-10-20`.

## Verification

- **Every fact checked against `main`, not inferred**: the three exported
  constants and the `verified` status read by line number out of
  `church-own-door.js`; the door page, manifest and 23 redirect lines listed on
  disk; `DR-0174` confirmed byte-identical with `diff -q`; #787's merge
  timestamp read from the API.
- **The regression is measured, not asserted**: 165 differing lines in the test
  and 66 in the lib, counted with `diff`, and main is the newer side.
- **The PR told on itself and I read it** — *"shipped via PR #787"* is in its own
  diff. The title said "APPROVED and shipping", which I had taken as the reason
  to pick it; the body said it had already shipped. Third time tonight a title
  pointed one way and the content another.
- **20 tests** on the pure classifier, including: the superseded shape flagged;
  a PR adding something new NOT flagged; a PR that only modifies NOT flagged;
  the verdict ending in `?`; the caller omitting `added` still working; and the
  early-return flaw pinned so reasons must accumulate.
- **The whole-backlog numbers come from a real run** of
  `node scripts/drain-triage.mjs` against 41 open PRs, not from a sample.
- **Not verified:** whether any of the six still carries something `main` lacks.
  That is decision 5's work and cannot be answered in aggregate — which is
  exactly why the verdict is a question.
- **Not verified:** that "every added file exists on main" has no false
  positives. A PR could legitimately add a file `main` happens to have under the
  same path with different content — that is why it flags for a read rather than
  closing anything.

## Links

[DR-0990] (the three structural questions this extends, and the corrected
selection rule), [DR-0146] / [DR-0148] (pr-janitor's provable-emptiness test —
correct for its own job, and blind to this), [DR-0989] (the one PR that genuinely
drained), [DR-0174] (the Love Corner door, shipped 2026-07-11 via #787),
[DR-0986] (why the backlog is being worked), [DR-0076] (the diff is the evidence
— why supersession is read and emptiness is proven).
