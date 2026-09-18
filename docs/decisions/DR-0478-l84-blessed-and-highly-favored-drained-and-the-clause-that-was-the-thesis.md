# DR-0478 — L84's blessed-and-highly-favored drained, and the clause that WAS the thesis

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, built from Darrell's own spoken request)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L84's four bands rewritten, youth created, eight elisions healed across five reader-facing fields, five generic uses of the name corrected in our own voice), `app/src/__tests__/living-lessons-l84-verses.test.js` (21 → 58 checks), all four shrink-only baselines (three shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), WORD-FIRST (DR-0097), COVENANT-NAME-IN-OUR-VOICE (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet), DR-0476 (the five-weak-checks finding), DR-0477 (L85, the clean sweep this nearly repeated), DR-0459 (no elision inside a quotation)

## Why this exists

L84 answers Darrell's own question — *"what does it mean to be blessed and highly favored based on the biblical scriptures across all ages until the revelation? Before during and after time?"* The pass reached it with all four bands short and youth absent.

| band | before | floor | after |
|---|---|---|---|
| child | 138 words, **0.26** | 0.50 | 670 words, **1.24** |
| youth | **absent entirely** | 0.60 | 610 words, **1.13** |
| teen | 229 words, **0.42** | 0.60 | 614 words, **1.13** |
| senior | 311 words, **0.57** | 0.60 | 650 words, **1.20** |

The senior band read at **FK 11.55** against an adult lesson at 5.72. Ladder now **3.20 / 4.78 / 6.48 / 8.11**, monotone.

## The decision

### a. EIGHT ELISIONS — THE MOST OF ANY LESSON IN THIS PASS — AND ONE OF THEM CUT THE THESIS

Eight elided quotations sat across five reader-facing fields: three in the adult lesson, the same three in `bigIdea`, one in the child band, one in the teen band, one in senior.

| verse | what the elision cut | why it mattered |
|---|---|---|
| Genesis 12:2 | "and make thy name great" | the middle term of the blessing, and part of what makes Abraham *a blessing* to others |
| Genesis 50:20 | "to bring to pass, as it is this day" | the clause that dates the vantage — the reason Joseph can say it at all |
| Matthew 5:11 | "and persecute you, and shall say all manner of evil against you falsely" | two of the three things the verse names, and the two a reader is most likely to actually face |
| **Genesis 39:21** | **"in the sight of the keeper of the prison"** | **this phrase IS the lesson's thesis** |

That last one is the finding of this record. The lesson's whole argument is that **the favour is inside the prison** — not instead of it, not on the way out of it. Genesis 39:21's own words locate it there: *in the sight of the keeper of the prison*. Two bands quoted the verse with exactly that phrase elided, which means they were **making the claim while cutting the evidence for it out of the verse they cited**. A reader who noticed would have no way to check the thesis against the text it rests on. All four bands now carry the verse whole, and a check requires it in every band.

### b. THE COVENANT NAME — FIVE GENERIC USES IN THE BAND LEAST ABLE TO SORT IT OUT

The old child band said *"God chose her"*, *"God being WITH you is the favor"*, *"Sometimes hard things are how God trains His kids"*, and closed with *"God picked you, God is with you, God is training you, and God has a happy ending waiting"* — five generic uses in our own authored voice, in the band whose reader is least equipped to work out which god was meant. That is exactly what DR-0210 exists to remove. The child band now says Yahweh fourteen times in its own prose and the generic name zero times.

The bright line runs the other way too and is now checked as such: Daniel 1:9's *"Now God had brought Daniel into favour"* and Revelation 21:4's *"And God shall wipe away all tears"* must stay letter-for-letter, so a sweep in the other direction fails the build rather than corrupting the text.

### c. FIVE MOVEMENTS, HELD PER BAND

Every band carries: the slogan named **and the cost of believing it** (the pastoral sentence a shorter version always drops — that a person on the slogan reads hard providence as abandonment); the location argument of Ephesians 1:3 **with its consequence**; all six witnesses of the record (Noah, Abraham, Joseph, Job, Daniel, Mary), because the force of that movement is cumulative rather than anecdotal; **Psalms 105:19**, the promise itself doing the trying; Mary's greeting and her sword held **together**, since splitting them is how the slogan survives; that Paul **asked for removal and did not receive it**, without which the sufficiency text teaches the opposite of what it says; and the four-part definition landed on the reader's own season.

## The finding

**A CHECK THAT CANNOT BE ATTRIBUTED IS A CHECK THAT CANNOT BE TRUSTED.** 37 breaks ran. 34 were caught first time. Of the three that were not:

- **One real weak branch.** The location check's alternation included `/in heavenly places/` — but our prose repeats that phrase straight out of Ephesians 1:3, so the branch was satisfied by an **echo of the verse**, and the sentence that actually presses the point could be deleted with the gate green. Narrowed to the claim: a statement of *where* the blessings are held. This is the DR-0476 shape for the sixth time, in a new dress: not a word the passage contains, but a word the passage's own quotation lends to the prose beside it.
- **Two that were my harness's bookkeeping** — and they exposed something worth fixing anyway. Both breaks failed the gate on the *right* band but reported as the wrong test, because **two claims were sharing one `it()`**: Ephesians' location and its consequence in one, and the favour-in-the-prison and the instead-of refusal in another. A break that removed only the second claim reported as a failure of the first. The pairs are now four separate checks. The lesson generalises: when two claims live in one test, a gate can still catch a regression but nobody can tell *what* regressed — and a finding you cannot attribute is one you cannot act on.

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.24 / 1.13 / 1.13 / 1.20 against floors 0.50 / 0.60 / 0.60 / 0.60.
- Reading: ladder 3.20 / 4.78 / 6.48 / 8.11, monotone; child under the 7.0 ceiling.
- Quotations: **85 quoted spans across the four bands, every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; the ratchet reports L84 with `elided: []` and `recited: []`.
- The covenant name: Yahweh in every band's own prose (14 / 3 / 3 / 3), **0 generic uses in our own voice** in any reader field.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over the 420-character wall limit.
- Break harness: **37 / 37 caught** after the fixes (34 first time, 3 on re-run).
- Baselines: short **84 → 83**, title-unnamed **150 → 149** (bands 451 → 449), quotation **109 → 108** lessons, 0 fresh and 5 healed. None gained an entry.
- Gate: 58 checks, up from 21.
- One guard earned its keep twice: the insert script's `assert "'" not in t` caught a straight apostrophe in the teen band before anything was written, and its elision count assertion refused when a span turned out to appear **three** times in the file rather than twice — a third copy living in a different lesson. The replacement is now block-scoped, so a shared elision in another lesson can never be rewritten by this lesson's pass.

## Consequences

- The full-levels pass has **83** lessons left carrying a short band. Next is L83, downward.
- The DR-0473 elision debt is at 108 lessons, still under its own `re-review: 2026-11-18`.
- L84's anchor list still names only Luke 1:28 while the bands now teach from twenty references. Same deferral as L89, L88, L86 and L85 — **re-review: 2026-10-24**.
