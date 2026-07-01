-- =============================================================================
-- 0061 — dedupe The Word message library + guard against re-created duplicates
-- =============================================================================
-- Live bug (Darrell, 2026-07-01): The Word showed SIX identical draft rows
-- "POINTS AND SCRIPTURES FROM 11-26-2023 SERMON - I.M ON THE LORD.S SIDE -
-- LUKE 19.9-10 NIV", all dated 2026-06-29, Bishop Lloyd E. Gwin. The harvest that
-- generates these study drafts writes choir_sermons rows with a NULL video_id,
-- and the only uniqueness guard was choir_sermons_video_uniq —
-- (instance_id, video_id) WHERE video_id IS NOT NULL — so null-video_id rows were
-- unprotected and re-runs stacked duplicates (a death-scroll of clones).
--
-- This migration (1) collapses existing duplicates, keeping the EARLIEST row of
-- each, and (2) adds a partial unique index so a message without a source video
-- can never duplicate again on its stable key — (instance_id, title,
-- service_date, service_type, service_slot) — regardless of whether the writer is
-- the app or an n8n/NAS harvest. The DB is the single deterministic backbone, so
-- the guard lives here, catching every writer.
--
-- Idempotent (DR-0084): re-applying is a no-op — the DELETE finds no remaining
-- duplicates and the index uses IF NOT EXISTS.
-- =============================================================================

-- (1) Collapse existing duplicates -> keep the earliest row per stable key.
-- video-backed rows partition by their video_id (already guarded, but harmless);
-- video-less rows partition by title + date + service_type + slot.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY instance_id,
                        lower(btrim(title)),
                        service_date,
                        coalesce(service_type, ''),
                        coalesce(service_slot, ''),
                        coalesce(video_id, '')
           ORDER BY created_at NULLS LAST, id
         ) AS rn
  FROM choir_sermons
)
DELETE FROM choir_sermons
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- (2) Guard: a message WITHOUT a source video is unique by its content key within
-- a tenant. Complements choir_sermons_video_uniq (which covers the video-backed
-- case). A second identical harvest write now conflicts instead of duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS choir_sermons_novideo_uniq
  ON choir_sermons (
    instance_id,
    lower(btrim(title)),
    service_date,
    coalesce(service_type, ''),
    coalesce(service_slot, '')
  )
  WHERE video_id IS NULL;
