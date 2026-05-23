# Supabase Schema for Layer 2 — Multi-Tenant Sync

> **Status:** Draft, 2026-05-23. The concrete schema we install on the self-hosted Supabase running on Darrell's Synology DS1621xs. Derived from the actual `SEED_DATA` object in `app/src/poe-financial-mvp-v28.jsx` plus the new surfaces Darrell named on 2026-05-23 (Voluntary Confession, Feedback → Project pipeline, Aggregate User Analytics).

> **Hard deadline:** First-row writes happening by 2026-05-31 so the family + Church of the Living God can test from 2026-06-01 with feedback flowing back to Darrell on vacation.

---

## 1. Multi-tenancy model

Every row in every domain table carries a `tenant_id` and a `created_by` user. Row Level Security (RLS) policies enforce: a row is visible only to members of its tenant.

A **tenant** is a logical instance — the Poe family is one tenant, The Church of the Living God is another, each future church / therapy practice / contractor org is another. The same Supabase Postgres backs them all; the same React PWA serves them all (different alias portals on the Synology — `/poetech-app/`, `/church/`, etc.); the data stays scoped.

A **user** is a magic-link-authenticated Supabase auth row. A user can be a member of multiple tenants (e.g., Darrell is in the Poe family tenant AND has admin access to the COLG tenant). The `tenant_members` join table holds the relationship + role.

---

## 2. Core tables (cross-cutting — every tenant needs these)

### `tenants`
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | url-safe slug, drives the Web Station alias (`poetech-app`, `church`, etc.) |
| `display_name` | text | "Poe Family", "Church of the Living God", etc. |
| `tenant_type` | text | enum: `family`, `church`, `therapy-practice`, `contractor`, `nonprofit`, `business` |
| `created_at` | timestamptz default now() | |
| `settings` | jsonb | per-tenant config (theme override, feature flags, default-currency, etc.) |

### `tenant_members`
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants(id) | |
| `user_id` | uuid FK → auth.users(id) | |
| `role` | text | enum: `owner`, `admin`, `member`, `viewer` |
| `display_name` | text | what shows in greetings instead of "Christina" |
| `joined_at` | timestamptz default now() | |

This is the table that powers the personalized greeting. Layer 2's auth fixes the "Welcome, Christina." problem properly: the greeting reads `tenant_members.display_name` for the signed-in user in the current tenant.

### `auth.users` (provided by Supabase GoTrue)
Email magic-link sign-in. No passwords. The Supabase Auth UI handles signup/login flow; we just call `supabase.auth.signInWithOtp({ email })`.

### `tenant_invites`
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants(id) | |
| `email` | text | who's being invited |
| `role` | text | role they'll have on accept |
| `invited_by` | uuid FK → auth.users(id) | |
| `accepted_at` | timestamptz nullable | |
| `expires_at` | timestamptz | default `now() + interval '14 days'` |

---

## 3. Financial OS tables (derived from `SEED_DATA`)

Every table below has implicit columns: `id uuid PK`, `tenant_id uuid FK NOT NULL`, `created_by uuid FK → auth.users(id) NOT NULL`, `created_at timestamptz default now()`, `updated_at timestamptz`. RLS policy on every one of them: `tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())`.

### `entities`
The household + each LLC.
```
slug text unique within tenant — 'e-personal', 'e-poeprops', 'e-poetech', 'e-tlc'
display_name text
entity_type text — enum: personal | business
notes text
```

### `accounts`
Bank accounts, credit cards.
```
entity_id uuid FK → entities(id)
display_name text
institution text
account_type text — enum: checking | savings | credit | loan | investment | cash
fragment text — last-4 / "...8168"
balance numeric(12,2) — current
```

### `transactions`
Every money movement.
```
account_id uuid FK → accounts(id)
date date
amount numeric(12,2) — signed; negative = outflow
description text
category text — enum: salary | rental-income | transfer | utility | grocery | medical | etc.
is_transfer boolean default false
entity_override uuid FK → entities(id) nullable — when txn belongs to a different entity than the account's home
linked_to_kind text nullable — e.g. 'incident', 'project', 'rental', 'inquiry'
linked_to_id uuid nullable
```

