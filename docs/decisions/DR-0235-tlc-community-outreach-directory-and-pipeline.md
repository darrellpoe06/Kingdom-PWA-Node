# DR-0235 — TLC community-outreach directory + the fourth TLC pipeline

- **Date:** 2026-07-27
- **Declared by:** Darrell, carrying Christina's build input (Zakaria's two
  lists, sent to Christina: the 2026-07-22 "Places to email" note and the
  2026-07-23 "Breast cancer places" note — four screenshots)
- **Status:** decided; shipped with this record

## Decision

TLC Therapy Solutions gains a **community-outreach lane on the ONE CRM
backbone**: a starter directory of the organizations Christina's practice
introduces itself to for referral relationships, and a fourth TLC pipeline
(`tlc-community-outreach`) those targets are worked through. Per Darrell:
*"enough is there to start it, and then she can add to it as we go along."*

## What shipped with this record

- `app/src/lib/tlc-outreach-targets.js` — the versioned starter directory:
  **38 Champaign-Urbana targets** (10 schools, 6 youth organizations, 4
  domestic-violence shelters, 5 community hospitals, 6 local nonprofits, 7
  OB/GYN & women's-health clinics) + **10 Chicago-area breast cancer centers**
  (each with the best person/role to reach and the phone as provided), with a
  provenance block and the `targetToLead()` ONE-CRM adapter.
- `app/src/lib/crm-engine.js` — the `tlc-community-outreach` pipeline
  (stages new → contacted → engaged → **referring partner** (won) /
  declined / lost), the `community-list` source, and the
  `tlc-community-nurture` draft sequence (intro → follow-up → front-office
  call).
- `infra/supabase/migrations-auto/0120-tlc-community-outreach-pipeline.sql` —
  the `crm_capture_lead()` allowlist branch. **No new table** (ONE-CRM,
  DR-0081).
- `app/src/components/CRM.jsx` — the directory panel on the new pipeline
  tab: per-target and per-category import landing real `crm_leads` rows;
  slug-stable ids + the DB unique `(instance_id, slug)` index make re-import
  idempotent.
- `app/src/__tests__/tlc-outreach-targets.test.js` — 15 proven-to-catch
  tests pinning the source-list counts, slug uniqueness, the adapter, the
  consent gate, the no-PHI posture, and engine↔RPC allowlist sync.

## Binding rules

1. **ONE-CRM (DR-0081):** this is a pipeline + reference data, never a
   second CRM. New targets are added to the directory file or captured on
   the board — both land in `crm_leads`.
2. **Org-level only — no PHI, ever:** every entry is an organization's
   public contact (public inbox, front-office phone, role title). A client
   or patient name never appears in a note, message, or record on this lane.
3. **Consent posture (served, not surveilled):** directory targets start
   `outreachOk: false`. The first introduction is a **human-sent** email or
   call from Christina; a recorded reply/opt-in unlocks the nurture drafts,
   and every draft still requires human approval. Nothing auto-sends.
4. **Provenance honesty (DR-0076):** names, roles, and phones are
   transcribed **as provided** and marked unverified; verify a number before
   relying on it. Obvious source misspellings were normalized to the real
   institutions (Champaign Central, Bottenfield, Carle) and the
   normalizations are recorded in the provenance block.
5. **Christina grows the list:** the directory is the starter, not the
   ceiling — she adds emails, contacts, and new places as the work proceeds
   (directly in-app via capture, or in the directory file).

## Re-review

- `re-review: 2026-08-24` — after a month of real outreach: which categories
  produced referring partners, whether the nurture steps match how
  organizations actually respond, and whether contact details have been
  verified/filled in enough to retire the "as provided" caveat.
