# In-App Messaging — Layer 1 Design

**Status:** Design approved 2026-05-26. All 11 open decisions resolved 2026-05-26 (see §10). Implementation deferred to post-vacation (weeks 1–4 of the post-vacation cycle).
**Scope:** Layer 1 only. Layers 2–4 are sketched at the bottom as future surfaces.
**Schema target:** `infra/supabase/schema-v2.10-messaging.sql` (additive to live v2 schema in Supabase project `mjjlevhdufpaplypnqrv`. v2.9 slot is taken by `schema-v2.9-portal-rls.sql`; messaging slots in at v2.10).
**POE binding:** People Over Everything. Non-punitive, invitation-shaped, Family-on-Day-1.

---

## 1. What this gets us

Email is asynchronous, formal, and addressed. It optimizes for inboxes that humans triage in batches. Text messaging is synchronous-feeling, casual, and conversational — it optimizes for the back-and-forth of people who already know each other and already trust the channel. The POE surfaces we run (family logistics, COLG parish coordination, TLC clinical-adjacent talk with Christina, rental tenant comms, business operations) are overwhelmingly the second shape, not the first. Forcing every one of those interactions through email — even with the Layer 3 Resend digest — adds friction that costs us the very thing POE is supposed to win: people actually using the system instead of routing around it via SMS, iMessage, WhatsApp, Messenger, or whatever silo each contact happens to default to.

Text-like in-app messaging inside the PWA gives us a sovereign channel we own end-to-end: no carrier, no third-party messenger, no vendor that can change pricing or terms or shut us out. Family-on-Day-1 means Christina and the kids can install the PWA once and have a real conversation surface — not a notification stream they can't reply to. POE means notifications use invitation language ("Christina mentioned you in 'Pushover license' — tap to see"), never demands ("REPLY REQUIRED"). And because messages are linkable to projects, change_requests, and cycle_items, the "comment on the Pushover license decision" thread lives next to the decision itself — context survives instead of being scattered across email replies and Slack DMs that nobody can find later.

Plain-language summary: this is how the family actually talks to each other inside the app, instead of around it.

---

## 2. Schema additions

Lands as `infra/supabase/schema-v2.10-messaging.sql` when implementation starts (matches the existing `schema-v*.sql` convention used by v2.1–v2.9 in this repo — no separate `migrations/` directory). All tables tenant-scoped via `instance_id` (direct or transitively through `conversations`). All RLS policies follow the existing v2 pattern: membership in `instance_members` gates row visibility; additional membership in `conversation_members` gates per-conversation rows.

### `conversations`

```
id                  uuid primary key default gen_random_uuid()
instance_id         uuid not null references instances(id) on delete cascade
kind                text not null check (kind in ('direct','group','project-thread'))
name                text                                       -- nullable; auto-derived for 'direct'
linked_entity_kind  text                                       -- 'project' | 'change_request' | 'cycle_item' | null
linked_entity_id    uuid                                       -- FK target depends on kind; soft FK
created_by          uuid not null references instance_members(user_id)
created_at          timestamptz not null default now()
last_message_at     timestamptz                                -- denormalized for fast list ordering
archived_at         timestamptz                                -- nullable; soft archive, not delete
```

Indexes: `(instance_id, last_message_at desc)` for the list view; partial index on `(linked_entity_kind, linked_entity_id) where linked_entity_id is not null` for "show me the thread for this change_request" lookups.

### `conversation_members`

```
conversation_id        uuid not null references conversations(id) on delete cascade
user_id                uuid not null references instance_members(user_id) on delete cascade
role                   text not null check (role in ('owner','member','observer')) default 'member'
joined_at              timestamptz not null default now()
last_read_message_id   uuid references messages(id)              -- nullable on join
notifications_enabled  boolean not null default true
muted_until            timestamptz                               -- snooze, not block
primary key (conversation_id, user_id)
```

Index: `(user_id, conversation_id)` for "list my conversations" reverse lookup.

### `messages`

