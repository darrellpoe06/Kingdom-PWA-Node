# DR-0661: I AM, what the rest of the Word tells about Him. Every occasion L194's rule left out, walked by the same rule in six movements (Living Lessons L196)

- **Status:** accepted
- **Tier:** A (one lesson added to an existing course; no schema, no transport, no money)
- **Type:** feature (a spoken request turned into a lesson, per the Layer 0 rule "Spoken Teachings Are Build Input")
- **Date:** 2026-09-29
- **Scope:**
  - `app/src/lib/living-lessons-class.js`: L196 with all nine fields and four bands; `weeks` 194 → 195; L194 changed by exactly one added sentence pointing here.
  - `app/src/lib/living-lessons-dates.js`: L196 gets its date.
  - `app/src/__tests__/living-lessons-l196-verses.test.js`: new, 29 checks, five of them proven to catch.
  - `app/src/__tests__/learn-crosslist.test.js`: the school total goes 724 → 725 (after Sovereign A.I. week 29, DR-0662, took it to 724).
  - `app/src/__tests__/living-lessons-l195-verses.test.js`: its "highest number is 195" pin becomes "at least 195".
  - `app/src/__tests__/living-lessons-order.test.jsx`: the newest lesson's day is now 2026-09-29.
  - The six series baselines each count one more lesson (band-differentiation 128, course-quotation-integrity 576, full-levels 195, reading-level 195, stage-reaches-reader 576, title-in-narrative 195).
- **Principles:** SOURCE-OF-ANSWERS; DR-0098 (teach the Word, do not debate it); DR-0076 §1/§3/§4/§8 (verbatim spans, proven-to-catch, measured bands, uncertainty surfaced); DR-0459 (no elision); DR-0210 (Yahweh in our voice, the KJV untouched); DR-0331 (his words rendered for meaning); DR-0099 (no color field); DR-0604 (the companion lesson is kept as it is, gaining one line).
- **Grounds:** Darrell, 2026-09-29: *"Lesson with all outside of the 4 gospels, so we have all of them in our curriculum. If people talked about Jesus but not to Him, it did not count. If He did not answer, it did not count. Stories from outside the four books did not count. Those verses tell about Him too. We just kept the rule the same all the way through."* It also closes DR-0646's own limit 1 (`re-review: 2026-10-08`, whether the Son of man sayings in the discourses belong in a companion list): they do, and they are here, in movements four and five.

## Context

L194 (DR-0646) counted fifty-four scenes in the four Gospels where Jesus told a hearer who He is, and named six kinds of passages its rule set aside. Darrell asked for all of those, with the rule unchanged.

## Decision

