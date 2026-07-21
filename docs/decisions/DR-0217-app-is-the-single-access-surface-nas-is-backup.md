---
id: DR-0217
title: The PoeTech App is the single access surface for everyone and everything — the NAS is sovereign storage/backup BEHIND it, never a place users go
status: accepted
date: 2026-07-21
tier: A
declared_by: Darrell
supersedes: none
amends: the sovereign-NAS surfaces (finance ingest, tax documents, photos) + the app↔NAS bridge
principles: [APP-IS-PRIMARY (DR-0065), AI-FOUNDATION-INTERNAL-OPERATIONS (browsers are for humans deciding, systems make API calls), DATA-AS-EMPOWERMENT, SOVEREIGN-KINGDOM-OS (DR-0083), COMMUNITY-FIRST-MISSION, PERPETUAL-PIPELINE-HEALTH]
---

## Context

Darrell, 2026-07-21, after being handed ConnectBot/File-Station steps to file a
tax PDF:

> "Ways — everything should be accessible inside the PoeTech App, not go to the
> NAS. The NAS is the backup location. We should be going to PoeTech App for
> everyone and everything."

The friction that triggered it: a real task (Christina filing a return) routed a
family member to Synology / SSH. That is backwards. The person's surface is the
app; the NAS is the sovereign store underneath, reached by the app on their
behalf — not by the person.

## The decision

**The PoeTech App is the ONE surface everyone uses for everything. The NAS is
sovereign storage/backup behind the app — users never go to it.** This sharpens
APP-IS-PRIMARY (DR-0065): the app is not just the primary *artifact we build*, it
is the primary *and only* access surface for the family and community.

1. **Users touch the app, never the NAS.** No family or community member is ever
   asked to open File Station, SSH/ConnectBot, or a raw share to do a normal
   task. Every capability the NAS holds gets an in-app surface + an endpoint the
   app calls. (Christina uploads a return in Books → Taxes; she never sees
   Synology — REV-0198.)
2. **The NAS is backup + sovereign store, not an interface.** It owns the bytes
   (DATA-AS-EMPOWERMENT: family-owned, no cloud lock-in), runs the deterministic
   jobs, and is the durable backup — all BEHIND the app. Its value is
   sovereignty and permanence, not a place people navigate.
3. **The app↔NAS bridge is the mechanism, and it already exists.** The proven
   path: the app calls a same-origin route → a Cloudflare Pages Function proxies
   it to the Tailscale Funnel → the NAS (Caddy/services). `/n8n/*` does this
   today (app/functions/n8n/[[path]].js). Every new NAS capability rides the
   same bridge: an in-app call, proxied to the NAS, streamed back — the family
   browser never talks to the NAS cross-origin (the Funnel throttle is dodged;
   n8n-base.js).
4. **SETUP is the only NAS-shell exception, and it is an ADMIN task, not a user
   task.** Standing up a service (deploy the upload server, add a Caddy route,
   run a one-shot ingest) is a Governor/Foundation action over SSH — done once,
   with the three-brakes discipline for anything timer-driven. It is never on a
   family member's path, and it is handed as exact paste-ready steps (DR-0108).

## Opportunities

- **One surface, one thing to learn.** The family + COLG (elderly, tech-novice —
  COMMUNITY-FIRST) learn the app and nothing else; no Synology, no SSH, ever.
- **Security + sovereignty converge in the app.** RLS, PIN, audit, and consent
  live at the app layer; the NAS stays private (Tailscale/LAN-only) with no
  public attack surface — the app is the single, governed door.
- **Data stays sovereign without exposing it.** Users get the convenience of a
  cloud app while the bytes never leave family-owned disk — the structural moat
  (DATA-AS-EMPOWERMENT) with none of the friction.
- **The pattern is reusable.** Each NAS feature = in-app UI + a small endpoint +
  the existing Funnel proxy. The tax pipeline is the template (read snapshot,
  upload endpoint, printable original) the next sovereign surface copies.

## Constraints (honest)

- **Every NAS capability needs THREE pieces, not one:** an in-app surface, a NAS
  endpoint (a service or a served file), AND a same-origin proxy route so public
  poetech.us can reach it. More plumbing per feature than a pure-cloud app — the
  cost of sovereignty.
- **Reachability is real:** the app is served two ways — public poetech.us
  (Cloudflare) and the sovereign NAS-Caddy instance (Tailscale/LAN). Same-origin
  NAS reads/writes work directly on the NAS-served instance; from poetech.us they
  require the Funnel proxy (like `/n8n`). The exact route for a NEW path (e.g.
  `/taxes/*` → Caddy vs n8n on the Funnel) must be confirmed on the NAS — only the
  NAS shows how Caddy/Funnel route it. Until that proxy route is in place a NAS
  feature is app-accessible on the sovereign instance and degrades gracefully
  (empty, never an error wall — tax-archive.js) on poetech.us.
- **When the NAS is unreachable** (off the tailnet, NAS down), NAS-backed
  surfaces must degrade to a clear, non-broken state — never a blank/false view
  (EXECUTION-OUTCOME-OBSERVABILITY; the tax reader already returns EMPTY, not a
  throw).
- **Setup still needs an admin over SSH.** Sovereignty means someone stands the
  services up. That is bounded (one-time, paste-ready, three-brakes for anything
  autonomous) and never on a user's path — but it is not zero.

## Verification (DR-0076)

The standing test for any NAS-backed feature: (a) is there an in-app surface a
user reaches WITHOUT touching the NAS? (b) does it degrade to a clear non-broken
state when the NAS is unreachable? (c) is the only NAS-shell step ADMIN setup,
handed as exact paste-ready steps? First fully-aligned example: Books → Taxes —
in-app upload + read + print (REV-0196/0197/0198); the remaining piece is the
`/taxes/*` Funnel proxy so it also serves from public poetech.us (tracked, needs
NAS-side route confirmation). Grounds this DR; sharpens DR-0065.
