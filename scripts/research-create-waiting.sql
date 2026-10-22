-- research-create-waiting.sql -- answered items nothing has been filed for yet (DR-1202)
-- Run by research-inbox.yml's backlog job; each id goes to
-- scripts/research-create.sh, which files a lesson or a build request (or marks
-- the item research only). Ids only, one per line, oldest first, ten at most.
--
-- An item whose link could not be read is filed from the words sent with
-- it (research-create.sh says so, never invents), so it is listed too.
--
-- READY means the answer exists AND either its reading has come back (made or
-- failed), or the answer is twenty minutes old -- so a sleeping tower delays
-- what is filed by twenty minutes, never forever.
SELECT i.id
FROM public.agent_inbox i
JOIN public.agent_inbox a
  ON (a.tags ? 'research-answer' OR (a.tags ? 'research-failed' AND NOT (a.tags ? 'superseded')))
 AND a.tags ? ('of:' || i.id::text)
WHERE i.tags ? 'research'
  AND i.tags ? 'research-answered'
  AND NOT (i.tags ? 'research-created')
  AND NOT (i.tags ? 'research-create-none')
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(i.tags) t WHERE t LIKE 'of:%'
  )
  AND (
    EXISTS (SELECT 1 FROM public.agent_inbox r
             WHERE (r.tags ? 'research-reading' OR r.tags ? 'research-reading-failed')
               AND r.tags ? ('of:' || i.id::text))
    OR a.created_at < now() - interval '20 minutes'
    -- a link that could not be read has no reading to wait for
    OR a.tags ? 'research-failed'
  )
GROUP BY i.id, i.created_at
ORDER BY i.created_at ASC
LIMIT 10;
