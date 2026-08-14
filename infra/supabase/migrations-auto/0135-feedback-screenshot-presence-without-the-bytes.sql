-- =============================================================================
-- 0135 — feedback carries its screenshot PRESENCE, so the list never carries the BYTES
-- =============================================================================
-- Post-incident, 2026-08-14. Every account across all three apps (PoeTech, The
-- Love Corner, MooreDivahs, TLC Therapy Solutions) was signed out and could not
-- get back in. Supabase answered HTTP 402 on /auth/v1/token, /auth/v1/signup and
-- every /rest/v1 path: "Service for this project is restricted due to the
-- following violations: exceed_egress_quota."
--
-- The org is on the free plan. Something was spending the monthly egress, and
-- the measurement found it in this table:
--
--   119 rows, 6.4 MB total. 6.2 MB of that is base64 image data —
--   4.4 MB in `screenshot`, 1.9 MB in `screenshots` — carried by just 24 rows.
--   The single largest `screenshot` value is 425 kB.
--
-- And `subscribeFeedback()` (app/src/lib/feedback-sync.js) pulled ALL of it with
-- `.select('*')`, with NO limit:
--   • once per sign-in, for EVERY signed-in user, from the main app shell — not
--     an admin surface, so every family member and every church member paid it;
--   • and AGAIN, in full, on every realtime INSERT by anyone.
-- A handful of people opening the app a few times a day is multiple megabytes
-- per open. That is the quota.
--
-- WHY A GENERATED COLUMN AND NOT JUST A NARROWER SELECT.
-- The obvious fix — stop selecting the blob columns — breaks the one honest
-- thing the list needs from them: whether a screenshot EXISTS and how many.
-- PostgREST cannot compute that client-side without reading the column, so
-- dropping the blobs would have meant either shipping the bytes anyway or
-- painting a badge that guesses. A painted badge is exactly what DR-0076 and
-- P15 forbid ("a painted number is worse than no number on a surface whose
-- whole value is trust").
--
-- So the count is DERIVED in the database and travels as two small scalars. The
-- board can say "3 screenshots" truthfully while moving ~8 bytes instead of
-- ~260 kB, and the image itself is fetched only when a person opens that card.
--
-- Both expressions are IMMUTABLE, which STORED generated columns require:
-- `jsonb_typeof` guards the array case so a malformed or object-shaped
-- `screenshots` value degrades to 0 rather than raising and blocking the write.
--
-- TWO THINGS A DRY RUN CAUGHT, both of which would have shipped silently.
-- These expressions were executed against a temp table with five shapes before
-- this file was finalised, and the results were read rather than assumed:
--
--   1. `screenshot IS NOT NULL OR (jsonb_typeof(...) = 'array' AND ...)` returns
--      **NULL**, not false, for a row where both columns are null — SQL's
--      three-valued logic: `false OR NULL` is NULL. That is the common case
--      (95 of 119 rows today). The client would then have fallen through to its
--      byte-based fallback and computed `false` anyway — the right answer for
--      the wrong reason, which is luck, not engineering. COALESCE makes the
--      column an honest boolean.
--
--   2. The count let an EMPTY `screenshots` array shadow a legacy `screenshot`,
--      so a row with a legacy image reported `has_screenshot = true` and
--      `screenshot_count = 0` — the two columns disagreeing about the same row.
--      The array branch now requires a NON-empty array before it wins.
--
-- DEPENDS ON: the `feedback` table (screenshot text, screenshots jsonb).
-- IDEMPOTENT: additive ADD COLUMN IF NOT EXISTS only. No row is rewritten by
-- hand; Postgres backfills the generated values once, on the ALTER.
-- REVERSIBLE: DROP COLUMN on either column restores the prior shape exactly;
-- no existing column is altered and no data is destroyed.
-- =============================================================================

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS screenshot_count integer
    GENERATED ALWAYS AS (
      CASE
        WHEN jsonb_typeof(screenshots) = 'array' AND jsonb_array_length(screenshots) > 0
          THEN jsonb_array_length(screenshots)
        WHEN screenshot IS NOT NULL THEN 1
        ELSE 0
      END
    ) STORED;

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS has_screenshot boolean
    GENERATED ALWAYS AS (
      COALESCE(
        screenshot IS NOT NULL
        OR (jsonb_typeof(screenshots) = 'array' AND jsonb_array_length(screenshots) > 0),
        false
      )
    ) STORED;

COMMENT ON COLUMN public.feedback.screenshot_count IS
  'Derived (0135). How many images this row carries. Lets a list answer "3 screenshots" without transferring them — the base64 columns are the project egress driver measured on 2026-08-14.';

COMMENT ON COLUMN public.feedback.has_screenshot IS
  'Derived (0135). Whether this row carries any image. Never hand-set; Postgres computes it from screenshot/screenshots.';
