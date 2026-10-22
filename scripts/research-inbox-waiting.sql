-- research-inbox-waiting.sql -- claim the research items that wait (DR-1172, DR-1202)
-- Run by .github/workflows/research-inbox.yml's pick job. ONE definition of
-- "waiting", the same shape scripts/lesson-inbox-waiting.sql holds for lessons,
-- and the rule infra/nas-research/research_bell.py rings on.
--
-- Prints one claimed id per line. Bodies never leave here: each work runner
-- reads its own item's body by id, base64, into a file.
--
-- WAITING means: tagged research, NOT claimed by a reader, NOT already
-- answered, and not a child row (an answer or a failure names its parent with
-- of:<id> and is never an item of its own).
--
-- THE CLAIM IS IN THE SAME STATEMENT (DR-1202). Up to six items are taken at
-- once so each gets its own runner, in parallel. FOR UPDATE SKIP LOCKED means
-- two runs that overlap can never take the same item -- the lock DR-0768 paid
-- for when one row was claimed, failed and re-claimed six times in an hour,
-- now held for a batch instead of one row.
-- A CLAIM THAT DIED IS RELEASED (DR-1202). A runner that is lost after the
-- claim and before any answer (a timeout, a cancelled job) would otherwise
-- leave its item claimed for ever, and the bell never rings for a claimed
-- item. A claim carries research-claimed-at:<epoch>; one older than 90
-- minutes (past the work job's 60-minute ceiling) with no answer is released
-- and counted with research-released, at most three times, so a stuck item
-- is tried again and an item that keeps killing its runner does not loop.
WITH stale AS (
  SELECT id
  FROM public.agent_inbox
  WHERE tags ? 'research'
    AND tags ? 'research-claimed'
    AND NOT (tags ? 'research-answered')
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tags) t
       WHERE t LIKE 'research-claimed-at:%'
         AND substring(t from 21) ~ '^[0-9]+$'
         AND substring(t from 21)::bigint < extract(epoch from now())::bigint - 5400
    )
    AND (SELECT count(*) FROM jsonb_array_elements_text(tags) t WHERE t = 'research-released') < 3
)
UPDATE public.agent_inbox a
   SET tags = COALESCE((SELECT jsonb_agg(t) FROM jsonb_array_elements_text(a.tags) t
                         WHERE t <> 'research-claimed' AND t NOT LIKE 'research-claimed-at:%'), '[]'::jsonb)
              || '["research-released"]'::jsonb
  FROM stale
 WHERE a.id = stale.id;

WITH waiting AS (
  SELECT id
  FROM public.agent_inbox
  WHERE tags ? 'research'
    AND NOT (tags ? 'research-claimed')
    AND NOT (tags ? 'research-answered')
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE t LIKE 'of:%'
    )
  ORDER BY created_at ASC
  LIMIT 6
  FOR UPDATE SKIP LOCKED
)
UPDATE public.agent_inbox a
   SET tags = a.tags || jsonb_build_array('research-claimed', 'research-claimed-at:' || extract(epoch from now())::bigint)
  FROM waiting w
 WHERE a.id = w.id
RETURNING a.id;
