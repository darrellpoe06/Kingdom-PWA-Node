# Church → Engagement — Message a member (1:1)

**Date:** 2026-09-09 · **Branch:** `claude/property-photos-project-docs-cdsexr` · **Rules:** DR-0181 (amended), DR-0061 reality-trace, DR-0076, DR-0100

**Trigger.** Darrell, signed in on build b7bf3fa at Church → Engagement, two screenshots: *"why can't I send a message to a user?!"*

**Reality-trace (DR-0061), stated before code.**
- Real data: `direct_messages` (0096) under RLS + `users_can_dm` (a leader may message anyone in the instance; anyone may message a leader; roster ↔ roster); contacts from `list_dm_contacts` (0118, mirrors `users_can_dm`) and `list_dm_invited` (0124); threads via `subscribeDirectMessages`; sends via `sendDirectMessage`.
- End to end: the same panel and loaders already run live in the app-wide Messages view, the bus ministry and the choir. Darrell is owner of the church instance, so his contact list is every member of the church.
- The surface he uses: Church → Engagement — which mounted only the family thread (broadcast). There was no way to pick a person there. That gap was the work.

**Fix.** `Engagement.jsx`: a `DirectPanel` section ("Message a member") loading `publishDmPublicKey` / `loadDmContacts` / `loadDmInvited` on sign-in and mounting `DirectMessages` with the server's roster; honest empty state when the server returns no one; the broadcast tab renamed "Family thread" with one sentence pointing to the private door. No new table, no new policy — the surface over data that already existed.

**Proof.**
- `engagement-direct-render.test.jsx` (3): tab present; server-returned contact startable; tap opens a private thread with composer; family thread names the private door; source pin — roster is `loadDmContacts()`, never hand-typed. Existing Engagement render test updated for the renamed tab.
- Guards: ui-standards, consistency, contrast, tab-overflow, fab-overlap, module-boundary, monolith-budget all OK; eslint clean.
- Real Chromium at phone width (signed out, stub backend): the three-tab strip and the panel's sign-in note render; screenshots `20-engagement-tabs.png`, `21-engagement-direct.png`.

**Honest limit (DR-0100).** The sandbox cannot sign in to the live church, so the live send was not exercised here; it is the same `sendDirectMessage` path the bus ministry and Messages view use daily. If a name is missing from the list, the server's `users_can_dm` is the reason (the person is not a member of the church instance yet), and a leader adds them.
