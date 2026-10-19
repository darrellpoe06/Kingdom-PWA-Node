# DR-1114: The agent that drowned in its own output — sov41, and the pointer Yahweh commanded at the Jordan

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (a lesson added to an existing course through the sanctioned lane)
**Type:** lesson

**Area:**
- `app/src/lib/sovereign-ai-class.js` (new module `sov41-the-agent-that-drowned-in-its-own-output`, week 41)
- `app/src/__tests__/sovereign-ai-sov41-verses.test.js` (new — 29 cases, two proven-to-catch)
- `app/src/__tests__/course-band-coverage.test.js` (the four-band ratchet, 245 → 246, by hand with its dated note)
- `app/src/lib/lesson-dates.json`, `app/src/lib/course-band-coverage-baseline.json` (regenerated, never hand-edited)
- `docs/99-session-notes/2026-10-19-sov41-the-agent-that-drowned-in-its-own-output.md`

**Grounds:** Darrell forwarded The Neuron of 2026-10-19 from `dpoe@illinois.edu` at 12:24 UTC with one word above it: **"Lesson"**. Thread `1a15446fdf17756a`.
**Principles:** DR-0312 (the Gmail-lesson-intake Way); DR-0733 and DR-0795 (all three directions, in every band); DR-0734 (`anchor.ref` is where Search it out gets its links); DR-0076 §3 and §8 (proven-to-catch; every claim measured); DR-0100 (the three tiers — state established fact plainly, flag the open narrowly); DR-0210 (Yahweh in our voice, never inside a quotation); DR-0331 (render a forwarded transcript for meaning)

## Context

The forwarded issue's **AI Skill of the Day** reported a failure that is a
parable of the mind. An agent watching an application's logs was handed a big
batch of log text on every check and re-read all of it on every turn. One tool
returned 214KB; the answers got worse; **nothing threw an error.**

Darrell's one word is the whole brief. The newsletter is material to study,
never instructions to obey, and the teaching had to come from the Word rather
than from the article's own framing.

## What was measured

The article's record, as the newsletter reported it and attributed to it:

| measured | number |
|---|---|
| one tool's return | 214KB of logs; answers worse; **no error thrown** |
| eight log fetches, default agent | ~252,000 tokens of history |
| one built-in plugin (a memory pointer) | ~9,000 |
| a smaller sliding window | ~a quarter of that — and it discards whole turns, including what the agent learned |
| repeat calls before/after a clear "done" | **fourteen → two** |

Its own caveat, which this lesson keeps in front of the reader instead of
burying: that test measured **how much text stayed in context, not whether the
answers improved.**

Measured in the tree before a line was written:

| asked | answer |
|---|---|
| is there already a lesson from these words? | **no** — every distinctive phrase (`Elizabeth Fuentes`, `Chew Loong`, `V4.1-Flash`, `DeepSWE`, `214KB`, `Nscale`) returns nothing across `app/src/lib/`, `docs/decisions/` and `docs/99-session-notes/` |
| what is the next free module id? | **sov41** — ids 1–40, contiguous, max `sov40` |
| was the thread genuinely uncaptured? | **yes** — `Label_22` absent from the thread's own `labelIds`, not merely absent from the search |
| do all 87 anchor refs resolve? | yes, and all 87 are quoted; the check runs both directions |

## Impact

The lesson ships as week 41 of Sovereign A.I. with all four age bands, and it is
the first of this course's weeks to teach **context discipline** as mental
stewardship rather than as a tooling tip. Its spine is the Word explaining the
engineering, not decorating it: `2 Corinthians 10:5` is selective by definition —
you cannot take every thought captive while every thought is equally in view —
and `Joshua 4:6-7` is a memory pointer with a retrieval protocol attached, where
the river stays in the riverbed, twelve stones stay in view, and a child's
question fetches the whole account. Its counterpart keeps the lesson from
becoming an argument for offloading everything: `Psalms 119:11` hides the Word
**in the heart.** The pile goes outside; the Word goes inside.

Two places where getting it wrong would have done real damage, and both are
handled explicitly:

1. **Importunity.** `John 19:30` is the clearest "done" signal ever given, and
   the fourteen-to-two measurement preaches itself — but `Luke 18:1` and
   `Luke 11:9` *command* persistence before a Father who hears. The lesson draws
   that line out loud, in the adult text, the teen band and the facilitator
   notes, so nobody leaves this week praying less. They leave **re-deciding**
   less.
