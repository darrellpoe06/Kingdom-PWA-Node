# Identity, Roles, and Audit — Multi-user permissions and accountability

> **Enforcement-enum reconciliation (2026-07-21, DR-0220).** The role NAMES in this
> doc (`Owner / Editor / Contributor / Viewer / Specialist`) are the original
> *persona* framing. The **shipped, enforced** role enum in `instance_members.role`
> is `owner / admin / member / viewer / specialist / child / successor / assistant`
> (`schema-v2.1-infra.sql:224-226` + `0082` + `0100`) — `editor`/`contributor` do
> not exist in code and are superseded for enforcement (map: editor→admin,
> contributor→member). The `specialist` persona here — "an Editor with a tight
> scope… roles + scope + duration" — is the documented basis for the Dev/Ops
> Specialist role, realized via the `role_capabilities` capability-checkbox layer
> (`ROLES-MEMBERSHIP-MULTITENANCY-ADR.md:99-118`; DR-0220 §2b/Phase 6). Read the
> persona table below for INTENT; read the shipped enum for what actually gates.

> Founder framing (2026-05-18):
> *"We want the user to have granular and edit privileges, we just want a record of who did what so the main administrators can see who did what. We do expect the main user to have other users who can also do what they need, according to what they need access. I want this to scale well, so all the issues need to be understood that can undermine. However, we want granular and details that all families, one-person businesses, and small business teams — also easily upgradeable for an Enterprise company will want."*

This is the binding framework for how multiple users share an SKOS / PoeTech Family OS instance, what each can do, and how every action is recorded so administrators can see who did what.

It is the partner of `CONNECTED-CONTEXT.md` (data linking) and `LIFECYCLE-AND-HANDOFF.md` (per-record history) — both already require that every change is attributable. This doc names **who** is doing the attributing.

---

## Two non-negotiable rules

### Rule 1 — Every change is attributable

Every create, edit, delete, status change, and export on every entity in the system writes an audit entry tagged with the **acting user's identity**. There is no anonymous mutation. Even in the single-user / no-auth phase, the audit entry records the device-local profile name (defaulting to "owner").

### Rule 2 — The framework scales gracefully

The same data model holds whether the instance has 1 user (a family head) or 10,000 users (an enterprise). Adding users is configuration, not engineering rework. The system never has to be re-architected to support more users; only the **authentication source** changes per phase.

---

## Roles — five levels, scales family → enterprise

Each role is defined by the **permissions matrix** below (who can do what on which entity types). Roles are not hard-coded per user; one user can hold multiple roles, scoped per module.

| Role | Family example | Business example | Enterprise example |
|---|---|---|---|
| **Owner / Administrator** | Parent who set up the instance | Solo business owner | C-level or designated admin |
| **Editor** | Spouse, adult child | Spouse, business partner | Manager, team lead |
| **Contributor** | Teenage child handling chores | Hourly employee, contractor | Department member |
| **Viewer** | Visiting relative, accountant | External CPA at tax time | Auditor, board observer |
| **Specialist** | (rare in family) | Property Manager, Bookkeeper | Legal Counsel, Compliance officer |

### Permissions matrix per entity type

| Entity type | Owner | Editor | Contributor | Viewer | Specialist (default scope) |
|---|---|---|---|---|---|
| Books · Accounts | CRUD | CRUD | Create-own, Read-shared | Read | Bookkeeper: CRUD on assigned entities |
| Books · Transactions | CRUD | CRUD | Create-own | Read | Bookkeeper: CRUD on assigned entities |
| Books · Calendar | CRUD | CRUD | Create-own | Read | — |
| Books · 1099s | CRUD | CRUD | Read | Read | Bookkeeper: CRUD |
| Books · **Legal** | CRUD (with PIN) | CR (with PIN) | None | None | Legal Counsel: CRUD with PIN |
| Real Estate · Properties | CRUD | CRUD | Read | Read | Property Manager: CRUD on assigned properties |
| Real Estate · Maintenance | CRUD | CRUD | Create | Read | Property Manager: CRUD |
| Real Estate · Tenants | CRUD | CRUD | Read | Read | Property Manager: CRUD |
| Projects | CRUD | CRUD | CRUD-own | Read | — |
| Practice · Inquiries | CRUD | CRUD | Create-own | Read | (TLC isolated — see HIPAA note) |
| Debts | CRUD | Read | Read | Read | Bookkeeper: Read |
| Markets watchlist | CRUD | CRUD | Read | Read | — |
| Voice Ops · Inbound | CRUD | CRUD | Read | Read | Property Manager: CRUD on routed lines |
| Feedback Log | CRUD | Create | Create | Read | — |
| About · Instance settings | CRUD | Read | Read | Read | — |
| About · User management | CRUD | None | None | None | None |
| Audit log | Read all | Read own actions | Read own actions | None | Read scoped to specialist domain |

**Scope modifiers** can narrow any role:
- *Per entity* (this LLC only)
- *Per property* (1508 Holly Hill only)
- *Per module* (Books only, no Real Estate)
- *Read-only* (any role flipped to view-mode)

