---
id: DR-1067
title: The Edge Guard — see who or what is hitting poetech.us, and refuse them, from inside the app
date: 2026-10-16
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: session_01UyvwuXazJyx2GG9zw9r67Z — Darrell, 2026-10-16, with the Cloudflare analytics (930k requests, 1.9k visitors, 24 h) and the admin Signups list on his phone
---

# DR-1067: The Edge Guard — see who or what is hitting poetech.us, and refuse them, from inside the app

**Date:** 2026-10-16
**Status:** accepted
**Tier:** C (a control that refuses traffic at the front door of the family's and the church's site; a secret-holding road)
**Type:** way
**Area:**
- `infra/cf-roads-worker/edge.js` (new — the `/edge/*` road on the poetech-roads Worker: the steward gate, bots, traffic, blocks)
- `infra/cf-roads-worker/worker.js` (hands `/edge/*` to it before the road table; takes `env`)
- `infra/cf-roads-worker/wrangler.toml` (two more zone routes, `poetech.us/edge/*` and `www.poetech.us/edge/*`)
- `.github/workflows/cf-roads-worker.yml` (the deploy job puts the Worker's two secrets, `CF_API_TOKEN` and `SB_ANON_KEY` — the latter fetched from the NAS over the tailnet, as the Pages deploy does — and reads `/edge/ping` back)
- `infra/cf-roads-worker/README.md` (the Edge Guard section)
- `app/src/lib/edge-guard.js` (new — the client: the caller's session as the key, a 15-second wait, three honest shapes back)
- `app/src/components/EdgeGuard.jsx` (new — three cards: Bots, Traffic, Blocked now)
- `app/src/components/AccessUsageMetrics.jsx` (the **Bots & blocks** sub-tab, beside Signups)
- `app/src/__tests__/edge-guard-road.test.js` (new, 27) and `edge-guard.test.jsx` (new, 18); `the-roads-have-a-second-door.test.js` (the two edge routes)

**Grounds:** Darrell, 2026-10-16, reading Cloudflare's 24-hour analytics for a family app with 31 accounts: **"Who or what bot is looking at our site this many times?!!!!!! Blocking users is necessary!!!!!!!!! Give ne capable of doing this!!!! Inside the PoeTech App"** — then **"Build the opportunity to not allow bots!!!!"**, **"See and block them!!!!!!! Period... unless there are benefits in not seeing"**, **"Our own metrics?!"**, **"We should know everything from logs!!!!!!!"**
**Principles:** DR-0065 (the app is the primary artifact — a capability that can live in the app does); DR-0076 §1 (no claim without evidence: every card prints what Cloudflare read back, or why it could not), §4 (measure, don't claim: the traffic is Cloudflare's own log, not an estimate), §8 (what is not verified is said so); DR-0061 (a surface is a live view of, and a control for, real state); DR-0060 (the gate is a check, not a hope: 401/403 before any upstream call); DR-1068 (the Worker is the same-origin door this rides); DR-0108; DR-0111.

## Context

Cloudflare's dashboard for `poetech.us`, 2026-10-16: **930k requests, 1.9k unique visitors, in 24 hours.** The admin Signups list showed 31 accounts, most of them family and the church. Nothing in the app could say who or what made those requests, and nothing in the app could refuse any of them. Cloudflare can do both — Bot Fight Mode and AI-crawler blocking on the zone, IP / network / country access rules, and the per-request analytics that name the user agent, the network and the address — but only through its dashboard or its API, and the API token is a secret the GitHub runners hold, not a person.

The same session had just built the zone Worker (DR-1068) as a second same-origin door above Pages. A Worker on the zone can hold that token as a secret, verify a caller's Supabase session against the sovereign auth road, and answer the app on `poetech.us/edge/*` — the shape Layer 0 asks for: one same-origin transport, no token in a browser, and the capability INSIDE the app where the stewards already look (Admin → Users and usage).

## What was measured

- 930k requests / 1.9k visitors / 24 h (Cloudflare's own panel, photographed). Not yet broken down by who or what: that is the first thing the Traffic card will answer once the Worker is deployed with its token.
- Our own witnesses: `site-health.yml` probes the site every run from a GitHub runner with a Pixel-8 Chrome user agent, and the runners' `curl` checks carry `curl/<version>`. Both are a few hundred requests a day at most, and the Traffic card names them ("our witness") so "our own metrics" is a line to read, not a guess.
- What the repository's token may do beyond Pages is **unmeasured** until the probe job runs; `edge.js` names the four zone permissions it needs when Cloudflare refuses (codes 10000 / 9109 / 9103 / 1000), so a refusal is a sentence, not a blank.
- `AccessUsageMetrics.jsx` already had a third-row sub-tab bar (Signups · People you know · What's used · When & by whom); the Edge Guard is one more chip, not a new page.

## Impact

- The stewards can answer "who or what" from inside the app, and refuse a network, address or country at the edge, without a Cloudflare login and with no token on a phone. The 930k requests get a breakdown the first time the Traffic card opens after the Worker is deployed.
- A refused request never reaches the Funnel, Supabase or a family phone; the saving is upstream of every other cost on the roads.
- Our own witnesses (site-health, the runners' curl) are named in the agent list, so they are never blocked by mistake and "our own metrics" is measured, not guessed.
- Nothing changes for anyone who is not a steward: `/edge/*` answers 401/403 and the rest of the Worker is untouched. The road costs one GraphQL query and two REST reads per card load, on demand only.
- Not carried: banning a signed-in account (phase 2), and any automatic blocking; every block is a steward's two taps, read back from Cloudflare before it is shown.

## Decision

1. **One same-origin road, `/edge/*`, on the poetech-roads Worker.** `ping` (open), `whoami`, `bots` (GET/PUT), `traffic` (GET, 1–72 h), `blocks` (GET/POST/DELETE). JSON always; a 15-second wait on every upstream call; a structured refusal with a reason and a sentence on every failure path.
2. **The gate is a steward's session, verified upstream.** The caller's bearer is checked against `/sb/auth/v1/user` with the NAS's anon key; the email must be in `STEWARD_EMAILS`, pinned by test to the shell's `darrell` and `christina` personas so a new sign-in for either lands in both places. 401/403 before any Cloudflare call. The Worker never takes a Cloudflare token from the caller and never prints its own.
3. **The two secrets ride the deploy job**, never a paste: `CF_API_TOKEN` from the repository's `CLOUDFLARE_API_TOKEN`; `SB_ANON_KEY` fetched from the NAS over the tailnet exactly as `deploy-cloudflare-pages.yml` does. A key that is not a JWT fails the job loud (DR-0107).
4. **Three cards in the app, nothing painted.** Bots (Bot Fight Mode, AI crawlers — toggles that show what Cloudflare read back), Traffic last 24 h (agents with our witnesses named, networks with a Block, addresses with a Block, paths, countries, the total), Blocked now (each rule with its reason, an Unblock, and an add form for ip / ip_range / asn / country). Every block and unblock is a two-step on the page (no-prompt-guard); every card without an answer prints why: no road yet, no token, which permission is missing, a silent road.
5. **Blocking a signed-in account is phase 2**, its own DR: it needs the service key on the Worker and a ban, not an edge rule.

## Rationale

The edge is the only place a bot is refused before it costs anything — before the Funnel, before Supabase, before a phone's battery. Cloudflare already holds the logs and the switches; what was missing was a door the stewards could use without a dashboard login and without a token on a phone. The Worker is that door, and the gate is the same shape as the app's Governor: the person, verified, not a header.

"Unless there are benefits in not seeing" — there are none. Seeing is cheap (one GraphQL query per card load) and the Traffic card is what makes blocking honest: a network is blocked after its line is read, with its name and its count, not on a hunch. Naming our own witnesses in that list is the answer to "our own metrics?": they are visible, counted, and never mistaken for a stranger.

## Verification

- `edge-guard-road.test.js` (27): ping is open; no bearer → 401; no anon key → 503 naming it; auth road rejects → 401 and Cloudflare never called; non-steward → 403 and Cloudflare never called; the auth road is asked with the anon key and the caller's bearer, never the Cloudflare token; stewards match case-insensitively; `STEWARD_EMAILS` equals the shell's Governor personas; bots GET/PUT map both ways and PUT with nothing is a 400; a missing permission is named with what to grant; no token → 503; a silent Cloudflare → 504 in words; `trafficView` shapes every group; the GraphQL carries the zone and clamps hours; an analytics refusal names Analytics: Read; `validBlock` refuses what Cloudflare would; blocks GET lists block-mode rules; POST signs the rule with the steward's email and the date and upper-cases an ASN; a bad value never reaches Cloudflare; DELETE validates the id; the Worker hands `/edge/*` to the guard and never proxies it; `wrangler.toml` routes it on both hosts; the workflow puts both secrets inside the deploy job and reads `/edge/ping` back; `edge.js` reads no token from the request and logs nothing.
- `edge-guard.test.jsx` (18): the client sends the session bearer to `/edge`; signed-out touches no network; the SPA shell means "no road yet" and names the workflow; network and non-JSON are named; PUT carries JSON; the timeout resolves in words and is 15 s; `compactCount` / `agentKind` read as the dashboard and name our witnesses first. The surface reads all three cards on mount; with no road each card says why and paints no toggle; the bot toggles send the patch and show the read-back; a refusal shows Cloudflare's words and leaves the state as read; Block is a two-step with Keep; address block and unblock go the same way; the add form sends kind/value/why and clears; a failed block says why; Refresh reads again; `AccessUsageMetrics` carries the sub-tab; `EdgeGuard.jsx` has no browser dialog and every button carries the focus ring.
- `the-roads-have-a-second-door.test.js` (51): two more route patterns, `/edge/bots` is not a road.
- Guards: lint, `verify:gates` (interconnect, business-systems, infra-transport, no-prompt, ui-standards, contrast, decision-record, decision-citation) run green before the push; the YAML parses; the Worker module loads with the import.
- **First live reading, after merge:** dispatch `cf-roads-worker.yml` `deploy: no` → the token's reach; then `deploy: yes` → `/edge/ping` answers JSON from the domain; then open Admin → Users and usage → Bots & blocks signed in as a steward and read the Traffic card — that is the answer to "who or what". If the token lacks a permission, the card says which; the fix is the token's permissions in the Cloudflare dashboard (Zone: Read, Analytics: Read, Firewall Services: Edit, Bot Management: Edit on `poetech.us`), saved back as `CLOUDFLARE_API_TOKEN`.
- `re-review: 2026-10-23` — with a week of the Traffic card read: what was blocked, what the 930k turned out to be, whether phase 2 (account bans) is wanted, and whether the n8n/Funnel roads need the same two switches.

## Links

DR-1068, DR-0065, DR-0061, DR-0060, DR-0076, DR-0107, DR-0108; #2057; `.github/workflows/site-health.yml` (the witness named in the agent list); `.github/workflows/deploy-cloudflare-pages.yml` (the anon-key fetch this copies).
