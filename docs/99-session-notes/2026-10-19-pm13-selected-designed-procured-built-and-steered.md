# 2026-10-19 — pm13: selected, designed, procured, built and steered

**Module id:** `pm13-selected-designed-procured-built-and-steered`
**Course:** Project Management: Count the Cost (`app/src/lib/project-management-course.js`), lesson 13
**Decision record:** DR-1116
**Captured by:** the Gmail-lesson-intake Way (DR-0312)

## Where the word came from

Darrell forwarded a **McKinsey & Company Operations alert of 2026-10-19** from
`dpoe@illinois.edu` at 16:52 UTC with one word above it: **"Lesson"**. Gmail
thread `1a15513f95050870`.

## What the letter carried — the whole of it

This is the part that had to be got right first, because the letter is **not an
article**. It is a link-out teaser, and this is everything of substance it held:

| item | what it said |
|---|---|
| title | *Why the future of capital projects belongs to digital and AI-enabled teams* |
| **one** sentence of claim | *Digital and AI are changing the way capital projects are selected, designed, procured, built, and steered. Leaders are moving beyond pilots to rewire how projects are planned and delivered.* |
| marketing phrase | *Transform capital projects with AI* |
| bylines | Ruth Heuss and Sal Arora, named as global leaders of the firm's Operations Practice |
| related headline, **no body** | *An executive's survival guide to capital projects* |
| related headline, **no body** | *Don't cancel or coddle at-risk capital projects — challenge them* |

Everything else was tracking links, images, app-store badges, a privacy notice
and a subscription footer. **The article body sits behind a link we did not and
cannot read.**

## The judgement call, made before drafting

Can one sentence carry a lesson? Only one way round. The teaser is the
**occasion**; the teaching is **the Word on building**. So:

- no finding, figure, percentage or case study is attributed to the article,
  because none was in front of us;
- the teaser limit is stated **to the reader**, in the adult text and in the
  senior band, not tucked into a decision record;
- the marketing phrase is quoted only in order to refuse it;
- nothing was fetched from the link.

A gate in the pinned test fails the build if a percentage ever appears on the
page, so the padding this lesson refused cannot be added back quietly.

## What the lesson teaches

The five verbs of the one real sentence are kept, because they are a sound
decomposition of a capital project: selection, design, procurement,
construction, steering. Against them:

1. **Count it sitting down.** `Luke 14:28` asks the narrow question — *whether
   he have sufficient to finish it* — with the consequence named
   (`Luke 14:29-30`), the order given (`Proverbs 24:27`) and haste named as a
   mechanism rather than a temperament (`Proverbs 21:5`; `13:4`).
2. **Who establishes it.** `Zechariah 4` is spoken over an actual stalled
   capital project: *Not by might, nor by power, but by my spirit* (4:6), with
   the finish the tower-builder never reached (4:9). Carried into
   `1 Corinthians 3:9-11`, whose only foundation is Jesus, the Lamb of Yahweh
   (`John 1:29`) and the Eternal Son of Yahweh (`John 3:16`). `Proverbs 16:3`
   places the commitment.
3. **Challenge, do not coddle** — the one bodiless headline the Word plainly
   stands behind. `Proverbs 27:5-6`, `27:17`; plural counsel in `15:22`,
   `11:14`, `20:18`, `12:15`; coddling named as the *Peace, peace* of
   `Jeremiah 6:14`; and two guards on the review itself, `Proverbs 18:13` (the
   verdict written before the hearing) and `Proverbs 25:2` (digging is the
   honourable work).
4. **The people, named and filled and taught.** `Exodus 31:2-5` and
   `35:30-35` — Bezaleel and Aholiab called by name, filled with Wisdom,
   Understanding and Knowledge, **and able to teach.** An A.I.-enabled team that
   cannot teach its own method has bought capacity and skipped capability.
5. **Steering means a standard held from OUTSIDE the work.** The plumbline
   (`Amos 7:7-8`), the measuring line (`Zechariah 2:1-2`), the line of flax
   (`Ezekiel 40:3`). A wall never measures itself, which is why a dashboard
   assembled from the delivery team's own optimism is a report and not a
   plumbline. And the small measurement is not despised (`Zechariah 4:10`).
6. **Diligence, the Resources, and the account.** `Proverbs 22:29`; the
   Resources that build a house — Wisdom builds, Understanding establishes,
   Knowledge fills the chambers (`Proverbs 24:3-4`) — with Love senior or the
   finest method is sounding brass (`1 Corinthians 13:1`); and the steward's
   account that closes every project (`1 Corinthians 4:2`; `Luke 16:10-12`).
   Close on `Proverbs 14:8` and `Psalms 19:14`.

## The newcomer yielded

Three courses hold their verses exclusively. Their sets were measured **before**
drafting, and three natural anchors were replaced rather than contested:

| wanted | held by | taken instead |
|---|---|---|
| `Psalms 127:1` | `insurance-risk` | `Zechariah 4:6` and `4:9` — the better teaching, because Zechariah is spoken over a real stalled build |
| `1 Thessalonians 5:21` | `inspections` | `Proverbs 25:2` |
| `Proverbs 14:15` | `inspections` | `Proverbs 18:13` |

All three exclusivity gates are green.

## Measured

| measured | number |
|---|---|
| referenced quoted spans | **137** |
| verbatim against the verse they name | **137** (0 faults) |
| distinct verses quoted | **50** |
| `anchor.ref` entries | **50**, checked both directions |
| age bands | **4**, all authored, each over 900 characters |
| `placesMissingDirections(module)` | `[]` |
| percentages claimed from the article | **0**, and gated |
| four-band ratchet | 246 → **247** |

Every verse was **filled from `app/public/bible/kjv` by a generator** that
refuses to write the file when a span is not a verbatim substring of the verse
it names. Nothing was typed from memory.

## Proven to catch, twice

Neither is a stuck failure — each case also asserts the real module is clean:

- altering one word inside a quotation (`was not able to finish` → `was not able
  to afford it`, child band) fails the verbatim scan;
- stripping **only** the youth band's friend line makes
  `placesMissingDirections` name *youth* as short of *friends* while the pooled
  `hasAllThree` still reads green — which is exactly why the per-band check
  exists (DR-0795).

## What CI caught that I had not run

The first CI run failed **shard 4/4 only**, on `course-four-bands-hold.test.js`
through `scripts/title-in-narrative.mjs`: a band must name its own lesson in its
first 200 characters. Teen and senior opened on the five verbs and passed; the
**child and youth bands opened on "Count the cost" and named nothing.** Fixed by
carrying the title into each reader's register — the child band on the five
steps in a child's words, the youth band on what those five words are and what
they do not change — never a prefix. Child reading grade still under the 5.0
ceiling; 634 band/reading/title/quotation/catalog tests green.

The full local suite did not finish: `app/vitest.local-slot.js` caps a non-CI
run at 2 workers (P65) and a sibling builder held the other slot — 2.7 files a
minute, about 10 hours for 1,600 files on 4 cores. The worker count was not
raised, and the slot was freed. CI's four shards are the full-suite witness.

## What is left

`re-review: 2026-12-19`. If the article body ever becomes readable and carries a
real measured record, it earns its own lesson rather than a retrofit of this one.
