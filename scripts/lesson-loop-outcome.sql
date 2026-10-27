-- lesson-loop-outcome.sql -- does the lesson loop actually PRODUCE? (DR-1219)
-- Read by lesson-builder-health.yml, whose other judgements are all about
-- READINESS (unit active, not stopped, a writer ready, credential present).
-- All five of those were true for the four days to 2026-10-26 while fifteen
-- rows sat up to 102 hours and nothing shipped, so the witness passed daily on
-- a loop that was producing nothing. These three numbers are the outcome it
-- was missing.
--
-- Three numbers on one line, in this order:
--   waiting        | how many lesson rows wait for the intake right now
--   oldest_hours   | how long the OLDEST of them has waited, whole hours
--   shipped_in_day | how many the builder actually finished in the last day
--
-- The predicates are not new. "Waiting" is lesson-inbox-waiting.sql verbatim,
-- and "finished" is the build-tag test from lesson-inbox-progress.sql
-- verbatim, so this cannot drift into a second definition of either -- one
-- query, one definition, the rule those two files already set.
--
-- Never the body, and never an id: this answers "is the loop moving", and the
-- counts are all it needs. Its output is visible to the repository.
SELECT
  (SELECT count(*) FROM public.agent_inbox
    WHERE tags ? 'lesson'
      AND NOT (tags ? 'lesson-captured')
      AND NOT (tags ? 'lesson-building')
      AND NOT (tags ? 'awaiting-review')
      AND NOT (tags ? 'not-a-lesson')
      AND NOT (tags ? 'withdrawn')),
  (SELECT coalesce(floor(max(extract(epoch FROM (now() - created_at))) / 3600), 0)::bigint
     FROM public.agent_inbox
    WHERE tags ? 'lesson'
      AND NOT (tags ? 'lesson-captured')
      AND NOT (tags ? 'lesson-building')
      AND NOT (tags ? 'awaiting-review')
      AND NOT (tags ? 'not-a-lesson')
      AND NOT (tags ? 'withdrawn')),
  (SELECT count(*) FROM public.agent_inbox
    WHERE tags ? 'lesson'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) AS t(tag)
                   WHERE t.tag ~ '^build:(published|duplicate|skipped-test)@[0-9TZ:-]+$'
                     AND substring(t.tag from '@(.+)$')::timestamptz > now() - interval '1 day'));
