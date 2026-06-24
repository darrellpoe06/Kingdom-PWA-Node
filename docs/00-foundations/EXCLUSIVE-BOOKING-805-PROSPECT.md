# Exclusive Same-Night Booking — 805 N Prospect Ave (Partner: James McNeely's bar)

**Date:** 2026-06-23
**Type:** DESIGN spec. **No code, no migration in this document.** Layer 3 foundation (architecture).
**Status:** PROPOSED — design + record now; the full build follows [ROLES-MEMBERSHIP-MULTITENANCY-ADR.md](ROLES-MEMBERSHIP-MULTITENANCY-ADR.md) (partner access) + a new bookings model. Awaiting Darrell's go.
**Author:** Claude Code (advisory; Darrell governs).
**Grounds (cite-by-ID, PRINCIPLES.md):** SOVEREIGN-IDENTITY, RESEARCH-FIRST, SURFACE-PREMISE, NO-DATA-SALE, COMMUNITY-FIRST, DECISION-RECORDS. Pairs with the roles ADR (provisional DR-0079), DR-0060 (tenancy guard), DR-0076 (verification doctrine), and the `venue_bookings` precedent (`infra/supabase/migrations-auto/0034-venue-bookings.sql`).

> **The one thing this serves:** turn one real apartment at 805 N Prospect Ave into a **same-night, partner-gated** booking that James McNeely's bar — **one door down** — can hand its patrons, exclusively through poetech.us. Private, not a public listing. The bar is the only door in.

---

## 0. TL;DR (the offering in one screen)

| Field | Value |
|---|---|
| **Property** | 805 N Prospect Ave, Champaign IL — an apartment in the 11 Doors / Steward Real Estate portfolio. *(Public seed sanitizes this to "240 Cedar Ln Apt 1–4", ids `r4`–`r7`; the real record stays owner-scoped, never in the bundle.)* |
| **Partner** | James McNeely — owner of the bar one door from 805 N Prospect. |
| **Offer** | One apartment, **same-night booking** (book tonight, stay tonight). |
| **Price** | **$100 / night**, fixed. |
| **Checkout** | **11:00 AM** next day. |
| **Channel** | **Exclusive via poetech.us** — a private partner link/code the bar gives patrons. **Not a public listing.** |
| **Source tag** | every booking carries `source = 'bar'` (partner attribution). |
| **Payment** | **OUT OF SCOPE this pass — separate decision (Darrell handles money flows).** See §6. |

This document specifies (1) the partner-access mechanism, (2) the booking flow, (3) the data model and where it lives in Real Estate, and (4) the honest go-live flags. It does **not** build payment processing and does **not** assert the offering is legally cleared — those are Darrell's to decide (§6, §7).

---

## 1. Partner-access mechanism — the bar is the only door in

The defining constraint is **exclusivity**: this apartment-night is reachable *only* through the bar, never from a public page, never indexed, never on a general listings surface. Two access shapes carry that, mapped onto the roles ADR rather than inventing a parallel system.

### 1.1 The patron path — a private partner CODE / link (no login)

A patron at the bar should be able to book in seconds, with no account. This reuses the **proven `venue_bookings` anon-insert pattern** (0034): *anyone holding the secret can INSERT a booking request; no one can READ the table back.*

