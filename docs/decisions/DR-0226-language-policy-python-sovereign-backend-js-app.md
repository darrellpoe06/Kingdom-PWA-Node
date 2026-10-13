---
id: DR-0226
title: The technology-choice algorithm — why we use or don't use ANYTHING (languages, tools, platforms, dependencies), by opportunities and constraints, with the why recorded
status: accepted
date: 2026-07-23
tier: A
declared_by: Darrell
supersedes: []
amends: []
principles: [SOVEREIGN-FIRST (DR-0132), APP-IS-PRIMARY (DR-0065), VERIFICATION-DOCTRINE (DR-0076), LESSONS P13 (one description of one truth), POWERSHELL-SELF-CONTAINED, DR-0060 (RLS is the data gate)]
---

## Context

Darrell 2026-07-23, in three sharpening strokes as this record shipped:
1. *"Python prioritized or languages that are etc..."* — the priority was real but
   SPREAD across DR-0132, the standing memory, and practice.
2. *"Really a better algorithm is why we choose our language based on the
   opportunities and constraints"* — the binding thing is the DECISION PROCEDURE,
   not a frozen preference list.
3. *"etc... not just why we didn't use Python — why we did and/or did not use
   ANYTHING"* — the algorithm governs EVERY technology choice: languages, tools,
   frameworks, platforms, services, dependencies. Every use AND every don't-use
   carries a recorded why.

An undocumented policy cannot be conformance-checked and drifts silently (DR-0219),
so this record pins the algorithm as one citable decision. Nothing here is new
direction — it is the already-declared direction written down in one place.

## Decision — the ALGORITHM: choose ANY technology by opportunities and constraints

For any new piece of work, the language / tool / framework / platform / service /
dependency is chosen by running these questions in order — each one an opportunity
or constraint the Ways already name:

1. **Where must the logic LIVE?** (Constraint: sovereignty + access architecture —
   the app is the single access surface, DR-0217/DR-0065; the NAS is sovereign
   storage/compute behind it, DR-0132.) NAS-side work inherits the NAS's
   ecosystem; app-side work inherits the app's.
2. **What already holds this truth?** (Constraint: one source of truth, P13 —
   two implementations of one pattern WILL drift.) If the logic exists, new work
   JOINS its language rather than translating it. This question outranks
   preference every time.
3. **Where can it be VERIFIED?** (Constraint: proven-to-catch, DR-0076 §3 —
   a brake or engine that can't run inside a gate suite is theater.) App engines
   in JS ride the 6000+ vitest gates; NAS pipelines in Python carry their own
   proven-to-catch tests (e.g. test_load_transcripts.py catching P27).
4. **Who OPERATES it?** (Constraint: the team's real hands — Darrell's desktop
   is PowerShell 5.x self-contained-from-anywhere; CI runners speak bash;
   the data boundary speaks SQL/RLS, DR-0060.)
5. **What does the ecosystem OFFER?** (Opportunity: Python's AI/data/GPU
   ecosystem fits pipelines, ingest, ML, Whisper; JS/React fits the PWA and its
   offline/PWA/user surface. Pick the ecosystem whose strengths the work needs.)
6. **What does it COST — money, blast radius, extraction, upkeep?** (Constraints:
   anything on a clock needs the three brakes proven, DR-0225/THREE-BRAKES;
   serve-not-extract and data-sovereignty exclude extractive services outright,
   DATA-AS-EMPOWERMENT; a dependency is a maintenance covenant — unmaintained or
   lock-in tech fails this question even when it's convenient today.)

**And the why is RECORDED, both ways.** Every USE and every DON'T-USE carries its
recorded reason — a DR for the big calls, a paired README/registry why for the
small ones (the DR-0158 pattern; Ari's fleet oversight already flags an active
member whose why is unrecorded). The ledger already works this way, which is the
proof the algorithm is real and not aspiration:
- **n8n → rejected** (DR-0218 zero-n8n; kept in docs only as a historical warning);
- **Vercel → replaced by Cloudflare Pages** (the 100/day deploy-cap constraint —
  seed-vercel-cap, closed 2026-07-23);
- **GitHub runners → adopted as the outside witness** (constraint: the cloud
  sandbox has no route to poetech.us; opportunity: the runner is the team's eye —
  DR-0125/P31);
- **Node for the review-watcher runner** (question 2 won: it joins the app's own
  `re-reviews.js` parser rather than translating it).

The per-layer assignments below are this algorithm's CURRENT OUTPUTS — they are
re-evaluated when the opportunities or constraints change (a new layer, a new
runtime, a retired system), never defended as tribal preference.

## The current outputs, by layer

1. **Python is the prioritized backend language — every sovereign/NAS pipeline.**
   New pipelines are plain **Python/FastAPI + Caddy-served files** on the NAS, never a
   new n8n webhook (DR-0132; the P1-P5 migration is retiring n8n). The born-Python
   fleet is the pattern: nas-tax-ingest, nas-finance-ingest, nas-property-*,
   nas-sme-pipeline, voice-studio, whisper-gpu. Anything new that is backend,
   data-ingest, GPU, or NAS-side starts in Python.

2. **JavaScript/React is the app's language — the primary artifact and its gates.**
   The PWA (DR-0065), its pure engines (deriveDebts, budget engine, Ari's review, the
   brake kit, the review watcher), and the 6000+ deterministic checks are JS/Vitest.
   Keeping app-layer engines in JS is what lets every one be proven-to-catch inside
   the same gate suite that brakes the merge lane (DR-0076 §3).

3. **Tie-breaker: ONE SOURCE OF TRUTH beats language preference.** Where logic already
   exists in one language, new work JOINS it rather than translating it. (Live example:
   the review-watcher runner is Node, not Python, because it imports the app's own
   `re-reviews.js` parser — a Python sibling would re-implement the `re-review:`
   pattern and drift, the P13 two-descriptions-of-one-truth failure class.)

4. **The supporting cast, fixed:** PowerShell 5.x for anything Darrell runs at his
   desktop (self-contained-from-anywhere, law-tier); bash only as CI glue; SQL/RLS as
   the real data gate (DR-0060) regardless of what sits above it.

## Consequence

- EVERY technology use-or-don't-use decision runs the six questions and records its
  why (a DR for big calls, a paired README/registry why for small ones). An adopted
  technology with no recorded why is an expertise gap Ari's oversight names
  (the DR-0158 enforcement pattern).
- A new-pipeline proposal in anything other than Python needs a stated why on this
  record's terms (usually: the one-source-of-truth tie-breaker).
- A translation/rewrite between languages or stacks is NOT an improvement by itself
  (DR-0075 needs a real why); it duplicates truth unless the old implementation is
  retired in the same move.
- The slug of this file says "language-policy" (it began there); the record governs
  ALL technology choice — the title above is authoritative.
