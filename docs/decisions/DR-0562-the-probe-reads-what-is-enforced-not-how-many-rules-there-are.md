# DR-0562 — The probe reads what is ENFORCED, not how many rules there are

- **Status:** accepted
- **Tier:** B
- **Type:** orchestration
- **Date:** 2026-09-22
- **Scope:** `scripts/sovereign-read-over-tailnet.sh` (`tables` mode gains `---POLICIES---` and `---GRANTS---`)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — a count is not an answer), REVIEW-OUR-WAYS (DR-0108), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell 2026-09-22 ("What's enforced?!"); the `tables` probe run earlier the same evening, which could only count

---

## Why a count was not enough

The `tables` probe reported `voice_profiles` with **11 policies** while migration 0047 creates **4**. That is either harmless history or a live rule nobody can read in source control — and on a table that holds consent, the difference is the whole question. A count cannot tell them apart, so I said so and left it open rather than guessing.

Darrell's answer to leaving it open was one line: **"What's enforced?!"**

## What shipped

`tables` mode now returns, for every table asked about:

- **`---POLICIES---`** — each policy's NAME, the command it covers, the roles it applies to, and its `USING` and `WITH CHECK` expressions. That is the whole of what a policy enforces.
- **`---GRANTS---`** — which role holds which privileges, because RLS gates *rows* and a GRANT is what reaches the table at all, and the two fail in completely different ways.

Read-only catalog queries. The table list was already validated against `^[a-z0-9_]+(,...)*$` before it reaches any SQL, so these inherit that wall; no row contents are read, and the existing reader guard suite still passes unchanged.

## What it found immediately — including two of my own errors

**The eleven are real enforcement, and seven of them ARE in this repo.** Four are 0047's own (`read` / `insert` / `update` / `delete`, carrying the `created_by = auth.uid()` self-consent wall). The other seven are **restrictive** overlays: `assistant_scope_*` (role `IS DISTINCT FROM 'assistant'`) and `viewer_readonly_*` (role `IS DISTINCT FROM 'viewer'`). Being restrictive, they intersect rather than widen — an assistant touches nothing, a viewer reads and cannot write.

**Correction 1.** I had written that "the two dynamic policy loops use explicit table arrays that exclude it, and there is no catalog-driven loop." **There is.** Migrations 0125, 0126, 0130 and 0190 select every public table carrying a `uuid instance_id` with RLS enabled, straight out of `pg_class`, and apply policies to each. My grep for the literal string `voice_profiles` missed them because they never name it — they discover it. A grep for a table name cannot find a migration that enumerates the catalog, and that is now a known blind spot rather than a surprise.

**Correction 2.** I had reasoned that the `permission denied for table voice_profiles` seen in nas-health looked like a missing table-level grant for `supabase_admin`. The grants read `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`. That hypothesis is **dead**, and I do not have a replacement — it needs the exact log lines from that run, and it is recorded here as open rather than replaced with a second guess.

## Verification

`bash -n` clean; `sovereign-reader-guard.test.js` 12 of 12 green (the confidentiality and masking walls are unchanged); dispatched live against the sovereign database and returned all eleven policies and four grant rows.

## Limits, stated

1. **The `permission denied` in nas-health is still unexplained.** Grant present, catalog readable, and the census still errored four times. Needs the exact lines from run 35759346227, which sit earlier in a 1,187-line log than any tail retrieved so far. `re-review: 2026-09-29`.
2. **This reports what EXISTS, not whether it is what we INTENDED.** Nothing yet compares the live policy set against what the migrations should have produced — a drift gate of the kind `md5(prosrc)` already gives for functions. That is the durable version of tonight's surprise. `re-review: 2026-10-22`.
3. **Policy expressions print verbatim**, so a future policy whose expression embedded something sensitive would print it. Today none do; the masking the reader applies to feedback text does not cover this section. `re-review: 2026-11-22`.
