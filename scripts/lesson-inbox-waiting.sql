-- lesson-inbox-waiting.sql -- which lesson rows wait (DR-0725)
-- Shared by inbox-lessons-waiting.yml (the list for a person) and
-- lesson-inbox-bell.yml (the bell). One query, one definition of "waiting".
-- Columns: id | created_at | created_by | source | tags (json text) | body LENGTH.
-- Never the body itself: a lesson holds a person's words, and every output of
-- this query is visible to the repository.
SELECT id, created_at, created_by, coalesce(source,''), tags::text, length(coalesce(body,''))
FROM public.agent_inbox
WHERE tags ? 'lesson'
  AND NOT (tags ? 'lesson-captured')
  AND NOT (tags ? 'lesson-building')
  AND NOT (tags ? 'awaiting-review')
ORDER BY created_at ASC;
