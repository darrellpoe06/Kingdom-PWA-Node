---
id: DR-1000
title: A 200 is not an answer — only the server's own JSON is
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0996]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, HOLD-THE-HAND-OF-THE-PROCESS, PERPETUAL-IMPROVEMENT]
source: 2026-10-13 — site-health on the merge SHA of #2150, read as DR-0125 requires
---

## Context

DR-0996 merged the phone-backup lane as `e064f021f`. Proving the deploy was
not enough (DR-0125: prove the SITE, not only the pipeline), so `site-health`
was dispatched on that SHA. It came back **failure**, and the numbers inside
it say two different things:

```
PAGES_CODE: 200      SERVED: e064f02      MAIN: e064f02
VERDICT: KNOWN       DAYS: 4
REASONS: NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status
  answered with 'text/html; charset=utf-8', the SPA shell, instead of its
  Function's JSON. When this is true EVERY NAS-backed road is dark at once:
  /sb sign-in, /n8n, /cams, /taxes, /openers, /llm, /reviews, /voice,
  /nas-photos, /ways, /scribe
```

The site is **up and serving the exact merge SHA** — that half is the proof
DR-0125 asks for. The failure is #2057, open since 2026-10-09, Cloudflare-side,
which no code change in this repository reaches.

**But `/nas-photos` is on that list** — the transport the lane merged minutes
earlier depends on. So the outage was not someone else's problem to note; it
was a live test of what the new card does when its road is dark.

## What was measured

`checkMediaService()` as merged, read against what the outage actually serves:

```js
    const resp = await fetch(mediaStatusUrl('service-probe-0000'), …);
    if (resp.status === 404) return 'needs-update';
    if (resp.status === 401) return 'unauthorized';
    if (resp.ok) return 'ready';          // ← HTTP 200, text/html, SPA shell
```

With no Function invoked, `/nas-photos/media-upload-status` falls through to
the SPA: **HTTP 200, `content-type: text/html`**, the app's own `index.html`.
`resp.ok` is `true`, so the probe returned **`'ready'`** — the card enabled
its buttons and claimed the NAS was ready while every road to it was dark.

The comment directly above that line reads *"The card states the real one,
never a fake ✓."* It was false the day it merged, and reachable on the live
site, not in theory.

**The repository had already learned this exact lesson.** `funnel-proxy.js`
has carried it since 2026-09-09, when Cloudflare's HTML 1016 page streamed
through into supabase-js and printed itself as a profile status line. That
comment was read during this very drain and not connected to the new probe.

**What was NOT broken, checked rather than assumed:** the upload path is
already honest. Every `.json()` there carries `.catch(() => null)`, and the
completion branch requires `j.ok === true`, returning `'bad-response'`
otherwise. An HTML body makes uploads *fail*, reported in the card's own
"did NOT make it" list. The only lie was the readiness claim.

## Impact

Readiness now requires the shape only `photo_server.py` produces: parsed JSON
carrying `ok: true`. A `!resp.ok` short-circuit keeps the proxy's JSON 502 out,
and anything else — the SPA shell, an edge error page, a 200 whose body is not
the server speaking — reads `'unreachable'`, which is the truth. The existing
banner already says the true thing for that state: *"Can't reach the NAS
backup service right now — nothing is lost, and nothing pretends to be backed
up."*

**What this does not fix:** #2057 itself. While it holds, the backup card
correctly reports unreachable, and the NAS redeploy will not change that —
the road is dark at Cloudflare, not at the NAS. That is now stated honestly
instead of being contradicted by a green button.

## Decision

A transport that answers is not a server that answered. Any probe deciding
whether a sovereign surface is usable must require the server's own response
shape, never `resp.ok`, because every same-origin NAS road in this app can
return a 200 that came from the SPA.

## Verification after merge

- **Proven-to-catch, two of three, against the genuinely merged code:**
  restoring `if (resp.ok) return 'ready'` fails *"NOT ready when the SPA shell
  answers 200 because no Pages Function ran"* and *"NOT ready when a 200
  carries JSON that is not the server saying ok"*. The third case (the proxy's
  JSON 502) **passes in both versions** — `!resp.ok` already covered it — so it
  is recorded as a standing regression guard, not as proof of this fix. Saying
  otherwise would be the over-claim DR-0076 forbids.
- 35 tests green across the media-backup and card suites; all 20 gates green;
  lint clean.
- **Not re-run locally in full, deliberately:** DR-0996 recorded that main
  merges about every 20 minutes while the local full verify takes 35–40, so
  `push-stranding-guard` refuses any branch re-verified locally. CI's sharded
  suite is the required gate and runs on the pushed head.
- `re-review: 2026-10-20` — with DR-0996's items: whether #2057 has lifted,
  and whether any OTHER sovereign surface's readiness probe trusts a bare
  200. This fix covers the one road it was measured on; the same shape may
  sit on the other ten the outage listed.
