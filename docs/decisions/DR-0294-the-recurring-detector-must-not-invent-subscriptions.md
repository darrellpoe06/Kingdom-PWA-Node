---
id: DR-0294
title: The recurring detector must not invent subscriptions — the rhythm has to exist before the filter, and a flat dollar tolerance is wrong at every scale but one
date: 2026-08-12
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [books, family, tlc]
grounds: [VERIFICATION-DOCTRINE, SPEAK-ESTABLISHED-FACT, DATA-AS-EMPOWERMENT, PERPETUAL-IMPROVEMENT, MACHINERY-OVER-MEMORY]
source: 2026-08-11 session — Darrell, reading the Recurring payments KPI: "review the KPI reports... how is the reoccurring charges being calculated and some of these charges like charge point didnt happen each month for the same amount... what is going on?" then "review the code..." and "calulations... using python... what is the code doing..."
---

## Context

The Imported tab's subscription audit reported **43 patterns · $6,555/cycle ·
$5,975 to review/cut**. Darrell recognised charges in that list that are not
subscriptions — ChargePoint EV sessions, which happen when you plug in and cost
whatever they cost.

He was right, and the arithmetic was reproduced in Python before a line was
changed rather than reasoned about in prose.

## What the code was doing

`detectRecurring` grouped by payee, took the median amount, **discarded rows far
from that median**, and *then* measured the gaps between whatever survived.

Three defects fell out of that order, each measured:

**1. A flat `$3` absolute tolerance, applied unconditionally.** The rule was
`diff <= $3 OR diff <= 20% of median`. On a $5.95 median, $3 is **50%** — so the
percentage rule never ran at all for small charges. Six ChargePoint sessions
from $4.50 to $7.40 every one counted as "the same amount":

```
$4.50  diff $1.45  (24.4% of median)  -> KEEP ($3 abs)
$7.40  diff $1.45  (24.4% of median)  -> KEEP ($3 abs)
survivors: 6 of 6  ->  "every 2 weeks · $5.95"
```

Note the percentages: 24% is **outside** the stated 20% rule. The escape hatch
overrode the actual policy. A flat dollar tolerance cannot be correct at two
scales at once — that is what the percentage is for.

**2. The cadence was MANUFACTURED.** Because the amount filter ran first, the
detector could not fail to find a rhythm: it deleted the evidence against one.
Nine coffee purchases every 14 days with alternating amounts:

```
$5.00 KEEP · $12.00 drop · $5.10 KEEP · $13.00 drop · $4.90 KEEP ...
survivors: 5 of 9
gaps between SURVIVORS: [28, 28, 28, 28]  ->  "monthly · $5.10"
```

There is no monthly charge in that ledger. Every purchase was 14 days apart. The
report invented a subscription out of a filtering artifact.

**3. `payeeKey` kept three digit-stripped words**, so
`CHASE CREDIT CRD AUTOPAY` and `CHASE CREDIT CRD EPAY` collapsed to one key and
two genuinely different payments merged into a single blended median.

## The decisions

**1. The rhythm must exist BEFORE any filtering.** The cadence is measured across
every row for the payee, and the amount-consistent subset must agree with that
same band. A pattern that only appears after the inconvenient rows are removed
is not a pattern.

**2. The absolute tolerance is a cents-level floor for rounding noise ($0.50),
not a dollar escape hatch.** The percentage does the scale work.

**3. A real bill is MOST of what a payee charges, not a similar-looking
minority.** 75% consistency required. ChargePoint kept 3 of 6 and coffee 5 of 9
— both minorities dressed as subscriptions.

**4. `payeeKey` keeps five tokens.** Stated tradeoff rather than hidden: a
trailing city can ride along, so one payee billed from two cities splits into
two patterns. That is the safer error — a split shows both, a merge hides one
inside a median.

**5. Guarded in BOTH directions.** A blinded report is its own failure, so the
tests require that ChargePoint, alternating-coffee and varying-grocery return
**nothing**, while a fixed Netflix charge and a utility bill that drifts a few
cents and a few days are still **found**.

## Impact

The KPI counts will drop when this deploys. That is the point: some of what was
being counted was not there. `debt-payments.js` (`cardPaymentSuggestions`) turns
these patterns into money advice, so the defect reached beyond the report — both
consumer suites verified green against the tightened detector.

## Why it matters beyond this module

A detector that invents subscriptions tells a family to cancel money they are
not spending, and buries the bills that are real. It is the same failure class as
the harvest witness that counted its own error rows as progress (DR-0277 lineage,
LESSONS P22): **a measurement that cannot fail to produce a positive result is
not a measurement.**