### `contractors_1099`
Both outbound (paid by us) and inbound (paying us).
```
entity_id uuid FK → entities(id)
direction text — enum: outbound | inbound
contact_name text
role_description text
ytd_paid numeric(12,2) — for outbound
ytd_received numeric(12,2) — for inbound
monthly_expected numeric(12,2)
status text — enum: active | pipeline | possible | inactive
```

### `tax_calendar` and `recurring_obligations`
Two scheduling tables, similar shape.
```
name text
description text
amount numeric(12,2)
frequency text — enum: monthly | quarterly | biannual | annual | biennial | one-time
next_due date
entity_id uuid FK → entities(id)
applies_to_entity_ids uuid[] — for items that span multiple entities
category text
enabled boolean default true
```

### `incidents` (the ITSM-shaped issue log)
```
incident_date date
amount numeric(12,2)
category text — enum: vehicle | property | medical | tenant | maintenance | etc.
entity_id uuid FK → entities(id)
description text
urgency text — enum: incident | change | request | problem
status text — enum: open | in-progress | resolved | declined
due_date date
resolved_at timestamptz nullable
linked_to_kind text nullable — 'rental', 'project', 'tenant'
linked_to_id uuid nullable
```

### `rentals` and `tenants_renters`
Two tables for the rental properties + the people in them.
```
rentals:
  address text
  unit text nullable
  rent_amount numeric(12,2)
  rent_collected_this_month numeric(12,2)
  mortgage_amount numeric(12,2)
  mortgage_paid_off boolean default false
  property_taxes_annual numeric(12,2)
  insurance_annual numeric(12,2)
  notes text

tenants_renters:
  rental_id uuid FK → rentals(id)
  contact_name text
  contact_email text
  contact_phone text
  lease_start date
  lease_end date
  monthly_rent_owed numeric(12,2)
  status text — current | late | departed
```

### `scopes`
The scope-of-work tool — contractor agreements.
```
template_type text — property | tech | etc.
template_name text
title text
entity_id uuid FK → entities(id)
project_id uuid FK → projects(id) nullable
contractor_name text
contractor_email text
contractor_phone text
scope_of_work text
deliverables text
materials text
schedule text
payment_terms text
acceptance_criteria text
requirements text
warranty text
termination_clause text
status text — draft | active | completed | terminated
```

### `events`
User-added events (Books → Calendar tab).
```
title text
event_date date
amount numeric(12,2) nullable
category text
entity_id uuid FK → entities(id)
description text
```

### `projects`
The Projects tab — multi-domain workstreams.
```
title text
start_date date
end_date date
status text — planning | active | ending-soon | done | declined
domain text — family | business-poetech | business-poeprops | business-tlc | ministry | etc.
description text
hours_per_week int
entity_id uuid FK → entities(id) nullable
linked_feedback_ids uuid[] — back-references to feedback that spawned this project (see §4)
```

### `subscriptions`
Recurring monthly purchases (Cart tab → Subscription Audit).
```
service_name text
amount numeric(12,2)
frequency text — monthly | annual
entity_id uuid FK → entities(id)
category text
notes text
status text — active | cancelled | paused
```

### `checkout_intents`
Stripe / pricing-tier intent log (the "I clicked Subscribe but didn't pay yet" trail).
```
tier_selected text — foundation | poetech-plus | family | premium | business | enterprise
action_taken text — subscribed | abandoned | requested-info
stripe_session_id text nullable
```

### `inquiries`
Christina's TLC Practice pipeline (non-PHI lead capture).
```
first_name text
last_initial text — never full last name (HIPAA boundary — clinical data lives in Therapy Notes, not here)
contact_method text — phone | email
phone_redacted text — e.g. (217) 555-0142
email_redacted text — e.g. jt****@example.com
interest_area text — individual | couples | family | child | consultation
has_insurance text — Y | N | unsure
preferred_provider text
best_time_to_call text
source text — church | google | facebook | instagram | website | word-of-mouth | etc.
source_detail text
notes text
status text — new | attempting-contact | contacted | scheduled-intake | declined | converted
status_history jsonb — append-only [{status, at, notes}]
received_at timestamptz
```

