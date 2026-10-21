-- research-reading-waiting.sql -- which ANSWERED research items still wait for
-- their reading (DR-1199). Read by .github/workflows/research-inbox.yml after
-- research-inbox-waiting.sql finds nothing to answer.
--
-- Columns: id | created_by | instance_id | note base64 | answer base64
--
-- WAITING FOR A READING means: an item that is answered (its answer child
-- exists), has no `research-reading` child, is not claimed for a reading, and
-- has no `research-reading-failed` child younger than six hours (the tower is
-- often asleep; the road looks again, but not every quarter hour for ever).
-- Base64 for the same two reasons research-inbox-waiting.sql gives; the answer
-- body is the words the reading is made from (its first line is the
-- unverified sentence, which the reader may keep).
SELECT i.id, i.created_by, i.instance_id,
       replace(encode(convert_to(coalesce(i.body,''), 'UTF8'), 'base64'), chr(10), ''),
       replace(encode(convert_to(coalesce(a.body,''), 'UTF8'), 'base64'), chr(10), '')
FROM public.agent_inbox i
JOIN public.agent_inbox a
  ON a.tags ? 'research-answer' AND a.tags ? ('of:' || i.id::text)
WHERE i.tags ? 'research'
  AND i.tags ? 'research-answered'
  AND NOT (i.tags ? 'research-reading-claimed')
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(i.tags) t WHERE t LIKE 'of:%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_inbox r
     WHERE r.tags ? 'research-reading' AND r.tags ? ('of:' || i.id::text)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.agent_inbox f
     WHERE f.tags ? 'research-reading-failed' AND f.tags ? ('of:' || i.id::text)
       AND f.created_at > now() - interval '6 hours'
  )
ORDER BY a.created_at ASC
LIMIT 1;
