-- lesson-inbox-recent.sql -- every lesson row made in the last day, any state (DR-0725)
-- For the builder status print only: where did a lesson go (captured by the
-- intake, held, handed back, still waiting)? Same columns as
-- lesson-inbox-waiting.sql; never the body itself.
SELECT id, created_at, created_by, coalesce(source,''), tags::text, length(coalesce(body,''))
FROM public.agent_inbox
WHERE tags ? 'lesson' AND created_at > now() - interval '1 day'
ORDER BY created_at ASC;
