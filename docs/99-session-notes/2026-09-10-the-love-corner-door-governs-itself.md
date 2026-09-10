# 2026-09-10 — The Love Corner door governs itself (DR-0348)

**Scope, in Darrell's words:** *"focus on PoeTech App only... not TLC Therapy Solutions... the other channel has that task"* — *"or Love Corner App."* The TLC onboarding governance work-in-progress from this session was removed uncommitted; the same three asks are applied here to the church door:

- *"how can we see and edit the onboarding process when we or staff want to make adjustments?"*
- *"Assistants and others need hierarchy for making sure we have appropriate governance and resources for our business"*
- *"Owners and managers etc need to be able to govern using the same app"* — *"opportunities and constraints"*

## 1. SHOULD → ARE → GAPS (DR-0219)

| | |
|---|---|
| **SHOULD** | From the church door, an owner/admin sees how a person gets on, who is on and at what standing, what each may and may not do, and edits it there (DR-0221 "Inside the Love Corner App also"; DR-0242 checklist; DR-0065 build it in the app). |
| **ARE** | One place: the family Admin tab → Role & stewards, gated `family/governor`, with a space picker. `join_church_instance` (0014): allowlisted leaders joined on sign-in; everyone else joined only by an open invite. Nothing on-screen said so. |
| **GAPS** | No surface on the door; the gate was the family list, not the church standing; the process undocumented on-screen; rights shown as a label + checklist, never as may / may-not; no faces on the roster. |

## 2. What was built

- `app/src/lib/church-members.js` — pure: `rightsFor` (MAY / MAY NOT per standing + extra rights from the grants), `countsByRole`, `groupByRole` (owner → admin → member → assistant → successor → child → viewer), `openInvites` (unaccepted + unexpired), `wayInSteps` (five steps, each with the number it is measured by; `null` when unreadable), `pickChurchSpace`; async `loadChurchGovernance` (list_my_admin_instances → STRICT roster → grants, invites under `instance_invites_admin_read`, pending claims) and `readInvites`.
- `app/src/components/ChurchMembers.jsx` — the tab: header card (my standing, Refresh, an error that says it is one, the not-a-governor line), third-row chips **The way in · People · Invite**. People: faces via `useProfiles`, standing `<select>` from `grantableRoles`, a **Rights** fold with MAY / MAY NOT and the extra-right checkboxes (`canEditCapabilities` → `setMemberCapability`, re-read after each change). Invite: `inviteToSpace('church', …)`, open invites with expiry, claims → `confirmInvite`.
- `app/src/surfaces.js` — `church-members` (sub `members`); export `ChurchMembers`.
- `app/src/poe-financial-mvp-v28.jsx` — the nav entry for any signed-in person on the existing church nav line; one render line; import on the existing surfaces import line. `scripts/monolith-budget.json` 5345 → 5346, reason recorded.

## 3. Proof

| Check | Result |
|---|---|
| `church-members.test.js` | 12 pass (rights, counts, groups, open invites, steps, gate, source pins) |
| `church-members-render.test.jsx` | 5 pass (signed out; member; owner counts; People with a real picture, a role change, MAY / MAY NOT, a checkbox; Invite + Confirm) |
| `surface-mount-integrity`, `surface-registry-completeness`, `monolith-budget-guard`, `member-surfaces-every-control-acts` | pass |
| eslint `--max-warnings 0` | clean |
| ui-standards guard | 0 regressions after two fixes it caught: two 32px buttons raised to 36px; the shared chip constant interpolated so the focus ring is visible to the scan |
| consistency · contrast · fab-overlap · module-boundary · monolith-budget guards | OK |

## 4. Honest limits (DR-0100)

- The sandbox cannot sign in; the live tab is proven in jsdom against the real component. **Witness: Church → Members on Darrell's phone** — `re-review: 2026-09-13`.
- The 0014 leader allowlist is code; the tab states it, cannot edit it. A table an owner edits is a schema change — `re-review: 2026-09-24`.
- ~~Remove a person is not on the tab~~ — built before merge (section 8), the DR-0236 closing test applied.

## 5. Also this session, before this build

- PR #1500 merged (0534d5e) at 04:30 UTC: honest server errors at the transport; one person two doors every phone; the sending screen reports what the push did. Deploy run 1005 dispatched by the lane for that SHA.

## 6. Real Chromium, 412×915, the built preview (DR-0239 form-factor, measured)

| Walk | Result |
|---|---|
| Visitor on the church door | no **Members** tab in the strip (signed-out), Bus Ministry present; zero page errors |
| `?view=church&sub=members` as a visitor | the Members card with its sign-in note renders (screenshot `60-members-visitor.png`) |
| First walk, before the fix | the same link fell through to Church home: `nav-history.js`'s hand-kept `VALID_CHURCH_SUBS` did not carry `members`; the `shell-church-deep-link` gate names exactly this. One entry added, its 54 tests green. |

## 7. PR #1500 — deploy proven (DR-0107)

Deploy run 1006 completed green for `0534d5e` (main's tip after the squash). Task closed.

## 8. Before merge — Remove, because it was buildable now (DR-0236)

The 2026-09-17 date was a "later" for work the tools already allowed. `canRemove()` (pure, the mirror of `remove_instance_member` 0130) + a two-tap Remove in the Rights fold: the first tap asks and offers Keep, the second calls the RPC with the church id and re-reads the roster. Never on an owner or yourself; an admin is removed only by an owner. Tests +2; lint, ui-standards (0 regressions), consistency, contrast green.

## 9. What CI caught that the local pass did not (DR-0076 — the gates are the review)

The first push (3b3d71f) went red four ways, each a real gate: the deep-link allow-list (fixed before the run finished), the persistent-share freshness gate (the ledger must carry the re-frozen budget — regenerated), the Relationships-closes-the-import pin, and feedback-area coverage (every church sub-tab must be selectable in the feedback form). All four closed on 2c6eabb; the full suite (889 files / 13,135 tests) was run locally before that push. Lesson kept: run the full suite, not the touched suites, before the first push of a new surface.
