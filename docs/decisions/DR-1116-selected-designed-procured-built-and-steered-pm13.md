# DR-1116: Selected, designed, procured, built and steered — pm13, and a one-sentence teaser taught at its real size

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (a lesson added to an existing course through the sanctioned lane)
**Type:** lesson

**Area:**
- `app/src/lib/project-management-course.js` (new module `pm13-selected-designed-procured-built-and-steered`, lesson 13)
- `app/src/__tests__/project-management-pm13-verses.test.js` (new — 37 cases, two proven-to-catch)
- `app/src/__tests__/course-band-coverage.test.js` (the four-band ratchet, 246 → 247, by hand with its dated note)
- `app/src/lib/lesson-dates.json`, `app/src/lib/course-band-coverage-baseline.json` (regenerated, never hand-edited)
- `docs/99-session-notes/2026-10-19-pm13-selected-designed-procured-built-and-steered.md`

**Grounds:** Darrell forwarded a McKinsey & Company Operations alert of 2026-10-19 from `dpoe@illinois.edu` at 16:52 UTC with one word above it: **"Lesson"**. Gmail thread `1a15513f95050870`.
**Principles:** DR-0312 (the Gmail-lesson-intake Way); DR-0733 and DR-0795 (all three directions, in every band); DR-0734 (`anchor.ref` is where Search it out gets its links); DR-0076 §3 and §8 (proven-to-catch; provenance and honest uncertainty); DR-0100 (the three tiers — state the established plainly, flag the open narrowly, refuse the over-reach); DR-0210 (Yahweh in our voice, never inside a quotation); DR-0530 (the Resources capitalised in our voice); DR-0127 (WORD-FIRST — the Word's own case, then the industry's name for the shape)

## Context

The forwarded item is **not an article.** It is a link-out teaser, and the
whole of what it carried was read and written down before a line of the lesson
was drafted:

- a title — *Why the future of capital projects belongs to digital and AI-enabled teams*
- **one** sentence of claim — *Digital and AI are changing the way capital
  projects are selected, designed, procured, built, and steered. Leaders are
  moving beyond pilots to rewire how projects are planned and delivered.*
- a marketing phrase — *Transform capital projects with AI*
- two bylines — Ruth Heuss and Sal Arora, named as global leaders of the firm's
  Operations Practice (presented as the alert's senders; the article's own
  authorship is not stated in the email)
- two further headlines with **no bodies at all** — *An executive's survival
  guide to capital projects*, and *Don't cancel or coddle at-risk capital
  projects — challenge them*

Everything else was tracking links, images, app-store badges, a privacy notice
and a subscription footer. **The article body sits behind a link we did not and
cannot read.**

So the first decision was whether the source can carry a lesson at all. It can,
but only one way round: the teaching comes from **the Word on building**, and the
teaser is the **occasion**, named at its real size. A thin source taught as a
thick one — findings, percentages, case studies attributed to an article nobody
read — is the exact failure DR-0076 exists to stop, and would have been easy
and flattering to commit here.

## What was measured

Before a line was written:

| asked | answer |
|---|---|
| is there already a lesson from these words? | **no** — `Heuss`, `Arora`, `capital projects`, `procured` return nothing across `app/src/lib/`, `docs/decisions/` and `docs/99-session-notes/` |
| what is the next free module id? | **pm13** — one numeric regex over the whole course file: ids 1–12, contiguous, numeric max 12 (the *lexical* tail of that file is `pm5`–`pm9`, which is exactly the trap) |
| what is the next free record number? | **DR-1116** — main's highest is DR-1114, DR-1117 landed for an unrelated fix, 1115 is held by a sibling build |
| how much substance does the source carry? | **five items**, listed above; one sentence of claim, two bodiless headlines |

After the build:

| measured | number |
|---|---|
| quoted spans that name a reference | **137** |
| of those, verbatim against the verse they name | **137** (0 faults) |
| distinct verses quoted | **50** |
| `anchor.ref` entries | **50** — every quoted verse named, and every named ref quoted and resolving, both directions checked |
| age bands | **4**, all authored; `placesMissingDirections(module)` → `[]` |
| percentages or survey-sized numbers claimed from the article | **0**, and a gate asserts none can be added |

