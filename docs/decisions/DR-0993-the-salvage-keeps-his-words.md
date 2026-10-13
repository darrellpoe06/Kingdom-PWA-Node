---
id: DR-0993
title: The salvage keeps his words — five superseded PRs closed, and the two things they still carried recovered
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0991]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, WORD-FIRST, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — the five supersession reads DR-0991 said each had to end in "close it" or "here is the one thing still missing"
---

## Context

DR-0991 added the fourth triage question and left five PRs flagged
`superseded?` with an explicit promise about how each would end:

> *"Each needs a read of what, if anything, it still carries that `main` lacks.
> Six reads, and the answer per PR is either 'close it' or 'here is the one
> thing still missing' — which is real work, not a sweep."*

This is those reads. Two ended in "close it" with nothing lost. Three carried
something, and two of those somethings are worth keeping.

## What was measured

**Per-PR, file by file against `main` (`303aaac4`):**

| PR | identical | `main` ahead | PR ahead | absent from `main` | verdict |
|---|---|---|---|---|---|
| #1731 | 2 | 4 | **0** | 0 | closed — would **regress** |
| #432 | 13 | 4 | **0** | 0 | closed — nothing lost |
| #311 | 0 | 6 | **0** | 0 | closed — nothing lost |
| #284 | 22 | 6 | 2 | 0 | cannot merge; one thing salvaged |
| #286 | 1 | 5 | 2 | 0 | cannot merge; one thing salvaged |
| #1196 | 2 | 4 | 1 | 0 | one thing salvaged |

**#1731 was the sharpest, and the regression would have been user-visible.**
Its two added files are byte-identical on `main`, so the work shipped. `main` is
ahead by **1,554** lines in `TTSControl.jsx` and **1,039** in
`use-read-aloud.js`. And the *entire* difference in `nav-history.js` is the
navigable route list:

```diff
- 'forecast', 'cohorts', 'tlc-assistant', 'health', 'cameras', 'vault',   ← main
+ 'forecast', 'cohorts', 'tlc-assistant', 'health',                       ← #1731
```

Merging it would have **removed `cameras` and `vault` from the route list** —
the browser BACK button would stop working on the Cameras surface (DR-0756) and
the Vault (DR-0762), both shipped after that branch was cut.

**#284 and #286 cannot be merged at all, and the number says why.** The files
where they look "ahead" are `poe-financial-mvp-v28.jsx` at **9,610** and
**9,626** lines against `main`'s **5,302**. That is not extra value; it is the
**pre-extraction monolith**. Merging either would restore ~4,300 lines the
hybrid-modular cutover peeled into modules — DR-0990's finding, now with a
figure on it.

**But #286's hardware doc carries Darrell's own stated goal, and `main` does
not.** Probed term by term against `main`'s copy:

| | on `main`? |
|---|---|
| *"the best PRIVATE, SOVEREIGN coding rig"* | **absent** |
| *"not cloud-grade"* | **absent** |
| *"Privacy / legal exposure"* (the PRIMARY driver) | **absent** |
| *"Cloud-parity is explicitly NOT the bar"* | **absent** |
| *"air-gappable"* | **absent** |
| `Qwen2.5-Coder 32B` | on `main` (×4) |
| `Phase 0` | on `main` (×1) |

So `main` carries the earlier draft and the PR carries the **privacy-primary
reframe** — his goal, in his words, with the three drivers in his order. That
sat in a closed branch for nearly four months.

**#1196 carries 9 real lines**: a `sudo -n -l` read of grant breadth and a
`/etc/crontab` check for whether the fleet's clock is registered, both with
DR-0272's stated reasoning attached — *"a permission denial is itself the answer
… never a guess."*

## Impact

Three PRs closed that could only move `main` backwards, one of them by breaking
the Back button on two live surfaces. And two pieces of real content recovered
from branches that were about to be closed — one of them Darrell's own statement
of what he is trying to buy and why, which CLAUDE.md is explicit about:
*"A spoken word that goes uncaptured breaks the covenant this rule records: he
speaks it here BECAUSE it gets built."*

## Decision

1. **#1731, #432 and #311 are closed** with preserving comments carrying the
   per-file counts and, for #1731, the exact route-list diff. Branches kept.
2. **His goal is recovered into `main`'s hardware doc** — §0 gains the quoted
   goal and the three drivers in his priority order, attributed and dated
   2026-06-23, with a line saying where it was recovered from and why.
3. **The hardware specifics are NOT imported as current.** Prices, tok/s
   figures, the 5090-vs-Spark comparison and the agent config in that PR are a
   **June 2026 snapshot**, four months stale. The recovered block says so
   explicitly and defers to re-verification before any purchase. Importing
   stale numbers as live would be the DR-0076 failure dressed as diligence.
4. **#1196's 9 DR-0272 diagnostic lines are grafted** into
   `nas-bootstrap.yml`, located by their own anchor line rather than by line
   number, with the YAML re-parsed after.
5. **#284, #286 and #1196 stay OPEN**, because each still holds work this
   change did not take: #284's Feature/Workflow REGISTER, #286's Concerns
   Board, #1196's drainer-state logic. They are now **rebuild** candidates
   (DR-0990) with their salvageable part already landed, not supersession
   candidates. `re-review: 2026-10-20`.
6. **NOT done: a guard for this.** "Does `main` already say this in other
   words?" is not machine-checkable — the probe that settled #286 was a
   hand-chosen list of its own distinctive phrases. The record names that
   rather than pretending a gate could do it.

## Verification

- **Per-file counts come from a real comparison** of every changed file in each
  PR against `main` — identical / `main`-ahead / PR-ahead / absent — not from
  the PR diffs, which only say what changed on the branch.
- **#1731's regression is quoted, not characterized**: the route-list diff is
  reproduced above and the two surfaces it would un-route are named with their
  DRs.
- **BOTH of my first two reads of #286's doc were wrong, in opposite
  directions, and only a targeted probe was right.** A line-level
  `diff | grep '^>'` said `main` lacked the content — over-claiming, since many
  of those lines are rephrasings. A glance at `main`'s section headings plus a
  keyword count ("20 mentions of private/sovereign") said `main` already had
  it — under-claiming, since those matches were "sovereign mesh" and unrelated
  senses of "private". Probing eight of the PR's own distinctive phrases
  settled it. The lesson is the night's: a line diff cannot tell *"absent"* from
  *"said differently"*, and a keyword count cannot tell *"present"* from
  *"present in another sense"*.
- The graft is anchored on its preceding line and asserted present before
  splicing; `yaml.safe_load` parses `nas-bootstrap.yml` afterwards (one
  `bootstrap` job).
- `verify:gates` green.
- **Not verified:** that the recovered §0 block reads well in the rendered doc.
  It is Markdown blockquote and the live-review pass (DR-0104) is where a
  surface is read as a reader meets it.
- **Not verified:** whether #284's and #1196's remaining work is still wanted.
  That is the rebuild judgment DR-0990 reserves, and three to four months of
  drift makes it a real question rather than a formality.

## Links

[DR-0991] (the `superseded?` question and the promise these reads keep),
[DR-0990] (drain vs rebuild — and the 9,610-vs-5,302 figure that proves its
monolith question), [DR-0756] / [DR-0762] (the Cameras and Vault surfaces #1731
would have un-routed), [DR-0272] (the open-verification lines salvaged from
#1196), [DR-0076] (why four-month-old prices are not imported as current),
CLAUDE.md "Spoken Teachings Are Build Input" (why his goal was recovered rather
than closed with the branch).