A "Specialist" is just an Editor with a tight scope. An "external CPA at tax time" is a Viewer scoped to Books for 30 days. There are no special role types — just roles + scope + duration.

---

## The audit log

Every state-changing action writes an audit entry. Reuses the `lifecycle.log` shape from `LIFECYCLE-AND-HANDOFF.md`, plus three new fields for multi-user:

```js
{
  at:        '2026-05-18T13:42:00Z',
  by:        'darrell' | 'christina' | 'msw-contractor-1' | 'cpa-bobby' | …,  // acting profile
  byRole:    'owner' | 'editor' | 'contributor' | 'viewer' | 'specialist',
  action:    'create' | 'update' | 'delete' | 'status-change' | 'export' | 'login' | 'permission-grant' | …,
  entityType:'incident' | 'property' | 'transaction' | …,
  entityId:  '<id>',
  fromValue: <previous state of changed fields>,  // shallow diff, not full record
  toValue:   <new state of changed fields>,
  ip:        null,                                // present only when cloud-auth in use (Phase 3+)
  device:    'darrell-iphone' | 'family-ipad' | …,// device fingerprint
  note:      ''                                    // optional user-provided context
}
```

The audit log is **per-entity** (lives inside `item.lifecycle.log`) AND **global** (a system-wide view aggregating across entities). Administrators can:

- See every action by a given user
- See every action on a given entity
- Filter by date range, action type, role
- Export the log (e.g., for a CPA, a court, a compliance review)

### Retention

- **Family / solo:** indefinite. Storage cost is trivial; cognitive cost of losing context is high.
- **Small team:** indefinite by default; admin can purge by date range with a reason recorded.
- **Enterprise:** configurable retention (1, 3, 7, 10 years, indefinite). Default 7 years — matches U.S. legal retention norms.

### Tamper-evidence (Phase 3+)

Once cloud sync ships, audit entries are hash-chained: each entry includes a hash of the prior entry's contents. A modified or deleted entry is detectable. Family / single-device instances skip this (no shared trust boundary to defend); business / enterprise instances require it.

---

## Phased migration — same data model, four phases

### Phase 1 — Single device, no auth (NOW · $0)

