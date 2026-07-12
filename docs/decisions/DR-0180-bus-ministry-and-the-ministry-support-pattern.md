# DR-0180 — The Bus/Van Ministry, and the reusable ministry-support spine

- **Status:** accepted
- **Date:** 2026-07-12
- **Tier:** B (new church-facing surface + new tables/RLS; soaks on preview; not money/front-door identity so not C)
- **Governs:** how COLG's bus/van ministry coordinates in the app, and the reusable pattern every other ministry inherits
- **Grounds:** APP-IS-PRIMARY, COMMUNITY-FIRST, VERIFICATION-DOCTRINE, NO-STATIC-DATA, PERPETUAL-IMPROVEMENT, WAYS-REVIEW
- **Pairs with:** 0011-choir-module (the template), DR-0061 (real data, no painted surfaces), DR-0103 (the dev/ops intake feeds the streamlined loop), MINISTRY-SUPPORT-PATTERN.md

## Declared by Deacon Anderson to Darrell, 2026-07-12

Deacon Anderson runs the bus/van ministry (~4 drivers every Sunday; routes he covers weekly — Champaign south-of-Springfield, Champaign north-of-Springfield, Urbana, and an accessibility van Champaign↔Urbana; drivers arrive ~9:45am, finish ~1:30pm). The live failure was not the schedule — it was the reminder that never went out:

> "they're not calling my drivers… this morning no one's on the phones… sister should've called him on Thursday and said you're scheduled." → "so once the schedule come out, the reminders need to go [out]."

Plus: user accounts for the drivers, a shared thread everyone sees, the ability to message back, and a way to hand new requirements to the build team ("tell me what more you need to add, and we'll do that").

## The decision

Build the **Bus/Van Ministry** surface in the app (church sub-tab `bus`) on real, instance-scoped, RLS-gated, realtime-synced data (0095-bus-ministry.sql), mirroring the Choir module — and extract the shape as the **ministry-support spine** every ministry reuses. Six primitives:

1. **Roster** (`bus_drivers`, phone + email + role) — coordinator/driver/assistant/dispatch.
2. **Schedule** (`bus_schedule`) — who drives which route, in which van, arrive/end window; the driver confirms/declines their own row.
3. **Reminders** (`bus_reminders`) — the fix for "nobody called them": from a published schedule, one reminder per assigned driver dated the Thursday before (`buildReminderPlan`); overdue rises to the top (`dueReminders`/`overdueReminders`).
4. **Shared thread** (`bus_messages`) — everyone in the ministry sees it together.
5. **1:1 + report-to-security** — via DR-0181's `direct_messages` / `security_reports`.
6. **Dev/ops intake** (`bus_requests`) — the ministry types what it needs; it reaches the build team without a call.

Access mirrors choir (`deriveAccess`): read = any ministry member (`user_in_bus_ministry`); edit = owner/admin (the coordinator).

## What makes it trustworthy (gates, not claims — DR-0076)

- **Pure logic is the gate.** `lib/bus-ministry.js` (no Supabase) holds the access gate, date math (nextSunday / remindSendOn = Sunday−3 = Thursday), coverage, and the reminder plan — 25 unit tests pin them; a rule not proven there doesn't ship.
- **Real data, no paint (DR-0061).** Routes/vans enter through a coordinator's one-tap starter template (his real declared routes), not a global seed. A non-member sees an honest "ask to be added" state, not a painted surface. Coverage numbers are real tallies.
- **RLS is the real enforcement.** A driver can confirm/decline only their own row and acknowledge only their own reminder; the client mirrors this only so the UI matches.
- **Honest limit stated (DR-0100):** v1 reminders are in-app + coordinator-logged ("sent"/"acknowledged"), not yet auto-SMS. It removes the "did anyone remind them?" ambiguity; it does not yet send the text. Auto-SMS needs a provider + the three brakes — the first `bus_requests` entry.

## The Way this establishes (WAYS-REVIEW, DR-0108)

A proven module is a template: the second instance reuses the first's spine (tables + `user_in_X()` + `makeSubscriber` + `deriveAccess` + testable pure logic), it does not re-architect. Building the bus ministry by cloning the choir's shape is why it took one session. Recorded in MINISTRY-SUPPORT-PATTERN.md.

## Encoded / verified

Migration 0095; libs `bus-ministry.js` (+ 25 tests) and `bus-ministry-sync.js`; `components/BusMinistry.jsx`; wired into `surfaces.js`, the church nav, the render switch, and the feedback-area map (`church-bus`). Full suite green (5510), lint + build clean, all CI guards pass (boundary, monolith-budget, interconnect, source-adapter, surface-audit, contrast, legibility, consistency, feedback-area).
