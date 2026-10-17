# DR-1090: The road signs its own answer — eight days of outage that never happened, because a content type was read as a verdict

**Date:** 2026-10-17
**Status:** accepted
**Tier:** B (the standing witness over the live site; what the family is told when sign-in is doubted)
**Type:** way
**Area:**
- `app/functions/_lib/funnel-proxy.js` (every Pages road signs its answer `x-poetech-road: pages-function`)
- `.github/workflows/site-health.yml` (the hourly witness decides on the signature, not the content type)
- `.github/workflows/cf-pages-diagnose.yml` (a per-road truth table across both hosts, replacing one road generalized to a layer)
- `app/src/__tests__/every-road-signs-itself.test.js` (new — 9 cases, proven to catch three ways)

**Grounds:** Darrell, 2026-10-17, on being walked through terminal commands for a seventh day: **"I'm not wanting to do 15 thousand moves... get to it.... what ?!!!!"**
**Principles:** DR-0076 (§4 measure, don't claim; §8 provenance and honest uncertainty); DR-0125 (the site has its own witness); DR-0107 / P26 (a down site is the worst outcome); P53 (a witness that cries wolf drowns out the one that matters); DR-0061 / P15 (reality-trace — name the real data before building)

## Context

#2057 opened 2026-10-09 and ran to 2026-10-17 with 38 comments, every one a bot,
every one the same headline:

> **NO PAGES FUNCTION IS RUNNING** — ... When this is true EVERY NAS-backed road
> is dark at once: /sb sign-in, /n8n, /cams, /taxes, /openers, /llm, /reviews,
> /voice, /nas-photos, /ways, /scribe. ... so it is Cloudflare-side and no code
> change in this repository reaches it.

On that headline a zone Worker was written to route around the fault (DR-1068),
the absolute Funnel origin went back into the client bundle with its written
cross-origin hazard, and eight days of real faults sat under an hourly alarm.

**The headline is false, measured today. And the probe that produced it cannot
tell a working road from a dark one at all, so every reading it gave for eight
days is unreliable — including, possibly, a real one.**

**Said precisely, because the difference matters.** What is proven here is
2026-10-17: the Functions are running and the headline is wrong. What is NOT
proven is that the **2026-10-09 lockout never happened.** Darrell and Christina
were really locked out that night, really photographed `Unexpected end of JSON
input`, and that event may have had a genuine cause that was then fixed — or
may not. This measurement cannot say, because the instrument that watched it
was incapable of telling the two apart. That is the honest shape of it: the
alarm has been **uninformative** since 2026-10-09, not provably false on the
first night. Claiming otherwise would be the over-claim DR-0076 forbids, in a
record whose whole subject is an unmeasured claim.

## What was measured

Run 38993315581 (02:02 UTC) and the diagnosis run 38994118532 (02:14 UTC):

| asked | answer |
|---|---|
| wrangler version the deploy uses | **3.90.0** — the action's own pin, not v4 |
| the deploy's Functions step | `Compiled Worker successfully`, `Uploading Functions bundle`, `Uploading _routes.json` |
| `dist/_routes.json` built locally | includes `/automation-status` and `/sb/*`; `functions/` adjacent to `dist/` |
| `_redirects` | no catch-all `/*` rewrite — nothing intercepts ahead of Functions |
| the Pages project as Cloudflare holds it | `domains` carries poetech.us, `usage_model standard`, every deployment `deploy → success` |
| the Funnel, direct, 11 calls | `/sb/auth/v1/health` **200 in 0.30 s**; keyless RPC **401 in ~0.18 s** ×3; a burst of eight in parallel **all 401**, `allow-origin: *` — no throttle |
| site-health's own `/sb` checks | status, content-type and a **real sign-in POST with a body** all PASSED in the same minute the headline fired |

**And the two bodies the probe printed on its own line, every run, for eight days:**

```
/automation-status  : <!DOCTYPE html> <html lang="en"> <TAB><head> ... X-UA-Compatible
/_routes.json (SPA) : <!doctype html> <html lang="en">   <head>  ... no X-UA-Compatible
```

`app/dist/index.html` is `<!doctype html>`, space-indented, and contains **zero**
occurrences of `X-UA-Compatible`. **They are two different documents.** The page
on `/automation-status` was never our SPA shell.

## The cause

`/automation-status` is a **proxy**, three lines over `makeFunnelProxy`, like
every road in that directory. A proxy returns the upstream's body **and the
upstream's content type**. `/automation-status` is not one of the Funnel's
mounts (`/`, `/sb`, `/mcp`, `/cams`, `/taxes`, `/scribe`, `/announce`,
`/nas-photos`, `/voice-lite`), so it lands on the Funnel's root and comes back
as the NAS's own HTML page.

The Function ran perfectly and returned HTML. The probe read `text/html`,
concluded "the SPA shell — no Function ran", and generalized one road to a
whole layer in a sentence nobody ever measured.

**A content type cannot answer "did a Function run", because a proxy's entire
job is to hand back somebody else's content type.** That is the whole bug.

## Impact

Sign-in was not down by this mechanism at any point. The witness that exists to
protect the live site spent eight days reporting a fault that did not exist,
and under DR-0975's throttle it reported it *once a day*, which is exactly the
slot a real outage would have needed.

## Decision

**1. Every road signs its own answer.** `makeFunnelProxy` sets
`x-poetech-road: pages-function` on all three paths it can return — the proxied
response, the unreachable-502 and the HTML-5xx-502. Only code running at the
edge can set a response header; a static SPA fallback is a file and sets
nothing. The signature's **absence** is the dark road, for any content type and
any status. The zone Worker already signed itself `worker` for this reason; this
is the same idea on the door that was actually carrying the traffic.

**2. The signature is additive.** Upstream headers are copied first and never
dropped, so a road that was working keeps behaving exactly as it did.

**3. The witnesses read it and stop guessing.** `site-health.yml` decides
`/automation-status` and `/sb/auth/v1/health` on the signature; the content type
is still printed, as a **note**, never a verdict. On `/sb` the two now split
cleanly: **unsigned** is the transport gone (the 2026-10-09 lockout), **signed
but HTML** is the NAS answering a page where JSON belongs — a real fault with a
different owner and a different fix. Naming the wrong layer is what cost eight
days.

**4. Two keys, never one — because a signature alone repeats the mistake.**
A missing signature has two causes and only one is an outage: the road is dark,
**or the served build predates the signature.** That second case is *guaranteed*
to happen at least once, in the minutes between this change merging and its
deploy reaching the edge — and an hourly probe that failed then would raise the
identical false alarm for a brand-new reason. Shipping that would be the same
mistake in different clothes, and I nearly did. So a road is dark only when it
is unsigned **and** the body is OUR shell, identified positively by
`/poetech-app/assets/` — which Vite writes into `dist/index.html` eight times
and which no page the NAS serves carries. *"Is this our fallback?"* has an
answer; *"is this HTML?"* never did.

**5. One road is never a layer.** `cf-pages-diagnose.yml` probes five roads
across both hosts and prints a tally, so `MIXED`, `ALL DARK` and `ALL LIT` can
never again look the same from outside. Only paths this repository already
probes are used — an invented health route would read as dark for the wrong
reason.

## Verification

- **9 cases**, weighted at the shape that actually fooled everybody: a proxied
  `text/html` answer is asserted to carry the signature.
- **Proven to catch, by three mutations** (DR-0076 §3), each restored
  **byte-identical** (`cmp`) and green after restore:
  - the success path stops signing → **3 cases fail**;
  - the unreachable-502 stops signing → **1 case fails**;
  - site-health goes back to judging by content type → **1 case fails**;
  - site-health drops the shell fingerprint and decides on one key → **1 case
    fails** (6 occurrences mutated, so the mutation could not be vacuous).
- **A mutation attempt proved nothing and is recorded rather than hidden**: its anchor text no longer existed, so the file was never changed and
  the suite passed. That is DR-1080's "mutation that does not mutate" trap,
  hit again the same week. Every mutation here now `assert`s its anchor before
  writing, and restoration is checked with `cmp`, not `git diff --stat` — which
  cannot tell a restored file from an edited one while the real edits are still
  uncommitted.
- The witnesses are asserted to **consume** the header, so the factory and the
  instruments cannot drift apart silently (DR-1072/1075's orphan lesson applied
  to a header).
- The retired false headline is asserted **absent** from site-health.
- Both workflows parse as YAML; lint clean; gates green by exit code — and the
  `decision-citation-guard` caught this record missing before it was written,
  which is the gate doing its job.

## What this does not do

- **It does not explain the 502 seen at 00:11 UTC on `/sb`.** A 502 from that
  road is *our own proxy's JSON*, which means the Function ran and the Funnel
  was briefly unreachable — a transient, not a dead transport. It is not
  reproducible now (11 direct calls, all healthy) and is **not** claimed to be
  fixed here. `re-review: 2026-10-20`.
- **It does not deploy the zone Worker.** DR-1068's Worker was written to route
  around a fault that does not exist, and the repository's Cloudflare token
  cannot deploy it anyway (measured: `zones: 0`, `scripts: 0` — Pages-only).
  Whether to keep it as a second door now that the first one is known healthy
  is a separate decision. **`re-review: 2026-10-24`.**
- **It does not revert the 2026-10-09 unlock** that put the absolute Funnel
  origin into the client bundle. That revert is now justified — the same-origin
  door works — but it touches what every family browser calls on arrival, and
  it belongs in its own change with its own read-back. **`re-review:
  2026-10-20`.**
- **It does not close #2057.** The ledger is corrected by a comment carrying
  this measurement; closing it belongs with the re-reviews above.
- **It signs only the roads built on `makeFunnelProxy`.** `functions/api/*`,
  `/geocode`, `/link` and `/store/apk` carry their own logic and are unsigned,
  so a probe cannot yet tell whether those ran. **`re-review: 2026-10-24`.**