```
id                   uuid primary key default gen_random_uuid()
conversation_id      uuid not null references conversations(id) on delete cascade
sender_id            uuid not null references instance_members(user_id)
body                 text                                        -- plaintext; null when ciphertext is used
body_ciphertext      bytea                                       -- E2E surfaces (TLC); body is null
kind                 text not null check (kind in ('text','system','attachment')) default 'text'
linked_entity_kind   text                                        -- per-message linkage (overrides conversation linkage if set)
linked_entity_id     uuid
reply_to_message_id  uuid references messages(id)                -- threaded replies within a conversation
created_at           timestamptz not null default now()
edited_at            timestamptz
deleted_at           timestamptz                                 -- soft delete; tombstone preserved for audit
```

Constraint: `(body is not null) <> (body_ciphertext is not null)` — exactly one of them is populated.
Indexes: `(conversation_id, created_at desc)`; partial index on `(conversation_id) where deleted_at is null` for the read path.

### `message_attachments`

```
message_id      uuid not null references messages(id) on delete cascade
attachment_id   uuid not null default gen_random_uuid()
kind            text not null check (kind in ('image','doc','audio'))
storage_path    text not null                                  -- Supabase storage bucket path
mime_type       text not null
size_bytes      bigint not null
thumbnail_path  text                                           -- nullable; populated for images & docs that render
created_at      timestamptz not null default now()
primary key (message_id, attachment_id)
```

Storage bucket: `messaging-attachments`, RLS-gated to conversation membership. TLC bucket is separate (`messaging-attachments-tlc`) with at-rest encryption keys distinct from the general bucket.

### `message_reactions`

```
message_id   uuid not null references messages(id) on delete cascade
user_id      uuid not null references instance_members(user_id) on delete cascade
reaction     text not null                                     -- emoji codepoint(s); short string
created_at   timestamptz not null default now()
primary key (message_id, user_id, reaction)
```

Composite PK enforces "one reaction-of-this-kind per user per message" — re-sending the same reaction is a no-op, sending a different one adds a row.

### RLS policy shape

- `conversations`: select where `auth.uid() in (select user_id from conversation_members where conversation_id = conversations.id)`. Insert gated on `auth.uid() in (select user_id from instance_members where instance_id = conversations.instance_id)`.
- `conversation_members`: select where `auth.uid() = user_id` OR `auth.uid() in (select user_id from conversation_members cm2 where cm2.conversation_id = conversation_members.conversation_id)`. Insert/update gated on `role='owner'` of the conversation, except `last_read_message_id` and `notifications_enabled` which the row's own user can update.
- `messages`: select via conversation membership. Insert gated on conversation membership AND `sender_id = auth.uid()`. Update only to `edited_at`/`body`/`body_ciphertext` by the sender, only within an edit window (propose 15 minutes — open decision). Delete sets `deleted_at`, never hard-deletes.
- `message_attachments` & `message_reactions`: inherit visibility from parent message.

### Foreign keys to existing tables

- `conversations.created_by` → `instance_members.user_id`
- `conversation_members.user_id` → `instance_members.user_id`
- `messages.sender_id` → `instance_members.user_id`
- Soft FKs (validated in application code, not SQL FK, because target table varies): `conversations.linked_entity_id` and `messages.linked_entity_id` point at `projects.id`, `change_requests.id`, or `cycle_items.id` depending on `linked_entity_kind`.

### Link-to-entity pattern

A message — or an entire conversation — can reference exactly one entity from the existing project graph. The two-level link (conversation-level and per-message override) lets a "project-thread" conversation default to a `change_request`, while a single message inside it can still cross-reference a specific `cycle_item`. The PWA renders the linked entity as a chip at the top of the thread and inline on individual messages.

---

## 3. Linkages to existing tables

Messaging isn't a separate app stapled on; it threads through the project graph we already have.

