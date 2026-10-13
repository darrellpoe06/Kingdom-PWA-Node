---
id: DR-0192
title: Retroactive trust-but-verify audit of the research-sourced lessons — the pass runs BEFORE first ship, not only when challenged
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: executes the retroactive review lens DR-0190 named; hardens DR-0168 (harvest-to-lesson) so the DR-0190 pass is a pre-ship gate on any research-sourced lesson
principles: [TRUST-BUT-VERIFY-EXTERNAL-RESEARCH (DR-0190), VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-THE-WORD-DONT-DEBATE (DR-0098), WAYS-REVIEW (DR-0108)]
---

## Context

Darrell, 2026-07-20:

> "Apply the trust-but-verify pass to the other research-sourced lessons."

DR-0190 (built with L44) had named the retroactive target set and said the tier
lens "applies retroactively as a review lens to the existing research-sourced
lessons... checked on the standing cadence." This DR is that pass, executed.

## What was done

An **independent audit of 8 research-sourced Living Lessons** ran in parallel — one
verifier per lesson, each extracting every checkable EXTERNAL claim, verifying it
against PRIMARY sources via live web research (not the agent's priors — DR-0076 §7,
independent method), tiering it (DR-0100 A/B/C), and proposing surgical corrections.
Corrections were applied centrally and gated.

### Results

- **Clean (verified, no change):** L36 (Robert Halwell — real minister/author,
  fairly attributed, Word senior), L39 (LXX/MT/Samaritan variants, the Luke 3:36
  "Cainan" reading, the Ebionites' ~180 AD attestation and denial of deity, Amarna
  "Urusalim", Sennacherib's prism, native Judean lions — all accurate; contested
  chronology honestly flagged; fringe claims framed as refuted), L41 (Wes Huff +
  Steven Bartlett verified; fine-tuning/moral arguments correctly framed as TIER-B
  witnesses, never proof; "a full third of the Psalms are lament" accurate).

- **Corrected:**
  - **L15 (conversation science) — the significant find.** The lesson taught Alison
    Wood Brooks's **TALK** acronym as Topics·Asking·**Listening**·Kindness and built
    a Scripture-mapped pillar on "L = Listening." Brooks's "L" is **LEVITY**
    (warmth/humor); she folds listening under Kindness/Asking. Corrected everywhere:
    the acronym now reads Topics·Asking·**Levity**·Kindness, Levity is taught with
    its own verses (Proverbs 17:22; Ecclesiastes 3:4 — verbatim-verified), and the
    (genuinely biblical) listening content is kept but re-anchored, no longer
    claiming the "L". Also: the "Get Excited" reappraisal study (Brooks 2014) tested
    public speaking, karaoke singing, and a **timed math task** — the lesson said
    "negotiation"; corrected.
  - **L40 (remnant/genetics) — one over-claim in 8 spots.** The lesson said Sargon
    II's annals **name/confirm** the resettlement addresses (Halah/Habor/Gozan/the
    Medes). The inscriptions confirm the conquest, the 27,290 figure, and
    resettlement "in the midst of Assyria"; those place-names are **Scripture's
    alone**. Corrected in all 8 places (the exact "consistent-with treated as
    confirmed" over-reach the lesson elsewhere forbids). Its genetics (CMH
    non-uniqueness, Lemba walk-back, Bnei Menashe-on-tradition, East-African Beta
    Israel) verified rigorously honest — unchanged.
  - **L38 (Golden)** — one discussion-prompt line credited Myron Golden as the
    *source* of a communication adage that traces to William H. Whyte (*Fortune*,
    1950); reattributed to "the old saying." His Tactics→Essence framework is fairly
    attributed and the Word kept senior (no prosperity-gospel leakage) — unchanged.
  - **L34 (Kokotajlo)** — one precision tweak: he was *willing to* forgo ~$2M equity
    (OpenAI walked the clause back), not "forgoing" it completed. Everything else
    (the labs/race, the 70% p(doom), the AI-2040 "Plan A" document) verified and
    correctly framed as forecast.
  - **L37 (crime/race)** — verified well-sourced and correctly tiered (National
    Academies, BJS, National Registry of Exonerations, AAPA/AABA 2019, ACTN3
    genetics); the accurate ACTN3 "<1%" figure sharpened to "<1% of
    **sprint-performance variance**" for precision.

## The process hardening (the standing lesson)

Darrell's mid-session check on the L45 build — "did separate research occur like the
last documents?" — exposed that the DR-0190 pass had run only when challenged. The
L15 and L40 findings here prove why that is not enough: a named framework and an
archaeology claim had shipped **wrong**. **Binding: the DR-0190 separate-research
pass is a PRE-SHIP gate on any research-sourced lesson — it runs BEFORE first ship,
not only when a reviewer asks.** Recorded in REV-0161 and now here.

## Enforcement + consequences

- The machine gate (`living-lessons-research-integrity.test.js`) still holds the
  no-bare-statistic line; this audit is the human/independent layer above it
  (DR-0076: gates + independent verification, not one or the other).
- Recorded in memory as `feedback_trust_but_verify_runs_before_first_ship`.
- Ways-review REV-0162 logged (DR-0108). Verses touched (Proverbs 17:22;
  Ecclesiastes 3:4) fetched verbatim from `app/public/bible/kjv` (DR-0076).
