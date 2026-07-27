---
id: DR-0231
title: Group conversations without phone numbers — every role's chat lives in the app, contact info shared and remembered in-app
status: accepted
date: 2026-07-23
tier: B
declared_by: Darrell
supersedes: []
amends: []
principles: [DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), COMMUNITY-FIRST]
---

## The word (Darrell 2026-07-23, verbatim)

> "I have multiple groups of chats with different roles that I want PoeTech App
> to support so they dont need my phone number or any number however if they
> have any contact info to share or update it is done inside the PoeTech App
> and remembered in context etc. opportunities and constraints... comprehensive
> review of the current process and objectives of our intention to improve
> perpetually."

## Decision

The platform carries every group conversation (family, church, workers,
clients) IN-APP, keyed to the instance/role system — no phone number anywhere
in the flow, joining by in-app email invite + passwordless sign-in. Contact
info is a first-class in-app record the member updates themself, remembered
with history — never a text thread's scattershot.

## The comprehensive review (spec-conformance, receipts in the session note)

**ARE (strong):** the identity spine is ALREADY phone-free by construction —
instances + instance_members + roles, magic-link sign-in, invite_to_instance /
invite_to_church auto-join. Five instance-scoped message stores exist; the
1:1 rail (direct_messages + users_can_dm policy engine + realtime) is LIVE,
and a full person-to-person family_messages store (append-only, read receipts,
guardian oversight, realtime, sync built) is DORMANT awaiting only a UI.
Rosters (choir, bus, security, family, cohorts) already define the groups.

**GAPS (the build):**
1. **P1 — group threads:** a `group_messages` store (instance + roster-scoped,
   RLS via the existing predicates, realtime) + a group panel reusing the
   DirectMessages pattern; awaken the dormant family-messaging UI.
2. **P2 — member contact cards:** a `member_contacts` table — one
   self-writable row per member per instance (phone/email/address, visibility
   member-chooses: instance-shared or stewards-only), updated in-app,
   remembered with updated_at; the directory reads roster + cards.
3. **P3 — web push:** absent today (sw.js has no push handler); VAPID keys in
   the Governor's custody, per-member OPT-IN (DATA-AS-EMPOWERMENT), so a group
   message reaches a member without any number.
4. **P4 — the migration:** each roster surface grows "invite by email"; the
   phone-number group chats retire group by group.

**Constraints (stated plainly):** members must sign in once (email link — the
APK apps lower this friction now); until P3, delivery is realtime-while-open
only; iOS push requires the installed app + iOS 16.4+; minor/guardian rules
extend to every group surface (users_can_dm already models it); an SMS bridge
is a NON-goal — sovereignty is the point (the voice-worker stays
voicemail-only).

~~`re-review: 2026-07-26` — P1 shipped or dated.~~ **CLOSED 2026-07-27** by the
comprehensive messaging review (Darrell's directive, with live screenshots;
`docs/99-session-notes/2026-07-27-messaging-comprehensive-review.md`): **P1
CONFIRMED shipped** (#1035 backend, #1057 mounted surface + DM E2EE; live at
`?view=message` in the Governor's screenshots). P2 (contact cards) dated
2026-08-06, P3 (web push) dated 2026-08-02, P4 rides P3; two live defects found
(owner's empty DM roster; dual instance-resolver split) dated 2026-07-29 in the
review's Increment 1. `re-review: 2026-08-10` — increments 1-4 shipped or
re-dated with why.
