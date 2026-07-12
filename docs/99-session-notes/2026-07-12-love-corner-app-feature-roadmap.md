# The Love Corner App — feature roadmap (reality-traced)

**Recorded:** 2026-07-12 · **Source:** Darrell's design brief (six messages, 2026-07-12) —
church feature sets, relational schema, digital-divide/inclusive design, admin-proxy
& offline-follow-up loop, and offline service-worker caching. **Capture rule:** sent
build-input is always captured (CLAUDE.md — "Spoken Teachings Are Build Input").

This note reality-traces the brief against what the repo ALREADY has, so the build
list is honest (DR-0061 / P15; DR-0076). It is **not** a new architecture — most of
it is configuration + UI over machinery that already exists and is RLS-tested.

## What already exists (schema + RLS, `infra/supabase/schema-v2.7-church.sql`)

| Brief item | Status | Real backing |
|---|---|---|
| Prayer wall / requests | **Table shipped, member UI net-new** | `prayer_requests` — `audience` enum (`leadership`/`prayer-team`/`congregation`/`elders-only`/`anonymous-public`) IS the visibility toggle; `submitted_by_external` IS proxy entry; `status` incl. `answered`/`closed-with-care`; `follow_up_notes` + `expires_at` = the offline-follow-up loop. **Missing:** an "I prayed" counter (junction table) and a member-facing surface. |
| Member directory | **Table shipped** | `parishioners` — `display_name`, `contact_*`, `membership_status`, `household_id` (= the brief's `parent_user_id`), `external_user_id`, `care_notes`, RLS by `user_in_instance`. |
| Household / managed accounts | **Data model shipped, switcher UI net-new** | `parishioners.household_id`; profile-switcher UI is net-new. |
| Ministries / small-group hub | **Tables shipped** | `ministries` + `ministry_signups` (browse, join, role, status). Group messaging is net-new. |
| Giving / tithes & offerings (year) | **Shipped — MORE mature than the brief** | `donor_giving` (by `tax_year`, `parishioner_id`, `fund`, `method`) + `service_offerings` (per-service cash/check/online counts) + `giving_reconciliations` (named-claim ↔ anonymous-offering linkage — accurate annual statements WITHOUT forcing every giver to be named at the moment of giving). A benevolence fund = a `fund` value. |
| Volunteer tracking | **Table shipped** | `volunteer_hours` (logged/approved/disputed). Event RSVP / time-slot claims net-new. |
| RBAC / moderation | **Partial** | `user_in_instance()` tenancy wall (DR-0060), `membership_status`, `leader_user_id`, reviewer-mode, Admin gating. Church-content moderation queue is net-new. |
| Inclusive auth — phone+PIN (no email) | **Shipped** | `PasswordAuth.jsx` phone+PIN door (DR-0172). |
| Push notifications | **Partial** | announce/push path exists; church-wide targeting net-new. |
| Offline PWA | **Shipped (Workbox via vite-plugin-pwa)** | see premise correction below. |

## Two premise corrections (the brief assumes a stack we don't run)

1. **Auth is Supabase Auth + RLS, not a raw `users` table with a hand-rolled `pin_hash`.**
   The tenancy wall is `user_in_instance()` (DR-0060), not app-side role checks; phone+PIN
   already ships as a synthetic-email identity. The one worthwhile add is a single-field
   **"phone / email / member number" login** + a human-readable `member_number` on
   `parishioners`. We do NOT store our own PIN hashes.

2. **Offline data is `supabase-js`, not `/api/prayers` REST — so the `sw.js` route example
   won't map, and Workbox is already in place.** vite-plugin-pwa generates a Workbox SW today
   (cache-first shell is done). What's net-new: (a) an **IndexedDB mirror** of the last
   prayer/needs query for offline READS (supabase-js calls aren't URL-routable in the SW),
   and (b) an **offline WRITE queue** for "I prayed"/claims via Background Sync. Both must
   carry the **three-brakes bounds** (budget/lock/kill-switch — CLAUDE.md) because a retrying
   sync is a timer loop. And the strategy MUST respect that the church **projector deliberately
   opts OUT of SW update-reloads mid-service** (`?share=church` in the `__standalone` list) —
   a mid-Assembly deploy can't reload the projected screen.

## Genuinely net-new (the real build list, ranked)

1. **Prayer Wall member surface** on `prayer_requests` (read own + audience-scoped; post with
   visibility; "answered" flow). Schema + RLS already done.
2. **"I prayed for this"** counter — new `prayer_interactions` junction (unique `(prayer_id,user_id)`).
3. **Needs & Offers Board** — the one true schema gap: new `needs` + `need_claims` tables
   (rides/meals/labor; multi-claim meal-train). Mirror the existing RLS pattern.
4. **Admin proxy entry UI** + a `source` enum (`app`/`paper_card`/`phone_call`/`in_person`)
   and `offline_followup` flag → the pastoral "call list" dashboard. (`submitted_by_external`
   already models the author≠beneficiary split.)
5. **Household profile-switcher**, **kiosk mode** (auto-logout), **member_number** single-field login.
6. **Offline read-mirror + write-queue** (three-brakes bound), **church-wide push targeting**,
   **event RSVP/slots**, **ministry group messaging**, **content-moderation queue**.

## Governance rails (binding)

- **All COLG-facing surfaces are Tier C** — Bishop Gwin doctrine sign-off + Governor review
  before public open (RELEASE-TIERS; DR-0003). Member-posted prayer is pastoral, not published
  doctrine, but still congregation-facing.
- **Giving = real money = Tier C.** A benevolence processor choice (Givelify/Tithe.ly class) is
  Bishop Gwin's + Darrell's hand, never automated (DR-0114 §3).
- **Accessibility is default** (COMMUNITY-FIRST): big tap targets, read-aloud, no required password typing.
- **Three-brakes** on any background sync / timer / autonomous lane.
- **No painted numbers** — the giving "year to date" reads real `donor_giving` rows or shows an
  honest empty state (DR-0076).

## Recommended sequence (Assembly is Jul 14–16, 2 days out)

- **Now → Assembly (low doctrine risk, high value):** Prayer Wall member surface (read + own
  request) on the existing table; giving "year-to-date" honest view; "I prayed" counter.
- **Behind the gate (stage, don't open):** public-facing prayer posting, benevolence giving flow,
  Needs Board go-live, proxy/kiosk — each needs Bishop Gwin.
- **After:** offline read-mirror/write-queue, group messaging, moderation queue, event RSVP.

## Still pending Darrell (do not nag)

- Exact Facebook page URLs (Love Corner + Bishop Lloyd Gwin) — render slot exists, unset until confirmed.
- Supabase: min-password-length ≤ 6 + Confirm-email OFF (phone+PIN, DR-0172).
- `thechurchofthelivinggod.com` domain-cutover plan (Tier C, DR-0107 prove-the-deploy).
