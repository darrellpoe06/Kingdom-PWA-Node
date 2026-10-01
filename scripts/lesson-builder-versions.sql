-- lesson-builder-versions.sql -- every writer's gate result for recent builds (DR-0725)
-- Columns: build_id | writer | gates passed (true/false/empty) | published | created_at.
-- Never a body or a prompt: those columns are not selected.
SELECT build_id, writer, coalesce(gate_results->>'passed',''), published, created_at
FROM public.lesson_versions
WHERE NOT backfill AND created_at > now() - interval '3 days'
ORDER BY created_at ASC;
