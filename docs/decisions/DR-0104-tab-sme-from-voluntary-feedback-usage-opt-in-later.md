---
id: DR-0104
title: Tab SMEs are ranked from voluntary feedback so their notes are prioritized; per-person usage stays off, opt-in only
date: 2026-07-05
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
grounds: [DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE, PERPETUAL-IMPROVEMENT, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS]
source: 2026-07-05 — Darrell (from the Admin "What's used" screen); "I would like to see who likes which tabs so their feedback will be prioritized because they would be considered SMEs subject matter experts everyone will eventually have their issue so we might as well fix it fast." Chosen when asked how to source the SME signal: "both, usage opt-in."
---

## Context

Darrell asked to see who likes which tabs so their feedback is prioritized as
subject-matter experts — the SME hits the issue first, and everyone else
eventually will, so fixing it fast is leverage. The reality-trace surfaced a
tension: "who likes which tabs" already exists as TWO real signals sitting on
opposite sides of a line the platform deliberately drew.

- **Voluntary feedback** — the `feedback` table already stamps every note with
  `user_id` / `display_name` / `which_tab`. The app already knows who keeps
  weighing in on Church, Rentals, Books. That is a self-declared expert, from
  data the person CHOSE to share.
- **Behavioral usage** — `usage_events` records who opens which tab, but is
  **deliberately aggregate-only to the governor** (migration 0073: "NEVER
  another person's individual row… not a spyglass on a person. This is the line
  the platform holds"), and the Admin surface promises members "no per-person
  behavior."

So the SME idea is very buildable, but the cleanest source honors the privacy
line while the most literal source (who-uses-it-most) would break an on-screen
promise. DATA-AS-EMPOWERMENT is mission identity and Darrell governs that bright
line (DR-0076 #9), so the choice was surfaced before building. He chose **both,
usage opt-in.**

## Decision

1. **Voluntary feedback is the SME signal that ships now.** `lib/tab-sme.js`
   ranks, per area, the people who gave feedback on it, most-engaged first; a
   person is an SME once they clear repeat engagement (`SME_MIN_NOTES = 2` — one
   note is not expertise, DR-0076 don't over-claim). It attributes a person's
   own local rows to the signed-in user and never invents a person to credit.
2. **Their feedback is prioritized, concretely.** `prioritizeBySme` floats SME
   feedback to the top of the promote queue (then by recency), and each SME row
   carries a badge ("SME · top voice · N") so triage sees it first.
3. **A "who likes which tabs" readout, in the app.** `TabSmePanel` renders
   by-tab (each area's experts) and by-person (each person's areas), surfaced on
   the Projects feedback promote area (where triage happens, with the fully
   merged local+remote feedback) AND as an Admin → Users & usage → "SMEs by tab"
   sub-tab (where Darrell asked from). Every row traces to a real submission
   (DR-0061/0076); honest empty state until notes accumulate.
4. **Per-person tab USAGE stays off by design.** `usage_events` remains
   aggregate-only; the "no per-person behavior" promise is unchanged. Exposing
   individual usage is a SEPARATE, LATER signal that ships only behind an
   explicit, disclosed, opt-in governor toggle — never covertly. The SME panels
   state this seam in-surface so the promise stays honest.

## Consequences

- Delivers the ask with zero new tracking, no migration, no privacy-footer
  rewrite — built entirely on consented data already captured.
- New machine checks are the durable output (DR-0076): `tab-sme.test.js` pins
  the ranking, the SME threshold, self-attribution, and SME-first ordering; a
  render test pins that the badge + panel actually appear. Contrast gate caught
  a dark-theme accent-color failure pre-merge (reused the baseline-clean green).
- The opt-in usage signal, when built, is its own DR gated on the disclosed
  toggle; it does not inherit this DR's Tier B.
