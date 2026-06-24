# 805 N Prospect Ave — Exclusive Same-Night Booking Offering (events-as-data record)

**Date:** 2026-06-23
**Layer:** 4 (working artifact). Owner/family-scoped REAL business data — recorded, not sanitized (distinguish data from brand). Kept out of the served bundle (`SEED_DATA`) per the 2026-06-01 sanitization rule; the repo is private.
**Spec:** [`docs/00-foundations/EXCLUSIVE-BOOKING-805-PROSPECT.md`](../00-foundations/EXCLUSIVE-BOOKING-805-PROSPECT.md)
**Status:** RECORDED (offering exists in real life); BUILD pending (follows the roles ADR + a new bookings model).

---

## What this is

Darrell's friend **James McNeely** owns the bar **one door down** from Darrell's **805 N Prospect Ave** apartments (Champaign IL — part of the 11 Doors / Steward Real Estate portfolio). The offering: **one apartment as a same-night booking** — book that night, **$100/night**, **11:00 AM checkout** — for the bar's patrons, provided **exclusively through poetech.us** as a private partner service (not a public listing).

This note records the offering as an events-as-data / Projects entry so the real business fact lives in the app's record system before the feature is built.

## The offering (structured record)

```json
{
  "offeringId": "offering-805-prospect-same-night",
  "kind": "exclusive-same-night-booking",
  "property": {
    "id": "805-n-prospect",
    "address": "805 N Prospect Ave",
    "city": "Champaign",
    "state": "IL",
    "portfolio": "Steward Real Estate (11 Doors)",
    "seedSanitizedAs": "240 Cedar Ln Apt 1-4 (ids r4-r7) — public bundle only; never the real id"
  },
  "partner": {
    "id": "partner-mcneely-bar",
    "name": "James McNeely's bar",
    "contact": "James McNeely",
    "relationship": "friend; bar is one door from 805 N Prospect",
    "channel": "private partner link/code handed to bar patrons"
  },
  "terms": {
    "price": 100.00,
    "currency": "USD",
    "unit": "night",
    "checkoutTime": "11:00",
    "sameNight": true,
    "exclusive": true,
    "via": "poetech.us",
    "source": "bar"
  },
  "payment": "OUT OF SCOPE this pass — separate decision (Darrell handles money flows)",
  "ties": {
    "property": "Real Estate module (Rentals.jsx property detail for 805 N Prospect)",
    "bookings": "new stay_bookings model (modeled on venue_bookings 0034); helper lib/stay-bookings.js",
    "access": "roles ADR — partner = scoped specialist (role_scopes property+module=bookings) or future partner role"
  },
  "recordedAt": "2026-06-23",
  "buildStatus": "design + record only; follows ROLES-MEMBERSHIP-MULTITENANCY-ADR.md + bookings migrations"
}
```

## As a Projects / events-as-data entry

Shape mirrors the `SEED_DATA.projects` record (see `poe-financial-mvp-v28.jsx:305`) — **but recorded here in the private repo, NOT in `SEED_DATA`** (that ships to browsers and stays sanitized):

```json
{
  "id": "pr-805-prospect-booking-offering",
  "title": "805 N Prospect — exclusive same-night booking for James McNeely's bar",
  "startDate": "2026-06-23",
  "endDate": null,
  "status": "planning",
  "domain": "business-poeprops",
  "description": "Stand up an exclusive, partner-gated same-night booking (one apartment, $100/night, 11 AM checkout) reachable only through a private link the bar hands its patrons. Real offering recorded 2026-06-23; spec at docs/00-foundations/EXCLUSIVE-BOOKING-805-PROSPECT.md. Build follows the roles ADR (partner access) + a new stay_bookings model. Payment out of scope this pass.",
  "entityId": "e-poeprops",
  "lifecycle": {
    "phase": "planning",
    "openedAt": "2026-06-23",
    "closedAt": null,
    "log": [
      { "at": "2026-06-23", "fromPhase": null, "toPhase": "planning", "by": "darrell", "note": "Offering recorded; partner = James McNeely's bar (one door down); spec written. Go-live gated on STR/zoning + insurance + lease checks (Darrell to verify) and the payment decision." }
    ]
  }
}
```

## Where the real data lives

- **This note** (committed, private repo) — the durable events-as-data record.
- **`private/real-data/805-prospect-booking-offering.json`** (gitignored under `/private/`) — the canonical machine record with real names, ready to load into the owner-scoped DB when the build lands. Never committed, never served.
- **Public bundle (`SEED_DATA`)** — deliberately untouched; no real data added.

## Go-live flags (carried from the spec — NOT legal advice; Darrell to verify)

Champaign STR/zoning ordinance · the unit's lease + residential CofO use · insurance/liability in the bar-adjacent/alcohol context · max occupancy · the 11 AM same-morning turnover/cleaning operation · STR taxes. None block recording or the spec; they gate the first paid night.
