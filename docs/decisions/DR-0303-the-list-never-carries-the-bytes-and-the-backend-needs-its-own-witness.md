---
id: DR-0303
title: Everyone was locked out of every app on an egress quota — the list never carries the bytes, and the backend needs a witness of its own
date: 2026-08-14
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [poetech, church, moore, tlc]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, COMMUNITY-FIRST, LESSONS-LEARNED, MACHINERY-OVER-MEMORY, PERPETUAL-IMPROVEMENT]
source: 2026-08-13/14 session — Darrell: "Everyone got logged out of their accounts and their pins aren't working to get them back in... well Christina and Shay my sister's MooreDivahs App and my wife's TLC Therapy Solutions App.. also I'm no longer logged into PoeTech App..." then, the next morning, "you go to supabase and check..."
---

## Context

Every account across all four surfaces — PoeTech, The Love Corner, MooreDivahs,
TLC Therapy Solutions — was signed out and could not sign back in. Email links
failed. PINs failed. The family and the church were locked out of their own app.

poetech.us was **up the whole time.** Cloudflare served the shell, the deploy
ledger was green, and `site-health.yml` had nothing to report. That combination
is the tell, and it is the reason this record exists.

## What it actually was

Supabase answered **HTTP 402** on `/auth/v1/token`, `/auth/v1/signup` and every
`/rest/v1` path:

> `Service for this project is restricted due to the following violations:
> exceed_egress_quota. The project owner must upgrade their plan or remove
> spend caps to restore service.`

Read from the edge logs, and independently confirmed by Darrell photographing
the raw string inside the app's own sign-in modal. The org (`PoeTech`) is on
`free`. One root cause, two faces: signed out because the session could not
refresh, and unable to return because the PIN check is an RPC on the same
restricted API.

The database itself was `ACTIVE_HEALTHY` and every row was intact. **Nothing was
lost.** The billing gate sits in front of the API, not the data.

## Where the egress went

Measured, not guessed (DR-0076 §4). The first suspicion was wrong and is
recorded here because the wrong answer was the *loudest* one:

- **`voice_profiles` was 92 of ~120 requests** — 84% of all traffic, and the
  obvious culprit by volume. It is not the driver: every column is
  uuid/text/jsonb metadata, no blobs. **Request count is not bytes.**
- The real spend is `public.feedback`: **119 rows, 6.4 MB — and 6.2 MB of that
  is base64 image data** (4.4 MB in `screenshot`, 1.9 MB in `screenshots`),
  carried by just **24 rows**. The largest single value is 425 kB.

And `subscribeFeedback()` pulled all of it with **`.select('*')`, no limit**:

- once per **sign-in**, for **every signed-in user** — this is wired into the
  main app shell (`poe-financial-mvp-v28.jsx:1965`), not an admin surface, so
  every family member and every church member paid it on every app open;
- and **again, in full, on every realtime INSERT by anyone.**

A handful of people opening the app a few times a day is multiple megabytes per
open, plus a full re-pull for everyone each time a single person submits
feedback. That is a free-tier monthly quota in a few weeks.

## Decision

1. **The list never carries image bytes.** `FEEDBACK_LIST_COLUMNS` names its
   columns explicitly; `screenshot`/`screenshots` are absent. Naming beats
   `select('*')` for a second reason beyond today's fix: a star silently starts
   shipping the *next* large column somebody adds.
2. **The query is bounded** (`FEEDBACK_LIST_LIMIT = 500`), so its cost cannot
   grow without limit as feedback accumulates.
3. **Presence is DERIVED in the database, not painted or dropped** — migration
   0135 adds `has_screenshot` and `screenshot_count` as STORED generated
   columns. The board can say "3 screenshots" truthfully while moving ~8 bytes
   instead of ~260 kB. Dropping the badge would have been a silent lie by
   omission; guessing it would have been a painted number (P15, DR-0076).
4. **The bytes move only when someone looks.** `fetchFeedbackImages(id)` reads
   one row on demand. Best-effort: a failure leaves the card its truthful count
   and no picture, rather than failing the whole list.
5. **The money decision is Darrell's alone.** Restoring service means upgrading
   the plan or lifting a spend cap. This record does not make that call and the
   agent did not and will not spend anything. What is fixed here is the *cause*,
   so the same ceiling is not hit again on the next cycle.

## Proven-to-catch (DR-0076 §3)

Restoring `.select('*')` and deleting the `.limit(...)` → **2 of 15 fail**.
Putting either blob column back in the list → fails. Dropping either generated
column, or renaming one on either side of the DB/client seam → fails the
two-places-must-agree case. 15 pins in
`feedback-list-carries-no-image-bytes.test.js`; suite 678 files green.

**Two defects in this record's own SQL were caught by running it, not reading
it.** The expressions were executed against a temp table with seven row shapes
before the migration was finalised:

- `screenshot IS NOT NULL OR (jsonb_typeof(...) = 'array' AND ...)` returns
  **NULL**, not `false`, when both columns are null — SQL three-valued logic,
  `false OR NULL` is NULL. That is 95 of the 119 rows. The client would have
  fallen through to its byte-based fallback and computed `false` anyway: the
  right answer for the wrong reason. `COALESCE` makes it an honest boolean.
