# 2026-07-20 — Living Lesson L46: "Ye Fathers — Provoke to Good Works, Not to Wrath"

**Darrell's spoken teaching (2026-07-20):**
> "Bible says to the fathers to provoke their children to good works not wrath and
> why explicitly fathers etc... neuroscience etc..."

**His follow-up question (answered by the lesson):**
> "what is it about a man's makeup that makes Yahweh speak directly to him in this
> lesson?"

## What was built

L46 in `app/src/lib/living-lessons-class.js`, on the tested module shape;
`meta.weeks` 45 → 46. Surfaces the existing Layer-3 foundation
`FATHERS-PROVOKE-TO-GOOD-WORKS.md` (Darrell 2026-07-06) in the Learn catalog.

## The teaching

**Two provocations, one active stirring, opposite aim.**
- FORBIDDEN: provoke to wrath/anger — Ephesians 6:4; Colossians 3:21.
- COMMANDED: "provoke unto love and to good works" — Hebrews 10:24.

**Why "ye fathers" explicitly (the answer to the question):**
1. First image of God the Father — Ephesians 3:14-15.
2. The strength that builds or crushes — "lest they be discouraged" (Colossians 3:21).
3. The covenant hinge — Deuteronomy 6:6-7; Psalm 78:5-6; Malachi 4:6.
4. The earthly template of God's discipline — Hebrews 12:9; Proverbs 3:12.

**The active father:** PRAYS (Job 1:5), TEACHES (Deuteronomy 6:7), TRAINS (Proverbs
22:6), PROVOKES toward good — joy is a child who "walk[s] in truth" (3 John 1:4).
Comfort for the fatherless: Psalm 68:5; Luke 11:13.

## Neuroscience — verified BEFORE ship (DR-0192), tiered (DR-0100)

Independent primary-source pass (not priors). This is the FIRST lesson built under
the DR-0192 "verify before first ship" rule from the start.

- **TIER A (taught, attributed):** fatherhood lowers testosterone — biology re-tunes
  to care (Gettler et al., *PNAS* 2011); father involvement blesses the child
  (Sarkadi et al. 2008), real but modest (McLanahan et al. 2013); **paternal
  harshness is the parenting most tied to child depression/low self-worth** (Kane &
  Garber meta-analysis 2004) — the lab's witness to "lest they be discouraged."
- **TIER B (attributed/emerging):** paternal caregiving brain (Feldman 2014);
  Paquette's activation relationship; rough-and-tumble play → self-regulation,
  quality-dependent (StGeorge & Freeman 2017).
- **TIER C (refused):** the viral "fatherless-home" stat sheet (63%/85%/90%/4.6x) —
  no primary source, compiler conceded faulty — kept OUT. "Father shapes child's
  God-image" held as **theology** (Ephesians 3:15), not a study.

Audience text attributes generally and asserts no bare statistic (research-integrity
gate passes); citations live in the lesson comment + DR-0193.

## Gates

All verses KJV-verbatim from `app/public/bible/kjv` (DR-0076). Lint clean;
`lesson-flow` (count gate), `living-lessons-research-integrity` (DR-0190), and
`presentable` (render gate) green. Rides the auto-merge lane; deploy-verify at the
merge SHA (DR-0107).

## Records

DR-0193, REV-0163, this note, and the memory `feedback_ye_fathers_provoke_to_good_works`.
