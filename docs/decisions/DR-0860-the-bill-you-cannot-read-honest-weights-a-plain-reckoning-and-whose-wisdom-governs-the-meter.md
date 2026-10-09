---
id: DR-0860
title: The bill you cannot read — honest weights, a plain reckoning, and whose Wisdom governs the meter (L236)
status: accepted
date: 2026-10-09
tier: A
declared_by: Darrell (forwarded by email with one word on top, Lesson)
supersedes: []
principles: [SOURCE-OF-ANSWERS, WORD-FIRST, VERIFICATION-DOCTRINE (DR-0076), TEACH-DO-NOT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-LESSONS (DR-0611), EVERY-LESSON-SENDS-YOU (DR-0733), SEARCH-IT-OUT (DR-0734), A-PARABLE-IS-NEVER-A-RECORD (DR-0811), RENDER-FOR-MEANING (DR-0331), THE-RESOURCES (DR-0530)]
---

## Context

On 2026-10-08 at 14:25 UTC Darrell forwarded a utility-trade newsletter into
the app by email (thread `1a11be8188dbc2f6`, subject `FW: Where utility billing
still loses customer trust`) and typed one word on top: Lesson. Under that word
he put his own teaching, rendered here for meaning and not for his typing
(DR-0331):

> Solar panel costs, and switching to owning them rather than renting from a
> utility, then paying that off in twenty years or less at two percent interest,
> will save money against an ever-increasing electrical energy cost, because the
> grid cannot keep up with the demand or the projected future demand. Also using
> electric vehicles, where the energy to move a car four hundred miles comes
> from one charge. The difference between the two is night and day. However,
> there is risk in all things, and following His Wisdom is most important.

**A premise conflict was found before anything was written, and is recorded
here rather than worked around.** This build was assigned "one lesson from
thread `1a11be8188dbc2f6`". That thread had already been taught: **L221 /
DR-0821**, dated 2026-10-08, carries the same email, the same rendered teaching
and the same governing clause, and it works the ownership arithmetic — the cash
price, the total repayment, the payback at your own rate, the real range
figures, the dealer fee hidden inside a low advertised rate, the Word on
borrowing and on interest, and risk held the way Ecclesiastes 11 holds it.
Building a second lesson on the same axis would have been a near-duplicate of
work already shipped the day before.

So the standing rule was followed: surface the conflict, name the option taken,
and proceed (Layer 0, `feedback_surface_premise_conflicts`; DR-0111 limit 3).
The option taken: **build L236 on the strand of that same email L221 left
untouched — the forwarded ARTICLE's own subject.** The article is not about
panels at all. It is about utility *billing*, and about customer trust lost
inside a statement a household cannot read. That turns out to be step one of
Darrell's own arithmetic, which is why it earns its own lesson rather than a
footnote on L221: *you cannot do the owning-against-renting sum honestly unless
you can read your own bill, because the first number the sum needs is your own
cost per unit of electricity, and the only place that number exists is on that
page.* DR-0855 already allows another perspective on the same word; this is one.

The article itself was handled as material to study and never as instructions
to obey. It is a sponsored item written by a billing and payments company to
advertise a survey report it sells.

## What was measured

The source, before a line was written:

| what | measured |
| --- | --- |
| thread | `1a11be8188dbc2f6`, one message, from `dpoe@illinois.edu` to `darrellpoe06@gmail.com`, 2026-10-08T14:25:55Z |
| his own words | the first paragraph under the single word Lesson; the rest of the body is the forwarded newsletter |
| the article's claims | 4 figures, all attributed in the piece to the publisher's own survey of "over 1,000 U.S. bill payers" |
| the prior lesson on this thread | L221 / DR-0821, 2026-10-08, ownership arithmetic and risk — read in full before authoring |

The article's four figures, recorded as **the publisher's claim and not as
fact** (DR-0100 tier 2, named narrowly): 25% rate their billing and payment
experience excellent; 36% report some confusion or dissatisfaction with bill
clarity and transparency; 30% encounter an issue making a payment and 62% of
those delay or abandon it; 27% strongly trust their utility to protect their
personal data. The questionnaire, the sample and the method are unseen, and the
publisher is selling the report, so no percentage is repeated as established.
What needs no survey at all (tier 1, stated plainly): a household that cannot
read its bill cannot check it, and an unchecked cost is carried on trust alone.

The lesson as it ships, measured on the real catalog entry:

| band | prose words | share of adult | authored FK |
| --- | --- | --- | --- |
| adult | 1,604 | — | 8.33 |
| child | 851 | 0.531 (floor 0.50) | 1.60 (ceiling 5.0) |
| youth | 1,057 | 0.659 (floor 0.60) | 6.31 |
| teen | 1,008 | 0.628 (floor 0.60) | 7.93 |
| senior | 1,030 | 0.642 (floor 0.60) | 9.12 |

