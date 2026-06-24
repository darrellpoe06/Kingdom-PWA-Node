# Same-Night & Direct Booking — 805 N Prospect Ave (bar-exclusive · Airbnb-acquire · direct-repeat)

**Date:** 2026-06-23 (channel strategy added 2026-06-24)
**Type:** DESIGN spec. **No code, no migration in this document.** Layer 3 foundation (architecture).
**Status:** PROPOSED — design + record now; the full build follows [ROLES-MEMBERSHIP-MULTITENANCY-ADR.md](ROLES-MEMBERSHIP-MULTITENANCY-ADR.md) (partner access) + a new bookings model. Awaiting Darrell's go.
**Author:** Claude Code (advisory; Darrell governs).
**Grounds (cite-by-ID, PRINCIPLES.md):** SOVEREIGN-IDENTITY, RESEARCH-FIRST, SURFACE-PREMISE, NO-DATA-SALE, COMMUNITY-FIRST, DECISION-RECORDS. Pairs with the roles ADR (provisional DR-0079), DR-0060 (tenancy guard), DR-0076 (verification doctrine), and the `venue_bookings` precedent (`infra/supabase/migrations-auto/0034-venue-bookings.sql`).

> **The one thing this serves:** turn an apartment at 805 N Prospect Ave into a multi-channel booking where **reach acquires the guest and poetech.us keeps them.** Airbnb's reach *finds* new guests (acquisition); James McNeely's bar — **one door down** — is a private same-night direct channel; and once a guest has experienced the stay, poetech.us is where they **rebook direct** at a better deal (retention). Same apartment inventory, several funnels, all converging on **poetech.us direct booking** — the sovereign, no-platform-fee surface Darrell owns.

---

## 0. TL;DR (the offering in one screen)

| Field | Value |
|---|---|
| **Property** | 805 N Prospect Ave, Champaign IL — an apartment in the 11 Doors / Steward Real Estate portfolio. *(Public seed sanitizes this to "240 Cedar Ln Apt 1–4", ids `r4`–`r7`; the real record stays owner-scoped, never in the bundle.)* |
| **Partner** | James McNeely — owner of the bar one door from 805 N Prospect. |
| **Offer** | One apartment, **same-night booking** (book tonight, stay tonight) + standard nightly stays. |
| **Channels** | **Airbnb** = acquisition (reach finds new guests) · **bar-exclusive** = private same-night direct link (James) · **direct-repeat** = retention (returning guests rebook direct on poetech.us at a better deal). All converge on poetech.us direct booking. See §1. |
| **Price** | **$100 / night** is the **bar same-night** rate. Channel-priced otherwise: Airbnb at platform norms (covers its fee); **direct-repeat priced better for the guest *and* higher-margin for Darrell** (no platform fee). See §1.2. |
| **Checkout** | **11:00 AM** next day. |
| **Source tag** | every booking carries `source ∈ ('airbnb','bar','direct','direct-repeat')` (channel attribution). |
| **Payment** | **OUT OF SCOPE this pass — separate decision (Darrell handles money flows).** See §7. |

This document specifies (1) the **channel strategy** (acquire/retain), (2) the partner-access mechanism, (3) the booking flow, (4) the data model and where it lives in Real Estate, and (5) the honest go-live flags. It does **not** build payment processing and does **not** assert the offering is legally cleared — those are Darrell's to decide (§7, §8).

---

## 1. Channel strategy — acquire on Airbnb, retain on poetech.us

**One apartment, one inventory, several funnels — all converging on the sovereign poetech.us direct booking.** The platforms are not the product; they are *roads to* the product. Each road has a job:

| Channel | Job | Why | Source tag | Price posture |
|---|---|---|---|---|
| **Airbnb** | **ACQUISITION** | Airbnb's reach/discovery surfaces the unit to strangers Darrell could never reach alone. The platform fee is the **cost of acquiring a new guest.** | `airbnb` | Platform norms — priced to absorb Airbnb's fee; competitive on the marketplace. |
| **Bar-exclusive (James)** | direct, local, same-night | A private link the bar hands patrons one door away — no marketplace, no fee, instant local fill. | `bar` | **$100 same-night**, fixed (the named offer). |
| **Direct-repeat (poetech.us)** | **RETENTION** | A guest who already *experienced* the stay rebooks direct. No platform fee → **better price for them, more margin for Darrell.** This is the sovereign surface the whole platform exists to grow. | `direct` / `direct-repeat` | **Returning-guest / loyalty rate** — beats the guest's Airbnb price *and* keeps more margin than Airbnb would. |

