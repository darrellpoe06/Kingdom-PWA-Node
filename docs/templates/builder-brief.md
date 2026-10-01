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
REPORT: what changed, the evidence, and anything left with its named blocker.
```

## For a lesson builder, add this line

```
WHO TAUGHT (DR-0719): Name the teacher from the speaker marks (DR-0712: voice:BG) or the recording; when it is Bishop Gwin, say Bishop Gwin or BG, never 'the teacher' alone; never assume who taught.
```

Being at the weekly 1 p.m. Bible study at The Church of the Living God does not by itself mean Bishop Gwin taught. Where someone else taught, name them as the recording does; where no one is identified, say so.

## What the orchestrator does after sending it

1. Watch the session's first real output (a commit, a PR, a comment) before calling it working (P66).
2. Stop it at once if it works outside OUTCOME or MUST NOT TOUCH (P67).
3. Measure before holding work back for resources, and name the number (P65).
