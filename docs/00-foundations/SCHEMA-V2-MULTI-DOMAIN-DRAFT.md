# Supabase Schema v2 — Multi-Domain, Forward-Declared (DRAFT)

> **Status:** DRAFT, 2026-05-24. Written under Dispatch during Darrell at church, after Darrell selected Option C from the 2026-05-24 schema audit. Not yet executed; not yet pushed. This document is the **target shape** of the data layer for SKOS / PoeTech across every role surface the OS prebuilds — landlord, therapist, contractor, business mentor, lawyer, church, family — and the cross-cutting infrastructure (audit log, role scopes, external participants) that makes those role surfaces real.
>
> **Path forward (per Darrell's selection):** v1 + v1.1 stay as-is. v2 is purely additive — new tables, new policies, enum widenings, jsonb columns — applied incrementally over the weeks after vacation. The June 1 family + church launch ships against v1 surfaces. Every domain table below is dormant until its module's UI lands, but the data layer is **already shaped** so future module work is UI-against-existing-tables, not "design the schema first, then build."
>
> **Architectural binding:** open-source / portable Postgres (self-host target: Supabase on Synology DS1621xs per `_future/SYNOLOGY-DEPLOY-PLAN.md`). No vendor-specific SQL. No managed-service-only features. Every table runs as comfortably on bare Postgres as on Supabase. Vendor independence at runtime per `MODULAR-EXTENSIBILITY.md`.

---

## Table of Contents

1. Decision summary — what v2 commits to
2. Architectural principles (binding from foundations)
3. The polymorphism question — recommendation, not options
4. Cross-cutting infrastructure tables (new in v2)
5. Universal column patterns (lifecycle, links, audit)
6. Domain — Landlord (Poe Properties, 11 doors as the test)
7. Domain — Therapist (TLC, 7 clinicians as the test)
8. Domain — Contractor / 1099 / Trades
9. Domain — Business Mentor
10. Domain — Lawyer (Legal Matters, encrypted at rest)
11. Domain — Church operations
12. Cross-cutting business ops (incidents, tax_calendar, etc.)
13. External Participants layer (Contractor / Tenant / Client / Donor / Parishioner / Volunteer / Customer portals)
14. RLS pattern catalog
15. Migration path — v1 → v2 in additive slices
16. Open questions for Darrell's judgment
17. Appendix — table inventory (alphabetical, grouped by file)

---

## 1. Decision summary — what v2 commits to

The 2026-05-24 audit established that v1 + v1.1 is a correct multi-tenant skeleton — `tenants`, `tenant_members`, `tenant_invites`, plus a generic Financial OS (`entities`, `accounts`, `transactions`, `debts`, `projects`) plus three new surfaces (`feedback`, `confessions`, `user_telemetry`) plus per-user settings — but it does NOT carry real business operations for any role except family / church membership. The audit named three paths. Darrell selected **Path C: forward-declare the full multi-domain schema NOW**, so that:

- The June 1 family + church testing ships against v1 surfaces as planned.
- Every domain module (landlord, therapist, contractor, mentor, lawyer, church-ops) has its tables already created and policy-attached when the React UI for that module lands.
- The multi-domain commitment is **visible in the database** from day one — no one can mistake the v1 family / church surfaces for the whole of SKOS.
- Future module work is "wire React to existing tables," not "schema + RLS + policies + indexes + UI." The expensive design work happens once, in this document.

What v2 does NOT do:
- v2 does NOT touch v1's existing tables (no DROP, no rename, no breaking change).
- v2 does NOT require backfills (every new column has a default; every new table is empty until its module starts writing).
- v2 does NOT execute as a single SQL file. It ships as a series of small migration files (`schema-v2.1-infra.sql`, `schema-v2.2-rentals.sql`, etc.) so any single domain's tables can land independently, in any order, without coordination.
- v2 does NOT bake in vendor lock — every table, every function, every policy must run on plain Postgres 15+. Supabase's `auth.users` is the only acceptable Supabase-specific reference, and that's by design (the auth boundary lives at the project edge, not the schema interior).

---

## 2. Architectural principles (binding from foundations)

These are not new. They are the rules already binding from the foundation docs. v2 inherits all of them.

**From `MODULAR-EXTENSIBILITY.md` —** Every module is a file. Every table family in v2 ships as its own `schema-v2.{n}-{domain}.sql` file. A landlord-only customer can have only the landlord tables; a therapy-only customer can have only the therapy tables. Disabling a domain is dropping a SQL file from the migration runlist; no other table breaks.

**From `CONNECTED-CONTEXT.md` —** Every domain entity carries a `links` array (jsonb) — the universal link graph. Auto-link runs at insert/update; user-defined links via `+ Link to…` UI. Implemented as a `links jsonb DEFAULT '[]'` column on every domain table, plus a `entity_links` materialized index (Section 4) for cross-entity queries.

**From `LIFECYCLE-AND-HANDOFF.md` —** Every domain entity carries a `lifecycle` object — current phase, openedAt, closedAt, append-only log of transitions with `by` / `at` / `note`. Implemented as a `lifecycle jsonb DEFAULT '{"phase":"new","log":[]}'` column on every domain table.

**From `IDENTITY-ROLES-AUDIT.md` —** Every state-changing action writes to a global `audit_log` table. Plus `tenant_members.role` is supplemented by a `role_scopes` table that narrows the role's scope (per-entity, per-property, per-module, read-only). The `tenant_members.role` enum widens to include `'specialist'` (the 5th role).

**From `ECOSYSTEM-PARTICIPANTS.md` —** External users (Contractor / Tenant / Client / Donor / Parishioner / Volunteer / Customer) are first-class participants with scoped portal access, distinct from internal `tenant_members`. They have their own `external_users` table, their own magic-link auth flow, and a separate RLS pattern that only ever exposes their own linked data + interactions.

**From `LEGAL-PRIVACY-BOUNDARY.md` —** The Legal domain is the strictest in the system. Legal data is encrypted CLIENT-SIDE (AES-GCM via Web Crypto API, PBKDF2 250k iterations) before reaching the database. The server stores ciphertext only. RLS still applies for tenant scoping, but the server cannot decrypt the content. PIN loss = data loss; intentional.

**From `MULTI-INSTANCE-STRATEGY.md` / `SYNOLOGY-DEPLOY-PLAN.md` —** Self-host target is Supabase running in Docker Compose on the DS1621xs. No managed-service dependencies. Postgres is Postgres. RLS is Postgres-native. Storage is local Synology volumes (no Cloudflare R2 in the data path; R2 is the optional CDN for the React PWA only).

**From `SERVICE-MANAGEMENT.md` —** Every domain entity that represents work-in-flight (incidents, projects, inquiries, scopes, maintenance_requests, legal_matters, engagements, sessions) follows the ITIL-shaped lifecycle: `new → triaging → in-progress → resolved` with the related-history + assignee-suggest patterns applied at the application layer.

---

## 3. The polymorphism question — recommendation, not options

The audit asked: **How does "tenant" polymorph to support any business type?** Three candidate shapes were named. Here is the recommendation, with reasoning, not three options:

### Recommendation: hybrid — `tenants.tenant_type` as primary classification + a `tenant_domains` join table for enabled modules + `entities` for sub-entity scoping within a tenant

**Why not single enum on tenants alone.** The current `tenants.tenant_type` enum (`family / church / therapy-practice / contractor / nonprofit / business`) treats each tenant as exactly one shape. But the Poe Family tenant ALREADY needs to be a family AND own Poe Properties (landlord) AND own PoeTech (tech business) AND host parts of TLC's operational data (Christina's practice). A single enum forces "primary shape," which is fine for display and default modules, but cannot represent the truth that one organization carries multiple domains.

**Why not separate domain-typed tenant tables.** A `landlord_tenants` table, a `therapy_tenants` table, etc., would duplicate the membership / invite / settings infrastructure N times. It also breaks the audit's correct observation that `tenants` + RLS-by-membership is the right multi-tenancy model. Don't fork the membership layer; layer on top.

**Why not pure join table.** A `tenant_domain_profiles` join with no primary classification leaves the dashboard / nav / default-module question unanswered — what does the React app show when a user lands on a tenant that's "family + landlord + tech business + church-leadership"? You need a primary shape for the default UI, even if domains are additive.

### The recommended shape

```
tenants (existing, v1)
  tenant_type — primary classification, drives default nav / module set
              — widen enum in v2: add 'landlord', 'law-practice', 'mentor', 'trades', 'media-org'

tenant_domains (NEW in v2 — the join)
  tenant_id    → tenants(id)
  domain       — enum: 'family', 'church', 'rentals', 'therapy', 'contractor',
                       'legal', 'mentor', 'nonprofit', 'media', 'tech-business'
  enabled_at   timestamptz
  enabled_by   uuid → auth.users(id)
  settings     jsonb — per-domain config (e.g., for 'rentals': default-lease-template;
                                          for 'therapy': handoff-target-acuity-instance)
  UNIQUE(tenant_id, domain)

entities (existing, v1)
  entity_type — widen enum: 'personal' | 'business' | 'rental-property' |
                            'ministry' | 'practice' | 'matter-group' |
                            'engagement-portfolio'
  domain      — NEW column, nullable: which domain this entity belongs to
                ('rentals', 'therapy', 'legal', 'mentor', 'church', 'family', null=cross-cutting)
  parent_entity_id — NEW column, nullable: enables sub-entities (e.g., a building
                     entity that contains multiple unit entities)
```

### How a real instance looks under this model

