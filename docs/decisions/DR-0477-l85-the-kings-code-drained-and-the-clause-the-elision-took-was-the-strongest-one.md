# DR-0477 — L85's King's Code drained, and the clause the elision took was the strongest one

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, built from Darrell's own spoken teaching)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L85's four bands rewritten, youth created, the Matthew 7:22-23 elision healed in both fields), `app/src/__tests__/living-lessons-l85-verses.test.js` (21 → 54 checks), all four shrink-only baselines (three shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), WORD-FIRST (DR-0097), TEACH-DONT-DEBATE (DR-0098), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet this drains further), DR-0476 (L86, whose five weak checks taught how to write these), DR-0459 (no elision inside a quotation), DR-0475 (the section-break property)

## Why this exists

L85 is Darrell's own spoken teaching — *"he's testing us to identify who can agree with him... an if then statement, which is a deterministic algorithm... Goat in the world means greatest of all times... those are the ones that he says will be lost."* The pass reached it with all four bands short and youth absent.

| band | before | floor | after |
|---|---|---|---|
| child | 114 words, **0.23** | 0.50 | 567 words, **1.13** |
| youth | **absent entirely** | 0.60 | 564 words, **1.12** |
| teen | 145 words, **0.29** | 0.60 | 545 words, **1.08** |
| senior | 221 words, **0.44** | 0.60 | 655 words, **1.30** |

Ladder now **2.78 / 5.20 / 5.79 / 8.26**, monotone, child far under the 7.0 ceiling.

## The decision

### a. THE ELISION TOOK THE STRONGEST CLAUSE ON THE RESUME

One elision, in the adult lesson and repeated in `bigIdea`, and it cut this out of Matthew 7:22:

> and in thy name have cast out devils?

Read what that costs. The lesson's whole point about that passage is that **He does not dispute the works** — the resumes are real, and He declines to argue with them. Cast-out devils is the strongest item on that resume, the one hardest to wave away as self-deception. The elision removed exactly the clause that makes the warning land, to save seven words. Both fields now carry the resume whole, and a check requires the contiguous span in both.

### b. FIVE MOVEMENTS, HELD PER BAND

Every band now carries all five, including the parts a shorter version drops quietly: that **He is not scouting talent** (stated as a refusal, because it is the assumption a gifted reader walks in with, and the fourth movement depends on it being denied first); **both branches** of 1 John 2:3-4 with the explicit statement that there is no third; the sorting read as an **ordinary** shepherd's workday rather than a spectacle; that He **does not dispute the works** but disputes the relationship; that the sheep are **not cleverer**, only familiar with a voice they have walked beside; and the landing on **best WRITTEN** rather than best-ranked, which is the relief the lesson exists to offer.

All four bands render five numbered sections, no chunk over the house's 420-character wall limit.

### c. THE POOLED FRAMING CHECK, SPLIT BEFORE IT COULD BITE

L85's gate carried the same defect DR-0471 recorded and DR-0476 met again: one check asserting the lesson "keeps the Governor's own framing" by searching the whole lesson block for four phrases, so any single field could answer for all four. Two of those phrases (`Greatest Of All Time`, `BEST WRITTEN`) are reader-facing claims that belong in **every** band; they are now checked per band. The two that are genuinely about the lesson's own framing stay on the block. This was fixed before a rewrite exposed it rather than after — which is what DR-0476 was for.

## The finding

**THIRTY-SEVEN BREAKS, THIRTY-SEVEN CAUGHT, NOTHING MISSED.** This is the first clean sweep in the series, and the reason is directly traceable: DR-0476 found five checks that could not fail, four of them **an alternation whose widest branch was true somewhere else in the same text**. Writing L85's checks under that rule — every branch a statement of *that* claim, never a word the passage happens to contain, and every claim read against our prose with the quotations stripped — produced a gate with no dead checks in it.

The three failures that did appear on the first run were the opposite problem and worth naming as such: **my regexes narrower than the bands' own words.** The youth band says *"that person actually does"* where I had written *"a person actually does"*; *"not because they are cleverer"* where I had required *"not cleverer"* adjacent; the child band says *"not merely something he agrees with"* where I had written `agreed`. In every case the claim was present and my pin was wrong, so the text stood and the regex widened to it. That is the correct direction — but it is a reminder that a check failing is a question about the check before it is a verdict on the prose.

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.13 / 1.12 / 1.08 / 1.30 against floors 0.50 / 0.60 / 0.60 / 0.60.
- Reading: ladder 2.78 / 5.20 / 5.79 / 8.26, monotone across every present band; child under the 7.0 ceiling.
- Quotations: **67 quoted spans across the four bands, every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; the ratchet reports L85 with `elided: []` and `recited: []`.
- The covenant name: Yahweh in every band's own prose (5 / 3 / 3 / 3), **0 generic uses in our own voice** in any reader field — and checks requiring Hebrews 11:3's *"the word of God"* and Psalms 40:8's *"O my God"* to stay letter-for-letter inside the quotations, so a sweep in the other direction fails the build.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over 420 characters.
- Break harness: **37 / 37 caught, 0 missed, 0 no-ops.**
- Baselines: short **85 → 84**, title-unnamed **151 → 150** (bands 454 → 451), quotation **110 → 109** lessons, 0 fresh and 2 healed; inverted and child-over-ceiling unchanged because L85 was in neither list. No baseline gained an entry.
- Gate: 54 checks, up from 21.

## Consequences

- The full-levels pass has **84** lessons left carrying a short band. Next is L84, downward.
- The DR-0473 elision debt is at 109 lessons, still under its own `re-review: 2026-11-18`.
- L85's anchor list still names only Matthew 25:32-33 while the bands now teach from sixteen references. Same deferral as L89, L88 and L86 — **re-review: 2026-10-24**.
