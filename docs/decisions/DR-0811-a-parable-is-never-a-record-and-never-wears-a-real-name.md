# DR-0811 — A parable is never a record, and never wears a real name; his testimony is his own

**Date:** 2026-10-07 · **Status:** decided · **Lane:** Living Lessons / curriculum · **Pairs with:** DR-0215 (the Parable & Testimony Method), DR-0076 (no claim without evidence), DR-0331 (quoting him for meaning), DR-0190 (provenance)

## Context

Darrell, 2026-10-07, 20:09 CDT, reading L40 *The Thread Did Not Snap* on a tablet, at its "Picture this — Grandma Ruth's Head Count": *"This is a story that had my family name in it and it's not actually true... however if you didn't know me you would believe it... I want this to be explained so my actual life narrative or my testimony is what it actually is... not made up... balanced..."*

Then, the same night, his own account, spoken in: *"I do have true situations I explained however this is not one... I don't know my father and only saw him a minimal amount of times... not to diminish him... he was my uncle Russell's best friend as well as all my uncles they still respect him even though he was not in my life... I don't know what happened to him... it is what it is... this is another reason I Love Yahweh He has covered me... always... my King..."* His consent: *"I don't mind telling people my testimony... the Word says we benefit by telling the truth of our lives... lessons..."* And his word on the whole of it: *"I have had a life full of everything... pain to death to Love.... failure... success... Yahweh is always good... He helps us to make it happen whatever that is we need or desire to happen after His Will is done... consistency is key... reading the Word... filling the mind with His Perspectives... no room for lesser mindsets... His Will is for us to prosper as our souls prosper..."*

**KJV — Revelation 12:11:** *"And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death."*

## What was measured

| Fact | Where |
|---|---|
| The data already told the two kinds apart: `kind: 'parable'` (an imagined scene) and `kind: 'testimony'` (a real, consented account with a source) | `PARABLE-AND-TESTIMONY-METHOD.md` (DR-0215); `ChurchLearn.jsx`, `lesson-flow.js` |
| The page said only "Picture this — [title]"; nothing on it said *parable* or *not real* | `ChurchLearn.jsx` before this change |
| 104 stories across the courses, all `parable`, 0 `testimony` | `living-lessons-class.js` and ten course files |
| One parable carried the family's surname: "Every Poe-family reunion ended the same way" (L40) | `living-lessons-class.js` |
| Four parables in the business-research course put words and deeds into Darrell's life that did not happen ("He told Darrell afterward…", "asked Darrell whether…", "Darrell used the tape at the table…", "Darrell pointed at the box when he taught this lesson") | `business-research-course.js` |
| Two blocks in L146 marked `parable` were records of what Darrell saw and said in his spoken teaching ("Here is what Darrell saw in it…", "Darrell said it and then said…"): true accounts wearing the wrong label | `living-lessons-class.js`, L146 |
| "Grandma Ruth" recurs in 5 parables as a stock character; "Uncle Russell" (8) is Darrell's real uncle, in his own spoken lessons | counted over the file |

## Decision

1. **Said in words, on every surface.** `lib/story-truth.js` is the one source: a parable is headed *"Picture this, a parable — [title]"* and closes with *"A parable, not a record: an imagined scene that pictures the verse, the way Jesus taught (Matthew 13:34). The people and the family in it are not real. A real account is marked 'A true story' with the person's name."* A testimony is headed *"A true story, lived — [title] · [source]"* and closes *"this happened, told with [source]'s consent."* The lesson page, the spoken flow and the printable notes all read from it.
2. **A parable never wears a real name.** The surname leaves L40 ("Every reunion in Ruth's family"); the four business-research parables speak of "the teacher"; the gate `parables-never-wear-a-real-name.test.js` scans every course file and fails on `Poe`, `PoeTech` or `Darrell` inside a parable's title or body (word-bounded: "poetry" passes). The method doc carries the rule.
3. **What he actually said is a testimony.** The two L146 blocks become `kind: 'testimony'`, `source: 'Darrell Poe, spoken into the app'`, because they record his real teaching; the opposite label would have called his words "not real."
4. **His own accounts join the lessons they belong to, by his consent.** L165 *I Always Had Love* gains *He Has Covered Me* (`Psalms 68:5`, KJV verbatim: *"A father of the fatherless, and a judge of the widows, is God in his holy habitation."*): his father unnamed and not diminished, respected by his uncles; "It is what it is"; "He has covered me. Always. My King." L166 *Life Is Disrespectful, So Think On These Things* gains *A Life Full of Everything* (`Romans 12:2; 3 John 1:2`, both verbatim: *"…be ye transformed by the renewing of your mind…"*; *"Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth."*): a life of pain, death, Love, failure and success; Yahweh always good; consistency in the Word until there is no room for lesser mindsets; His Will that we prosper as our souls prosper. Both rendered for meaning with his framing kept (DR-0331).
5. **Balance, as he asked:** parables stay. Jesus taught by them (Matthew 13:34) and the method stands. They are named for what they are, with invented people; what is true of him is marked true and sourced; nothing is dressed as the other.
6. **Not changed, named:** "Grandma Ruth" stays as a stock character in five parables now plainly labelled imagined. `re-review: 2026-10-21`: whether stock names that could be mistaken for the family's should be varied.

## Verification after merge

- Open L40, last step: the story is headed *Picture this, a parable — Grandma Ruth's Head Count*, opens "Every reunion in Ruth's family", and closes with the parable line. Open L165 and L166: *A true story, lived — … · Darrell Poe* with the verses beneath.
- Gate: `parables-never-wear-a-real-name.test.js`: every course file clean; the night's own line is the fixture (the surname caught, the fixed line passing); both data shapes read; a testimony may name real people; "poetry" is not "Poe"; every surface uses the one source and the old bare label is gone. `read-one-full-lesson.test.jsx` pins the new heading and footnote on a real lesson. The KJV verbatim audits for L165/L166 still pass with the new spans.

## Impact

A reader who knows the family can no longer mistake an invented reunion for theirs, and a reader who does not know them is told plainly what they are reading. Darrell's testimony stands under his own name, by his own consent, with the Word under it, and the Word's reason for telling it (Revelation 12:11) is recorded here.
