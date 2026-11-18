-- =============================================================================
-- 0328 -- why a row still waits, and how many tries it has had (DR-1515)
-- =============================================================================
-- MEASURED, on the first read with 0327's builder block live (2026-11-17 06:08,
-- run 44028543563). The builder answered `service: active`, `building now: 0`,
-- its own record stamped 14 minutes earlier -- and THREE teachings had waited
-- five days. So the builder was neither dead nor stuck, and the queue still
-- could not say why those rows sat.
--
-- lesson_builder.eligibility() says why: past LESSON_BUILD_MAX_ATTEMPTS a row
-- returns "left for the hourly Routine". The handoff is working AS DESIGNED and
-- those rows are the Routine's. Nothing on the public road carried that, and
-- four more rows read `plain`, which means only "none of the special tags" --
-- so a row nobody had touched was indistinguishable from one the builder had
-- handed over and was waiting on. Those ask for different acts from a reader.
--
-- THE THRESHOLD IS NOT PUBLISHED AND NOT COPIED. MAX_ATTEMPTS belongs to the
-- builder and its environment can change it; two places computing one number is
-- how they drift, which is the lesson this repository already wrote about the
-- ledger's `Next ID`. So the ATTEMPT COUNT travels and the comparison is the
-- reader's.
--
-- CODES ONLY, AND THE SQL REFUSES INDEPENDENTLY OF THE PYTHON. A verdict is a
-- tag shape; a build reason's TEXT can quote the teaching it failed on, and
-- this function is granted to anon. So `why` must be one of the census's five
-- words or it is dropped, and `attempts` must be a small number.
--
-- Built from 0327's live definition -- the fourth replacement of this function,
-- and each time the rule holds: generate from the one in force, never from an
-- older body, or a field silently disappears.
-- =============================================================================
-- THE GAP THIS CLOSES. 0320 turned the NAS's census outward, 0322 added why a
-- build had failed, 0326 named the rows. Measured 2026-11-17: the public road
-- then said six teachings waited and THREE had failed on the NAS lesson
-- builder -- and the only road to that builder's own state was
-- `lesson-builder-status.sh --nas`, which is ssh behind a Tailscale key
-- refused since 2026-11-04. So a reader could see THAT builds failed and not
-- whether the thing that builds was even running. A failure count with no
-- service state is not actionable: 'failed 3' means one thing under a live
-- builder and another under a dead one.
--
-- The census already runs ON the box, so it reads four local paths with no key
-- and no ssh -- the unit's systemd word, .code.sha, the locks directory and
-- status.json -- and this function publishes them.
--
-- NO FREE TEXT, AND THE SQL IS WHAT ENFORCES IT. A builder's error string can
-- QUOTE the teaching it failed on, which is a person's own words, and this
-- function is granted to anon. So the object is REBUILT key by key: a word
-- from systemd's own vocabulary, a hex sha, small counts, and from status.json
-- only booleans, small numbers and an ISO-shaped stamp. Everything else is
-- dropped and COUNTED as withheld, so a short answer never reads as a complete
-- one. A lock file is counted and never named, because it is named for the row
-- it holds. Never a body -- neither side reads that column.
--
-- An unreadable source is null WITH `read:false`, never 0: an unreadable
-- builder is not an idle builder (DR-0076 section 8). When the census did not
-- gather the builder at all the key is absent, not faked.
--
-- Built from 0326's live definition, not 0322's or 0320's: each of those
-- replaced this function, and starting from an older body would silently
-- delete `waiting` the way starting from 0320 would have deleted `by_stall`.
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
  v_builder jsonb;
  -- The public lists, from infra/nas-loops/lesson-queue-census.py. A key that
  -- is not one of these is dropped: the census may only speak in the words the
  -- repository already publishes.
  k_roads   text[] := ARRAY['thinking-space','lesson-voice-transcribe','research-inbox','chat-split','other'];
  k_shapes  text[] := ARRAY['voice-failed','voice-transcript','voice-waiting-for-words','build-failed','newsletter-item','canary','plain'];
  -- The failure CLASSES, from lesson_builder.reason_tag()'s own prefixes
  -- (_RATE_LIMITED, _TRANSIENT) plus the catch-all the census assigns.
  k_stalls  text[] := ARRAY['rate-limited','transient','other'];
  -- systemd's own vocabulary, plus the census's 'unknown'. A word outside this
  -- set reads as 'unknown' and NEVER as stopped: an unreadable builder is not
  -- an idle one (DR-0076 section 8).
  k_service text[] := ARRAY['active','inactive','failed','activating','deactivating','reloading','unknown'];
  -- The only keys of the builder's status.json that may ever be published, and
  -- only when the value is a boolean, a small number, or (for `at`) an
  -- ISO-shaped stamp. Free text is refused by shape, because a builder's error
  -- string can quote the teaching it failed on -- a person's own words -- and
  -- this function is granted to anon.
  k_status  text[] := ARRAY['at','ok','attempts','built','failed','skipped','cycle_seconds'];
  -- WHY a row still waits (0328). The census's own closed set; a verdict
  -- outside it is dropped rather than relayed, the same refusal every other
  -- list here performs.
  k_whys    text[] := ARRAY['declined','deferred','rate-limited','failed','ready'];
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
                                   AND (w ->> 'stall')  = ANY(k_stalls) THEN w ->> 'stall' END,
               -- The VERDICT and the TRY COUNT (0328). `ready` means the builder
               -- should take it; `deferred`, and a `failed` whose tries have run
               -- out, mean it was handed to the hourly Routine on purpose. The
               -- THRESHOLD is deliberately absent: it belongs to the builder's
               -- own environment, so the count travels and the comparison is
               -- the reader's.
               'why',        CASE WHEN (w ->> 'why') = ANY(k_whys) THEN w ->> 'why' END,
               'attempts',   CASE WHEN jsonb_typeof(w -> 'attempts') = 'number'
                                   AND (w ->> 'attempts') ~ '^[0-9]{1,4}$'
                                  THEN (w ->> 'attempts')::int END
             )) AS e
        FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(b -> 'waiting') = 'array'
                    THEN b -> 'waiting' ELSE '[]'::jsonb END
             ) AS t(w)
       WHERE jsonb_typeof(w) = 'object'
       LIMIT 2000
    ) s
   WHERE e ? 'id';

  -- THE BUILDER'S OWN STATE (0327, DR-1514). Three of the six rows waiting on
  -- 2026-11-17 had failed ON the builder, and its state was reachable only over
  -- ssh behind a key refused since 2026-11-04 -- so a reader could see THAT
  -- builds failed and never whether the builder was running. The census reads
  -- it locally with no key; this publishes it.
  --
  -- REBUILT KEY BY KEY, never passed through. The Python already whitelists;
  -- this is a SECOND and independent refusal, for the same reason 0326 rebuilds
  -- each waiting row: the two sides must agree without trusting each other.
  WITH src AS (
    SELECT CASE WHEN jsonb_typeof(b -> 'builder') = 'object'
                THEN b -> 'builder' ELSE '{}'::jsonb END AS x
  ), st AS (
    SELECT x,
           CASE WHEN jsonb_typeof(x -> 'status') = 'object'
                THEN x -> 'status' ELSE '{}'::jsonb END AS s,
           CASE WHEN jsonb_typeof(x -> 'read') = 'object'
                THEN x -> 'read' ELSE '{}'::jsonb END AS rd
      FROM src
  )
  SELECT CASE WHEN x = '{}'::jsonb THEN NULL ELSE jsonb_build_object(
           'service', CASE WHEN (x ->> 'service') = ANY(k_service)
                           THEN x ->> 'service' ELSE 'unknown' END,
           'code_sha', CASE WHEN (x ->> 'code_sha') ~ '^[0-9a-f]{7,40}$'
                            THEN x ->> 'code_sha' END,
           'building', CASE WHEN jsonb_typeof(x -> 'building') = 'number'
                             AND (x ->> 'building') ~ '^[0-9]{1,5}$'
                            THEN (x ->> 'building')::int END,
           'status_withheld', CASE WHEN jsonb_typeof(x -> 'status_withheld') = 'number'
                                    AND (x ->> 'status_withheld') ~ '^[0-9]{1,5}$'
                                   THEN (x ->> 'status_withheld')::int END,
           -- Which sources the census could READ, so a missing number reads as
           -- unread rather than as zero.
           'read', (SELECT jsonb_object_agg(k, (rd -> k) = 'true'::jsonb)
                      FROM unnest(ARRAY['code_sha','building','status']) AS u(k)
                     WHERE rd ? k AND jsonb_typeof(rd -> k) = 'boolean'),
           'status', (SELECT jsonb_object_agg(k, s -> k)
                        FROM unnest(k_status) AS u(k)
                       WHERE s ? k
                         AND (jsonb_typeof(s -> k) = 'boolean'
                           OR (jsonb_typeof(s -> k) = 'number'
                               AND (s ->> k) ~ '^-?[0-9]{1,6}$')
                           OR (k = 'at' AND jsonb_typeof(s -> k) = 'string'
                               AND (s ->> k) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}')))
         ) END
    INTO v_builder
    FROM st;

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
    'builder', v_builder,
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
    RAISE EXCEPTION '0328: the lesson-queue receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
