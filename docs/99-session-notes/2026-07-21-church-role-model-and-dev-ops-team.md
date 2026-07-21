# Church role model — comprehensive review + the Dev/Ops Team (view-only tester)

**Date:** 2026-07-21 · **Declared by:** Darrell ("comprehensive role review, opportunities and constraints, review the Ways and documentation to implement the plan after researching best") · **Layer 4 working artifact.**

Darrell wants to add a longtime parishioner to a church **dev/ops team as a tester only** for the Love Corner (COLG) app. This note is the researched role-model review that grounds the build shipped the same session.

## 1. The current role model (verified, file:line)

**Two independent layers — never conflate them:**

- **Client display/nav gate** — `poe-financial-mvp-v28.jsx:1320-1326`: `isFamilyMember` / `isChurchStaff` (= family **OR** `CHURCH_STAFF_EMAILS`, currently just `bg@thechurchofthelivinggod.com`) / `isStudyCircle`. This only decides what **tabs/controls render**; it is NOT the data authority.
- **Server RLS role** — `instance_members.role ∈ (owner, admin, member, viewer, specialist)` (`schema-v2.1-infra.sql:223-226`). The authority. Helpers `user_in_instance` / `user_role_in_instance` (`schema-v2.1-infra.sql:124-143`), both `SECURITY DEFINER SET search_path = public, auth`.

**Who auto-becomes what (COLG):** `join_church_instance` (`0014-church-invite-onboarding.sql:98-104`) — `darrellpoe06 → owner`, `mrspoe06 → admin`, `christina@tlctherapysolutions.com → admin`, `bg@… → admin`; everyone else → NULL ("ask to be added"). (This is why Christina's refresh restored full access — she auto-joins admin.)

**Granting a specific person access (no code change):** `invite_to_church(email, role)` (`0014:19-60`) — owner/admin only, role forced into `admin/member/viewer`, upserts an `instance_invites` row consumed on next sign-in.

**The RLS idiom (how a role grants CRUD), pervasive:** `SELECT USING (user_in_instance(...) or a roster helper)`, `INSERT/UPDATE/DELETE WITH CHECK (user_role_in_instance(...) IN ('owner','admin'))`. **∴ a `viewer` satisfies SELECT but fails every write check — read-only by construction.** That is the enforcement the tester role leans on.

**Per-ministry roster template (the pattern to mirror):** `choir_members` (`0011:33-60`) + `user_in_choir`; `bus_drivers` (`0095:36-55`) + `user_in_bus_ministry`. Roster table (`instance_id`, nullable `user_id`, `display_name`, a `*_role` CHECK, `added_by`) → a `SECURITY DEFINER user_in_X` helper (owner/admin OR roster row) → RLS read = helper, write = owner/admin → explicit grants → realtime publish. Client `getXAccess()` → `{signedIn, canSee, canEdit/canManage, unverified, tenantId, role}`.

## 2. Opportunities

- **Reuse, don't reinvent:** the `viewer` instance role already IS view-only-by-RLS — the exact "tester" enforcement, no new permission primitive needed. `invite_to_church` already grants it. The choir/bus roster UI + sync pattern is the template.
- **One clean home:** a `church_team_members` roster (lead/dev/ops/tester) sits beside `choir_members`/`bus_drivers` with the same shape — the team page shows "Doug — tester" while RLS independently guarantees read-only.
- **The label/access split is the safety:** the team row is **label + audit only**; real access is the separately-granted instance role. A stray/self-inserted team row can never widen what someone reads.

## 3. Constraints / risks (the Ways this build honors)

- **Tenancy guard (DR-0060):** every `instance_id` table must `ENABLE ROW LEVEL SECURITY`. ✓ (`0109:90`).
- **Grant guard:** `authenticated` needs explicit table DML or every call 403s (42501) before RLS runs. ✓ added explicit `GRANT SELECT/INSERT/UPDATE/DELETE` + `GRANT EXECUTE` on both helpers (`0109` §3b).
- **Migration lane (DR-0084):** `.github/workflows/db-migrate.yml` auto-applies idempotent `migrations-auto/*.sql` on merge to main, single-transaction, ledgered. ✓ `0109` is idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE` / guarded `DO`).
- **Monolith freeze:** shell is bug-fix-only. ✓ extract-then-mount — all logic in `ChurchTeam.jsx` + `church-team-sync.js`; only the `churchView==='team'` render mount is in the shell (nav entry + import net-zero, appended to existing lists); budget hand-raised +1 (5449→5450) with stated reason.
- **Reviewer-mode is NOT this:** `reviewer-mode.jsx` (`poe-reviewer-mode`) is a per-device privilege-narrowing lens, not a granted role — orthogonal to the church tester (a real DB `viewer` grant). Not conflated.
- **Verification (DR-0076):** `getTeamAccess` returns `unverified` so a lapsed/hung session (the getSession cross-tab-lock class) is never mistaken for "not on the team"; proven-to-catch `church-team-sync.test.js`.

## 4. What shipped (the plan, implemented)

- **`infra/supabase/migrations-auto/0109-church-dev-ops-team.sql`** — `church_team_members` + `user_on_church_team` + `user_team_role_in_instance` + RLS (read = on-team, manage = owner/admin) + explicit grants + realtime.
- **`app/src/lib/church-team-sync.js`** — `TEAM_ROLE_TO_INSTANCE_ROLE {tester:viewer, dev/ops:member, lead:admin}`, `deriveTeamAccess`, bounded `getTeamAccess`, `subscribeTeam`, `addTeamMember` (inserts the row AND invites at the mapped instance role), `removeTeamMember`, `updateTeamMemberRole`.
- **`app/src/components/ChurchTeam.jsx`** — the roster surface (add/remove/change-role; honest signed-out / unverified / not-a-member states; a Tester badge is green = view-only).
- **Wiring** — `surfaces.js` entry + export; monolith import + nav tab ("Dev / Ops Team") + render mount.
- **`app/src/__tests__/church-team-sync.test.js`** — 11 tests pinning the tester=viewer mapping, the manage/see split, and the unverified path.

**Use it:** Church → **Dev / Ops Team** → "+ Add team member" → name + email + **Tester (view only)** → they're invited; access starts on their next sign-in and always matches their role. Promote them (dev/ops/lead) later from the same row.