- Default user profile is `owner` — assumed to be the person who set up the instance.
- All audit entries record `by: 'owner'`, `byRole: 'owner'`.
- No permission gating in the UI — owner has CRUD on everything.
- **What ships in this phase:** the audit log structure (already in `lifecycle.log` per task #83). Books / Calendar / Real Estate / Projects all write log entries automatically.

### Phase 2 — Local profiles, PIN-gated (next, $0)

- Instance Settings → Users → Add Profile. Up to 8 profiles per device.
- Each profile has a name and a 4-6 digit PIN. Owner sets others' PINs at first; profiles can change their own.
- App startup shows profile picker. Selected profile becomes the `by` field on all subsequent audit entries.
- Permissions: Owner can assign role + scope to each profile via Instance Settings.
- Profiles are **device-local only**. Data does not sync across devices (still Phase 1 storage model).
- **What ships:** profile model, PIN gate, profile picker, role-based UI gating (hide buttons / fields the profile can't use), audit `by` resolution.

### Phase 3 — Cloud auth, cross-device sync (with Multi-Instance Phase 3 backend)

- Real authentication via passkey / email magic link / OAuth. No passwords.
- Profiles become first-class users with their own login.
- Cross-device sync per user — log in on phone, see same data.
- Hash-chained audit log for tamper-evidence.
- Stripe billing per organization, not per user (avoids per-seat sticker shock for families).
- Built on the same Cloudflare Worker + D1 backend already designed in `MULTI-INSTANCE-STRATEGY.md` Phase 3.

### Phase 4 — Enterprise (when paying enterprise customers exist)

- Single Sign-On (SSO) via SAML / OIDC for organizations with corporate identity providers.
- SCIM provisioning — IT departments can create/disable users via their identity system.
- BAA-covered storage tier for therapy practices / healthcare orgs that need PHI handling.
- Configurable audit retention.
- Per-org admin dashboard for usage, billing, compliance posture.
- Custom roles beyond the five defaults.

Each phase is **independently shippable**. The Phase 1 audit log already exists. Phase 2 is the next visible work. Phase 3 waits for paying customers. Phase 4 waits for enterprise demand.

---

## Scaling pitfalls — what could undermine this

1. **Last-write-wins on concurrent edits.** In Phase 3+, two users editing the same record at the same time will conflict. Mitigation: optimistic locking — show a "this record was changed by X 2 minutes ago, refresh?" prompt before committing.
2. **Audit log size.** Heavy usage at enterprise scale could produce millions of entries. Mitigation: pagination + per-entity scoping by default (admins query specific entities), partitioned tables in D1 by year-month.
3. **Tampering at the device level.** A user with developer tools can edit IndexedDB. Phase 3 hash-chained audit detects this on next sync; Phase 1-2 cannot defend (acceptable for family / small-team trust boundary).
4. **Cross-instance leakage in shared devices.** A family iPad with multiple profiles — if one profile is compromised, others on the same device might be at risk if PINs are weak. Mitigation: minimum PIN length (6 digits), auto-lock after N minutes (already required for Legal), PIN-rotation reminders.
5. **Role explosion.** Enterprises can demand 50+ custom roles. Mitigation: ship 5 default roles + scope modifiers (sufficient for 90%+ of cases). Custom roles are a Phase 4 enterprise-tier feature, not a Phase 3 small-team feature.
6. **Permission revocation lag.** A fired employee's local profile might still have data on their device after their access is revoked centrally. Mitigation: Phase 3+ uses signed access tokens with short TTL; offline operations are queued and reject on next sync if revoked.
7. **HIPAA / Legal boundary leakage.** Audit logs themselves might contain PHI (a note like "Mrs. X reported anxiety"). Mitigation: TLC inquiries already isolated; Legal matters already require PIN + encryption per `LEGAL-PRIVACY-BOUNDARY.md`. Audit log redaction rules apply to BAA-covered exports.
8. **Owner death / incapacity.** If the only Owner is unavailable, family is locked out. Mitigation: Owner can designate a **Backup Owner** (Phase 2+) who can claim full Owner rights after a verification step (e.g., a recovery passphrase set during account creation, mailed to a designated contact, or via a multi-day waiting period for cloud-auth customers).
9. **Audit log itself becomes a privacy concern.** A family member can see "spouse updated checking balance to $500 at 11pm." Mitigation: scope what each role can see in the audit log — Editors see their own actions and the actions of their direct subordinates; Owners see everything; Contributors see only their own.
10. **Default role too permissive.** Adding a "Christina" profile and forgetting to set role = Editor leaves it as Owner (the default). Mitigation: new-profile flow REQUIRES role selection; no "use default" shortcut. Owner role is only ever granted explicitly.

---

## Anti-patterns this rule forbids

- **Anonymous edits.** Every mutation writes an audit entry. No "silent" data fixes.
- **Audit logs that can be edited by the actors they describe.** Owners can READ everything but cannot redact specific entries. The audit log is append-only.
- **One role to rule them all.** "Family Plan" does not mean every family member is an Owner. The Owner role is rare and powerful; most users are Editors or Contributors.
- **Cross-instance role bleed.** A user with Editor role at one instance does not auto-get Editor at another instance, even with the same email. Roles are per-instance.
- **Audit logs that grow unbounded with no UI for review.** If the system records 10,000 entries that no one ever sees, it failed. Every admin instance ships with an audit view that surfaces the log meaningfully (per-user, per-entity, per-day rollups).

---

## How this connects to the rest of the foundations

- `LIFECYCLE-AND-HANDOFF.md` — the audit log uses the same `lifecycle.log` shape; this doc just names **who** is logging.
- `CONNECTED-CONTEXT.md` — `links` carry `by` and `at` already. This doc formalizes who that `by` resolves to in multi-user mode.
- `LEGAL-PRIVACY-BOUNDARY.md` — the Legal module's PIN is orthogonal to user PINs; both apply (you need both the user PIN AND the Legal PIN to access privileged content).
- `SITUATIONAL-PEACE.md` — multiple users sharing the work distributes the storm-watching load. Peace is multiplicative when roles are clear.
- `IN-PLACE-FIRST.md` — permission gating happens inline (a disabled button instead of a navigation to a "you don't have access" page).
- `MULTI-INSTANCE-STRATEGY.md` — Phase 3 backend is the auth infrastructure for this doc's Phase 3 phase.
- `FOUNDERS-CONFESSION.md` — His Story not mine; the audit log captures who actually did the work, never inflates the Owner's role.

---

## Sustainability check

| Phase | New paid dependency | Cost |
|---|---|---|
| Phase 1 (now) | None | $0 |
| Phase 2 (local profiles) | None | $0 |
| Phase 3 (cloud auth + sync) | Cloudflare Workers + D1 (free tier covers <50 customers) | $0 → $25/mo at scale |
| Phase 4 (enterprise) | SAML / SCIM provider integrations | Pricing-tier dependent; rolled into Enterprise tier revenue |

No phase adds cost until it adds matched value. Rule held.

---

## What ships in this round (r22+)

1. **Foundation locked.** This doc. ✓
2. **Audit log structure.** Already in place via `lifecycle.log` per task #83.
3. **Calendar inline Edit + audit entry.** Per IN-PLACE-FIRST + this doc. (Next task — #107.)
4. **Defer Phase 2 / 3 / 4 implementation** to dedicated future rounds. The data model already supports the structure; UI gating and profile selection are separate engineering tasks.

---

**End of document.** Binding. Any new entity added to the system must write to the audit log on every state change; any new user-facing affordance must respect the permissions matrix; any new role added must define its scope clearly. The system is built so that family-scale users see no overhead, while enterprise-scale users get the auditability they need — and the path between the two is a configuration migration, not a re-architecture.
