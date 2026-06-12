# 2026-06-11 — Vision capture: the build processes through the app

Source: Darrell, 2026-06-11 (verbatim intent captured same-session, organized
into project records per his directive: "All of these ideas should be
organized into projects"). Layer 4 working artifact; decisions that harden
get DRs later. Nothing here is invented — every item traces to his message.

## The governing directive

**All PoeTech app build work processes through the PoeTech app itself, with
estimated Go-Live dates, so the work is transparent.** The build IS the
first customer of the Projects system. (Pairs with: outcome-first
critique-by-use; the founder experiences the pain first — "low hanging
fruit is good for me experiencing the pain of the PoeTech app before
anyone else does.")

## Locked spec: Poe Properties occupancy-revenue model

Per-room monthly revenue potential, used to motivate marketing of vacant
space throughout the rent → collect → buy → invest lifecycle:

- **$1,000 per person**; **$2,000 per room when fully occupied**
- **$1,000 per room at 50% occupancy**
- **$0 per room when empty / $0 when the home is empty**
- Every room always shows **100% opportunity = $2,000 projected** if and
  when rented — the gap between actual and projected is the motivation
  surface ("market this room") that should drive automatic prompts across
  the property lifecycle.

Implementation home: Real Estate tab — per-room occupancy state rides the
existing device-local `rooms` records; projected-vs-actual renders on the
property card and rolls up to the portfolio. (Rooms data already exists;
this adds occupancy + the projection math + marketing prompts.)

## Project records (the roadmap, to live IN the app's Projects tab)

| # | Project | What ships | Est. go-live | Tier |
|---|---------|-----------|--------------|------|
| 1 | **Build-transparency board** | The app's own build as seeded project records with statuses + go-live estimates, updated as part of every ship; visible to every user level | 2026-06-17 | B |
| 2 | **Occupancy-revenue model** (spec above) | Per-room occupancy + $-projection + "market this room" prompts on Real Estate | 2026-06-20 | B |
| 3 | **Dashboard merged into Projects** | Big Picture content reorganized into the Projects page so one surface serves all user levels; "everyone can know anything about everything" | 2026-06-24 | B (C if it moves the front door) |
| 4 | **Feedback → AI-review pipeline** | Existing feedback intake (wf30) extended: AI-reviewed routing to the correct person/user with follow-up; sequence-of-events kept per user | 2026-07-01 | C (touches family-voice loop) |
| 5 | **Referral / contact share** | Share the app; optional contact pull for reach; byproduct = subscribed users gaining insights | 2026-07-08 | C (privacy: DATA-AS-EMPOWERMENT — contact data is the sharer's, opt-in, never harvested) |
| 6 | **Professional-vertical seed data** (lawyers first) | Each vertical's seed shows what an expert in that field would need + projections — impressive enough to carry the vision (SEED-DATA-AS-ASPIRATION applied per vertical) | 2026-07-15, one vertical/wk | B per vertical |
| 7 | **IoT / Wyze surveillance module** | Surveillance tab; family/landlord/business each see their own camera platforms in-app; market/constraint analysis first. NOTE: Wyze exports already land on the NAS (`/volume1/docker/SSCamExport_Wyze Cam V2` observed 2026-06-11) — a sovereign ingest path exists before any cloud API work. VISION-FAIRNESS-STANDARD binds anything that recognizes people | analysis 2026-07-22; module after family review | C |
| 8 | **Governance panel** | Church governance + 1099 experts (education, technology, health, environment, doctrine) wired into project decisions; doctrinal subjects ground in the Worldview spine per CLAUDE.md — never improvised | with #4 | C |
| 9 | **Family finance together** | Member/user-level breakdown so the couple + children discuss finance and business together; free at the family level "for the Lord's perspectives" | 2026-07-29 | C (minors: DATA-AS-EMPOWERMENT protections) |

Dates assume the current cadence (one focused build session most days) and
are estimates to be revised ON the build-transparency board itself — that
is the point of project #1: the dates live in the product, not in chat.

## Standing posture captured

- AI-driven development with go-lives faster than a human team and fewer
  mistakes — held accountable by the QC loops now in the product
  (lifecycle trails, verify gates, live-data triggers) and by
  LESSONS-LEARNED (P13 added today: schema files are not applied state).
- Motivation by understanding: content + context + situational analysis
  per user, "because that's what humans do."
- Governance through the church; expert 1099 input; every doctrinal
  surface grounds in THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.

## Same-session ships that serve this vision

- Synology Chat property-history bridge LIVE (wf-property-history on the
  NAS n8n; token-gated; forced-command read-only key; PWA import staged
  with family verification). The property channels hold the history:
  805NProspect 1,626 msgs · 1003Koehn 270 · 440SS 215 · 709CommercialSt
  136 · 1213KoehnDr 113 · 1513HH 94 · 1508HH 82 · 2111TalansDr 69 ·
  1003KoehnDrDanville 39 · 1508Williamsburg / 1003KoehnDrDanville etc.
- v2.13 live-aligned migration applied to the cloud DB (rentals enriched,
  incidents QC columns, contractors_1099 created).
- All three sync wrappers aligned to verified live shapes.
