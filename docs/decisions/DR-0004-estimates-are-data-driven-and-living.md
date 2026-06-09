---
id: DR-0004
title: Estimates are data-driven and living, not a waterfall
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [DATA-DRIVEN-LIVING]
source: 2026-06-08 church-LLM research-review (item D)
---

## Context
Timelines and projections were being treated as fixed dates; Darrell's directive is that estimates come from the interconnected data the Iterative Software Project produces.

## Decision
Every estimate is a **first-pass projection** anchored to, and re-baselined against, our interconnected telemetry: the Continuous Feedback Reel (`_reel.jsonl`), Events-as-data, Execution-Outcome Observability, the Workflow Module Library, and the sovereign analytics + first-party data ([DR-0008], [DR-0009]). Dates are not commitments. **When telemetry contradicts an estimate, the telemetry wins.**

## Rationale
Because real throughput, soak cleanliness, and funnel outcomes are knowable from systems we already run; guessing statically wastes the signal and over-commits.

## Consequences
The research-review timeline section is explicitly living; each completed pass is an Event that re-bases the next estimate. Autonomy-graduation readiness ([DR-0010]) is judged from per-surface ledger outcomes, not a calendar.

## Links
[DR-0008], [DR-0009], [DR-0005] (the loop that produces the data), research-review §9–§10.
