---
id: DR-0226
title: Language policy — Python for the sovereign backend, JS for the app and its gates, one-source-of-truth as the tie-breaker
status: accepted
date: 2026-07-23
tier: A
declared_by: Darrell
supersedes: []
amends: []
principles: [SOVEREIGN-FIRST (DR-0132), APP-IS-PRIMARY (DR-0065), VERIFICATION-DOCTRINE (DR-0076), LESSONS P13 (one description of one truth), POWERSHELL-SELF-CONTAINED, DR-0060 (RLS is the data gate)]
---

## Context

Darrell 2026-07-23: *"Python prioritized or languages that are etc..."* — the language
priority was real but SPREAD across DR-0132, the standing memory
(`project_app_to_nas_transport_and_sovereign_python`), and practice. An undocumented
policy cannot be conformance-checked and drifts silently (DR-0219), so this record pins
it as one citable decision. Nothing here is new direction — it is the already-declared
direction written down in one place.

## Decision — the policy, by layer

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

- A new-pipeline proposal in anything other than Python needs a stated why on this
  record's terms (usually: the one-source-of-truth tie-breaker).
- A translation/rewrite between languages is NOT an improvement by itself (DR-0075
  needs a real why); it duplicates truth unless the old implementation is retired in
  the same move.
