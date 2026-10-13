# DR-0376 — Every door gets a way to say "this is broken"

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** business · **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

DR-0374's own open item, pulled forward rather than left on its date (DR-0236: "later" is not a scheduling tool). Darrell asked *"does Moore Divahs have a feedback process?"* while Sterling's broken order was being fixed. The answer was **no**, and the consequence was already measured: his order inquiry failed on **every attempt for the entire life of her door**, `crm_leads` held zero rows, nothing alerted anyone, and **the only reason it was ever discovered is that Sterling told Shay and Shay told Darrell.** A favour from a customer is not a process.

`grep -i feedback` over `MooreDoor.jsx` returned nothing. Not just Moore Divahs — no business door the registry serves has one.

## Why neither existing channel covers it (checked, not assumed)

- **`public.feedback`** is PoeTech's own loop. Its client seam requires sign-in and enrols the writer into `poe-family` (`feedback-sync.js:82`). It reaches Darrell, not the business owner, and it sits behind *our* product's login.
- **`send_business_message`** opens with `IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'`. Read from the live function body, not inferred. The message thread **cannot** serve a signed-out customer — and that is sound design, because `customer_user_id` *is* the thread identity, so an anonymous message has no thread to belong to and no way for the steward to reply.

**The property that decides everything: the person who meets a broken door is the least likely to be signed in.** Both channels fail that test. Hence a third seam, shaped like the forced-safe capture RPC.

## Decisions

1. **The seam is anon-callable by design** (`door_feedback_submit`, migration 0216). `SECURITY DEFINER`, granted to `anon`, and it records `auth.uid()` as a **nullable author** rather than using it as a gate. A customer who cannot even sign in still reaches the business.

2. **NO door or area allowlist in SQL — this is 0215's lesson applied the same day it was learned.** 0215 existed because `crm_capture_lead` hard-coded a pipeline allowlist that a second, hand-maintained JavaScript registry was supposed to match and did not, refusing every order for months. So 0216 pins the tenant by **a real row lookup in `instances`** and otherwise validates only *shape* — non-empty, trimmed, length-capped. The door and area vocabularies live in `door-feedback-sync.js` **alone**. A new client door added as a registry row (DR-0114) works here on the day it ships, with no migration and nothing to keep in sync. **One registry, not two.** Enforced by a test that reads the migration with comments stripped.

3. **Over-long values are TRUNCATED, never rejected.** A customer reporting a break must not lose the report to a validation message about a field they did not type.

4. **Office-only read** — `('owner','admin')` of the instance it was filed against, the same predicate `church-access-store.js` holds and 0214 uses. Deliberately **no member policy and no self-read policy**: a customer telling a business something is broken has not published it to other customers. The table is `REVOKE ALL ... FROM PUBLIC, anon`; the anon path is the function, not the table.

5. **A flood brake, because an anon write path without one invites abuse** — per-instance-per-minute, deliberately generous so a real outage (many people hitting one broken door in the same minute) still gets through while a script does not.

6. **The read side ships in the same change.** `DoorReportsSection` in the steward board, with triage order (what nobody has looked at first, oldest within that) and a status the office moves. **Shipping the form alone would be a write-only hole — the exact "library with zero consumers" failure DR-0371 named.** A report nobody can read is not a feedback process.

7. **The affordance sits BELOW the content and above the sibling nav** — a safety net, not a call to action competing with her order form.

## Proof

- `npm run verify` green: **952 test files, 14,224 tests**, 1 skipped.
- 22 tests in `door-feedback.test.jsx`, **mounting** the component and driving it with **no session at all**.
- **Proven-to-catch twice** by breaking the real source: gating the form on a session → **11 of 22 fail**; reintroducing 0215's hard-coded area allowlist into the migration → the single-registry test fails.

**Three gates caught real defects in this work, each fixed rather than worked around:**

- **The component would have crashed on the live door.** `DoorFeedback.jsx` imported only `useState`; this project uses the **classic** JSX runtime, so it compiled, **passed lint**, and threw `ReferenceError: React is not defined` on first render. Only mounting found it. This is the DR-0371 lesson repeating: a test that reads source cannot see a component that cannot render.
- **The legibility guard** caught an inline status-pill colour rendering **3.94:1 and 2.56:1** on the midnight card surface. Replaced with themeable classes; the health ledger regenerated. The shrink-only baseline was **not** touched — the violation was fixed, not baselined.
- **Three overlay gates** (tenancy, viewer read-only, assistant scope) caught 0216 creating an instance-scoped table without re-running the standing overlays. Without that, a read-only **viewer could write** `door_feedback`, and an **assistant could read** what customers told a business privately about its own door. DR-0347's rule, enforced.

## Not done / open

## Executed and witnessed, after merge

Merged as `5cbde600`. Verified on **both** databases, per DR-0374's correction — hosted is a mirror, and the sovereign stack is what the app actually uses:

| Property | Method | Result |
|---|---|---|
| `door_feedback_submit` on **hosted** | Direct query of `pg_proc` | present · `md5` `63cf89507ec6cc0bf35253e461198c3c` |
| `door_feedback_submit` on **sovereign** (live) | `sovereign-read` run 34742113110, `functions=door_feedback_submit` | `md5` **`63cf89507ec6cc0bf35253e461198c3c` — identical**; `---MISSING--- none`; `sovereign_replay=222` |
| anon can call the seam | `has_function_privilege('anon', …, 'EXECUTE')` | **true** — a signed-out customer can report |
| anon can read or write the **table** | `has_table_privilege('anon', …)` | **false / false** — the anon path is the function, never the table |
| RLS | `pg_class.relrowsecurity` | on |
| Policies | `pg_policies` | 8 — `door_feedback_office[ALL]` **plus** `assistant_scope_*` ×4 and `viewer_readonly_*` ×3 |
| Deploy | run 34741979843, `head_sha` 5cbde600 (DR-0107) | success |

**The policy row is the one that matters.** The overlays the three gates forced into 0216 are *provably applied in the database*, not merely written in the migration file — so a read-only viewer genuinely cannot write `door_feedback`, and an assistant genuinely cannot read what customers told a business privately about its own door.

**A limit of the measurement, stated rather than glossed:** the `definitions` probe reports functions only, so the table's RLS and policies were verified on **hosted** and are carried on the sovereign side by the replay plus the identical function md5 — not read back directly there. Extending the probe to tables and policies is the obvious next turn of DR-0375's instrument.

## Not done / open
- **Nobody has filed a report on the live site.** jsdom is not a browser; the sandbox has no route to poetech.us (P31). **re-review: 2026-09-20.**
- **Only Moore Divahs has a door today**, so only her door carries this. The registry is the seam (DR-0114), so client #2 inherits it — but that is asserted from the registry's shape, not observed, since no second row exists.
- **Still nothing alerts anyone.** This gives a customer a way to *report*; it does not page the office when a report lands, and it does not notice a capture RPC failing silently. That is the other half of DR-0374's finding and remains its own work — **re-review: 2026-09-27.**
