# Comprehensive Role / Identity / Permission Review — SHOULD vs ARE

**Date:** 2026-07-21
**Requested by:** Darrell — "Comprehensive role review opportunities and constraints also review the Ways and documentation to implement the plan after researching best etc."
**Method:** SPEC-CONFORMANCE-REVIEW (DR-0219) + Reality-Trace (DR-0061). Two independent evidence traces — the DOCUMENTED role model (the Ways/docs = the SHOULD) and the IMPLEMENTED role model (the real code + RLS = the ARE) — synthesized here with `file:line` receipts (DR-0076). External RBAC / account-linking best practice reviewed (Supabase RLS + SECURITY-DEFINER RPC claim pattern) and folded into the plan.

This is a review, not a rewrite. It states what the role model SHOULD do from the Ways, traces what it ACTUALLY does, names every gap, and ends in one of two states per gap (DR-0075): an improvement shipped this session, or a one-line why + a `re-review:` date. It is the map for the phased implementation that follows it.

---

## 1. The model in one picture (the ARE, verified)

There are **two enforcement layers**, and only one is authoritative:

- **Authoritative gate = Supabase RLS keyed on `instance_members.role`.** The tenant is the `instance`; membership is `instance_members(instance_id, user_id, role)`; the universal predicate is `user_in_instance(instance_id)` (`infra/supabase/schema-v2.1-infra.sql:124-133`) and the role workhorse is `user_role_in_instance(instance_id)` (`schema-v2.1-infra.sql:135-143`). Every module's policies compare that role to `IN ('owner','admin',...)`. This is the real wall (DR-0060 tenancy guard makes it build-failing).
- **Advisory gate = client-side email allowlists.** The app shell derives `isFamilyMember` / `isChurchStaff` / `isGovernor` from hardcoded email sets (`poe-financial-mvp-v28.jsx:601-637`, `:1323-1329`), NOT from the backend role. This governs which menus/affordances render. RLS still protects the data underneath, but the two layers can drift.

**The real role enum** (the `instance_members.role` CHECK, widened over time):
`owner, admin, member, viewer, specialist` (`schema-v2.1-infra.sql:224-226`) + `child, successor` (`0082-successor-role-and-books-rls.sql:57-58`) + `assistant` (`0100-assistant-role-and-books-rls.sql:49-50`). Books-tables RLS is role-aware and CI-guarded (`scripts/assistant-wall-guard.mjs`): `child` walled out of books read; `child`+`successor` out of write; `assistant` out of the core books entirely.

**How a role is assigned (data-driven for family, hardcoded for church):**
- Non-church: `join_default_instance` (`0081-invite-to-instance-data-driven-access.sql:90-176`) — already-member → founder-allowlist → `poe-family` as `member` → pending `instance_invites` match → invited role → else a solo `u-<uuid>` instance as `owner`.
- Church: `join_church_instance` (`0014-church-invite-onboarding.sql:66-138`) — a **hardcoded leader email allowlist** assigns owner/admin on the `colg` instance, else accepts a pending church invite.
- Invites never grant `owner`: `invite_to_church` / `invite_to_instance` coerce to `admin|member|viewer` (`0014:37-39`, `0081:63-70`).
- **The two-party claim handshake IS shipped** (DR-0187): `invite_to_instance` mints a one-time `claim_token`; `claim_invite(token)` records a pending claim (grants nothing); `confirm_invite(id)` is the guardian re-confirm that finally inserts the member (`0104-token-invite-guardian-reconfirm.sql`). The bare-email self-claim branch was removed.

**Domain sub-roles:**
- **Choir** — `choir_members.choir_role CHECK IN ('director','assistant','member','musician','sound','media','tech')` (`0011-choir-module.sql:43`). These are **descriptive roster labels — they gate nothing**; all choir write/edit RLS keys off `user_role_in_instance IN ('owner','admin')`. `user_id` is **nullable** — `NULL = roster entry for a member without an app account yet` (`0011:36`).
- **Church** — **no** pastor/deacon/elder/ministry-leader enforced role. The only church "role" field is free-text, nullable, ungated `ministry_signups.role` (`schema-v2.7-church.sql:157`). Church authority is the generic owner/admin/member on `colg`.
- **Family** — `family_member_profiles.minor_tier CHECK ('under13','teen','adult')` + `guardian_user_id` + generated `coppa_protected` (`0057-family-messaging-and-minor-tiers.sql:47-63`); guardian-write-only. `provision_child_member` is guardian-only (`0057:172-223`).