1. **Title:** "I AM: What the Rest of the Word Tells About Him — Every Occasion the Rule Left Out". Id `ll196-i-am-what-the-rest-of-the-word-tells-about-him-every-occasion-the-rule-left-out`.
2. **Six movements, one per L194 exclusion, in L194's order.** The unit stays L194's: one scene (one time, one place, one set of hearers), parallels joined, every reference given.
3. **Three marks on every Gospel occasion**, so the reader can check against L194: *Its own scene* (L194 never walked it), *Inside the fifty-four: occasion n* (inside one of L194's scenes, counted there for another word), *The writer's own word* (an Evangelist's narration). A fresh scene carrying two left-out kinds is counted once, where most of its words belong (Luke 12 and Luke 17 in movement five, with movement four pointing to them). Misnamings (Matthew 14:2), bare address (Master, Rabbi) and "for my sake" sayings are named and not counted.
4. **The counts, all derived by the test from the numbered entries:**

   | movement | occasions | own scene | inside the 54 | writer |
   | --- | --- | --- | --- | --- |
   | 1 words about Him, not to Him | 36 | 21 | 11 | 4 |
   | 2 challenges He did not answer | 7 | 4 | 3 | 0 |
   | 3 claims made by an act | 18 | 14 | 4 | 0 |
   | 4 His predictions | 20 | 6 | 14 | 0 |
   | 5 claims in His teaching | 13 | 13 | 0 | 0 |
   | **1–5** | **94** | **58** | **32** | **4** |

   Movement six: part one, **10** occasions by L194's rule unchanged (the risen Lord naming Himself: the Damascus road joined across Acts 9, 22, 26; Patmos; the seven letters as seven sets of hearers; the close of Revelation), with His other words that do not name Himself listed and not counted (Acts 1:6-8; 9:10-16; 18:9-10; 22:17-21; 23:11; 2 Corinthians 12:9; Revelation 16:15). Part two, **37** witnesses; part three, **34** Old Testament passages the New Testament itself applies to Him. Parts two and three are stated in the lesson as **gatherings, not closed counts**.
5. **Found on the way, named and not counted:** four scenes that fit L194's own first kind and are not among its fifty-four: Gethsemane, "O my Father" (Matthew 26:39); "Father, forgive them" (Luke 23:34); "Father, into thy hands" (Luke 23:46); Nazareth the second time (Mark 6:4). L194 counted John 17 with the Father as hearer, so by the same rule these would join it. L194's fifty-four is left as published; `re-review: 2026-10-13`: recount L194 with these four and decide whether its number becomes fifty-eight.
6. **L194 gains one sentence** right after its six exclusions: *All the rest: L196, I AM: What the Rest of the Word Tells About Him — Every Occasion the Rule Left Out, walks every one of these six kinds by the same rule.* L196 names L194 by number and title in its first paragraph. Both are pinned.
7. **Word first, no staged debate.** Where the Word applies Yahweh's words to Jesus (Isaiah 40:3 with Matthew 3:3; Isaiah 45:23 with Philippians 2:10; Zechariah 12:10 with John 19:37; Psalm 102:25 with Hebrews 1:10; Isaiah 6 with John 12:41), the verses are set side by side and allowed to teach. Revelation 1:8 and 21:6 are quoted as the Almighty's words whose title He claims in 22:13, without adjudicating the speaker.

## What was measured

| what | measured |
| --- | --- |
| quoted spans | 785 across every surface, all verbatim against `app/public/bible/kjv`, each with its reference; no curly quotes, no elision, no record id. |
| fullness (authored prose, quotes removed) | adult 5,609 words; child 0.51 (floor 0.5), youth 0.61, teen 0.61, senior 0.61 (floor 0.6). |
| reading grade (authored) | child 1.5 (new-lesson ceiling 5.0), youth 4.4, teen 6.9, senior 8.6; not inverted. |
| band differentiation | worst pair 0.05 (ceiling 0.5). |
| proven to catch | on the real catalog, changing "spake" to "spoke" in the child band's John 7:46 fails "the whole lesson resolves verbatim" with `levels.child :: not-the-verse :: John 7:46`; restored, 29/29. In the test: a changed word in Acts 22:8; an occasion renamed out of movement two; one mark flipped in movement three; a hand-typed count in movement four; a mark naming an L194 occasion that does not exist. |

## Verification

`living-lessons-l196-verses.test.js` 29/29 and `living-lessons-l194-verses.test.js` 24/24; the full Vitest suite and `eslint src --max-warnings 0` in `app/`; `node scripts/business-systems-guard.mjs`. After merge, live review under DR-0104: Church → Learn → Living Lessons → L196 on a phone; check that the movement headings and the count lines read cleanly and that L194 shows its one line pointing here.

## Limits, stated

1. **"Every occasion" means every one a careful reading under the stated rule found.** Scene boundaries are sometimes judgment calls (for example, Luke 24:33-35 is counted inside L194's occasion 51 because He stood among them while they spoke; Levi's feast is read as the opening of L194's occasion 11). The lesson says a reader who finds one more reaches a larger number, never a different Christ.
2. **Parts two and three of movement six are gatherings.** Nearly every page outside the Gospels tells about Him; the lesson says so rather than presenting a closed number.
3. **ESV is not in the repo**, so every quotation is KJV, as in L194.
