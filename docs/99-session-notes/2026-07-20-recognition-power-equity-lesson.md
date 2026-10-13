# 2026-07-20 — Living Lesson L45: Recognition, Power, and Equity meet the Word

**Declared by Darrell (2026-07-20):**
> "Lesson for Ari and claude to add to other lessons when appropriate... review
> our Ways and documentation and create a new lesson and add this context to those
> that it will help add quality to the lessons and even more context for our
> collective understanding."

Mid-session challenge (2026-07-20):
> "did separate research occur like the last Ways and documentation documents?"

## Source

The IT-workplace session **"Recognition, Power, and Equity in IT Work"** (Courtney
Fleeger & Mark McCarthy): who gets recognized for a team's success; what happens
when contributions go unnoticed; how credit and recognition function as POWER; how
uneven recognition harms colleagues across identities and career stages; practical
ways to share credit more intentionally and build inclusive team cultures.

A natural sibling of L44 (Safe to Speak) — another IT-workplace topic the Word
founded deeper.

## What was built

- **L45 "Give Honour Where It Is Due"** in `app/src/lib/living-lessons-class.js`,
  on the tested module shape (anchor, bigIdea, inApp, benefits, levels
  child/teen/senior, quiz, deep `lesson`, facilitator). `meta.weeks` 44 → 45.
- **Cross-ref context added into sibling lessons** (Darrell's "add to other
  lessons"): L12 (same 1 Cor 12 chapter — the recognition charter), L42 (the
  servant-king also governs credit), L44 (safety + recognition = the two halves of
  an honest team).
- **DR-0191** records the decision + the conduct standard; **REV-0161** logs the
  ways-review; this note carries the O&C.

## The Word (senior; every verse KJV-verbatim from `public/bible/kjv`, DR-0076)

- **Equity that goes past fairness:** God gives *"more abundant honour to that part
  which lacked"* (1 Cor 12:23-26) — honour STEERED toward the overlooked.
- **Credit is a DUE:** *"honour to whom honour"* (Rom 13:7); *"withhold not good
  from them to whom it is due"* (Prov 3:27); a wage *"kept back by fraud"* cries out
  (Jas 5:4).
- **Rest for the unthanked:** *"God is not unrighteous to forget your work"* (Heb
  6:10); rewarded in secret (Matt 6:4).
- **Guardrail against a credit-grab:** don't work *"to be seen"* (Matt 6:1); *"let
  another man praise thee"* (Prov 27:2); seek honour *"from God only"* (John 5:44);
  no reward is stolen — God pays by labour (1 Cor 3:6-8; Gal 6:4).
- **No partiality:** *"if ye have respect to persons, ye commit sin"* (Jas 2:1-9).
- **The model:** the servant-king takes the low seat (Mark 10:43-45; Luke 14:10-11).

## Conduct standard for Ari/Claude (the "lesson for Ari and claude")

Render honour to whom honour: **name the human contribution, give credit back to
the family and the quiet contributor, attribute rather than absorb, and never let
the platform/machine take the applause for a person's labour of love.** Composes
with GOVERNANCE-EXECUTION-ADVISORY + DR-0111 — the vision is the family's, not the
machine's.

## Opportunities & Constraints

### Trust-but-verify — separate research (DR-0190)

**Honest record of the process gap Darrell caught.** The first pass did only ONE
verification search (enough to confirm the presenters + that the session is a
practitioner *talk*, not a numbered study — which is why L45 asserts no statistic).
On Darrell's challenge, the full DR-0190 pass was run and traced PRIMARY sources:

- **Sarsons, "Recognition for Group Work: Gender Differences in Academia,"
  *American Economic Review* 2017, 107(5):141-45** — women are less likely to get
  tenure the more they coauthor; men are not penalized. Extended with experiments
  in **Gërxhani, Reuben, Sarsons & Schram, *JPE* 2021, 129(1):101-147** (bias driven
  by gender + stereotypes under source-ambiguity).
- **Ross, Glennon, Murciano-Goroff, Berkes, Weinberg & Lane, "Women are credited
  less in science than men," *Nature* 2022** (PMC9352587; UMETRICS data) — women
  ~13% less likely to be named as authors on their team's output, gap present across
  most fields and **almost all career stages** — the empirical spine of the session's
  "across identities and career stages." Tier a (established fact).

Figures live in the lesson comment + DR-0191 (attributed); audience text attributes
generally with no bare stat, so the research-integrity gate passes and the Word
stays senior.

### Constraint / lesson for the Ways

**The DR-0190 separate-research pass must run BEFORE first ship on any
research-sourced harvest — not only when challenged.** This session it ran on
challenge; the standing correction (folded into REV-0161) is that a research-sourced
lesson is not "done" until the primary-source trace is on file.

## Gates

Lint (`--max-warnings 0`) clean; `lesson-flow` (count gate: `meta.weeks ===
modules.length`), `living-lessons-research-integrity` (DR-0190), and `presentable`
(render gate) all green. Rides the auto-merge lane on green; deploy-verify at the
merge SHA (DR-0107).
