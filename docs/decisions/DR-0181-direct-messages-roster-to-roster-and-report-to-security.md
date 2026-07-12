# DR-0181 — 1:1 direct messages, roster↔roster, and report-to-security

- **Status:** accepted
- **Date:** 2026-07-12
- **Tier:** B (new app-wide messaging tables + a privacy-sensitive RLS model; soaks on preview; participant-only reads verified by RLS)
- **Governs:** who may privately message whom across the app, and how anyone reports to the security team
- **Grounds:** COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, WORD-FIRST
- **Pairs with:** DR-0180 (the bus ministry it first surfaces in), DR-0060 (RLS is the real data gate), SOVEREIGN-COMMS-AND-MEETINGS.md, 0096-direct-messages-security.sql

## Declared by Darrell, 2026-07-12

> "users [need] to be able to only speak to each other individually in the choir and the whole app…" — and, on who may reach whom: "[leaders can DM anyone] and the rosters can DM rosters so an usher can tell security to come here, and anyone can report to security who has access to the Observation tab with all camera feeds in the building including the broadcast."

## The decision

Add **1:1 direct messages** (`direct_messages`) and a **report-to-security** channel (`security_reports`, `security_team`) — app-wide, built in the app, first surfaced in the bus ministry and reusable everywhere (0096).

**Only the two participants ever read a DM** (RLS: `auth.uid()` in {sender, recipient}). Who may *start* a DM is decided server-side by `users_can_dm(instance, other)`:

- A **leader** (owner/admin of a shared instance) may DM anyone in it; anyone may DM a leader.
- A **roster member may DM another roster member** in the same instance (roster↔roster: an usher tells security "come here"). "On a roster" = a row in any ministry roster (`bus_drivers`, `choir_members`, `security_team`).
- **Conservative for minors by construction:** a minor is not an owner/admin and not on an operational roster, so a minor is only reachable by a leader initiating — messaging is never opened peer-to-peer to minors. Guardian-scoped minor messaging is a documented follow-up (DATA-AS-EMPOWERMENT minor protections).

**Report to security:** any instance member files a `security_reports` row; the security team (owner/admin OR a `security_team` row) reads and triages it (new → acknowledged → resolved). The security team is, by design, the group that holds Observation-tab access to the building camera feeds + broadcast — so a report reaches those who can see the room.

## What makes it trustworthy (gates, not claims — DR-0076)

- **The privacy model is server-enforced.** Participant-only read, `users_can_dm` insert check, recipient-only read-receipt update, sender-only retract — all in RLS. The client (`DirectMessages.jsx` / `SecurityPanel.jsx`) never decides access; a blocked send is the gate doing its job.
- **Pure logic is unit-tested.** `lib/direct-messages.js` (threading from my perspective, unread tallies, security triage view) — 8 tests pin it.
- **Word-first, verified.** Surfaces carry Ephesians 4:29 / Matthew 18:15 / Colossians 4:6, KJV-verbatim from in-repo data.

## Honest limit (DR-0100)

Security ↔ Observation is data-connected (reports exist; the security team reads them) but not yet surfaced together — rendering the report feed *inside* the Observation camera tab is the follow-up (re-review 2026-08-15).

## Encoded / verified

Migration 0096 (`users_can_dm`, `user_in_security`, `user_on_any_roster`, RLS on `direct_messages`/`security_reports`/`security_team`); libs `direct-messages.js` (+ 8 tests) and `direct-messages-sync.js`; `components/DirectMessages.jsx` + `components/SecurityPanel.jsx`, surfaced in the bus ministry's Messages tab. Full suite green, lint + build clean, all guards pass.
