-- =============================================================================
-- 0105 — contractor `kind` (1099 relationship classification)
-- =============================================================================
-- Darrell 2026-07-18: "How does the 1099 relationship actually work and how
-- should it work and be safe... family members can be the 1099 worker... allow
-- outsiders... 1099 workers for the church... All 1099 should have isolation
-- unless they are the tax accountant."
--
-- The KIND of a 1099 relationship changes both the tax treatment and the safe
-- access default, so it is captured once on the worker record. Values mirror
-- app/src/lib/worker-classification.js WORKER_KIND_IDS:
--   business | family | household | church | clergy | accountant
-- Nullable + defaulted so every existing row keeps working (additive, safe by
-- construction, idempotent) — same pattern as 0040-contractor-type.sql.
-- Access isolation itself stays enforced by the 1099-Assistant RLS wall; this
-- column only records the classification that DRIVES the default + the advisory.

ALTER TABLE contractors_1099
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'business';