### 1.1 The flywheel

```
   ┌─────────── ACQUIRE ───────────┐        ┌──────── RETAIN ────────┐
   │                               │        │                        │
 Airbnb reach ──► first stay ──► great experience ──► guest rebooks DIRECT
 (pay fee, new                     (the product:        on poetech.us next time
  guest found)                      the stay itself)    (no fee · better deal · loyalty)
                                          ▲                      │
 Bar patron ──► same-night ──────────────┘                      ▼
 (private link)   stay                              returning-guest pricing,
                                                    direct relationship, repeat margin
```

Every channel's job is to deposit a guest into the **direct relationship** poetech.us owns. Airbnb and the bar fill the top of the funnel; poetech.us direct is where the lifetime value compounds — each repeat stay carries no platform fee, so the guest can pay *less* than Airbnb while Darrell *keeps more*. That spread is the entire economic case for the sovereign surface.

### 1.2 Returning-guest / better-deal pricing (concept)

The retention deal is concrete: **a guest who has completed a stay is recognized on their next visit and offered a direct rate that is better than what they'd pay on Airbnb** — because the platform fee is gone, the savings can be *split* between a lower guest price and higher owner margin.

- **Guest identity carries the relationship.** A lightweight `booking_guests` record (phone/email as the key) lets the system recognize a returning guest and stamp `is_returning` / `repeat_count` on the new booking. No account required; the contact they booked with *is* the identity.
- **Price tiers (concept, not hardcoded):**
  - `airbnb` — marketplace rate (absorbs Airbnb's ~host service fee + competitive positioning).
  - `bar` — **$100 same-night** flat (the named local offer).
  - `direct-repeat` — a **returning-guest rate set between the two**: lower than the guest's Airbnb all-in price, higher net than Airbnb leaves Darrell after fees. Optionally a loyalty ladder (e.g. better each Nth stay) — a later pricing decision (§9, D6).
- **Server-set, never client-set.** Like `quoted_price` in `venue_bookings`, the rate for a booking is computed server-side from `(channel, is_returning, repeat_count)` — the guest never names their price.
- **The pitch lives on Darrell's surfaces only** — never inside Airbnb-controlled surfaces (see §1.3 — this is a hard compliance line, not a style choice).

### 1.3 Airbnb compliance guardrail (HONEST FLAG — not legal advice; Darrell to verify Airbnb's current terms)

**Airbnb's terms prohibit off-platform solicitation / fee-circumvention *during* the Airbnb booking.** Steering a guest off-platform while they are an Airbnb guest — to dodge the fee — can get a listing penalized or removed.

**Do NOT:**
- Put "book direct to skip fees," a poetech.us URL, a discount-for-direct pitch, or contact details in the **Airbnb listing text, photos, or in-app Airbnb messages.**
- Solicit the direct rebooking *during* the Airbnb stay/booking through any Airbnb-controlled channel.

**The legit pattern (this is the model the spec assumes):**
- The guest **experiences the stay**, then — **independently, later** — chooses to rebook **direct** on poetech.us. Discovery of the direct channel happens through the guest's own initiative or channels *outside* Airbnb's control, after the relationship exists.
- Keep the **direct-repeat invitation, returning-guest pricing, and poetech.us links entirely out of Airbnb-controlled surfaces.** Acquisition copy on Airbnb stays about the *stay*, never about booking direct.
- The retention surface (returning-guest rate, the poetech.us rebooking flow) is reached through **Darrell's own channels the guest opted into** outside Airbnb — never injected into the Airbnb funnel.

**Treat this as a build guardrail:** the Airbnb-acquisition path and the direct-repeat path are **separated by design** — no code surface, listing template, or message macro may place a direct-booking solicitation into an Airbnb-controlled field. (Not legal advice; Darrell verifies Airbnb's then-current terms before listing.)

---

## 2. Partner-access mechanism — the bar is a private direct door

The defining constraint for the **bar channel** is **exclusivity**: the *bar's* same-night link is reachable *only* through the bar, never from a public page, never indexed, never on a general listings surface. (Airbnb, by contrast, is a *public marketplace* listing — a different, deliberately-public acquisition road; see §1.) Two access shapes carry the bar channel, mapped onto the roles ADR rather than inventing a parallel system.

### 2.1 The patron path — a private partner CODE / link (no login)

A patron at the bar should be able to book in seconds, with no account. This reuses the **proven `venue_bookings` anon-insert pattern** (0034): *anyone holding the secret can INSERT a booking request; no one can READ the table back.*

- The bar gets a **private booking code** (e.g. printed on a card, a QR on the bar, a short link `poetech.us/stay/<partner-token>`). The token is the capability — possession of the link **is** the access. No public route lists it; it is not in the nav, not in the sitemap, `noindex`.
- The link opens a **single-purpose booking surface** (not the full app): tonight's availability for this one unit, the fixed $100, 11 AM checkout, and a short guest-capture form.
- On submit, the row is inserted **anon**, with `instance_id` FORCED to the Steward Real Estate (landlord) instance by a `BEFORE INSERT` trigger (SECURITY DEFINER), `source` forced to `'bar'`, `status` forced to `'requested'` (or `'held'`), price not client-settable — exactly the `venue_bookings` safe-shape constraint. A patron can never self-approve, re-price, or read another booking.
- **Partner attribution** rides on the token: the token maps to `partner_id` (James's bar), stamped on every row so the bar's volume is countable.

### 2.2 The partner path — a scoped login for James (optional, Phase 2)

If James wants to *see* his bar's bookings (who booked, fill rate) or block a night, he gets a **real, narrowly-scoped login** — mapped to the roles ADR, not a new role string scattered across policies:

- James is an `instance_member` of the Steward Real Estate (landlord) instance with role **`specialist`**, constrained by **`role_scopes`** (the existing `scope_kind ∈ entity|property|module|read-only-flag|time-bounded`, schema-v2.1-infra.sql:432–479). His scope: `property = 805-n-prospect`, `module = bookings`, `read-only` for guest PII, time-bounded/revocable.
- This makes "partner" a **capability-scoped specialist**, not a peer of the family. He sees *his* bookings for *this* property only; he can never read the rest of the portfolio, the family's finances, or any other tenant. The cross-tenant wall (`user_in_instance`) plus the property scope is the guarantee.
- **Open ADR decision (flag):** whether to add a first-class **`partner` role** (with a seeded capability set like `read_own_referred_bookings`, `block_availability`) to `role_capabilities`, or keep partner = scoped `specialist`. Recommendation: **start as scoped `specialist`** (zero new role, ships on the existing ladder); promote to a named `partner` role only if a second partner appears and the capability set stabilizes. Either way it lands through the roles ADR's capability layer (§2.3 there), not as ad-hoc policy strings.

### 2.3 Mapping to the roles ADR (one table)

| Actor | Roles-ADR mapping | Reads | Writes |
|---|---|---|---|
| Patron (no login) | anon holder of partner token | nothing back | one booking request (safe-shape, `source='bar'`) |
| Airbnb guest | (external; no app identity at booking) | nothing in-app | row created by owner/admin or import, `source='airbnb'` |
| Returning direct guest | recognized by `booking_guests` (phone/email); no account needed | nothing back | one direct booking request, `source='direct'`/`'direct-repeat'` |
| James (the bar) | `specialist` + `role_scopes{property,module=bookings,read-only}` *(or future `partner` role)* | his property's bookings only | block/hold a night; mark no-show |
| Darrell / Christina | `owner` / `admin` of Steward instance | all bookings + price + PII | approve, price, confirm, settle |

No new tenancy primitive; the offering is one property inside the existing landlord instance, gated by the existing predicates.

---

## 3. Booking flow (same-night, via the bar)

```
Patron taps the bar's card/QR  ──►  poetech.us/stay/<partner-token>
        │
        ▼
[1] Availability check — is THIS unit free TONIGHT?
        │  (one unit, one date = tonight; no calendar browse)
        ├─ not free ──► "Booked tonight — ask the bar." (no PII captured)
        ▼ free
[2] Same-night book — fixed $100, checkout 11:00 AM (both shown, neither editable)
        │
        ▼
[3] Capture guest — name, phone, (email optional), party size; agree to house rules
        │  source = 'bar', partner_id = <James's bar>, check_in = today, check_out = tomorrow 11:00
        │  (phone/email also seeds/links the booking_guests record for future retention)
        ▼
[4] Insert booking request (anon, safe-shape, status 'held')
        │
        ▼
[5] Confirm + hand-off — confirmation code to the guest; notify owner/admin (and the bar)
        │  PAYMENT: out of scope this pass — see §7. Booking can be 'held' pending Darrell's money decision.
        ▼
[6] Owner/admin confirms ──► status 'confirmed' ──► (turnover starts 11:00 AM checkout)
```

The **direct-repeat** flow is the same surface minus the partner token: a returning guest reaches a poetech.us direct booking page (through Darrell's own channels — never the Airbnb funnel, §1.3), is recognized by `booking_guests`, and is offered the returning-guest rate. The **Airbnb** flow happens on Airbnb; its bookings land in `stay_bookings` as `source='airbnb'` (owner-entered or imported) so all channels share one inventory and one availability calendar.

**Design notes**
- **Same-night** is the bar channel's whole product ("book that night"); standard nightly stays (Airbnb / direct) carry normal check-in dates. A "tonight only" surface is the bar link; the direct/Airbnb paths allow a date.
- **Channel-priced + fixed checkout** are displayed, server-enforced, never client-settable (mirrors `quoted_price` being staff-only in `venue_bookings`). The bar rate is the fixed $100; other channels price per §1.2.
- **One shared availability** across all channels — a night booked on Airbnb blocks the bar link and direct, and vice versa (§4.3). No double-booking across funnels.
- **No-leak:** the patron/guest never sees other bookings, the price logic, or any portfolio data; the surface renders only what the token/identity authorizes.

---

## 4. Data model

A **new bookings table** modeled on the proven `venue_bookings` shape (0034), specialized for apartment stays and **multi-channel attribution**. Lives in the **Real Estate module** (`app/src/components/Rentals.jsx` surface; helper in a new `app/src/lib/stay-bookings.js`), tied to the property record, a partner record, and a guest record.

### 4.1 `stay_bookings` (design sketch — NOT a migration)

```sql
-- DESIGN SKETCH. Build follows the roles ADR; do not apply as-is.
CREATE TABLE stay_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,  -- Steward (landlord) instance; FORCED by trigger
  property_id   text NOT NULL,            -- '805-n-prospect' (real id owner-scoped; never the sanitized seed id)
  unit_id       text,                     -- which apartment, if the building has several
  partner_id    uuid REFERENCES booking_partners(id),  -- the bar, when source='bar' (attribution)
  guest_id      uuid REFERENCES booking_guests(id),    -- the returning-guest relationship (retention)
  source        text NOT NULL DEFAULT 'direct'         -- channel attribution (acquire/retain)
                  CHECK (source IN ('airbnb','bar','direct','direct-repeat')),
  is_returning  boolean NOT NULL DEFAULT false,         -- set server-side from booking_guests history
  check_in      date NOT NULL,
  check_out     date NOT NULL,
  checkout_time text NOT NULL DEFAULT '11:00',          -- fixed 11 AM
  nightly_price numeric(10,2) NOT NULL,                 -- server-set from (source, is_returning); bar same-night = 100.00 (§1.2)
  guest_name    text NOT NULL,
  guest_phone   text,
  guest_email   text,
  party_size    integer,
  status        text NOT NULL DEFAULT 'held'
                  CHECK (status IN ('held','requested','confirmed','checked-in','completed','no-show','cancelled')),
  payment_status text NOT NULL DEFAULT 'deferred',      -- payment OUT OF SCOPE this pass (§7)
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
-- RLS ENABLED. SELECT/UPDATE/DELETE gated by user_role_in_instance(instance_id) IN ('owner','admin')
--   OR member_has_capability(instance_id,'read_own_referred_bookings') scoped to property_id (James).
-- Anon INSERT allowed ONLY through the bar partner-token path, constrained to safe-shape by a
--   BEFORE INSERT trigger (status 'held', source 'bar', price not client-settable, instance forced).
-- Airbnb rows are owner-entered/imported (source 'airbnb'); never anon.
-- Inherits authenticated grant via 0024 default privileges; tenancy-guard (DR-0060) requires the RLS.
```

### 4.2 `booking_partners` (the bar) and `booking_guests` (retention)

```sql
-- DESIGN SKETCH. The partner record + the secret token. The bar is ONE channel;
-- Airbnb is an external listing (no token), and direct-repeat needs no partner.
CREATE TABLE booking_partners (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name          text NOT NULL,           -- "James McNeely's bar"
  contact_name  text,                    -- James McNeely
  property_id   text NOT NULL,           -- the property this partner can book ('805-n-prospect')
  access_token  text NOT NULL,           -- the secret in poetech.us/stay/<token>; rotatable; hashed at rest
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Owner/admin-only read/write. The token is the patron capability; rotating it kills old links.

-- DESIGN SKETCH. The guest relationship — the asset retention compounds on.
CREATE TABLE booking_guests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  phone         text,                    -- contact-as-identity (no account required)
  email         text,
  display_name  text,
  first_source  text,                    -- how they were ACQUIRED ('airbnb'|'bar'|'direct') — attribution
  repeat_count  integer NOT NULL DEFAULT 0,   -- completed stays; drives returning-guest pricing (§1.2)
  last_stay_at  date,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Owner/admin-only. PII minimized, never sold, never mined (NO-DATA-SALE). A returning booking
-- matches an existing guest by phone/email, increments repeat_count, and sets stay_bookings.is_returning.
```

### 4.3 Availability (shared across all channels)

v1 availability is **derived, not a separate calendar**: a unit is free for a date if no `stay_bookings` row for that `property_id`/`unit_id` overlaps it with `status NOT IN ('cancelled','no-show')` — **regardless of `source`.** This is what makes the multi-funnel model safe: an Airbnb night, a bar night, and a direct night all write the same table, so one shared query prevents double-booking across channels. (Airbnb's own calendar must be kept in sync — owner-entered or via an import/iCal step; sync fidelity is a go-live check, §8.)

### 4.4 Where it lives in Real Estate

- **Surface:** a **Bookings** panel inside the property detail in `Rentals.jsx` (the property that is 805 N Prospect), showing availability, the channel mix (Airbnb / bar / direct), the partner link, the returning-guest list, and the booking log — owner/family-gated, no-leak.
- **Helper:** new `app/src/lib/stay-bookings.js` (pure functions: `isFree`, `buildBookingRequest`, `partnerLink`, `priceFor({source, isReturning, repeatCount})`, `matchGuest` — mirroring how `venue-rental.js` carries `venue_bookings`).
- **Partner card:** the `booking_partners` row for James surfaces the rotatable link/QR the bar hands out.

---

## 5. Where the offering is recorded NOW (before the build)

Real business data — recorded, not sanitized — but kept **out of the served bundle** (the 2026-06-01 sanitization rule: real PII never ships to browsers via `SEED_DATA`). Recorded in two owner-scoped places:

1. **Events-as-data working record (committed, private repo):** [`docs/99-session-notes/2026-06-23-805-prospect-exclusive-booking-offering.md`](../99-session-notes/2026-06-23-805-prospect-exclusive-booking-offering.md) — the offering as a Projects/events-as-data entry, tied to the property and this spec.
2. **Canonical structured record (gitignored, real names, never bundled):** `private/real-data/805-prospect-booking-offering.json` — `offeringId: "offering-805-prospect-same-night"`. Under `/private/` (gitignored), so the real partner name + address are recorded for the eventual owner-scoped DB load, never committed and never served.

The public seed (`poe-financial-mvp-v28.jsx` `SEED_DATA`) is **left untouched** — no real data enters the bundle.

---

## 6. Build sequence (follows the roles ADR)

1. **Partner access (roles ADR dependency).** Land the capability layer / scoped-specialist path (roles ADR Phase 1–2) so James = scoped `specialist` and the partner token is a real, revocable capability.
2. **`booking_partners` + `booking_guests` + `stay_bookings`** migrations (safe-shape trigger, RLS, grant inheritance) — proven-to-catch isolation tests first (DR-0076): an anon patron can insert one safe-shaped row and read **zero** rows back; James reads only 805's bookings; a different tenant reads zero.
3. **The patron surface** (`poetech.us/stay/<token>`) + the in-property Bookings panel + the channel-priced `priceFor` helper.
4. **Direct-repeat + Airbnb attribution** — guest matching, returning-guest pricing, and the **Airbnb-funnel separation guardrail enforced in code** (no direct-booking solicitation in any Airbnb-controlled field; §1.3).
5. **Payment decision (§7)** resolved separately before real money moves.

Until then: **design + record only.** No live booking endpoint ships in this pass.

---

## 7. Payment — explicitly OUT OF SCOPE this pass (separate decision)

**Do not build payment processing in this pass.** Darrell handles money flows. This spec stops at the booking record with `payment_status = 'deferred'`. The open decision (its own Tier-C record when Darrell takes it up):

- **Collect where?** At the bar (cash/their POS, reconciled to the booking), or online at booking, or on arrival. Airbnb collects on its own platform (and remits net of fee); direct/bar collection is Darrell's to design.
- **Who holds the money** and how it reconciles to the `stay_bookings` row, per channel.
- **Refund / no-show / cancellation** money rules.
- **Partner economics** — does the bar get a referral cut? That is a James-and-Darrell business decision, recorded separately.

The data model carries `payment_status` so payment can be wired later without reshaping bookings. Nothing in this pass moves money.

---

## 8. Honest go-live flags (NOT legal advice — Darrell to verify)

These are **go-live checks, not blockers on the design/record.** I am flagging what a careful operator would verify; I am not asserting any of it is cleared, and none of this is legal advice.

1. **Champaign short-term-rental / zoning ordinance.** A nightly stay is a short-term rental (STR), which Champaign and many IL municipalities regulate distinctly from a standard lease — possible registration, permits, occupancy or hosting-platform rules, lodging/hotel-use zoning for the parcel. **Verify the parcel's zoning permits transient lodging and what STR registration applies before the first paid night.**
2. **The unit's lease + use.** If the apartment is under a residential lease, nightly subletting/transient use may conflict with the lease and the residential certificate of occupancy. **Confirm the unit is legally usable for nightly stays** (vacant/owner-controlled, not a tenant-occupied unit being sublet).
3. **Insurance & liability — bar-adjacent / alcohol context.** A standard landlord/dwelling policy typically does **not** cover transient-lodging / hospitality liability. Guests arriving from a bar (alcohol) raises the liability profile (intoxication, injury, dram-shop adjacency). **Verify hospitality/STR liability coverage and that the bar-referral channel doesn't void coverage; confirm with the carrier in writing.**
4. **Airbnb terms compliance (acquire/retain separation).** Per §1.3, Airbnb prohibits off-platform solicitation / fee-circumvention during an Airbnb booking. **Keep every direct-booking pitch out of the Airbnb listing, photos, and in-app messages; the direct-repeat invitation must reach the guest only through Darrell's own channels, after the stay, on the guest's initiative.** Verify Airbnb's then-current terms before listing. (Not legal advice.)
5. **Occupancy.** Set and enforce a max occupancy (party size) consistent with the unit and code; capture `party_size` and cap it.
6. **11 AM turnover / cleaning.** Same-night booking + 11 AM checkout demands a reliable same-morning turnover (clean, linens, inspect, re-arm availability). **Confirm the cleaning/turnaround operation exists before going live**, or availability promises will break.
7. **Cross-channel calendar sync.** With Airbnb + bar + direct sharing one unit, an out-of-sync Airbnb calendar = a double-booking. **Confirm availability stays synced (owner-entered or iCal/import) before running multiple channels live.**
8. **Taxes.** STR revenue may carry local hotel/occupancy tax and is taxable income — record-keeping and remittance to verify. (Airbnb may collect/remit some local taxes; direct/bar bookings do not — verify who remits what.)
9. **Guest data.** Guest PII (name/phone/email, `booking_guests`) is owner-scoped, RLS-gated, no-leak, retention-minimized — never sold, never mined (NO-DATA-SALE).

**None of the above blocks recording the offering or writing this spec.** They block the *first live paid night*, and they are Darrell's to verify.

---

## 9. Open decisions (flagged, not decided here)

| # | Decision | Owner | Note |
|---|---|---|---|
| D1 | `partner` as a first-class role vs scoped `specialist` | roles ADR / Darrell | Recommend start as scoped `specialist`. |
| D2 | Payment collection + reconciliation + refunds (per channel) | Darrell | §7 — separate Tier-C record. |
| D3 | Partner referral economics (bar's cut, if any) | Darrell + James | Business terms; record separately. |
| D4 | Multi-night / future-date support | Darrell | Bar link is same-night; direct/Airbnb allow dates. |
| D5 | STR/zoning/insurance go-live clearance | Darrell (with counsel/carrier) | §8 — gates the first paid night. |
| D6 | Returning-guest pricing tiers + loyalty ladder | Darrell | §1.2 — the actual numbers (Airbnb rate, direct-repeat rate, loyalty steps). |
| D7 | Airbnb listing price + calendar-sync mechanism (manual vs iCal/import) | Darrell | §4.3, §8 — how Airbnb stays in one inventory without double-booking. |

---

*Recorded 2026-06-23; channel strategy (acquire/retain) added 2026-06-24. Design + record only; the live build follows the roles ADR (partner access) and the bookings migrations above. Advisory makes no booking and moves no money — Darrell governs both.*
