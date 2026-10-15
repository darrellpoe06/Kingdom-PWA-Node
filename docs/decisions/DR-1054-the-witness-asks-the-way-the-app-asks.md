# DR-1054: The witness asks the way the app asks — "backend auth: HTTP 200" never meant the app could sign in

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (the instrument the house reads to decide whether it is down)
**Type:** word
**Area:**
- `scripts/app-shape-verdict.mjs` (new — the verdict, where a test can reach it)
- `app/src/__tests__/app-shape-verdict.test.js` (new — proven-to-catch, each real failure shape)
- `.github/workflows/site-health.yml` (the cross-origin, browser-shaped probe; the four values carried into the ledger line and both incident bodies)
- `docs/99-session-notes/2026-10-15-cloudflare-support-package.md` (the #2057 ticket, written and ready)

**Grounds:** Darrell, 2026-10-15, three screenshots in one hour from his phone at The Love Corner — the Choir tab, My Record, the harvest ledger, each a 15-second failure — and: **"Comprehensive understanding of the system and processes then opportunities and constraints then solutions... fix it soundly."**
**Principles:** DR-0076 §3 (proven-to-catch), §4 (measure, do not claim), §7 (independent verification), §8 (honest uncertainty); DR-0125 (the site has its own witness); DR-0107 (prove the thing, not the pipeline); LESSONS P31

## Context

While he was meeting those three failures, `site-health.yml` ran and reported,
on his exact build:

```
PAGES_CODE: 200   SERVED: ef26a33   MAIN: ef26a33
BACKEND_CODE: 200
```

**Both were true, because they are different sentences.** `BACKEND_CODE` is a
single `GET {SB_URL}/auth/v1/health`, from a GitHub runner, carrying **no
`Origin` header**. The app is a browser on a phone making **cross-origin POSTs**
— and since 2026-10-09 it makes them to the absolute Tailscale Funnel origin
rather than same-origin `poetech.us/sb`, because every Cloudflare Pages Function
is dark (#2057, day 6).

The repoint that moved it wrote its own hazard down, in
`deploy-cloudflare-pages.yml`, and accepted it knowingly:

> "The throttle is not firing right now. It may begin firing under real family
> load — that is the risk being accepted, knowingly, against a family that is
> locked out of its own app with meetings to keep."

**A GET with no Origin cannot exercise that.** So the instrument has only ever
measured that the road answers a probe.

This is DR-0125's own principle one layer further down. That record established
that deploy-green is not site-up, which is why `site-health.yml` exists. P31
added that site-up is not app-usable, which is why the backend step exists.
**Answering a probe is not answering the app** — which is why this step does.

## What was measured

- **The witness's own shape**, read at `site-health.yml:374-382`: one `GET`,
  anon key in a header, `--max-time 20`, no `Origin`, one retry. There is also
  a POST probe in this file — against the hardcoded `poetech.us/sb`, which the
  2026-10-09 repoint moved the app OFF. **The witness did not follow the app.**
- **What the ledger prints**: `backend auth: HTTP 200` appears on all 39 of
  #2057's comments and in both incident bodies. Six days of a reassuring number
  beside a family that could not use the app.
- **What the app actually sends**, from `lib/supabase.js` and every church
  surface: a cross-origin POST with `Origin: https://poetech.us`, preceded by
  the browser's own CORS preflight.
- **The failure #2057 opened on**, verbatim from its body: *"a POST to the
  app's own auth road (poetech.us/sb/auth/v1/token) returned an EMPTY BODY
  twice. The browser calls .json() on that and fails with 'Unexpected end of
  JSON input', so nobody can sign in. Note that GET /sb/auth/v1/health can
  still answer 200 while this is broken: a GET is not a sign-in."* **The
  incident's own first sentence said the probe was the wrong shape, and the
  probe was never changed.**

## Impact

**What it buys.** The ledger stops printing a comforting half-truth. A run that
cannot sign in says so, in the three shapes that actually happen, naming the
road it asked.

**What it costs.** Three HTTP requests per run against a deliberately wrong
credential at an unroutable `.invalid` address. Nothing is signed in and no real
credential is sent.

**What it does not do.** It does not fix #2057 and it does not fix the throttle.
It makes the instrument tell the truth about both. The ticket for #2057 is
written and ready at
`docs/99-session-notes/2026-10-15-cloudflare-support-package.md`; sending it is
the only step that reaches the cause, and it is Darrell's hand.

## Decision

1. **The witness asks in the app's shape**: the browser's CORS preflight, then
   a cross-origin POST to the real sign-in road, against `SB_URL` — **the URL
   the app was actually built with**, so a future repoint carries the witness
   with it instead of leaving it behind.
2. **The body's LENGTH is measured, not only the code.** An empty body arrives
   with an ordinary HTTP code; that is exactly how #2057 hid for a day.
3. **The verdict lives in a module, not in the shell.** The bell taught this:
   `curl -sS ... || echo "::warning::"` could never fire on a 404, because curl
   without `-f` exits 0, and nobody could test a decision buried inside a
   36,000-character step. The cure there was `scripts/ops-announce.mjs`,
   unit-tested against the exact 404 body. Same cure, same convention, same
   exit code 3.
4. **The findings are ordered**: no-answer ▸ empty-body ▸ no-CORS. A road that
   did not answer tells you nothing about its CORS headers, and reporting the
   shallower fault sends someone to fix the wrong thing.
5. **Unknown is never up.** A run with no `SB_URL`/`SB_ANON` reports
   `not-measured` as a finding, never as a pass.

## Verification

- **Proven to catch, end to end, with the real curls** — not reasoned about.
  A local HTTP server was stood up in each shape and the workflow's own probe
  block run against it:

  | shape | measured | verdict | exit |
  |---|---|---|---|
  | healthy | `pre=200 allow=https://poetech.us post=400 bytes=73` | `answered` | **0** |
  | empty body | `pre=200 allow=... post=200 bytes=0` | `empty-body` | **3** |
  | no CORS | `pre=200 allow='' post=400 bytes=73` | `no-cors` | **3** |
  | dead port | `pre=000 allow='' post=000 bytes=0` | `no-answer` | **3** |

  The empty-body case reproduces #2057's opening sentence exactly, on an
  ordinary HTTP 200 — the case the old probe calls healthy.
- **The two `bash -e` traps this file documents did not bite.** The dead-port
  run completed and reported, rather than killing the step, because the
  `|| XO_PRE=""` + `if` pattern this file's own comments prescribe was followed.
  That was checked by running it against a dead port, not by reading it.
- **14 unit cases** on the verdict, weighted toward the failures. **The test
  caught a real gap in the module and the module was changed, not the test:**
  the empty-body reason did not name the road it asked. With 39 look-alike
  comments on #2057, a reason with no road sends the next reader to the wrong
  host.
- **`bash -n` on the generated step and a YAML parse** both clean, so the
  workflow is not shipped on a reading.
- **Honest limit (DR-0076 §8).** This sandbox has no route to poetech.us or to
  the Funnel, so **the new probe has not yet run against the real road.** Its
  logic and its shell are proven; its first live reading comes from the next
  scheduled run. And it is **not claimed here that the Funnel throttle is what
  stalled Darrell's phone** — that is an unmeasured hypothesis the repoint
  named in advance. This change is what makes it measurable.
  **`re-review: 2026-10-16`** — read the first live run and record what the
  app's shape actually returns.
