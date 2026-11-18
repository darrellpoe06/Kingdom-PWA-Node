-- =============================================================================
-- 0326 -- the house says WHICH teachings wait, not only how many (DR-1511)
-- =============================================================================
-- THE GAP THIS CLOSES. 0320 turned the NAS's own census outward so the lesson
-- lane could read its queue without a Tailscale key, and 0322 added why a
-- build had failed. Both speak only in AGGREGATES. Measured 2026-11-16/17:
-- across four firings the public road reported 5 rows waiting, 3 of them
-- build-failed, oldest 4 d 13 h -- and never which 5. A session that cannot
-- join the tailnet could therefore DESCRIBE the queue and not act on it: the
-- already-shipped sweep (DR-1250) takes row ids, so without them even the
-- safety check that must precede a build cannot run.
--
-- The census now writes a `waiting` list and this function publishes it.
--
-- NEVER A TAG, AND THE SQL IS WHAT ENFORCES IT. A tag can carry
-- `lesson-name:<a member's name>` (DR-0639) and this receipt is read over the
-- PUBLIC road, so each element is REBUILT key by key from a whitelist rather
-- than passed through: a uuid-shaped id, a timestamp, a known road, a known
-- shape, and `stall` only on a build-failed row. Anything else in the element
-- is DROPPED. The Python that writes the row already omits tags; this is the
-- second, independent refusal, so a census that one day carried one could not
-- publish it through here. Never a body -- neither side reads that column.
--
-- Built from 0322's live definition, not 0320's: 0322 replaced this function
-- to add `by_stall`, and replacing 0320's body would have silently deleted it.
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
  v_waiting jsonb;
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

  -- WHICH ROWS WAIT. Rebuilt key by key (see the header): the whitelist here is
  -- the enforcement, not a convenience. A row whose id is not uuid-shaped is
  -- dropped entirely rather than published half-known, and the cap keeps one
  -- corrupt row from turning the receipt into a payload.
  SELECT COALESCE(jsonb_agg(e ORDER BY e ->> 'created_at', e ->> 'id'), '[]'::jsonb)
    INTO v_waiting
    FROM (
      SELECT jsonb_strip_nulls(jsonb_build_object(
               'id',         CASE WHEN (w ->> 'id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN w ->> 'id' END,
               'created_at', CASE WHEN (w ->> 'created_at') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9:.+Z-]{5,30}$' THEN w ->> 'created_at' END,
               'source',     CASE WHEN (w ->> 'source') = ANY(k_roads)  THEN w ->> 'source' END,
               'shape',      CASE WHEN (w ->> 'shape')  = ANY(k_shapes) THEN w ->> 'shape'  END,
               'stall',      CASE WHEN (w ->> 'shape')  = 'build-failed'
                                   AND (w ->> 'stall')  = ANY(k_stalls) THEN w ->> 'stall' END
             )) AS e
        FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(b -> 'waiting') = 'array'
                    THEN b -> 'waiting' ELSE '[]'::jsonb END
             ) AS t(w)
       WHERE jsonb_typeof(w) = 'object'
       LIMIT 2000
    ) s
   WHERE e ? 'id';

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
    'waiting', v_waiting,
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
    RAISE EXCEPTION '0326: the lesson-queue receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
