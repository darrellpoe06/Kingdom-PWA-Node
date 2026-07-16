-- =============================================================================
-- 0103 — The Word — publish the archived channel videos (Darrell 2026-07-16).
-- =============================================================================
-- THE BUG: the congregation's public The Word showed "No messages yet" while
-- leadership saw 137+ messages. Cause: every video imported from the channel was
-- sitting as status='draft' (the manager view's "In progress (private)" group),
-- and the public window theword_public_sermons() (migration 0029) returns ONLY
-- non-draft rows. So the whole archive was invisible to the people it exists for.
--
-- THE DOCTRINE (why this is safe, not a leak): an archived channel video is
-- ALREADY PUBLIC on YouTube — hiding it in-app protects nothing. The Word LIBRARY
-- is public by design (0029); the private thing is BG's PREP (points/scriptures),
-- which is gated SEPARATELY at the data layer (migration 0101 keeps unfinished
-- points private even on a published video). So publishing the video row makes
-- the service watchable now, while the prep still fills in over the next days —
-- exactly the placeholder flow Darrell asked for ("the video shows now, points
-- come 2-4 days later").
--
-- SCOPE: only source='youtube' rows that actually have a video (video_id NOT
-- NULL). A manual draft BG is still writing (source='manual', or a prep-only row
-- with no video) is UNTOUCHED — it stays private until leadership publishes it.
--
-- IDEMPOTENT: a plain guarded UPDATE. Once a row is 'active' the WHERE no longer
-- matches it, so re-running this file is a no-op. Safe to re-apply.

UPDATE choir_sermons
SET status = 'active',
    updated_at = now()
WHERE status = 'draft'
  AND source = 'youtube'
  AND video_id IS NOT NULL;

-- Verify (run by hand after apply): expect 0 archived-video drafts remaining.
--   SELECT count(*) FROM choir_sermons
--     WHERE status='draft' AND source='youtube' AND video_id IS NOT NULL;  -- 0
