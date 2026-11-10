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
  2026-10-01 without them (DR-0733, app/src/lib/talk-together.js). EVERY BAND, not only the
  module pooled: a reader reads ONE band, so the lesson's own pinned test asserts the three
  directions by their literal text on the lesson AND on each band, and the catalog gate names
  any band that is short (DR-0795, hasAllThreeEverywhere / placesMissingDirections). Prove it
  catches: strip one band's friend line alone and the per-band check must name that band while
  hasAllThree(module) still reads green. anchor.ref names every
  verse the lesson stands on, because Search it out derives its links from those references
  and never from typed lists (DR-0734); the close sends the reader back into the text.
  Growth is measured the Word's way, qualitative (fruit, Galatians 5:22) and quantitative
  (occasions and days, Deuteronomy 6:7; Hebrews 3:13), never imported.
GENERATED FILES (never hand-edited): regenerate app/src/lib/lesson-dates.json with
  `npm run lesson-dates` and the course-band baseline with
  `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs`. CI catches a missing
  lesson-dates entry that a local run does not.
SESSION NOTE: a lesson note under docs/99-session-notes/ carries a `**Module id:** `ll…``
  line naming the module it documents (living-lesson-notes-name-their-module gates it).
REPORT: what changed, the evidence, and anything left with its named blocker.
```

## For a lesson builder, add this line

```
WORD FIRST (DR-0127 / DR-0282; Darrell 2026-11-05: "Lessons are Word first and research independently"): the lesson OPENS with Yahweh's frame in words, not a borrowed anchor and not a bare citation. The source's item is the occasion; the Word is the foundation and the authority (DR-0098). Find the ground in Scripture and teach it from Scripture's own usage. `word-first-coverage.test.js` is the gate.
RESEARCH INDEPENDENTLY - TRUST BUT VERIFY (DR-0190; Darrell 2026-07-20: "Also do our own separate research on the cited research etc... Trust but verify"): a forwarded article, newsletter or digest is a LEAD, NEVER THE CITATION. Before the lesson teaches, states, or even repeats as the source's own words any external factual claim it leans on:
  1. Find the PRIMARY source - the filing, the study, the agency series, the maintainer's advisory - not the publication that summarized it. A news article about an earnings release is not the earnings release.
  2. TIER every claim (DR-0100): established fact (stated plainly, cited) / attributed ("the company reported", never asserted on our own authority) / unverified or over-claimed (NOT taught as fact - dropped, or named as circulated-but-unconfirmed).
  3. A lesson may NOT rest its landing on a claim nobody checked. Measured 2026-11-05 (DR-1326): ll281 was built from a business digest with no road to a primary source attempted, and three of its four load-bearing claims did not survive checking - the one its whole teaching turned on ("the borrowing reached the highest level ever recorded") was BACKWARDS against FINRA's own margin table, which showed the largest one-month DROP in the series.
  4. Carry the trust-but-verify note (DR-0190 §5): what was checked, the primary source, the tier each claim landed in, and what the checking CHANGED. `living-lessons-research-integrity.test.js` gates it.
  5. Do not under-claim either (DR-0100): a claim that checks out stronger than the source hedged is stated plainly. The verified fact is often better than the one you were handed.
  6. If the egress proxy blocks a primary host, say which host, say the read was not independent, and leave a dated re-review - never let a blocked road read as a verified claim (DR-0076 §8).
WHO TAUGHT (DR-0719): Name the teacher from the speaker marks (DR-0712: voice:BG) or the recording; when it is Bishop Gwin, say Bishop Gwin or BG, never 'the teacher' alone; never assume who taught.
ALREADY SHIPPED (DR-1250 / DR-1270 / DR-0610): before building ANY inbox row, run `node scripts/lesson-row-shipped-sweep.mjs <row-id>...`. It exits 1 and names the decision record when a row is already a shipped lesson. A SHIPPED or SHIPPED? row is NOT built - read the record it names and report. Seen doing real work 2026-10-28 (P66): swept 22 rows, named 20 already live, agreeing with an independent sweep by hand.
THE WAITING LIST COMES FROM THE NAS ROAD ONLY (DR-1270 / DR-1249): `inbox-lessons-waiting.yml`. The hosted Supabase project is a DIFFERENT, divergent store - measured 2026-10-28, it listed 22 rows as waiting of which 20 were already live lessons, and showed a row still `lesson-building` that the NAS road had already built and tagged. Never take a waiting list, a tag or a body from it. A read that FAILS is UNKNOWN, never an empty queue.
```

Being at the weekly 1 p.m. Bible study at The Church of the Living God does not by itself mean Bishop Gwin taught. Where someone else taught, name them as the recording does; where no one is identified, say so.

## What the orchestrator does after sending it

1. Watch the session's first real output (a commit, a PR, a comment) before calling it working (P66).
2. Stop it at once if it works outside OUTCOME or MUST NOT TOUCH (P67).
3. Measure before holding work back for resources, and name the number (P65).

## Before building a forwarded teaching: ask the repo, not only the label

**Added 2026-11-10 after ll300 (DR-1413).** The Gmail lane's lock is the
`Lesson-Captured` label, and the lane's instruction is to read the thread's own
`labelIds` and skip it if the label is there. That is right, and it is not
enough: ll300 was built, merged and deployed while its label stayed **unwritten**,
because the write needed an approval the building session could not grant. A
thread with no label and a lesson already in the app is exactly the state that
produces a duplicate, and on 2026-10-11 a broken label query put twelve threads
in that state at once.

So the label is one witness and the ledger is the other. Run both:

```
node scripts/lesson-already-built.mjs --thread <the 16-hex Gmail thread id>
```

`ALREADY BUILT — the thread is named in the ledger` means a decision record
already names that thread, and it names the record and the lesson id. It answers
with Gmail unreachable and with the label missing, because DR-0076 §8 requires
every forward-built record to carry its thread id. A malformed id is refused
rather than reported as nothing found — the one wrong answer here is a false
"nothing matched", which costs a duplicate lesson in the congregation's app.
