-- =============================================================================
-- 0026 — feedback screenshots[] column (2026-06-16)
-- =============================================================================
-- The "Tell us what you think" feedback form (FeedbackModal -> addFeedback ->
-- uploadFeedback) persists to the `feedback` table. Migration 0003 added a
-- single `screenshot` text column. Parishioners asked to attach more than one
-- image at a time ("I can only select one at a time"). This adds a `screenshots`
-- jsonb column holding the full ordered array of compressed JPEG data URLs.
--
-- The legacy `screenshot` column stays populated with the FIRST image for
-- back-compat (older clients, the Synology Chat post, and any reader that only
-- knows the single column).
--
-- Deploy-ordering safe: the client inserts the richest payload the live schema
-- supports and degrades on each schema-cache miss (screenshots[] -> screenshot
-- -> no image), so feedback never breaks whether this migration applies before
-- or after the client bundle deploys. Worst case in that window: images beyond
-- the first are dropped until this column lands.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshots jsonb;

-- Refresh PostgREST's schema cache so the new column is insertable immediately
-- (otherwise there is a brief window where Postgres has the column but the API
-- layer's cached schema does not, and inserts naming it would 400).
NOTIFY pgrst, 'reload schema';
