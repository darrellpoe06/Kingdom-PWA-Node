# 2026-08-04 — Assistant rights (Christina's request) + access-systems review

**Requested by Christina** (via the shared channel): her assistant cannot see
what she sees in the Assistant section of the TLC portion of the app; she needs
a control on her end to grant assistant rights; the assistant must see
**everything in the Assistant tab** and **nothing on the other tabs** — plus a
review of the app "for understanding and systems data driven understanding then
possible opportunities and constraints."

Build record: **DR-0271** (migration `0130`, the `assistant-scope` isolation
leg, `office_records` sync, `TlcTeamAccess.jsx`, the focused assistant shell).
This note is the review half. Honest scope (DR-0239): the dimensions that ran
are SHOULD/ARE tracing, surface-says-truth, findings-as-work-queue, and
gate-the-class — all against the repo + migrations, data-driven. **Journey
walks and form-factor measurement on the live device did NOT run from this
sandbox** (no route to poetech.us; site-health is the outside witness) — those
are the on-device pass carried below. This is therefore a *systems review*, not
a claimed seven-dimension comprehensive.

## What the trace established (the understanding)

1. **Access is layered, and the layers disagree about who decides.** The
   database enforces roles via RLS (`instance_members.role` +
   `user_role_in_instance`), and that layer is strong: books walls (0082/0100/
   0108), viewer read-only overlay (0125), capability checklist (0126), and now
   the assistant scope overlay (0130). But the SHELL still derives most
   affordances from an email allowlist (`isFamilyEmail`) and a client-side tier
   switch — DR-0220 P3 (affordances from backend role) is the standing gap,
   dated 2026-08-25. `lib/instance-role.js` (0130's `my_default_instance_role`)
   is now the honest client source; the assistant shell is its first consumer.
2. **Roles without provisioning paths are decoration.** `assistant` existed for
   three weeks with no way to issue it — the exact class the 2026-07-30 access
   evaluation carried ("assistant grant table … or honest retirement",
   2026-08-06). DR-0271 closes the assistant half **two days ahead of its
   date**; the delegated-PM UI half (DR-0101) is still open on that line.
3. **Device-local stores are the recurring "she can't see what I see" cause.**
   The office workspace was localStorage; so are the assistant checkboxes
   (`use-assistant-access.js`), the tier preview, and several capture surfaces.
   Anything two people must see together needs a cloud table + RLS (the
   `office_records` pattern is now the reusable shape: per-record jsonb rows,
   slug = local id, seeds never upload, wholesale rows for wholesale state).
4. **The two-party handshake (DR-0187) is load-bearing and reusable.** Grant =
   token link + claim + owner confirm; it carried `assistant` through with zero
   new mechanism. Any future role (specialist grants, delegated PM) should ride
   it rather than invent one.
5. **The guards work.** Four house gates fired on this very delivery (feedback
   -area parser, monolith ratchet, consistency width-cap, legibility freshness)
   and each forced a real correction — including a 79-line extraction
   (`lib/tiers.js` + `components/TierSwitcher.jsx`) that leaves the monolith at
   5,325 lines, re-frozen. The machinery-over-memory posture is real.

## Opportunities (each is a work-queue item, not a musing)

- **Retire the email allowlist progressively (DR-0220 P3, 2026-08-25):**
  `isFamilyMember` has ~105 call sites; `useInstanceRole()` now exists as the
  drop-in server-derived source. Migrate gate-by-gate, tests pinning each.
- **One capability system.** `role_capabilities` (0114) and
  `member_capabilities` (0126) coexist; the assistant checkboxes are a third,
  device-local vocabulary. The DR-0271 carry (2026-08-24) should bind the four
  `ASSISTANT_GRANTABLE` boxes to 0126's table rather than mint another.
- **Reconcile the office referral list with `crm_leads`** (DR-0081 ONE-CRM;
  2026-08-24 carry): today they are honestly-separate (workspace vs. funnel),
  but outreach outcomes recorded in the workspace should eventually teach the
  CRM's attribution loop (the Ari path's training set).
- **A second office is now one config away** — the engine, UI, cloud sync, and
  role scoping are all office-agnostic; Moore Divahs (or any business) can get
  a scoped assistant with a config file + its own `office_id`.
- **The TLC door's Assistant tab for non-staff** now renders each visitor's own
  empty, isolated workspace. Correct by RLS, but a small UX opportunity: a
  "this is your office's workspace" explainer for a non-TLC visitor.

## Constraints (the walls that must hold)

- **PHI never enters this app** (DR-0003 ISO-1; TLC noPhiNote): the workspace
  holds referral SOURCES only. The assistant grant does not touch that wall.
- **Never `owner` by invite/claim/role-set** (DR-0220); owners untouchable;
  only owners touch admins — all preserved verbatim in 0130's re-declarations.
- **The books stay sealed** for assistant/child (0100 guard literals untouched;
  the live books-role-wall leg still runs 0082+0100 in order — never 0082 alone).
- **Restrictive overlays only narrow.** Both overlays (viewer, assistant) are
  RESTRICTIVE policies AND-ed onto permissive ones — adding one can never widen
  access; forgetting one on a future table is a build failure (Check E +
  assistant-scope-guard future-scan).
- **Reviewed in production, not parked** (corrected same day by Darrell): this
  is a Tier-B product feature — RELEASE-TIERS' Tier-C "identity" bullet means
  the app's front-door/mission identity, not user roles. It ships active
  through the lane on green (DR-0103/0247/0248/0254); the deterministic gates
  + the live isolation leg ARE the review, and the stewards review the live
  production push (DR-0104). PR #1193 proved it: merged on green, no human
  start.

## Carried (dated)

- On-device journey walk + form-factor pass of the grant flow and the assistant
  shell (Christina's phone + her assistant's device) — the his/her-hand step;
  paste-ready steps are in the PR body — `re-review: 2026-08-11`.
- crm_leads reconcile + capability-checkbox binding — `re-review: 2026-08-24`
  (DR-0271).
- Delegated-PM UI wiring (the other half of the 2026-08-06 evaluation line) —
  unchanged, still on 2026-08-06.
