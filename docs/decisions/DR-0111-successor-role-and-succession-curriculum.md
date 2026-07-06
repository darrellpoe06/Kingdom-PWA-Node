# DR-0111 — The Successor role (read-only on the books) + the Handed Forward succession curriculum

- **Status:** accepted
- **Tier:** B for the pure permission-model contract + the curriculum (additive, deterministic, fully tested); the DB RLS enforcement of the read-only cut is a distinct **Tier C** slice, deferred with a re-review (see "Not done, with why").
- **Scope:** the family-circle permission model (`successor` role); a new `finance.manage` capability; the "Handed Forward" Learn course; the future read-only-books RLS enforcement.
- **Date:** 2026-07-06
- **Principles:** GOVERN-EXECUTE-ADVISE, APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, PERPETUAL-IMPROVEMENT, SPOKEN-TEACHING-IS-BUILD-INPUT, DECISION-RECORDS

## Directive

Darrell, 2026-07-06, on whether his son can see the family books and what business learning exists for heirs expected to take over: chose a **staged, revocable** successor posture over the current full-member access, and then:

> "We can't expect our heirs to learn how we did, or even exactly what we learned. There are new issues that older people want young people to take care of — and the PoeTech App will." And: "Also add the succession curriculum."

## What the code review found

- The permission model (`lib/relationships.js`) had **no succession role**. A family member expected to take over was forced into a binary: `child` (walled out of the books; and the DR-0094 "How Money Works" view was never built) or `member` (**sees AND can work the books** by default). No staged middle rung.
- Darrell Jr. (`darrellpoejr@gmail.com`) was added to the family allowlist on 2026-07-05 (migration `0080`) and joins `poe-family` as **role `member`** — so he **already sees the full books today**, with no staging, as a side effect of being let in.
- The financial tables (`accounts`, `transactions`, `debts`, `entities`, `projects`) run on the **older `tenant_members` / `user_in_tenant` / `user_tenant_role` RLS** (`schema-v1.sql`), a different layer than the newer `instance_members` / `user_role_in_instance` model the family/relationship tables use (`0055`). A correct read-only successor at the DB layer must reconcile both — it is not a one-line policy edit.

## Decision

**1. A new `successor` role in the FAMILY relationship — the staged, revocable middle rung.**
A steward-in-training being raised to take over **SEES the real books** (`finance.view: ALLOW`) so they learn on the family's actual numbers, but **cannot change them** — a new capability `finance.manage` ("Work the books") resolves to **DENY** for a successor while it is **ALLOW** for `member` and `governor`. Read, don't wreck. `family.build` / `family.manage` stay DENY. Deepening a successor to write access is a **deliberate promotion** to member/governor, never automatic. The read-only cut is the *only* difference from a member, and that gap is the succession-safety. (Pinned by `relationships.test.js`.)

**2. The "Handed Forward" succession curriculum** (`lib/succession-class.js`), grounded in the directive above: succession is **commission, not clone** — we hand forward the mission and the character, not a copied path, because the heir will face new issues the founder never met. Five age-adaptive modules on the shared Learn framework: (1) mission-not-map (Ecclesiastes 2:18-19; Proverbs 4:7), (2) read-before-you-rule on the real books, God-first (1 Chronicles 28:9-10; Luke 16:10 — pairs with the read-only seat), (3) a new builder for a new work (David gathered, Solomon built — 1 Chronicles 29:1), (4) cross what the predecessor could not (Moses→Joshua — Deuteronomy 31:7-8; Joshua 1:2,9), (5) ask a double portion and hand it forward again (2 Kings 2:9; 2 Timothy 2:2; Proverbs 13:22). Surfaced in-app via ChurchLearn (`extraCourses`) and registered in `book-corpus.defaultCourses()`. Every quoted verse was fetched **verbatim** from the repo KJV and is re-pinned by a proven-to-catch test (`succession-class.test.js`).

## Guards

- `relationships.test.js`: a successor sees `finance.view` but not `finance.manage` / `family.build` / `family.manage`; the read-only cut is the only difference from a member; a governor has both view + manage.
- `succession-class.test.js`: five modules with structure + valid quizzes; the mission-not-map / new-issues teaching is present; and **every quoted verse stays verbatim KJV** (a paraphrase fails the build — DR-0076 proven-to-catch).

## Not done, with why (DR-0075 / DR-0076 — no unverified claim)

- **DB RLS enforcement of the read-only successor is NOT shipped in this change, and is not claimed to be.** The model is the contract the UI + RLS read; the live enforcement is a separate, sensitive data-isolation slice. It must: add `successor` to the `instance_members` role CHECK; reconcile the **two tenancy systems** (financial tables gate on `tenant_members`/`user_in_tenant`, not `instance_members`); grant `successor` **SELECT-only** on the financial tables (never INSERT/UPDATE/DELETE); and be **RLS-tested adversarially** (service-role vs. a successor's own path, exact counts — the DR-0074 method) before it is trusted. Until it ships, flipping Darrell Jr. to `successor` would *reduce* his access (wall him out) rather than make it read-only, so the promotion is not wired yet. **re-review: next working session — implement + RLS-test the read-only cut as its own PR, on top of this contract.**
- **The DR-0094 "How Money Works" child view** remains unbuilt (its own re-review); this DR gives it a natural home as the youth on-ramp of the same succession ladder.
