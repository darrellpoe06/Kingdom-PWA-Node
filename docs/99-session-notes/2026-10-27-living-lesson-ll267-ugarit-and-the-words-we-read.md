# Living Lesson build log — Ugarit and the Words We Read (2026-10-27)

**Module id:** `ll267-ugarit-and-the-words-we-read-yahweh-is-not-of-that-pantheon-he-is-its-judge`
**Course:** Living Lessons from the Word (`app/src/lib/living-lessons-class.js`)
**Record:** DR-1228
**Branch:** `claude/ll267-ugarit-and-the-words-we-read`

## Where it came from

Darrell sent a link into the PoeTech app for a lesson. `agent_inbox` row
`c7335967-95c5-4a26-818e-31c7d0684730`, from his own phone account; research
item `daa9f979-3b05-4b24-85ac-93076691b6f5`. It had waited about ninety-one
hours in the lesson queue — the wait DR-1219 recorded.

The research road's **reading was never made** (the tower had not answered), so
the whole of the research is the source beneath it: the machine-made captions of
a video conversation, fetched on the NAS from its residential IP because the CI
path is YouTube-IP-blocked. No timestamps. **No speaker named anywhere in it**,
so none is named in the lesson, and nothing is placed in anyone's mouth inside
quotation marks.

## The two limits, stated before anything was taught

1. **It is truncated.** About 1,773 words — the shortest transcript in the whole
   intake — and **it ends mid-sentence**, mid-clause, in the middle of a thought
   about secular ritual. The lesson teaches to the end of the page and stops.
   Nothing was extrapolated past that edge, and the lesson says so in its own
   prose, in all five registers.
2. **The source capitalises the false god's name**, and the other members of that
   pantheon with it. This house writes every one of them in lower case and the
   rule is senior to the source (CLAUDE.md), so the conflict is surfaced and
   corrected rather than copied through — and the lesson says WHY in every band,
   so a reader learns typography as theology rather than as style. The
   repository's own KJV corpus already prints `baal`, `satan` and `leviathan`
   small, so no quotation was forced into the conflict and none was altered.

## What was built, and what was not

**Half one only.** The 1928 plow-strike near Minet el-Beida, Schaeffer's
excavation in April 1929 and the first inscribed tablet on 14 May 1929; roughly a
thousand tablets in an unread language; the decipherment, which turned on
counting the signs and finding about thirty — therefore an alphabet, not a
syllabary; Hans Bauer reasoning from letter frequency in 1930, corrected and
completed by Edouard Dhorme and Charles Virolleaud; what Ugaritic gives back to
the reading of biblical Hebrew; and the lotan/leviathan parallel, stated plainly
as established comparative philology.

**Half two answered, not hidden, not staged.** The conversation changes subject
to an evolutionary account of religion — agency-detection, an "eye in the sky"
that let societies scale past kinship, religious observance as costly signalling.
One movement of ten names it in plain words, keeps what is real in it, flags
narrowly what nobody observed, and lets the Word correct the order of reality.
Not equal weight. Not a debate. Not quietly stopped before the inconvenient part.

**The line the lesson holds:** the parallels illuminate the text; they do not
level it. Yahweh is not one of that pantheon but its Judge.

## What the source got wrong, corrected before it was taught (DR-0192)

- It compresses the plow-strike and the dig into one year. The strike was spring
  **1928**; the excavation and the first tablets were **1929**.
- It leaves the decipherers anonymous. They are named.
- Its "fix mem first" step could not be corroborated in that exact form; the
  frequency reasoning is established, so the step is carried as the source's own
  telling rather than asserted.
- Its seven-headed-serpent find is **real** and was verified: a stamp seal
  excavated on the Tel Hazor acropolis in 2022, published 2024, eighth century
  BC. It is a seal rather than an inscription, and its own publication concedes
  it cannot be assigned Israelite rather than Phoenician — both of which the
  lesson says.
- It names a book by Ara Norenzayan as its authority for the evolutionary
  account. Named as the source's citation; not read here; no motive attached to a
  living man.

## Measured before the splice, re-read after it

