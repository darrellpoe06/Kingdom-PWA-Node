# DR-1613: L340 — Wisdom Is Profitable to Direct

**Date:** 2026-11-23
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; content only, no schema, no shared line touched)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll340-wisdom-is-profitable-to-direct.js`, its own file per DR-1468), its gate test
**Sent in by:** Darrell, a forward with the one word Lesson. Gmail thread `1a2089ea14470e9a`
**Pairs with:** DR-0610 (one teaching), DR-0076, DR-0098, DR-0100, DR-0210, DR-1468 / DR-1477, DR-1554 (placement precedent)

## Context

The forward is a finance newsletter's short introduction to a new book on strategy and value, written for chief financial officers. It says the finance role is moving from stewardship toward strategic partnership, that the next phase is making sure strategy creates value (where value can be made, the choices that build advantage, directing resources toward priorities), and it names four foundations: growth and return on invested capital, managing for the long term, market attractiveness, competitive advantage. Only that introduction was read; the book and the authors' interview were not, so the lesson teaches the four names and the question, and stops.

**Placement, by INTAKE-AND-FIT:** Living Lessons. The teaching is the steward's direction of entrusted resources, which every home, church and business carries; the newsletter's corporate frame rides inside it. The Project Management course already holds a CFO alignment lesson (pm17, Haggai 2:8), and that verse is left to it.

**One teaching (DR-0610):** `lesson-already-built.mjs --thread` returned WEAK (terms only); no catalog lesson, record or open `claude/lesson-*` branch carries this forward. ll69 (Faithful Over a Few Things) teaches the talents and increase and is named in the adult and senior text, not re-taught. This lesson owns what none teaches: strategy as direction, growing against gaining, and the long term written into the law of the tree.

## What was measured

| what | measured |
| --- | --- |
| the source | the newsletter introduction, read in full; the book and interview not read (UNCHECKED, re-review 2026-12-21) |
| verses | 103 referenced quotations, every one a kjv token filled by `fill-verses.mjs` from `app/public/bible/kjv`, none typed; 0 verse faults |
| fresh ground | Leviticus 19:23-25 had 0 files in `app/src` and `docs/decisions` before this lesson |
| length | adult prose 1,211 words |
| band shares | child 0.56, youth 0.62, teen 0.63, senior 0.71 (floor 0.5 / 0.6) |
| reading ladder | child 0.7, youth 3.9, teen 5.5, senior 6.5 (child ceiling 5.0) |
| band overlap | worst pair 0.03 (ceiling 0.5) |
| gate | first run 7 of 9: three bands under their share floor and one mid-verse capital lowered in a partial quote of Haggai 1:9; bands widened with Joseph's plan (Genesis 41:34-36), the capital restored; 9 of 9. Then the cross-course pins: `appraisal-course.test.js` holds Isaiah 55:2 as Appraisal's alone, with no re-pin list to extend, so the movement was rebuilt on Proverbs 3:9-10 rather than loosening that pin; title-in-narrative asked for the subtitle's words in each band's opening, added |

## Impact

A family, a congregation and a business owner are each handed four questions for any plan (does it bring in, will it last, is the field worth buying, is our edge still sharp) and the Word under each. The one forwarded claim, that stewardship and strategy are two jobs, is answered: in the Word they are one. One lesson file and one test; no shared line is edited.

## Decision

`ll340-wisdom-is-profitable-to-direct`, ORDER 340, ADDED 2026-11-23, seven movements:

1. **The blunt iron:** strategy is direction, not more strength (Ecclesiastes 10:10; James 1:5).
2. **Growing is not gaining:** sown much, brought in little, a priority out of order (Haggai 1:5-9).
3. **The long term is built into the tree** (Leviticus 19:23-25; Proverbs 21:5; James 5:7).
4. **Consider the field** before buying; its fruit plants the next (Proverbs 31:16, 18).
5. **Keep the edge,** for riches are not for ever (Proverbs 27:24).
6. **Directing the resources,** the first portion to Yahweh (Proverbs 3:9-10; Matthew 6:20-21).
7. **What the Word adds:** the Owner, a term past this life, His portion first.

Return on invested capital is given its ordinary finance meaning, not the book's. Two parables with invented people (a hillside crew; a grandmother's cocoa trees in Ghana). Ten quiz questions.

## Verification

`living-lessons-ll340-wisdom-is-profitable-to-direct.test.js` runs the shared gate with six spine spans in the adult lesson and every band. `re-review: 2026-12-21`. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`.
