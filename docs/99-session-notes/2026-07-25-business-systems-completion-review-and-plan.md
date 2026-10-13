# 2026-07-25 — Business systems: comprehensive Ways review, completion plan, and the completion machinery

Declared by Darrell 2026-07-25, three directives in one session: *"comprehensive
review of Ways and documentation and strategies for business systems
opportunities and constraints"* → *"comprehensive review and implementation plan
and development of the systems that make sure we complete our business
systems."* This is that review (DR-0219 spec-conformance shape: SHOULD → ARE →
GAPS → CLOSE), the plan, and the record of the machinery that shipped today.

## SHOULD — what the Ways require (cited)

- **Every visible surface is one end of a connection; the other end is wired
  before it ships** — the four-question test (invite / pipeline / governor /
  promise) + the fifth (timeline). `BUSINESS-PROCESS-CONNECTIONS.md:33-42,121-127`.
- **Zero n8n going forward** — retired transport survives only as historical
  warning (DR-0218, overriding DR-0132's P5 endpoint); backend direction is
  sovereign Python (DR-0083/DR-0217; memory `project_app_to_nas_transport_and_sovereign_python`).
- **The decisions INDEX is the single source of truth for what is decided**
  (`docs/decisions/INDEX.md:3`); an "all X" directive is a **backlog, not a
  memo** (LESSONS P29).
- **Everything improves perpetually or carries a why + re-review date**
  (DR-0075); **no claim without evidence** (DR-0076).

## ARE / GAPS — what the trace found (receipts)

1. **The foundation doc's model "wired" surface is no longer true.**
   `BUSINESS-PROCESS-CONNECTIONS.md:50` documents the waitlist as workflow 29 +
   ntfy; the code posts to `formsubmit.co` with a personal Gmail hardcoded in
   the client bundle (`poe-financial-mvp-v28.jsx:~1520`). Third-party absolute
   endpoint + published personal address + a factually wrong canonical example.
2. **The landing funnel's terminal CTA has no pipeline.** All five
   `matched-services.js` catalog entries declare `waitlist_endpoint: '/waitlist'`
   — and no `/waitlist` handler exists anywhere (no CF function, no Caddy
   route). Question 2 of the four-question test is unanswered on the front door.
3. **The last live business-facing n8n call sits on the TLC revenue surface —
   pinned there by a test.** `client-acquisition.js:676`
   (`PRACTICE_GROWTH_WEBHOOK = '/n8n/webhook/practice-growth'`), fetched by
   `ClientGrowth.jsx:67`, asserted by `client-acquisition.test.js:244`. Plus
   user-facing n8n forward guidance at `Rentals.jsx:2251`, and the DR-0075
   `/n8n` route rename (REV-0199) still open.
4. **A live capability sits behind a stale blocker.** The landing's "Drop your
   bank file" CTA is still routed to the waitlist modal "until workflows
   33/34/35 deploy to n8n" (`poe-financial-mvp-v28.jsx:~3866`) — workflows
   DR-0218 retired — while the deterministic client-side replacements
   (`runSkillAnalytics`, `runMatchedServices`) are already live.
5. **The record drifts faster than it is re-audited.** INDEX Next-ID went stale
   again three days after the 2026-07-23 backfill (DR-0234 on disk, no row,
   pointer at 0233); LESSONS-LEARNED newest entry 2026-07-10 (15 days) with P29
   missing from its own index; **168 of 260 dated `re-review:` commitments at
   or past due**, with the review-watcher unable to see dispositions
   (`REVIEWS.md:20`).
6. **DR-0230 (live payments) due-today re-review: substantially SHIPPED** —
   engine, CF checkout, webhook, migration 0116, CI conformance test all in
   place; the honest remainder is the Governor's keys + the first watched live
   charge (`2026-07-23-live-payments-runbook.md`).
7. **Today's incident belongs to the same class.** The Governor's Books
   rendered empty because `join_default_instance` resolved his tenant with an
   unordered `LIMIT 1` after 0089 gave him a second non-church seat —
   LESSONS-LEARNED 2026-07-25 entry (P35), fixed by migration 0119.

## CLOSE — what shipped TODAY (this PR)

- **`scripts/business-systems-guard.mjs` + CI step + 9 proven-to-catch tests**
  — the completion machinery Darrell asked for, v1: (a) decisions-ledger
  integrity (every DR file has an INDEX row; Next-ID pointer must equal
  newest+1) — the gap-5 class can never merge silently again; (b) retired-n8n
  containment (the 7 legacy files are pinned; any NEW reach for `/n8n/webhook`
  fails the build); (c) vendor-form-endpoint containment (formsubmit/formspree
  pinned to the 1 tracked exception; new ones fail).
- **INDEX.md ledger made whole** (DR-0234 row added, Next ID → DR-0235) — then
  pinned by the guard.
- **Migration 0119** — deterministic default-instance resolution (family home
  first, earliest-joined, total order) on `join_default_instance` +
  `invite_to_instance`; the Books-empty incident's structural close.
- **Encrypted messaging shipped** (the session's build directive): E2E 1:1 DMs
  (device-held ECDH → AES-GCM, `lib/dm-encryption.js`, migration 0118) + the
  app-wide **Messages** surface that also finally mounts the DR-0231 group
  threads (0117 had shipped backend-only — a BUSINESS-PROCESS-CONNECTIONS gap
  in its own right, now closed).

## The implementation plan (each item a dated commitment, P29-style)

| # | Item | Lane | re-review |
|---|---|---|---|
| 1 | **Sovereign `/waitlist`**: one CF Pages function writing a Supabase `waitlist_signups` row (RLS: insert-only public, steward read), landing + matched-services CTAs repointed, formsubmit.co retired, allowlist entry removed from the guard | Tier A/B build | 2026-07-28 |
| 2 | **Practice-growth off n8n**: port the wf clean-up to the sovereign lane (or park the surface honestly), flip `client-acquisition.test.js:244` to assert the sovereign route, shrink `N8N_ALLOWLIST` | Tier B | 2026-07-31 |
| 3 | **Restore the bank-file CTA** to the live client-side pipeline (`runSkillAnalytics`/`runMatchedServices`); remove the stale wf33 comment | Tier A | 2026-07-28 |
| 4 | **Rentals n8n copy** at `Rentals.jsx:2251` → sovereign wording (DR-0218 conformance) | Tier A | 2026-07-28 |
| 5 | **`BUSINESS-PROCESS-CONNECTIONS.md` refresh**: correct the waitlist example, re-audit the 2026-05-28 surface list (14 months stale) | docs | 2026-08-01 |
| 6 | **Review-watcher closure marker** so dispositioned commitments stop re-reporting overdue; then burn down the 168-item overdue backlog oldest-first in watcher-driven batches | Tier B | 2026-08-11 (existing date) |
| 7 | **LESSONS-LEARNED index heal**: P29 into the principles index; consider folding into the guard (machine-checkable: every `P\d+` in a body appears in the index) | docs/guard v2 | 2026-08-01 |
| 8 | **DR-0230 disposition**: keys + first watched live charge with the Governor | Governor step | on Darrell's word |
| 9 | **Group-thread E2E** (multi-party keys) + multi-device DM key transport — stated honestly in the Messages UI today | design → build | 2026-08-14 |

Guard v2 candidates (as the plan closes items): overdue-`re-review` ceiling,
unwired-endpoint detection (a client fetch target with no matching function
route), LESSONS principles-index integrity.
