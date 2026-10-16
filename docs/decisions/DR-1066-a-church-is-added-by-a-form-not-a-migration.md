---
id: DR-1066
title: A church is added by a form, not a migration — leadership, the church's face and its giving channels become rows; PoeTech is never the merchant
date: 2026-10-16
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, all]
grounds: [COMMUNITY-FIRST, VERIFICATION-DOCTRINE, DATA-ISOLATION, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-10-16 — Darrell, from a phone search: "The App a Bishop here in Los Angeles is using is called... the app we have is through push pay... investigate the opportunities and constraints of the system and see how we measure up and how we can compete for business... He's paying $200 a month for membership." Then "Yes!!!!" to building the first gap. Research-review docs/99-session-notes/2026-10-16-research-review-pushpay-the-bishops-app-how-we-measure-up-and-compete.md.
---

## Context

A Bishop in Los Angeles pays Pushpay about $200/month plus 2.9% + $0.30 per card gift, on a multi-year auto-renewing contract whose exit cancels every recurring gift. He wants what the Love Corner has. The research-review measured that the platform could not sell it to him: a second church could not be onboarded without an engineer writing a migration.

## What was measured

`join_church_instance` (0294:111-123) decided leadership from a VALUES list of four hardcoded addresses mapped to `slug = 'colg'`; the giving channels were COLG constants (`app/src/lib/giving.js:151-187`); the door map named only `['colg']` (`app/src/lib/app-doors.js:83`); seventeen migrations referenced `'colg'`. The data model has been multi-tenant since 0012 (instances, RLS, DR-0060); the onboarding never was. Pushpay's own weaknesses, from Capterra (4.2/5, 183 reviews; value 3.6/5), the BBB file and Donorbox's cancellation guide: lock-in, small-church price, recurring gifts hostage to the processor, a $150 data-export ticket.

## Impact

Unresolved, every prospective church is a bespoke engineering job and the mission sentence "generalizes from COLG's needs to other churches" (COMMUNITY-FIRST-MISSION) stays aspirational. Resolved, a steward adds a church from the Members tab in one call, its office publishes its own giving channels, and the Give panel never shows one church's channels on another's page. Reversible: the migration adds tables and functions and removes nothing; 0294's contract is re-asserted by its own smoke.

## Decision

1. **Leadership is rows.** `church_leaders` replaces the VALUES list; COLG's four addresses are seeded verbatim so every existing person's join answers as before. `join_church_instance` keeps 0294's exact signature and contract; only step 3a changed, and it now carries a total order (P35).
2. **The church's face and its published giving channels are rows the office writes** (`church_profiles`, `set_church_profile`): https-only by trigger, readable by members or, when the office says so, by anyone; writable by that church's owner/admin only.
3. **The steward's one call** (`provision_church_instance`): only an owner/admin of `poe-family` (`is_platform_steward`, through linked doors too); creates the instance, the leader row, the steward's oversight seat (0089's pattern) and the profile; idempotent on slug, and a second call adds a leader and changes nothing else.
4. **Whose channels the Give panel shows** is one pure decision (`resolveChurchGiving`): the office's rows for any church; COLG's slide constants only for COLG and only until it enters rows; otherwise an honest "not published yet" line — never a borrowed list.
5. **PoeTech is never the merchant of record for a church's giving.** The app links out; no payment data touches it (lib/giving.js, Commitment 5). The recommended rail for a church that wants recurring giving is its own Stripe nonprofit account, still link-out.
6. **Not decided:** the supported-tier price (Darrell's), the per-church installable door (a build step, stated on the steward's card as the remaining constraint), the year-end statement and the Stripe importer (the next two gaps, DR-1066's work queue in the research-review §7).

## Rationale

Because three of the four hardcoded places were database state, so the cure is one migration and a sibling of the sync pattern the church surfaces already use — and because Commitment 5's "no data lock-in, any church can leave with their data" is only true if the church's facts are the church's rows, not our constants.

## Verification

Proven on a fresh PostgreSQL 16 locally and in ci.yml (`church-onboarding`, required): 0297 applied twice, then 0294's own smoke (PASS — the either-door contract holds with the list gone) and 0297's smoke (PASS). On the live database the choir-claim leg of rls-isolation runs both after 0294. The smoke caught the first draft wiping channels when the office marked a profile public (the upsert coalesced the EXCLUDED default over the kept row); fixed, pinned by `nullLeavesAlone` in church-onboarding.test.js. The slug rule's first regex accepted a one-character slug; church-profile.test.js caught it, SQL and JS were corrected together. CI's NULL-safe-guard gate (the 0131 class) flagged the leader-role clamp, and reading for the class found the worse case the heuristic missed: `set_church_profile`'s owner/admin check was `user_role_in_instance(...) NOT IN (...)`, which is NULL for a non-member and never raises — a signed-in stranger would have written any church's profile through a SECURITY DEFINER function. The smoke was given the stranger case first (FAIL against the old function), both guards were coalesced, and it passes; `guardsNullSafe` pins the text. Gates: tenancy (overlays re-run), grant, replay-order, matrix, smoke-language, ui-standards (focus ring written literally per DR-1059), legibility health regenerated. `re-review: 2026-10-30` — the first real church provisioned through the form, with the Bishop's office entering its own channels and the Give panel observed on his phone.

## Links

DR-0060 (tenancy guard), DR-0089 (Moore Divahs provisioning pattern), DR-0136 (COLG giving channels), DR-0241 (viewer overlay), DR-0311 / DR-1043 (either door), DR-1053 (honest resolver), DR-1059 (the literal focus ring), COMMUNITY-FIRST-MISSION Commitment 5, the research-review `docs/99-session-notes/2026-10-16-research-review-pushpay-the-bishops-app-how-we-measure-up-and-compete.md`, migration `infra/supabase/migrations-auto/0297-a-church-is-added-by-a-form-not-a-migration.sql`, smoke `infra/supabase/tests/0297-church-onboarding-smoke.sql`.
