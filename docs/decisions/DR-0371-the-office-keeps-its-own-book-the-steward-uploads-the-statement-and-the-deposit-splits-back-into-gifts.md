# DR-0371 — The office keeps its own book: the steward uploads the statement, and the deposit splits back into gifts

**Date:** 2026-09-12 · **Status:** accepted · **Tier:** B · **Area:** church · **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive — the steward described the work, and the work was re-typing

From the Love Corner planning meeting, 2026-09-11. She named the loop herself:

> *"the transfer, put it in Excel, then put it in my other report, then create the reports for the end of the month."*

One Cash App transfer lands in the bank as a single deposit carrying many people's gifts. The statement already itemises who gave, when, how much, and what they wrote on it. Every figure being re-typed was already in a file.

**DR-0362** shipped the reading and the arithmetic — `cashapp-statement.js`, `giving-batch.js`, `giving-donor-match.js`, `giving-reports.js`, 58 tests. It shipped with **zero consumers.** A library the steward cannot open is not a delivered feature; the app is the primary artifact and the capability had not reached it. This record is the surface that closes that gap.

## The two walls this sits between, and why it is a new table rather than a widened policy

This is the part that governs every future edit here.

- **0184** — the giver's own ledger — is owner-only by construction: *"An instance admin CANNOT read these rows."* That migration also anticipated this one in as many words: *"If the church office ever needs an aggregate, that is a separate, consented, decided surface — never a widening of this policy,"* and *"The church's official contribution statement comes from the church office's own books."* This is that separate surface. 0184's policy is untouched, and nothing here reads it.

- **0209** — the pastoral roll — refuses to carry a giving amount by construction, because *"a church knowing what each person gives is the oldest way a congregation gets quietly sorted."* That refusal stands exactly as written.

Read carelessly these two look like a prohibition on the very thing the meeting asked for. Read precisely they are not. The danger 0209 names is giving appearing on **the record a staff member opens while deciding how to treat somebody**. A congregation that issues a year-end contribution statement must nonetheless know who gave what — there is no way to hand somebody a statement of their giving without a record of their giving. The treasurer already holds this exact data; it is printed on the statement in her hand. So the wall is not about who may read the book, it is about **where the book may appear**.

## Decisions

1. **The office's contribution book is its own tenant-scoped, RLS-gated record (migration 0214)** — `church_giving_batches`, `church_giving_claims`, `church_giving_aliases` — replacing a spreadsheet on one laptop. It does not create an exposure that did not exist; it puts one under policy.

2. **Read access is the office and only the office: `('owner','admin')`, the same two roles at the database and in the app.** There is deliberately no member policy, not even for a member's own claims — a policy shaped `parishioner_user_id = auth.uid()` is one careless `OR` away from exposing the congregation to itself, and the member already has their own ledger in 0184. The predicate lives once, in `lib/church-access-store.js`, so the tab, the route and the RLS cannot drift. Giving a member a confirmed view of what the office recorded for them is a real and good idea and is its own decided surface. **re-review: 2026-12-12.**

3. **The book is never joined to the private ledger or to the pastoral roll, and a test enforces it.** A comment cannot stop a future edit; a failing build can. `church-giving-book.test.js` refuses any import or query of `giving_records` / `giving-records-sync` / `church_member_records` from either the sync layer or the screen — checking the **code**, with comments stripped, so the prose explaining the boundary is allowed to stay rather than being deleted to get green. **Proven-to-catch:** the wall is run against a doctored copy of the real file that imports the private ledger, and is required to reject it.

4. **The name on the statement is the identity; the account link is an optional extra a person confirms.** Most Cash App givers have no account in this app and never will. `giver_name` is NOT NULL and permanent, "not yet identified" is a first-class state that keeps the giver's name and their money on the books, and `parishioner_user_id` is nullable. The database refuses the half-state: a person-link without a `match_confirmed_by` is rejected by CHECK constraint, because an unattributed claim about somebody's money is exactly what must never appear by accident.

5. **Nothing is matched automatically, at any confidence.** The matcher proposes and a person decides. A wrong match puts one member's gift on another member's contribution statement, so there is no score at which it self-applies — even an exact name comes back `needsReview: true`. Ties are reported as ties.

6. **Totals are never forced to agree, and an unchecked batch never reads as a balanced one.** The steward enters what her **bank** shows, by hand; reconciling the imported file against itself always balances and proves nothing, so the bank is the independent witness. With no figure entered the surface says *"Not checked yet"* rather than reporting a tie it has not verified.

