# DR-0118 — Entrance review before customers, recorded every time

- **Date:** 2026-07-07
- **Status:** accepted
- **Declared by:** Darrell
- **Grounds:** `docs/00-foundations/_root/ENTRANCE-REVIEW.md`

## Decision

Before any business door or customer-facing surface takes real customers,
every entrance and input spot on it is reviewed for usability and UI/UX —
comprehensively, OBSERVED on the running build (browser pass + DOM audit +
screenshots, per DR-0076), and the results are documented as a REV record in
`docs/reviews/REVIEWS.md` every single run. The review re-runs on any
material entrance change. It is a standing Way, not a one-off.

Darrell, 2026-07-07: *"review all import spots for usability, comprehensively
and other UIUX potential issues before she has customers enter this app and
this is a Way and document the results each time for recording purposes."*

## What it binds

1. A new door's first customers wait on a completed, recorded entrance
   review (CLIENT-BUSINESS-FACTORY step 6 is incomplete without it).
2. The checklist and observation method live in ENTRANCE-REVIEW.md (Layer 3);
   the record lands in the REVIEWS.md registry (`Type: ui-ux`, `Surface:
   entrance — <door>`), read by the in-app Quality panel.
3. Findings ship as same-session fixes or park with a why + `re-review:`
   date (DR-0075). Never a silent drop.

## First execution

REV-0013 (2026-07-07): the Moore Divahs door, before Shay's customers enter —
findings fixed same-session (order-form keyboards/autofill, multi-line
details, ~44px money-path tap targets, comfort-control hitboxes) plus one
open watch item (a triple-rendered invite field seen on an earlier live
build, not reproducible on current main).

## Pairs with

DR-0104 (live user-view review), DR-0076 (verification), DR-0075 (perpetual
improvement), DR-0114 (client factory), DR-0108 (ways-review).
