-- =============================================================================
-- 0240 — Your lessons reads the Governor's own two doors, and no one else's
-- (DR-0672)
-- =============================================================================
-- Darrell 2026-09-29: "Yes build it all in the app!!!" Your lessons shows each
-- lesson he sent, from arrival to live. He sends from two sign-ins that are
-- both his (DR-0172 pairs them; lesson_governor_emails() in 0237 lists them).
-- Under 0237's read policy each sign-in reads only its own rows, so the phone
-- showed the phone's lessons and the desktop the desktop's, and neither showed
-- "every lesson Darrell has sent".
--
-- What this adds: my_lesson_rows(p_limit), SECURITY DEFINER, read-only.
--   * Everyone: their OWN `lesson` rows (created_by = auth.uid(), in an
--     instance they belong to), exactly what agent_inbox_read already allows.
--   * The Governor only (is_lesson_governor()): ALSO the `lesson` rows written
--     by his other declared sign-in door. Never a member's row: the widening is
--     by the Governor's own email list, not by instance, role or tag.
-- The read policy on agent_inbox is NOT changed. Nothing is written.
-- Proven by infra/supabase/tests/0240-my-lesson-rows-smoke.sql.
-- IDEMPOTENT: CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.my_lesson_rows(p_limit int DEFAULT 100)
RETURNS TABLE (id uuid, body text, tags jsonb, created_at timestamptz, created_by uuid, review_reason text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT a.id, a.body, a.tags, a.created_at, a.created_by, a.review_reason
    FROM agent_inbox a
   WHERE a.tags @> '["lesson"]'::jsonb
     AND auth.uid() IS NOT NULL
     AND (
       (a.created_by = auth.uid() AND public.user_role_in_instance(a.instance_id) IS NOT NULL)
       OR (
         public.is_lesson_governor()
         AND a.created_by IN (
           SELECT u.id FROM auth.users u
            WHERE lower(coalesce(u.email, '')) = ANY (public.lesson_governor_emails())
         )
       )
     )
   ORDER BY a.created_at DESC
   LIMIT least(greatest(coalesce(p_limit, 100), 1), 300);
$$;
REVOKE ALL ON FUNCTION public.my_lesson_rows(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_lesson_rows(int) TO authenticated;
