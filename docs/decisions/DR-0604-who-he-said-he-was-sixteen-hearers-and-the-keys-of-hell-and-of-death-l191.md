# DR-0604 — Who He said He was: sixteen hearers in order, the Pilate correction from the text, and the keys of hell and of death defined by the Word — Living Lessons L191

- **Status:** accepted
- **Tier:** A (one lesson into an existing course; no schema, no transport, no money)
- **Type:** feature (spoken question → lesson, per the Layer 0 rule "Spoken Teachings Are Build Input")
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/living-lessons-class.js` (L191, all nine fields, four bands; `weeks` 189 → 190); `app/src/__tests__/living-lessons-l191-verses.test.js` (new — 16 checks: verbatim scan on every surface, every quoted span referenced, the five movements pinned, the correction stated in words in every band, fullness / reading grade / differentiation / title-in-narrative measured); `app/src/__tests__/learn-crosslist.test.js` (school total 713 → 714, course count holds at 49)
- **Principles:** SOURCE-OF-ANSWERS (the Word only), DR-0098 (teach the Word; name a question to educate past it), DR-0100 (state what the text says plainly — including where it differs from the question as asked), DR-0076 §1/§3/§4 (every span fetched verbatim, the gates proven-to-catch, the bands measured), DR-0459 (no elision inside a quotation), DR-0210 (Yahweh in our voice; KJV untouched), DR-0331 (his words rendered for meaning)
- **Grounds:** Darrell, 2026-09-24, three messages minutes apart: *"Lesson. Didn't Jesus tell pilot He was from eternity and others in other ways how many ways and what were the situations claims to be?"* — *"What are the keys of hell and death?"* — *"All in the lesson"*.

## Context — the question

Two spoken questions, minutes apart, then "All in the lesson". Per Layer 0 a spoken question is build input: it is captured into the surface it belongs in, every verse fetched verbatim, shipped the same session, and reported back as what it became. The surface is Living Lessons, the course his own questions have grown since L1.

## What his words became

**L191 — Who He Said He Was — Every Hearer, Every Situation, and the Keys of Hell and of Death.** One lesson, both questions, answered by record rather than summary. The lesson walks sixteen hearers in the order the Gospels give them — Nathanael, Nazareth, the woman at the well, the scribes at Capernaum, the Jews in the temple, Peter, Martha, the man born blind, the upper room, the Father in prayer, the garden, the high priest under oath, Pilate, the thief, the risen Lord to His own, and John on Patmos — and states what each heard. It then counts (more than two dozen distinct forms, stated as a count of the record with "the Gospels hold more"), and ends where the second question begins: Patmos and the keys.

## The correction the text required (DR-0100)

The question as asked put the eternity claim in Pilate's hearing. The record does not. To Pilate He said where His kingdom was from (John 18:36), that He was born and came into the world to bear witness to the truth (John 18:37), and where the governor's power came from (John 19:11). The claim to eternity in His own mouth stands in the temple — "Before Abraham was, I am" (John 8:58) — and in prayer to the Father — "the glory which I had with thee before the world was" (John 17:5). The lesson says so in words, first, in the adult text and in every band, and the test pins that sentence so a later edit cannot quietly give Pilate the line. This is not a debate staged (DR-0098); it is the Word keeping each saying with its hearer.

## The keys, defined by the Word and not by us

- **A key** is authority to open and shut that none can reverse: Isaiah 22:22, the key of David's house, which the risen Lord takes for Himself in Revelation 3:7.
- **The two doors** are death (the passing) and hell (hades, the place of the dead), paired in Revelation 6:8 and 20:13.
- **Why He holds them:** He went through both and came out — Acts 2:24, Romans 6:9, John 10:18. Won, not conferred.
- **What the devil lost:** never the keys (the Word never gives him keys); "the power of death" (Hebrews 2:14), a grip through fear, broken at the cross so as to "deliver them who through fear of death were all their lifetime subject to bondage" (Hebrews 2:15). The lesson states "the devil never held the keys" in every band, pinned.
- **What He does with them:** opens the graves (John 5:28-29), has abolished death (2 Timothy 1:10), fulfils Hosea 13:14 in 1 Corinthians 15:55, and finally shuts both doors — Revelation 20:14, 21:4.

## Decision

1. L191 ships as one lesson carrying both questions, in the order he asked them: the hearers first, the keys last, because Patmos is where the record itself joins them.
2. The Pilate correction is stated in words, first, in the adult text and every band, and pinned; the lesson never gives Pilate a line the record gives to the temple and the Father.
3. The keys are taught only from the Word's own definition (Isaiah 22:22; Revelation 3:7) and pairing (Revelation 6:8; 20:13-14); no lexicon claim is made beyond naming hades once.
4. The count is stated as a count of the record walked, with "the Gospels hold more" pinned.

## What was measured

| what | measured |
| --- | --- |
| quoted spans | 305 on every surface, 305 verbatim against the in-repo KJV; every span carries its reference; no curly quotes; no elision; no record id recited |
| fullness (authored prose, quotes removed) | adult 1,848 words; child 0.53 (floor 0.5) · youth 0.62 · teen 0.61 · senior 0.66 (floor 0.6) |
| reading grade (authored) | child 0.8 (new-lesson ceiling 5.0) · youth 3.2 · teen 4.7 · senior 6.5 · adult 4.5 — not inverted at any rung |
| band differentiation | worst pair 0.11 (ceiling 0.5) |
| title in narrative | all four bands name the lesson in their opening window |
| school totals | 49 courses, 714 lessons (was 713); Living Lessons 190; `weeks` = module count |
| first draft, corrected by the gates before commit | three bands under the fullness floor (0.46 / 0.52 / 0.55) — filled with teaching, not padding; seven quoted spans without a reference beside them (two in the adult text, three in quiz options, one in the teen band, one talking point) — referenced or rephrased; three sentences opening "The devil" (child band, one quiz explanation, the adult text) caught by the adversary-is-never-capitalized gate on the first CI run and rebuilt so the name stays lower case mid-sentence; the record itself missing its Decision heading, caught by the decision-chain gate |

## Verification

- `living-lessons-l191-verses.test.js` and the series gates (full-levels, age-appropriateness, adult-band-debt, the four quoted-* ratchets, research-integrity, id-collision, lesson-flow, learn-crosslist, lesson-timeline-context, curriculum-diversity) green in one run — the run and its counts are recorded on the PR.
- After merge: DR-0104 live review — Church → Learn → Living Lessons → L191 on a phone: the sixteen headings readable, the keys section reached, the Pilate correction on screen.

## Limits, stated

1. **"Sixteen" and "more than two dozen" are this lesson's counts of the record it walks, not a claim that the Word has exactly that many.** The lesson says "the Gospels hold more" and the test pins that sentence. `re-review: 2026-10-07` — whether a second lesson should walk the sayings this one passes over (the seven "I am" sayings of John as a set; the Son of man sayings across the Synoptics).
2. **"Hell" in Revelation 1:18 is taught as hades, the place of the dead, from the Word's own pairing of death and hell** (Revelation 6:8; 20:13-14), not from a lexicon. The Greek is named once in the adult text and the senior band; no other language work is done. `re-review: 2026-10-07` — whether a Strong's line on hades belongs on the surface per SCRIPTURE-REFERENCE-STANDARD.
