-- =============================================================================
-- 0320 — the house says which teachings wait (DR-1360 / DR-0725, after 0318)
-- =============================================================================
-- MEASURED, and the reason this exists. inbox-lessons-waiting.yml is the FIRST
-- step of Darrell's hourly lesson intake: it answers "what is waiting?" by
-- joining the tailnet, ssh-ing into the NAS and running psql there. The
-- runner's Tailscale key expired on 2026-11-04, and again by 2026-11-10. Runs
-- #500-#505 all died at the same step -- six consecutive firings of the
-- PRIORITY lane that could not read a queue sitting on a machine that was up
-- the whole time. The remedy on offer was always the same: a value only
-- Darrell can mint, waited on while his teachings sat unread.
--
-- The house already answered the WRITE half. lesson-queue-census.py (registered
-- and enabled in infra/nas-loops/services.json) counts the waiting rows on the
-- NAS itself every services-sync cycle and patches ONE row into agent_inbox,
-- tagged lesson-queue-census, source nas-loops, from the NAS's own credential:
-- totals by road and by shape, the oldest wait, and the exclusion list it used.
-- That census has NEVER BEEN READ from outside the house (its registry entry
-- says so: "NOT YET PROVEN (P66)"), because the only road out was the same
-- expired key. A witness nobody can read is not yet a witness.
--
-- This is the read half, and it is not a new road: it is 0318's proven one,
-- pointed at the census instead of the heartbeat (DR-0621 -- work the process
-- until it works, never rebuild beside it). Anyone may ask over the public road
-- the app already uses (poetech.us/sb with the anon key the site ships), so the
-- lane reads the queue with no tailnet, no runner key and no GitHub between the
-- question and the answer -- which is DR-1360's direction exactly: a credential
-- that expires is never again the only road to a value the house holds.
--
-- WHAT IT GIVES OUT, AND WHAT IT WILL NOT. Timestamps, counts, and the road and
-- shape NAMES that are already public in this repository (infra/nas-loops/
-- lesson-queue-census.py: ROADS and shape_of). Never a body -- the census holds
-- none to begin with, and this function never reads the body column of any
-- lesson row. Never a row id, never a created_by, never a host name: strictly
-- less than inbox-lessons-waiting.yml already prints into a public repository's
-- run log, so this narrows the exposure it replaces rather than widening it.
-- by_road and by_shape keys are matched against those fixed public lists, the
-- way 0318 matched service names against the registry, so a key invented
-- anywhere upstream cannot ride out through this function.
--
-- Only rows the NAS writes count (tag lesson-queue-census AND source
-- nas-loops). A member can append to agent_inbox, but only rows they own; the
-- residual is the same one DR-1399 named for 0318 and is not pretended away.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.lesson_queue_receipt()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r         record;
  b         jsonb;
  v_at      timestamptz;
  v_oldest  timestamptz;
  v_roads   jsonb;
  v_shapes  jsonb;
  v_excl    jsonb;
  -- The public lists, from infra/nas-loops/lesson-queue-census.py. A key that
  -- is not one of these is dropped: the census may only speak in the words the
  -- repository already publishes.
  k_roads   text[] := ARRAY['thinking-space','lesson-voice-transcribe','research-inbox','chat-split','other'];
  k_shapes  text[] := ARRAY['voice-failed','voice-transcript','voice-waiting-for-words','build-failed','newsletter-item','canary','plain'];
BEGIN
  SELECT body, created_at INTO r
    FROM public.agent_inbox
   WHERE tags @> '["lesson-queue-census"]'::jsonb
     AND source = 'nas-loops'
   ORDER BY created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    -- No census row has ever been written: the queue is UNREAD, which is not an
    -- empty queue (DR-1186). The caller is told "seen false" and says so.
    RETURN jsonb_build_object('seen', false);
  END IF;

  BEGIN
    b := r.body::jsonb;
  EXCEPTION WHEN others THEN
    b := NULL;
  END;
  IF b IS NULL OR jsonb_typeof(b) <> 'object' THEN
    -- The row exists but says nothing parseable: its own timestamp is all that
    -- is honest, and no count is invented to sit beside it.
    RETURN jsonb_build_object('seen', true, 'at', r.created_at);
  END IF;

  BEGIN
    v_at := (b ->> 'at')::timestamptz;
  EXCEPTION WHEN others THEN
    v_at := NULL;
  END;

  BEGIN
    v_oldest := (b ->> 'oldest_waiting')::timestamptz;
  EXCEPTION WHEN others THEN
    v_oldest := NULL;
  END;

  -- A COUNT OUT OF RANGE IS DROPPED, NEVER CLAMPED (DR-1186, measured on this
  -- migration's own proof run). The first shape of this function clamped into
  -- [0, 100000], and a corrupt body carrying total -5 then read back as
  -- total 0 -- a manufactured "nothing is waiting" from a row that said
  -- nothing of the kind, which is the one lie this whole lane exists to
  -- prevent. An impossible number now goes missing instead, so the reader
  -- says UNKNOWN rather than zero.
  SELECT COALESCE(jsonb_object_agg(k, v::int), '{}'::jsonb)
    INTO v_roads
    FROM jsonb_each_text(CASE WHEN jsonb_typeof(b -> 'by_road') = 'object'
                              THEN b -> 'by_road' ELSE '{}'::jsonb END) AS t(k, v)
   WHERE k = ANY(k_roads) AND v ~ '^[0-9]{1,6}$' AND v::numeric <= 100000;

  SELECT COALESCE(jsonb_object_agg(k, v::int), '{}'::jsonb)
    INTO v_shapes
    FROM jsonb_each_text(CASE WHEN jsonb_typeof(b -> 'by_shape') = 'object'
                              THEN b -> 'by_shape' ELSE '{}'::jsonb END) AS t(k, v)
   WHERE k = ANY(k_shapes) AND v ~ '^[0-9]{1,6}$' AND v::numeric <= 100000;

  -- The definition travels WITH the count (the census writes it for exactly this
  -- reason), so a reader never has to assume which question was asked.
  SELECT COALESCE(jsonb_agg(x ORDER BY x), '[]'::jsonb) INTO v_excl
    FROM (SELECT x FROM jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(b -> 'excludes') = 'array' THEN b -> 'excludes' ELSE '[]'::jsonb END) AS t(x)
           WHERE x ~ '^[a-z0-9][a-z0-9-]{0,59}$' LIMIT 50) s;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'seen', true,
    'at', COALESCE(v_at, r.created_at),
    'total', CASE WHEN jsonb_typeof(b -> 'total') = 'number'
                   AND (b ->> 'total') ~ '^[0-9]{1,6}$'
                   AND (b ->> 'total')::numeric <= 100000
                  THEN (b ->> 'total')::int END,
    'oldest_waiting', v_oldest,
    'by_road', v_roads,
    'by_shape', v_shapes,
    'excludes', v_excl
  ));
END
$fn$;

REVOKE ALL ON FUNCTION public.lesson_queue_receipt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_queue_receipt() TO anon, authenticated;

-- Receipt for this migration itself: the function answers with its shape.
DO $chk$
DECLARE r jsonb;
BEGIN
  r := public.lesson_queue_receipt();
  IF r IS NULL OR NOT (r ? 'seen') THEN
    RAISE EXCEPTION '0320: the lesson-queue receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
