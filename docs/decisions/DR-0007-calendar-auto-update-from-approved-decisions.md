---
id: DR-0007
title: Calendar auto-update from staff-approved decisions (and it feeds the blackout scheduler)
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, tlc, poetech]
grounds: [CAGE, WORD-FIRST, TLC-FIREWALL, EARN-AUTONOMY]
source: 2026-06-08 church-LLM research-review (item G)
---

## Context
The church publishes its calendar as a static monthly JPG with no machine-readable feed (confirmed 2026-06-08: Sun Worship 11 AM; Wed Bible Study 1 PM & 6 PM; office hours M–F 11 AM–6 PM). The GPU blackout scheduler ([DR-0001]) needs a live calendar.

## Decision
The LLM extracts calendar-worthy decisions/events from meeting notes + action-item lists → stages them → **staff green-light approval gate** → the calendar auto-updates on a daily-or-workflow-fit cadence. The pipeline **maintains `service-calendar.json` directly**, giving the blackout scheduler live truth without waiting on COLG to publish iCal. Per entity: Church (services/events); **TLC (practice/public events only, NEVER PHI)**; PoeTech (release/roadmap). If COLG later publishes a public iCal, the scheduler subscribes to that instead.

## Rationale
Because it removes the manual-calendar dependency, closes the [DR-0001] gap, and is the **first concrete instance of the content-approval pipeline** ([DR-0002]) on a bounded, low-doctrine surface — proving stage 2→3 before any prose is auto-published.

## Consequences
The green-light is an irreducible human gate ([DR-0010]). High value early; recommended to build before broader content-authoring.

## Links
[DR-0001], [DR-0002], [DR-0010], research-review §6.2 + §4b.
