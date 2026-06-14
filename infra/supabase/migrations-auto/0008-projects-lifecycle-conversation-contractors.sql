-- =============================================================================
-- 0008 — projects: lifecycle + conversation_log + contractor_ids (jsonb)
-- =============================================================================
-- A1 (rigorous-review 2026-06-13, HIGH dead end). Projects now push to the cloud
-- on add/update (PR #111), but projects-sync.fromRow never mapped the
-- device-local rich fields — lifecycle (the phase + audit log), conversation_log,
-- and contractor_ids — so every realtime refetch replaced the local project with
-- a cloud copy that LACKED them, silently stripping the lifecycle trail and the
-- conversation/contractor links across devices.
--
-- Fix mirrors the proven incidents pattern (schema-v2.13: lifecycle jsonb +
-- dispatch jsonb): give projects real columns for these fields so they
-- round-trip and SYNC across devices instead of being lost. projects-sync maps
-- them in toRow/fromRow; a field-preserving merge (mergeRemoteProjects) keeps the
-- local copy whenever a cloud row doesn't carry the field yet (the transition
-- window + any never-synced edit).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, nullable jsonb. Deploy-safe: a project
-- create that races ahead of this column fails soft (the local copy is kept and
-- retries on the next sync) — same fail-soft the sync layer already guarantees.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS lifecycle jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS conversation_log jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contractor_ids jsonb;

-- Refresh PostgREST's schema cache so the new columns are writable immediately.
NOTIFY pgrst, 'reload schema';
