-- lesson-waiting-last-verdict.sql -- for each waiting lesson row, what the
-- gates recorded on its LAST build (DR-1232). Read by lesson-builder-health.yml
-- on request (workflow_dispatch input probe_waiting), so the question "why
-- does the builder hand these back?" is answered from the live database by a
-- runner over the tailnet (DR-1159), never from memory and never by a hand.
--
-- "Waiting" is lesson-inbox-waiting.sql's predicate verbatim (one definition).
-- The verdict is the newest public.lesson_versions row for the teaching:
-- the writer, how long it took, whether anything parsed, and each gate's
-- counts. NEVER A BODY, NEVER A PROMPT: those columns are not selected, and
-- the writer's error text has every quoted string of 25+ characters elided,
-- so a model's reply can never leak through an error tail. Verse references
-- (the refs a fault names) are printed; they are references, not words.
--
-- One line per waiting row:
--   row id | attempts (build:failed tags) | last version at | writer | elapsed ms
--   | had a draft (body is not null) | gates passed | verse passed | spans | verbatim
--   | verse faults | fault refs (first 5) | structure problems | quotation problems
--   | voice problems | depth problems | repo gates failed | error (elided)
--   | the CLI's own error sentence (100 chars) | build-reason tags (elided)
WITH waiting AS (
  SELECT id, created_at, tags
  FROM public.agent_inbox
  WHERE tags ? 'lesson'
    AND NOT (tags ? 'lesson-captured')
    AND NOT (tags ? 'lesson-building')
    AND NOT (tags ? 'awaiting-review')
    AND NOT (tags ? 'not-a-lesson')
    AND NOT (tags ? 'withdrawn')
), last_version AS (
  SELECT DISTINCT ON (v.teaching_row_id)
         v.teaching_row_id, v.created_at, v.writer, v.elapsed_ms, v.body, v.gate_results, v.error
  FROM public.lesson_versions v
  JOIN waiting w ON w.id = v.teaching_row_id
  WHERE NOT v.backfill
  ORDER BY v.teaching_row_id, v.created_at DESC
)
SELECT w.id,
       (SELECT count(*) FROM jsonb_array_elements_text(w.tags) AS t(tag) WHERE t.tag LIKE 'build:failed@%'),
       coalesce(to_char(v.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'no version stored'),
       coalesce(v.writer, ''),
       coalesce(v.elapsed_ms::text, ''),
       CASE WHEN v.teaching_row_id IS NULL THEN '' WHEN v.body IS NULL THEN 'no draft' ELSE 'draft' END,
       coalesce(v.gate_results->>'passed', ''),
       coalesce(v.gate_results->'verse'->>'passed', ''),
       coalesce(v.gate_results->'verse'->>'spans', ''),
       coalesce(v.gate_results->'verse'->>'verbatim', ''),
       coalesce(jsonb_array_length(CASE WHEN jsonb_typeof(v.gate_results->'verse'->'faults') = 'array' THEN v.gate_results->'verse'->'faults' END)::text, ''),
       coalesce((SELECT string_agg(s.f->>'ref', ', ') FROM (SELECT e.v AS f FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v.gate_results->'verse'->'faults') = 'array' THEN v.gate_results->'verse'->'faults' ELSE '[]'::jsonb END) AS e(v) LIMIT 5) s), ''),
       coalesce(jsonb_array_length(CASE WHEN jsonb_typeof(v.gate_results->'structure'->'problems') = 'array' THEN v.gate_results->'structure'->'problems' END)::text, ''),
       coalesce(v.gate_results->'quotation'->>'problem_count', ''),
       coalesce(v.gate_results->'voice'->>'problem_count', ''),
       coalesce(jsonb_array_length(CASE WHEN jsonb_typeof(v.gate_results->'depth'->'problems') = 'array' THEN v.gate_results->'depth'->'problems' END)::text, ''),
       coalesce((SELECT string_agg(k, ',') FROM jsonb_each(CASE WHEN jsonb_typeof(v.gate_results->'repo_gates') = 'object' THEN v.gate_results->'repo_gates' ELSE '{}'::jsonb END) AS g(k, x)
                  WHERE jsonb_typeof(x) = 'object' AND (x->>'passed') = 'false'), ''),
       left(regexp_replace(coalesce(v.error, ''), '"[^"]{25,}"', '"<elided>"', 'g'), 300),
       -- The CLI's own error sentence (an is_error envelope's "result" is the
       -- CLI saying why: "Prompt is too long", a sign-in, a limit). The first
       -- 100 characters, only from a failed run's envelope -- the same words
       -- the row's build-reason tag already carries in public (DR-1232).
       coalesce(substring(coalesce(v.error, '') from '"result":"([^"]{0,100})'), ''),
       coalesce((SELECT string_agg(left(regexp_replace(t.tag, '"[^"]{25,}"', '"<elided>"', 'g'), 220), ' || ')
                   FROM jsonb_array_elements_text(w.tags) AS t(tag) WHERE t.tag LIKE 'build-reason:%'), '')
FROM waiting w
LEFT JOIN last_version v ON v.teaching_row_id = w.id
ORDER BY w.created_at ASC;
