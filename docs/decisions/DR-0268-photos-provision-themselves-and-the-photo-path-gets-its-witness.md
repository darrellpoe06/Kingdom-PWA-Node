---
id: DR-0268
title: The photo path provisions itself — family devices pull the bridge token via RPC, the photo server joins the self-deploy manifest, and the path gets an outside-in witness
date: 2026-08-03
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, DETERMINISTIC-FIRST, DRIVE-DONT-DELEGATE, PERPETUAL-IMPROVEMENT, WAYS-REVIEW, REALITY-TRACE]
source: 2026-08-03 comprehensive photos-process review (REV-0228), triggered by Darrell's fold screenshot ("Fix the photos issues... comprehensive process review data driven... dont assume")
---

## Context

Darrell's fold showed Real Estate's photos/history panels parked on "paste the bridge token." Measured, not assumed: the client transport routes exist (Pages Functions `/nas-photos` + `/property-history`); the photo read/write paths are already sovereign Python (`photo_server.py`, cut over 2026-07-01/2026-07-19); the ACTUAL blockers were (1) the per-device token paste — v1 by design, promotion recorded in `nas-photos.js` as "a follow-up"; (2) the photo server living on hand-deploys ("NAS deploy pending Darrell"), absent from `services.json`; (3) no outside-in probe anywhere on the photo path (site-health never touched it).

## Decision

1. **The token provisions itself.** Migration `0128`: `family_secure_config` (RLS deny-all) + two SECURITY DEFINER RPCs — `get_family_bridge_token()` (any signed-in member of a non-church instance) and `set_family_bridge_token()` (owner/admin only). A signed-in family device with no token pulls it into the same localStorage slot everything reads (`bridge-provision.js`, wired in Rentals); one steward paste anywhere publishes for all. Applied LIVE via the DR-0260 Supabase channel. This supersedes the "per-device, never synced" v1 wording — while KEEPING what that rule protected: the token still never ships in the bundle; anon/demo still gets the honest paste gate.
2. **The photo server joins the self-deploy manifest.** `infra/nas-property-photos/install.sh` (scribe pattern; token file KEPT, never regenerated over a live one) + `services.json` entry `enabled: true` — the "deploy pending Darrell" class ends; services-sync installs/repairs/starts it.
3. **The path gets its witness.** site-health now probes `/nas-photos/healthz` (200 = alive) and `/property-history` (401 = alive+gated) every 10 minutes from a runner — the only eye with a route. v1 scope: loud warning + outputs, not the incident ledger (a family NAS can be legitimately off); escalation decision `re-review: 2026-08-17`.
4. **NOT decided:** moving `/property-history` off its n8n webhook (already a named DR-0218 NEXT cutover — Supabase RPC/view); NAS-side auto-publish of the token into 0128 by the ops-runner (zero-paste-ever; `re-review: 2026-08-17`).

## Consequences

A family device signs in and the panels just work; the first device still needs the one historical paste unless a tokened device visits Real Estate first. A dead photo server now shows in the Actions ledger within 10 minutes instead of waiting for a family screenshot. Reversal: `enabled:false` for the installer; dropping the RPC grants kills provisioning without touching stored tokens.

## Links

REV-0228 · DR-0218 (zero-n8n) · DR-0260 (Supabase channel) · DR-0267 (same humans-do-nothing lane) · `infra/nas-property-photos/README.md`.
