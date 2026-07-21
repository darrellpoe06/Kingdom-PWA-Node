---
id: DR-0206
title: The A.R. Bernard sermon also becomes a single integrated Living Lesson (L47)
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: the Living Lessons course (living-lessons-class.js); complements DR-0205
principles: [SPOKEN-TEACHINGS-ARE-BUILD-INPUT (DR-0089), VERIFICATION-DOCTRINE (DR-0076), TEACH-THE-WORD-DONT-DEBATE (DR-0098), APP-IS-PRIMARY (DR-0065), TYPOGRAPHIC-THEOLOGY]
---

## Context

After the A.R. Bernard sermon was captured as twelve Godhead Study / Eternal Algorithms
patterns (DR-0205; those auto-join the Eternal Algorithms "Deep Processing" section
courses by construction), Darrell said: **"Also add this lesson to the living Course as
well."** The "living Course" is the singular self-paced **Living Lessons from the Word**
series (`living-lessons-class.js`, category "The Word & The Way") — the same surface that
already harvested other spoken teachings (L42–L46). The sermon belongs there too, as ONE
integrated lesson a family or group can sit with.

## The decision

Added **L47 — "Navigating the Age — Faith, Critical Thinking, and the Self God Gave You"**
to `LIVING_LESSONS_MODULES`, and bumped `LIVING_LESSONS_META.weeks` 46 → 47 (the gate
`weeks === MODULES.length`). It integrates the whole sermon into five movements:

1. **MADE** — identity received, not constructed (Genesis 1:27; Psalms 139:14); the thief
   targets it to steal potential and redirect credit (John 10:10).
2. **THINK** — own the "why" of your faith (1 Peter 3:15), sharpened by others (Proverbs
   27:17), humble under correction (Proverbs 12:1; 28:13).
3. **TESTED, not tempted** — God never tempts (James 1:13-14); the test reveals you to
   yourself and does not inform Him (John 6:6); the "rigged" outcome (Romans 8:28) with a
   pre-built escape (1 Corinthians 10:13); pray and watch (Matthew 6:13; 1 Peter 5:8).
4. **BEYOND** — God outside our dimension, holding the frame (Colossians 1:16-17; Acts
   8:39-40), yet seen in the Son (John 14:9).
5. **SENT** — grown to strengthen the brethren (Luke 22:32); the celebrated-diversity Body
   (Revelation 5:9).

Full module shape matched to the L42–L46 bar: bigIdea, inApp, benefits (7), levels
(child/teen/senior), quiz (6), the deep `lesson`, and a facilitator guide.

## Posture held

- **DR-0098:** the "critical thinking / debate" movement is taught as **owning** the Word —
  the beit-midrash wrestling that makes an inherited faith your own — with an explicit
  bright line that it never relativizes it: "the Word stays the authority; you are the one
  being sharpened." Named to educate past a both-sides posture, not into one.
- **Typographic theology:** God-references and His-pronouns capitalized; "the thief,"
  "the adversary," and his pronouns lowercase.
- **DR-0076:** every cited quotation is a verbatim substring of its verse, verified
  programmatically against the app's own `public/bible/kjv` corpus (69 cited quotes
  checked; two drafting slips fixed — a devotional restatement wrongly wrapped as a
  Genesis quote, and a bracketed `make[s]` adaptation → clean verbatim). No verse from
  memory. The app also renders each anchor verse in full from the corpus by reference.

## Relationship to DR-0205

DR-0205 placed the sermon as twelve deterministic **patterns** (study + game + the Eternal
Algorithms Deep-Processing courses). DR-0206 places the same sermon as one integrated
**Living Lesson** for self-paced family/group study. One teaching, surfaced where each
audience meets it — patterns for processing, a lesson for sitting with (APP-IS-PRIMARY).

## Verification (DR-0076)

`lesson-flow.test.js` + `living-lessons-research-integrity.test.js` green (structure, the
`weeks === MODULES.length` gate, no bare statistic — the lesson uses none). Every cited
quote verbatim (programmatic corpus check). Consistency + contrast + lint + full suite
green. REV-0179; memory `project_bernard_sermon_godhead_studies` (extended).
