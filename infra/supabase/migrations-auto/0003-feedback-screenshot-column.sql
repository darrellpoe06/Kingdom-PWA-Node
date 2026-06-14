-- =============================================================================
-- 0003 — feedback screenshot column (2026-06-13)
-- =============================================================================
-- The "Tell us what you think" feedback form (FeedbackModal -> addFeedback ->
-- uploadFeedback) persists to the `feedback` table. Christina asked to attach a
-- screenshot "for clarification." This adds an optional column for a compressed
-- JPEG data URL.
--
-- Deploy-ordering safe: the client sends the screenshot DEFENSIVELY (it retries
-- the insert without the image if this column isn't live yet), so whether this
-- migration applies before or after the client bundle deploys, feedback never
-- breaks — the worst case is the image is dropped until the column lands.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot text;

-- Refresh PostgREST's schema cache so the new column is insertable immediately
-- (otherwise there is a brief window where Postgres has the column but the API
-- layer's cached schema does not, and inserts naming it would 400).
NOTIFY pgrst, 'reload schema';
