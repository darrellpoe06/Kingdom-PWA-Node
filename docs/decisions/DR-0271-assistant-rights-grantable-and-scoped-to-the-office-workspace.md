---
id: DR-0271
title: Assistant rights are grantable in-app and scoped to the office workspace
date: 2026-08-04
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [tlc, poetech]
---

**Declared by Christina 2026-08-04:** *"My assistant is unable to see what I see in the assistant section of the TLC portion of the Poe Tech app... I will need something on my end that I can use to give this person assistant rights... I don't want them to be able to see everything [on] all of the other tabs, but I do want them to see everything in the assistant tab right now."*

**Reality-trace found two causes.** (1) The `assistant` role existed in `instance_members` (0100) with **no provisioning path** — `instance_invites`' CHECK, `invite_to_instance`, and `set_member_role` all clamped to admin/member/viewer (the 2026-08-06 carried item from the 2026-07-30 access evaluation; the 1099-assistant role itself had **no DR until this one**). (2) The Assistant workspace data was **device-local localStorage** — the assistant would see an empty workspace even with access.

**Decided + built (migration `0130`, one delivery):**

1. **`assistant` is issuable** through the existing DR-0187 two-party handshake (invite link → claim → owner confirm) and `set_member_role`; never `owner` by any path. **`remove_instance_member`** is the guarded revoke half (owner/admin; never an owner; only an owner removes an admin; no self-removal; audit-logged).
2. **The scope is structural, not cosmetic:** `apply_assistant_scope_overlay()` puts a RESTRICTIVE deny (all four verbs) for role `assistant` on **every** RLS-enabled instance-scoped table except `office_records` and the six 0125 participation tables (DMs/feedback/settings/telemetry). Without it, an assistant inside the family instance would read every membership-gated table (e.g. `inquiries`) — the 0082-child-gap class. Future instance-scoped tables must re-run the overlay; `scripts/assistant-scope-guard.mjs` fails the build when one forgets (the Check-E pattern), and `assistant-scope-noleak.test.js` proves the guard catches hollowing, allowlist-smuggling, and owner-minting.
3. **`office_records`** is the shared office workspace (orgs/posts/ideas one jsonb row each; the schedule as one wholesale row) — read/write for owner/admin/member/**assistant**; seeds never upload (DR-0061). The office-assistant store syncs to it (`modules/office-assistant/cloud.js`), so Christina and her assistant see the SAME records live. It is a **workspace table, not a second CRM funnel** (DR-0081/DR-0235 hold: lead capture stays on `crm_leads`).
4. **The client derives assistant affordances from the DATABASE role** (`my_default_instance_role()`, `lib/instance-role.js`) — never an email allowlist (advances DR-0220 P3). An assistant account gets a focused shell (Assistant + Messages + About); the TLC door's hardcoded `isGovernor` is retired for the role-derived gate. **Christina's control** is the Team access tab inside the Assistant workspace (`TlcTeamAccess.jsx`); she (both emails) is promoted to poe-family **admin** (the 0113 precedent — the control must work where she administers; Darrell stays sole owner).

**Verification:** static guard + noleak tests in the required `app — lint + vitest` check; live adversarial proof is the new `assistant-scope` leg in `rls-isolation.yml` (`tests/0130-assistant-scope-smoke.sql`: assistant works the workspace, member sees the assistant's rows, books + inquiries read ZERO rows for the assistant, invite carries the role, revoke works). The 0100 books wall is untouched (its guard literals verbatim).

**Correction (2026-08-04, same day, declared by Darrell — "there is not tier c... it is reviewed in production"):** this DR first shipped labeled Tier C with a "hold-before-merge" sentence. Both were wrong per the Ways: RELEASE-TIERS' Tier-C "identity" bullet means the app's front-door/mission identity, not a user-role feature — this is a **Tier-B product feature riding deterministic gates**; and review happens **in production** (DR-0104 stewards' live pass) after the lane lands work on green by itself (DR-0103/0247/0248/0254) — the gates are the review, the `hold` label exists as the Governor's brake, never as a scheduled stop. Tier front-matter corrected C→B; the merged PR (#1193) proved the posture: gates green → auto-merge → live, no human start.

**Carried (dated):** reconcile the office referral working list with the `crm_leads` backbone, and bind the four `ASSISTANT_GRANTABLE` capability checkboxes (`relationships.js`) to per-capability RLS — the role-grant here is the coarse "everything in the Assistant tab **right now**" Christina asked for; per-surface checkboxes are the finer slice — `re-review: 2026-08-24`. The Relationships panel note now states honestly which half is device-local planning config.

grounds: VERIFICATION-DOCTRINE, REALITY-TRACE, DRIVE-DONT-DELEGATE, TLC-FIREWALL, WAYS-REVIEW, MACHINERY-OVER-MEMORY
