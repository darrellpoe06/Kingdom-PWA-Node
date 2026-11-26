# Session note: the Prophetic Voices teach what they said (DR-1686)

The full narrative behind DR-1686, moved here so the record stays within its length ratchet.

## Context

Darrell, 2026-11-26, from the new-look lesson screen: "We need to do better with
our leaders messages!!!! They said more than we show?!!!!!! A lot more... these
lessons seem to be undermined". Then: "Foundation is solid however it leaves me
wanting to understand what they said?!!!!", "All of these are too short!!!",
"I believe you can give at least 10 lessons each for Price and Darby... I want
to add Myles Monroe... let them speak and site them as they are", and "Our
history is amazing and our historical lessons need real data driven
clarification and knowledge of the Word... grace and mercy... however no
lies!!!".

## What was measured

- Each of the six lessons kept the word count it was born with on 2026-07-03
  (#540): Price 281, Darby 445, Diop 351, Obenga 309, Williams 348, inventions
  386. They were never cut; they were written short, from ministry listings and
  channel pages, never from the messages themselves.
- The first three research passes reached no primary source: the environment's
  allowlist refused every host. Darrell opened the hosts; the next passes read
  the UNESCO General History of Africa vol. II and the 1978 symposium
  proceedings, The African Origin of Civilization, The Destruction of Black
  Civilization and Munroe's books in full or page-cited preview.
- Darby's dates: the lesson said "d. early 2021". His own ministry's channel
  marked his "Heavenly 54th Birthday" on 2026-11-12 (born 1972), and
  Lawrence-Harper (2023) records his death in December 2017. The 2021 figure
  traced only to a content-farm blog.
- Of 92 catalog lessons built on a named teacher, 11 teach what the teacher
  said in his own words; 66 are partial (mostly from a summary of a link), 15
  only ABOUT the person (the inventory session note).

## Decision

1. **Each voice teaches his own message, lesson by lesson**, one file per voice
   under `lib/prophetic-voices/`, composed after his opener in `PV_MODULES`.
   Landed here: Dr. Myles Munroe (new, 13), Dr. Cheikh Anta Diop (opener + 5),
   Dr. Théophile Obenga (opener + 3), Dr. Chancellor Williams (opener + 4).
   Each lesson: the setting, his argument step by step, his evidence, his own
   lines (verbatim only from a fetched source, page-cited), his call, then the
   Word weighing it; four age bands, two stories, every verse from the corpus.
2. **Where he goes past the Word, the Word corrects that claim, narrowly**; the
   true record he marshalled stands. Grace and mercy run through the hard
   history; no contempt for any people; no over- or under-claim.
3. **See the men themselves.** Real photographs where a free license exists
   (Diop, public domain; Obenga, Teham, CC BY-SA 3.0, credited on the cover and
   in the caption). A photograph of a named person carries `photographOf` and
   `license` in place of DR-1287's drawn-people label, which would have named a
   Senegalese and a Congolese scholar "African American". Price, Darby and
   Munroe: portraits pending permission (requests drafted for Darrell).
4. **His own voice in his lesson.** Price's opener carries his Race, Religion &
   Racism broadcast, labeled "His own message"; the new-look lesson screen now
   plays a lesson's video, which only the classic page did.
5. **Price and Darby follow in their own PRs** (at least ten each), from the
   Ever Increasing Faith series and from Darby's recordings (fifteen archive.org
   recordings transcribed here, seven YouTube messages through the NAS caption
   route); then Malcolm X (ll337), then the inventory, thinnest first.

## Impact

The course grows from 6 lessons to 31 in this PR, each 1,400-1,900 adult words.
A reader finishes a lesson knowing what the teacher argued and on what evidence,
and how the Word weighs it. Corrected: Darby's dates, Williams's Howard claim (a
graduate; that he taught there is not confirmed), Obenga's unsourced examples.

## Verification

- The repo's own scanners on every new file: 0 verse faults, 0 uncheckable
  (fill-verses `--check` clean on each). `every-store-of-his-words` now reads
  `lib/prophetic-voices/` (251 cases green).
- `prophetic-voices`, `lesson-figures` (new case: a photograph without its
  license is refused), `lesson-video` (new case: the label override),
  `course-band-coverage` (allFour measured 327 -> 352, adultOnly 0),
  `lesson-dates` (1020 of 1020 dated), `learn-integrity-baseline` (only the six
  prophetic-voices entries move; counts 994 / 4,554): green locally.
- Re-review: when Price and Darby land, and when the 33-host card clears
  (`re-review: 2026-12-03`).
