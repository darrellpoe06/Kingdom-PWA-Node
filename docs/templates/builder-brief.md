# Builder brief (the template every spawned session and routine prompt starts from)

**Why this exists (DR-0697, 2026-09-30).** A child session sent to run one UPDATE began drafting a migration and scripts and had to be stopped (LESSONS-LEARNED P67). Darrell: *"Add reviewing the DRs... so we don't repeat obvious failures... unless we have another way..."* A brief names its one outcome, what it must not touch, and what to read first. `app/src/__tests__/builder-brief-template.test.js` keeps this template honest.

Copy the block below and fill every angle-bracket field. Leave none blank.

```
You are a builder for darrellpoe06/Kingdom-PWA-Node. Read CLAUDE.md first; it is binding.

OUTCOME (one): <the single thing that is true when you are done, and how it is proven>
DONE WHEN: <the evidence: a merged PR and its deploy run on the merge SHA, a query result, a test>
MUST NOT TOUCH: <files, tables, workflows or decisions outside the outcome>. If the outcome
  seems to need them, stop and report instead of widening the work.

READ FIRST (before any edit):
  - docs/00-foundations/_root/LESSONS-LEARNED.md: the principles for this area, <P-numbers>
  - docs/decisions/<DR files that govern this area>
  - The required-reading hook hands you the same pointers when you write in a mapped area.

BRAKES: budget <wall-clock or item ceiling>; lock <what makes a second run skip>;
  stop <what ends the run early>.
FEATURES: Moving or restyling a control: update its registry entry's locator; never drop it.
  (app/src/lib/feature-registry.json, DR-0726. A new control gets an entry; a removal
  moves its entry to "removed" with removedBecause and a DR. The vitest gate fails otherwise.)
LESSONS (when the outcome is a lesson): all four age bands (P60); the lesson AND each band
  end with TALK ABOUT IT TOGETHER in the lesson's OWN words, all three directions — parents
  to children, children to parents, friend to friend — each with the skill (ask, listen to
  the end, retell, teach one verse) and the rhythm (once today in one of Deuteronomy 6:7's
  four places; one friend this week); the gate refuses a lesson added on or after
  2026-10-01 without them (DR-0733, app/src/lib/talk-together.js). anchor.ref names every
  verse the lesson stands on, because Search it out derives its links from those references
  and never from typed lists (DR-0734); the close sends the reader back into the text.
  Growth is measured the Word's way, qualitative (fruit, Galatians 5:22) and quantitative
  (occasions and days, Deuteronomy 6:7; Hebrews 3:13), never imported.
REPORT: what changed, the evidence, and anything left with its named blocker.
```

## What the orchestrator does after sending it

1. Watch the session's first real output (a commit, a PR, a comment) before calling it working (P66).
2. Stop it at once if it works outside OUTCOME or MUST NOT TOUCH (P67).
3. Measure before holding work back for resources, and name the number (P65).
