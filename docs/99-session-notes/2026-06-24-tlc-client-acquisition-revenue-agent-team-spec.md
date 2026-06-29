# TLC Client-Acquisition Workflow — the 4-stage "revenue agent team" (in-app, reusable)

**Date:** 2026-06-24
**Declared by:** Darrell
**Surface:** Practice (TLC Therapy Solutions) → **Client Growth** sub-tab
**Status:** Built + shipped behind the auto-merge lane. Migration `0045-practice-client-acquisition-leads.sql` applies the CRM table.

---

## What this is

A CLIENT-ACQUISITION process for **TLC Therapy Solutions** (tlctherapysolutions.com — Christina's multi-tenant therapy LMS / practice product), modeled on the 4-agent **"revenue agent team"** pattern, built as a **reusable in-app workflow** inside the PoeTech app. The app is the primary artifact (Layer 0 default): this is built where the user lives, not as a doc.

It is **config-driven and reusable** for any practice / tenant / sector, and handles either audience by config:

- **B2B (default, the lead path)** — therapy practices, group practices, and clinicians adopting TLC Therapy Solutions. This is the product's **primary customer**.
- **Patient path (noted)** — prospective clients for Christina's own practice. Highest sensitivity: pre-intake / contact-level only, local-only, same Acuity bright line as the Practice inquiry lane.

This realizes the **per-industry sovereign-LLM-team** vision (AI-TEAM-DISTRIBUTION, DR-0056) and the **WORKFLOW-MODULE-LIBRARY** charter: the four stages + guardrails are universal; only the audience + tenant change.

---

## The 4 stages (each a specialized role)

| # | Role | Goal | Produces |
|---|------|------|----------|
| 1 | 🔭 **Market Signal Researcher** | Identify real demand: underserved specialties/regions, search/social/competitor signals | Ranked segments + the one to lead with |
| 2 | 🧱 **Offer Architect** | Design the offer: clinician-CE track + patient-outcomes track, pricing tiers, packaging, value prop | The offer + tiers |
| 3 | 🎯 **Content Angle Strategist** | Shape outreach (YouTube, content engine, social, church audience) into clickable/watchable angles | Hooks + title options per channel |
| 4 | 🪝 **Conversion System Builder** | Lead magnets + follow-up sequences + an intake funnel that lands leads INTO PoeTech (CRM) | Lead magnets + nurture copy + funnel |

Each stage produces a **deterministic A.I. prompt** (the guardrails ride along on every call — you cannot get a draft without the ethical constraints attached). Outputs are **drafts a human approves**; nothing auto-sends.

---

## Where it lives (files)

- **Engine (pure, reusable):** `app/src/lib/client-acquisition.js` — the 4 stages, per-audience presets, `makeAcquisitionConfig` / `registerAudiencePreset` (extensibility), `buildStagePrompt` / `buildStageBrief`, the funnel + lead model, the guardrail linters.
- **Surface:** `app/src/components/ClientGrowth.jsx` — runs the stages, captures/approves drafts (device-local), the lead pipeline + funnel (real synced data), the honest A.I.-drafting seam.
- **Wiring:** `app/src/components/Practice.jsx` — `Operations` / `Client Growth` sub-tabs.
- **CRM table + sync:** `infra/supabase/migrations-auto/0045-practice-client-acquisition-leads.sql`, `app/src/lib/practice-leads-sync.js`, monolith reducers `addLead/updateLead/deleteLead`.
- **Tests:** `client-acquisition.test.js`, `practice-leads-sync.test.js`, `client-growth-render.test.jsx`.

---

## Binding guardrails (healthcare / therapy) — encoded + proven-to-catch

Per DR-0076 (verification doctrine), the guardrails are **data + a linter**, not a comment:

1. **Ethical healthcare marketing** — `screenMarketingClaim()` flags false/exaggerated outcome claims (guarantees, "cure," "100% effective," risk-free, unsourced success rates, superlatives). `block` severity cannot be approved. Respects therapy-advertising ethics (APA/ACA/NASW) + FTC truthful advertising + licensure/scope.
2. **No PHI in marketing** — `flagPotentialPhi()` catches client-identifying / clinical leakage; errs safe. The CRM table has **no clinical columns by design** (structural wall, not just a linter).
3. **Consent / served-not-surveilled** — outreach gated on `lead.consent.outreachOk`; recorded, revocable.
4. **No payment processing by us** — money is Darrell's hand. We produce packaging, price points, sequences, and leads — **never transactions**.
5. **Humans approve** — every output is a draft until Christina/Darrell approve.
6. **Psychoeducation, not treatment** — content educates and invites; never diagnoses, treats, or implies a clinical relationship before intake.

---

## The sovereign-A.I. seam (honest reality-trace)

The drafting runs on the NAS workflow **`wf-practice-growth`** (pending). The surface POSTs to the same-origin `/n8n/webhook/practice-growth` rewrite (never the absolute Funnel URL), tagging `sensitivity: commercial` for the B2B path (may escalate per DR-0056) and `clinical-local-only` for the patient path. **Until that workflow is wired, the surface does NOT paint a fake A.I. result** — it hands the human the exact deterministic prompt to run and a box to capture the real output. No painted numbers anywhere: leads + funnel counts are the real synced `practice_leads` list.

---

## Follow-ups (perpetual improvement — DR-0075)

- **`wf-practice-growth` NAS workflow** — wire the tiered-LLM drafting so "Draft with sovereign A.I." returns a real draft. `re-review:` when the GPU/Forge tier is online.
- **Stage-output cross-device sync** — approved stage outputs are device-local today (working drafts). Promote to a synced table if the family wants them shared across devices. `re-review: 2026-08-01`.
- **Fit-scoring** — `fit_score` column exists + is mappable; a scoring helper (signal-weighted) is the next engine addition.