### `inflows`
Monthly inflow modeling (Big Picture surface).
```
inflow_type text — salary | rental | practice | consulting | other
who text — Darrell | Christina | etc.
source text
expected numeric(12,2)
actual numeric(12,2)
entity_id uuid FK → entities(id)
month date — first-of-month
```

### `debts`
Avalanche + snowball strategies, 7-year Sabbath payoff target.
```
creditor text
type text — credit-card | personal-loan | medical | tax | family-loan | etc.
balance numeric(12,2)
apr numeric(5,2)
minimum_payment numeric(12,2)
extra_payment numeric(12,2) default 0
entity_id uuid FK → entities(id)
promo_zero_apr_until date nullable
notes text
```

---

## 4. New tables for the 2026-05-23 vision

### `feedback`
The Feedback button → modal → log surface. Every family/church member submitting feedback from any device.
```
tenant_id uuid — implicit per universal pattern
user_id uuid FK → auth.users(id)
display_name text — captured at submission time so reads don't have to re-join
device_label text — "Darrell's Z Fold 7" | "iPad" | etc. (user-editable per-device label)
app_version text — what version they were on when they submitted
which_tab text — Big Picture | Books | Debts | Real Estate | Projects | Practice | Church | etc.
feedback_text text
sentiment text nullable — user-self-tagged: love | frustrated | confused | feature-request | bug
is_confidential boolean default false — see Confession section below
submitted_at timestamptz default now()
triage_status text — new | reviewed | promoted | declined | needs-info
triage_notes text — Darrell's notes during review
promoted_to_project_id uuid FK → projects(id) nullable
```

### `confessions` (the voluntary Confession surface — James 5:16)
**Distinct from Counseling.** Counseling stays per-device + PIN-encrypted. Confession is *chosen* disclosure to the shared system at a moment the user picks. The user controls audience.
```
user_id uuid FK → auth.users(id)
audience text — enum: 'self-only' (just a record for me) | 'leadership' (church leadership / family-elders only) | 'tenant-leadership' | 'family-tenant' | 'specific-user'
specific_recipient_user_id uuid FK → auth.users(id) nullable — when audience = 'specific-user'
context text — what the user is wrestling with
scripture_anchor text nullable — a verse the user wants attached
prayer_request text nullable
follow_up_requested boolean default false
retention text — enum: 'permanent' | '90-days' | '24-hours' (user picks how long it stays in the system)
expires_at timestamptz computed from retention
submitted_at timestamptz default now()
```

RLS for `confessions` is the strictest in the schema: the row is visible ONLY to (a) the submitter, plus (b) the explicit audience the submitter chose. No tenant-wide read. No admin override. Even Darrell as system founder cannot read a confession marked `self-only` by another user.

### `user_telemetry` (powers the aggregate analytics view)
Anonymized-by-default engagement events.
```
user_id uuid FK → auth.users(id)
session_start timestamptz
active_tab text
app_version text
event_type text — page-view | feature-used | install | uninstall | refresh
event_meta jsonb
```

Aggregation queries roll these up into the Projects/admin view showing "X users on version Y across Z tabs." Per-user identity stays inside the tenant; cross-tenant analytics roll up by tenant_id, not user_id.

---

## 5. Counseling — explicitly NOT synced

The Counseling sub-tab data NEVER lands in Supabase. It stays in per-device IndexedDB encrypted with PIN + AES-GCM (PBKDF2 150k iterations, 15-min idle re-lock). This is intentional design per Darrell's 2026-05-23 framing (Multitude of Counselors / Shepherd of Souls): the user wrestles privately with Yahshua through Scripture, then walks distilled understanding back into human counsel — including possibly into the `confessions` table above, by their own choice.

There is no `counseling_sessions` Supabase table. There is no `counseling_messages` Supabase table. There is no telemetry on Counseling content. The only Counseling-related row that ever leaves a device is a `confession` the user actively submits, and even that is content the user composed and explicitly chose to share — not a recording or transcript of what they wrote in Counseling.

