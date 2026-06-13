---
id: DR-0071
title: Work self-activates from the project logs (event-driven, three-brakes-bounded) and projects its own start / finish / go-live dates from those logs
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0042, DR-0061, DR-0069]
tier: C
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, THREE-BRAKES, DATA-DRIVEN-LIVING, EARN-AUTONOMY, EXECUTION-OUTCOME-OBSERVABILITY]
source: 2026-06-13 — Darrell, correcting "nothing self-activates" — "It would self active based on the project logs we should be able to give a projected start and finish or go live date."
---

## Context

The agent had framed the system as "nothing self-activates." That is too blunt
and contradicts the design. Darrell's correction: work SHOULD self-activate based
on the project logs, and the system should project its own start / finish /
go-live dates from those logs. This reconciles self-activation with the
three-brakes runaway rule and names the projection requirement.

## Decision

1. **Self-activation is event-driven from the project logs — and that is the
   design, not a violation.** A logged, planned, governed work item in the
   project logs is a real EVENT (DR-0042 event-driven). Execution self-activates
   off that event. The 2026-06-06 runaway rule does NOT forbid this — it forbids
   **unbounded, unbraked, unattended** self-triggering loops. The distinction:
   - **Allowed:** work kicks off from a real project-log entry, **bounded by the
     three brakes** (budget ceiling per run, single-instance concurrency lock,
     kill-switch / auto-pause on overrun).
   - **Forbidden:** a clock-driven loop that spawns compute with no event, no
     budget, no lock, no kill-switch — the runaway shape.
   - **Tier-C-active still turns on attended** (DR-0056): the first activations
     happen with someone watching; "self-activates from the logs" describes the
     steady-state trigger, not a license to flip it on unattended.

2. **The system projects its own dates from the project logs.** Start, finish,
   and go-live dates are DERIVED from real project-log state — planned dates,
   status transitions, elapsed-vs-planned, dependencies, velocity — not hand-
   typed. The projection is a live view of real flow (DR-0061): it moves as the
   logs move, and it flags its own slips (already true for the Build board's
   overdue logic and the project cards' on-track/overdue from real dates).

3. **Honesty bar on the projection (DR-0061 / DR-0065).** A date derived from
   real log data is real and ships. A date the system can't yet derive credibly
   (sparse logs, no basis) is NOT painted — it shows "not yet projectable" until
   there's real basis. The log-derived ESTIMATION (projecting a date the human
   never set, from velocity / dependencies) is the local brain's job and lands
   with the orchestrator; it is not faked in the meantime.

## Consequences

- The orchestrator's trigger model is the project logs + the three brakes; the
  "self-activation" is event-driven, bounded, and observable (every activation
  emits an event — EXECUTION-OUTCOME-OBSERVABILITY).
- Projected dates are a real-data surface: what's derivable from logs today (real
  dates, overdue, on-track) is live on the Build board + project cards; the
  estimation of unset dates comes with the brain — flagged, never painted.
- Corrects the record: the system is not "nothing self-activates" — it is
  "self-activates from real events, inside the brakes, attended for Tier-C
  turn-on." That precision is the binding statement.

## Links

[DR-0042] (event-driven by default), the three-brakes rule in `CLAUDE.md`,
[DR-0056] (staged / attended activation), [DR-0061] (live surfaces over real
flow — the projection), [DR-0069] (the pipeline the logs trigger),
`_root/LESSONS-LEARNED.md` (the 2026-06-06 runaway this bounds against).
