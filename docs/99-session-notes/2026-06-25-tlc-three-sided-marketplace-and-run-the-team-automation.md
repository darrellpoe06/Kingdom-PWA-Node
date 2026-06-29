# TLC Client Growth v2 — three-sided marketplace + supporting lessons + run-the-team automation

**Date:** 2026-06-25
**Declared by:** Darrell (three feedback passes in one directive)
**Surface:** Practice (TLC) → Client Growth
**Builds on:** the 4-stage workflow shipped in PR #334 (`2026-06-24-tlc-client-acquisition-revenue-agent-team-spec.md`).
**Migration:** none (reuses the `practice_leads` 0045 table; the `audience_preset_key` column now stores the marketplace SIDE key).

---

## 1. Three-sided marketplace (clients + therapists + training)

TLC is a **two-sided marketplace + enablement**, not just lead-gen. The same 4-stage team adapts PER SIDE (`lib/client-acquisition.js` `PRESETS`):

| Side | Role | Funnel | Guardrail focus |
|------|------|--------|-----------------|
| **client** (demand) | acquire patients/clients | new → outreach-ready → contacted → consult-booked → intake-scheduled | healthcare-marketing, **no PHI**, psychoeducation-not-treatment (PHI-sensitive) |
| **therapist** (supply) | RECRUIT 1099 clinicians | new → outreach-ready → contacted → screening → credential-check → matched → onboarding → active | **license verification**, no guaranteed income |
| **training** (enablement) | CE / dual-track LMS | new → outreach-ready → contacted → enrolled → in-progress → completed | **CE accuracy + validation** |

Each stage's prompt weaves a per-side `sideFraming` (Market Signal finds demand AND supply AND training-need; Offer Architect packages services / why-join / CE; etc.). Reusable for any practice/tenant via `registerSidePreset`.

**Marketplace balance** (`marketplaceBalance`): compares active client demand vs therapist serving capacity (`CASELOAD_PER_THERAPIST`) and recommends which side to push — so we don't over-acquire one side. Surfaced as a banner.

## 2. Supporting online lessons (`lib/tlc-lessons.js`)

"Supporting lessons online to support the whole situation." Three engine-shaped tracks (learn-framework module shape → age-adaptive via `resolveForAge`, reading-support-ready: large-print, plain-language tiers, read-aloud, dyslexia-friendly):

- **client** — psychoeducation for clients/patients + families (the patient-outcomes track): understanding anxiety, grounding skills, supporting a loved one. Psychoeducation NOT treatment; LCSW/specialist-validated.
- **therapist** — the CE / clinician training (the dual-track LMS): faith-integrated care, multicultural competency, documentation & the PHI line. CE credits + accreditation are **TO-CONFIRM** until verified.
- **whole** — what-to-expect + support resources that hold it together (onboarding, crisis signposting).

They are part of the workflow's VALUE and its FUNNEL — a **lead magnet** + a **retention/outcomes engine**. Honest default: **nothing is publishable until a human marks it validated** (`isTrackPublishable` → false until specialist sign-off). Ties the dual-track LMS vision + `docs/00-foundations/THERAPY-TRAINING-CURRICULUM-PLAN.md`.

## 3. Run-the-team automation ("this seems like a job → automate it")

1. **One-trigger run-the-team** — a single **⚡ Run the team** action chains all 4 stages end-to-end (`newRun` / `setRunStep` / `summarizeForChain` feed each stage's output into the next), sovereign-A.I.-driven via the NAS webhook. No per-stage clicking.
2. **Leads + pipeline auto-flow** — when the NAS returns identified leads they land in the CRM (`practice_leads`) and **auto-advance across INTERNAL stages only** (`autoAdvanceLead`: new → outreach-ready); follow-up sequences are drafted automatically from the conversion stage.
3. **APPROVE-OUTBOUND-ONLY (the binding line)** — the team auto-PRODUCES research/offers/content/sequences/draft-leads; anything that goes OUT to a real person becomes a **pending outbound item** in the approval queue. `canApproveOutbound` requires recorded consent AND no guardrail block; approving advances the lead across the outbound boundary (to "Contacted"). **Nothing auto-sends.** `stageRequiresOutbound` marks which funnel stages can never be auto-entered.
4. **Optional continuous cadence** — `CADENCE_DEFAULT` ships **INERT** (enabled:false, armed:false). `evaluateCadenceGate` is default-DENY, mirroring `orchestrator-handoff`: requires enabled + armed + budget ceiling + the three brakes (kill-switch clear, engine armed, concurrency lock free). Arming is reserved for Darrell + the orchestrator. Per the no-autonomous-automation-without-brakes rule (Tier C).

The success metric in action: **local LLMs do the work, driving production toil toward zero; humans govern + approve.**

## Reality-trace / honesty

- Leads / funnel / balance derive from the REAL synced `practice_leads` list. Runs, stage drafts, and the outbound queue are device-local working content.
- The sovereign A.I. drafting runs on the NAS workflow **`wf-practice-growth` (pending)**. Until it returns content, "Run the team" produces the **chained prompt-pack** (per-stage `needs-capture`) to run by hand — never a fake A.I. result. The auto-flow (leads landing, sequences drafted, toil→zero) lights up fully once the NAS workflow is wired.

## Gates

- New/updated tests: engine (38) + lessons (12) + sync (6) + live render (3) — **59 in these files**; full suite **1810 passing (150 files)**; `vite build` green; eslint clean.

## Follow-ups (perpetual improvement)

- **`wf-practice-growth` NAS workflow** — wire the tiered-LLM drafting + lead extraction so run-the-team returns real content + leads. `re-review:` when the GPU/Forge tier is online.
- **Register the supporting lessons into the Learn course catalog** — currently surfaced inside the workflow; full ChurchLearn-style registration is a heavier monolith follow-up. `re-review: 2026-08-01`.
- **Specialist validation pass** — Christina/specialist signs off each lesson track before public use (flips `validation.validated`).
- **Cadence arming** — only when the orchestrator brakes feed is wired into this surface and Darrell explicitly arms it.