## Impact

The lesson ships as lesson 13 of Project Management with all four age bands, and
it is the first lesson in this house to make **the thinness of its own source
part of the teaching** rather than a footnote. The adult text and the senior
band both say, in the reader's own view, that the letter was a one-sentence
teaser, that we did not read the full article, that no finding or figure from it
is reported, that the marketing phrase is sponsor copy and is not taught, and
that an A.I. agent drafted the page while the gates decide whether it ships.
A reader therefore learns the discipline twice: once from Luke 14, and once from
watching the page refuse to pad itself.

What the one sentence **is** worth is its five verbs, and they are kept:
selection, design, procurement, construction, steering. Against them the Word
supplies what a tool cannot:

- the gate before the first stone, and it is narrower than an estimate —
  `Luke 14:28` asks *whether he have sufficient to finish it*, with the
  consequence named rather than implied (`Luke 14:29-30`), and the order of work
  given plainly (`Proverbs 24:27`);
- **Who establishes it** — `Zechariah 4` is spoken over an actual stalled
  capital project, the second temple: *Not by might, nor by power, but by my
  spirit* (4:6), with the promise of the finish the tower-builder never reached
  (4:9); carried into the building that is people in `1 Corinthians 3:9-11`,
  whose only foundation is Jesus, the Lamb of Yahweh (`John 1:29`) and the
  Eternal Son of Yahweh (`John 3:16`);
- the Word behind the one headline worth keeping — **challenge, do not coddle**:
  `Proverbs 27:5-6`, `27:17`, with the mechanism named as plural counsel rather
  than a strong personality (`Proverbs 15:22`; `11:14`; `20:18`; `12:15`), and
  coddling named for what it is, the *Peace, peace* of `Jeremiah 6:14`;
- the people — Bezaleel and Aholiab **called by name, filled, and able to
  teach** (`Exodus 31:2-5`; `35:30-35`), because a project is delivered by
  formed people and an A.I.-enabled team that cannot teach its own method has
  bought capacity and skipped capability;
- **steering** as a standard held from *outside* the work — the plumbline
  (`Amos 7:7-8`), the measuring line (`Zechariah 2:1-2`), the line of flax
  (`Ezekiel 40:3`): a wall never measures itself, which is why a dashboard
  assembled from the delivery team's own optimism is a report, not a plumbline;
- diligence (`Proverbs 22:29`; `21:5`; `13:4`), the **Resources** that build a
  house — Wisdom builds, Understanding establishes, Knowledge fills the chambers
  (`Proverbs 24:3-4`) — with Love senior to all of it or the finest method is
  sounding brass (`1 Corinthians 13:1`), and the steward's account that closes
  every project (`1 Corinthians 4:2`; `Luke 16:10-12`).

**Deliberately not done.** No finding, figure, percentage or case study is
attributed to the article, because none was in front of us. The marketing
phrase is quoted only to refuse it. Nothing was fetched from the link.

## Decision

**1. Ship it as `pm13`, four bands, Word first.** Seven numbered movements in
the senior band; each band written for its reader rather than trimmed from the
adult text. The child band carries the two things a child can really use —
count before you build, and ask a grown-up to check your work (`Proverbs 27:5`;
the plumbline of `Amos 7:7`) — and names its provenance at a child's level.

**2. The source is reported at its real size, in the lesson, not only here.**
A one-sentence teaser; the full article unread; no finding claimed; the sponsor
copy named and refused; the drafting agent disclosed. Six cases in the pinned
test hold each of those statements in place so the honesty cannot be edited out
quietly, including one that fails if any percentage ever appears on the page.

**3. The three tiers are carried whole (DR-0100).** ESTABLISHED: large capital
projects really are now selected, designed, procured, built and steered with
digital tools — stated plainly, not hedged. OPEN, named narrowly: whether
moving beyond pilots improves delivery is asserted by the teaser and we read no
evidence for it, so we claim nothing either way. OVER-REACH: *Transform capital
projects with AI* is sponsor copy, and the Word already says what establishes a
house.

**4. Every verse is filled from the corpus by a generator, never typed.** The
build script reads `app/public/bible/kjv` for each reference, interpolates the
text, and **refuses to write the file** if a span is not a verbatim substring of
the verse it names. **137 spans, 137 verbatim, 0 faults.**

