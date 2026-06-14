---
id: DR-0061
title: Surfaces are live views of real flow, never static depictions — the app is where the flow runs; staged plan to wire the Build board and workflow fleet onto real in-app state
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [EXECUTION-OUTCOME-OBSERVABILITY, DATA-DRIVEN-LIVING, GOVERN-EXECUTE-ADVISE, QUALITY-OF-LIFE, COMMUNITY-FIRST]
source: 2026-06-13 — Darrell: "We want everything in the workflows to come together inside this one app… the actual flow of the PoeTech app will not work unless it actually does it inside the app again another human would have known that." Followed by "let's build everything… so we can actually use this app for my family and businesses."
---

## Context

On 2026-06-13 the PoeTech Build board — a surface whose entire purpose is
honest transparency — was discovered to be a hand-typed constant in a source
file (`BuildBoard.jsx`), connected to nothing. It could not show a real
"% complete" because no real work fed it, and it would not flag its own missed
targets until accountability was wired by hand. Darrell named the deeper frame:
the app is meant to be where the flow RUNS, not where it is depicted. He is
right, and the system analysis had never elevated this to the top — it treated
surfaces as display layers and optimized the display.

This is a class of failure (LESSONS-LEARNED P15/P16), not a one-off: surfaces
across the app still render seed/static data, ~16 workflows are built but
inactive, and the financial flow (real bank/Gmail ingest for a signed-in owner)
is not yet wired. "Usable for my family and businesses" depends on closing
exactly this gap.

## Decision

**Binding principle (P15):** every user-facing surface is a live view of — and,
where it acts, a control for — real system state. Every number, status, date,
or "% complete" must trace to real work (a real row, a real run, a real
timestamp). If it cannot be traced, it does not ship; a painted value is worse
than none on a surface whose value is trust. The app is where the flow RUNS.

**Process (P16):** the pre-build reality-trace in `CLAUDE.md` is mandatory
before any surface is coded — name the real data, confirm end-to-end in the live
system, confirm it is the surface the user actually uses (by observing the
running app), and state assumptions first.

**Staged plan to make it real** (each stage shippable; honest about what is
real at each step):

1. **Build board onto a real, in-app store.** The Build board tracks PoeTech
   building ITSELF — platform data, NOT the user's `projects` table (which has
   no %/subtask field; mapping the board to it was a premise error caught by the
   reality-trace). Move the roadmap from a source-file constant into a real
   store with subtasks, so **% complete = subtasks done ÷ total** is real, dates
   are real (the `daysLate` accountability from PR #66 then runs on real data),
   and the board is updated as part of shipping — no drift. Until that store
   exists, the board shows only values that are already real (its own dated ship
   history), never a painted %.
2. **Workflow fleet state, in the app.** A live readout of the n8n fleet
   (exists / active / last run / success / failure), via the dispatch-status
   feed already specced for the NAS (CLAUDE.md "Dispatch Status live readout").
   This is where "the workflows come together inside the app," with real status
   — and it unblocks honest pipeline numbers (built vs running vs staged).
3. **Act from inside the app.** Trigger and advance workflows + project steps
   from the app itself — the cockpit, not the dashboard. The loop closes.

## Consequences

- New surfaces must pass the reality-trace; a value that can't be traced to real
  state is a defect, not a placeholder.
- The Build board's accountability (PR #66) is honest only once Stage 1 feeds it
  real dates/subtasks; until then it is labeled as the hand-maintained roadmap.
- Stage 2 depends on the W1-W4 workflow-conformance gates (DR-0058) and the
  dispatch-status feed; Stage 3 is gated behind R4 (orchestration, DR-0056).
- A future guard ("displayed values trace to real state") is the structural
  analog of the data-provenance work (P14) and the tenancy guard (DR-0060).

## Links

`docs/00-foundations/_root/LESSONS-LEARNED.md` (2026-06-13; P15/P16),
`CLAUDE.md` (Reality-Trace Before Building Any Surface),
`app/src/components/BuildBoard.jsx`, [DR-0060] (tenancy guard — judgment as a
gate), [DR-0058] (workflow-conformance / the idle-fleet ladder),
[DR-0056] (orchestrator), GOVERNANCE-EXECUTION-ADVISORY,
EXECUTION-OUTCOME-OBSERVABILITY (`docs/00-foundations/_root/`).
