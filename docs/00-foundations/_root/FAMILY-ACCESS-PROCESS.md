# FAMILY ACCESS PROCESS — how people (and their families) get into PoeTech

**Layer 3 foundation. Added 2026-07-05, declared by Darrell.**

> "Adding him currently here doesn't work — review it and create a comprehensive intuitive system for addressing this issue and make it work. I want a comprehensive report on the family access process for allowing people and their families to use the systems."

This is the comprehensive report on how family/instance access works, why the old way "didn't work" as a system, and the intuitive in-app system that replaces it. It is grounded in a line-by-line review of the real access code (DR-0076), not memory. Companion to `ACCESS-AND-ONBOARDING-MODEL.md` (the whole-app map); this one is the deep dive on *granting family access*.

---

## Part 1 — The old way, and why it wasn't a system

Before this change, adding a family member required **two hand-edits to code + a deploy**:

1. **A SQL migration** re-replacing `join_default_instance()` to add the person's email to a hardcoded allowlist (`infra/supabase/migrations-auto/0080-…`, lines 63–68).
2. **A shell constant** — adding the email to `FAMILY_EMAIL_PROFILES` in `app/src/poe-financial-mvp-v28.jsx` (lines 955–963), enforced as a code invariant by `family-allowlist-sync.test.js`.

Only a developer editing the repo could do it, and every new person meant another code change and a production deploy. That is a developer task, not a system — exactly the friction Darrell named. It also produced the "in but not really" failure: if only one of the two layers was edited, a person was in the family instance server-side but treated as an outsider client-side (or vice-versa).

**What already worked (and pointed the way):** the **Church module already does the right thing.** `invite_to_church(email, role)` (migration 0014) lets a church owner/admin invite someone by email; `join_church_instance()` **auto-accepts that invite on the invitee's next sign-in**, backed by the real `instance_invites` table (email + role + 14-day expiry). The Choir roster panel (`Choir.jsx`) is the exact UX — "Invite a member… they'll get access on their next sign-in." The family path simply never got this; `join_default_instance()` only checked the hardcoded allowlist and never looked at invites.

**So the gap was narrow:** generalize the proven church invite mechanism to the family. That is what shipped.

---

## Part 2 — The intuitive system (what now works)

Granting family access is now **data-driven — no code, no deploy:**

1. **A governor opens Admin → Access & Usage → "Invites & access"** and uses the new **"Invite people to the family"** panel: type one email or a whole family (commas / new lines), pick a role (member / admin / viewer — never owner), and Send.
2. That calls **`invite_to_instance(email, role)`** — a SECURITY DEFINER RPC (migration 0081) generalized from `invite_to_church`: it verifies the caller is owner/admin of their (non-church) instance and creates a real `instance_invites` row. One live invite per email; no client can insert directly (the RPC is the only path).
3. **The invitee signs in** (Google / email / QR). **`join_default_instance()` now consumes the pending invite** — it accepts it and joins them to the family instance with the invited role, *before* it would otherwise hand them a solo space. Their "no space yet" becomes a real family membership by itself.
4. **"And their family"** — the panel accepts many emails at once and issues one invite each, so a person and their household are invited in a single action.

**Nothing changes access on its own.** The governor deliberately clicks Send (a steward action); the person becomes a member only when *they* accept by signing in. This preserves the surface's long-standing posture.

**Ordering (the subtle correctness point):** the invite check sits *after* the "already a member" guard and the founder allowlist, but *before* the solo-space branch — otherwise an invited user who had already self-provisioned would be shadowed by their own empty instance.

### Files
- `infra/supabase/migrations-auto/0081-invite-to-instance-data-driven-access.sql` — `invite_to_instance` RPC + invite-consuming `join_default_instance`.
- `app/src/lib/family-invite.js` — client wrapper (`inviteToInstance`, `inviteFamily`, `parseInviteEmails`).
- `app/src/components/FamilyInvitePanel.jsx` — the governor grant UI, on the "Invites & access" tab.
- Tests: `family-invite.test.js`, `family-invite-panel-render.test.js`, and the existing `tenancy-guard` / `family-allowlist-sync` still green (the security gate is intact).

---

## Part 3 — The security model (unchanged where it matters)

- **The founder allowlist stays — as bootstrap only.** Darrell, Christina, and Darrell Jr remain hardcoded so the founding family always resolves to `poe-family` even with an empty invite table. Everyone else now comes through **data** (invites), not code.
- **RLS is still the real wall.** A person only ever sees the instance(s) they're a member of; `user_in_instance()` gates every instance-scoped table. An invite grants membership in one instance — nothing more.
- **The tenancy guard still passes.** `scripts/tenancy-guard.mjs → checkProvisioning` verifies the allowlist gate sits before the `poe-family` grant; 0081 preserves that structure, so the data-isolation gate is intact.
- **Never 'owner' by invite.** The RPC caps invited roles at admin/member/viewer.

---

## Part 4 — Known boundary + the next increment (stated honestly)

One deliberate boundary remains, and it is intentional, not an oversight:

- **The most sensitive client gate — the family bank/Gmail PII view on the public host — is still keyed to the founder emails** (`FAMILY_EMAIL_PROFILES` / `isImportedAllowed` in the shell), not to invite-based membership. That gate exists because of a real 2026-06-14 incident (a non-family visitor saw family data). **An invited member gets family *membership* and the family's shared data via RLS on the trusted (Tailscale-internal) app, but the public-host PII view stays locked to the founders until we deliberately, and with review, derive that gate from real `instance_members` role instead of the email map.** That decoupling is the next increment; it is security-sensitive and gets its own reviewed change, not a rushed one.
- **Household as a first-class object** (invite that seeds a spouse + minor children in one linked unit, with the guardian/minor tiers from migration 0057) is a future enhancement; today "their family" means one invite per person, sent together.

---

## Part 5 — For the specific ask: Darrell Jr

His account already existed (`darrellpoejr@gmail.com`, "no space yet"). He was unblocked immediately via the founder allowlist (migration 0080, merged in PR #612) — he joins the family on his next sign-in. Going forward, anyone else is added through the in-app invite panel above, no code.

---

*Reviewed against the real code (migrations 0012/0014/0080/0081, the shell constants, the tenancy guard). Where a boundary remains (the PII gate, household objects), this says so plainly rather than implying completeness. The app is the primary artifact; the invite panel is where this now lives.*
