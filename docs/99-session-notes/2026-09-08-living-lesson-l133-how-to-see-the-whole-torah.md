# L133 — How to See the Whole Torah at Once (2026-09-08)

**Module id:** `ll133-how-to-see-the-whole-torah-at-once-the-twelve-patterns-and-the-two-questions-that-opened-them`

**Spoken into the app by Darrell**, twice:

1. *"I still need another lesson with all this information... it's too good not to give me a lesson. inside the lessons section for users to process"*
2. Mid-build, looking at my first draft: ***"why do I need to do all that to see the map?!!!!!!"***

## The second message caught a real design error, and it changed the lesson

My first draft's `inApp` step told him to take a page and three columns, hand-build the map from scratch across five chapters, and *then* open the app's map and compare. That is homework standing between a reader and the thing that was already built for them to see. He was right, and the correction is now the shape of the lesson:

- **The lesson body delivers the whole picture.** Reading it *is* the work — it opens by saying so.
- **The in-app step is LOOKING, not rebuilding.** Open the map, read the top of the screen, tap one family, open two or three patterns. That's it.
- **It names exactly where the map is** (Church → Eternal Algorithms → Torah pattern map), so nobody hunts for it.

A gate now pins all three, so a future edit cannot quietly turn it back into a project.

## What shipped

- **`living-lessons-class.js`** — L133, full shape: 11 benefits, 11 quiz questions, 12 talking points, 12 discussion prompts, authored child / teen / senior plus the adult base. `weeks` 131 → 132.
- **`living-lessons-l133-verses.test.js`** — 29 assertions, six proven-to-catch.
- **Ratchets** — `reading-level-baseline.json` `measuredLessons` 131 → 132 (**no new debt**); `lesson-harnesses-never-vanish` REQUIRED extended to 133.

## The teaching

It opens with the discipline before any pattern: **NAMED vs SHOWN**. Some things the text uses the words for (the Spirit in Genesis 1:2). Some things it displays without the later label (the Man at the ford). Reading the second as the Son is *our confession*, and the lesson says so in those words — because *"the study has started lying in a way nobody in the room can detect"* the moment a confession passes as though the verse said it.

Then the patterns: the Three on page one · the four plurals held beside `Deuteronomy 6:4` · the Spirit across all five books (including the craftsman — **skilled work is Spirit-work**) · the One who carries the Name · **what the likeness means** · the substitution chain as one chain · the enemy's three moves · **knowing Yahweh did not prevent it**.

And it closes on **Deuteronomy 29:4**, deliberately: *"Yet the LORD hath not given you an heart to perceive."* The facilitator notes say it outright — *never end that section on Balaam*; a room that leaves feeling clever about its own eyes has been taught the opposite of this lesson.

## Verification (DR-0076)

- **178 double-quoted spans, every one verbatim KJV** from the in-repo corpus. `NOT_SCRIPTURE` is empty.
- **House rules measured**: 0 generic "God" in our authored voice, 55 Yahweh, adversary and false-god names lowercase, every quotation's own "God"/"LORD" untouched.
- **Reading ladder**: child 2.4 · teen 5.7 · senior 7.1 · adult 7.1. Not inverted, under the ceiling.

### Two of my own errors the gate caught before shipping

- **Darrell's own words were inside double quotes.** The whole-span gate treats a quoted span as Scripture and correctly refused it. His words are now rendered for meaning without quote marks (DR-0331).
- **An ellipsis-joined span** — `"saw... and they took them wives of all which they chose"` — is not corpus text. Split into two real spans. That case is now the file's proven-to-catch test.

### Proven-to-catch (six mutations)

the map turned back into homework · the lesson no longer delivering the picture · a Scripture quote reworded · the knowing-rebellion conclusion reversed · the humility close removed · the craftsman/Spirit-work claim removed.

**Full suite: 12,573 passing.** Lint clean at `--max-warnings 0`.
