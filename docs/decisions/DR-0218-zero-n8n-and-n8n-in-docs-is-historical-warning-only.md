---
id: DR-0218
title: Zero n8n — remove n8n from the pipelines; in the docs it survives ONLY as a historical warning for accuracy + development quality, never as forward guidance
status: accepted
date: 2026-07-21
tier: C
declared_by: Darrell
supersedes: []
amends: DR-0132 (overrides its "P5 — some flows STAY on n8n" endpoint; the endpoint is now ZERO n8n)
principles: [SOVEREIGN-KINGDOM-OS (DR-0083), DETERMINISTIC-FIRST (DR-0080), APP-IS-PRIMARY-SINGLE-SURFACE (DR-0217), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), LESSONS-LEARNED, DATA-AS-EMPOWERMENT]
---

## Context

Darrell, 2026-07-21, reacting to being told the 13 remaining webhooks would "stay
on n8n under DR-0132's phased migration":

> "the 13 legacy webhooks stay on n8n under DR-0132's phased migration????!!!!!!
> What?!!!!!!"

And, on the documentation:

> "remove all n8n information if we aren't using it — I don't want to hear it
> unless we have it — clean up our documentation." Clarified: "Only keep the
> warning about the historical events for accuracy and development related
> reasons... when it matters to keep quality comprehensive process."

The endpoint of DR-0132 was "some visual flows stay on n8n" (P5). That is
rejected. And the reality the last alignment pass surfaced: the sovereign Python
engines for the two biggest webhook groups (finance ingest → imported_snapshot.py;
photos → nas-property-photos/photo_server.py) ALREADY EXIST — the app was simply
never cut over to them. n8n lingering is not a "not yet built" problem for those;
it is an un-finished cutover.

## The decision

**1. The target is ZERO n8n.** DR-0132's "some stay on n8n" endpoint is overridden.
Every one of the 13 remaining app→n8n webhook calls is migrated to a sovereign
path (Python/FastAPI + Caddy, a Cloudflare Function, or a Supabase RPC/view). No
new n8n webhook is ever added (this was already true; now the removal is total).

**2. Cutover order (grounded in what exists):**
   - **No new backend — finish the cutover** (the Python already runs):
     `imported-transactions` → read `/finance/imported.json` (imported_snapshot.py);
     `family/album/photo-upload/property-photos` → photo_server.py. App-side rewire
     + the NAS Caddy route for the sovereign path + the transport (paired change).
   - **Small sovereign endpoints:** `link-title` → a Cloudflare Function (like
     functions/api/market-quote.js); `book-checkout`, `property-history` →
     Supabase RPC/view (DR-0132 P3/P4, but to ZERO not "some stay").
   - **LLM webhooks:** `class-tutor`, `thought`, `llm-review`, `practice-growth` →
     the sovereign LLM path (Supabase-bus / box agent, DR-0132 P2). NOTE:
     class-tutor carries a same-origin sovereignty gate (class-tutor.test.js) —
     the cutover keeps that gate green, no absolute vendor URL in the bundle.
   Each cutover is its OWN verified, tested commit; the money pipeline
   (imported-transactions) gets independent proof before trust (DR-0076).

**3. n8n in the DOCS = historical warning ONLY.** n8n survives in documentation
only where it serves ACCURACY + DEVELOPMENT QUALITY — the why-records that keep
the comprehensive process from repeating the failure:
   - **KEEP** (historical/why): DR-0083, DR-0132, this DR; STACK-DEPENDABILITY-
     REVIEW.md; LESSONS-LEARNED entries; the dated incident/root-cause session
     notes (wf18-stalled, the 502 fixes). These explain WHY we left n8n — priceless
     for not repeating it.
   - **STRIP** (forward guidance presenting n8n as the current/endorsed way): the
     forward-facing foundation docs (AI-FOUNDATION-INTERNAL-OPERATIONS,
     ARI-PERSONA, AUTONOMOUS-BUILDER-LIFECYCLE, AI-TEAM-DISTRIBUTION,
     AI-MEDIA-PRODUCTION-PLATFORM-VISION, BUILD/COMPLETION-ROADMAP, …) are rewritten
     so n8n is not named as the operating substrate — the substrate is sovereign
     Python/FastAPI + Caddy + Supabase (DR-0083/DR-0217). Where a doc's n8n mention
     is genuinely historical, it is marked as such; where it is forward guidance, it
     is replaced with the sovereign path.
   - **NOT a blind find-replace** (DR-0076): a sweep would corrupt meaning AND hide
     the live n8n reality. Each doc is edited with judgment, per-file, verified —
     and while the 13 still run, the accurate current-state (the memory note +
     this DR) says so plainly. "Removed from the docs" follows "removed from the
     pipeline," never precedes it (we never claim n8n-free while it still runs).

## Verification (DR-0076)

The standing test: (a) does any FORWARD doc still name n8n as the current/endorsed
substrate? → rewrite to the sovereign path. (b) is every remaining n8n mention a
historical why-record? → keep. (c) for each of the 13 webhooks, is there a
sovereign path AND is the app cut over to it AND is it tested? → the webhook is
done only when all three hold. (d) is the money pipeline independently proven off
n8n before trust? Progress is measured by webhooks actually cut over (13 → 0) and
forward-docs actually rewritten, each a verified commit — not by a doc sweep that
outruns the pipeline. Grounds the cleanup + migration Darrell directed; pairs with
DR-0083/DR-0132/DR-0217/DR-0108.
