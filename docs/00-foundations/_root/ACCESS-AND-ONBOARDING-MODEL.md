# ACCESS AND ONBOARDING MODEL

**Layer 3 foundation. Added 2026-07-05, declared by Darrell.**

> "I want to share any type of space depending on the situation… allow my son and family in with a QR code, email, cellphone, anything we can think of that makes it easier to get an account, and the counter that starts the 90 days."

This is the authoritative map of **every way a person gets into PoeTech** — the situations, the channels, the account paths, and the 90-day trial counter. It is grounded in a verified read of the running code (file:line cited), not memory (DR-0076). It exists so onboarding your son and family — and the COLG congregation after them — is one deliberate, well-lit path per situation, never guesswork.

Pairs with: `COMMUNITY-FIRST-MISSION` (COLG is the named first community; accessibility is the default), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` (opt-in per stream, family ownership), the QR share surfaces (`AppShareQR.jsx` / `SharePoster.jsx`), and the invite-governance surface (`AccessUsageMetrics.jsx`).

---

## Part 1 — The two-layer access model (how it works today)

PoeTech has **two layers of "getting in,"** and every situation is one or the other:

### Layer A — No-login shareable-link spaces (instant, no account)
A steward shares a link (texted, emailed, or a **QR**), and the person is *in* the moment they open it — no sign-up. Knowing the link/code IS the credential. Six primitives exist:

| Space | Entry | What it's for | Account? |
|---|---|---|---|
| **Get-the-app / help** | `?join=1` (`AppInterestCapture.jsx`) | Platform-aware install steps + consented "invite me" capture | No |
| **Projector poster** | `?share=1` (`SharePoster.jsx`, new) | One big QR a whole room scans to reach `?join=1` | No |
| **Game room** | `?room=CODE` (`games/room-code.js`, QR + 4-char code) | Ad-hoc realtime shared space (the reusable pattern) | No |
| **Conference / event** | `?register=1` (`ConferenceRegister.jsx`) | No-login event registration; optional account after | No → optional |
| **Request a space** | `?request-space=1` (`VenueRequest.jsx`) | Community requests a campus (funeral/wedding/gathering) | No |
| **Projected class** | `?audience=1` / `?teach=1` / `?output=1` | Presenter mirrors slides to a screen / NDI to OBS | No |

### Layer B — Account-backed instances (durable, RLS-isolated)
A real account (Supabase Auth) that belongs to one or more **instances** (family / church / conference), isolated by the RLS predicate `user_in_instance()`. This is where household data, roles, and the subscription tier live.

- **First sign-in placement** — `join_default_instance()` RPC (`0002-join-default-instance-self-serve.sql`): a **family-allowlisted email** joins the shared `poe-family` instance; **everyone else** gets their own isolated instance `u-<uid>` as its owner.
- **Church staff** take a separate path via `join_church_instance()` (COLG default).
- **Roles** live in `instance_members.role` (owner / admin / member / viewer / specialist / child).

---

## Part 2 — Every way to get someone in, by situation

The **situation picks the channel.** This is the "comprehensive list" — pick the row that matches who you're bringing in.

### Getting an ACCOUNT (Layer B)

| Who | Best channel today | Mechanism | Status |
|---|---|---|---|
| **Your son / immediate family** | Add email to the **family allowlist**, then he signs in with Google or email+password → lands in the `poe-family` instance | `join_default_instance()` allowlist + `isFamilyEmail()` shell constant | ⚠️ allowlist is hardcoded — needs his email added (small change; his account then joins family, not a solo instance) |
| **Anyone (self-serve)** | Share `?join=1` (QR/poster/text) → they install → sign in → get their **own** instance | Google OAuth (primary), email+password, or magic-link ("Royalty Link") | ✅ works |
| **A specific person you invite by email** | `instance_invites` row (email + role, 14-day expiry); their next sign-in auto-accepts | `invite_to_church()` / member-invite RPC | ✅ exists (church path wired; general path partial) |
| **Someone who asked / needs help** | They land in the `?invites=1` admin list; you send a pre-filled email/SMS invite | `app_interest` table + `AppInterestAdmin.jsx` | ✅ works (this is where the new QR lives) |
| **A contractor / renter / parishioner** (not a full app user) | `external_users` + `external_invite_tokens` (single-use token link) | `external_users` schema | ✅ schema exists; UI partial |

### Channels available for sharing the way in

| Channel | Today | Notes |
|---|---|---|
| **QR code** | ✅ **shipped** | `AppShareQR` (Invites & Access tab + `?invites=1`) and `SharePoster` (`?share=1` projector). Encodes the canonical `poetech.us/poetech-app/?join=1`. |
| **Email** | ✅ | Pre-filled `mailto:` invite from `AppInterestAdmin`; `instance_invites` by email. |
| **Cellphone (text a link)** | ✅ | Pre-filled `sms:` invite; anyone can paste the join link into any messenger. |
| **Cellphone (sign in *with* a phone number / SMS code)** | ❌ **not built** | Supabase supports phone OTP, but it needs an SMS provider (e.g. Twilio) + cost. **Decision needed.** |
| **Copy link** | ✅ | Copy-link button on both QR surfaces. |
| **Apple / Google sign-in** | ✅ Google; ⚠️ Apple coded but not enabled | Apple OAuth needs Apple Developer setup (rides Phase D). |

---

## Part 3 — The 90-day counter

**Finding (verified):** a 90-day trial **already exists** in `app/src/lib/entitlements.js` — `TRIAL_DAYS = 90`, auto-started for a signed-in user on first load (`ensureSubscriber(..., {autoTrial:true})`), computing `daysLeft`, `percentElapsed`, and a phase (`trial | paid | expired`). At day 90 it **falls back to the free tier — never a lockout** (by design).

**But it has three gaps:**
1. **Device-local only.** The trial start (`trialStartIso`) is in `localStorage` (`poe-subscriber.<userKey>`). Clearing storage or switching phones **resets the clock**. It is not written to the cloud `instance_subscriptions` table.
2. **Invisible.** The countdown surfaces **only inside the Bookstore** — nowhere the family or a new member would notice "you're on day 12 of 90."
3. **Not the account-creation anchor.** It starts on first *app load*, not tied to the durable account `created_at`.

**Recommended durable design (the counter Darrell wants):**
- Anchor the 90 days to the **account/instance**, persisted server-side (`instance_subscriptions.status='trial'`, `trial_start`, `trial_days=90`) so it survives device changes and is the same on every screen.
- Surface a **calm, honest readout** ("Day *X* of 90 — full access through *[date]*, then it stays free forever; you're never locked out") near the account/subscribe area — one reusable component reading the existing `entitlements.appAccess` state.
- Keep the **no-lockout** promise (DATA-AS-EMPOWERMENT; the trial invites, it never traps).

**This is Tier B/C** (touches entitlement + money-facing copy; RELEASE-TIERS): design it, verify it, and land it with Darrell's governance — do not silently change entitlement.

---

## Part 4 — Roadmap (low-hanging → governed)

**Shipped (Tier A, this effort):**
- QR to share app access (`AppShareQR`) on the Invites & Access tab + `?invites=1` (PR #608, merged).
- Store-ready PNG icon set + `?share=1` projector poster (PR #609).

**Next low-hanging (in clearance):**
- Add **his son + family emails** to the family allowlist (needs the emails + confirm) — small, high-value.
- A **"Ways in" steward surface** that generates the right link/QR per situation (composes existing primitives; additive UI).

**Governed (Tier B/C — needs Darrell's decision):**
- Durable, cloud-persisted, app-wide **90-day counter** (entitlement + money copy).
- **Phone/SMS sign-in** (new provider + cost).
- **Pricing reconciliation** — the SQL schema ($9/$19/$49/$99) and the UI labels ($39/$89/$149/$249) disagree; pick one before either store submission.

**After the app is firmed up:** Phase C (Google Play via PWABuilder TWA), then Phase D (Apple App Store).

---

*Every reading here traces to real code and real tables. Where something doesn't exist yet, this says so plainly (DR-0076). The app is the primary artifact; this doc is its memory, and the "Ways in" surface is its face.*
