# L132 — The Whole Salvation Plan From Genesis Alone (2026-09-08)

**Module id:** `ll132-the-whole-salvation-plan-inside-genesis-alone-and-the-godhead-at-war-with-the-enemies-from-the-first-pages`

**Spoken into the app by Darrell**, in three passes during the build:

1. *"How to see the whole salvation plan from the GodHead inside Genesis only... all lesson from only Genesis and that shows our enemies early in the narratives only in the first 5 books."*
2. *"so we can see the Father Son and Holy Spirit working together against the enemies especially the devil lucifer satan etc..."*
3. *"other supporting verses from outside of the first 5 books, however the meaning of the ideas etc... context because there are people who don't accept anything outside of the first 5 books."*

The third pass is the one that set the architecture, and it arrived after Parts One through Eight were already written. It reframed the restriction from a stylistic constraint into an **apologetic**: the case has to stand in front of a reader who receives only the Torah. That only works if the case is genuinely self-sufficient — so the outside witnesses were added as a **separate, explicitly removable part**, not woven through.

## What shipped

- **`living-lessons-class.js`** — Living Lesson L132, full shape: 11 benefits, 11 quiz questions, 12 talking points, 12 discussion prompts, authored child / teen / senior levels plus the adult base lesson. `LIVING_LESSONS_META.weeks` 130 → 131.
- **`godhead-study.js`** — `gh-genesis-holds-the-whole-plan` (torah section), the pattern side of the same teaching; `godhead-study-verses.json` regenerated (297 refs fetched verbatim).
- **`living-lessons-l132-verses.test.js`** — 31 assertions, six of them proven-to-catch.
- **Ratchets** — `reading-level-baseline.json` `measuredLessons` 130 → 131 (L132 adds **no** debt); `lesson-harnesses-never-vanish.test.js` REQUIRED extended to 132.

## The teaching, in one line per part

1. **The Three are on page one, before any enemy exists** — the Father creating (1:1), the Spirit moving in the *second verse* (1:2), the Word speaking light into being (1:3). The Godhead is not organised *by* the crisis; the crisis walks into a room where the Three are already at work.
2. **The enemy enters and his method goes on the record** — introduced as a *creature*, subtil rather than strong. Three moves, never updated: a QUESTION about what Yahweh said, a flat CONTRADICTION of it, a PROMOTION offered for taking it.
3. **Yahweh seeks before He sentences** — *"Where art thou?"* (3:9) comes before any verdict.
4. **The whole rescue is announced TO the enemy, as his sentence** — 3:15. A crushed head ends the creature; a bruised heel heals.
5. **The first death is a covering Yahweh made** — coats of skins (3:21), and the way to the tree of life is *kept*, not demolished (3:24).
6. **The plan runs the length of Genesis** — accepted offering (4:4), the Spirit striving (6:3), grace *found* (6:8), righteousness *counted* (15:6), the covenant Yahweh walked alone while Abram slept (15:17), the lamb provided *in the stead of his son* (22:8, 22:13), the ladder (28:12), the Man at the ford (32:24, 32:30), the King before the kingdom (49:10), evil overruled to save much people alive (50:20).
7. **The enemies, named early across the first five books** — the serpent, the giants, Babel's name-making, the gods of Egypt, the enchantments, devils, molech, baalpeor; Deuteronomy 32:17 as the Torah's own verdict.
8. **The Three working together against them** — the Father declaring the enmity and judging the gods of Egypt; the Son as Seed, provided Lamb, the Man at the ford, the Angel carrying the Name (*"for my name is in him"*), the Star out of Jacob, the Prophet to be raised up; the Spirit moving, striving, filling, resting on the seventy and on Joshua. **Never once at odds** — which is the pastoral payoff: no one has to persuade one Person of the Godhead to agree with another.
9. **Supporting witnesses from outside the first five books** — kept separate, marked as confirmation, and stated to be removable without touching Parts One through Eight.

## Verification (DR-0076)

- **210 double-quoted spans, every one verbatim KJV** from the in-repo corpus (`app/public/bible/kjv/`), single-verse. `NOT_SCRIPTURE` is empty.
- **House rules measured, not assumed**: 0 generic "God" in our authored voice, 87 Yahweh, adversary and false-god names lowercase in our voice while every quotation keeps the KJV's own "God" / "LORD" untouched (DR-0210 bright line). Jesus confessed as the Lamb of Yahweh and the Eternal Son of Yahweh.
- **Reading ladder measured**: child 0.6 · teen 5.9 · senior 7.1 · adult 7.3. Not inverted, child under the grade-7 ceiling — so L132 adds nothing to the shrink-only debt.

### Proven-to-catch (six mutations, each confirmed to fail the gate)

| mutation | caught |
|---|---|
| an outside-Torah verse smuggled into the case (John 3:16) | ✅ |
| a second smuggling attempt (Isaiah 53:5) | ✅ |
| the appendix reframed as load-bearing | ✅ |
| a word altered inside a Scripture quote (*bruise* → *crush*) | ✅ |
| Genesis 1:2 paraphrased (*moved* → *hovered*) | ✅ |
| speculation past the text + both-sides framing on Genesis 6 | ✅ |

### Two corrections made during the build, recorded rather than smoothed over

- **The first mutation harness was wrong, not the gates.** Replacing the first occurrence of a Genesis 3:15 quote hit a *different lesson* (the phrase appears 10× in the file), so two mutations "survived" that had never touched L132. Rewritten to mutate only inside the L132 block; all gates then caught.
- **The first case/appendix split measured the wrong text.** Slicing the raw source at the Part Nine marker also dropped the quiz and facilitator (they sit after `lesson` in the file) and swept the teen/senior levels into "the case". Rescoped to the lesson body via the module object.

## The restriction is enforced, not just intended

`living-lessons-l132-verses.test.js` splits the lesson body at the Part Nine marker and asserts the case portion cites **only** the first five books. A future session "strengthening" this lesson by reaching for Isaiah or John would dissolve the exact thing being demonstrated — and now fails the build instead.

## Doctrinal posture

DR-0098 held throughout: where Genesis 6 names the "sons of God" without explaining them, the lesson **stays where the text stays** and says so, rather than staging camps or importing a debate. DR-0210 held: Yahweh in our voice, the KJV untouched inside every quotation.
