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

## Update — the DB RLS enforcement shipped in this change (migration 0082)

The initial draft of this DR deferred the DB enforcement, citing "two tenancy systems to reconcile." **That premise was wrong** — a closer read showed `schema-v2.1-infra` had already MERGED the systems (`tenants→instances`, `user_in_tenant→user_in_instance`, `tenant_id→instance_id`). So the enforcement was tractable now, and deferring it was itself an unnecessary stop (recorded in `docs/reviews/UNNECESSARY-ASK-LEDGER.md` #1 + LESSONS-LEARNED 2026-07-06 / P28). `infra/supabase/migrations-auto/0082-successor-role-and-books-rls.sql` ships it, and in doing so closes a real child-safety gap the review surfaced:

- **The core books tables** (`accounts`, `transactions`, `debts`, `entities`, `projects`) were gated only on **membership** (`user_in_instance`), not role — and no migration ever re-gated them. Since a `child` is a real member row (0055), a child could **read and even write** the books at the DB layer, contradicting FamilyRoster's promise that a minor is "walled out of the family financials by row-level security." The client never renders finance to a child, but a client gate is not a data gate (DR-0074).
- **0082 makes the data gate real, minimal-blast:** read = every member EXCEPT child (so a successor reads; a child cannot); write (insert/update) = members who are NOT child and NOT successor (successor read-only; child walled); delete = owner/admin. **Every other role's behavior is unchanged.**

## Still not done, with why (DR-0075 / DR-0076 — no unverified claim)

- **The confirming LIVE RLS test is not run from here.** 0082's policy logic is verified **statically** against the current policy definitions; the confirming step is an adversarial live test (service-role vs. a child's own path vs. a successor's own path, exact row counts — the DR-0074 method) against the real instance after deploy. **re-review: run the live RLS test this deploy cycle and record the counts.**
- **The DR-0094 "How Money Works" child view** remains unbuilt (its own re-review); this DR gives it a natural home as the youth on-ramp of the same succession ladder.