7. **Re-importing the same statement cannot double-count.** `(instance_id, source, source_ref)` is UNIQUE, enforced by the database rather than by a client-side check a refactor could drop, and rows already present are reported as skipped. A gift carrying no processor id is refused at the door rather than admitted as a row that would double next month.

8. **A partial import is reported, never hidden.** PostgREST has no transaction across two statements, so if the claims insert fails the batch row it just wrote is deleted and the failure is reported. A book that is wrong is worse than a book that is empty, because only the empty one gets refilled.

9. **Money crosses the cents/`numeric(12,2)` boundary once, in one tested place.** Verified rather than assumed: the round-trip is exact across 142,858 values including negatives, and the specific IEEE-754 cases that break naive conversion are pinned — `parseFloat('0.29') * 100` is `28.999999999999996`, and truncating it loses a cent on a row whose value is a typical processor fee.

## What was measured

- `npm run verify` green: **945 files, 14,083 tests, exit 0.**
- **50 tests** across `church-giving-book.test.js` (31) and `church-giving-book-render.test.jsx` (19), four of them proven-to-catch by doctoring the real source and requiring failure: the private-ledger wall, the route's office guard, an auto-selected donor match, and an unchecked batch reporting itself balanced.
- Five repo gates caught real defects in this work and were fixed rather than worked around: missing focus rings on three buttons (a keyboard user could not see where they were), the surface missing from `VALID_CHURCH_SUBS` (not deep-linkable), missing from the feedback-area list (unreportable), and two regenerated ledgers.
- The monolith freeze held at the documented minimum: **+1 line, the render-switch line only.** The office-gate comment moved into `church-access-store.js` beside the predicate, which is where a reader looks and which is also what makes decision 2 structural.

## Not verified, stated plainly

~~**Migration 0214 has not been executed.**~~ **CLOSED 2026-09-12, the same day, by observation rather than by the workflow's word.** It merged as `e301091` and `db-migrate` run `34718145238` completed **success**. Because "the workflow exited 0" and "the security property exists in the database" are two different claims, the database itself was then read (DR-0076 §7, independent verification):

- **The three tables exist with RLS enabled** — `church_giving_batches`, `church_giving_claims`, `church_giving_aliases`.
- **The policies are as written**, read back from `pg_policies`: one `<table>_office` policy per table, `ALL` to `authenticated`, with both `USING` and `WITH CHECK` as `COALESCE(user_role_in_instance(instance_id), '') = ANY (ARRAY['owner','admin'])`. **No member clause exists to be widened, and no anon grant exists at all** — which is decision 2 confirmed in the database rather than in a comment.
- **Both standing overlays applied to all three tables** (`viewer_readonly_*`, `assistant_scope_*`), so an assistant cannot read the congregation's giving. That is what re-running them was for.
- **Both integrity walls are live, not merely asserted in a test** — `CHECK (parishioner_user_id IS NULL OR match_confirmed_by IS NOT NULL)` (decision 4: no gift attaches to a person without recording who said so) and `UNIQUE (instance_id, source, source_ref)` (decision 7: a statement re-imported cannot double-count).

The deploy was proven too, per DR-0107: `deploy-cloudflare-pages.yml` run `34718145424`, `head_sha e301091`, conclusion success.

**The screen has not been driven in a REAL browser against REAL data.** It is now mounted: `church-giving-book-render.test.jsx` (19 tests) renders the actual component in jsdom against a mocked sync layer and drives the steward's path — every honest state distinguishable on screen, sub-dollar and negative amounts rendering rather than `NaN`, the review list offering a choice with nothing preselected, and no write path firing from reading. Two of those are proven-to-catch: preselecting the best match, and letting an unchecked batch claim it balances, each fails the suite.

That closes the "does it even render" question, which every other test in this feature would have missed — all 31 of them read source text or exercised the pure libraries, so a component that threw on mount would have passed them all. It does NOT close the remaining one: jsdom is not a browser, a mocked sync layer is not the database, and nobody has yet opened this screen signed in as the office with a real Cash App export in hand. The sandbox has no route to poetech.us (LESSONS P31), so that pass belongs on the live build after deploy, per DR-0104. **re-review: 2026-09-19.**

## Related

DR-0362 (the libraries this finally surfaces) · DR-0061 (reality-trace) · DR-0065 (the app is the primary artifact) · DR-0076 (verification, proven-to-catch) · DR-0060 (RLS is the real gate) · migrations 0184, 0209, 0214.
