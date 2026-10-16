# DR-1070: The visitor stage DR-0008 decided and nobody built — and why it collects nothing

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (what the app measures about people who have not signed anything)
**Type:** word
**Area:**
- `app/src/lib/visitor-funnel.js` (new — pure derivation, no collection)
- `app/src/__tests__/visitor-funnel.test.js` (new)

**Grounds:** Darrell, 2026-10-16: **"Can we use Google Analytics to analyze our apps or build our own? Opportunities and constraints... DRs based... etc... make sense?"**
**Principles:** DR-0008 (sovereign analytics, NOT Google Analytics); DR-0219 (SHOULD / ARE / GAPS / CLOSE); DR-1064 (the covenant a member signs); DR-1053 (unknown is not a no); DR-0076 §4 (measure, do not claim)

## Context

The question arrives in two halves. The first — *may we use Google Analytics* —
is already answered and is not reopened here. The second — *or build our own* —
turns out to be half-built already, with one stage missing for four months.

## What was measured: SHOULD vs ARE (DR-0219)

**SHOULD** — DR-0008 (2026-06-09, accepted, Tier C): *"self-hosted,
privacy-respecting analytics (**NOT Google Analytics**) — e.g. self-hosted
Plausible / Umami / Matomo / GoatCounter, cookieless, data on the NAS — per
entity,"* with the per-entity objective **"Church (visitor → attendance →
discipleship)"**, grounded in `NO-DATA-SALE`, `SOVEREIGN-FIRST`, `TLC-FIREWALL`.

**ARE**, measured 2026-10-16:

| | state |
|---|---|
| Google Analytics / gtag / Meta / Segment / PostHog / Mixpanel | **none.** `index.html` carries zero trackers; the single grep hit was `skill-analytics.js` |
| our own usage layer | **10 libs**, `usage_events` on the sovereign Supabase, governor-aggregate only, each person deletes their own trail (migration 0073) |
| DR-0008's named engines | **never installed** — not in `infra/`, not a NAS rider |
| **the visitor stage** | **absent** |

**GAP.** `recordView()` returns `false` with no session, so the app counts
MEMBERS and which tabs they open — and nobody who has not signed in. DR-0008's
funnel *begins* at "visitor". **The first stage never existed**, for four
months, and nothing flagged it.

## Impact

**Two of the constraints are hard lines, not preferences.**

1. **Members sign a promise that forbids it.** The covenant says the church's
   records are *"never sold, never sent to an employer, a lender or an
   advertiser, never used to decide who is welcome, or ever used to train
   anything"* (DR-1064). **Google is an advertiser.** Putting GA on a
   signed-in church surface would contradict a sentence members put their name
   to — not a tooling preference, a broken promise.
2. **TLC is a therapy practice.** Third-party trackers on healthcare-adjacent
   pages are a live regulatory risk, and DR-0008 already binds *"ZERO PHI; no
   client-level tracking or profiling."* The specifics belong to the practice's
   own counsel; the risk is documented, not theoretical.

What the gap costs, concretely: nobody can tell whether the header share code
(DR-1056) brings anyone in, where arrivals come from, or where people fall off
before signing in.

## Decision

**Derive the visitor stage from records Cloudflare already keeps. Collect
nothing.**

The obvious build is a visitor table and a cookieless beacon. It is the wrong
build. The Edge Guard (DR-1067) already reads Cloudflare's **own** logs through
the app's `/edge` road — `getTraffic()` returns paths, agents, networks,
addresses and countries that Cloudflare records as the CDN whether we look or
not. Deriving the funnel from that adds **no collection, no beacon, no cookie,
no new row about a person, and nothing of ours to leak.** A table would have
been a fourth place storing something about people who never signed anything.

**Also rejected: installing Plausible/Umami/Matomo.** Named as examples in
DR-0008 and still reasonable — but they would add a service, a port, a backup
surface and another consumer of the 600 s rider budget, for a capability the
edge road already serves. And a generic tool still would not know what
*"attendance → discipleship"* means; that part is ours either way. If the
derived view proves too thin, the container remains the documented upgrade.

**The rule the surface is held to: count the visit, never the visitor.**

## Verification

- **21 cases**, weighted at the ways an analytics surface *lies* rather than
  the ways it is merely wrong.
- **A request is not a person**, and `REQUESTS_ARE_NOT_PEOPLE` is a rendered
  sentence, not a comment. No conversion rate is computed: dividing requests by
  people would fabricate a number from two instruments over two windows, and a
  test asserts the shape carries no `rate`/`conversion` key.
- **The app's own plumbing is not an arrival.** `/assets`, `/sw.js`, the
  manifest, icons, `/edge`, `/sb` are excluded — counting the bundle would
  inflate every door by its own size, the most flattering lie available.
- **No invented join.** Cloudflare returns paths and agents as independent
  aggregations, so the traffic mix is site-wide and `BOT_SHARE_IS_SITE_WIDE`
  says so; a test asserts no per-door human/bot figure exists.
- **Unknown is not zero** (DR-1053): a refused edge road yields a sentence, and
  a door with no member figure reports `null`, never `0`.
- **Purity is asserted**, not assumed: the module may not import the Supabase
  client, may not `insert`/`fetch`/touch `localStorage`, and may not read a
  clock.

### Two of my own defects, found by the tests

1. **The check matched its own documentation.** The no-tracker assertion read
   this file's header, which *names* the trackers that do not exist — the third
   self-match this week (`unknown-is-not-a-no-guard`, DR-1060's `#B01E1E`, now
   this). Cured by stripping comments **and** asserting the stripper did not
   blank the file.
2. **I collapsed a classifier that was more precise than my bucket.** I tested
   `agentKind`'s output for `/bot|script/`, which silently counted **a search
   engine as a person** (`Googlebot` → `'a search engine'`, `GPTBot` → `'an AI
   crawler'`). The classifier was right; my two-way split was wrong. Now four
   buckets keeping its distinctions — including **`ourWitness`**, because
   `site-health` hits the site on a schedule forever and counting our own
   instruments as visitors would be a lie that grows over time.

## What this does not do

- **No surface is wired yet.** This is the pure core and its proof; the Access
  & Usage tab is where it belongs. **`re-review: 2026-10-20`.**
- **It cannot attribute an arrival to a share code.** That needs a campaign
  marker on the shared URL, which is a new decision about what we put in a link
  people pass around — deliberately not taken here.
- **It does not measure TLC beyond raw door requests**, and should not without
  the practice's own say-so (DR-0008's TLC-FIREWALL).
- **It does not replace `usage_events`.** That remains the signed-in side; this
  is the stage before it.