- The bar gets a **private booking code** (e.g. printed on a card, a QR on the bar, a short link `poetech.us/stay/<partner-token>`). The token is the capability — possession of the link **is** the access. No public route lists it; it is not in the nav, not in the sitemap, `noindex`.
- The link opens a **single-purpose booking surface** (not the full app): tonight's availability for this one unit, the fixed $100, 11 AM checkout, and a short guest-capture form.
- On submit, the row is inserted **anon**, with `instance_id` FORCED to the Steward Real Estate (landlord) instance by a `BEFORE INSERT` trigger (SECURITY DEFINER), `source` forced to `'bar'`, `status` forced to `'requested'` (or `'held'`), price not client-settable — exactly the `venue_bookings` safe-shape constraint. A patron can never self-approve, re-price, or read another booking.
- **Partner attribution** rides on the token: the token maps to `partner_id` (James's bar), stamped on every row so the bar's volume is countable.

### 1.2 The partner path — a scoped login for James (optional, Phase 2)

If James wants to *see* his bar's bookings (who booked, fill rate) or block a night, he gets a **real, narrowly-scoped login** — mapped to the roles ADR, not a new role string scattered across policies:

- James is an `instance_member` of the Steward Real Estate (landlord) instance with role **`specialist`**, constrained by **`role_scopes`** (the existing `scope_kind ∈ entity|property|module|read-only-flag|time-bounded`, schema-v2.1-infra.sql:432–479). His scope: `property = 805-n-prospect`, `module = bookings`, `read-only` for guest PII, time-bounded/revocable.
- This makes "partner" a **capability-scoped specialist**, not a peer of the family. He sees *his* bookings for *this* property only; he can never read the rest of the portfolio, the family's finances, or any other tenant. The cross-tenant wall (`user_in_instance`) plus the property scope is the guarantee.
- **Open ADR decision (flag):** whether to add a first-class **`partner` role** (with a seeded capability set like `read_own_referred_bookings`, `block_availability`) to `role_capabilities`, or keep partner = scoped `specialist`. Recommendation: **start as scoped `specialist`** (zero new role, ships on the existing ladder); promote to a named `partner` role only if a second partner appears and the capability set stabilizes. Either way it lands through the roles ADR's capability layer (§2.3 there), not as ad-hoc policy strings.

### 1.3 Mapping to the roles ADR (one table)

| Actor | Roles-ADR mapping | Reads | Writes |
|---|---|---|---|
| Patron (no login) | anon holder of partner token | nothing back | one booking request (safe-shape, `source='bar'`) |
| James (the bar) | `specialist` + `role_scopes{property,module=bookings,read-only}` *(or future `partner` role)* | his property's bookings only | block/hold a night; mark no-show |
| Darrell / Christina | `owner` / `admin` of Steward instance | all bookings + price + PII | approve, price, confirm, settle |

No new tenancy primitive; the offering is one property inside the existing landlord instance, gated by the existing predicates.

---

## 2. Booking flow (same-night)

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
        ▼
[4] Insert booking request (anon, safe-shape, status 'held')
        │
        ▼
[5] Confirm + hand-off — confirmation code to the guest; notify owner/admin (and the bar)
        │  PAYMENT: out of scope this pass — see §6. Booking can be 'held' pending Darrell's money decision.
        ▼
[6] Owner/admin confirms ──► status 'confirmed' ──► (turnover starts 11:00 AM checkout)
```

**Design notes**
- **Same-night only by default:** the surface offers *tonight*, full stop — that is the whole product ("book that night"). A future "tomorrow night" toggle is a later decision, not this pass.
- **Fixed price + fixed checkout** are displayed, server-enforced, never client-settable (mirrors `quoted_price` being staff-only in `venue_bookings`).
- **One unit at a time:** availability is a single boolean for tonight, not a multi-unit calendar — keeps the patron flow to one tap and avoids overbooking logic in v1.
- **No-leak:** the patron never sees other bookings, the price floor, or any portfolio data; the surface renders only what the token authorizes.

---

## 3. Data model

A **new bookings table** modeled on the proven `venue_bookings` shape (0034), specialized for same-night apartment stays. Lives in the **Real Estate module** (`app/src/components/Rentals.jsx` surface; helper in a new `app/src/lib/stay-bookings.js`), tied to the property record and a partner record.

### 3.1 `stay_bookings` (design sketch — NOT a migration)

```sql
-- DESIGN SKETCH. Build follows the roles ADR; do not apply as-is.
CREATE TABLE stay_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,  -- Steward (landlord) instance; FORCED by trigger
  property_id   text NOT NULL,            -- '805-n-prospect' (real id owner-scoped; never the sanitized seed id)
  unit_id       text,                     -- which apartment, if the building has several
  partner_id    uuid REFERENCES booking_partners(id),  -- the bar (attribution)
  source        text NOT NULL DEFAULT 'bar',           -- forced 'bar' on the partner link
  check_in      date NOT NULL,            -- today (same-night)
  check_out     date NOT NULL,            -- tomorrow
  checkout_time text NOT NULL DEFAULT '11:00',         -- fixed 11 AM
  nightly_price numeric(10,2) NOT NULL DEFAULT 100.00, -- fixed $100; server-set, not client
  guest_name    text NOT NULL,
  guest_phone   text,
  guest_email   text,
  party_size    integer,
  status        text NOT NULL DEFAULT 'held'
                  CHECK (status IN ('held','requested','confirmed','checked-in','completed','no-show','cancelled')),
  payment_status text NOT NULL DEFAULT 'deferred',     -- payment OUT OF SCOPE this pass (§6)
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);
-- RLS ENABLED. SELECT/UPDATE/DELETE gated by user_role_in_instance(instance_id) IN ('owner','admin')
--   OR member_has_capability(instance_id,'read_own_referred_bookings') scoped to property_id (James).
-- Anon INSERT allowed ONLY through the partner-token path, constrained to safe-shape by a
--   BEFORE INSERT trigger (status 'held', source 'bar', price not client-settable, instance forced).
-- Inherits authenticated grant via 0024 default privileges; tenancy-guard (DR-0060) requires the RLS.
```

### 3.2 `booking_partners` (the bar)

```sql
-- DESIGN SKETCH. The partner record + the secret token.
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
```

### 3.3 Availability

v1 availability is **derived, not a separate calendar**: a unit is free tonight if no `stay_bookings` row for that `property_id`/`unit_id` has `check_in = today` and `status NOT IN ('cancelled','no-show')`. One query, no overbooking engine. A richer calendar is a later decision if multi-night lands.

### 3.4 Where it lives in Real Estate

- **Surface:** a **Bookings** panel inside the property detail in `Rentals.jsx` (the property that is 805 N Prospect), showing tonight's status, the partner link, and the booking log — owner/family-gated, no-leak.
- **Helper:** new `app/src/lib/stay-bookings.js` (pure functions: `isFreeTonight`, `buildBookingRequest`, `partnerLink`, mirroring how `venue-rental.js` carries `venue_bookings`).
- **Partner card:** the `booking_partners` row for James surfaces the rotatable link/QR the bar hands out.

---

## 4. Where the offering is recorded NOW (before the build)

Real business data — recorded, not sanitized — but kept **out of the served bundle** (the 2026-06-01 sanitization rule: real PII never ships to browsers via `SEED_DATA`). Recorded in two owner-scoped places:

1. **Events-as-data working record (committed, private repo):** [`docs/99-session-notes/2026-06-23-805-prospect-exclusive-booking-offering.md`](../99-session-notes/2026-06-23-805-prospect-exclusive-booking-offering.md) — the offering as a Projects/events-as-data entry, tied to the property and this spec.
2. **Canonical structured record (gitignored, real names, never bundled):** `private/real-data/805-prospect-booking-offering.json` — `offeringId: "offering-805-prospect-same-night"`. Under `/private/` (gitignored), so the real partner name + address are recorded for the eventual owner-scoped DB load, never committed and never served.

The public seed (`poe-financial-mvp-v28.jsx` `SEED_DATA`) is **left untouched** — no real data enters the bundle.

---

## 5. Build sequence (follows the roles ADR)

1. **Partner access (roles ADR dependency).** Land the capability layer / scoped-specialist path (roles ADR Phase 1–2) so James = scoped `specialist` and the partner token is a real, revocable capability.
2. **`booking_partners` + `stay_bookings`** migrations (safe-shape trigger, RLS, grant inheritance) — proven-to-catch isolation tests first (DR-0076): an anon patron can insert one safe-shaped row and read **zero** rows back; James reads only 805's bookings; a different tenant reads zero.
3. **The patron surface** (`poetech.us/stay/<token>`) + the in-property Bookings panel.
4. **Payment decision (§6)** resolved separately before real money moves.

Until then: **design + record only.** No live booking endpoint ships in this pass.

---

## 6. Payment — explicitly OUT OF SCOPE this pass (separate decision)

**Do not build payment processing in this pass.** Darrell handles money flows. This spec stops at the booking record with `payment_status = 'deferred'`. The open decision (its own Tier-C record when Darrell takes it up):

- **Collect where?** At the bar (cash/their POS, reconciled to the booking), or online at booking, or on arrival.
- **Who holds the money** and how it reconciles to the `stay_bookings` row.
- **Refund / no-show / cancellation** money rules.
- **Partner economics** — does the bar get a referral cut? That is a James-and-Darrell business decision, recorded separately.

The data model carries `payment_status` so payment can be wired later without reshaping bookings. Nothing in this pass moves money.

---

## 7. Honest go-live flags (NOT legal advice — Darrell to verify)

These are **go-live checks, not blockers on the design/record.** I am flagging what a careful operator would verify; I am not asserting any of it is cleared, and none of this is legal advice.

1. **Champaign short-term-rental / zoning ordinance.** A nightly stay is a short-term rental (STR), which Champaign and many IL municipalities regulate distinctly from a standard lease — possible registration, permits, occupancy or hosting-platform rules, lodging/hotel-use zoning for the parcel. **Verify the parcel's zoning permits transient lodging and what STR registration applies before the first paid night.**
2. **The unit's lease + use.** If the apartment is under a residential lease, nightly subletting/transient use may conflict with the lease and the residential certificate of occupancy. **Confirm the unit is legally usable for nightly stays** (vacant/owner-controlled, not a tenant-occupied unit being sublet).
3. **Insurance & liability — bar-adjacent / alcohol context.** A standard landlord/dwelling policy typically does **not** cover transient-lodging / hospitality liability. Guests arriving from a bar (alcohol) raises the liability profile (intoxication, injury, dram-shop adjacency). **Verify hospitality/STR liability coverage and that the bar-referral channel doesn't void coverage; confirm with the carrier in writing.**
4. **Occupancy.** Set and enforce a max occupancy (party size) consistent with the unit and code; capture `party_size` and cap it.
5. **11 AM turnover / cleaning.** Same-night booking + 11 AM checkout demands a reliable same-morning turnover (clean, linens, inspect, re-arm availability). **Confirm the cleaning/turnaround operation exists before going live**, or availability promises will break.
6. **Taxes.** STR revenue may carry local hotel/occupancy tax and is taxable income — record-keeping and remittance to verify.
7. **Guest data.** Guest PII (name/phone) is owner-scoped, RLS-gated, no-leak, retention-minimized — never sold, never mined (NO-DATA-SALE).

**None of the above blocks recording the offering or writing this spec.** They block the *first live paid night*, and they are Darrell's to verify.

---

## 8. Open decisions (flagged, not decided here)

| # | Decision | Owner | Note |
|---|---|---|---|
| D1 | `partner` as a first-class role vs scoped `specialist` | roles ADR / Darrell | Recommend start as scoped `specialist`. |
| D2 | Payment collection + reconciliation + refunds | Darrell | §6 — separate Tier-C record. |
| D3 | Partner referral economics (bar's cut, if any) | Darrell + James | Business terms; record separately. |
| D4 | Multi-night / future-date support | Darrell | v1 is same-night only. |
| D5 | STR/zoning/insurance go-live clearance | Darrell (with counsel/carrier) | §7 — gates the first paid night. |

---

*Recorded 2026-06-23. Design + record only; the live build follows the roles ADR (partner access) and the bookings migrations above. Advisory makes no booking and moves no money — Darrell governs both.*
