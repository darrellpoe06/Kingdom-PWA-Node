# DR-0572 — The History department opens on the standard before the story

- **Status:** accepted
- **Tier:** B (a new department and course in the school; no money, no schema, no external publication)
- **Type:** content
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/history-course.js` (new — eight lessons, two bands each); `app/src/lib/learn-catalog.js` (the `history-truth` row; `category: 'History'` opens the department); `app/src/lib/learn-crosslist.js` (cross-listed onto The Word & The Way, measured); `app/src/__tests__/history-course.test.js` (41 checks, new)
- **Principles:** WORD-FIRST (DR-0127 / DR-0282), TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), VERIFICATION-DOCTRINE (DR-0076), DR-0210 (Yahweh in our voice; quoted Scripture verbatim), DR-0497 (bands from the first commit), DR-0540 (every course declares its shelves)
- **Grounds:** Darrell 2026-09-22 — *"We need history to reflect actual history!!!!! Courses on Historical Truth Light from Yahweh's perspectives explicitly and comprehensive summary... American Historical accuracy from the beginning... least of these and fatherless and widows narratives... two or more gather together there He will be in the midst..."* → *"Lessons about History need to be organized and we need to fill whatever gaps we have..."* → **"Build the History department"**

---

## Measured before it was built

The school carried ten departments — A.I. The Way, Serve the House, The Word & The Way, Mathematics, Business, Development, Project Management, Kingdom Life & Stewardship, Real Estate, Stock Market — and **no History department**. No mounted course taught American history at any age; `learn-catalog.js` did not contain the word. The gap he named was the whole department.

## The decision — one course, eight moves, Word-first

The department opens the way the Real Estate department opened (DR-0500): on a footing, not a topic list. **Historical Truth: American History in the Light of the Word** is one argument in eight moves, each anchored in the Word before it touches the record:

1. **The standard before the story** — "Thy word is true from the beginning" (Psalms 119:160); the record is kept by a chain of persons (Deuteronomy 32:7; Psalms 78); a generation nobody told (Judges 2:10).
2. **The fatherless, the widow and the stranger** — Yahweh's measure of a nation (Deuteronomy 10:18-19; Exodus 22:22-23); the King among the least (Matthew 25:40); applied to 1830 and the removal of 1838-39.
3. **The landmark and the vineyard** — Deuteronomy 19:14; Naboth as procedure (1 Kings 21:3, 19); New Echota (1835, ratified 1836, removal 1838) and the Dawes Act (1887; ~138M acres to ~48M by 1934).
4. **The wage that could not wait** — Leviticus 19:13; Exodus 21:16; Deuteronomy 23:15-16; 1619; 1808; 3,953,760 in the 1860 census; the 1850 Act as the exact inversion of Deuteronomy 23:15; 1863; Juneteenth; the Thirteenth Amendment and its exception clause; the Word explaining the Word (1 Timothy 1:10; Leviticus 25:42; Philemon 1:16).
5. **Two weights in one bag** — Deuteronomy 25:13-16; Isaiah 10:1-2; Leviticus 19:15; 1787, 1857, the Black Codes and convict leasing, 1896, the HOLC maps; and the removals, 1954, 1964, 1965, 1968, stated as plainly.
6. **The fields of the fatherless** — Deuteronomy 24:19-21; Ruth 2:2; Proverbs 23:10-11; Field Order No. 15 and its reversal (1865); the Bureau (1865-72); Greenwood (1921); and the gleaners who built.
7. **No respecter of persons** — Genesis 1:27; Acts 17:26; Acts 10:34-35; the founders' sentence traced to its Owner; Douglass in 1852; the dated applications and denials; James 2:9.
8. **Two or three witnesses** — Deuteronomy 19:15; Matthew 18:16; 2 Corinthians 13:1; Proverbs 18:17; and his own verse, **"where two or three are gathered together in my name, there am I in the midst of them" (Matthew 18:20)** — how a true history is kept, and Who is in the room.

His three phrases are pinned by test to where they land: *least of these / fatherless and widows* in lesson two, *two or more gather together* in lesson eight.

## The two disciplines the course keeps separate

**DR-0100 — established fact is stated plainly with its date and its record.** Every American fact in the course points to the census, the statute, the court opinion, the treaty or the testimony it came from, and the care note tells the reader to check it. The one number the course calls unsettled — the Tulsa dead — is called unsettled narrowly, beside the destruction that is stated as documented beyond question; the test refuses "unsettled" or "contested" anywhere else.

**DR-0098 — teach the Word, do not debate it.** Where Scripture was quoted in defence of bondage, the course answers with Scripture (man-stealing capital; all nations of one blood; James 2:9) rather than staging schools of opinion; the test refuses "some historians say" and "you decide" anywhere in the module tree.

## Verification

- **41 checks, green.** Every quoted span in the whole module tree walked against the repo's own KJV (well over ninety spans; the walk refuses to pass on zero). "The LORD" absent from our prose and present in the quotations. Both bands on every lesson measured: teen ≤ grade 6.0, senior ≤ 10.0, teen easier than senior, each band ≥ 0.6 of the adult text, ≤ 0.25 eight-word-shingle overlap against its sibling and against the adult text; both bands render through `formatLessonText` losing no word. The department opens by category with no new machinery; the cross-listing's `measured:` count equals `historyRefs().length` (39). Proven-to-catch on a drifted quotation, a wrong reference, "the LORD" in our prose, an inverted ladder, a summary posing as a band, a near-copy, and both-sides theatre.
- First measurement corrected two of my own faults before shipping: a quiz option that said "the LORD" in our voice (now a verbatim quotation with its reference), and a teen band at 0.53 of the adult text (now full).
- Full suite, lint and the gate chain: recorded on the commit.

## Limits, stated

1. **One course does not make the department whole.** The fields this course opens — the removals, the bondage, the two weights, the least of these, the founding standard — each deserve a course read the same way. The eight-move arc is the department's method; the next courses are the department's depth. `re-review: 2026-10-07`.
2. **Counts the course states as established are the commonly documented figures** (about four thousand on the Trail of Tears; roughly 138 to 48 million acres under allotment; twelve and a half million carried across the Atlantic). They are stated as the record states them, with the record named; a reader who finds a primary source giving a different figure is meant to bring it, and the course says so.
3. **The course reads to 1968.** The half-century since is a course of its own, and it is not pretended here.
