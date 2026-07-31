---
id: DR-0259
title: Every review lands as Ways + documentation — a chat-only review is not a review
status: accepted
date: 2026-07-31
tier: B
declared_by: Darrell
supersedes: none
builds_on: [DR-0108 (review our Ways — mandatory, documented), DR-0158 (never a chat-only answer that evaporates), DR-0219 (spec-conformance review), DR-0239 (comprehensive review standard), DR-0102 (the work reviews itself)]
principles: [MACHINERY-OVER-MEMORY (DR-0250), VERIFICATION-DOCTRINE (DR-0076)]
---

## Directive

Darrell, 2026-07-31, mid-review of the install-collision incident:

> "Ways and documentation required every time claude reviews etc... add"

This generalizes the correction he had to make the day before (REV-0176 —
"60 min? Ways and documentation..."): the pattern he keeps having to re-ask
for is that a review's output must LAND in the repo's memory, not evaporate
in chat.

## Decision

**Every review the agent runs — comprehensive, build, install, UI/UX,
security, orchestration, spec-conformance, incident diagnosis — produces its
Ways and documentation in the SAME delivery, without being re-asked:**

1. **A REV record** in `docs/reviews/REVIEWS.md` (the append-only registry the
   in-app Quality/Proof panel reads) — findings, status, evidence, and any
   carried items with `re-review:` dates.
2. **A DR** whenever the review changes a way, decides something, or
   surfaces a directive — one decision per file, INDEX row added, per DR-0011.
3. **A gate where the finding is a class** (DR-0076 §2 / DR-0239
   gate-the-class): the machine check that keeps the found failure from
   silently returning ships with the review, or carries a one-line why +
   `re-review:` date.

A review delivered only as a chat reply is INCOMPLETE — the same failure
class as DR-0158's chat-only research answer. The chat reply is the
briefing; the registry, the ledger, and the gates are the deliverable.

## Applied in the same session (the rule eats first)

The 2026-07-31 install-collision review landed as: REV-0218 (the review
record), DR-0258 (the scope-split decision), the disjoint-scope gate in
`lovecorner-door.test.js`, and the static-identity pins in
`pwa-prompts-render.test.jsx` — plus this DR recording the directive itself.