- **Each `change_request` gets an implicit "comments" conversation.** When a `change_request` row is created, a paired `conversations` row is created with `kind='project-thread'`, `linked_entity_kind='change_request'`, `linked_entity_id=<cr.id>`, and `conversation_members` seeded from the change_request's stakeholders. The PWA renders the CR detail view with the thread embedded — no separate "comments" UI.
- **Each `cycle_item` gets a thread for daily-cycle reflections.** Same pattern. Daily-cycle journaling becomes a conversation between the cycle owner and any observers (Christina is auto-added as observer for family-cycle items; nobody is auto-added for TLC clinical items).
- **The seeded `review_cycles` get conversations attached.** "Daily dogfood" and "Sunday Board" each get a `kind='project-thread'` conversation. Sunday Board's conversation is the place where the weekly retro lives — instead of an external doc, the retro is a threaded reply chain inside the conversation, with each message linkable back to the project it's about.
- **Direct messages between `instance_members` are `kind='direct'`.** Auto-create on first send; reuse on subsequent sends between the same pair. Name is derived ("Darrell & Christina"); not stored.
- **Group chats are `kind='group'`.** Manual create, named by the creator, members added explicitly. (Phase 2 — not in Phase 1A/1B.)

The net effect: every decision in the app has a place where the conversation about it lives, and every conversation has a place in the app where it can be found later. No more "what was the context for this CR?" archaeology.

---

## 4. Notification fan-out per message

n8n on the Synology stack is the message bus. Supabase Realtime is the trigger.

**Flow:**