---

## 6. Settings stored per-user-per-tenant

A small `user_tenant_settings` table for per-user preferences within a tenant:
```
user_id uuid FK → auth.users(id)
tenant_id uuid FK → tenants(id)
theme text — midnight | linen | etc. (was per-device localStorage)
welcome_dismissed boolean default false (was per-device localStorage)
snowball_sort text — manual | avalanche | snowball
snowball_extra numeric(12,2)
debt_snowball_sort text
debt_snowball_extra numeric(12,2)
pressure_slider numeric(3,1) — 1.0 to 10.0
```

These were previously global localStorage entries — moving to per-user means Christina can have her own theme and dismissal state separate from Darrell's, even on the same family tenant.

---

## 7. Migration plan from localStorage

For each existing PWA install (the 17 orphaned ones plus current installs):

1. On first authenticated load after Layer 2 ships, the app detects the old `poe-financial-v28` localStorage blob.
2. App offers the user a one-time "Migrate this device's data to Your account" modal.
3. If user accepts: app reads the localStorage blob, splits it into the table-shaped rows above, posts them to Supabase with the user's `auth.uid()` and the current `tenant_id`.
4. On success, the localStorage blob is marked as migrated (a new `poe-financial-migrated-v1` key) but NOT deleted — kept for ~30 days as a recovery option.
5. If user declines, the app keeps reading/writing to localStorage as a single-device install (an explicit "local-only mode" the user can stay in). They can migrate later from Settings.

Counseling data is NEVER migrated (see §5).

---

## 8. RLS policy pattern

Template for every domain table:

```sql
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_can_read_entities"
  ON entities FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_members_can_insert_entities"
  ON entities FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "tenant_admins_can_update_entities"
  ON entities FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'member')
    )
  );

-- DELETE policy is intentionally restrictive: only owners can delete entities;
-- members can mark inactive but not destroy.
CREATE POLICY "tenant_owners_can_delete_entities"
  ON entities FOR DELETE
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role = 'owner'
    )
  );
```

`confessions` deviates from this pattern with the stricter audience-scoped policy described in §4.

---

## 9. The 8-day ship plan (to June 1)

| Day | Goal |
|---|---|
| **2026-05-23 (today)** | Schema doc landed (this file). Cert fix shipped. Greeting fix shipped. |
| **2026-05-24** | Install Supabase via Container Manager on the DS1621xs. Run schema migration (sections 2-6 above). Confirm magic-link auth working end-to-end. |
| **2026-05-25** | Replace `app/src/shims/storage.js` with a Supabase-backed implementation that maintains the same `await storage.get(key) / storage.set(key, value)` contract. Single-blob round-trip first; per-table CRUD second. |
| **2026-05-26** | Wire the Feedback button to write to the `feedback` table (Phase 1 of the Feedback → Project pipeline). |
| **2026-05-27** | Add `/church/` alias portal on Web Station. Stand up the Church of the Living God tenant in Supabase. Invite the church leadership team. |
| **2026-05-28** | Family install testing: Darrell, Christina, Christiana, twins each install, sign in with magic-link, confirm same data visible. |
| **2026-05-29** | Church install testing: at least one church leader installs, signs in, submits a feedback row. Confirm it reaches Darrell. |
| **2026-05-30** | Greeting personalizes from `tenant_members.display_name`. Welcome panel respects per-user dismissal. Theme picker stays per-user. |
| **2026-05-31** | Final smoke test. Confession surface lands as v0 (`audience: leadership` + `audience: self-only` only — `specific-user` deferred). |
| **2026-06-01** | Darrell + Christina depart on vacation. Family + church use the app; feedback flows back to Darrell on hotel wifi; he ships fixes via `.\deploy-to-synology.bat` over QuickConnect from anywhere. |

---

*This document is the working schema for the Layer-2 Supabase install. It will iterate. Each iteration commits to this file with a dated decisions-log entry, so a year from now the chain of choices is readable in one place.*