**Reviewer mode** (DR-0104) — `reviewer-mode.jsx`, flag `poe-reviewer-mode`, strictly narrows privilege (never grants); wired to force every privilege predicate false and data to `EMPTY_WORLD` while on (`poe-financial-mvp-v28.jsx:1323-1876`).

---

## 2. SHOULD vs ARE — the gaps

### GAP 1 — No self-serve choir-roster account claim *(the "asap" item; CLOSING this session, Phase 1)*
**SHOULD:** DR-0187 says binding a person to an account is a steward-vouched one-time claim, no external channel required; the choir migration itself names "linking real user_ids into the roster" as the intended follow-up (`0011:12-14`).
**ARE:** No `claim_choir_member` RPC, no email-match, no "which member am I" read exist anywhere in code. A `choir_members` row with `user_id = NULL` is **inert** — it grants zero access; `user_in_choir` never matches it. The only writer of `choir_members.user_id` is the director's `addMember`, which has no UI to look up a user's UUID.
**Consequence:** a rostered singer cannot see the Choir surface or log their own absence until a director manually stamps a raw `auth.users.id`. This is the single largest onboarding gap and both traces flag it.
**CLOSE:** Phase 1 below — ship the director-issued one-time-code claim (DR-0187 leg 1 applied to the choir), reusing the proven 0104 handshake shape.

### GAP 2 — Roster invite ≠ roster link
**ARE:** Inviting a singer via `invite_to_church` grants an `instance_members` role (so choir read passes through the owner/admin or membership branch) but never populates their `choir_members.user_id`. Their descriptive `choir_role`/section/absences stay disconnected from their real account — two unjoined tracks.
**CLOSE:** Phase 1's `claim_choir_member` joins the tracks. `re-review:` covered by Phase 1 shipping.

### GAP 3 — Church domain has no real role model
**SHOULD:** COMMUNITY-FIRST + directory docs name "deacon / pastor / member / public / guest" role-scoped visibility.
**ARE:** None of these are enforced roles — only generic owner/admin/member plus a free-text ungated `ministry_signups.role`.
**CLOSE:** Phase 5 (design). **why deferred:** a real church role model is a Tier-C, COLG-facing identity change that needs Governor + Bishop-Gwin design input; rushing it unverified violates DR-0076. **re-review: 2026-09-01.**

### GAP 4 — Church leadership hardcoded by email
**SHOULD:** SOVEREIGN-IDENTITY + the data-driven-access principle that `0081` already applied to family instances.
**ARE:** `join_church_instance` (`0014:98-104`) and `CHURCH_STAFF_EMAILS` (`poe-financial-mvp-v28.jsx:619-623`) bake specific addresses into SQL + JS. A new church leader requires a code change + deploy — the exact friction `0081` removed for family, not back-ported to church.
**CLOSE:** Phase 2 (back-port data-driven leadership to church). **why deferred past this session:** Tier-C COLG-facing identity path; needs a soak + Governor review, and it must not regress the founder bootstrap that keeps `tenancy-guard` green. **re-review: 2026-08-11.**

### GAP 5 — App-layer gating is email-identity, not backend role
**SHOULD:** FAMILY-ACCESS-PROCESS itself flags deriving the sensitive view from `instance_members.role` as "the next increment" (`FAMILY-ACCESS-PROCESS.md:60`).
**ARE:** `isFamilyMember`/`isGovernor`/`isChurchStaff` come from client-side email allowlists; only the AdminConsole self-check reads the true backend role (`AdminConsole.jsx:138-148`). UI privilege and DB role can drift (RLS still protects data).
**CLOSE:** Phase 3 (derive affordances from `user_role_in_instance`). **why deferred:** a broad shell refactor touching every gated surface; Tier B/C, needs the live two-identity review (DR-0104). **re-review: 2026-08-25.**

### GAP 6 — Two documented role ladders contradict each other *(CLOSING this session, Phase 4)*
**SHOULD (conflict):** `ROLES-MEMBERSHIP-MULTITENANCY-ADR` + ACCESS use `owner/admin/member/viewer/specialist(+child)`; the older `IDENTITY-ROLES-AUDIT` uses `Owner/Editor/Contributor/Viewer/Specialist`. `editor`/`contributor` do not exist in the schema.
**ARE:** The code is unambiguous — the shipped enum is `owner/admin/member/viewer/specialist/child/successor/assistant`. The `editor`/`contributor` ladder is superseded/aspirational.
**CLOSE:** Phase 4 — reconcile the docs to the shipped enum (Tier A doc fix), this session.