1. A new row lands in `messages`. Supabase Realtime emits an insert event on the `messages` channel, filtered server-side to the inserting user's instance.
2. An n8n workflow `messaging-fanout` subscribes to that channel. On event:
   - Load `conversation_members` for the message's `conversation_id`.
   - Filter to members where `notifications_enabled=true`, `muted_until is null OR muted_until < now()`, and `last_read_message_id != <new message id>` (i.e., not the sender, not someone who's already caught up).
   - For each remaining member, dispatch via the appropriate channel.
3. Channel routing:
   - **Darrell** → Pushover via the existing wiring (already live).
   - **Family (Christina, kids)** → ntfy on their per-family-member topic. Each family member has a topic of the form `poe-family-<member-slug>` published to the self-hosted ntfy instance on Synology.
   - **COLG parishioner or rental tenant** → ntfy if they have a PWA account with a topic configured. If not, and they've opted in to SMS, fire Twilio (Layer 2 fallback) subject to monthly budget cap. Cap defaults to $5/mo per instance, configurable in `notification_preferences`. When cap is hit: log, drop, surface in the daily digest instead.
   - **TLC clinical messages** → **never** fan out to SMS/Twilio/external. Only in-app + Pushover (Darrell, if member) + ntfy (Christina, if her topic is the TLC-isolated one). Enforced both in the workflow logic and via a constraint on `notification_channels` that excludes external transports for instances flagged `is_clinical=true`.
4. Each dispatch writes a row to `notifications` so the in-app bell badge and the audit trail both see it.

**Body shape (POE non-punitive):**

```
Christina mentioned you in 'Pushover license' — tap to see
```

NOT:

```
REPLY REQUIRED: Pushover license thread
```

Notification body template lives in code, not in the database, so it can be reviewed in PRs. Templates have a hard constraint against uppercase exclamatory tokens (REPLY, URGENT, NOW, etc.) — caught by a unit test that scans templates.

**Idempotency:** n8n workflow stores the message id it processed last per (conversation, member) pair. Replays from a Realtime reconnect dedupe against that store. The store is a small Postgres table `messaging_fanout_ledger` (id, conversation_id, user_id, last_dispatched_message_id, last_dispatched_at) — additive in v2.9.

**Failure handling:** transient failures (ntfy down, Pushover 5xx) retry with backoff up to 3 attempts. Hard failures (ntfy topic doesn't exist, Pushover key revoked) write a `notifications` row with `delivery_status='failed'` and surface in the daily digest. We do not crash the workflow or block subsequent messages.

---

## 5. PWA UI surface

**Decision (2026-05-26, revised same day):** Messaging lands as the "Messages" section **inside the existing Incoming tab** of the PWA shell — not as a separate top-level tab. Rationale: the Incoming tab is already where the family looks for "things waiting for me" (notifications, assigned items, inbound), and conversations belong in that mental model. Within Incoming, "Messages" sits as a clearly labeled section with its own unread badge, peer to the other Incoming sections.

**Reachability is unchanged:** the thread that lives on a change_request is still reachable from both places — from the CR detail view (inline embedded thread) and from Incoming → Messages (it shows up in the conversation list with the CR title as the name).

**Section label:** "Messages" (most familiar to family, generic enough to cover direct + group + project-thread).

**Layout (mobile-first, since Christina + kids are on phones):**

- **Conversation list** (Messages tab landing view): rows ordered by `last_message_at desc`. Each row shows conversation name (or auto-derived for direct), last message preview (truncated to ~60 chars), relative timestamp, unread count badge. Long-press: archive / mute / mark all read. Pull-to-refresh.
- **Thread view**: linked entity chip at top (e.g., "Thread on change_request: Pushover license" with chip-tap navigating to the CR detail). Scroll-back loads older messages in pages of 50. Each message shows sender avatar, sender name (only on first message in a run), body, timestamp on hover/long-press, reactions inline below the message. Own messages right-aligned, others left-aligned — standard text-app convention.
- **Compose box** (bottom-pinned, sticky): single-line that auto-expands to ~5 lines max before scrolling, send button (paper-plane icon), attachment button (paperclip — opens file picker), reaction picker triggered by long-press on any message.
- **Mark all read affordance**: visible at the top of the thread when the user has scrolled to the bottom; also available in the long-press menu on the conversation list row.
- **Notification reply UX**: PWA web push payload includes an `actions` array with a `reply` action. On supporting browsers (Chrome/Edge on Android, Safari iOS 16.4+), the user can type a reply directly from the notification shade without opening the app. The service worker posts back to the messages insert endpoint.

**What's explicitly NOT in Phase 1B:** group-chat creation UI, message search, attachment preview lightbox, voice messages, typing indicators, read receipts. Reactions UI ships in Phase 2; the table is in Phase 1A so the schema is stable.

**Locked decisions for the UI (2026-05-26):**

- **Edit window**: 15 minutes after send. Enforced by RLS policy on `messages` update (`now() - created_at < interval '15 minutes' AND sender_id = auth.uid()`).
- **Read receipts / presence / typing indicators**: per-conversation toggle on `conversations`, default **off** for any conversation in a TLC-flagged instance, default **on** elsewhere. Adds a `conversations.presence_enabled` boolean column to the v2.10 schema.
- **Group chat creation**: any instance member can create a group; creator is granted `role='owner'` automatically.
- **Attachment size limits**: 25MB per attachment, 1GB per conversation rolling. Enforced both client-side (compose blocks oversized) and server-side (storage trigger rejects). Conversation total tracked via a denormalized `conversations.attachments_total_bytes` column updated by trigger on attachment insert/delete.
- **Reaction set**: free-form emoji (anything goes). PWA quick-pick surfaces the curated six (👍 ❤️ 😂 😮 😢 🙏); a "+" button opens the full picker.

---

## 6. HIPAA-adjacent isolation for TLC

Christina's TLC instance is treated as a clinical-adjacent surface. We are not making HIPAA compliance claims, but we are building to that posture so that compliance is achievable later without a schema migration.

Mechanisms, all reusing patterns already in v2:

- **Encryption at rest for messages within TLC instance.** When a message is sent in a TLC-flagged conversation, the client encrypts `body` with AES-GCM-256 using the conversation's symmetric key (derived per-conversation from the TLC instance master key via HKDF). The ciphertext lands in `body_ciphertext`; `body` is null. This is the same client-side pattern used by the Legal domain (`schema-v2.6-legal.sql`) and the Church confessions surface (`schema-v2.7-church.sql`) — we are not inventing new crypto, we are reusing the wiring.
- **Per-conversation keys, not per-message.** Key rotation is per-conversation on a configurable schedule (default: never, opt-in per conversation owner). New members joining a conversation get the current key wrapped to their device key during the membership-add flow. Past messages are still readable (we do not do forward secrecy on the read path) — this matches the clinical use case where Christina needs continuity of record across the relationship.
- **Audit logging on every read.** The hash-chained `audit_log` table from v2.1 gets a new event kind `messages.read` written by the read RPC. Every load of a TLC message body — including by the sender on their own message — appends an entry. The chain prevents tampering.
- **No fan-out to external channels.** Enforced at two layers: (a) `notification_channels` has a check constraint that forbids external transports (`twilio_sms`, `email_resend`) for any row whose `instance_id` belongs to an instance with `is_clinical=true`; (b) the n8n fan-out workflow re-checks this flag before dispatch and skips external transports.
- **PIN unlock for TLC instance members.** Same pattern as the Council Chamber crypto pattern: the conversation symmetric key is sealed at rest with a key derived from the member's PIN + device key. PIN entry on PWA launch (or after the idle timeout) unlocks the conversation key in memory for the session. The PIN never leaves the device.

**TLC PIN defaults (locked 2026-05-26 — Christina can update after Phase 1D ships):**

- **PIN format**: 6 digits, numeric only. Familiar (matches phone unlock posture), fast on mobile, large enough keyspace (10⁶ = 1M) when combined with rate-limited backoff.
- **Lockout policy**: 5 failed attempts triggers exponential backoff, doubling from 30 seconds. After 10 cumulative failures the key sealing slot is locked until device re-pair. No remote unlock — that is the right posture for clinical-adjacent data.
- **Recovery**: device re-pair flow run in-person by Darrell as instance owner. Christina presents her device; Darrell scans a recovery QR from his admin surface; the conversation keys are re-wrapped to a fresh device key derived from a new PIN. No online recovery, no email-based reset. This is intentional — it matches the clinical threat model.
- **Idle timeout**: 5 minutes. Configurable per-member in `notification_preferences` (or a parallel `security_preferences` table — TBD at schema authoring time).
- **First-run experience**: PWA installs in normal (non-clinical) mode by default; TLC instance membership triggers a one-time PIN-set flow on first navigation into a TLC conversation. Christina sets her own PIN; it is never seen by Darrell, the platform, or anyone else.

**What this is NOT:** end-to-end encryption against Anthropic, Supabase, or any other operator. The threat model is "snapshot of database at rest does not reveal clinical content" and "an instance member who is not a conversation member cannot read the conversation." It is not "Christina's clinician notes are unreadable to the platform operator if they ever read process memory." That stronger posture is a Phase 2 / Matrix conversation (Layer 4).

---

## 7. Family-on-Day-1 considerations

The test is: Christina or one of the kids picks up a phone, installs the PWA, and can talk to the rest of the family without anyone walking them through setup. Concretely, in Phase 1B/1D this means:

- **Install the PWA once, no further setup.** Account provisioning happens via an invitation link Darrell sends. Tapping the link in any browser on the phone opens the PWA install prompt; after install, the user is signed in and their `conversation_members` rows are pre-seeded for the family conversations they belong to.
- **Send and receive messages in the Messages tab with zero configuration.** No "configure notifications," no "set up a topic" — the invitation flow provisions a default ntfy topic for the user behind the scenes and writes it to `notification_preferences`.
- **Unread counts visible in the conversation list.** Computed from `last_read_message_id` vs latest message id, no per-user maintenance.
- **Push notifications via ntfy on their phones.** Ntfy's PWA install on Android is one tap. For iOS family members we are **building a thin APNs shim** (decision 2026-05-26): a small server-side component on the Synology stack that receives the same fan-out event from n8n and dispatches to Apple Push Notification Service, so iOS users get native push without installing the ntfy app or pasting a topic URL. The shim is constrained to **build only if it can be operated sustainably** (Apple developer account renewal cadence, APNs certificate rotation, key revocation handling all documented and automated). If during implementation the operational burden is found to exceed the value of zero-touch iOS install — for example, if APNs certificate rotation requires manual intervention more than annually — the work stops and an issue is filed on the project tracker proposing fallback to the ntfy-app-paste-URL flow. The decision rule is explicit: sustainability beats convenience.
- **Reply from the notification (PWA web push reply UX).** Android Chrome supports inline reply via notification actions. iOS Safari 16.4+ supports notifications but not inline reply — iOS family members tap to open the PWA, which is still <1 second to the thread.

**Onboarding script (Phase 1D):** a single page in the PWA settings called "Add a family member" that takes a name + optional phone (for SMS opt-in later), generates the invitation link, displays a QR code for in-person handoff, and sends a copy to Darrell via Pushover. Christina can run this herself without involving Darrell.

---

## 8. Layers 2–4 future surfaces

- **Layer 2 — SMS opt-in per user, budget-capped.** Twilio is the default, but the abstraction in `notification_channels.transport` allows swapping to Plivo, MessageBird, or a self-hosted GSM modem (Hologram SIM + a Pi with gammu) without schema change. Per-user opt-in only, never default-on. Monthly budget cap enforced in n8n workflow with hard cutoff and digest notification on cap hit. Clinical instances permanently excluded by check constraint.
- **Layer 3 — Email digest via Resend.** Already in flight as a separate workstream. Repurpose at end-of-day cycle as a "missed messages digest" for users who weren't online — list of conversations with unread messages, latest preview per conversation, deep links into the PWA. Resend is the default; the abstraction allows self-hosted Postal or AWS SES later.
- **Layer 4 — Matrix self-hosted on Synology (Phase 2, sovereignty maximalist).** Stand up Synapse + Element on the Synology stack. Federate selected POE-internal users. Bridge bidirectionally with the Supabase `messages` table via a custom bridge (initially polling, eventually appservice). The goal is to retain the in-app PWA experience as the default surface for Family-on-Day-1 simplicity while exposing a Matrix interface for users who want a third-party client (Element, FluffyChat, Cinny). E2E in the Matrix sense is on the table for clinical conversations at that point.

The order is deliberate: Layer 1 wins the Family-on-Day-1 use case first because it's the highest-value, lowest-deployment-complexity surface. Layer 4 is sovereignty completeness, not a Phase 1 requirement.

---

## 9. Implementation phasing

Honest. Estimates assume a single engineer (Darrell) at post-vacation cadence with no compounding interruptions. Multiply by 1.5x if interruptions resume.

| Phase | When | Scope | Estimate |
|---|---|---|---|
| 1A | Post-vacation week 1 | Schema migration schema-v2.10-messaging.sql + RLS policies + basic CRUD RPCs + Realtime channel config | ~2 days |
| 1B | Post-vacation week 2 | PWA UI: Messages tab, conversation list, thread view, compose, direct + project-thread types | ~3 days |
| 1C | Post-vacation week 3 | n8n `messaging-fanout` workflow + Pushover/ntfy dispatch + `messaging_fanout_ledger` + idempotency | ~1 day |
| 1D | Post-vacation week 4 | TLC encryption at rest + audit-log integration + PIN unlock + family-onboarding flow + invitation link/QR + APNs shim spike (build-or-issue per §7 rule) | ~3 days + 1 day spike |
| 2 | Post-vacation week 5+ | Group chats, attachments + storage bucket RLS, reactions UI, search (Postgres FTS over `body`), presence/typing | ~2 weeks |
| 3 | Later (no calendar commit) | Matrix bridge / Layer 4 | — |

Total Phase 1: ~10 working days across 4 calendar weeks (room for non-coding work and the inevitable yak-shaves; +1 day for the APNs shim spike, which may collapse to 0 if Darrell decides during 1D that the operator burden isn't sustainable and files the fallback issue).

Each phase ships behind a feature flag (`messaging.layer1.enabled`, `messaging.tlc-crypto.enabled`) so partial rollout is possible — Darrell-only first, then family, then TLC.

---

## 10. Decisions log

Resolved 2026-05-26 with Darrell. Recorded here so the rationale survives.

1. **Messages placement** → **Section inside the existing Incoming tab** of the PWA shell. (Initially proposed as a top-level peer to Projects/Cycle/Settings; revised same day — Incoming is already the "things waiting for me" surface and conversations belong in that mental model. Unread badge on the section header.)
2. **Edit window for messages** → **15 minutes** after send. Long enough to fix typos, short enough that the conversation record stays trustworthy. Enforced via `messages` update RLS policy.
3. **Read receipts / presence / typing indicators** → **Per-conversation toggle**, default **off** for any conversation in a TLC-flagged instance, default **on** elsewhere. Christina can override per-conversation in TLC; family can override per-conversation if they want quiet mode.
4. **Group chat creation** → **Any instance member** can create a group; creator is auto-granted `role='owner'`.
5. **Attachment size limits** → **25MB per attachment, 1GB per conversation rolling**. Enforced client-side (compose blocks oversized) and server-side (storage trigger rejects). Tracked via denormalized `conversations.attachments_total_bytes`.
6. **Reaction set** → **Free-form emoji**, with the curated six (👍 ❤️ 😂 😮 😢 🙏) surfaced in the PWA quick-pick. "+" button opens the full picker.
7. **Notification body template location** → *Provisional default*: templates live in `infra/notifications/templates/*.md`, reviewed in PRs, with a unit test that scans for uppercase-exclamatory tokens (REPLY, URGENT, NOW, etc.) and fails the build on a match. Darrell flagged this as "not sure" — locked as the working default; revisit at the PR that introduces the first template if a better location emerges (e.g., colocated with the n8n workflow JSON, or in a dedicated `infra/notifications/templates.json` for runtime hot-reload).
8. **TLC PIN policy** → Defaults locked (Christina to revise after Phase 1D ships):
   - 6-digit numeric PIN
   - 5 failed attempts → exponential backoff doubling from 30s
   - 10 cumulative failures → device re-pair required (in-person with Darrell as instance owner)
   - 5-minute idle timeout
   - No remote/email recovery — clinical-posture default
9. **ntfy iOS friction** → **Build the APNs shim**, with an explicit sustainability gate: if during Phase 1D implementation the operational burden (cert rotation, key revocation, Apple dev account renewal) cannot be automated to require less than annual manual intervention, stop and file a fallback issue. Sustainability beats convenience.
10. **Tab naming** → **"Messages"**.
11. **Project name in the seed** → **"In-app messaging Layer 1"** confirmed. Seed runs as written.

**Status:** all decisions resolved. No blockers remain on Phase 1A schema authoring.

---

## Appendix A — File locations when implementation starts

- Schema: `infra/supabase/schema-v2.10-messaging.sql` (single file — matches the existing v2.1–v2.9 `schema-v*.sql` convention; no separate `migrations/` directory in this repo)
- n8n workflow export: `infra/n8n/workflows/messaging-fanout.json`
- Notification templates: `infra/notifications/templates/messaging-*.md` (provisional per §10 #7)
- PWA components: `app/src/components/messaging/` (matches the existing `app/src/components/` layout, e.g. `InputCenter.jsx`)
- Seed for project #9 (this design lands): `infra/supabase/seed-2026-05-26-in-app-messaging.sql`

## Appendix B — Cross-references

- Hash-chained audit log: `infra/supabase/schema-v2.1-infra.sql` (search for `audit_log`)
- Client-side AES-GCM crypto pattern (Legal): `infra/supabase/schema-v2.6-legal.sql`
- Client-side AES-GCM crypto pattern (Church confessions): `infra/supabase/schema-v2.7-church.sql`
- Council Chamber PIN unlock pattern: `docs/00-foundations/09-the-council-chamber.md`
- §12.5 dogfood discipline (every project goes into the app): `docs/00-foundations/PROJECT-FRAMEWORK.md` (§12.5)
- Prior seed that establishes the Vacation Prep cycle this seed binds into: `infra/supabase/seed-2026-05-25-projects.sql`
- Pushover wiring + ntfy stack: Synology n8n stack (in flight this week)

> *Cross-reference note:* These paths reflect the repo as of 2026-05-26. If anything has moved by the time Phase 1A starts, refresh by `grep -l audit_log infra/supabase/schema-v*.sql` and equivalents.
