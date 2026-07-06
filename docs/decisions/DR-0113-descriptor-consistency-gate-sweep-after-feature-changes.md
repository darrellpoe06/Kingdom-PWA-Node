---
id: DR-0113
title: Descriptor-consistency — when a modeled feature changes, sweep every location that describes it; a gate enforces it for enumerable models
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [all]
grounds: [DESCRIPTOR-CONSISTENCY, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, REALITY-TRACE, APP-IS-PRIMARY, WAYS-REVIEW, DECISION-RECORDS]
source: 2026-07-06 — Darrell, holding the live Relationships surface after the landlord↔manager (1099) feature: "Did the other surfaces update to make sure everything keeps the correct context and information updated with every feature and or updates?" then: "Update our documentation and ways to make sure we review the other locations that identify the things we change about the app each time."
---

## Context

The relationship permission model (`app/src/lib/relationships.js`) is a single
source of truth. The **Matrix** surface renders live from it (`buildMatrix()` over
`RELATIONSHIPS`), so adding the landlord↔manager (1099) relationship made a new
Matrix tab appear with **zero** hand-edits — the "no painted permissions" design
(DR-0076) self-aligns. But three OTHER locations describe the model in **hardcoded
prose**, and they drifted silently: the in-app help still said "three
relationships," the Data-Systems course lesson enumerated only "guardian-child,
family, landlord-tenant," and the onboarding step listed the old three. A human
would have known to sweep them; the system did not force it.

This is the exact class REV-0011 named as a **standing practice** ("comprehensive
reviews after each feature… so everything is aligned") — but that review is a
*remembered manual pass*, and REV-0011 itself left the course lessons "logged /
incomplete." A practice that depends on remembering is not perpetual (the same
argument as DR-0102). The miss must be mined for a machine check (DR-0076 /
LESSONS-LEARNED discipline).

## Decision

**1. The sweep is mandatory after any modeled-feature change.** When a
relationship (or any enumerable modeled feature with hardcoded descriptions) is
added, renamed, or removed, every registered location that DESCRIBES it is swept
to match in the same change. Prefer render-from-the-model surfaces (they cannot
drift); the sweep is where the non-dynamic copy is kept honest.

**2. A deterministic gate enforces it (the machine backstop).**
`app/src/__tests__/relationship-descriptor-consistency.test.js` fails the build
when a modeled relationship is not named by a registered descriptor location, and
when the help copy's written-out count drifts from the model. It is
**proven-to-catch** (DR-0060/0076 anti-theater): authored by first confirming it
goes RED against the pre-sweep copy (4 failures), then GREEN after the sweep. A
new relationship type with no registry entry fails the registration assertion —
the forcing function that makes the author consciously register it AND sweep.

**3. The descriptor locations are a REGISTERED list, not a memory** — the answer
to "what else describes this feature?" lives in the gate as `DESCRIPTOR_LOCATIONS`:
`lib/help-content.js`, `lib/datasystems-course.js`, `lib/adopter-onboarding.js`.
Adding a descriptor extends the sweep the gate enforces.

**4. Own-change alignment is part of the sweep.** The same discipline pointed at
the feature itself: the landlord↔manager `manager` role is the model-level face of
**DR-0101** (delegated property management — its "Property Manager"), now cross-
referenced in `relationships.js`. DR-0101's fuller build (per-property revocable
`delegated_capabilities`, domain-scoped admin, RLS enforcement) stays the staged,
Tier-C, flag-off-until-green work — this fixed matrix is the honest first slice,
not a competing model.

## Consequences

- The post-feature alignment review (REV-0011) keeps running as the human pass;
  this gate is its machine floor for the enumerable case, so the drift that bit
  cannot silently ship again. Non-enumerable descriptor drift still relies on the
  review (honest limit, DR-0076) — the gate covers what a gate can.
- Closes REV-0011's `re-review 2026-07-13` early: the course lessons now teach the
  landlord↔manager delegation AND the successor read-only rung (swept in the same
  pass, DR-0111 "do all of them").
- Tier A: a documentation + test + copy change, no runtime behavior, rides the
  established lane behind the gates.

## Links

`app/src/__tests__/relationship-descriptor-consistency.test.js` (the gate),
`app/src/lib/relationships.js` (source of truth + DR-0101 cross-ref),
`CLAUDE.md` ("Post-Feature Alignment — Sweep the Descriptor Locations"),
`docs/reviews/REVIEWS.md` (REV-0011 practice, REV-0012 this feature),
[DR-0101], [DR-0102], [DR-0104], [DR-0076], [DR-0060], [DR-0111], WAYS-REVIEW.