- An **empty** `screenshots` array shadowed a legacy `screenshot`, so a row
  reported `has_screenshot = true` with `screenshot_count = 0` — the two
  columns disagreeing about the same row.

Both now pinned. Darrell, 2026-08-13: *"nothing should happen by luck... it
should be evaluated by the system."* A generated column that is right because
something downstream compensates is exactly that luck.

## The structural finding — the backend has no witness

This is the part that outlives the fix.

The house has real instruments and every one of them was green: `ci.yml` proves
the build, the deploy healers prove a deploy fired, `site-health.yml` proves
poetech.us is up + intact + fresh, `boot-check` and `sw-nav-check` prove the
first and second visit. **Not one of them makes an authenticated request to the
backend.** A 402 from Supabase does not move a single one of them, because the
HTML still serves perfectly from Cloudflare.

So the detection path was, again, **the principal's own eyes** — and this time
via three other people first (Christina, Shay, his wife). Detection delay:
roughly **20 hours** (first 402 at 2026-08-13 16:12Z; still 402 at 2026-08-14
12:06Z when it was diagnosed).

That is **P31 recurring on a new axis.** P31 said: deploy-green is not site-up,
so the site needs its own witness. The same sentence is now true one layer down:
**site-up is not app-usable, so the backend needs its own witness.** A probe
that fetches HTML can never see a locked front door that lives behind the HTML.

## Consequences

- The dominant egress source is removed; the same ceiling is not re-approached
  by ordinary use.
- Feedback images load when a person opens the card — which is also simply
  better behaviour than shipping 6 MB to people who never open one (DR-0075).
- A new public-domain-sized lesson for the ledger (P40, below).

## Honest remainder

- **CLOSED, same session.** The backend witness was written rather than dated:
  `site-health.yml` step 7 probes `auth/v1/health` with the anon key — the path
  the app itself walks — files a 402 on the rolling `incident` issue with the
  violation named, retries once before calling it unreachable, and never reads
  an unmeasured backend as healthy. Proven against a local server returning
  402 / 500 / 000 / 200 / 401.

- **A NUMBER IN THIS RECORD WAS WRONG, and the correction belongs here rather
  than quietly in a later file.** The sentence above originally read that the
  witness "would have cut a 20-hour blind window to ~10 minutes," on the
  strength of the cron in `site-health.yml` (`*/10 * * * *`) and its own comment
  ("every 10 min"). **Measured instead of read, 2026-08-14:** across 28
  scheduled runs the real gap is **mean 67 minutes, range 38–154**. GitHub
  throttles scheduled workflows, so the cron is a request, not a guarantee.
  The honest claim is that the witness cuts a ~20-hour blind window to **about
  an hour, worst case ~2.5 hours** — still the difference between a family
  finding an outage and a system finding it, but roughly 6× what was written.
  Citing our own configuration as if it were a measurement is the exact failure
  DR-0076 §4 names, committed inside the record that invokes it.
  - The workflow's own "every 10 min" comment is likewise a claim the schedule
    does not keep (surface-says-truth applied to a comment). Corrected in the
    file to state the measured cadence.
  - Whether ~1 hour is good enough for a total-lockout class is a real open
    question, and a cheaper answer than fighting the scheduler probably exists
    (the probe is one HTTP request; a sovereign NAS loop or an external monitor
    could run it far more often). Not decided here. **re-review: 2026-08-21.**
- **Storage was examined and cleared as today's driver, but it is the next
  ceiling.** `moore-showcase` is a PUBLIC bucket holding camera-original JPEGs —
  one is **10.6 MB**, and three files are 24 MB of its 28 MB. Nothing measured
  today says those were served often enough to matter, and I am not claiming
  they were. But a public gallery of unresized phone originals is an egress
  driver waiting for traffic, and image transformations are not available on the
  free plan. Resizing at upload is the fix. **re-review: 2026-08-21.**
- **I cannot read the actual egress meter.** There is no usage/billing tool on
  the Supabase MCP channel, so the 6.2 MB × frequency reasoning above is
  measured on the *table* and the *code path*, not read off a bill. It names a
  sufficient cause; it does not prove it was the only one.
- The migration ships through the `db-migrate` lane. If the deploy lands before
  the migration, the list query asks for two columns that do not exist yet and
  the remote feedback slice degrades to empty (it already `console.warn`s and
  returns null on error) until the migration catches up. Named rather than
  discovered.

## Links

`app/src/lib/feedback-sync.js`,
`infra/supabase/migrations-auto/0135-feedback-screenshot-presence-without-the-bytes.sql`,
`app/src/__tests__/feedback-list-carries-no-image-bytes.test.js`,
`.github/workflows/site-health.yml`, [DR-0125] (the site's witness — the sibling
this extends), [DR-0107] (prove the deploy), [DR-0076], [DR-0075],
LESSONS-LEARNED P31 / P26 / P15.