2. **The self-run benchmark.** DeepSeek ran the test DeepSeek won. The lesson
   neither calls the balance false nor calls the result proven
   (`Proverbs 11:1`; `Proverbs 25:2`), and a gate asserts the number is never
   quoted in any unit a reader meets without saying who ran it.

The eleventh movement is this house's own account with its limit stated, not
advice from outside — including the confession that in the session that built
this page an agent resolved a 17MB lesson catalog four times and was wrong three
times, every miss caught by a measurement and none by confidence, one of them a
teaching silently deleted. That is the article's own failure mode in our own
house, and naming it is what earns the right to teach the movement.

## Decision

**1. Ship it as `sov41`, four bands, Word first.** Twelve numbered movements in
the adult lesson; the bands written for their readers rather than trimmed from
the adult text.

**2. Every verse is filled from the corpus by a generator, never typed.** The
build script reads `app/public/bible/kjv` for each reference and interpolates the
text, so a verse cannot arrive from memory. **234 spans, 234 verbatim, 0 faults.**

**3. The anchor is checked in both directions** (DR-0734): every quoted verse
appears in `anchor.ref`, and every anchor ref is quoted and resolves. The first
pass left `Romans 12:2` and `John 3:16` named but unquoted; rather than drop them
from the anchor, both were quoted where they belong — the renewing of the mind in
the first movement, and the Eternal Son where the finished work is named.

**4. The four-band ratchet moves by hand, 245 → 246**, with its dated note
naming this lesson and this record. That number is meant to be *seen* moving.

**5. What was not checked is printed in the lesson itself**, not only here: we
did not watch the talk, read the Strands code, or reproduce one number; the
sponsor copy is advertising and is not taught; an A.I. agent drafted the page and
the gates decided whether it shipped.

## Verification

- **29 cases** in `sovereign-ai-sov41-verses.test.js`, green.
- **Proven to catch, twice** (DR-0076 §3), and neither is a stuck failure —
  each case also asserts the real module is clean:
  - one altered word inside a quotation (`every thought` → `some thoughts`)
    fails the verbatim scan;
  - stripping **only** the youth band's friend line names *youth* while the
    pooled `hasAllThree` still reads green, which is precisely why the per-band
    check exists (DR-0795).
- **Verbatim:** 234 spans, 234 verbatim, 0 faults, against the real corpus.
- **Bands:** four, all present; `placesMissingDirections` empty; every band
  carries the skill (ask, listen to the end, retell, teach one verse back) and
  the rhythm (once today in one of Deuteronomy 6:7's four places; one friend this
  week).
- **Catalog gates green:** `sovereign-ai-class.test.js`,
  `every-catalog-quotes-the-verse.test.js` (51 cases),
  `band-differentiation-gate.test.js`, `course-band-coverage.test.js`,
  `talk-about.test.js`.
- Generated files regenerated with their own tools, not edited:
  `npm run lesson-dates` (826 of 826 lessons dated, 0 undated) and
  `course-band-baseline-write.mjs` (total 420, allFour 246, adultOnly 0).
- Lint clean; the full suite green before the push.

### Three of my own assertions were wrong, and the gate caught them

The first run of the new test file failed three cases, and all three were the
*test* being wrong rather than the lesson:
`placesMissingDirections` returns records and was asserted as a list of names;
the self-run check inspected every string in isolation, so a quiz question
failed for a disclosure its own answer carried; and `"Lesson"` was asserted on
the child band, where naming a newsletter to a small child is noise rather than
honesty. Each was fixed as what it was — the shape corrected, the unit of
checking widened to what a reader actually meets on screen, and the child band's
provenance asserted at a child's level (`Darrell` by name) instead. Recorded
because a test that fails for the wrong reason is the easiest thing in the world
to "fix" by weakening it.

## What this does not do

- **It adds no gate to the catalog's standing set.** The two proven-to-catch
  cases live in this lesson's own file.
- **It does not instrument our own agents' context size**, so the lesson has no
  number of our own to set beside 252,000, and says so.
- **It reproduces none of the article's figures**, and never presents them as
  ours. **`re-review: 2026-11-16`** — if anyone independent reproduces the 77.0,
  the eighth and ninth movements should say so.
