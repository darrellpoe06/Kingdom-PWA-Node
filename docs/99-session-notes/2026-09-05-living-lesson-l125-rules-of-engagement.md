# Living Lesson L125 — Rules of Engagement

**Date:** 2026-09-05
**Branch:** `claude/spiritual-warfare-principalities-fs5op0`
**Module id:** `ll125-rules-of-engagement-the-warfare-the-word-authorizes-the-open-doors-it-closes-and-where-it-stops`
**Harness:** `app/src/__tests__/living-lessons-l125-verses.test.js` (184 assertions)

## What Darrell brought

Seven messages on 2026-09-05, feeding in a long-form spiritual-warfare conversation
between a host and a guest teacher. Across the seven he pressed the same throughline
repeatedly — the **rules of engagement**, the **open doors**, and **entertainment as a
gateway to the soul** (that last one sent three separate times, which is how he marks a
point load-bearing). Later messages added the definition of an open door as legal
ground, the bloodline question, and the giants in your own life coming first.

Per the Layer 0 rule *Spoken Teachings Are Build Input — Always Add It*, this was
captured, verified, and shipped the same session.

## What was built

One Living Lesson, 16 movements plus a close, on the shared Learn engine. It rides
`lessonPresentable()`, so it is already presentable in **Speaker View** (13 scenes,
all four age bands — Everyone / Children / Teens / Adults), which answers Darrell's
"can we also share this version?" against the Speaker View screenshot.

Movements:

1. What the source is, and what it is not
2. The war is real and the weapons are not carnal
3. Submit first, then resist — the order is the doctrine
4. The sons of Sceva — the name is not a tool
5. Michael durst not — rank, railing, and The Lord rebuke thee
6. You cannot tear down what you are holding up
7. The giants in your own life come first
8. The open doors the Word actually names
9. The bloodline question — confessed, never inherited as guilt
10. Legal ground over a place — what defiles a land
11. I will set no wicked thing before mine eyes — the house audit
12. Not a lone ranger — counsel, covering, and the ten men
13. The assignment comes from Him, and the strategy changes
14. Try the spirits — the deception this work attracts
15. Where the Word speaks, and where the Word stops
16. The battle is not yours — the standing that ends the fear

## The five judgment calls, and why

**The teacher is not named.** She is a real, living minister. The lesson both affirms
her scriptural instruction and draws a boundary around her extra-biblical mapping.
Attaching a named living person to a public correction is exactly what this series
does not do (Titus 3:2; the L120 precedent). A privacy gate enforces it structurally
and asserts no surname, ministry name, city, or platform survives in the text.

**Two weights sorted, not blended (DR-0076 + DR-0100).** Her Scripture-grounded
instruction — repent, forgive, close the doors, do not go alone, do not go unsent — is
the Word, and is taught plainly and *without hedging*; under-claiming a verified truth
is as much a failure as over-claiming. Her 1994 prophetic encounter, the named entity,
and the institutional mapping are **testimony**, weighed by 1 Thessalonians 5:21 and
1 John 4:1 — neither swallowed nor scorned.

**Where the Word stops.** The name *lilith* is not in the KJV; the corpus witness in
the test asserts that as a fact rather than an opinion. Isaiah 34:14 reads "the screech
owl". But the *category* is thoroughly biblical — the **queen of heaven** is named and
condemned (Jeremiah 7:18; 44:17), with 1 Corinthians 10:20-21 and Exodus 20:3 behind
it. Deuteronomy 29:29 governs the boundary, and the lesson closes the loop explicitly:
**not one practical instruction depended on the name.** That is DR-0098 (teach the
Word, do not stage a ratings-style debate) doing its actual job.

**The bloodline is held in both tiers or not at all.** Confessing the iniquity of the
fathers is commanded and modelled (Leviticus 26:40; Nehemiah 9:2; Daniel 9:5,8).
Inherited guilt is flatly denied (Jeremiah 31:29-30; Ezekiel 18:20) and the redemption
texts close it (1 Peter 1:18-19; Galatians 3:13; 2 Corinthians 5:17; Romans 8:1; John
8:36). The Body has wrecked people in both directions here; a dedicated gate requires
both tiers and forbids permanent ancestry-excavation.

**The entertainment question gets a TEST, not a title list (DR-0098).** A list expires
and moves the authority onto the lister. Philippians 4:8 + Ephesians 5:11 +
Deuteronomy 18:10-11 + Psalm 101:3 travel, and a household running them honestly
reaches its own verdict — as Ephesus did, at its own cost, in public (Acts 19:19).

**It lands on standing, not fear.** Luke 10:20 moves the joy; Colossians 2:15 says it
is already public; the armour aims at standing and contains no hunting instruction.
The senior band carries the two pastoral failure modes by name: the zealous one who
wants an assignment (sent to Judges 6:25 and his own house first) and the frightened
one (not released until the joy has moved).

## Verification (DR-0076)

- **337 double-quoted spans, every one verbatim KJV** from the in-repo corpus,
  swept whole-span; 143 fragments additionally checked against *the specific verse*
  they are attributed to.
- **Typographic theology, measured not assumed:** in our authored voice (quoted
  Scripture stripped) — bare "God" 0, "Satan" 0, "Lucifer" 0, "Lilith" 0, "Baal" 0;
  "Yahweh" 32. The KJV corpus itself already carries `lucifer`, `satan`, `baal` low,
  and the test pins that.
- **184 assertions pass;** 1493 tests across 27 related files pass.
- **Presentable verified by running it**, not assumed: 13 scenes at every age band.

### Proven-to-catch

The whole-span sweep caught a real defect this authoring produced: two quoted
fragments carried a literal `’` escape instead of the KJV right single quotation
mark, so "thy brother's eye" (Matthew 7:5) and "the children's teeth" (Jeremiah 31:29)
were **not the text they claimed to be** while looking perfectly correct in a diff.
Both are pinned, plus a blanket assertion that no literal unicode escape survives
anywhere in the lesson.

A second real catch: the first splice attempt fixed those escapes with a **global**
replace and silently rewrote 185 unrelated lines in other lessons. Reverted and
re-applied scoped to the new block; the final diff is two hunks (the `weeks` count and
the new lesson).

### Also found

Lesson ids and display L-numbers have **diverged**: `ll124-` was already taken by
`ll124-equipped-to-win…` (documented as "L119"), so this lesson is `ll125-`. Ids remain
unique, but the number no longer tracks the label.
`re-review: 2026-10-05` — decide whether to renumber to restore the invariant or drop
the number from ids entirely.

`npm run lint` could not run in this sandbox (`@eslint/js` not installed); CI covers it.
