---
id: DR-0190
title: Trust but Verify — external research the platform teaches is independently checked, tiered, and attributed
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: extends DR-0076 (verification doctrine) and DR-0100 (speak established fact / three tiers) to EXTERNAL research cited in teaching content
principles: [VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-THE-WORD-DONT-DEBATE (DR-0098), WAYS-REVIEW (DR-0108)]
---

## Context

Darrell, 2026-07-20, on adding the Psychological-Safety lesson (L44) built from a
forwarded newsletter:

> "Also do our own separate research on the cited research etc... Trust but
> verify... add to our Ways and documentation and implement."

A lesson taught the family/church a set of external claims (Edmondson's
psychological safety, Google's Project Aristotle, a "381-employee study," and a
cluster of circulated statistics — 19% / 31% / 27% / 3.6× / 43%). Taking the
newsletter's word for it would violate the platform's own truth standard.

## The decision

**Before the platform TEACHES an external research claim, it independently verifies
it, tiers it, and attributes it. A source's summary is a lead, never the citation.**

1. **Independent verification, not the forwarder's word.** Find the primary source
   (the paper, the study, the researcher) — not the blog/newsletter that summarized
   it. Confirm it exists, says what is claimed, and at what scope.
2. **Tier every claim (DR-0100).** (a) *Established fact* — stated plainly, cited.
   (b) *Attributed* — "the research reports / a study found," never asserted as
   settled truth on the platform's own authority. (c) *Unverified / over-claimed* —
   NOT taught as fact; either dropped or named as circulated-but-unconfirmed.
3. **A bare statistic is never asserted as fact without a traceable source.** A
   number + "%" or "N× higher" in audience-facing teaching text must sit next to an
   attributing verb (research / study / reported / found / survey). Circulated
   marketing stats that don't trace to a primary source are dropped, not repeated.
4. **The Word stays senior (DR-0098/0100).** External research is a WITNESS that the
   lab is catching up to Scripture — never the authority over it. Where the research
   and the Word meet, the Word is the foundation; where the research over-reaches,
   the Word corrects it.
5. **Record the verification.** The lesson/source carries a short trust-but-verify
   note: what was checked, what tier each claim landed in, and the primary source.

## Enforced, not just documented (DR-0076)

`living-lessons-research-integrity.test.js` is the proven-to-catch gate: it scans
every audience-facing lesson field (bigIdea, lesson, levels) and FAILS the build if
a hard statistic (`\d+%` or `N times/× higher/more`) appears WITHOUT an attributing
token somewhere in that lesson — so a future lesson can't drop a bare "43% of teams"
as if Scripture said it. L44 is pinned as the worked example (Project Aristotle +
Edmondson verified as established fact; the 381-employee study verified real —
Kim/Kim/Lee, Humanities and Social Sciences Communications, Nature 2025,
s41599-025-05040-2, incl. the ethical-leadership buffer; the circulated %-stats
deliberately NOT asserted).

## Consequences

- The platform's teaching inherits the same "verifiably right, or clearly marked"
  bar its financial surfaces have. Recorded in memory as
  `feedback_trust_but_verify_external_research`.
- Ways-review REV logged per DR-0108.
- Applies retroactively as a review lens to the existing research-sourced lessons
  (L15 conversation science, L34 Kokotajlo, L36 Halwell, L38 Golden, L41 apologetics)
  — checked on the standing cadence, corrected if any claim fails the tier test.