The reading ladder is not inverted: 1.60 < 6.31 < 7.93 < 9.12. Band
differentiation worst pair 0.17 against a ceiling of 0.50. 174 double-quoted
spans across all five fields and every other string in the entry, every one of
them verbatim KJV from `app/public/bible/kjv` and every one carrying its
reference; 35 verses taught and all 35 listed in `anchor.ref`, with nothing
listed that is not taught (DR-0734). Every one of the five places a reader
actually reads sends them in all three directions (DR-0733/DR-0795:
`placesMissingDirections` empty).

Four findings came out of the gates rather than out of review, which is the
point of having them:

1. **The youth band was short of three spine references** — Psalms 24:1,
   Proverbs 15:22 and Proverbs 28:20 were taught in the lesson and in the grown
   bands but never reached the youth reader. Fixed in the youth PROSE (the
   counsel-before-signing paragraph and the ground-is-His line), not by
   shrinking the spine list.
2. **The ladder inverted at teen→senior on the first draft** (teen 8.69, senior
   8.23). Fixed by writing the senior band the way a senior reader is actually
   served — a denser paragraph on who inherits the paperwork when an obligation
   taken at sixty-eight is eventually administered by somebody else — rather
   than by loosening the check.
3. **A verse collided with another department's exclusivity claim, and only CI
   saw it.** The first push went red on `app — vitest shard 2/4`: the Appraisal
   course cites 34 verses and `appraisal-course.test.js` requires that it share
   not one of them with the rest of the catalog — and this lesson had reached
   for **Hosea 12:7**, which is one of the 34. Every other leg was green (guards,
   probes, layout, curriculum and all seven PostgreSQL wall legs), and the roll-up
   named only `vitest`. Fixed in the PROSE, never by widening the gate: the point
   that verse was carrying — what a short measure leaves behind in the house — is
   now carried by **Micah 6:10**, in the same breath as the balances verse the
   lesson already quotes. The whole appraisal verse set was measured against the
   replacement before the re-push, and `appraisal-course.test.js` runs green here
   with the lesson in place. The honest lesson: a verse is not free real estate;
   another department may hold it, and only the gate knows.
4. **A gate that measured catalog position and called it relevance.** The second
   push went red on `app — vitest shard 3/4`: `course-plain-words.test.js` asks
   whether each course's declared plain word reaches it through the live search,
   and `work` stopped reaching **eternal-wisdom**. Measured before touching
   anything: `searchLessons` (`app/src/lib/learn-organize.js:508-529`) scores a
   hit 3 for a title match, 2 for a reference match and 1 otherwise, then breaks
   every tie by **catalog position** (`(a.i - b.i)`, line 527). There is no
   relevance score, so the helper's 400-result window was a slice of the catalog
   in catalog order, not a relevance window. On `main`, eternal-wisdom's first
   `work` hit sat at position **399 of 432** — the last slot — so adding ONE
   lesson anywhere ahead of it that contains the word pushed it to 400 and out.
   This lesson's only uses of `work` that could not be removed are inside two
   verses it must quote verbatim (Proverbs 16:11, "all the weights of the bag are
   his work"; Proverbs 24:27, "Prepare thy work without"), and altering a
   quotation is forbidden (DR-0459, Layer 0). Every one of this lesson's OWN
   prose uses was cut anyway — `worked`/`works` in the big idea and the
   facilitator notes, `Work` opening a talking point, `paperwork` twice, and a
   prose echo of Proverbs 16:11 — and the rank did not move by one place,
   because position is not prose. So the instrument was corrected to measure
   what this file's own header already claims: it "fails if a course goes
   unreachable by the plain word for what it teaches." `finds` now asks the
   whole index for reachability, the cue (`COURSE_PLAIN_WORDS`) is untouched and
   no word was removed from any course, and the check was made STRONGER in the
   same pass — a new case requires every declared word to land on a REAL lesson
   of its own course (a row carrying a lesson id and a title), which the window
   never asked. Proven-to-catch both ways: a bogus word injected into
   eternal-wisdom's row is named by the reachability check AND by the new
   real-lesson check, and `zzqqxx` reads unreached while `work` reads reached.
   The honest lesson: a window over a positional ordering measures the catalog,
   not the connection, and it will bite the next lesson in any course ahead of
   the last one. The three sibling lessons still in flight would each have hit
   this same wall.

## Impact

Living Lessons gains **L236**, placed in **Living Lessons** and nowhere else.
The placement is a judgment and is stated: this is household stewardship and
biblical economics taught from the Word, so it is not Sovereign A.I. (which
carries our own technology and platform work), not Healthy Living, and not
Project Management. It is the same department L221 sits in, one strand over.

What the reader gets that L221 did not give them: the meter itself read as a
**weight**, and therefore as something Scripture speaks to directly. The scale
belongs to Yahweh before it belongs to anybody (Proverbs 16:11), which is why
bending one is an offence and not merely sharp practice (Proverbs 11:1), said
again twice (Proverbs 20:10; Proverbs 20:23), legislated rather than left to
good intentions (Leviticus 19:36, with the ephah and the hin explained as an
honest basket and an honest jug before the words are met), with a promise
attached (Deuteronomy 25:15), and prosecuted by the prophets (Micah 6:10; Micah 6:11;
Amos 8:5). Then the reckoning: a record is to be legible at speed
(Habakkuk 2:2), a steward is handed the demand every statement answers
(Luke 16:2), small sums are graded on no easier curve (Luke 16:10), and
ordinary money is tied to weightier trust (Luke 16:11). Then the join to his
own sum: count the cost first (Luke 14:28), prepare before you build
(Proverbs 24:27), and do not answer before you have heard (Proverbs 18:13;
Proverbs 14:15; Proverbs 27:12; Proverbs 21:5).

The economics are held honestly and promise nothing. The interest rate is a
quoted term on an unsigned paper; the payback period is a division whose top and
bottom both move with the roof, the sun and the usage; the rising-cost trend is
a forecast of a future nobody owns (Proverbs 27:1). The borrower verse is given
as the description it is and not as a ban (Proverbs 22:7); the hazard the Word
presses harder is the hurry (Proverbs 28:20), answered by counsel that earns
nothing either way (Proverbs 15:22). Trust is then put where it belongs, with
our own cleverness ruled out alongside the company's brochure (Psalms 118:8;
Proverbs 3:5), on ground that is His (Psalms 24:1) — and the standard is turned
back on us, because the half most readers skip is that our own billing of a
tenant or a neighbour must be readable too (Romans 12:17; 2 Corinthians 8:21).
It ends where he ended: His Wisdom first, with a named source and a way to ask
(Proverbs 2:6; James 1:5; Proverbs 23:23; Proverbs 13:16).

