-- =============================================================================
-- 0344 — downloads open only on Darrell's word (DR-1656)
-- =============================================================================
-- Darrell, 2026-11-25: "We actually don't want downloads unless we have a
-- specific reason... make that behind a control... no one can by default...
-- I'm not allowing it currently... but want to be able to at will." Then:
-- "Build the in-app downloads switch now."
--
-- DR-1655 shipped the switch as one line in the app (DOWNLOADS_OPEN = false).
-- This makes it a switch he flips in the app, with no deploy.
--
-- WHAT THIS ADDS
--   1. platform_switches (key, is_on, updated_at, updated_by): one row per
--      platform-wide switch. No policies: anon and authenticated read and write
--      nothing directly; the two functions below are the only doors.
--   2. downloads_open() -> boolean, callable by anyone: the stored answer, and
--      false when no row exists (closed until opened, fail closed).
--   3. set_downloads_open(on_in) -> boolean, callable by the signed-in, but
--      only the Governor (is_lesson_governor(), 0237: Darrell's own accounts)
--      gets past the first line; anyone else is refused with 42501.
--
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION, grants
-- re-applied. Seeds nothing: no row means closed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_switches (
  key        text        PRIMARY KEY,
  is_on      boolean     NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_switches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_switches FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.downloads_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((SELECT s.is_on FROM public.platform_switches s WHERE s.key = 'downloads'), false);
$$;
REVOKE ALL ON FUNCTION public.downloads_open() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.downloads_open() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_downloads_open(on_in boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_lesson_governor() THEN
    RAISE EXCEPTION 'set_downloads_open: only the Governor opens or closes downloads' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.platform_switches (key, is_on, updated_at, updated_by)
  VALUES ('downloads', coalesce(on_in, false), now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
    SET is_on = EXCLUDED.is_on, updated_at = now(), updated_by = EXCLUDED.updated_by;
  RETURN coalesce(on_in, false);
END;
$$;
REVOKE ALL ON FUNCTION public.set_downloads_open(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_downloads_open(boolean) TO authenticated;
