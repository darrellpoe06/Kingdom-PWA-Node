# Shared CRM Backbone — one sovereign engine every funnel rides

**Date:** 2026-06-24
**Branch:** `feat/crm-backbone`
**Status:** built + green (1792 tests, build, lint, guards). Held for orchestrator-sequenced convergence with the TLC lane (see "Don't fork" below).

## What landed

ONE reusable CRM engine — not one per business. Every acquisition funnel writes leads into a single model.

| Piece | File | Role |
|---|---|---|
| Pure engine | `app/src/lib/crm-engine.js` | businesses + pipelines registry, canonical lead shape, stages, source attribution, consent gate, follow-up sequences (draft-only), pipeline metrics, seed-vs-real, PHI/ethics linters, funnel adapters |
| Sync | `app/src/lib/crm-sync.js` | `crm_leads` cross-device sync (createTableSync) + `crm_activities` touchpoint trail + `captureLead()` RPC wrapper |
| Store + API seam | `infra/supabase/migrations-auto/0046-crm-backbone-leads.sql` | `crm_leads` + `crm_activities` tables, instance-scoped RLS, `crm_capture_lead()` SECURITY DEFINER RPC (the one wired anon/inbound capture path) |
| Surface | `app/src/components/CRM.jsx` | family/governor-gated `CRM` tab: per-business + per-pipeline board, conversion math, follow-up draft queue (human approves), consent + seed honesty, guardrail panel |
| Tests | `app/src/__tests__/crm-engine.test.js`, `crm-sync.test.js` | 37 proven-to-catch tests (consent gate, no-auto-send, PHI/payment strip, seed exclusion, ethics linter, adapters, round-trip) |

Nav wired in `poe-financial-mvp-v28.jsx` (lazy import, VALID list, family-gated tab + locked fallback, `crm` feedback area, `users` icon in `UiIcon.jsx`).

## The shared model

- **Businesses** (`BUSINESSES`): `tlc`, `gtm`, `boxcar`, `realestate` — each a per-business config, extensible via `registerBusiness`/`registerPipeline`.
- **Pipelines** (`PIPELINES`): TLC client-intake / therapist-recruiting / training-enrollment; gtm-subscriber; boxcar-booking; realestate-leads. Each names ordered stages, allowed sources, and a nurture sequence.
- **Lead** (`newLead`): contact-level only — name/org/role, contact method+value, source+detail, stage, consent `{outreachOk,channels,capturedAt,note}`, nurtureStep, history, seed flag. **No clinical, no PHI, no payment columns by design.**
- **Status lifecycle**: stage → group (`active`/`won`/`lost`) drives uniform conversion math across every business.

## Funnels wired

- **TLC client intake** — existing `inquiries` rows federate read-side via `leadFromInquiry()` (no fork of that table).
- **TLC therapist recruiting + training enrollment** — native `crm_leads` pipelines; the TLC client-acquisition lane retargets via `leadFromPracticeAcquisition()`.
- **GTM subscriber** — `leadFromSubscriber()` (subscribe opt-in = email consent).
- **Boxcar same-night booking** — `leadFromBooking()` (fast funnel; phone/text contact consent).
- **Real-estate leads** — `leadFromRealEstateInquiry()`.
- **API/integration seam** — `crm_capture_lead(pipeline, instance_slug, payload)` is the single wired "other end": public forms, the content engine, and n8n inbound all land a forced-safe lead through it (first stage, explicit-only consent, pinned instance, structural PHI/payment strip). It is the only anon write path; no anon table grant.

## Guardrails (binding, encoded + tested)

1. **PII minimal / no PHI / no payment** — structural (no columns) + `stripDisallowed()` + `flagPotentialPhi()`.
2. **Consent / served-not-surveilled** — `canOutreach()` gates every outreach; no consent → no follow-up offered.
3. **Healthcare-marketing ethics (TLC)** — `screenMarketingClaim()` blocks guaranteed-outcome/cure language; psychoeducation-not-treatment.
4. **No payment processing by us** — engine produces leads/pipelines/sequence drafts, never transactions.
5. **LLMs draft, humans approve** — `nextFollowUp()` always returns `status:'draft', requiresHumanApproval:true`; nothing auto-sends.
6. **Seed ≠ real** — `isSeedLead()`; seed excluded from pipeline math; never an outreach target.

## RLS / sovereignty

- `crm_leads` + `crm_activities`: owner/admin/member read+write, owner/admin delete, scoped by `user_role_in_instance(instance_id)`. No anon table policy.
- Data in our own Supabase store, NAS-portable. No third-party CRM SaaS.

## Don't fork — convergence with the TLC client-acquisition lane

`practice_leads` (migration `0045`) + `lib/client-acquisition.js` (the 4-stage revenue-team workflow + the same guardrail linters) are **already merged on main** (PR #334) and live. So convergence is concrete, and the design here treats it the way it already treats TLC `inquiries`: **federation, not a competing table.**

- The CRM board **federates `practice_leads` read-side** via `leadFromPracticeAcquisition()` (exactly as it federates `inquiries` via `leadFromInquiry()`). The already-live client-acquisition leads show up on the one unified pane immediately — no migration, no data move, no fork in the user-facing sense.
- `crm_leads` (0046) owns the **net-new pipelines** the existing tables don't cover: TLC therapist-recruiting + training-enrollment, GTM subscriber, Boxcar booking, real-estate leads.
- The guardrail linters are re-homed in `crm-engine.js` as the single source of truth; `client-acquisition.js` still carries its own identical copy. Short-term that's two identical copies (same behavior); the cleanup is for `client-acquisition.js` to import them from `crm-engine.js`.

**Optional deeper convergence (orchestrator decision, not required for this PR):** collapse `practice_leads` into `crm_leads` so TLC client-acquisition writes the one table directly (its surface keeps working through `leadFromPracticeAcquisition` either way). Left as a follow-up because `practice_leads` is live with data; federation already gives the single pane today.

This branch is labeled `hold` so the convergence decision is made deliberately by the orchestrator, not raced in.

## Follow-ups

- Per-tenant instance routing for TLC writes (TLC may be its own instance vs the family instance) ties into ROLES-MEMBERSHIP-MULTITENANCY-ADR Phase 3; today the surface federates TLC `inquiries` read-side and syncs net-new `crm_leads` in the family instance.
- Per-IP rate limit on `crm_capture_lead` (deferred, consistent with venue/conference anon capture; NAT'd-congregation note).
