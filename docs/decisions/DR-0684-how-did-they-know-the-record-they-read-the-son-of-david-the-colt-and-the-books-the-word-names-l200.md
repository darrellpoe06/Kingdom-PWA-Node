# DR-0684 — L200: How Did They Know? — the record they read, the Son of David, the colt, and the books the Word names

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/living-lessons-class.js` (new lesson `ll200-how-did-they-know-the-record-they-read-the-son-of-david-the-colt-and-the-books-the-word-names`); `app/src/lib/living-lessons-dates.js` (its day); `app/src/__tests__/living-lessons-l200-verses.test.js` (new, proven-to-catch); `docs/99-session-notes/2026-09-29-l200-recovered-dictation.md` (new: the recovered words, the rule, and the SQL that produced them).
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DR-NUMBER-ALLOCATION, DECISION-RECORDS (and, by record: teach the Word, do not debate it, DR-0098; speak established fact, DR-0100; render his words for meaning, DR-0331)
- **Grounds:** CLAUDE.md, Spoken Teachings Are Build Input (2026-07-03); DR-0331 (meaning, not mishearings; no one quoted but Scripture); DR-0098; DR-0100; DR-0076; DR-0210 (Yahweh in our voice, quoted KJV untouched); DR-0677 (counts are derived); DR-0052 (the next free lesson number); DR-0685 (the dictation defect that garbled this row, fixed separately).

## Context

At 17:59 UTC on 2026-09-29 Darrell spoke a lesson into Thinking Space on his phone. It saved as `public.agent_inbox` row `8d290c20-1d1c-4901-b8a8-a99b45734e76` (source `thinking-space`; tags `lesson`, `lesson-name-ok`, `lesson-name:Darrell Poe`). Android Chrome dictation had appended every partial recognition result, so the body is 54,115 characters that begin "lesson lesson or or how or how or how did ..." and repeat each growing sentence many times (DR-0685 fixes the capture; this record only reads the row).

**How his words were recovered.** Deterministically, inside the database, on the row itself, so no hand transcription could creep in. Each partial either repeats the previous partial and extends it or starts a new run; wherever a partial was followed by its extension, the word sequence holds an immediate repeat `X X`. The rule walks the 10,602 words from the start, and at each position removes the first copy of the **longest** immediate repeat (up to 250 words), re-testing the same position, and moves on only when none is found. What remains is the last and longest version of each run: 202 words, 1,040 characters. A shortest-first pass was tried first and failed on the final sentence (a stray doubled "the" at the head of each partial was collapsed first, which broke the long repeat); longest-first fixed it. The only cost, named: a word he truly said twice in a row would also be collapsed. The rule, the SQL function, the output and the ambiguity table are in `docs/99-session-notes/2026-09-29-l200-recovered-dictation.md`.

**His words, rendered for meaning (DR-0331).** How did all those people know what Jesus was supposed to do when He got there? How did they know He was the Son of David, and all those things? What documentation were they using? Were they only using the Old Testament? Can I find every single reference? What made them know, specifically, that He would come in on a colt? And the other books they name, not the Apocrypha: not the ones documented as false, but the ones that look, sound and smell right, that we know as historical context, that were in the Bible; how does that look through the narrative we already know about Yahweh? Break it all down and put it in a lesson.

**Ambiguities, said plainly.** "Come in on a coat" is rendered colt (the sentence is about the manner of His arrival, and Zechariah 9:9 is the Word's one prophecy of it). "Data-driven since" is rendered sense. "The books of other books that they State" is not certain: read with "they were in the Bible in the past", it most likely means books the Bible itself names; the lesson takes that reading and also teaches how to test any book offered as history, which covers the other reading.

**The intake note's premise, checked.** The intake guessed a lesson on telling apart people and practices in the Bible that look like something in the historical record. The full text shows a two-part question (the messianic record and how they knew; then the books the Bible names, separated from documented fakes). The lesson is built on the full text.

**One teaching, one lesson.** The catalogs and `docs/decisions` were searched for a lesson built from these words (phrases "documentedly", "look smell", "son of David all of those", and the row id): none. Neighbors exist and are cross-referenced, not duplicated: L139 (Genesis 49:11 and the colt thread), L195 (one honest scale for a holy book's copies), L196 (thirty-four prophecies gathered by its own rule). None answers his questions (what they had in hand, how the Davidic claim was checkable, the colt as a kept promise, the books the Word names, the fakes).

**Placement.** Living Lessons, **L200**. `origin/main` at d748429e carried L199 (DR-0681, merged as #1857); no open PR claimed L200.

## What was measured

- Every quoted span was pulled through a generator that refused any fragment not in the KJV verse it names (`app/public/bible/kjv`). Then, by the repo's own `scanQuotedVerses` over the lesson as it sits in the series: **247 quoted spans, 247 verbatim, 0 faults, 73 distinct verses.**
- **The fulfilled-verse list is derived, not typed.** The stated rule (every verse in Matthew, Mark, Luke and John that joins "fulfilled" with spoken, written, scripture, prophet or prophecy) yields **26** verses: Matthew 1:22, 2:15, 2:17, 2:23, 4:14, 8:17, 12:17, 13:14, 13:35, 21:4, 26:54, 26:56, 27:9, 27:35; Mark 14:49, 15:28; Luke 4:21, 21:22, 24:44; John 12:38, 13:18, 15:25, 17:12, 19:24, 19:28, 19:36. The test recomputes it from the KJV files and requires the lesson, teen and senior bands to carry exactly that count word and that list.
- **Every outside fact, tiered per DR-0100:**

| claim | tier | basis |
|---|---|---|
| The people in the Gospels had only what we call the Old Testament; the New Testament was written after the resurrection | established | the timeline of the apostolic writings; Luke 24:44 names the three-part collection |
| The Great Isaiah Scroll (1QIsa-a), found at Qumran in 1947, is a complete Isaiah copied more than a century before Jesus, holding Isaiah 53 | established | palaeographic dating and later radiocarbon tests (Israel Museum, Shrine of the Book) |
| The Law was put into Greek (the Septuagint) at Alexandria in the third century BC | established | standard history of the Septuagint |
| Josephus gives his priestly descent from the public records | established (his own statement) | Josephus, *Life* 1 (sec. 6) |
| The Tel Dan stele (found 1993, ninth century BC, Aramaic) names the house of David | established | Biran and Naveh, *Israel Exploration Journal* 43 (1993) and 45 (1995) |
| The books the Bible cites (wars of the LORD, Jasher, acts of Solomon, chronicles of the kings, Nathan, Gad, Iddo, Media and Persia) are lost; no copy is known | established | no manuscript of any is extant |
| Acts 17:28 quotes Aratus; 1 Corinthians 15:33 is a line known from Menander | established | Aratus, *Phaenomena* 5; Menander, *Thais* (fragment) |
| The Cretan prophet of Titus 1:12 is Epimenides | attributed, stated as attribution | early church writers, Clement of Alexandria (*Stromata* 1.14) |
| Jude 1:14-15 matches 1 Enoch 1:9; Aramaic fragments of Enoch were among the Dead Sea Scrolls; the whole survives in Ge'ez | established | Qumran Cave 4 fragments (Milik, 1976); the Ethiopic text |
| The 1751 English *Book of Jasher*, claiming Alcuin's translation, is a forgery | established | documented as a fabrication; attributed to its printer, Jacob Ilive |
| *Sefer haYashar* was first printed at Venice in 1625 and put into English in 1840 | established | the printed editions |
| When *Sefer haYashar* was first composed | **open, flagged narrowly** | scholars place it in the medieval period; the exact date is not settled, and the lesson says so |
| Tacitus names Christus executed under Tiberius by Pontius Pilate | established | Tacitus, *Annals* 15.44 |
| Josephus names James the brother of Jesus who was called Christ | established | Josephus, *Antiquities* 20.200 |
| The Pilate Stone, found at Caesarea in 1961, names Pontius Pilate as governor of Judea | established | the inscription (Israel Museum) |

- No man is quoted in quotation marks; only Scripture is (a test enforces it). Book titles and the words of inscriptions are given without quotation marks.
- Bands, measured by the repo's gates on the lesson in place: full-levels shares child 0.52, youth 0.62, teen 0.61, senior 0.76 (adult 2,042 prose words); reading grade child 1.7, youth 3.9, teen 5.4, senior 5.6 (ascending; child under the 5.0 ceiling); worst band overlap 0.08 (ceiling 0.5); every band names its lesson in its opening.

## Impact

Without this lesson, Darrell's spoken question sits as 54,115 characters of stutter in an inbox, and a reader who wonders how anyone could have known Jesus was the promised King is left to the internet, where lost books of the Bible are sold beside real history with nothing to tell them apart. With it, the reader sees from the Word what the first hearers had in hand (the Law, the Prophets and the Psalms, read aloud every sabbath), how the Son of David claim was checkable (a sworn promise and kept family records), that the colt was written and then kept on purpose, why some who heard every word still missed Him, the exact list of places the Gospels say Scripture was fulfilled, the books the Word names and the fact that they are lost, how the Word holds a quoted line, how the fakes fail, and how the outside record stands under the Word as a witness.

## Decision

L200, **How Did They Know? — the Record They Read, the Son of David, the Colt, and the Books the Word Names**, joins Living Lessons with ten Word-first movements, four authored bands, an eight-question quiz and ten facilitator talking points:

1. **A waiting people and a public text.** Luke 2:25, 38; 3:15; John 4:25; Acts 15:21; Luke 4:16-17, 21.
2. **The record they had.** Luke 24:44; John 5:39; Romans 3:2; 2 Timothy 3:15; Isaiah 53:5; the Great Isaiah Scroll and the Septuagint as outside facts.
3. **The Son of David: the promise and the family record.** 2 Samuel 7:12, 16; Psalms 132:11; Isaiah 11:1; Jeremiah 23:5; 1 Chronicles 9:1; Ezra 2:62; Luke 2:3-4; Matthew 1:1; 9:27; 22:42; Josephus and Tel Dan as outside facts.
4. **Bethlehem, answered from the page.** Matthew 2:4-5; Micah 5:2; John 7:42.
5. **The colt.** Zechariah 9:9; Luke 19:30; Matthew 21:4, 9; Psalms 118:26; John 12:16; Genesis 49:11 (L139).
6. **Not everyone knew, and how those who knew came to know.** Acts 13:27; Luke 24:25, 27, 45; Matthew 11:3, 5; John 5:36; Matthew 3:17; Luke 2:26; Matthew 16:17.
7. **Every place the Gospels say it was fulfilled.** The rule and its 26 verses, derived; L196 for the wider gathering.
8. **The other books the Word itself names.** Numbers 21:14; Joshua 10:13; 2 Samuel 1:18; 1 Kings 11:41; 14:19, 29; 1 Chronicles 29:29; 2 Chronicles 9:29; Esther 10:2; Ezra 4:15; Isaiah 40:8. They are lost, stated plainly.
9. **What the Word quotes, and what only looks the part.** Acts 17:28; 1 Corinthians 15:33; Titus 1:13; Jude 1:14; the Word vouches for the line it quotes and does not make the source Scripture; the 1751 Jasher forgery and the 1625 retelling; Proverbs 30:6; Isaiah 8:20; 2 Peter 1:16; 1 Thessalonians 5:21.
10. **The outside record, under the Word.** Tacitus, Josephus, the Pilate Stone; Acts 26:26; Luke 1:2, 4; Isaiah 46:10.

And the close: 2 Peter 1:19; John 20:31.

**Where the Word is reticent, the lesson stays with it.** It does not claim any lost book was ever Scripture, does not recommend any surviving book that borrows a lost book's name, and does not go past Jude's quotation to endorse the rest of First Enoch. The debate over the Apocrypha is not staged; Darrell excluded it, and the lesson honors that. The both-sides frame is not used anywhere (DR-0098). Our voice says Yahweh; quoted KJV is untouched.

**Counts are derived (DR-0677).** No count line was edited: `LIVING_LESSONS_META.weeks` is a getter over the array. The lesson's own count (twenty-six) is recomputed from the KJV by its test.

## Verification

- `living-lessons-l200-verses.test.js`, 24 tests green: fields, number 200, order after L199, date; every span verbatim against its named verse on every surface; every double-quoted span carries a reference; straight quotes, no ellipsis, no record id, no percentage; the Word leads and all ten movements plus the close are pinned in order, by quotation and by reference in the lesson and all four bands; the fulfilled-verse count and list re-derived from the KJV; the provenance pins (spoken source, recovery rule, the misheard word, the Apocrypha excluded); the Yahweh-in-our-voice and lowercase-adversary checks; all four band gates.
- **Proven to catch**, in the suite: a planted generic name fires the voice check; "colt" misquoted as "horse" in Zechariah 9:9 fails the verse gate; Joshua 10:13 re-pointed to 10:14 fails the verse gate; a count off by one, and a list missing one verse, each fail the derived-count pin; a dropped movement sentence fails its pin. Separately, mutating "Jasher" to "Jashar" in the lesson's Joshua 10:13 quotation inside `living-lessons-class.js` failed the verbatim test (`levels.child :: not-the-verse :: Joshua 10:13`; 1 failed, 23 passed); restoring the file turned it green (24 passed).
- Gate groups green: band differentiation, course band coverage, course bands reach the reader, course quotation integrity, quotation integrity, quoted-verse-is-the-verse, reading level, title in narrative, full levels (174 tests); curriculum diversity, curriculum gates, curriculum round trip, every stage reaches the reader, learn crosslist, lesson store, id collision, living lessons order, TLC curriculum (111 tests); the 23 series-level living-lessons suites (356 tests).