### GAP 7 — `role_scopes` / `user_role_in_scope` + the capability layer are dead/unbuilt
**ARE:** `role_scopes` / `user_role_in_scope` are defined (`schema-v2.1-infra.sql:432-482`) but referenced by no app code or module RLS. The **capability layer** (`member_has_capability` + `role_capabilities`) is a design sketch only (`ROLES-MEMBERSHIP-MULTITENANCY-ADR.md:99-118`) — not a migration. The per-entity/time-bounded scoping and the "checkbox of what a role can access" the design implies are unbuilt.
**CLOSE:** Phase 4 doc note marks it explicitly deferred; the Dev/Ops Specialist need (§2b) is now the concrete driver. **why:** wiring the capability checkboxes to anything sensitive (add parishioners, troubleshoot accounts) is a Tier-C PII/provisioning change; shipping the primitive unwired would be a gate that gates nothing (DR-0076 anti-theater). **re-review: 2026-09-15** (build with the Dev/Ops Specialist, Phase 6).

---

## 2b. The Dev/Ops Specialist role — YES, it is in the Ways (answering Darrell 2026-07-21)

Darrell: *"Dev/Ops specialists can add people to their account and troubleshoot for the Love Corner App when parishioners ask questions… however they also have a check box of what they have access to — isn't this in the Ways and documentation?"*

**Yes — precisely, on two documented primitives:**

1. **The `specialist` role itself** — "A 'Specialist' is just an Editor with a tight scope… There are no special role types — just roles + scope + duration" (`IDENTITY-ROLES-AUDIT.md:64`); it appears in the per-entity permissions matrix (`:34,38,56`). And it is **shipped** in the real enum — `owner/admin/member/viewer/specialist/…` (`schema-v2.1-infra.sql:224-226`). So the ROLE the Dev/Ops Specialist maps to already exists in the database.

2. **The "checkbox of what they have access to" = the capability layer.** The Ways define exactly this: `member_has_capability(instance, capability)` backed by a seeded `role_capabilities(role, capability)` lookup — "a named permission a role carries… Adding the `manager` role = inserting its capability rows, not rewriting policies" (`ROLES-MEMBERSHIP-MULTITENANCY-ADR.md:99-118`). A role carrying a set of named capabilities IS the checkbox model. The sibling `manager` role — "sees members' *progress*, not their private personal data" (`:89`) — is the same pattern for a cohort lead.

