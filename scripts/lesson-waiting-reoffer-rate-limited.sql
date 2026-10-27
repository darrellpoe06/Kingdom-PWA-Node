-- lesson-waiting-reoffer-rate-limited.sql -- offer a rate-limited teaching
-- again (DR-1232). ON REQUEST ONLY (lesson-builder-health.yml input
-- reoffer_rate_limited), by a runner over the tailnet (DR-1159 road 1).
--
-- A waiting lesson row whose newest lesson_versions.error says the model's
-- rate limit answered (HTTP 429 / rate limit / overloaded) but whose tags do
-- not say so -- because the build-reason tag was cut at 200 characters before
-- the status (DR-1232) -- is counted by the builder as a lesson that failed
-- twice, and never offered again. Nothing is wrong with the teaching. This
-- adds ONE tag naming the reason the builder's own eligibility() reads, so
-- the row is offered again under the rate-limit rule (DR-1202: a cooldown,
-- two more bounded tries). The tag change rings the builder (migration 0243).
-- Idempotent: a row already carrying the tag, or already saying rate-limited,
-- is left alone. Never a body: ids are not even printed -- one count.
WITH waiting AS (
  SELECT id, tags
  FROM public.agent_inbox
  WHERE tags ? 'lesson'
    AND NOT (tags ? 'lesson-captured')
    AND NOT (tags ? 'lesson-building')
    AND NOT (tags ? 'awaiting-review')
    AND NOT (tags ? 'not-a-lesson')
    AND NOT (tags ? 'withdrawn')
), last_version AS (
  SELECT DISTINCT ON (v.teaching_row_id) v.teaching_row_id, v.error
  FROM public.lesson_versions v
  JOIN waiting w ON w.id = v.teaching_row_id
  WHERE NOT v.backfill
  ORDER BY v.teaching_row_id, v.created_at DESC
), due AS (
  SELECT w.id
  FROM waiting w
  JOIN last_version v ON v.teaching_row_id = w.id
  WHERE coalesce(v.error, '') ~* '(api_error_status\\?"?\s*:\s*429|\mHTTP 429\M|\m429 Too Many|rate[ _-]?limit|overloaded)'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(w.tags) AS t(tag)
                     WHERE t.tag LIKE 'build-reason:%'
                       AND t.tag ~* '(api_error_status\\?"?\s*:\s*429|\mHTTP 429\M|\m429 Too Many|rate[ _-]?limit|overloaded)')
), done AS (
  UPDATE public.agent_inbox a
     SET tags = a.tags || '["build-reason:rate-limited: HTTP 429 read from lesson_versions by DR-1232; offered again"]'::jsonb
    FROM due WHERE a.id = due.id
  RETURNING a.id
)
SELECT (SELECT count(*) FROM waiting), (SELECT count(*) FROM due), (SELECT count(*) FROM done);