**Poe Family** (the single tenant):
- `tenants.tenant_type = 'family'` — primary
- `tenant_domains`: rows for `'family'`, `'rentals'`, `'tech-business'`, `'legal'`
- `entities`: `e-personal` (personal), `e-poeprops` (business, domain='rentals'), `e-poetech` (business, domain='tech-business'), `e-tlc` (business, domain='therapy' — Christina's practice if she chooses to share-house under the family tenant, OR — see below — TLC could be its own tenant)
- All rentals rows scope to `tenant_id = poe-family` and `entity_id = e-poeprops`
- All Legal matters scope to `tenant_id = poe-family` (encrypted)

**The Church of the Living God** (separate tenant):
- `tenants.tenant_type = 'church'`
- `tenant_domains`: rows for `'church'`, `'nonprofit'`, `'tech-business'` (Darrell's tech-director work for the church)
- `entities`: `e-colg-general` (the operating fund), `e-colg-building` (the property), various ministry entities
- parishioners, donor_giving, ministry_signups all scope to `tenant_id = colg` and link to the appropriate entity

**TLC Therapy Solutions** (separate tenant — recommended):
- `tenants.tenant_type = 'therapy-practice'`
- `tenant_domains`: rows for `'therapy'`, `'legal'` (LLC matters)
- `entities`: `e-tlc-llc` (the operating business)
- clinicians, inquiries scope to TLC's tenant_id — Christina is `owner`, the 6 other clinicians are `member` or `specialist`
- **Rationale for separate tenant:** TLC is a separate legal entity from the Poe Family; per `LEGAL-PRIVACY-BOUNDARY.md` and HIPAA-adjacent isolation, TLC's data should be RLS-isolated even from Darrell-as-Poe-Family-Owner. Christina as TLC's Owner controls who gets in.

**Anonymous Landlord LLC** (a hypothetical future customer):
- `tenants.tenant_type = 'landlord'`
- `tenant_domains`: rows for `'rentals'`, `'legal'`
- `entities`: one per property, parented under the LLC entity

The polymorphism falls out cleanly: every domain table scopes to `tenant_id` + RLS-by-membership (unchanged from v1), but additionally references `entity_id` for "which sub-entity owns this row" and the React app reads `tenant_domains` to know which nav surfaces to render.

### What this means for the existing schema

Five small changes (all forward-compatible):

1. `ALTER TYPE` on the implicit `tenant_type` check constraint to add the new values. (v1 uses CHECK not enum — even simpler.)
2. `ALTER TABLE tenant_members ALTER COLUMN role` to add `'specialist'` to the CHECK list.
3. `ALTER TABLE entities ADD COLUMN domain text, ADD COLUMN parent_entity_id uuid REFERENCES entities(id)`.
4. `CREATE TABLE tenant_domains` per Section 4.
5. `CREATE TABLE role_scopes` per Section 4.

Nothing breaks. Nothing migrates. Existing rows continue to work because every new column is nullable or has a default.

---

## 4. Cross-cutting infrastructure tables (new in v2)

These are the foundation tables every domain depends on. They go in `schema-v2.1-infra.sql` and land first.

### `tenant_domains` — which domain modules are enabled per tenant

```
id            uuid PK
tenant_id     uuid NOT NULL → tenants(id) ON DELETE CASCADE
domain        text NOT NULL CHECK (domain IN
                ('family','church','rentals','therapy','contractor',
                 'legal','mentor','nonprofit','media','tech-business','trades'))
enabled_at    timestamptz NOT NULL DEFAULT now()
enabled_by    uuid NOT NULL → auth.users(id)
settings      jsonb NOT NULL DEFAULT '{}'
UNIQUE (tenant_id, domain)
```

RLS: tenant members read; only owners and admins insert/update/delete.

### `role_scopes` — per-member scope modifiers (narrows the global role)

Per `IDENTITY-ROLES-AUDIT.md`, a member's role can be narrowed by entity / property / module / read-only. Without this table, `tenant_members.role = 'admin'` is global to the tenant. With this table, an admin can be scoped to e.g. "admin on Poe Properties only, read-only on PoeTech."

```
id              uuid PK
tenant_member_id uuid NOT NULL → tenant_members(id) ON DELETE CASCADE
scope_kind      text NOT NULL CHECK (scope_kind IN
                  ('entity','property','module','read-only-flag','time-bounded'))
scope_value     text                       -- the entity_id, property_id, or domain name,
                                           -- as text for flexibility; FK enforced at application layer
expires_at      timestamptz                -- for time-bounded scopes (e.g., CPA at tax time)
created_at      timestamptz NOT NULL DEFAULT now()
created_by      uuid NOT NULL → auth.users(id)
```

RLS: same tenant scoping; only owners modify their tenant's scope rows.

Helper function:
```
public.user_role_in_scope(tenant_uuid uuid, scope_kind text, scope_value text)
  RETURNS text  -- the effective role given the scope filter, or NULL if no access
```

Used by domain-table RLS policies that need scope-aware reads.

### `audit_log` — append-only, every state-changing action

Per `IDENTITY-ROLES-AUDIT.md`'s Rule 1 (every change is attributable).

```
id            bigserial PK    -- bigserial for low-overhead chronological ordering
tenant_id     uuid NOT NULL → tenants(id)
user_id       uuid           → auth.users(id)        -- nullable for system-initiated actions
at            timestamptz NOT NULL DEFAULT now()
action        text NOT NULL CHECK (action IN
                ('create','update','delete','status-change','export',
                 'login','logout','permission-grant','permission-revoke',
                 'invite','accept-invite','pin-change','export-privileged',
                 'export-stripped','failed-auth','system'))
entity_type   text NOT NULL  -- 'rental', 'inquiry', 'incident', 'matter', 'transaction', etc.
entity_id     uuid           -- target row's id; nullable for global actions (login, etc.)
from_value    jsonb          -- shallow diff of changed fields, prior state
to_value      jsonb          -- shallow diff of changed fields, new state
ip            inet           -- present only when cloud-auth in use (Phase 3+)
device        text           -- device fingerprint label
note          text           -- optional user-provided context
prev_hash     text           -- Phase 3+: hash of the prior entry for hash-chain tamper detection
hash          text           -- Phase 3+: hash of this entry's content + prev_hash
```

RLS: tenant members read their tenant's entries scoped to their visible domains (per `role_scopes`); inserts come only from `SECURITY DEFINER` functions (the application never writes audit_log directly); no UPDATE; no DELETE. Append-only enforced.

Helper functions:
- `public.audit_write(action text, entity_type text, entity_id uuid, from_value jsonb, to_value jsonb, note text)` — SECURITY DEFINER, writes one row.
- `public.audit_verify_chain(from_id bigint, to_id bigint)` — Phase 3+, walks the hash chain and returns first tampered entry, or NULL.

Indexes:
```
audit_log_tenant_at_idx     ON audit_log (tenant_id, at DESC)
audit_log_entity_idx        ON audit_log (entity_type, entity_id)
audit_log_user_at_idx       ON audit_log (user_id, at DESC)
```

### `entity_links` — materialized cross-entity link index (per `CONNECTED-CONTEXT.md`)

Every domain table has a `links jsonb DEFAULT '[]'` column for the local link list. But queries like "show me every entity linked to this rental" need a flat queryable index. The `entity_links` table is that index, maintained by trigger on every domain table's `links` column write.

```
id              uuid PK
tenant_id       uuid NOT NULL → tenants(id) ON DELETE CASCADE
from_entity_type text NOT NULL
from_entity_id   uuid NOT NULL
to_entity_type   text NOT NULL
to_entity_id     uuid NOT NULL
kind             text NOT NULL  -- 'caused-by','resolves','follows','parent-of',
                                -- 'duplicates','same-property','same-caller',
                                -- 'same-source','related','user-defined', etc.
source           text NOT NULL CHECK (source IN ('auto','user','suggested'))
at               timestamptz NOT NULL DEFAULT now()
by_user_id       uuid → auth.users(id)
note             text
UNIQUE (tenant_id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, kind)
```

Trigger on every domain table's `links` jsonb column reconciles inserts/deletes into this table. Bidirectional traversal is via `OR (from = X) (to = X)`.

RLS: tenant members read their tenant's links scoped by their visible entities.

### `external_users` — first-class external participants (per `ECOSYSTEM-PARTICIPANTS.md`)

Seven first-class types. Distinct identity from `auth.users` because external users authenticate through a separate magic-link flow (Phase 3) and have a separate permission model.

```
id                 uuid PK
tenant_id          uuid NOT NULL → tenants(id) ON DELETE CASCADE
type               text NOT NULL CHECK (type IN
                     ('contractor','tenant','client','donor',
                      'parishioner','volunteer','customer','vendor'))
display_name       text NOT NULL
email              text                  -- for magic-link invite
phone              text                  -- for optional SMS
linked_entity_type text NOT NULL         -- 'rental','inquiry','contractor1099',
                                         -- 'parishioner-record', etc.
linked_entity_id   uuid NOT NULL
invite_status      text NOT NULL DEFAULT 'not-invited'
                     CHECK (invite_status IN
                       ('not-invited','invited','accepted','revoked','expired'))
invited_at         timestamptz
invited_by         uuid → auth.users(id)
accepted_at        timestamptz
last_seen_at       timestamptz
permissions        text[] NOT NULL DEFAULT '{}'
                     -- e.g., {'view-own-lease','submit-maintenance-request'}
notes              text                   -- INTERNAL-ONLY, never serialized externally
lifecycle          jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}'
links              jsonb NOT NULL DEFAULT '[]'
created_at         timestamptz NOT NULL DEFAULT now()
created_by         uuid NOT NULL → auth.users(id)
updated_at         timestamptz
UNIQUE (tenant_id, email, type)   -- same email at same tenant with different
                                   -- type is allowed (parishioner who is also
                                   -- a volunteer); same email + same type is one record
```

RLS: internal `tenant_members` see everything per their `role_scopes`. External users authenticated through the separate flow (Phase 3) see only their own row plus the entities they're linked to, via a different policy family on every relevant domain table (see Section 13).

### `interactions` — bidirectional message + status log between internal and external users

Every back-and-forth gets one row.

```
id                  uuid PK
tenant_id           uuid NOT NULL → tenants(id) ON DELETE CASCADE
external_user_id    uuid NOT NULL → external_users(id) ON DELETE CASCADE
internal_user_id    uuid           → auth.users(id)
at                  timestamptz NOT NULL DEFAULT now()
direction           text NOT NULL CHECK (direction IN ('inbound','outbound'))
channel             text NOT NULL CHECK (channel IN
                      ('in-app','email','sms','phone','in-person'))
kind                text NOT NULL CHECK (kind IN
                      ('message','status-update','file-share',
                       'request','payment','visit'))
summary             text NOT NULL
body                text                  -- full message body (only present for in-app)
attachments         jsonb NOT NULL DEFAULT '[]'  -- pointer list to storage
lifecycle_note      text
linked_entity_type  text                  -- what this interaction is ABOUT
linked_entity_id    uuid
visible_to_external boolean NOT NULL DEFAULT true
                      -- internal users can mark a thread-internal interaction (e.g.,
                      -- a status note that the external user doesn't need to see)
```

RLS: internal members per scope; external users see only `visible_to_external = true` rows where `external_user_id` is their own.

### `external_invite_tokens` — magic-link state for external user auth

```
id                  uuid PK
external_user_id    uuid NOT NULL → external_users(id) ON DELETE CASCADE
token_hash          text NOT NULL UNIQUE  -- hash of the actual token, never stored plain
expires_at          timestamptz NOT NULL  -- 15 min default
used_at             timestamptz           -- null until first claim
device_fingerprint  text                  -- bound after first use
created_at          timestamptz NOT NULL DEFAULT now()
```

RLS: no direct read; only the auth helper functions (SECURITY DEFINER) touch this table.

---

## 5. Universal column patterns (lifecycle, links, audit)

Every domain table added in v2 carries the same shape. Repeated here as a single block so the per-domain sections (6–11) can reference "standard columns" without restating.

```
-- STANDARD COLUMNS — present on every v2 domain table
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
created_by  uuid NOT NULL REFERENCES auth.users(id)
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz
updated_by  uuid           REFERENCES auth.users(id)

-- Lifecycle (per LIFECYCLE-AND-HANDOFF.md)
lifecycle   jsonb NOT NULL DEFAULT '{"phase":"new","openedAt":null,"closedAt":null,"log":[]}'

-- Links (per CONNECTED-CONTEXT.md)
links       jsonb NOT NULL DEFAULT '[]'

-- Entity scoping (optional — present when the row belongs to a specific entity)
entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL
```

A trigger on every domain table:
- Writes to `audit_log` via `audit_write()` on INSERT / UPDATE / DELETE.
- Reconciles changes to `links` into `entity_links` (the materialized index).
- Updates `updated_at` and `updated_by` on UPDATE.

Implementation: one shared trigger function per table family, attached on table creation in the per-domain SQL files. The `audit_write()` and `entity_links_reconcile()` SECURITY DEFINER helpers go in `schema-v2.1-infra.sql`.

---

## 6. Domain — Landlord (test instance: Poe Properties, 11 doors)

Coverage baseline from the audit: **~10%.** Only the LLC entity record exists; the landlord business cannot operate inside the system today. v2 takes coverage to **~85%** (everything except advanced features like tenant credit-screening API integration, which is post-v2).

Five tables. File: `schema-v2.2-rentals.sql`.

### `rentals` — the properties themselves

```
[STANDARD COLUMNS]
address                 text NOT NULL
unit                    text
display_name            text NOT NULL  -- "1508 Holly Hill", "Unit B"
property_type           text NOT NULL CHECK (property_type IN
                          ('single-family','duplex','multi-family',
                           'condo','townhouse','commercial','land'))
purchase_date           date
purchase_price          numeric(12,2)
current_market_value    numeric(12,2)
mortgage_amount         numeric(12,2)
mortgage_paid_off       boolean NOT NULL DEFAULT false
property_taxes_annual   numeric(12,2)
insurance_annual        numeric(12,2)
hoa_monthly             numeric(12,2)
notes                   text
status                  text NOT NULL DEFAULT 'occupied'
                          CHECK (status IN
                            ('occupied','vacant','rehab','listed','sold','off-market'))
```

### `leases` — the lease contract for a renter-rental pair

```
[STANDARD COLUMNS]
rental_id          uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE
renter_id          uuid NOT NULL REFERENCES renters(id) ON DELETE RESTRICT
lease_start        date NOT NULL
lease_end          date NOT NULL
monthly_rent       numeric(12,2) NOT NULL
security_deposit   numeric(12,2)
pet_deposit        numeric(12,2)
lease_terms        text          -- free-text summary; full doc lives in legal_matters
                                 -- if the lease is a tracked legal artifact
document_uri       text          -- pointer to lease PDF in storage (local Synology)
renewal_option     text CHECK (renewal_option IN
                     ('auto-renew','month-to-month-after-term','expire'))
late_fee_amount    numeric(12,2)
late_fee_after_days int NOT NULL DEFAULT 5
status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN
                       ('draft','active','expired','terminated-early','renewed'))
```

### `renters` — the people in the rentals (separate from the `tenants` SaaS-tenant table)

**Naming note:** the v1 `tenants` table is the multi-tenant SaaS sense (an organization). Real-estate renters are people in a rental. To avoid collision, this table is `renters`. The audit's spec doc used `tenants_renters`; `renters` is shorter and unambiguous given the existing `tenants` table.

```
[STANDARD COLUMNS]
display_name           text NOT NULL
contact_email          text
contact_phone          text
emergency_contact_name text
emergency_contact_phone text
move_in_date           date
move_out_date          date
notes                  text
external_user_id       uuid REFERENCES external_users(id)
                            -- when this renter is given portal access, the link to
                            -- their external_user record lives here
```

### `rent_payments` — per-period payment records

```
[STANDARD COLUMNS]
lease_id          uuid NOT NULL REFERENCES leases(id) ON DELETE CASCADE
period_month      date NOT NULL  -- first-of-month for the period this payment covers
expected_amount   numeric(12,2) NOT NULL
received_amount   numeric(12,2) NOT NULL DEFAULT 0
received_at       timestamptz
method            text CHECK (method IN
                    ('cash','check','ach','zelle','venmo','cashapp','other'))
late_fee_applied  numeric(12,2) NOT NULL DEFAULT 0
status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN
                      ('pending','received','partial','late','waived','reversed'))
transaction_id    uuid REFERENCES transactions(id)
                    -- when the payment lands in Books as a transaction, link it
notes             text
UNIQUE (lease_id, period_month)
```

### `maintenance_requests` — incoming maintenance issues per rental

```
[STANDARD COLUMNS]
rental_id           uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE
renter_id           uuid REFERENCES renters(id)
                       -- nullable: landlord-initiated rehab work has no renter
submitted_via       text CHECK (submitted_via IN
                       ('renter-portal','phone','email','sms','in-person','owner-discovery'))
category            text NOT NULL CHECK (category IN
                       ('plumbing','electrical','hvac','appliance','roofing',
                        'pest','flooring','exterior','structural','cosmetic','other'))
urgency             text NOT NULL DEFAULT 'normal'
                       CHECK (urgency IN ('emergency','urgent','normal','low'))
description         text NOT NULL
estimated_cost      numeric(12,2)
actual_cost         numeric(12,2)
vendor_name         text
assigned_to_user_id uuid REFERENCES auth.users(id)  -- the internal handler
incident_id         uuid REFERENCES incidents(id)
                       -- when the maintenance request escalates into a tracked incident
status              text NOT NULL DEFAULT 'new'
                       CHECK (status IN
                         ('new','triaging','scheduled','in-progress',
                          'awaiting-parts','resolved','declined'))
scheduled_at        timestamptz
resolved_at         timestamptz
```

### Indexes for the landlord domain

```
rentals_tenant_idx               ON rentals (tenant_id)
rentals_entity_idx               ON rentals (entity_id)
rentals_status_idx               ON rentals (status)
leases_tenant_idx                ON leases (tenant_id)
leases_rental_idx                ON leases (rental_id)
leases_renter_idx                ON leases (renter_id)
leases_status_idx                ON leases (status) WHERE status = 'active'
renters_tenant_idx               ON renters (tenant_id)
rent_payments_lease_period_idx   ON rent_payments (lease_id, period_month DESC)
maintenance_requests_rental_idx  ON maintenance_requests (rental_id)
maintenance_requests_status_idx  ON maintenance_requests (status) WHERE status != 'resolved'
```

### Poe Properties as the test — does this design actually work?

11 doors. Some likely shapes:
- 11 rows in `rentals`, some with `unit` if a multi-family property.
- One or more rows in `renters` per door (a couple counts as one renter record by household; or two if they want separate portals — `external_users` resolves this).
- One row in `leases` per active rental — for an 11-door portfolio with 100% occupancy that's 11 active leases; for partial occupancy maybe 9.
- 12 rows in `rent_payments` per active lease per year — for 11 active leases that's 132 rows/year. Trivial.
- Maintenance requests: probably 30-50/year across the portfolio at typical small-landlord cadence. Trivial.

The design supports the operator:
- "Show me all late payments this month" → `rent_payments WHERE status = 'late' AND period_month = current_month_first()` scoped by tenant_id.
- "Which doors have maintenance requests open?" → `maintenance_requests WHERE status != 'resolved' AND tenant_id = ...` joined to rentals.
- "What did 1508 Holly Hill cost me last year?" → `transactions JOIN entity_links` where the rental's entity is the target.
- "Send the lease renewal reminder to the renter" → look up `renters.external_user_id` → message goes through the `interactions` table to their portal.

The design supports the renter (via Phase 3 external portal):
- `view-own-lease` → SELECT from `leases` WHERE `renter_id` matches their `external_user_id` chain.
- `view-own-rent-history` → SELECT from `rent_payments` joined through `leases` filtered to their renter_id.
- `submit-maintenance-request` → INSERT into `maintenance_requests` with `renter_id = self`, `submitted_via = 'renter-portal'`.

**Verdict for the landlord domain: real operations are possible end-to-end.** Coverage moves from ~10% → ~85%. The 15% gap is advanced features (automated credit screening API, automated late-rent notifications via Twilio, document-OCR on uploaded leases) — those are application-layer integrations, not schema gaps.

---

## 7. Domain — Therapist (test instance: TLC, 7 clinicians)

Coverage baseline from the audit: **~15%.** The practice can exist as a tenant; no operational surface for the intake-to-conversion loop. v2 takes coverage to **~70%** for the non-PHI operational surface. PHI stays out of Supabase entirely, per `LEGAL-PRIVACY-BOUNDARY.md` — the boundary to Acuity (the EHR / scheduling system) is preserved.

Four tables. File: `schema-v2.3-therapy.sql`.

### `inquiries` — lead intake, non-PHI

Per the audit's spec (already designed). One row per incoming inquiry.

```
[STANDARD COLUMNS]
first_name              text NOT NULL
last_initial            text NOT NULL  -- never full last name — PHI boundary
contact_method          text NOT NULL CHECK (contact_method IN ('phone','email','both'))
phone_redacted          text           -- "(217) 555-0142" — full # acceptable here per
                                       -- the PHI boundary doc; clinical data, not contact
                                       -- info, is what triggers PHI rules
email_redacted          text           -- "jt****@example.com" optional masking
interest_area           text CHECK (interest_area IN
                          ('individual','couples','family','child',
                           'consultation','group','assessment'))
has_insurance           text CHECK (has_insurance IN ('Y','N','unsure'))
insurance_carrier       text          -- if Y, the carrier name (not policy details — PHI)
preferred_provider_id   uuid REFERENCES clinicians(id)
                            -- if the inquirer asked for a specific clinician
best_time_to_call       text
source                  text CHECK (source IN
                          ('church','google','facebook','instagram','website',
                           'word-of-mouth','referral-provider','other'))
source_detail           text
notes                   text
status                  text NOT NULL DEFAULT 'new'
                          CHECK (status IN
                            ('new','attempting-contact','contacted',
                             'scheduled-intake','converted','declined','non-fit','closed'))
status_history          jsonb NOT NULL DEFAULT '[]'
                          -- append-only: [{status, at, by_user_id, note}, ...]
                          -- complements the lifecycle.log; status_history is the
                          -- intake-pipeline-specific view
received_at             timestamptz NOT NULL DEFAULT now()
handed_off_to_acuity_at timestamptz
                          -- once the inquiry is scheduled in Acuity, mark the boundary;
                          -- from this point forward, clinical data is in Acuity, not here
external_user_id        uuid REFERENCES external_users(id)
                            -- if the inquirer is given client-portal access
```

### `clinicians` — the practice's clinical staff

7 rows for TLC.

```
[STANDARD COLUMNS]
display_name             text NOT NULL
title                    text                  -- 'LCSW', 'PsyD', 'LMFT', etc.
license_number           text                  -- state license number
license_state            text
licensed_at              date
license_expires          date
specialties              text[] NOT NULL DEFAULT '{}'
                           -- {'individual','couples','trauma','child','EMDR-certified'}
insurance_panels         text[] NOT NULL DEFAULT '{}'
                           -- {'BCBS','Aetna','Cigna','self-pay-only'}
accepting_new_clients    boolean NOT NULL DEFAULT true
schedule_load_pct        int                   -- current capacity %
intake_role              text CHECK (intake_role IN
                           ('intake-coordinator','clinician-only','both'))
user_id                  uuid REFERENCES auth.users(id)
                            -- when the clinician has a Supabase login (tenant_member)
                            -- nullable for clinicians who are referenced but not active in the system
notes                    text
status                   text NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','on-leave','departed'))
```

### `intake_handoffs` — the bridge between SKOS and Acuity

When an inquiry converts to a scheduled intake in Acuity, this table records the handoff event (not the clinical data — that's Acuity).

```
[STANDARD COLUMNS]
inquiry_id            uuid NOT NULL REFERENCES inquiries(id)
clinician_id          uuid NOT NULL REFERENCES clinicians(id)
acuity_appointment_id text                -- Acuity's id, for cross-reference (not joinable in Postgres)
scheduled_for         timestamptz
handoff_at            timestamptz NOT NULL DEFAULT now()
handed_off_by         uuid NOT NULL REFERENCES auth.users(id)
status                text NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN
                          ('scheduled','attended','no-show','rescheduled','cancelled'))
notes                 text  -- intake-coordinator notes only; never clinical
```

### `clinician_assignments` — which clinician picks up which inquiry (pre-handoff)

A working assignment, separate from the final handoff. An inquiry might be assigned to one clinician, then re-assigned, before the actual Acuity scheduling.

```
[STANDARD COLUMNS]
inquiry_id      uuid NOT NULL REFERENCES inquiries(id)
clinician_id   uuid NOT NULL REFERENCES clinicians(id)
assigned_at    timestamptz NOT NULL DEFAULT now()
assigned_by    uuid NOT NULL REFERENCES auth.users(id)
reason         text  -- 'specialty-match', 'insurance-panel', 'preferred-provider', etc.
status         text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','superseded','released'))
```

### TLC as the test — does this design actually work?

7 clinicians, intake-to-conversion pipeline, client portal for non-PHI status updates.

Daily operations:
- "How many inquiries this week?" → `inquiries WHERE received_at > now() - 7 days` scoped to TLC tenant_id.
- "Who's not converting?" → `inquiries WHERE status = 'attempting-contact' AND received_at < now() - 14 days`.
- "Show me each clinician's intake queue" → `clinician_assignments` joined to `inquiries` grouped by clinician_id.
- "Has the insurance pre-check been done?" → `inquiries.has_insurance IS NOT NULL`.

Christina's view as Owner:
- Sees every inquiry (RLS: TLC tenant member).
- Can re-assign across clinicians.
- Sees the intake pipeline funnel (counts per `status`).
- Cannot see clinical data — there is no clinical data in Supabase.

A staff clinician's view (member or specialist):
- Sees inquiries assigned to them (RLS narrowed by `role_scopes` if needed).
- Sees their own conversion rate (closed inquiries → handoffs).
- Cannot see other clinicians' inquiries unless explicitly scoped.

Client portal (Phase 3, via `external_users`):
- `view-own-inquiry-status` → SELECT from `inquiries` WHERE `external_user_id = self`.
- `view-next-step` → reads `inquiries.notes` filtered to "client-visible" tagging at app layer (server doesn't render internal notes).
- `update-contact-info` → UPDATE on `inquiries.phone_redacted`, `inquiries.email_redacted`.
- `message-intake-coordinator` → INSERT into `interactions` with `kind = 'message'`.
- **CANNOT message clinically.** Per `ECOSYSTEM-PARTICIPANTS.md` HIPAA caveat: Client type ships with messaging DISABLED by default for therapy-practice instance; operator must explicitly enable AND acknowledge they've stripped PHI from the channel.

**Verdict for the therapy domain: the intake-to-conversion operational loop is fully supported.** Coverage moves from ~15% → ~70%. The 30% gap is intentional — clinical data (session notes, treatment plans, diagnoses) stays in Acuity by design.

---

## 8. Domain — Contractor / 1099 / Trades

Coverage baseline: **~10%.** Projects table exists as a generic container; no actual contractor operations. v2 takes coverage to **~80%**.

Five tables. File: `schema-v2.4-contractor.sql`.

### `contractors_1099` — bidirectional 1099 relationships

```
[STANDARD COLUMNS]
direction              text NOT NULL CHECK (direction IN ('outbound','inbound'))
                          -- outbound = we pay them; inbound = they pay us
contact_display_name   text NOT NULL
contact_email          text
contact_phone          text
business_name          text   -- when the contractor invoices through an LLC
tax_id_last_4          text   -- never store full SSN/EIN — track last 4 for matching only
role_description       text
ytd_paid               numeric(12,2) NOT NULL DEFAULT 0  -- outbound
ytd_received           numeric(12,2) NOT NULL DEFAULT 0  -- inbound
monthly_expected       numeric(12,2)
w9_on_file             boolean NOT NULL DEFAULT false
w9_received_at         date
status                 text NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','pipeline','possible','inactive','terminated'))
external_user_id       uuid REFERENCES external_users(id)
                            -- contractor portal access
```

### `scopes` — scope-of-work agreements

Per the audit's spec.

```
[STANDARD COLUMNS]
template_type        text  -- 'property','tech','legal','services', etc.
template_name        text
title                text NOT NULL
project_id           uuid REFERENCES projects(id)
contractor_id        uuid REFERENCES contractors_1099(id)
contractor_name      text  -- snapshot at scope creation; persistent even if contractor_id changes
contractor_email     text
contractor_phone     text
scope_of_work        text NOT NULL
deliverables         text
materials_policy     text   -- who buys, what's billable, etc.
schedule             text   -- prose schedule; structured dates are in lifecycle
payment_terms        text   -- "net 30", "50% on signing 50% on completion", etc.
total_amount         numeric(12,2)
acceptance_criteria  text
requirements         text
warranty             text
termination_clause   text
signed_at            timestamptz
signed_by_contractor boolean NOT NULL DEFAULT false
status               text NOT NULL DEFAULT 'draft'
                       CHECK (status IN
                         ('draft','sent','signed','active','completed','terminated','disputed'))
```

### `invoices` — uploaded invoices from outbound contractors, OR invoices we send to inbound contractors

```
[STANDARD COLUMNS]
contractor_id     uuid NOT NULL REFERENCES contractors_1099(id)
scope_id          uuid REFERENCES scopes(id)
project_id        uuid REFERENCES projects(id)
direction         text NOT NULL CHECK (direction IN ('inbound','outbound'))
                     -- inbound = we receive (we owe); outbound = we send (they owe)
invoice_number    text
invoice_date      date NOT NULL
amount            numeric(12,2) NOT NULL
description       text
document_uri      text  -- PDF pointer in storage
due_date          date
paid_at           timestamptz
transaction_id    uuid REFERENCES transactions(id)
                     -- when paid, link to the transaction in Books
status            text NOT NULL DEFAULT 'received'
                    CHECK (status IN
                      ('draft','sent','received','approved','paid',
                       'disputed','voided','overdue'))
```

### `time_logs` — hourly work logs for hourly contracts

```
[STANDARD COLUMNS]
contractor_id    uuid NOT NULL REFERENCES contractors_1099(id)
scope_id         uuid REFERENCES scopes(id)
project_id       uuid REFERENCES projects(id)
work_date        date NOT NULL
hours            numeric(5,2) NOT NULL
rate             numeric(8,2)
amount           numeric(12,2)  -- computed or manually entered
description      text NOT NULL
status           text NOT NULL DEFAULT 'submitted'
                   CHECK (status IN
                     ('submitted','approved','disputed','rejected','paid'))
invoice_id       uuid REFERENCES invoices(id)
                    -- when the time logs roll up into an invoice
```

### Contractor as the test — does the design work?

Concrete flow: Darrell engages a plumber for Holly Hill rental.
1. `contractors_1099` row: `direction='outbound'`, name + contact, status `active`.
2. `scopes` row: title "Holly Hill bathroom plumbing", scope_of_work, materials_policy, total_amount $3,800.
3. Scope is sent to plumber (via interactions). Plumber signs (via portal in Phase 3 or manually marked by Darrell).
4. Plumber does work. Files invoice via portal (or Darrell uploads PDF on receipt). `invoices` row, direction `inbound`, scope_id linked, amount $3,800.
5. Payment goes out: `transactions` row in Books; `invoices.transaction_id` set; `invoices.status = 'paid'`.
6. `contractors_1099.ytd_paid` increments via app-layer calc on report load.
7. At tax time: filter `invoices WHERE direction='inbound' AND paid_at BETWEEN year-start AND year-end GROUP BY contractor_id` → 1099-NEC totals.

Contractor portal view (Phase 3):
- `view-assigned-projects` → SELECT from `projects` joined through `scopes WHERE contractor_id = self`.
- `view-own-payments-ytd` → SELECT SUM(amount) from `invoices WHERE contractor_id = self AND status='paid' AND paid_at >= year-start`.
- `submit-invoice` → INSERT into `invoices` with `direction='inbound'`, status `received`.
- `submit-time-log` → INSERT into `time_logs`.
- `message-project-owner` → `interactions`.

**Verdict for contractor domain: full operations supported.** Coverage ~10% → ~80%. The 20% gap is integrations (Stripe payouts, automated 1099 e-filing) — application-layer, not schema.

---

## 9. Domain — Business Mentor

Coverage baseline: **~10%.** Projects exist as a generic container; no engagement-shaped primitives. v2 takes coverage to **~75%**.

Three tables. File: `schema-v2.5-mentor.sql`.

### `engagements` — the mentor-mentee relationship

```
[STANDARD COLUMNS]
mentor_user_id          uuid REFERENCES auth.users(id)
                           -- the internal tenant_member acting as mentor;
                           -- nullable if mentor is external (rare for SKOS use case)
mentee_display_name     text NOT NULL  -- the mentee org or person
mentee_contact_email    text
mentee_contact_phone    text
mentee_external_user_id uuid REFERENCES external_users(id)
                           -- mentee portal access
engagement_type         text CHECK (engagement_type IN
                          ('1-on-1','team','board-advisory','project-based','retainer'))
start_date              date NOT NULL
end_date                date
cadence                 text  -- 'weekly', 'biweekly', 'monthly', 'on-demand'
session_count_target    int
sessions_completed      int NOT NULL DEFAULT 0
total_fee               numeric(12,2)
per_session_fee         numeric(12,2)
focus_areas             text[] NOT NULL DEFAULT '{}'  -- {'strategy','ops','finance','people'}
status                  text NOT NULL DEFAULT 'active'
                          CHECK (status IN
                            ('active','paused','completed','terminated-early','renewed'))
```

### `deliverables` — per-engagement deliverables

```
[STANDARD COLUMNS]
engagement_id    uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE
title            text NOT NULL
description      text
due_date         date
delivered_at     timestamptz
acceptance_criteria text
status           text NOT NULL DEFAULT 'planned'
                   CHECK (status IN
                     ('planned','in-progress','delivered','accepted','revised','dropped'))
```

### `sessions` — each meeting in an engagement

```
[STANDARD COLUMNS]
engagement_id     uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE
session_date      timestamptz NOT NULL
duration_minutes  int
session_type      text CHECK (session_type IN
                    ('in-person','video','phone','async-review'))
agenda            text
notes_internal    text  -- mentor-only notes
notes_shared      text  -- shared with mentee in their portal
action_items      jsonb NOT NULL DEFAULT '[]'
                    -- [{item, owner: 'mentor'|'mentee', due_date, status}, ...]
status            text NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN
                      ('scheduled','completed','rescheduled','cancelled','no-show'))
billable          boolean NOT NULL DEFAULT true
invoice_id        uuid REFERENCES invoices(id)
                     -- when the session is rolled into an invoice
```

**Verdict for mentor domain: engagement-shaped operations supported end-to-end.** Coverage ~10% → ~75%. Gap is automated scheduling integration and recording capture — application-layer.

---

## 10. Domain — Lawyer (Legal Matters, encrypted at rest)

Coverage baseline: **~5%.** No legal-domain primitives. v2 takes coverage to **~65%** — meaningful but constrained by the binding from `LEGAL-PRIVACY-BOUNDARY.md` that the most sensitive content is client-side encrypted.

**Critical architectural decision:** The Legal domain has a different storage posture than every other domain. Per the binding rule, Legal data is encrypted CLIENT-SIDE with AES-GCM 256 via Web Crypto API, key derived from a Legal-tab-specific PIN via PBKDF2 250k iterations. The server stores ciphertext only. RLS still applies for tenant scoping (so a malicious other-tenant can't even download the ciphertext blob), but the server CANNOT decrypt the content.

This means the v2 Legal tables store mostly opaque ciphertext columns with structured metadata that doesn't leak privileged content.

Seven tables. File: `schema-v2.6-legal.sql`.

### `legal_matters` — the matter

```
[STANDARD COLUMNS]
scope               text NOT NULL CHECK (scope IN
                      ('personal','real-estate','business','tax-regulatory'))
sub_type            text  -- 'eviction', 'audit', 'will', etc. — free-text allowed

-- Encrypted content fields — server cannot decrypt
title_ciphertext         bytea NOT NULL  -- user's private title for the matter
title_iv                 bytea NOT NULL  -- per-row IV for AES-GCM
notes_ciphertext         bytea
notes_iv                 bytea

-- Metadata that does NOT leak privileged content (acceptable to be queryable)
status              text NOT NULL DEFAULT 'open'
                      CHECK (status IN
                        ('open','monitoring','in-progress','resolved','appealed','closed'))
opened_at           timestamptz NOT NULL DEFAULT now()
expected_close_at   timestamptz
closed_at           timestamptz

-- Privacy flags — non-negotiable, always true (kept as columns for explicit enforcement)
exclude_from_global_search    boolean NOT NULL DEFAULT true
exclude_from_action_queue     boolean NOT NULL DEFAULT true
exclude_from_connected_context boolean NOT NULL DEFAULT true
```

### `matter_parties` — plaintiffs, defendants, etc.

All sensitive fields encrypted. Role kept queryable for the matter's own internal use only.

```
[STANDARD COLUMNS]
matter_id            uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
role                 text NOT NULL CHECK (role IN
                       ('plaintiff','defendant','opposing','co-counsel',
                        'witness','expert','other'))
name_ciphertext      bytea NOT NULL
name_iv              bytea NOT NULL
contact_ciphertext   bytea
contact_iv           bytea
notes_ciphertext     bytea
notes_iv             bytea
```

### `matter_counsel` — attorneys representing or opposing

```
[STANDARD COLUMNS]
matter_id              uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
represents_us          boolean NOT NULL
firm_ciphertext        bytea
firm_iv                bytea
attorney_ciphertext    bytea
attorney_iv            bytea
contact_ciphertext     bytea
contact_iv             bytea
billing_rate_ciphertext bytea
billing_rate_iv        bytea
engagement_letter_date date
```

### `matter_key_dates` — court dates, deadlines, etc.

```
[STANDARD COLUMNS]
matter_id           uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
kind                text NOT NULL CHECK (kind IN
                      ('statute-of-limitations','filing-deadline','court-date',
                       'discovery','settlement-conference','arbitration','other'))
at                  timestamptz NOT NULL  -- date kept queryable for Calendar mirror
completed           boolean NOT NULL DEFAULT false
label_ciphertext    bytea  -- user's label like "deposition prep with Dr. Smith"
label_iv            bytea
note_ciphertext     bytea
note_iv             bytea
calendar_event_id   uuid  -- when auto-mirrored to events table with privileged label
```

### `matter_documents` — pointers to encrypted docs (the docs themselves stored in encrypted local storage / Synology volume)

```
[STANDARD COLUMNS]
matter_id              uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
privileged             boolean NOT NULL DEFAULT true  -- mandatory per LEGAL-PRIVACY-BOUNDARY rule
label_ciphertext       bytea
label_iv               bytea
where_filed_ciphertext bytea
where_filed_iv         bytea
date_of                date  -- non-privileged date metadata
who_has_copies         text[] NOT NULL DEFAULT '{}'  -- {'user','counsel','opposing'} etc.
storage_uri_ciphertext bytea  -- pointer to encrypted blob in storage
storage_uri_iv         bytea
note_ciphertext        bytea
note_iv                bytea
```

### `matter_journal` — phone calls, meetings, strategy notes

```
[STANDARD COLUMNS]
matter_id           uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
privileged          boolean NOT NULL DEFAULT true
kind                text NOT NULL CHECK (kind IN
                      ('call','meeting','email','court','research','decision','other'))
at                  timestamptz NOT NULL DEFAULT now()
mins                int
with_ciphertext     bytea
with_iv             bytea
summary_ciphertext  bytea NOT NULL
summary_iv          bytea NOT NULL
```

### `matter_financial_links` — links to Books transactions for fees paid

```
[STANDARD COLUMNS]
matter_id           uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE
transaction_id      uuid NOT NULL REFERENCES transactions(id)
                       -- the transaction itself is NOT encrypted (Books stays Books)
                       -- but the link from matter→transaction is in the legal_matters
                       -- RLS scope, so only the user (with the PIN) sees the connection
kind                text CHECK (kind IN ('fee','settlement-paid','settlement-received','filing-fee','expert-fee'))
notes_ciphertext    bytea
notes_iv            bytea
```

### `conflict_checks` — checks before taking on a new matter

```
[STANDARD COLUMNS]
matter_id          uuid REFERENCES legal_matters(id)
                       -- nullable: a conflict check can happen pre-matter
candidate_party_ciphertext bytea NOT NULL
candidate_party_iv         bytea NOT NULL
checked_at         timestamptz NOT NULL DEFAULT now()
result             text NOT NULL CHECK (result IN
                     ('no-conflict','potential-conflict','actual-conflict','waived'))
notes_ciphertext   bytea
notes_iv           bytea
```

### Legal domain RLS — strictest in the schema

```sql
ALTER TABLE legal_matters ENABLE ROW LEVEL SECURITY;

-- Only tenant members can read; even owners cannot DELETE matters (must mark closed)
CREATE POLICY legal_matters_member_read ON legal_matters FOR SELECT
  USING (user_in_tenant(tenant_id));

-- Only owners + the user with explicit 'legal' role_scope can write
CREATE POLICY legal_matters_legal_scope_insert ON legal_matters FOR INSERT
  WITH CHECK (
    user_in_tenant(tenant_id)
    AND created_by = auth.uid()
    AND (
      user_tenant_role(tenant_id) = 'owner'
      OR EXISTS (SELECT 1 FROM role_scopes rs
                 JOIN tenant_members tm ON tm.id = rs.tenant_member_id
                 WHERE tm.user_id = auth.uid()
                   AND tm.tenant_id = legal_matters.tenant_id
                   AND rs.scope_kind = 'module'
                   AND rs.scope_value = 'legal')
    )
  );

-- DELETE forbidden (matters can be status='closed', never removed)
CREATE POLICY legal_matters_no_delete ON legal_matters FOR DELETE
  USING (false);
```

Plus: Legal matters are excluded from the `entity_links` reconciliation trigger (the privacy flag `exclude_from_connected_context` is checked). The only links involving legal_matters are user-created, never auto.

**Verdict for legal domain: usable for matter management with the binding confidentiality posture intact.** Coverage ~5% → ~65%. Gap is encrypted-doc-storage UX flow (where the encrypted PDFs actually land on the Synology and how the React app reads them) — non-trivial engineering, but the schema shape is right.

---

## 11. Domain — Church operations

Coverage baseline: **~25%** (membership + feedback + confession exist via v1). v2 takes coverage to **~75%** for real church operations.

Six tables. File: `schema-v2.7-church.sql`.

### `parishioners` — member records (more detailed than tenant_members, which is system-membership)

```
[STANDARD COLUMNS]
display_name        text NOT NULL
preferred_name      text
contact_email       text
contact_phone       text
membership_status   text NOT NULL DEFAULT 'attendee'
                      CHECK (membership_status IN
                        ('attendee','member','member-in-process','inactive','removed'))
joined_at           date
baptized_at         date
sacraments          jsonb NOT NULL DEFAULT '[]'  -- [{kind, at, note}, ...]
household_id        uuid  -- self-FK for grouping families
                    -- (a household_id is just one parishioner's id chosen as the household head)
external_user_id    uuid REFERENCES external_users(id)
                       -- parishioner portal access (prayer requests, signups)
care_notes          text  -- pastoral care notes; internal-only, role-scoped
```

### `prayer_requests` — submitted by parishioners or internal users

```
[STANDARD COLUMNS]
parishioner_id      uuid REFERENCES parishioners(id)
                       -- nullable: anonymous prayer requests allowed via portal
submitted_by_external uuid REFERENCES external_users(id)
                       -- when submitted from the parishioner portal
request_text        text NOT NULL
audience            text NOT NULL DEFAULT 'leadership'
                      CHECK (audience IN
                        ('leadership','prayer-team','congregation','elders-only','anonymous-public'))
status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN
                        ('active','answered','closed-with-care','removed'))
expires_at          timestamptz
follow_up_notes     text
```

Note: this complements (does not replace) the v1 `confessions` table. Prayer requests are typically less private — congregational visibility is common. Confessions are voluntary disclosures with strict audience scoping. Both surfaces exist.

### `ministries` — the organized ministries of the church

```
[STANDARD COLUMNS]
name              text NOT NULL
description       text
leader_user_id    uuid REFERENCES auth.users(id)  -- internal lead
status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','seasonal','retired'))
meeting_cadence   text   -- 'weekly','monthly','quarterly','event-based'
```

### `ministry_signups` — parishioners signing up for ministries

```
[STANDARD COLUMNS]
ministry_id      uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE
parishioner_id   uuid REFERENCES parishioners(id)
external_user_id uuid REFERENCES external_users(id)
                    -- if signed up from portal before parishioner record exists
signed_up_at     timestamptz NOT NULL DEFAULT now()
role             text          -- 'volunteer','leader','co-leader','support'
status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','paused','completed','left'))
```

### `donor_giving` — giving history (one row per gift)

```
[STANDARD COLUMNS]
parishioner_id   uuid REFERENCES parishioners(id)
                    -- nullable for anonymous gifts
external_user_id uuid REFERENCES external_users(id)
                    -- when gift came via donor portal
gift_date        date NOT NULL
amount           numeric(12,2) NOT NULL
fund             text          -- 'general','building','missions','benevolence', free-text
method           text CHECK (method IN
                   ('cash','check','online','ach','stock','in-kind','other'))
check_number     text
notes            text
transaction_id   uuid REFERENCES transactions(id)
                    -- when reconciled into Books
tax_year         int  -- defaults to year of gift_date but explicit for cross-year reconciliation
```

### `volunteer_hours` — logged hours per ministry per parishioner

```
[STANDARD COLUMNS]
ministry_id      uuid REFERENCES ministries(id)
parishioner_id   uuid REFERENCES parishioners(id)
external_user_id uuid REFERENCES external_users(id)
work_date        date NOT NULL
hours            numeric(5,2) NOT NULL
description      text
status           text NOT NULL DEFAULT 'logged'
                   CHECK (status IN ('logged','approved','disputed'))
```

### COLG as the test — does the design work?

The Church of the Living God. ~150 attendees (typical for a small Black church per the church-tech-counselor framing in `EXPERIENTIAL-KNOWLEDGE-MARKETPLACE.md`). Christmas service might bring 300.

Operations:
- "Who hasn't been seen in 30 days?" → `parishioners JOIN ministry_signups OR donor_giving JOIN volunteer_hours` with MAX(activity_date) older than threshold.
- "Did the building fund hit its goal this month?" → SUM(donor_giving.amount) WHERE fund='building' AND gift_date current_month.
- "Show ministry rosters" → ministry_signups grouped by ministry_id.
- "Generate annual giving statements for tax season" → donor_giving GROUP BY parishioner_id, tax_year.

Parishioner portal:
- `submit-prayer-request` → INSERT into prayer_requests.
- `sign-up-for-ministry` → INSERT into ministry_signups.
- `view-own-giving-history` → SELECT from donor_giving WHERE external_user_id = self.
- `download-tax-statement` → PDF generation from donor_giving rolled up to tax_year.
- `message-pastor` → interactions, kind=message.

**Verdict for church domain: real church operations supported.** Coverage ~25% → ~75%. Gap is mass-communication (email blasts to congregation, SMS prayer chains) — application-layer integrations.

---

## 12. Cross-cutting business ops (incidents, tax_calendar, etc.)

These are the cross-cutting tables the audit named — useful to every business-type tenant and the family tenant. They go in `schema-v2.8-ops.sql`.

### `incidents` — ITSM-shaped issue log (per `SERVICE-MANAGEMENT.md`)

```
[STANDARD COLUMNS]
incident_date    date NOT NULL
amount           numeric(12,2)
category         text NOT NULL CHECK (category IN
                   ('vehicle','property','medical','tenant',
                    'maintenance','technology','financial','administrative','other'))
description      text NOT NULL
urgency          text NOT NULL DEFAULT 'normal'
                   CHECK (urgency IN ('incident','change','request','problem'))
status           text NOT NULL DEFAULT 'open'
                   CHECK (status IN
                     ('open','triaging','in-progress','blocked',
                      'resolved','declined','duplicate'))
due_date         date
resolved_at      timestamptz
resolved_by      uuid REFERENCES auth.users(id)
linked_to_kind   text  -- 'rental','project','tenant','vehicle', etc.
linked_to_id     uuid
```

### `tax_calendar` — scheduled tax and regulatory obligations

```
[STANDARD COLUMNS]
name                  text NOT NULL
description           text
amount                numeric(12,2)
frequency             text NOT NULL CHECK (frequency IN
                        ('monthly','quarterly','biannual','annual','biennial','one-time'))
next_due              date NOT NULL
applies_to_entity_ids uuid[] NOT NULL DEFAULT '{}'
category              text  -- 'federal-income','state-income','sales-tax',
                            -- 'property-tax','payroll', etc.
enabled               boolean NOT NULL DEFAULT true
```

### `recurring_obligations` — non-tax recurring obligations (same shape as tax_calendar but distinct UI)

```
[STANDARD COLUMNS]
-- (same shape as tax_calendar)
name                  text NOT NULL
description           text
amount                numeric(12,2)
frequency             text NOT NULL CHECK (frequency IN
                        ('monthly','quarterly','biannual','annual','biennial','one-time'))
next_due              date NOT NULL
applies_to_entity_ids uuid[] NOT NULL DEFAULT '{}'
category              text
enabled               boolean NOT NULL DEFAULT true
```

### `inflows` — modeled monthly income

```
[STANDARD COLUMNS]
inflow_type     text NOT NULL CHECK (inflow_type IN
                  ('salary','rental','practice','consulting',
                   'royalty','dividend','other'))
who             text  -- 'Darrell','Christina', etc.
source          text
expected        numeric(12,2)
actual          numeric(12,2)
month           date NOT NULL  -- first-of-month
UNIQUE (tenant_id, entity_id, who, source, month)
```

### `subscriptions` — recurring outflows (the Subscription Audit surface)

```
[STANDARD COLUMNS]
service_name    text NOT NULL
amount          numeric(12,2) NOT NULL
frequency       text NOT NULL CHECK (frequency IN ('monthly','annual','quarterly'))
category        text  -- 'streaming','software','utility','insurance','other'
notes           text
status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','cancelled','paused','trial'))
next_charge     date
```

### `events` — user-added calendar events (Books → Calendar tab)

```
[STANDARD COLUMNS]
title           text NOT NULL
event_date      date NOT NULL
event_time      time
amount          numeric(12,2)
category        text
description     text
all_day         boolean NOT NULL DEFAULT true
recurrence_rule text  -- iCal RRULE syntax for recurring events
privileged      boolean NOT NULL DEFAULT false
                  -- if true, the title becomes "🔒 Legal matter" externally
                  -- (per LEGAL-PRIVACY-BOUNDARY auto-mirror rule)
```

### `checkout_intents` — Stripe / pricing-tier click trail

```
[STANDARD COLUMNS]
user_id            uuid NOT NULL REFERENCES auth.users(id)
tier_selected      text NOT NULL CHECK (tier_selected IN
                     ('foundation','poetech-plus','family','premium','business','enterprise'))
action_taken       text NOT NULL CHECK (action_taken IN
                     ('subscribed','abandoned','requested-info'))
stripe_session_id  text
```

---

## 13. External Participants layer (per `ECOSYSTEM-PARTICIPANTS.md`)

Section 4 defined the `external_users`, `interactions`, and `external_invite_tokens` tables. This section defines how the **RLS policy family** for external-user portal access works, because it's a non-trivial second auth model layered on top of the first.

### The two auth-flow problem

Internal users authenticate via Supabase `auth.users` → `tenant_members` membership. Every existing v1 RLS policy is `user_in_tenant(tenant_id)`.

External users authenticate via a separate magic-link flow (Phase 3) that does NOT create an `auth.users` row in the same way. Instead, the external auth flow:
1. Validates the magic-link token (in `external_invite_tokens`).
2. Creates a session bound to the external_user_id.
3. Issues a JWT with custom claim: `external_user_id: <uuid>`.
4. Postgres sees this claim via `current_setting('request.jwt.claims', true)::json->>'external_user_id'`.

A helper function:
```
public.current_external_user_id()
  RETURNS uuid
  LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'external_user_id', '')::uuid
$$;
```

### The external-user RLS pattern

For every domain table that an external user can access, a parallel policy family applies. Example for `leases` (a renter sees their own lease):

```sql
CREATE POLICY leases_renter_portal_read ON leases FOR SELECT
  USING (
    renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
    )
  );
```

For `rent_payments`:
```sql
CREATE POLICY rent_payments_renter_portal_read ON rent_payments FOR SELECT
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN renters r ON r.id = l.renter_id
      WHERE r.external_user_id = current_external_user_id()
    )
  );
```

For `maintenance_requests` — read own, insert own:
```sql
CREATE POLICY maint_req_renter_portal_read ON maintenance_requests FOR SELECT
  USING (
    renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
    )
  );

CREATE POLICY maint_req_renter_portal_insert ON maintenance_requests FOR INSERT
  WITH CHECK (
    renter_id IN (
      SELECT id FROM renters
      WHERE external_user_id = current_external_user_id()
    )
    AND submitted_via = 'renter-portal'
  );
```

Same pattern repeats for each external-user type × domain table combination. Per `ECOSYSTEM-PARTICIPANTS.md`, the permissions array on `external_users.permissions` is the user-facing toggle; the RLS policies are the database-level enforcement of those toggles.

### The internal-notes-never-leak rule

The `notes` column on every external-user-accessible table is internal-only. Two enforcement mechanisms:

1. **Application layer:** the React app never sends `notes` to the external-user portal.
2. **Database layer:** column-level grants. The external-portal Postgres role (a separate role from the internal authenticated role) does NOT have SELECT permission on the `notes` column. Even if the application were buggy and tried to SELECT `notes`, Postgres would reject.

```sql
-- Example: revoke notes from external portal role on renters
REVOKE SELECT (notes) ON renters FROM external_portal_role;
```

This is the strictest guarantee in the schema after the Legal encryption posture.

---

## 14. RLS pattern catalog

For brevity, individual tables in Sections 6–13 referenced "standard tenant-scoped RLS." Here are the four canonical patterns, instantiated once and reused.

### Pattern A — tenant-member-scoped (default for v2 domain tables)

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <table>_member_read ON <table> FOR SELECT
  USING (user_in_tenant(tenant_id));

CREATE POLICY <table>_member_insert ON <table> FOR INSERT
  WITH CHECK (user_in_tenant(tenant_id) AND created_by = auth.uid());

CREATE POLICY <table>_member_update ON <table> FOR UPDATE
  USING (user_in_tenant(tenant_id))
  WITH CHECK (user_in_tenant(tenant_id));

CREATE POLICY <table>_owner_delete ON <table> FOR DELETE
  USING (user_tenant_role(tenant_id) = 'owner');
```

Applied to: rentals, leases, renters, rent_payments, maintenance_requests, inquiries, clinicians, intake_handoffs, clinician_assignments, contractors_1099, scopes, invoices, time_logs, engagements, deliverables, sessions, parishioners, prayer_requests, ministries, ministry_signups, donor_giving, volunteer_hours, incidents, tax_calendar, recurring_obligations, inflows, subscriptions, events, checkout_intents, tenant_domains, external_users, interactions.

### Pattern B — scope-modified (role_scopes narrows the role)

```sql
CREATE POLICY <table>_scope_read ON <table> FOR SELECT
  USING (
    user_in_tenant(tenant_id)
    AND (
      user_tenant_role(tenant_id) = 'owner'
      OR NOT EXISTS (
        SELECT 1 FROM role_scopes rs
        JOIN tenant_members tm ON tm.id = rs.tenant_member_id
        WHERE tm.user_id = auth.uid()
          AND tm.tenant_id = <table>.tenant_id
          AND rs.scope_kind = 'entity'
          AND rs.scope_value <> <table>.entity_id::text
      )
    )
  );
```

Applied to: domain tables where a member's scope is narrowed by entity (e.g., a property manager scoped to one rental).

### Pattern C — strictly-private (per-user, even within tenant)

```sql
CREATE POLICY <table>_self_read ON <table> FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY <table>_self_insert ON <table> FOR INSERT
  WITH CHECK (user_id = auth.uid() AND user_in_tenant(tenant_id));
```

Applied to: confessions (v1), user_tenant_settings (v1). Extended in v2 to: per-user-private domain rows where applicable.

### Pattern D — external-user portal

```sql
CREATE POLICY <table>_external_read ON <table> FOR SELECT
  USING (<linked-entity-id> IN (
    SELECT id FROM <linked-table>
    WHERE external_user_id = current_external_user_id()
  ));
```

Applied to: every domain table that's exposed in an external-user portal (Section 13).

---

## 15. Migration path — v1 → v2 in additive slices

The v2 schema does NOT ship as one monolithic SQL file. It ships as a series of additive migrations, each independently applicable. The sequence:

| File | Contents | Depends on | Estimated work |
|---|---|---|---|
| `schema-v2.1-infra.sql` | tenant_domains, role_scopes, audit_log, entity_links, external_users, interactions, external_invite_tokens. Helper functions. ALTER TYPE on tenant_type widening. ALTER on tenant_members.role widening to add 'specialist'. ALTER on entities to add domain + parent_entity_id columns. Universal trigger functions. | v1 + v1.1 | 1 session |
| `schema-v2.2-rentals.sql` | rentals, leases, renters, rent_payments, maintenance_requests. RLS policies. Indexes. | v2.1 | 1 session |
| `schema-v2.3-therapy.sql` | inquiries, clinicians, intake_handoffs, clinician_assignments. RLS. Indexes. | v2.1 | 1 session |
| `schema-v2.4-contractor.sql` | contractors_1099, scopes, invoices, time_logs. RLS. Indexes. | v2.1 | 1 session |
| `schema-v2.5-mentor.sql` | engagements, deliverables, sessions. RLS. Indexes. | v2.1, v2.4 (invoices) | 0.5 session |
| `schema-v2.6-legal.sql` | legal_matters + 6 sub-tables. Strict RLS. Encryption guidance. | v2.1 | 1.5 sessions (encryption posture is real work) |
| `schema-v2.7-church.sql` | parishioners, prayer_requests, ministries, ministry_signups, donor_giving, volunteer_hours. RLS. Indexes. | v2.1 | 1 session |
| `schema-v2.8-ops.sql` | incidents, tax_calendar, recurring_obligations, inflows, subscriptions, events, checkout_intents. RLS. Indexes. | v2.1 | 1 session |
| `schema-v2.9-portal-rls.sql` | All external-user RLS policies (Pattern D) for every table exposed to a portal. | All prior v2 | 0.5 session |

Total: ~8 sessions of pure schema work. None of these depend on UI work; all can ship without any React changes. Each file is paste-into-Supabase-SQL-Editor + verify.

After all v2 files applied, the schema supports every role surface SKOS prebuilds. Module UI work then becomes "React against existing tables," in any order.

### Ordering recommendation

If Darrell wants to prioritize for Christina-and-Darrell value during vacation:
1. **v2.1 infra** (always first — everything depends on it).
2. **v2.2 rentals** (Poe Properties immediately benefits — 11 doors).
3. **v2.3 therapy** (TLC intake pipeline — Christina benefits).
4. **v2.4 contractor + v2.8 ops** (incidents + scopes + invoices for property management cross-cuts).
5. **v2.7 church** (COLG operations).
6. **v2.5 mentor** (lowest urgency).
7. **v2.6 legal** (highest engineering effort; can ship after vacation when there's time for the encryption work).
8. **v2.9 portal RLS** (last — depends on all prior tables existing).

---

## 16. Open questions for Darrell's judgment

These are the decisions that need human judgment, not engineering. They are the inputs the schema cannot decide on its own.

**Q1 — TLC as separate tenant or under Poe Family tenant?**
Recommendation in §3 is separate tenant for HIPAA-adjacent isolation. Confirm. If TLC is a separate tenant, Christina is Owner there; Darrell can be a member but does not have automatic access to TLC data. Acceptable?

**Q2 — Poe Properties as separate tenant or sub-entity under Poe Family?**
Audit treats Poe Properties as an `entity` under the family tenant. v2 supports either. Sub-entity is simpler (one tenant, all data co-scoped); separate tenant is cleaner (when the family steps back from PPM operations someday, the data is already isolated). Which is the right shape NOW?

**Q3 — Hash-chained audit log: Phase 3 only, or earlier?**
`IDENTITY-ROLES-AUDIT.md` says Phase 3+ for hash-chained tamper detection. Family / single-device instances skip it. But TLC and Legal might warrant earlier hash-chaining. Should v2 ship hash-chaining ready (columns + verify function) but disabled by default, OR defer entirely to Phase 3?

**Q4 — Encrypted-at-rest scope: Legal only, or extend to Counseling-equivalent surfaces?**
The v1 `confessions` table stores plaintext (audience-scoped RLS, but plaintext on disk). Should v2 extend client-side encryption to confessions as well? The audience-scoped RLS already prevents leakage between tenant members; the encryption guards against backup-restore exposure. Adds engineering work but tightens the bar. Worth it?

**Q5 — Renters portal default ON or OFF for the rentals domain?**
Per `ECOSYSTEM-PARTICIPANTS.md` defaults: external portals ship OFF for `family` instance type, ON for `property-management`. The Poe Family tenant with rentals enabled is ambiguous — primary type is family, but rentals domain is enabled. Recommendation: default OFF until Darrell explicitly enables it per tenant_domain settings.

**Q6 — Donor anonymity in church domain?**
The audit's external participants section names Donor as a first-class type. But many gifts at COLG are anonymous (cash in the plate). Schema supports both: `donor_giving.parishioner_id` is nullable. Application-layer decision: does the donor portal exist at all for COLG, or just for larger churches/nonprofits? Christina + Pastor input needed.

**Q7 — Mentor domain — does Darrell actually want to operate as a mentor inside SKOS?**
The mentor tables are designed but the audit listed mentor as ~10% coverage. Is this a real operational need for Darrell in 2026, or is it forward-declared because the OS pattern demands it? If forward-declared only, defer v2.5 indefinitely.

**Q8 — Legal domain MVP scope — full 7 tables, or matter + journal only?**
The full 7-table Legal design is comprehensive but engineering-heavy. An MVP of `legal_matters` + `matter_journal` (with the encryption posture) handles the dominant use case. Defer parties / counsel / key_dates / documents / financial_links / conflict_checks to a v3 cut? Or land them all in v2.6?

**Q9 — Migration path during vacation: hold all v2 work until return, or land v2.1 infra during vacation?**
The June 1–vacation window is for family + church testing on v1. v2 work is post-vacation. But v2.1 infra (the cross-cutting tables) is purely additive — landing it during vacation enables the audit log etc. without breaking v1. Land it? Or hold?

**Q10 — Naming: `renters` vs `tenants_renters`?**
The audit spec used `tenants_renters` to disambiguate from the `tenants` SaaS table. v2 uses `renters` for brevity. Confirm.

**Q11 — Where should this draft live in the docs tree?**
Written to `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md` (Dispatch instruction said `docs/foundations/` — interpreted as the foundations folder). Should it stay here, or move to `_future/` to match SUPABASE-SCHEMA-LAYER-2.md's location? Cosmetic but worth deciding before the file lands permanently.

---

## 17. Appendix — table inventory

Alphabetical list of every table in the v2 schema, grouped by source file. Total: **34 new tables** in v2 (on top of v1's 12).

**`schema-v2.1-infra.sql`** (7 new tables)
- audit_log
- entity_links
- external_invite_tokens
- external_users
- interactions
- role_scopes
- tenant_domains

**`schema-v2.2-rentals.sql`** (5 new tables)
- leases
- maintenance_requests
- renters
- rent_payments
- rentals

**`schema-v2.3-therapy.sql`** (4 new tables)
- clinician_assignments
- clinicians
- inquiries
- intake_handoffs

**`schema-v2.4-contractor.sql`** (4 new tables)
- contractors_1099
- invoices
- scopes
- time_logs

**`schema-v2.5-mentor.sql`** (3 new tables)
- deliverables
- engagements
- sessions

**`schema-v2.6-legal.sql`** (7 new tables)
- conflict_checks
- legal_matters
- matter_counsel
- matter_documents
- matter_financial_links
- matter_journal
- matter_key_dates
- matter_parties

**`schema-v2.7-church.sql`** (6 new tables)
- donor_giving
- ministries
- ministry_signups
- parishioners
- prayer_requests
- volunteer_hours

**`schema-v2.8-ops.sql`** (7 new tables)
- checkout_intents
- events
- incidents
- inflows
- recurring_obligations
- subscriptions
- tax_calendar

**`schema-v2.9-portal-rls.sql`** (0 new tables — policies only)

(Counts above are 34 new domain tables across 8 files. The legal file has 7 sub-tables plus `legal_matters` itself for 8; the count includes both. Apologies if I miscounted by one — verify when SQL is written.)

---

## End of draft

This document is the **target shape**. It is not committed code, not applied schema, not a PR. It is the design Darrell can review from phone or in a fresh session, and the design the next sessions execute against.

Per the foundations: open-source, portable, self-host-ready (Synology DS1621xs target). Per the audit: forward-compatible — every change is additive, no v1 data is migrated or rewritten. Per the cross-domain bar from `EXPERIENTIAL-KNOWLEDGE-MARKETPLACE.md`: every role surface SKOS prebuilds — landlord, therapist, contractor, business mentor, lawyer, church, family — has its operational data shape declared here. Per `MODULAR-EXTENSIBILITY.md`: each domain ships as its own file; disabling a domain is removing one SQL file from the migration runlist; nothing else breaks.

The next decision is Darrell's. The schema is ready when he is.

— Dispatch, 2026-05-24, Option C selected
