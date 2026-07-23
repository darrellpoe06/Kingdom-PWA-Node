---
id: DR-0228
title: Transparent operational functions — without airing our data, over-sharing, or under-doing; the opportunities-and-constraints balance
status: accepted
date: 2026-07-23
tier: A
declared_by: Darrell
supersedes: []
amends: [DATA-AS-EMPOWERMENT, EXECUTION-OUTCOME-OBSERVABILITY, DR-0104 (reviewer mode), DR-0226 (choice algorithm)]
principles: [DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE (DR-0076), GOVERN-EXECUTE-ADVISE, ANXIETY-CLARITY, TECHNOLOGY-CHOICE (DR-0226)]
---

## The word (Darrell 2026-07-23, verbatim)

> "I want to have transparent operational functions without airing our data or
> undermining us by giving too much information or not doing something that
> could be beneficial... opportunities and constraints."

## Decision — the balance, run as the DR-0226-style algorithm

Every operational surface (OpsBoard, uptime strips, build stamps, the App Store,
run summaries, public doors) is judged on THREE failure modes at once, and all
three are failures:

1. **Airing our data** — operational transparency must never leak family/business
   DATA (names, numbers, records). The line: show the SYSTEM's state (lanes,
   builds, health, versions), never the FAMILY's state, on any surface an
   outsider can reach. RLS remains the data gate (DR-0060); public repos/releases
   carry code + packages, never records.
2. **Giving too much information** — over-sharing operational detail that hands an
   adversary a map (internal hostnames, key names, security posture specifics,
   incident mechanics on public surfaces). Public surfaces get honest OUTCOMES
   ("up", "fresh", version); mechanics stay in the repo/ledger where stewards
   work.
3. **Not doing something beneficial** — opacity is ALSO a failure (the P31 lesson:
   downtime with no witness). Withholding a beneficial transparent function out
   of caution is under-claiming (DR-0100); the balance is struck by DESIGN, not
   by omission.

**The test for any new operational surface:** what does it reveal about the
SYSTEM (goal: everything useful) vs about US (goal: nothing an outsider can
use)? Run at design time, recorded in the surface's why (DR-0226 recording
rule). First applications: the App Store (public shelves: packages + versions —
beneficial; no data), the OpsBoard (steward-gated mechanics), site-health
(public outcome, ledgered mechanics).

`re-review: 2026-08-05` — sweep the existing public surfaces against the
three-failure test and record each verdict.
