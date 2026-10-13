-- lesson-inbox-progress.sql -- which lesson rows are in flight (DR-0725)
-- Read by lesson-inbox-bell.yml (the bell) and the builder status step in
-- inbox-lessons-waiting.yml. A superset of lesson-inbox-waiting.sql: every
-- lesson row not yet captured (waiting, building, awaiting review, handed
-- back), plus rows the NAS builder finished in the last day (shipped,
-- duplicate, skipped-test) so "shipped with its PR" can be reported.
-- Columns: id | created_at | created_by | source | tags (json text) | body LENGTH.
-- Never the body itself: a lesson holds a person's words, and every output of
-- this query is visible to the repository.
SELECT id, created_at, created_by, coalesce(source,''), tags::text, length(coalesce(body,''))
FROM public.agent_inbox
WHERE tags ? 'lesson'
  AND (NOT (tags ? 'lesson-captured')
       OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) AS t(tag)
                  WHERE t.tag ~ '^build:(published|duplicate|skipped-test)@[0-9TZ:-]+$'
                    AND substring(t.tag from '@(.+)$')::timestamptz > now() - interval '1 day'))
ORDER BY created_at ASC;
