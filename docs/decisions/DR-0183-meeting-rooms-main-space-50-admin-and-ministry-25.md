# DR-0183 — Two meeting rooms: a 50-person admin/monthly main space + 25-person ministry meetings, sized to the sovereign stack

- **Status:** accepted
- **Date:** 2026-07-12
- **Tier:** B (adds a column + refines RLS on an existing table; caps are policy sized to real hardware; deterministic tests cover it)
- **Governs:** the room model + capacity caps for sovereign PoeTech meetings
- **Grounds:** DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, COMMUNITY-FIRST
- **Pairs with:** DR-0182 (the meeting engine it refines), DR-0068 (three brakes), ChurchInfraPlan / the infra project, SOVEREIGN-COMMS-AND-MEETINGS.md §3–3.5

## Declared by Darrell, 2026-07-12 (with a screenshot of the live Meetings tab)

> "The main meeting space should be for the admin staff and potential monthly meetings with 50-person max. Opportunities and constraints keep in mind we have on-site NAS boxes and an infrastructure project Ari and claude are researching."

## The decision

Give meetings a **room** (`space`), replacing the single flat 25-person cap from DR-0182 with two rooms sized to the **real on-site stack** (the Synology NAS today; the 5× RTX 3090 rig the infra project is standing up):

- **Main meeting space** — admin staff + monthly meetings, up to **50 people**. **Exclusive** (a 50-person sovereign video meeting takes the whole stack, so nothing else may overlap it) and **admin-only to book**.
- **Ministry meeting** — a working meeting for a ministry (bus sync, choir), up to **25** (12 typical); several run within the ≤ 3 concurrent cap.

The per-room cap and the exclusivity are enforced by the client load rules (`ministry-meetings.js`), and the admin-only main room + a hard 50-person ceiling are enforced in **RLS** (`0098` — `space` column, CHECK ≤ 50, main-room insert/update requires owner/admin).

## Why these numbers (grounded, not aspiration — DR-0076)

The caps are a hardware fact, not a preference. A single sovereign uplink carries **the whole admin staff (50) OR a few small working meetings, not both** — so the main room is exclusive. Until the 3090 rig is stood up, the NAS alone bounds concurrent video, so ≤ 3 ministry meetings is the conservative present. **Caps rise with measured capacity, not before.** Full opportunities/constraints (sovereign-by-default, the broadcast stack already exists, one-uplink exclusivity, NAS-first/rig-pending, LAN/Tailscale reach) are in SOVEREIGN-COMMS-AND-MEETINGS.md §3.5.

## What makes it trustworthy (DR-0076)

- **Proven-to-catch.** `ministry-meetings.test.js` (20 tests) fires each rule: main allows 50 / blocks 51, ministry stays 25, the main room is exclusive both directions, and `canBookSpace` gates the main room to owner/admin.
- **RLS is the real gate.** `0098` makes the main room admin-only and caps participants ≤ 50 in the database, not just the UI.
- **Honest about the frontier.** Bigger-than-50 / concurrent-with-main is named as a cloud/hybrid question the on-site box should not promise.

## Re-review

**2026-09-01** (with DR-0182) — revisit the caps once the 3090 rig is measured; raise with capacity, not before.

## Encoded / verified

Migration `0098`; `ministry-meetings.js` (MEETING_SPACES / spaceCap / canBookSpace / space-aware load rules, 20 tests); `ministry-meetings-sync.js` + `BusMinistry.jsx` MeetingsPanel (room selector, main gated to admins, grounded copy). Lint + build clean; contrast/consistency/full suite green.
