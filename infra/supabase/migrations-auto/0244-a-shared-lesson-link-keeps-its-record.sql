-- =============================================================================
-- 0244 — A shared lesson link keeps its record: who sent it, and whether it
-- opened the lesson (DR-0698)
-- =============================================================================
-- Darrell 2026-09-30: "also keep record of who does what send links etc... so
-- we know they work and don't etc..."
--
-- Before this, a lesson share left no trace anywhere: the app handed a link to
-- the device's share sheet and forgot it, and the person it reached opened it
-- with no account (DR-0290), so nothing on either side could say whether the
-- link worked. DR-0296 is what that costs: the shell routed shared links to the
-- wrong tab and every gate stayed green until Darrell opened one on his phone.
--
-- TWO TABLES.
--   lesson_shares       one row per share. The token is the key and rides on
--                       the link as `s=`. shared_by is auth.uid(), FORCED in
--                       the function below and never read from the payload
--                       (NULL for a signed-out reader who shared).
--   lesson_share_opens  one row per open of a shared link: the token, when,
--                       whether the lesson showed ('ok') or not ('failed'),
--                       and a short reason. NOTHING about the person who
--                       opened it: no IP, no account, no device, no agent.
--
-- WHO READS WHAT (RLS, and the functions honour the same rule):
--   * a signed-in sharer reads their own shares;
--   * the Governor (is_lesson_governor(), 0237) reads every share and every
--     open;
--   * nobody reads opens row by row except the Governor; a sharer sees only
--     the counts for their own shares, through lesson_share_ledger();
--   * anon reads nothing. anon and authenticated WRITE only through the two
--     SECURITY DEFINER functions, which validate shape and carry flood limits.
--
-- These rows are not tenant data: a lesson is public reading (DR-0290), and a
-- share names a course key and a lesson id, never a member, a client or a
-- household. There is no instance_id to scope, so the tenancy and grant guards
-- (which govern instance-scoped tables) do not apply; RLS is still on, and the
-- walls above are the policies below.
--
-- DEPENDS ON: auth.uid(), public.is_lesson_governor() (0237).
-- IDEMPOTENT: IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_shares (
  token         text PRIMARY KEY,
  shared_by     uuid,
  door          text NOT NULL DEFAULT 'church',
  kind          text NOT NULL DEFAULT 'lesson',
  course_key    text NOT NULL,
  lesson_id     text NOT NULL,
  lesson_title  text,
  method        text NOT NULL,
  url           text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_shares_token_chk  CHECK (token ~ '^[A-Za-z0-9_-]{8,32}$'),
  CONSTRAINT lesson_shares_door_chk   CHECK (door IN ('church', 'tlc')),
  CONSTRAINT lesson_shares_kind_chk   CHECK (kind IN ('lesson', 'section')),
  CONSTRAINT lesson_shares_method_chk CHECK (method IN ('native', 'copy')),
  CONSTRAINT lesson_shares_course_chk CHECK (length(course_key) BETWEEN 1 AND 128),
  CONSTRAINT lesson_shares_lesson_chk CHECK (length(lesson_id) BETWEEN 1 AND 128),
  CONSTRAINT lesson_shares_url_chk    CHECK (length(url) BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS lesson_shares_by_created_idx ON public.lesson_shares (shared_by, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_shares_created_idx    ON public.lesson_shares (created_at DESC);

CREATE TABLE IF NOT EXISTS public.lesson_share_opens (
  id         bigserial PRIMARY KEY,
  token      text NOT NULL REFERENCES public.lesson_shares(token) ON DELETE CASCADE,
  outcome    text NOT NULL,
  reason     text,
  opened_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_share_opens_outcome_chk CHECK (outcome IN ('ok', 'failed')),
  CONSTRAINT lesson_share_opens_reason_chk  CHECK (reason IS NULL OR length(reason) <= 120)
);

CREATE INDEX IF NOT EXISTS lesson_share_opens_token_idx  ON public.lesson_share_opens (token, opened_at DESC);
CREATE INDEX IF NOT EXISTS lesson_share_opens_opened_idx ON public.lesson_share_opens (opened_at DESC);

ALTER TABLE public.lesson_shares      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_share_opens ENABLE ROW LEVEL SECURITY;

-- The sharer reads their own shares; the Governor reads all. No write policy:
-- writes arrive only through lesson_share_record().
DROP POLICY IF EXISTS lesson_shares_read ON public.lesson_shares;
CREATE POLICY lesson_shares_read ON public.lesson_shares
  FOR SELECT TO authenticated
  USING (shared_by = auth.uid() OR public.is_lesson_governor());

-- Opens row by row: the Governor only. A sharer's counts come from the ledger.
DROP POLICY IF EXISTS lesson_share_opens_read ON public.lesson_share_opens;
CREATE POLICY lesson_share_opens_read ON public.lesson_share_opens
  FOR SELECT TO authenticated
  USING (public.is_lesson_governor());

REVOKE ALL ON public.lesson_shares      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.lesson_share_opens FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lesson_shares      TO authenticated;
GRANT SELECT ON public.lesson_share_opens TO authenticated;
REVOKE ALL ON SEQUENCE public.lesson_share_opens_id_seq FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Record a share. Callable signed out (a visitor may share what they read).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lesson_share_record(p_token text, p_payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_uid    uuid := auth.uid();
  v_token  text := btrim(coalesce(p_token, ''));
  v_door   text := lower(btrim(coalesce(p_payload ->> 'door', 'church')));
  v_kind   text := lower(btrim(coalesce(p_payload ->> 'kind', 'lesson')));
  v_course text := btrim(coalesce(p_payload ->> 'courseKey', ''));
  v_lesson text := btrim(coalesce(p_payload ->> 'lessonId', ''));
  v_title  text := btrim(coalesce(p_payload ->> 'lessonTitle', ''));
  v_method text := lower(btrim(coalesce(p_payload ->> 'method', '')));
  v_url    text := btrim(coalesce(p_payload ->> 'url', ''));
  v_recent integer;
BEGIN
  -- 1. Shape. The token is the one the link carries, and the link must carry it.
  IF v_token !~ '^[A-Za-z0-9_-]{8,32}$' THEN
    RAISE EXCEPTION 'lesson_share_record: malformed token' USING ERRCODE = '22023';
  END IF;
  IF v_door NOT IN ('church', 'tlc') OR v_kind NOT IN ('lesson', 'section') OR v_method NOT IN ('native', 'copy') THEN
    RAISE EXCEPTION 'lesson_share_record: unknown door, kind or method' USING ERRCODE = '22023';
  END IF;
  IF v_course = '' OR v_lesson = '' OR length(v_course) > 128 OR length(v_lesson) > 128 THEN
    RAISE EXCEPTION 'lesson_share_record: course and lesson are required' USING ERRCODE = '22023';
  END IF;
  IF length(v_url) > 1000 OR v_url !~ '^https?://' OR position(('s=' || v_token) IN v_url) = 0 THEN
    RAISE EXCEPTION 'lesson_share_record: the link must be http(s) and carry its token' USING ERRCODE = '22023';
  END IF;
  v_title := nullif(left(v_title, 300), '');

  -- 2. The flood brake. Generous for a person (60 shares in 10 minutes) and
  --    for every signed-out reader together (120 a minute); a script is not.
  IF v_uid IS NOT NULL THEN
    SELECT count(*) INTO v_recent FROM lesson_shares
     WHERE shared_by = v_uid AND created_at > now() - interval '10 minutes';
    IF v_recent >= 60 THEN
      RAISE EXCEPTION 'lesson_share_record: too many shares, try again shortly' USING ERRCODE = '54000';
    END IF;
  ELSE
    SELECT count(*) INTO v_recent FROM lesson_shares
     WHERE shared_by IS NULL AND created_at > now() - interval '1 minute';
    IF v_recent >= 120 THEN
      RAISE EXCEPTION 'lesson_share_record: too many shares, try again shortly' USING ERRCODE = '54000';
    END IF;
  END IF;

  -- 3. One row per token. A token already recorded is never overwritten, so
  --    nobody can re-point or re-own someone else's share.
  INSERT INTO lesson_shares (token, shared_by, door, kind, course_key, lesson_id, lesson_title, method, url)
  VALUES (v_token, v_uid, v_door, v_kind, v_course, v_lesson, v_title, v_method, v_url)
  ON CONFLICT (token) DO NOTHING;
  RETURN v_token;
END
$function$;
REVOKE ALL ON FUNCTION public.lesson_share_record(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_share_record(text, jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Record one open of a shared link. Callable signed out: the person opening a
-- texted link usually has no account. Records the event only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lesson_share_open(p_token text, p_outcome text, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_token   text := btrim(coalesce(p_token, ''));
  v_outcome text := lower(btrim(coalesce(p_outcome, '')));
  -- The reason is a short machine phrase ("lesson not found: l12"). Anything
  -- outside a plain character set is dropped, so this column cannot be used
  -- to smuggle free text (or a person's details) into the record.
  v_reason  text := nullif(left(btrim(regexp_replace(lower(coalesce(p_reason, '')), '[^a-z0-9 :._/-]', '', 'g')), 120), '');
  v_recent  integer;
BEGIN
  IF v_outcome NOT IN ('ok', 'failed') THEN
    RAISE EXCEPTION 'lesson_share_open: outcome must be ok or failed' USING ERRCODE = '22023';
  END IF;
  -- Only a token that was really shared is counted. Anything else is a quiet
  -- no, never an error a stranger's browser could learn from.
  IF v_token !~ '^[A-Za-z0-9_-]{8,32}$' OR NOT EXISTS (SELECT 1 FROM lesson_shares WHERE token = v_token) THEN
    RETURN false;
  END IF;
  -- Flood brakes: 30 opens of one link a minute, 600 of all links a minute.
  SELECT count(*) INTO v_recent FROM lesson_share_opens
   WHERE token = v_token AND opened_at > now() - interval '1 minute';
  IF v_recent >= 30 THEN RETURN false; END IF;
  SELECT count(*) INTO v_recent FROM lesson_share_opens
   WHERE opened_at > now() - interval '1 minute';
  IF v_recent >= 600 THEN RETURN false; END IF;

  INSERT INTO lesson_share_opens (token, outcome, reason)
  VALUES (v_token, v_outcome, CASE WHEN v_outcome = 'failed' THEN coalesce(v_reason, 'no reason given') ELSE NULL END);
  RETURN true;
END
$function$;
REVOKE ALL ON FUNCTION public.lesson_share_open(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_share_open(text, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- The ledger the app shows: shares with their open counts. Signed in only.
-- p_all asks for every share; it is honoured for the Governor alone.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lesson_share_ledger(p_all boolean DEFAULT false)
RETURNS TABLE (
  token text, shared_by uuid, sharer text, door text, kind text, course_key text,
  lesson_id text, lesson_title text, method text, url text, created_at timestamptz,
  opens integer, ok_opens integer, failed_opens integer,
  last_opened_at timestamptz, last_failure text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_gov boolean := public.is_lesson_governor();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'lesson_share_ledger: sign in to see shares' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT s.token, s.shared_by,
           CASE WHEN s.shared_by = v_uid THEN 'you'
                WHEN s.shared_by IS NULL THEN 'a signed-out reader'
                ELSE coalesce(nullif(u.email, ''), 'a member') END::text AS sharer,
           s.door, s.kind, s.course_key, s.lesson_id, s.lesson_title, s.method, s.url, s.created_at,
           coalesce(o.opens, 0)::integer, coalesce(o.ok_opens, 0)::integer, coalesce(o.failed_opens, 0)::integer,
           o.last_opened_at, o.last_failure
      FROM lesson_shares s
      LEFT JOIN auth.users u ON u.id = s.shared_by
      LEFT JOIN LATERAL (
        SELECT count(*) AS opens,
               count(*) FILTER (WHERE x.outcome = 'ok') AS ok_opens,
               count(*) FILTER (WHERE x.outcome = 'failed') AS failed_opens,
               max(x.opened_at) AS last_opened_at,
               (SELECT y.reason FROM lesson_share_opens y
                 WHERE y.token = s.token AND y.outcome = 'failed'
                 ORDER BY y.opened_at DESC LIMIT 1) AS last_failure
          FROM lesson_share_opens x
         WHERE x.token = s.token
      ) o ON true
     WHERE s.shared_by = v_uid OR (p_all AND v_gov)
     ORDER BY s.created_at DESC
     LIMIT 500;
END
$function$;
REVOKE ALL ON FUNCTION public.lesson_share_ledger(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_share_ledger(boolean) TO authenticated;