**The honest ARE:** the `specialist` **role** ships, but the **capability-checkbox layer** (`member_has_capability` / `role_capabilities` / `role_scopes`) is **dead/unbuilt code today** (GAP 7). So the Dev/Ops Specialist as Darrell describes it — a COLG church tech-support person who (a) **provisions parishioners** (`member.provision`), (b) **troubleshoots on their behalf** (a scoped `support.review`, most safely realized on top of the existing strictly-narrowing reviewer-mode, DR-0104, so support NEVER silently reads a parishioner's private data), and (c) **carries an explicit checkbox set** of exactly those capabilities and nothing more — is **documented and half-built: the role exists, the checkboxes do not yet.**

**Why it is not shipped in this PR:** "add parishioners" touches provisioning + PII and "troubleshoot accounts" touches parishioner data — a Tier-C isolation change that must earn the live two-identity no-leak probe + Governor review (constraints above; DR-0076). Shipping the capability primitive unwired would be anti-theater. It is therefore **Phase 6**, dated, with the concrete capability map recorded here so the build is designed, not improvised.

**Dev/Ops Specialist capability map (the checkboxes), for Phase 6:**

| Capability (checkbox) | What it grants | Bright line |
|---|---|---|
| `member.provision` | Add/invite a parishioner into the COLG instance | Never grants `owner`; role capped at member/viewer (FAMILY-ACCESS-PROCESS:52) |
| `member.claim.issue` | Issue roster/claim codes (the choir pattern, generalized) | One-time, expiring; steward-vouched (DR-0187) |
| `support.review` | Enter a scoped support view to reproduce a parishioner's issue | On reviewer-mode rails (DR-0104) — strictly narrows, writes suppressed; every entry audited (CAGE) |
| `content.help.edit` | Edit help/FAQ/troubleshooting copy | No data access; content only |

Each is a row in `role_capabilities`; the Dev/Ops Specialist is a `specialist` member whose checkbox set is exactly these rows — the "roles + scope + duration" model the Ways already declare.

---

## 3. Opportunities & Constraints

**Opportunities (net-positive, in reach):**
1. **Close the choir onboarding loop end-to-end** — the highest-value, lowest-risk win; the pattern already exists (0104), the stakes are low (a linked roster row grants *read + own-absence*, never edit authority — `choir_role` doesn't gate), so a single-party director-issued code is proportionate and safe. **Shipping this session.**
2. **Reuse, don't reinvent** — the claim/confirm handshake, the `user_in_*` SECURITY-DEFINER helpers, and the confusable-free-code idea are all established; the choir claim is a faithful application, not new architecture.
3. **Doc truth-up** — reconciling the ladders and marking dead scope removes drift that would mislead the next builder (cheap, Tier A).

**Constraints (bright lines that shape every phase):**
- **RLS is the real gate; the UI layer is advisory** — any role change must be proven at the RLS/RPC layer with a live two-identity no-leak probe (DR-0076, ROLES-MEMBERSHIP ADR:294-302), never on the agent's word.
- **Never `owner` by invite/claim; claiming links identity, not authority** — a claimed `director` roster row must NOT elevate `instance_members.role`. Enforced by keeping the claim writing only `choir_members.user_id`.
- **No external channel ever required** (DR-0187) — the claim code is delivered human-to-human by the steward, no email/SMS dependency; COMMUNITY-FIRST (elderly, tech-novice) ⇒ the code must be short and confusable-free to read aloud.
- **Tier-C for the identity/role model** — church-facing leadership + the shell-gating refactor soak with Governor review; "additive/NAS-only does not downgrade it." That is why Phases 2/3/5 are dated re-reviews, not this-session ships.
- **SECURITY DEFINER bypasses RLS** (confirmed best practice) — so the guard logic lives *inside* each claim function (auth check, unclaimed check, one-per-instance check, expiry, one-time consume), and EXECUTE is granted only to `authenticated`.

---

## 4. The phased plan

| Phase | What | Tier | State |
|---|---|---|---|
| **1** | **Choir roster self-claim** — `mint_choir_claim_code` (owner/admin issues one-time code) + `claim_choir_member` (member redeems → links `user_id`) + `my_choir_membership` (read own row) + reachable claim surface + "you're linked as X" personalization + live isolation test | A→B (sovereign RPC + additive surface; proven-to-catch tests) | **Shipping this session** |
| **2** | Back-port data-driven leadership to the church path (remove the hardcoded leader email allowlist; make it invite-driven like `0081`) | C | `re-review: 2026-08-11` |
| **3a** | **In-app access-role controls** — `set_member_role` + `list_instance_members` (migration `0111`), wired into the Choir Roster + Admin → Role & stewards, guarded + isolation-tested. **SHIPPED 2026-07-21 (DR-0221)** in response to Darrell's "control access roles here… Inside the Love Corner App also." | C | **Shipped (DR-0221)** |
| **3b** | Derive app-shell affordances (`isFamilyMember`/`isChurchStaff`) from `user_role_in_instance`, not email allowlists | B/C | `re-review: 2026-08-25` |
| **4** | Doc reconciliation — fold the `editor/contributor` ladder into the shipped enum; document `choir_role` as descriptive-by-design; mark `role_scopes` deferred | A | **Shipping this session** |
| **5** | Real church domain role model (pastor/deacon/ministry-leader as enforced or explicit-descriptive) | C | `re-review: 2026-09-01` |
| **6** | **The Dev/Ops Specialist** (§2b) — build the capability-checkbox layer (`member_has_capability` + `role_capabilities`) and the `specialist` capability map (`member.provision`, `member.claim.issue`, `support.review` on reviewer-mode rails, `content.help.edit`), so a COLG tech-support person adds parishioners + troubleshoots with an explicit, audited, checkbox-bounded scope | C | `re-review: 2026-09-15` |

Recorded as **DR-0220**. Phase 1 + Phase 4 ship now; Phases 2/3/5/6 are dated re-reviews (DR-0075), each a Tier-C/B identity change that earns its soak rather than being rushed unverified. Phase 6 answers Darrell's Dev/Ops Specialist question — the role is documented + half-built (role shipped, checkboxes unbuilt), and is now designed for its Governor-reviewed build.