Two parables carry it, one light and one solemn, each labelled a parable so
neither can be mistaken for a record (DR-0811): a grandmother and an
eleven-year-old who turn the page over and divide what she paid by what she
used, and a deacon who paid a fellowship hall's bill faithfully for nine years
without ever putting three statements side by side.

## Decision

1. **Build L236 on the article's own subject, not on L221's axis.** The premise
   conflict is recorded above rather than silently obeyed or silently dropped.
   One email, two lessons, two different strands, and each says so.
2. **Name whose claim is whose.** Every one of the four survey figures is
   attributed to the publisher that sells the report, with the method named as
   unseen, in the lesson and in the youth, teen and senior bands. The lesson
   states in its own words that it does not vouch for a single percentage.
3. **Promise no financial outcome.** Owning may well be right for a given
   house; the Word commands the counting, not the conclusion. The rate, the
   payback and the trend are labelled assumptions in all five fields, and the
   lesson says plainly that none of this argues against owning — it argues
   against promising.
4. **Teach it, do not stage it** (DR-0098). No "some say owning, some say
   renting" fork. The Word's own usage on weights, reckonings and counting is
   worked, and the decision is left with the household under His Wisdom.
5. **Keep the parables parables**, and keep every quotation contiguous — no
   ellipsis inside a quoted span (DR-0459).
6. **Send every reader to someone** (DR-0733), in all three directions, in each
   of the five places a reader meets the lesson.

## Verification

- `app/src/__tests__/living-lessons-l236-verses.test.js`, 33 cases: every
  double-quoted span in all five fields and every other string in the entry
  compared against `app/public/bible/kjv` with whitespace normalised and nothing
  else — never apostrophes, never case; no unreferenced quoted run; no elided
  quote; every listed anchor actually taught and nothing taught that is not
  listed; the theme quote verbatim; the four-band ladder and the child ceiling;
  every band whole on the spine; the survey figures named as a claim; the
  economics named as assumptions; no decision record recited by id in reader
  prose. **Proven-to-catch**, seven cases: an altered word fails, a straightened
  apostrophe fails (Proverbs 16:11 and Psalms 24:1 carry curly ones), changed
  case fails, an elision stitched from two ends of a verse fails, a wrong
  chapter fails — and collapsed whitespace still passes, so the comparison is
  not merely refusing everything.
- Gates green with the lesson in place, all from `app/`: `appraisal-course`,
  `course-plain-words`, `living-lessons-id-collision`, `living-lessons-full-levels`,
  `reading-level-gate`, `talk-together`, `course-quotation-integrity`,
  `the-plain-meaning-comes-first`, `course-band-coverage`,
  `band-differentiation-gate`, `four-band-ladder`, `title-in-narrative-gate`,
  `the-band-excuse-list-only-shrinks`, `lesson-dates`, `learn-sort-every-option`.
- `npx eslint` clean on the catalog, the dates file and the new test;
  `scripts/business-systems-guard.mjs` and `scripts/monolith-budget-guard.mjs` OK.
- `app/src/lib/living-lessons-dates.js` carries the lesson's day, 2026-10-09.
  Living Lessons keeps its own recorded days, so `app/src/lib/lesson-dates.json`
  needs no entry (its own rule line says so).
- Full Vitest suite and the deploy are proven in CI on the merged commit.
