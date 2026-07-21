---
id: DR-0205
title: Spoken teaching captured — Pastor A.R. Bernard sermon becomes six Godhead Study algorithms
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: the Godhead Study catalog (godhead-study.js)
principles: [SPOKEN-TEACHINGS-ARE-BUILD-INPUT (DR-0089), VERIFICATION-DOCTRINE (DR-0076), TEACH-THE-WORD-DONT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), THE-WORD-4TH-DIMENSIONAL-FRAME (DR-0097), TYPOGRAPHIC-THEOLOGY]
---

## Context

Darrell spoke a teaching into the channel, 2026-07-21 — a sermon by Pastor A.R.
Bernard on "navigating modern society through faith, critical thinking, and spiritual
maturity," delivered across several messages with timestamps: God's perspective on
diversity (not colorblind), critical thinking / owning your faith, true identity
(received not constructed) + the "thief" that targets it, temptation vs. testing, and
God beyond time and space (dimensional existence). Per the binding rule *Spoken
Teachings Are Build Input — Always Add It* (DR-0089), this is captured-and-shipped, not
discussed.

## The decision

Six deterministic studies were distilled FROM the sermon and appended to
`GODHEAD_ALGORITHMS` in `app/src/lib/godhead-study.js` (the primary doctrinal-lesson
catalog; condition → consequence → 3D-practice → outcome, by canon section):

1. **gh-god-not-colorblind** (revelation, Revelation 5:9) — God recognizes and
   celebrates every kindred, tongue, people, and nation; colorblind ideology blurs a
   person's context and its real obstacles. Diversity celebrated, not erased.
2. **gh-own-your-faith** (wisdom, Proverbs 27:17; 1 Peter 3:15) — iron sharpens iron;
   be ready to give the reason for your hope; own the "why" of your faith.
3. **gh-made-in-his-image** (torah, Genesis 1:27; Psalms 139:14) — identity RECEIVED
   from the Maker, not self-constructed; the divine blueprint; He alone knows your full
   capacity.
4. **gh-thief-targets-identity** (gospels, John 10:10; Genesis 1:27) — the thief comes
   to steal the God-given potential and redirect the credit away from God.
5. **gh-testing-not-temptation** (epistles, James 1:13-14; 1 Corinthians 10:13) —
   temptation is from the fallen nature, never God; the test does not inform God (He is
   omniscient) — it reveals you to yourself and marks a transition; the way of escape is
   pre-built.
6. **gh-god-beyond-dimension** (epistles, Colossians 1:16-17; Acts 8:39-40) — God is
   beyond our dimension, holding the frame He made (Philip caught away as the
   illustration); grounds Bernard's teaching in the existing 4th-dimensional frame
   (DR-0097).

## Doctrinal posture held

- **DR-0098 (teach, don't debate):** theme 2 praises "debate" of Scripture — captured
  as its true meaning, *owning the Word* (ask the why, welcome challenge, stay humble,
  never anger), explicitly NOT relativizing it: "the Word stays the authority; you are
  the one being sharpened." Named to educate past a both-sides posture, not into one.
- **DR-0100 (speak established fact):** the colorblindness study states the real,
  documented harm of ignoring context plainly, while the Word (Rev 5:9) corrects the
  ideological over-reach — no "you decide" hedge.
- **Typographic theology:** God-references and His-pronouns capitalized; "the thief,"
  "the adversary," and his pronouns lowercase.
- **DR-0076 (no fabrication):** every verse fetched verbatim KJV via
  `scripts/fetch-godhead-verses.mjs`; independently cross-checked against the app's own
  `public/bible/kjv` corpus (Rev 5:9 sources agree). No verse from memory.

## Verification (DR-0076)

`godhead-study.test.js` green — every new ref resolves to verbatim text, ids unique,
all required fields present, sections non-empty, each study deals into the Generations
deck. `eternal-algorithms-study-render.test.js` green (the studies render on the real
surface). Verses JSON regenerated (+9 refs, no churn); consistency + contrast + lint +
full suite green. REV-0177; memory `project_bernard_sermon_godhead_studies`.
