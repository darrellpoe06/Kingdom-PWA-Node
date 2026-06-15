---
id: DR-0076
title: Verification Doctrine — trust nothing unverified; make truth cheap to verify and lies expensive to ship, so the PoeTech app is grounded in truth
date: 2026-06-15
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [EXECUTION-OUTCOME-OBSERVABILITY, DATA-DRIVEN-LIVING, GOVERN-EXECUTE-ADVISE, DATA-AS-EMPOWERMENT, LESSONS-LEARNED, RESEARCH-FIRST]
source: 2026-06-15 — Darrell: "How do we safeguard against lies from AI… AI will and do lie accidentally or whatever; we need an executable plan to protect our work and outcomes so we get the best from AI not the slop or garbage that looks great. We need to always be grounded in reality and truth so verification is most important and the PoeTech app must be grounded in truth."
---

## Context

AI produces confident output that *looks* right and can be wrong — a false
comment ("all combinations exceed WCAG AA" while the real ratio was 2.92:1), a
refactor *claimed* behavior-preserving but never pinned, a "done" with no
evidence. The danger is not malice; it is **plausible-but-unverified output
shipped as truth.** The safeguard is structural: make truth **cheap to verify**
and unverified claims **expensive to ship.** "Looks great" is not a status.

## Decision

**Trust nothing unverified. The AI's job is not to sound right — it is to be
*verifiably* right, or to clearly mark what is unverified.** This is the
executable protocol; each rule is a thing we DO, proven this session.

1. **No claim without evidence (definition of done).** "It works / it's done /
   it passes / it's accessible / it's secure" is NOT accepted on the AI's word.
   Done = attached evidence: a passing deterministic gate, a measured number
   from the real artifact, a live screenshot / DOM read, a real query result, a
   test. No evidence → not done.

2. **Deterministic gates over claims.** Where a property can be machine-checked,
   a gate checks it and **fails the build** — the AI cannot talk past a gate.
   In force: data isolation (`tenancy-guard`, DR-0060), workflows
   (`workflow-conformance`), mission (wf36), behavior (the test suite), and
   per-theme contrast (`contrast-guard`). Every new class of "looks-fine-but-
   isn't" that bites becomes a new gate (LESSONS-LEARNED feeds this).

3. **Proven-to-catch (anti-theater).** A gate that always passes is itself a
   lie. Every gate ships only after it is shown to CATCH the break — inject the
   violation, confirm a non-zero exit. A green check must *mean* something.
   (DR-0060 discipline, now binding for every gate.)

4. **Measure, don't claim.** Any quantitative claim — contrast, performance,
   counts, "N rows" — comes from a measurement on the REAL artifact, not the
   model's estimate. (The contrast bug was found by measuring rendered colors,
   not trusting the hex or the comment.)

5. **Characterize before you change.** Before altering behavior, pin what the
   code ACTUALLY does in a test; "better than before" is measured against
   verified reality, not memory. (The OneVoiceInput dispatch was pinned with a
   15-case matrix + a live end-to-end run before the consolidation was trusted.)

6. **Reality-trace before you build.** Name the real data and the real screen a
   surface touches; verify against the running system; observe, don't assume.
   (DR-0061 / LESSONS P15-P16.)

7. **Independent / adversarial verification for high-stakes.** A second,
   independent method confirms before trust — a live test against the data, not
   only a read of the code; a refute-the-claim check, not only a confirm.
   (The Jayden "leak" was settled by a live RLS probe + the user's own
   screenshot, not by reasoning about the code.)

8. **Provenance and honest uncertainty.** Claims about the system cite
   `file:line` / a run / a query. Claims from training data are flagged as such,
   never stated as system fact. Uncertainty is surfaced, never papered over —
   "I didn't verify X" is a valid, required output. (Extends the CLAUDE.md rule
   against citing training-data theology as canonical.)

9. **The human governs the bright lines.** Verification does not remove the
   governor; it makes review *cheaper* by attaching evidence. The AI advises
   with receipts; Darrell decides (GOVERNANCE-EXECUTION-ADVISORY).

## Consequences

- The agent reports outcomes with evidence attached and marks anything
  unverified plainly; a bare "done"/"works"/"passes" is incomplete and to be
  challenged — by Darrell, by a reviewer, or by the agent on itself.
- New gates are the durable output of this doctrine: every "a human would have
  known / it looked fine but wasn't" incident (LESSONS-LEARNED) is mined for a
  machine check that prevents recurrence. The contrast gate is the first added
  under this DR.
- Pairs with DR-0075 (perpetual improvement): improvement is the default, and
  *verified* is the bar for calling something improved.
- Encoded in `CLAUDE.md` (Layer 0) so the posture is held before the agent is
  asked, not only when this DR is consulted.

## Links

`CLAUDE.md` (Layer 0 entry), `scripts/tenancy-guard.mjs`,
`scripts/workflow-conformance.mjs`, `scripts/contrast-guard.mjs` (the first gate
added under this doctrine), [DR-0060] (tenancy guard — the proven-to-catch
precedent), [DR-0061] (reality-trace), [DR-0075] (perpetual improvement — the
sibling), QUALITY-GATEKEEPER (wf36), EXECUTION-OUTCOME-OBSERVABILITY,
LESSONS-LEARNED, GOVERNANCE-EXECUTION-ADVISORY (`docs/00-foundations/_root/`).
