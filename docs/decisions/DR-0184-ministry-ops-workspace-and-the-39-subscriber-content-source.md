# DR-0184 — Ministry Ops: the internal weekly-operations workspace under Projects, and the $39.99 subscriber's content source

- **Status:** accepted
- **Date:** 2026-07-13
- **Tier:** B (new Projects sub-tab + new table/RLS; the paid-content *exposure* is Phase 2 and will be its own review)
- **Governs:** where staff run the ministries' weekly operations, and where the paid ($39.99 / poetech-plus) subscriber's curated content comes from
- **Grounds:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, NO-STATIC-DATA, TLC-FIREWALL, COMMUNITY-FIRST, PERPETUAL-IMPROVEMENT
- **Pairs with:** MINISTRY-SUPPORT-PATTERN.md (the reused spine), DR-0180 (the ministry modules that feed it), DR-0060 (RLS is the real gate), 0099-ministry-ops.sql

## Declared by Darrell, 2026-07-13

> "a projects tab for the internal TLC staff and team members to work on projects and our weekly operation of the ministries… then move those projects under their own tab under projects so users who pay $39.99 can have some place and content context… motivate subscriptions." — chose **"both"** for the subscriber tab (curated ministry content **and** their own boards).

## The decision (staged; this is Phase 1)

Build **Ministry Ops** — a new sub-tab under **Projects** — on one real source (`ministry_ops`, 0099) with two audiences:

- **Staff (owner/admin)** run the ministries' **weekly operations** as real ops items (which ministry, what, status, which week). Private by default.
- Any item a steward marks **member-visible** becomes the **curated content** the paid subscriber sees ("what the ministries are building"). The pure `memberDigest()` returns *only* member-visible items — a proven boundary (a private ops item can never surface).

**$39.99 = the `poetech-plus` tier** (verified: `cohort-programs.js requiredTier: 'poetech-plus'`, `entitlements.DEFAULT_TRIAL_TIER`). So this is giving that existing tier a home + content, **not** new pricing.

**TLC-FIREWALL (ISO-1):** `ministry_ops` lives in the **church** instance and holds **ministry operations only** — never raw TLC clinical/therapy data. The wall is the instance boundary plus the fact that only ministry-ops rows exist here.

## Phasing (honest about what shipped)

- **Phase 1 (this DR):** the staff workspace + the member-visible flag + the tested `memberDigest` + a live members'-view preview, wired as the Projects `ministry-ops` sub-tab. The data source for subscriber content is REAL and ready.
- **Phase 2 (staged, its own PR + review):** the **poetech-plus subscriber surface** that renders the digest (the tier-gated "place and content context"), and **members' own project boards** (reusing the board engine). Exposing content to a paid tier is a money-adjacent change that earns its own review — not rushed in behind this one.

## What makes it trustworthy (DR-0076)

- **The paid-content boundary is unit-tested.** `ministry-ops.test.js` proves `memberDigest` returns only member-visible items and never leaks a private ops row (12 tests: access, week math, groupings, tally, the digest boundary).
- **RLS is the real gate.** The read policy scopes non-staff members to `member_visible` rows in the database; staff-only insert/update/delete.
- **No paint (DR-0061).** Ops items are real staff-entered rows; the members' view derives from them; an empty state reads "nothing published yet," never a fabricated feed.

## Encoded / verified

Migration `0099`; `ministry-ops.js` (+ 12 tests) and `ministry-ops-sync.js`; `components/MinistryOps.jsx`; wired into `Projects.jsx` (new `ministry-ops` sub-tab). Full suite green (5584), lint + build clean, contrast + legibility + all guards pass.
