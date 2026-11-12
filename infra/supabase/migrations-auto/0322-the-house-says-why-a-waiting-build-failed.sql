-- =============================================================================
-- 0322 — the house says WHY a waiting build failed, as a class (DR-1360, after 0320)
-- =============================================================================
-- MEASURED 2026-11-12, on the lane 0320 exists for. The tailnet key was shut
-- again, 0320's public road answered as designed, and it said: 5 waiting,
-- `build-failed: 3`, oldest 1 h. That number cannot be acted on. Two of the
-- builder's failure classes HEAL THEMSELVES -- lesson_builder.eligibility()
-- reads `rate-limited` or `transient` back off the front of the build-reason
-- tag and retries -- and anything else is stuck and wants a person. For an hour
-- the only honest thing to say was "three failed, and I cannot tell you which
-- kind", while the sole remedy on offer was once more a value only Darrell can
-- mint. That is the exact shape of blindness 0320 was written to end, one
-- field short.
--
-- WHAT IS ADDED, AND WHAT IS STILL REFUSED. by_stall: the COUNT per failure
-- CLASS, over the build-failed rows only. Three key names, fixed here the way
-- 0320 fixed roads and shapes: rate-limited, transient, other. Never the
-- reason's TEXT -- lesson_builder.reason_tag() puts the class first precisely
-- so it survives the 200-character cut, and the remainder can quote a gate
-- error carrying a person's words, so the remainder is not read by the census
-- and never reaches this function. A class name is a tag shape, which is what
-- this lane is permitted to publish.
--
-- Everything 0320 established is unchanged and deliberately re-stated below
-- rather than patched around it: the same single census row (tag
-- lesson-queue-census AND source nas-loops), the same out-of-range counts
-- DROPPED and never clamped, the same fixed key lists, the same never-a-body.
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
  v_stalls  jsonb;
  v_excl    jsonb;
  -- The public lists, from infra/nas-loops/lesson-queue-census.py. A key that
  -- is not one of these is dropped: the census may only speak in the words the
  -- repository already publishes.
  k_roads   text[] := ARRAY['thinking-space','lesson-voice-transcribe','research-inbox','chat-split','other'];
  k_shapes  text[] := ARRAY['voice-failed','voice-transcript','voice-waiting-for-words','build-failed','newsletter-item','canary','plain'];
  -- The failure CLASSES, from lesson_builder.reason_tag()'s own prefixes
  -- (_RATE_LIMITED, _TRANSIENT) plus the catch-all the census assigns.
  k_stalls  text[] := ARRAY['rate-limited','transient','other'];
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

  -- Only the build-failed rows are counted here by the census, so this sums to
  -- by_shape's build-failed count and is {} when nothing has failed.
  SELECT COALESCE(jsonb_object_agg(k, v::int), '{}'::jsonb)
    INTO v_stalls
    FROM jsonb_each_text(CASE WHEN jsonb_typeof(b -> 'by_stall') = 'object'
                              THEN b -> 'by_stall' ELSE '{}'::jsonb END) AS t(k, v)
   WHERE k = ANY(k_stalls) AND v ~ '^[0-9]{1,6}$' AND v::numeric <= 100000;

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
    'by_stall', v_stalls,
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
