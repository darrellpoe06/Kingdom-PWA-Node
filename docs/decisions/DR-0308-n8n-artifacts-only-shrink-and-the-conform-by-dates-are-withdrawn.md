---
id: DR-0308
title: n8n artifacts only shrink — the conform-by dates of DR-0307 are withdrawn, because the cutover is already done
date: 2026-08-16
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0307]
tier: B
entities: [poetech]
grounds: [SOVEREIGN-KINGDOM-OS, DETERMINISTIC-FIRST, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, SURFACE-PREMISE, PERPETUAL-IMPROVEMENT]
source: 2026-08-16 — Darrell: "we used python not n8n for reasons... etc... review our history of this", then "read everything completely."
---

## Context — a premise correction from the Governor

DR-0307 (hours earlier, same session) made the n8n conformance gate fail the
build, and dated the 92 findings for repair: W1 by 2026-10-16, W3 by
2026-11-16, W2 by 2027-01-16. It cited **DR-0132 §4** as its authority.

Darrell challenged the premise. He was right, and reading the record completely
shows the work was aimed at a target that no longer exists.

## What the history actually says

**DR-0083 (2026-06-30)** — the origin, from the money-loop incident. wf18
unreachable froze the imported-money pipeline: `VERIFIED=0`, `1,923 UNEXPLAINED`.

> *"The loops should run as plain Python on the NAS, scheduled, headless, no
> login... n8n is the fragility."*

**DR-0218 (2026-07-21)** — and this is the one that invalidates DR-0307's
framing. Its front-matter reads:

> `amends: DR-0132 (overrides its "P5 — some flows STAY on n8n" endpoint; the
> endpoint is now ZERO n8n)`

Darrell in it: *"the 13 legacy webhooks stay on n8n under DR-0132's phased
migration????!!!!!! What?!!!!!!"* §1: **"The target is ZERO n8n... No new n8n
webhook is ever added."**

**The cutover is already DONE.** `app/src/lib/n8n-base.js:63`:

> *"RETIRED (DR-0218, Darrell 2026-07-30 'get rid of it now'): n8n is taken to
> ZERO. N8N_BASE resolves EMPTY by default, so no app code calls n8n — every
> remaining consumer degrades gracefully."*

And app-side containment is separately gated: `business-systems-guard.mjs`
allowlists exactly three test files; any new file reaching the retired transport
turns the build red.

**So the 55 workflow JSONs are RETIRED ARTIFACTS**, kept deliberately under
DR-0218 §3 as historical why-records — *"historical warning only, never forward
guidance."* Nothing calls them.

## The error, named plainly

DR-0307 cited DR-0132 §4 without reading DR-0218, which amends it. **Third
instance in one session of reasoning from an unread or superseded record** — the
stop hook had already caught the same failure twice (DR-0132/DR-0156, then
DR-0240). The pattern is not carelessness about one document; it is treating a
remembered summary as if it were the source. DR-0250's rule exists for exactly
this, and it held.

The concrete consequence: the gate graded the **quality** of dead files, and the
dated re-reviews committed the house to *conforming* workflows that DR-0218 says
should be *gone* — an invented schedule, with no carrier, for work that should
never happen. That is an unlawful state under **DR-0240 §1** (two states only:
DONE with evidence, or CARRIED by a named working system) and a fake date under
**§2** (dates derive from the measured record).

## Decision

1. **The dated conform-by re-reviews in DR-0307 are WITHDRAWN.** W1 2026-10-16,
   W3 2026-11-16, W2 2027-01-16 are struck. These artifacts are not scheduled for
   repair, because they are not scheduled to exist. There is no third state: they
   are carried by the count ratchet below until deleted.

2. **The count ratchet — n8n artifacts only ever shrink.**
   `scripts/n8n-artifact-ceiling.json` pins today's **55**. Adding one fails the
   build with a message pointing at the sovereign path (Python/FastAPI + Caddy, a
   Cloudflare Function, or a Supabase RPC/view) — never at "make it conform."
   Removing one also fails, so the gain is locked into a lowered ceiling rather
   than drifting back. This is DR-0218 §Verification expressed as machinery:
   *"Progress is measured by webhooks actually cut over (13 → 0)."*

3. **DR-0307's Tier 1 survives unchanged** — an ACTIVE workflow must conform,
   never grandfathered. While any artifact can still be activated on the box it
   is a cheap safety net, and it is what would have caught the `wf-ops-announce`
   case. Tier 2's ratchet also survives as a no-regression floor; only its dates
   are withdrawn.

4. **The error-handler ID convention is CANCELLED, not deferred.** It was drafted
   this session to unblock the 53 W2 findings by giving the global error handler
   a pinned ID. Under DR-0218 that is investment in a retired transport: those 53
   should be deleted, not given error routing. The draft was removed unpushed.

## Proven-to-catch (DR-0076 §3)

`--selftest` gains four assertions; the vitest file gains four cases. Verified
against the live tree, real exit codes measured without a pipe:

- adding a workflow JSON → **exit 1**, `n8n artifacts GREW: 56 > ceiling 55`
- removing one → **exit 1**, `SHRANK to 54 … lower the ceiling`
- holding at 55 → **exit 0**

A test also pins that `n8n-base.js` still carries the DR-0218 retirement and that
`N8N_BASE` still defaults empty, so the finished cutover cannot silently regress.

## Honest remainder

The 92 conformance findings still exist and are still grandfathered. They are
**not** dated for repair, and that is the point — the lawful carrier is deletion
through the count ratchet, not a conformance schedule. If an artifact is ever
activated on the box, Tier 1 fails the build that ships it.

The standing limit from DR-0307 is unchanged and still true: the gate reads the
repo `active` flag and cannot see n8n's SQLite state on the NAS.
**re-review: 2026-09-16**, carried by the daily review-watcher.

## Files

- `scripts/workflow-conformance.mjs` — `judgeCount` + the ratchet wired into the run
- `scripts/n8n-artifact-ceiling.json` — 55, shrink-only
- `app/src/__tests__/workflow-conformance-enforced.test.js` — 13 pins
- `infra/n8n/WORKFLOW-ID-CONVENTION.md` — removed unpushed (cancelled, §4)
