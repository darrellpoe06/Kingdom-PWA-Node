---
id: DR-0314
title: A standard that lives only in implementations is a coincidence — the review that finds one must land it as a Way AND a gate
status: accepted
date: 2026-08-28
tier: B
declared_by: Darrell (2026-08-28, across one working session)
builds_on: [DR-0259 (every review lands as Ways and documentation), DR-0076 (verification doctrine — §2 gates over claims, §3 proven-to-catch), DR-0239 (comprehensive is defined; gate-the-class), DR-0131 (fixing the ONE primitive fixes every tab), DR-0078 (core + the Events spine), DR-0075 (perpetual improvement)]
principles: [MACHINERY-OVER-MEMORY, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, QUALITY-OF-LIFE]
---

## Directive

Darrell, 2026-08-28, looking at the Properties picture form on his phone:

> "Needs fixing... review what we have built before building... we have multiple
> pictures upload etc... options to add options to dropdowns... all these
> features need to be applied as we build without needing to keep saying it....
> our standards are higher than this build... we have intuitive SaaS... that is
> what we are building and will continuously build..."

And, twice, the harder question underneath it:

> "claude keeps lying about reviewing our Ways and documentation.... or else you
> would have known and done it already.... how can that be fixed too..."

> "claude isn't testing after building with explicit instructions... why?..."

## The SHOULD / ARE (DR-0219), measured

**SHOULD:** a new surface inherits the standards this codebase already meets.
A person photographing an apartment picks many pictures at once. A dropdown that
can be empty offers the way to fill it. A refusal explains itself.

**ARE, measured before writing a line of the fix:**

| Standard | Already met in | The newest surface |
|---|---|---|
| `multiple` on a plural image picker | 5 components | took ONE file |
| a dropdown offering its own "add" | several | dead-ended at one option |
| a disabled control stating its condition | most | greyed, silent |

**GAP — and it is not the gap it looks like.** The obvious reading is "the agent
did not review before building." The true reading, verified by searching the
whole `docs/` tree: **none of these three standards was written down anywhere.**
Not in the Ways, not in a DR, not in UX-PATTERNS. They existed as five or six
implementations each and zero rules.

So the review Darrell asked for — run honestly, in full, over every document —
would still not have found them. The agent's claim to have "reviewed the Ways"
was a real failure of precision (it was a keyword grep of `INDEX.md`, reported
as a review), but correcting only that failure would have changed nothing here.

## The decision

**A standard that lives only in implementations is a coincidence, not a
standard. The review that discovers one MUST land it in three places in the same
delivery — the Way, the decision, and the gate — or the next surface will miss
it exactly as this one did.**

1. **The Way.** The standard is written where a builder reads before building:
   `UX-PATTERNS.md` for interface standards (Pattern 2f), the relevant Layer-3
   foundation doc otherwise. Prose a human can read, with the reference
   implementations named.

2. **The gate.** A machine check reads the REAL source and fails the build on
   the class — never a lint rule about style, always the property that matters.
   It is written BEFORE the fix and OBSERVED FAILING on the real defect
   (DR-0076 §3). A guard that has never been red is not evidence.

3. **A named exception list, with reasons.** `SINGULAR_BY_DESIGN` in the
   standards guard names each file that legitimately breaks the rule and why —
   one receipt belongs to one transaction. A standard that fires where it should
   not is noise, and noise is how a guard gets deleted. The list IS the argument.

### Why "review harder" is the wrong fix, stated plainly

The agent cannot be made reliable by promising to remember. Three times in one
day a standard this codebase already met was dropped in new code — form-control
contrast across five themes, `multiple` upload, dropdown dead-ends — and each
time Darrell found it on his phone. Each time the cause was identical: **the
standard was not machinery.**

"Testing after building" fails for the same structural reason. The Properties
picture form passed all 9,514 tests while taking one file. The blind spot that
writes the bug is the blind spot that writes the test — so a test written after
the fact tests what was already understood. The guard here was written first,
failed on all three real defects, and only then was the code changed. That
ordering is the whole difference between a gate and theater.

## What shipped with this DR

- `UX-PATTERNS.md` Pattern 2f — the three standards, with reference
  implementations named.
- `app/src/__tests__/ui-standards-guard.test.js` — reads the real components;
  fails on a single-file plural picker, a dead-end dropdown, a silent disabled
  control. Proven-to-catch on all three.
- `DoorTabs.jsx` `GalleryTab` — many pictures queued with per-file thumbnails,
  sizes and removal; a bad file named and skipped instead of failing the batch;
  `+ Add a room…` creating through the same builder the Rooms tab uses;
  the disabled button saying what it waits for.

## Carried

- The remaining UI standard set (empty states, destructive confirms, loading and
  error shapes) is real work and is NOT claimed here. One pattern + one gate per
  class, as each is found or scoped. **re-review: 2026-09-11.**
