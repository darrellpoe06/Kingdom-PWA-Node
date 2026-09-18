# DR-0495 — L177: two minds, and the one you feed is the one that runs you

- **Status:** accepted
- **Tier:** B (lesson content plus a new gate)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L177 added; `LIVING_LESSONS_META.weeks` 175 -> 176), `app/src/__tests__/living-lessons-l177-verses.test.js` (new, 119 checks), `app/src/__tests__/learn-crosslist.test.js` (catalog pin 535 -> 536), the three shrink-only baseline counters
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 §4), TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), RENDER-HIS-WORDS-FOR-MEANING (DR-0331)
- **Grounds:** DR-0492 (the lesson before it), DR-0484 (band differentiation), DR-0459 (no ellipsis inside a quotation)

## What he spoke

Darrell spoke this into the channel on 2026-09-18 and marked it a lesson twice — *"According to the word, this is a lesson"*, then *"Lesson"*. His own sequence is the spine:

everyone is double minded, carrying a spiritual mind and a carnal mind, and hardly anybody draws on the spiritual one because nobody taught them the method. The method is that **spiritual things are thought through by capturing the data**, which takes two layers — the layer that observes and the layer that acts on the observation. You assume you know the truth before you act. Testing the thought means acting on it, and that turns an assumption into an experience you can inspect. Then you pull the kinds of thought that give the outcomes His Word names, and cast down the kinds He says to cast down.

Forty-seven passages were fetched verbatim from the repo's own KJV; zero missing.

## Two things his own words gave the lesson

**Both study verses are real.** He said *"study to be about your business"*, then corrected himself to *"study to show yourself approved."* Both exist: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth." (2 Timothy 2:15) and "And that ye study to be quiet, and to do your own business, and to work with your own hands, as we commanded you;" (1 Thessalonians 4:11). Keeping only one would have silently edited what he said, so the lesson keeps both and the gate requires both in every band — study of the Word and study of your own work, because either alone gives you a scholar who builds nothing or a builder who checks nothing.

**His "hidden sin" is His own word.** He said we are born and shaped in iniquity and that iniquity is hidden sin. "Behold, I was shapen in iniquity; and in sin did my mother conceive me." (Psalms 51:5) — and the very next verse names the place and assigns it a purpose: "Behold, thou desirest truth in the inward parts: and in the hidden part thou shalt make me to know wisdom." (Psalms 51:6) The hidden part is not only where the trouble sits; it is where He says the wisdom is taught. The gate requires the two verses **as a pair, in that order**, in every band, because verse 5 alone leaves a reader in shame.

## The handling that needed care (DR-0098)

He said that where the Word says *heart*, he understands it as what we now call the **subconscious**. That is his bridge for a modern reader and it must never replace the Word's own word. The lesson carries both and keeps HEART in front — Proverbs 4:23, Jeremiah 17:9 and its answer in 17:10 — and the gate asserts **both directions**: his bridge word present in every band, and the Word's own word present in every band.

## Measured before it was gated

| band | prose words | share of adult | Flesch-Kincaid | rendered movements |
|---|---|---|---|---|
| child | 1,862 | 0.79 | 2.02 | 23 |
| youth | 1,825 | 0.78 | 5.34 | 24 |
| teen | 1,906 | 0.81 | 5.39 | 24 |
| senior | 3,146 | 1.34 | 8.97 | 25 |
| adult | 2,344 | — | — | 24 |

Ladder holds (2.02 / 5.39 / 8.97); child under the 5.0 ceiling a NEW lesson is held to; band differentiation worst pair **0.20** against a 0.50 ceiling.

**The teen band was rewritten once for a reason that was not a number.** Its first draft measured 9.71 — above the senior band and far above what "age-simple" means. Latinate register had crept in while I was chasing separation from youth. It was lightened to 5.39, and the rewrite is the honest fix rather than a ladder adjustment.

## Five real catches, all from this lesson's own verification

1. **Jeremiah 17:10 was not His words.** Written as *"even to **try** every man according to his ways"*; the KJV says *"even to **give**"*. It had spread to all five bands, a benefit, and a quiz explanation — **two of the seven outside the reader texts**.
2. **A caps emphasis was promoted to a movement.** "NEITHER INDEED CAN BE." rendered as a section heading rather than as emphasis inside the prose.
3. **Two movements were invisible.** A 10-word senior heading, and a child heading glued behind `(Ephesians 4:23)` — both dropped by the renderer while every other gate stayed green.
4. **Three of our own phrases wore Scripture's quotation marks**, which dilutes the one guarantee a double-quoted span carries in this corpus.
5. **The `inApp` field never named Him in our own voice**, against DR-0210.

And two checks were wrong rather than the lesson: "neither indeed can be" is Romans 8:7's own wording and belongs in quotation marks, and "THE HIDDEN PART" is a genuine heading in the child band while being emphasis in the others. Both checks were corrected, which is the gate serving the text rather than the reverse.

## The gate, proven to catch

119 checks. Seven deliberate breaks, seven caught:

| break | caught |
|---|---|
| the Jeremiah 17:10 verb put back wrong | yes |
| the second study verse corrupted | yes |
| Psalms 51:6 corrupted | yes |
| "Yahweh" swept into a KJV quotation | yes |
| a heading widened past the renderer window | yes |
| his bridge word removed from a band | yes |
| **suppression taught as the teaching** | yes, on the second attempt |

The last one is worth recording. The first version of that check required a denial of suppression within seventy characters of any mention — and the harness defeated it, because a band rewritten to RECOMMEND suppression still had the refusal sitting in the next sentence, inside the window. The check now also forbids the endorsing constructions outright, and the harness catches it. A gate that a single rewrite can walk past is not a gate; it took two rungs.
