---
id: DR-0621
title: Hold the hand of the process until it is done — a flag is where the work starts, we work on what does not work until it works, every intake is carried to an outcome the ecosystem communicates, every workflow has a purpose and a place in the whole, and we iterate to guarantee the outcome right away
status: accepted
date: 2026-09-24
tier: n/a
type: ways
declared_by: Darrell
scope:
  - docs/00-foundations/_root/HOLD-THE-HAND-OF-THE-PROCESS.md (the Way, new)
  - docs/decisions/PRINCIPLES.md (principle ID HOLD-THE-HAND)
  - docs/CONTEXT.md (router entry)
  - CLAUDE.md (Layer 0 pointer, one paragraph)
  - docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md (dimension 6 cites this Way)
  - scripts/claude-md-budget.json (ceiling 57124 -> 57575 for the Layer 0 pointer)
principles: [HOLD-THE-HAND, VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), NOTHING-WAITS (DR-0236), WAYS-REVIEW (DR-0108), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0618 — the monitors read the live database; the harvest alarm carried through analysis and fix until the live data told the truth (the worked example)
  - DR-0239 — "comprehensive" is defined; dimension 6, findings are work
  - DR-0111 — do the work; the only stopping points are named
source: 2026-09-24 — Darrell, spoken, three teachings in sequence (quoted in the Way)
---

## Context

On 2026-09-24 Darrell declared what "end to end" means. It does not mean one workflow finishing. It means continuous loops: every workflow's output seeds the next, and the live data proves the whole process ran.

He then went further. A failure that is only flagged is not the end: "It's actually analyzed and iteratively fixed. So it's done. So we can use it now. This is called holding the hand of the process until the process is totally, completely done, working end to end, all workflows integrated." And: "There's a purpose for every workflow. That's standard. That's our ways and documentation. Document that. Create our ways and documentation, do a DR."

He then corrected the draft of this record, which had said a workflow that joins nothing would be "integrated or retired": "We don't get rid of what doesn't work. What we do is we work on it until it works. But the things that do work, those things are live." And he set how every intake is carried: failures and feedback from any direction go through the workflow system and are categorized. Low-hanging fruit is fixed by the system. What was already decided is answered with its reason. The PoeTech ecosystem, not a human, does the leg work of communicating, timelines, stakeholder hand-holding and governance, "so people can feel heard", because "actions speak louder than words ... just like the King is."

The same day showed both the failure and the Way.
- **The failure.** The harvest monitor had flagged a stall on the same rolling incident many times without anyone carrying it through. Its alarm came from a retired database and a wrong count.
- **The Way.** Once someone held its hand, it went: analyze, fix, re-measure, analyze again, fix again, re-measure. At that point the live data showed 874 of 874 answered and the incident closed itself (DR-0618).

## What was measured

The same day's worked example, measured rather than asserted:
- harvest-health run 36029928554 read 754 transcribed plus 120 answered as no-caption, 874 of 874, with nothing owed;
- the rolling incident #1617 was closed by that run itself.

Before the hand was held, the monitor raised the same stall alarm on the same rolling incident many times. It was reading a retired database, and it counted "no captions" answers as owed (DR-0618).

## Decision

1. **Done is defined.** A process is done when it works end to end in the live system, the live data proves it, its output seeds the next process, and people can use it now. A flag, a named gap or a tracked item is not done.
2. **Hold the hand of the process.** The loop is detect → analyze (the root cause, measured) → fix → re-measure on the live data → repeat until proven → integrate. The one who finds it carries it through. Handing it off as a flag is not carrying it.
3. **We work on what does not work until it works; nothing is discarded for failing.** What works is live and stays live. Every workflow has an expressed purpose and a declared place in the whole: what it reads, what it writes, what it seeds. One that joins nothing yet is connected, and that connection is part of the work. Similar workflows are combined into one working workflow that keeps every option they offered: the app stays lean by combining, never by dropping what failed (Darrell: "Doesn't it cut down as we combine workflows that are similar so we have all options available while keeping the app lean?"). The combined one is proven end to end before the old copies are switched off. A workflow is switched off only where Darrell has decided so (n8n, DR-0132 and DR-0617), and only after its replacement is proven.
3a. **Every intake is carried to an outcome the ecosystem communicates.** Feedback, failures and requests from any door enter the workflow system and are categorized:
   - **low-hanging fruit:** the system fixes it, proves it, ships it, and tells the sender;
   - **already decided:** the system answers with the decision and its reason, citing the record;
   - **real work:** it goes on the board with an owner, a timeline window measured from the delivery record, and updates to the sender;
   - **needs a person's one value:** the system asks that person once.
   No human has to write those messages. Building the machinery is its own delivery; see Limits.
4. **New workflows join the integration at birth.** A new workflow, job, table or surface arrives with its reads, writes, seeds and live proof declared. A build gate enforces this; it is being built with the flow graph on `claude/every-workflow-seeds-the-next`.
5. **Iterate to guarantee the outcome right away.** Ship the smallest increment that truly works end to end, and measure every increment on the live data. An increment that only flags is not an increment.
6. **The only honest stopping points** are:
   - a physical step no one on the team can reach from where they are;
   - a value only Darrell holds;
   - an undecided bright line.
   Each carries the exact blocker, a paste-ready step and a `re-review:` date.
7. **The closing test, every turn:** is anything I flagged still not working and fixable now? Does everything I built feed the next process, proven by live data? If either answer says no, the turn is not over.

## Verification

- **The Way is written:** `docs/00-foundations/_root/HOLD-THE-HAND-OF-THE-PROCESS.md`. Every quoted verse was read from the repo's KJV corpus (`app/public/bible/kjv/*.json`): Philippians 1:6, Luke 14:28-30, Luke 13:8, 1 Corinthians 12:18, Nehemiah 6:15.
- **The worked example is measured, not asserted:**
  - harvest-health run 36029928554: 754 + 120 = 874 of 874, 0 owed;
  - incident #1617 closed by the run itself.
- **The ledger guard is green** (`node scripts/business-systems-guard.mjs`).

## Limits, stated

1. **The machine enforcement is on its way, not yet merged.** The flow-graph gates (no dead end, no orphan, no undeclared new workflow) and the live per-connection proof are being built on `claude/every-workflow-seeds-the-next`. Until they merge, the Way binds by this record and by Layer 0. `re-review: 2026-10-01`.
2. **Existing workflows are brought into the whole one by one,** each carried to working by this Way, not batch-flagged. The 2026-09-24 workflow evaluation's "retire" column is read under item 3: nothing that fails is dropped for failing. `re-review: 2026-10-07`.
3. **The intake-to-outcome machinery (item 3a) builds on what exists.** Existing pieces: the Phase 1b triage states, the receipt the sender sees, and the Decision Intelligence board (DR-0616, DR-0612). What is added: automatic categorization, the cited explanation for already-decided items, the system fix for low-hanging fruit through the lane (the AI class keeps its full brake set, per CLAUDE.md), and timeline windows from the measured delivery record. Built next, same day, on its own branch. `re-review: 2026-10-01`.
