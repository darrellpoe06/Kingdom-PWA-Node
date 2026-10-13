---
id: DR-0298
title: "\"Show me on the live site\" is a workflow, not a claim — a real browser opens a shared link on poetech.us, and the agent's own reach is a measured fact"
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0296]
tier: A
entities: [church, poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, WAYS-REVIEW, APP-IS-PRIMARY, MACHINERY-OVER-MEMORY]
source: 2026-08-13 session — Darrell, after the routing fix merged: "test the link on the live site and show me"
---

## Context

DR-0296 fixed the shared-lesson-link routing and pinned it in unit tests. Darrell
then asked the only question that actually settles it: **show me, on the live
site.**

Two things had to be established before anything could be shown, and both were
measured rather than assumed.

## 1. This session cannot reach poetech.us — measured, not recalled

DR-0108 says a stated "can't" is an unverified premise to challenge. So it was
challenged, and it held, by two independent methods:

- `curl` → `CONNECT tunnel failed, response 403`, and the egress proxy's own
  status endpoint names it: `connect_rejected … "host": "poetech.us:443"`.
- `WebFetch` → `{"error_type":"EGRESS_BLOCKED","domain":"poetech.us"}`.

This is the DR-0291 finding recurring in the opposite direction — there, "you
already have ssh and cli access" was a premise that turned out false for the
cloud session. Here the limit is real and the correct response is not to
apologise for it but to **route the observation to something that does have the
reach.** A GitHub runner does. The runner is the eye (DR-0125).

## 2. What could be shown immediately, and what it honestly is

The shipped production bundle was served locally **exactly the way Cloudflare
serves it** — dist at ROOT with `/poetech-app/*` rewritten back, per
`dist/_redirects` — and driven with a real Chromium at phone size. The lesson
link opened Lesson 3 of 12 in its own space, with the time-fit strip and no
player; the bare `?view=church` opened the Worship tab **with** the player.

Stated plainly, because the distinction matters: that is the same code and the
same bundle, but it is **not a request that travelled to the live domain.** The
live evidence available from this position is that `site-health.yml` reports
UP + INTACT + **FRESH at `9378738`** — the served `sw.js` build SHA matches
main's tip — so the domain is serving exactly the commit that contains the fix.
Same-commit plus verified-routing is strong; it is not the same as watching the
live page render, and it was not described as if it were.

## 3. Two findings from building the local mirror

- **The bundle hard-fails to boot with no Supabase env.** `supabaseUrl is
  required` throws at import time, React never mounts, and the boot-heal ladder
  climbs to the "Almost there — one more tap" screen. Production carries the env
  so it does not bite there, but **a config gap presents as the down-site
  screen** with nothing naming the cause — the same misdiagnosis class as the
  2026-07-08 incident (DR-0125). Not fixed here. **re-review: 2026-08-27.**
- **`navigator.serviceWorker.register('/sw.js')` uses a root-absolute path**
  while the app's scope is `/poetech-app/`. It works only because `_redirects`
  publishes dist at root; it is load-bearing on that rewrite and would break
  silently if the publish root ever changed. Named, not changed.

## Decision

**`.github/workflows/live-link-probe.yml` + `scripts/live-link-probe.mjs`** — a
real Chromium, on a runner, opening the exact URLs the Share button produces
against the live domain, uploading a screenshot per case, pass or fail.

It is deliberately NOT a second site-health. `site-health.yml` answers "is the
site up, intact, and serving main's tip" with plain HTTP, and structurally
cannot answer "does the link land on the lesson" — that is decided only after
React boots, routes, and renders.

Four properties make it evidence rather than decoration:

1. **Every verdict is read from the rendered DOM, never from the URL.** A URL
   saying `sub=learn` is what the app was ASKED for; the selected tab and the
   mounted lesson card are what it DID. Reading the URL back would be the
   tautology this exists to avoid.
2. **The bare-church case requires the player to be PRESENT.** Without that
   control, a probe asserting only "no player on a lesson link" would pass just
   as happily against a blank page or a dead site. It is the case that proves
   the probe can see a real page, and it must not be removed.
3. **A retired course key fails loudly.** `expectHeadingIncludes` pins the course
   that must have rendered, so a stale key cannot degrade into "opens Learn
   normally" — correct product behaviour, useless as a probe.
4. **Read-only by construction** — `permissions: contents: read`. It cannot open
   an issue, dispatch a deploy, or push. A failure is a RED RUN plus the
   screenshot.

Three brakes (CLAUDE.md): one runner and a hard 10-minute timeout with no
compute spawned; `concurrency: live-link-probe`, single-instance; and
`LIVE_LINK_PROBE_ENABLED='false'` to pause. Ships active — a bounded,
idempotent, non-spawning, read-only prober is the deploy-freshness class.

## Proven-to-catch (DR-0076 §3)

Not asserted — executed. The probe was run against the served bundle three ways:

- **Fixed build:** 3/3 pass, exit 0.
- **The original bug reintroduced** (the pre-DR-0296 `view`-only
  `getInitialChurchView`, rebuilt): **2 of 3 fail, exit 1**, and the failure text
  is Darrell's own report back in the machine's mouth — *"a live-stream player is
  mounted on a LESSON link"*, *"the deep-linked lesson card never mounted"*,
  *"expected the Learn tab selected; DOM says [Church]"*.
- **The control held while the bug was live:** the bare-church case still
  PASSED, which is what proves the two failures were the routing and not a dead
  page.

Then the fix was restored and the full suite re-run: **7,704 green**, lint clean.

## Consequences

- "Show me on the live site" now has a mechanism. The answer is an artifact from
  a runner, not a sentence from the agent.
- The routing regression is guarded at two levels that fail independently: the
  unit tests (fast, every push) and this browser probe (daily + on demand,
  against the real domain).
- The agent's own reach is recorded as a measured fact rather than rediscovered
  each session.

## Honest remainder

- The probe runs daily, not per-deploy. A regression could ship and sit up to 24
  hours before it fires, which is why the unit tests remain the fast guard. Wiring
  it to run after a successful deploy is the tighter loop and is **not** done
  here. **re-review: 2026-08-20.**
- Its course/lesson keys are literals in the script. If the catalog retires
  `healthy-living` or `world-issues`, the probe fails loudly — correct, but it is
  a maintenance edge, and deriving the keys from the catalog at run time is the
  better close.
- **This DR is written before the probe has ever run against poetech.us itself**
  — this session cannot dispatch-and-read one end to end past its own network
  limit within the turn. Everything above is proven against the identical served
  bundle; the live run is the next observation, not a completed one.
