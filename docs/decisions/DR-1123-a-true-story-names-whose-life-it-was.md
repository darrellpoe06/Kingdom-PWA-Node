# DR-1123: "A true story" names whose life it was — 88 of them name nobody, and the page claims their consent anyway

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one scanner, one gate, one list for the Governor; not one word of any story changed, no surface, no schema, no money)
**Type:** bug

**Area:** `scripts/testimony-carries-its-source.mjs` (new), `app/src/__tests__/a-true-story-names-whose-life-it-was.test.js` (new), `docs/99-session-notes/2026-10-20-whose-life-is-this.md` (the list).

**Answers the re-review in:** DR-0550, due today — *"sweep the lessons built from his lived accounts for other checkable details (days, counts, names, places) and put each one in front of him rather than in front of a gate."*
**Principles:** DR-0811 (a parable is never a record, and never wears a real name; his testimony is his own); DR-0215 / `PARABLE-AND-TESTIMONY-METHOD.md` (a testimony requires that it happened, explicit consent, privacy); DR-0076 §4 (measure, don't claim) and §3 (proven-to-catch); DR-0190 (provenance); Revelation 12:11 (*"the word of their testimony"* — the reason a true story is told at all).

## Context

DR-0550 is a correction Darrell made from his phone, reading L181 at step 5 of 12:
*"Choir rehearsal was on Thursday today is Saturday... fix the lesson..."* The
lesson said Tuesday, in four fields. Its closing paragraph is the reason this
record exists: *"This class of error — a real detail about a real event, recorded
wrongly, with nothing in the house able to check it — has no general gate and
cannot have one. No test can know what day a rehearsal was. The only instrument
is the person who was there."* It set today's date to sweep for more of them.

The sweep found something before it reached the days and counts.

## What was measured

Measured 2026-10-20 on main `4ef997c44`.

| | |
|---|---|
| Shipped `kind: 'testimony'` blocks | **93** |
| Carrying a `source` | **5** — all five Darrell's, all in `living-lessons-class.js` |
| Carrying **none** | **88** |
| Of those 88, written in the first person | **52** |
| Of those 88, reporting an unnamed person | **36** |
| Where they sit | two stories to a lesson across **11 courses**, one parable and one "true story" from each course's first commit |
| Parables, for scale | 718 |

**What the page tells a reader.** `story-truth.js` is the one source for all
three surfaces, and it renders a testimony in words:

```
heading:  A true story, lived — [title] · [source]
footnote: A true story: this happened, told with [source]'s consent.
```

With no source the footnote **still makes both claims**, substituting *"the
person's"* for a name nobody wrote down. So eighty-eight stories tell a reader
that a real person lived this and consented to its telling, while the data
records neither who nor that they did. `PARABLE-AND-TESTIMONY-METHOD.md` is not
ambiguous: a testimony "Requires: it actually happened (no embellishment),
explicit **consent**, privacy / minor protection, and pastoral care," and *"What
a real person actually said or lived is a testimony with its source, or it stays
out."*

**The shape of the 88, in their own words.** First person, with lived specifics:
*"I found out what a deposit was the hard way, in a week I still do not enjoy
describing"*; *"My father ran money out to men in our neighbourhood for thirty
years"*; *"We bought a commercial laundry setup for a building with sixteen
units"*; *"I do not price anything after nine at night."* And the reported kind:
*"A man who had lent four thousand pounds to a friend for a van said the verse
had changed how he thought"*; *"A nurse who worked through her country's
restructuring said the reporting was accurate and completely…"* — **four thousand
pounds**, in a course for a family whose money is in dollars, is one of the
details the list hands him.

**A measurement of mine that was one too high until I opened the file.** My first
count was 89. The eighty-ninth was `perspectiveDraftFor()` in `story-library.js`,
which returns `{ kind: 'testimony', title: '', body: '', source: '', consent:
false }` — the empty form a member fills in to add a perspective, a default and
not an account. The scanner now requires a body, and the exclusion is a case
rather than a comment. Worth keeping for its own sake: **that draft shape carries
both a `source` and a `consent` flag**, so the data model already knows a true
story owes a reader both. No shipped course story carries a `consent` field at
all.

## Decision

**1. Whether a source EXISTS is gated; whose life it is, is not.** The method doc
demands a source and a machine can see one, so `a-true-story-names-whose-life-it-was.test.js`
pins the 88 in both directions: a NEW unattributed true story is red, and one that
gains its source is also red with a message to lower the pin. The five that do
name a source are pinned separately, because a source silently deleted is the
same defect arriving from the other side and would not move the first count.

**2. Not one word of any story is changed by this commit, and none is relabelled.**
Each of the 88 is one of three things — Darrell's own account, someone else's told
to him, or written to teach and never lived — and only he can say which. Guessing
would be the fabrication the whole method exists to prevent. Relabelling 88 stories
to `parable` to make a gate green would be worse: it would decide, silently, that
none of them happened.

**3. The answer goes to him as a list, which is what DR-0550 asked for.**
`docs/99-session-notes/2026-10-20-whose-life-is-this.md` carries all 88 grouped by
course, each with its title, whether it is in his voice or reports someone
unnamed, its opening sentence so he can recognise it, and the **checkable details
extracted** — weekdays, sums, spans of years, counts, places. He can answer a
whole course at once where the answer is the same, and the three options are
written out plainly, including that "written to teach" is an honourable answer:
Jesus taught by parables (Matthew 13:34). It just must not wear the other label.

**4. The list and the gate read the same scanner,** so the document cannot drift
from the number the build enforces.

## Impact

**What this buys.** The ninetieth cannot land: every future true story names whose
life it was or it is not called one. And the thing DR-0550 could not have a gate
for now has an instrument pointed at it — 88 lived accounts with their checkable
details pulled out, in front of the one person who can confirm them.

**What this does not do.**

- **It does not resolve a single one of the 88.** That is the point; they are his.
  The pin keeps the number honest and visible until he answers, and it can only
  fall. **`re-review: 2026-11-20`** — how many he has answered, and whether the
  remainder needs a different route (a review queue in the app rather than a
  document, per DR-0065's "what is its surface inside the app?").
- **It does not gate consent, only attribution.** The method requires explicit
  consent; the data model has a `consent` field on a member's perspective draft
  and nothing on a course story. Adding one is a model change with its own blast
  radius and belongs in its own record. **`re-review: 2026-11-20`** — with the
  measured fact that 0 of 93 shipped testimonies record consent as its grounds.
- **It does not sweep the days and counts of the five that ARE sourced.** Those
  five are Darrell's own, already named, and DR-0550's instrument for them is the
  same one it always was: him reading them. They are listed at the end of the
  document as the pattern the 88 need.
- **It does not touch the 718 parables.** DR-0811 already gated the one thing they
  can get wrong (wearing a real name), and its own `re-review: 2026-10-21` on
  stock names that could be mistaken for the family's stands untouched.

## Verification

`app/src/__tests__/a-true-story-names-whose-life-it-was.test.js`, **14 cases**.
`npm run lint` exit 0. `npm run verify:gates` exit 0.

The first three cases are the ones that make the count a defect rather than an
untidiness: they assert what `story-truth.js` actually renders — that a sourceless
testimony's footnote reads *"this happened, told with the person's consent"*, that
a sourced one names the person, and that a parable makes neither claim.

One case holds the two parsers together: `storyBlocks()` and `story-truth.js`'s own
`storiesInSource()` must find the same blocks in the same text, because two parsers
reading one file differently is how a gate ends up guarding something other than
what the page renders.

**Proven to catch, both directions, on the real files:**

| what was done | cases that go red |
| --- | --- |
| one new sourceless true story added to `banking-course.js` | **2** — the pin, and the anti-theater total |
| one `source` deleted from `living-lessons-class.js` | **2** — the pin, and the attributed-five pin |

And the detail extraction is held to finding something: a weekday inside a true
story is asserted to be FOUND rather than pinned to a number, because a sweep
reporting no weekday anywhere is the lie this guards — a weekday being exactly the
detail DR-0550 was written about.
