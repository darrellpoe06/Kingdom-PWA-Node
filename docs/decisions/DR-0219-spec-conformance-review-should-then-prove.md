---
id: DR-0219
title: Spec-Conformance Review — before "done"/"works", state what a process SHOULD do from the Ways/docs, trace what it ACTUALLY does, name the gaps, and close them
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: []
amends: []
principles: [SPEC-CONFORMANCE-REVIEW, REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), WAYS-REVIEW (DR-0108), BUSINESS-PROCESS-CONNECTIONS, PERPETUAL-IMPROVEMENT (DR-0075), REVIEW-LIVE-PUSH (DR-0104), DO-THE-WORK-DONT-RE-ASK (DR-0111)]
---

## Context

Darrell, 2026-07-21, after asking whether the feedback process worked and getting
an evidence-backed trace:

> "Review what feedback should be doing then see if we are... Ways and documentation"

and then, making the pattern permanent:

> "Add this process to your and our Ways and documentation for making sure we do
> it every time..."

The move he named is a **conformance audit**: don't just confirm a feature runs —
compare the shipped implementation against its OWN documented intent, from the
Ways/docs, and close whatever diverges. It is the complement to Reality-Trace
(DR-0061): Reality-Trace checks a surface against real *data* before building;
this checks a built process against its documented *should*, so intent and
implementation never drift apart silently.

## The decision

**Before any process or feature is called "done" or "working" — and whenever
anyone asks whether it works — run a Spec-Conformance Review, out loud, in four
steps:**

1. **SHOULD — cite the documented intent.** Gather what the process is supposed to
   do from the Ways/docs: `docs/00-foundations/_root/*`, `docs/decisions/`,
   `memory/MEMORY.md`, session notes, `CLAUDE.md`. Quote each requirement with a
   **`file:line` citation**. If the intent is undocumented, that is itself a
   finding — write the spec down first (a new DR / foundation note), because an
   undocumented process cannot be conformance-checked and drifts silently.
2. **ARE — trace the real implementation** end-to-end (`file:line`): collection →
   storage/RLS → notification → sync → triage/governance → how it feeds the next
   step. Observe running behavior where the sandbox can (tests, a query, a live
   probe); name honestly what only a live/signed-in session can confirm (DR-0076
   provenance + honest uncertainty).
3. **GAPS — name every divergence plainly.** A requirement not met, a dead
   consumer, a path that silently no-ops, a promise the surface makes that nothing
   fulfills (BUSINESS-PROCESS-CONNECTIONS four-question test). Never soften a miss
   into "mostly works."
4. **CLOSE — fix it or record why + a `re-review:` date** (DR-0075). Each gap ends
   as an improvement shipped through the verified lane OR a one-line why + a date.
   Never a silent drop, never a "looks fine."

**"It works" is accepted only on this SHOULD-vs-ARE trace with receipts, never on
assertion** (DR-0076). The review is a standing step the agent runs WITHOUT being
re-asked — like the reality-trace, the tests, and the live-production review;
silence is not a skip. It does NOT license re-asking a settled question (DR-0111):
the agent produces the trace and closes the gaps itself, surfacing to Darrell only
a genuine DR-0089 carve-out (a new bright line, a value only he holds, a verified
premise conflict).

## Verification (DR-0076)

The standing test for "is a process done/working?": (a) is what it SHOULD do
written down and cited (`file:line`)? — if not, the spec-writing is the first gap;
(b) is the real code path traced end-to-end against that spec, with running
behavior observed where possible? (c) is every divergence named as a gap, not
softened? (d) does each gap end in a shipped fix OR a why + `re-review:` date?
A "works" claim with no SHOULD-vs-ARE trace attached is not done. Grounds the
feedback conformance review Darrell directed and every one after it; pairs with
DR-0061 (reality-trace), DR-0076 (evidence), DR-0108 (ways-review), DR-0075
(close-or-date), DR-0104 (the human confirms the conformed build live), and the
BUSINESS-PROCESS-CONNECTIONS four-question surface test.
