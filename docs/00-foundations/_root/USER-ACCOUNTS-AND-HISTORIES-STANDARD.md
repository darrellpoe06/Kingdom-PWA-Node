# User Accounts + Histories — a PoeTech Standard (Way)

**Declared by Darrell, 2026-07-14:**

> "All or standard apps should have users etc... document and add as a Way of PoeTech and/or Standard etc... like Moore Divahs, PoeTech and Love Corner... all of us need histories to support our users and get feedback on issues."

## The standard

**Every standard PoeTech app gives its users an account (username + password) and preserves their history, so a user can leave and come back anytime and pick up where they were.** This is not a per-app feature decision — it is a platform Way. It applies across the family of apps: **PoeTech (Family OS), Love Corner, Moore Divahs, TLC Therapy Solutions**, and every app that follows.

**Why it is a standard, not a nice-to-have:**

1. **Continuity for the user.** People come back. Their saved state, preferences, and past activity should be waiting for them — not reset to an empty world each visit.
2. **Support.** We cannot support a user we cannot recognize. An account + history is what lets a steward see what a specific user actually experienced.
3. **Feedback on issues.** Real accounts tied to real histories are how issues get reported, reproduced, and fixed against the actual state the user hit (pairs with the in-app Feedback surface).

## The bright line — what an account holds, and what it never does

- **HOLDS:** account identity (login), the user's own **non-sensitive history** (activity, saved items, preferences, bookings, returns), and their feedback.
- **NEVER HOLDS sensitive/clinical data that belongs in a system of record elsewhere.** For **TLC specifically**, the real clinical record — **therapy notes / PHI — stays external** (in the practice's clinical system), per the standing TLC no-PHI boundary (`configs/tlc.js` `noPhiNote`, the Practice bright line). The account gives a client continuity (their bookings, preferred provider, messages) **without** the app becoming a PHI store.
- Each user sees **only their own** history. Isolation is enforced by the real data gate (Supabase RLS, instance-scoped — DR-0060), never by UI alone.

## Examples are starting points, not decoration

The seed/sample records a fresh app shows (e.g. the TLC "Sample Family Medicine" referral rows) are **starting points staff finish into real records fast** — not static filler. A **"Use as starting point"** action pre-fills the real form from a sample so the assistant edits + saves a genuine record in seconds. This is `SEED-DATA-AS-ASPIRATION` made actionable: the aspirational example is also the fastest path to the first real row. (Ari's later role is to draft/support from these records while listening in the background — the automation path already staged on the Assistant's "Ari 24/7" tab; not yet built, honestly marked.)

## What "done" means for a new app (the checklist)

A standard PoeTech app is not complete until:

- [ ] Users can **create an account** (username/password) and **sign back in**.
- [ ] The app **persists the user's own history** across sessions, scoped to them by RLS.
- [ ] Sensitive/clinical data that belongs in an external system of record is **kept out** (documented boundary, like TLC's `noPhiNote`).
- [ ] Any seed/sample data is usable as a **starting point** toward a real record, not a dead display.
- [ ] There is a path for the user to **give feedback / report an issue** from inside the app.

## Where this lives

- This document is the Way. Ties to `SEED-DATA-AS-ASPIRATION.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` (the account serves the user, never extracts from them), `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, and `DR-0060` (RLS tenancy is the real isolation gate).
- The reusable office/account plumbing lives in `app/src/modules/office-assistant/` (config-driven per app) and the platform auth in `app/src/lib/supabase.js` + `PasswordAuth.jsx`.