**5. The anchor is checked in both directions** (DR-0734): all 50 quoted verses
appear in `anchor.ref`, and all 50 anchor refs are quoted and resolve.

**6. The newcomer yields on verses.** Three courses hold their verses
exclusively (`appraisal`, `insurance-risk`, `inspections`). Their sets were
measured *before* drafting, and three natural anchors for this lesson were ruled
out and replaced rather than contested: `Psalms 127:1` (held by
`insurance-risk`) gave way to `Zechariah 4:6` and `4:9` — which is the better
teaching anyway, because Zechariah is spoken over a real stalled building
project; `1 Thessalonians 5:21` and `Proverbs 14:15` (both held by
`inspections`) gave way to `Proverbs 18:13` and `Proverbs 25:2`, which guard the
*review* rather than the reader. All three exclusivity gates are green.

**7. The four-band ratchet moves by hand, 246 → 247**, with its dated note
naming this lesson and this record.

## Verification

- **37 cases** in `project-management-pm13-verses.test.js`, green.
- **Proven to catch, twice** (DR-0076 §3), and neither is a stuck failure —
  each case also asserts the real module is clean:
  - altering one word inside a quotation (`was not able to finish` → `was not
    able to afford it`, in the child band) fails the verbatim scan, while
    `scanQuotedVerses` on the real module still returns zero faults;
  - stripping **only** the youth band's friend line makes
    `placesMissingDirections` name *youth* as short of *friends* while the
    pooled `hasAllThree` still reads green — which is precisely why the per-band
    check exists (DR-0795) — and the real module still returns `[]`.
- **Verbatim:** 137 spans, 137 verbatim, 0 faults, against the real corpus.
- **Bands:** four, all present, each over 900 characters; every band carries
  TALK ABOUT IT TOGETHER in the lesson's own words, all three directions, with
  the skill (ask one open question, listen all the way to the end, retell it in
  their own words, teach one verse back) and the rhythm (once today in one of
  `Deuteronomy 6:7`'s four places; one friend this week).
- **Growth measured the Word's way:** qualitative (`Galatians 5:22`, fruit) and
  quantitative (`Deuteronomy 6:7` occasions, `Hebrews 3:13` days) — never
  imported.
- **Catalog gates green:** `project-management-courses.test.js`,
  `project-management.test.js`, `project-management-pm12.test.js`,
  `lesson-door-and-pm11.test.js`, `talk-together.test.js`,
  `course-band-coverage.test.js`, `search-it-out.test.js`, and the three
  exclusivity gates `appraisal-course.test.js`, `insurance-risk-course.test.js`,
  `inspections-course.test.js`.
- Generated files regenerated with their own tools, not edited:
  `npm run lesson-dates` (after the lesson was committed, so the row carries a
  real 8-hex commit sha rather than `working-tree`) and
  `course-band-baseline-write.mjs` (total 421, allFour 247, adultOnly 0).
- Lint clean, `npm run verify:gates` green by exit code, and the **full** vitest
  suite green before the push.

### A correction worth recording

The first run of the new test file failed ten cases, and every one was the
*test* being wrong rather than the lesson: nine asserted whole corpus verses
where the lesson quotes a contiguous **span** of a verse (the KJV's trailing
`.` and `:` are part of the verse, not part of the quotation), and one asserted
`McKinsey` on the youth band where the draft had written only *a business
letter*. The nine were fixed by asserting the span the page actually prints,
and the tenth by fixing the **lesson** to name the letter. Recorded because a
test that fails for the wrong reason is the easiest thing in the world to "fix"
by weakening it.

## What this does not do

- **It adds no gate to the catalog's standing set.** The two proven-to-catch
  cases live in this lesson's own file.
- **It does not read the article.** If the body is ever in front of us, the
  teaser's single claim is the only thing on this page that would need revisiting
  — the Word under it would not. **`re-review: 2026-12-19`** — if the article
  becomes readable and carries a real measured record, it earns its own lesson
  rather than a retrofit of this one.
- **It makes no claim about exam scores, delivery speed or defect rates**, here
  or in the lesson, consistent with the whole course's standing refusal.
