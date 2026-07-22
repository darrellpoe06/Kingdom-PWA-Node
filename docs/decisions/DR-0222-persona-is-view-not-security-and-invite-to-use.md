---
id: DR-0222
title: The persona picker is a shared-device VIEW filter, not per-person security — make the UI honest, and add an in-Admin invite so people can start using the app
status: accepted
date: 2026-07-22
tier: B
declared_by: Darrell
supersedes: []
amends: []
principles: [ROLE-CAPABILITY-MODEL, VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT, DR-0187, DR-0060, PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell 2026-07-22, from the live app: "How does the roles work, does everyone see their name at the top?", "can I see Christina's and my family, are they different?", "comprehensive review of the process… opportunities and constraints", and "I want people using the apps." Full trace + gaps in `docs/99-session-notes/2026-07-22-persona-identity-view-review.md`.

The trace found three independent identity layers (auth account / device-local persona / DB role). The "Who's using this device?" persona picker is a **client-side view filter**, but its copy claimed "the practice stays private to its owner" — a privacy guarantee the data layer does **not** provide (the `poe-family` instance has no per-person RLS; all family accounts can read all family rows; the practice is deliberately `visibleTo` Darrell).

## Decision

1. **The persona picker is a shared-device VIEW convenience, not security — and the UI now says so.** The overclaim ("stays private to its owner") is replaced with honest copy: it focuses the screen per person on a shared device; everyone in the family space shares the same underlying data; real access is the DB role in Admin → Role & stewards. Truth-in-UI (DR-0076): a surface must not claim a boundary it doesn't enforce.

2. **Shared family visibility is intentional, not a bug.** A Family OS where spouses co-manage money wants shared visibility; the founder-allowlist seeds everyone as `member` of one instance by design. Real per-person privacy (e.g. Christina's practice private from Darrell) is a **dated Tier-C option** (re-review 2026-09-15), not assumed — TLC's actual PHI already lives in the ISO-1 encrypted tables (DR-0003), separate from the family-books "practice entity," and tearing out shared visibility is a Governor bright-line.

3. **"People using the apps" — invite from inside Admin.** The Admin → Role & stewards panel gains an invite control (`inviteToSpace`, member-roles.js): church → access on next sign-in (`invite_to_church`); family/other → a one-time claim link + a confirm step (DR-0187 two-party, reusing `family-invite.js`). Owner/admin-gated; never grants owner. Pairs with `0113` (the founder is now owner, so he can both invite and manage).

## Consequences

The persona/identity model is now truthful and the Governor can add people to a space and manage their roles entirely in-app. The real-privacy architecture and the dynamic-persona/data-driven-leadership work remain dated re-reviews (this DR + DR-0220). No isolation change shipped here (tenancy-guard green); the invite reuses proven RPCs.