| check | measured |
|---|---|
| referenced spans / verbatim faults | 338 / 0 |
| fullness child / youth / teen / senior (floors 0.5 / 0.6 / 0.6 / 0.6) | 0.51 / 0.61 / 0.71 / 0.96 |
| authored-prose grade child / youth / teen / senior (child ceiling 5.0) | 0.46 / 6.62 / 11.74 / 16.30 |
| worst band overlap (ceiling 0.5) | 0.10 |
| bands not naming the lesson in their opening | none |
| places missing a direction | none |
| elisions / recited records / generic "God" in our own voice | 0 / 0 / 0 |
| capitalised false-god names in reader-facing text | 0 |

Every verse came out of `app/public/bible/kjv` before a sentence was written.
After the splice the entry was read back out of the catalog and compared field by
field against the measured draft: deep-equal, order-insensitive.

## What its own gate caught before the push

Six real faults, each fixed in the lesson rather than excused in the test:

1. The **teen** and **senior** bands failed the three-directions check, because
   "Parents, put one question to your children" and "Parents, lay a single
   question before your children" use verbs the detector does not carry.
2. The **senior** friend line sat too far from its verb to register.
3. **Deuteronomy 6:7** was quoted in the adult lesson and in none of the four
   bands.
4. A sentence-initial **"Lotan"** in the child band had capitalised the one class
   of name this house never capitalises.
5. The **teen** band never said WHY the false gods are written small, though the
   other four places did.
6. All eight **quiz answers** sat in the same position.

The child and youth bands measured short (0.42 / 0.57) and were **written fuller
rather than the adult lesson cut** — the floor exists to make a band whole, not
to make the lesson smaller.

## New ground, measured rather than assumed

`Ugarit`, `Ugaritic`, `lotan`, `cuneiform` and `Ras Shamra`: **zero** hits across
`app/src/lib/` before this lesson. `leviathan`: **one** carrier,
`ll77-the-king-over-the-children-of-pride`, which stands on Job 41:34 and already
quotes Isaiah 27:1 — for a teaching about pride, a different seam. `Psalms 96:5`
and `1 Corinthians 8:4-6` belong to `ll155-yahweh-his-name-and-why-this-house-says-it`.
So ll77, ll155 and ll73 (the borrowed word El, the nearest neighbour) are
**cited in the lesson's own prose, not re-taught** — the DR-1105 lesson about
paying one flag twice.

## The number

**ll267 is held by central assignment, not by contiguity**, and that is worth writing down plainly.

This lesson was numbered ll260 first, then ll259, under an instruction to take the
lowest free number above ll258. The contiguity gate refused ll260 by name --
`expected [ 259 ] to deeply equal []` -- because
`living-lessons-numbers-are-unique.test.js` measures the catalog in **this** tree,
where an unlanded sibling claim is invisible, and `KNOWN_GAPS` is shrink-only on
purpose. The lowest-free rule then turned out to be the wrong rule for parallel
work: five builders computed the same answer at the same time. Fixed assignments
replaced it, and ll267 is this lesson's.

So the same gate will flag **259 through 266 unclaimed** against ll267 until the
sibling branches land. That is named rather than worked around, and one premise
behind it was checked rather than taken: **at push time `origin/main` was
`aa9617999` with ll258 as its highest Living Lesson**, and `gh api` reported PRs
**#2414 (ll259) and #2415 (ll260) both `merged: false, state: open`** -- so those
numbers had not in fact landed when this was built. The gaps are registered and
retired centrally; closing them is not this branch's work, and renumbering for
contiguity is exactly what cost two renumbers already.

`scripts/claim-decision-number.mjs` -- which sees numbers held by unlanded
branches, as a local grep cannot -- reports **DR-1228 as the highest on disk with
nothing at or above DR-1229 held in flight**. DR-1228 is clear and is the number
this record keeps.

## Verification run

Locally: `npm run lint`, `npm run verify:gates` (28 guards, including
`lesson-dates:check` and `one-teaching-one-lesson-guard`), this lesson's own test
file, and `living-lessons-numbers-are-unique.test.js` because this lesson
renumbered. `app/src/lib/lesson-dates.json` regenerated with `npm run
lesson-dates`, never hand-edited.

**The full Vitest suite is delegated to CI** (`ci.yml`, four shards on the PR
head), by the coordinator's call: nine builders were sharing one vitest mutex and
nine serialized suites would have cost hours of queueing. The lane cannot merge a
red PR, so the suite still governs the merge — it runs on the witness that does.
