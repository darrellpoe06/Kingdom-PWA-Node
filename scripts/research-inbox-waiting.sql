-- research-inbox-waiting.sql -- which research items still wait (DR-1172)
-- Read by .github/workflows/research-inbox.yml. ONE definition of "waiting",
-- the same shape scripts/lesson-inbox-waiting.sql holds for the lessons.
--
-- Columns: id | created_at | created_by | instance_id | length(body) | body base64
--
-- THE BODY IS BASE64 ON PURPOSE, two reasons. (1) It is a link or a question
-- Darrell typed, and the caller must be able to read it WITHOUT any step
-- echoing it into a log (the rule voice-intake-health.yml keeps). (2) A body
-- holding a newline or a quote would break the field-separated parse; base64
-- cannot.
--
-- WAITING means: tagged research, NOT claimed by a reader, NOT already
-- answered, and not a child row (an answer or a failure names its parent with
-- of:<id> and is never an item of its own). A row a reader has claimed is
-- excluded, so one prompt is never answered twice -- the lock DR-0768 paid for
-- when one row was claimed, failed and re-claimed six times in an hour.
-- replace(...) because postgres wraps base64 at 76 characters, and a wrapped
-- field would break the one-row-per-line parse the caller does.
SELECT id, created_at, created_by, instance_id, length(coalesce(body,'')),
       replace(encode(convert_to(coalesce(body,''), 'UTF8'), 'base64'), chr(10), '')
FROM public.agent_inbox
WHERE tags ? 'research'
  AND NOT (tags ? 'research-claimed')
  AND NOT (tags ? 'research-answered')
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE t LIKE 'of:%'
  )
ORDER BY created_at ASC
LIMIT 1;
