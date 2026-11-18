-- =============================================================================
-- 0336 -- which problem, not only which gate (DR-1551)
-- =============================================================================
-- 0335's FIRST LIVE ANSWER, 2026-11-18 14:11Z, run 44320331578, and it ended
-- six days of `other: 6` in one read: `quotation` refused four of the seven
-- waiting teachings, `verse` three, `voice` one, and three rows had crashed
-- with RuntimeError. The field worked exactly as written.
--
-- AND IT STILL DID NOT DECIDE THE FIX. quotation_gate (lesson_gates.py:245)
-- refuses FIVE different things, and they call for opposite work: a draft that
-- double-quotes a phrase of the teacher's wants the writer's PROMPT changed; a
-- draft that mis-quotes a verse wants another attempt; and a gate refusing
-- something a lesson ought to be allowed to do is Darrell's call on how a
-- lesson is written, not the agent's. One word tells those apart. The gate's
-- name cannot.
--
-- WHY THE PROSE MAY BE MATCHED WHEN IT MAY NOT BE PUBLISHED. The verse gate
-- already answers in a fixed vocabulary (`unresolvable`, `shouted`,
-- `not-the-verse`). The other gates answer in authored prose with the detail
-- interpolated INTO it -- and lesson_gates.py:279 and :282 interpolate a NAME.
-- So the census matches the builder's own phrasing and publishes ITS OWN kind
-- word, and this array refuses again. Proven with a problem string carrying
-- the adversary's name: the kind rides, the name does not.
--
-- Built from 0335's live definition, derived from disk, body verbatim from
-- `CREATE OR REPLACE` onward: the twelfth replacement of this function.
-- =============================================================================
-- 0335 -- the box names the cause itself, with no hand (DR-1542)
-- =============================================================================
-- 0334 named which SITE refused a build and, across six consecutive reads from
-- 05:12 to 13:10 on 2026-11-18, answered `other: 6` -- six teachings, the
-- oldest waiting 6 d 0 h, and the reader's own line saying the builder's log on
-- the box is the next read. DR-1537 built that read for road 2 and left it
-- waiting on Darrell's ssh.
--
-- HIS OWN WORDS, 2026-11-18 ~12:28Z, relayed from another session, on every
-- item parked on his hand: "Fix it!!!!!! So we don't need anything!!!!!!! For
-- all of these.... obviously!!!!!" A step that waits on a hand is the defect.
-- So the box writes the answer on the receipt it already publishes, and the
-- fifth instrument is built on purpose this time rather than instead of asking
-- (DR-1526's order is kept: the direct read exists, it is DR-1537).
--
-- TWO FIELDS, BOTH VOCABULARY, NEITHER PROSE.
--   * `gates` -- the NAMES of the gates that did not pass, read by the census
--     from the builder's own stored records (versions/<build_id>.json). Those
--     records also hold the drafted lesson and the prompt that quotes the
--     teaching; neither is opened, and a gate's faults quote both the draft and
--     the verse, so only the name travels.
--   * `exception` -- the class name of an unhandled crash, which is what
--     lesson_builder.py:1029 writes and the one site 0334 could not name. The
--     census matches the token before the first colon against the INTERPRETER's
--     own BaseException subclasses; this function matches it again against
--     k_excs. A member's name is not an exception class, so it passes neither.
--
-- ABSENT IS UNREAD, NEVER "NO CAUSE" (DR-0076 section 8). The census omits both
-- when it could not read the records, so a row with no `gates` means nobody
-- looked -- not that every gate passed.
--
-- Built from 0334's live definition, derived from disk, body verbatim from
-- `CREATE OR REPLACE` onward: the eleventh replacement of this function.
-- =============================================================================
-- 0334 -- which failure site refused the build (DR-1534)
-- =============================================================================
-- MEASURED 2026-11-18, run 44242079320, the eighth consecutive read of this
-- road with the tailnet shut: `Failed because -- other: 6, transient: 1`, the
-- oldest of the six waiting 5 d 16 h. 0322 added this field precisely so a
-- failure count could be acted on, and for six of seven rows the answer it
-- gives is `other` -- which says only "not one of the two classes that retry
-- themselves". A reader learns that a person is wanted and not what for.
--
-- WHAT THE FOUR JOBS ACTUALLY ARE, and why one word is worth a migration: a
-- writer that answered nothing (`no-writer`) is a login or a setup on the box;
-- a draft the gates refuse (`gates`) is a teaching to re-write; a red test
-- (`tests`) is code; a missing push token (`no-push-token`) is a credential.
-- Those are different people's hands on different days. `other: 6` sends
-- nobody anywhere, which is the DR-0076 section 8 failure in its quietest
-- form -- not a count read as zero, but a cause read as unknowable.
--
-- WHY A PREFIX MATCH MAY RIDE WHERE A SHAPE MAY NOT. The census matches the
-- reason's opening against lesson_builder's OWN authored literals, at every
-- site that composes a BuildFailed, and publishes ITS OWN class word -- so the
-- row's string never travels even when it matches, and the tail, which can
-- quote a gate error carrying a person's words, is not read at all. This array
-- is the second and independent refusal, in the same spirit as 0332's k_states:
-- `no words from mary smith` satisfies any shape and is byte-identical to none
-- of these ten constants.
--
-- ITS LIMIT, PUBLISHED RATHER THAN DISCOVERED: lesson_builder.py:1029 tags an
-- unexpected crash `<ExceptionType>: <message>`, whose opening is a class name
-- and not a fixed literal, so such a row still reads `other`. Narrower than
-- the builder, never wider -- and naming it wants a class word at the source,
-- which reaches only failures built after it ships.
--
-- Built from 0333's live definition, derived from disk rather than retyped --
-- the newest file that replaces this function, its body copied verbatim from
-- `CREATE OR REPLACE` onward. The tenth replacement, and the ONLY lines this
-- one changes are k_stalls and its own check label, so no field can go quietly
-- missing the way a hand-copied body once nearly dropped 0330's `code_sha`.
-- =============================================================================
-- 0333 -- which writer is missing (DR-1524)
-- =============================================================================
-- 0332's FIRST LIVE ANSWER, 2026-11-17T23:25:22Z: `state: waiting on a writer`.
-- That settled the question five records had been circling -- the seven waiting
-- teachings are real, eligible and his own, and the builder had never looked at
-- one of them. It refuses at readiness() and returns before db.pending().
--
-- WHAT IT STILL COULD NOT SAY. `state` is one word for three writers. It cannot
-- tell NO WRITER IS CONFIGURED (nothing was ever set up on the box) from ONE IS
-- CONFIGURED AND FAILING (a `claude` sign-in that lapsed) -- and those are
-- different jobs for a person: the first is a setup, the second is one login.
-- readiness() already knows per writer; only the receipt could not say it.
--
-- WHY THE ENTRY IS REBUILT AND NEVER FILTERED. readiness()'s entry is
-- {writer, kind, family, primary, ok, why, configured}. Two of those must never
-- ride: `why` is the probe's own words -- measured live, it reads
-- "claude at /usr/local/bin/claude but NOT signed in: run `claude` once" --
-- and `writer` is a NAME out of lesson-writers.json, which a person may have
-- set to anything at all. A filter keeps whatever it did not think to remove,
-- so three fields are COPIED OUT into a new object instead: `kind` by identity
-- against k_kinds below, `ok` and `configured` only as real booleans. Proven by
-- a case that plants a member's name in `writer` and a filesystem path in `why`
-- and asserts neither appears anywhere in the receipt.
--
-- Built from 0332's live definition, derived from disk: the ninth replacement
-- of this function.
-- =============================================================================
-- 0332 -- the builder says why it is not ready (DR-1522)
-- =============================================================================
-- THE LAYER EVERY EARLIER FIELD IN THIS SERIES MISSED. 0327 through 0331 each
-- asked a better question ABOUT THE ROWS -- which wait, why, whose they are,
-- whether they have words -- and by 22:11 on 2026-11-17 the answer was that
-- four of them are genuinely eligible and the builder is `active` with
-- `building now: 0`. The rows were never the problem.
--
-- MEASURED, and the measurement is what makes this field necessary rather than
-- merely nice: the builder's own heartbeat ADVANCED hourly (20:51:29Z ->
-- 21:51:31Z, two consecutive reads) while three rows' attempt counts stayed
-- FROZEN at 1, 1 and 2 since 2026-11-12. A process that runs every hour and
-- never records an attempt fits two causes with OPPOSITE fixes:
--
--   (a) readiness() refuses, so consider() returns at lesson_builder.py:2545
--       -- `if kind not in ("sweep", "row") or not ready: return started` --
--       BEFORE db.pending() is ever called. No row is read, no attempt is
--       recorded, and write_status() still runs, so the heartbeat advances.
--       The fix is a writer or a push credential on the box.
--
--   (b) readiness passes and eligibility() refuses on its one unmirrorable
--       branch, a whitespace-only body (0331's published limit). The fix is
--       that those teachings have no usable words.
--
-- The receipt could not tell them apart, and `state` is the field that does.
-- It was one of the four status.json fields this road was withholding.
--
-- WHY IT MAY RIDE AT ALL, when DR-1514's shape test is right to refuse free
-- text. An attempt the night before tried to publish the withheld KEY NAMES
-- against a shape, and DR-1514's own gate refused it -- correctly, because
-- `error_from_mary_smith` satisfies any such shape, and that is exactly how a
-- member's name would reach a public endpoint. This field is accepted by
-- IDENTITY against a four-value allowlist instead. A hostile value is not
-- byte-identical to one of four constants, so it cannot pass; what the Python
-- publishes is its OWN constant, and the check below is the independent second
-- refusal, in the same spirit as 0326 rebuilding each waiting row.
--
-- Built from 0331's live definition, derived from disk: the eighth replacement
-- of this function.
-- =============================================================================
-- 0331 -- a row with no words says so (DR-1519)
-- =============================================================================
-- eligibility()'s LAST unmirrored branch. DR-1516 left it out on the grounds
-- that testing "has this row any words?" would mean reading the body this
-- receipt must never read. That was wrong: PostgREST answers it as a FILTER
-- returning only IDS, which already ride this road. The design first on the
-- table was a generated `body_length` column -- a schema change on the table
-- holding people's teachings -- for an answer a `where` gives for free.
--
-- WHY IT MATTERS. The research road can write a row before its words arrive.
-- Such a row read `ready` while the builder refused it, which is how an idle
-- builder came to look like a neglectful one on 2026-11-17.
--
-- NO WORDS CROSS THE WIRE, not even to be counted: the census never projects
-- `body`, here or anywhere. `body` appears in one PREDICATE and in no select,
-- pinned by its own case.
--
-- ITS LIMIT, PUBLISHED RATHER THAN DISCOVERED: eligibility() also refuses a
-- body that is only whitespace, which no PostgREST filter can express, so such
-- a row still reads `ready`. Narrower than the builder, never wider.
--
-- GENERATED FROM THE DEFINITION IN FORCE, DERIVED FROM DISK. The first attempt
-- at this file was generated from 0329 by hand and would have silently deleted
-- 0330's top-level `code_sha` -- the exact failure every header in this series
-- warns about, made while writing the warning. The generator now picks the
-- newest migration that replaces the function instead of being told which.
-- =============================================================================
-- MEASURED 2026-11-17 09:11, run 44052311035. 0329 had just taught the census
-- to tell a MEMBER's row from Darrell's own, and the next read came back with
-- four rows reading `ready`. That is consistent with TWO different worlds: the
-- new code running and those four being his, OR the old code still on the box
-- and the owner check not yet in play. Nothing in the payload could tell them
-- apart, so the answer could not be acted on either way -- which is the
-- DR-0076 section 8 failure, arrived at from the opposite direction: not a
-- count read as zero, but a VERDICT read without knowing what produced it.
--
-- The census reaches the NAS by the services-sync pull, so its code version is
-- the mirror's HEAD -- the same value replay-on-clock already reads, for the
-- same reason. It is now published beside the builder's own code sha, at a
-- different depth so the two are never confused.
--
-- Absent, never faked, when it could not be read: a census that cannot name
-- its code says so, and `git` answering prose instead of a sha reads as unknown.
--
-- Built from 0329's live definition: the sixth replacement of this function.
-- =============================================================================
-- CORRECTED, from 0328's own first live answer (2026-11-17 08:14, run
-- 44044623417). Four rows read `ready` while the builder was `active` and
-- `building now: 0` -- which reads as the builder neglecting them. It was a
-- missing branch, not a neglectful builder: lesson_builder.eligibility()
-- refuses a row whose created_by is not one of Darrell's two accounts unless it
-- carries `lesson-approved`, because a MEMBER's teaching is the Governor's to
-- release (DR-0635). So `ready` was overclaiming on the one case where it
-- matters most -- somebody else's words.
--
-- The census compares the account ids LOCALLY and publishes one word. No
-- created_by, and no id of any person, rides this road.
--
-- `ready` now means: nothing in the tags or the owner check blocks it. One
-- branch of eligibility() stays deliberately unmirrored -- it refuses a row
-- with no words, and testing that would mean reading the body this receipt
-- must never read. That limit is stated in the census rather than hidden.
--
-- Built from 0328's live definition: the fifth replacement of this function.
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
  -- The failure CLASSES. The first two are lesson_builder.reason_tag()'s own
  -- prefixes (_RATE_LIMITED, _TRANSIENT) and HEAL THEMSELVES -- eligibility()
  -- reads them back off the front of the tag and waits the row out. The next
  -- seven name WHICH SITE of the builder refused it, from
  -- lesson-queue-census.py's FAILURE_SITES; 'other' is the catch-all the
  -- census assigns when a reason matches no site it knows. Identity against
  -- this array, never a shape: a shape would admit a sentence.
  k_stalls  text[] := ARRAY['rate-limited','transient',
                            'no-writer','gates','tests','no-push-token',
                            'catalog','budget','crashed','other'];
  -- systemd's own vocabulary, plus the census's 'unknown'. A word outside this
  -- set reads as 'unknown' and NEVER as stopped: an unreadable builder is not
  -- an idle one (DR-0076 section 8).
  k_service text[] := ARRAY['active','inactive','failed','activating','deactivating','reloading','unknown'];
  -- The only keys of the builder's status.json that may ever be published, and
  -- only when the value is a boolean, a small number, or (for `at`) an
  -- ISO-shaped stamp. Free text is refused by shape, because a builder's error
  -- string can quote the teaching it failed on -- a person's own words -- and
  -- this function is granted to anon.
  k_status  text[] := ARRAY['at','ok','attempts','built','failed','skipped','cycle_seconds','state'];
  -- `state` rides by an ALLOWLIST, not a shape, and that is the whole reason
  -- it may ride at all (DR-1522). A shape such as ^[a-z ]+$ is SATISFIED by
  -- 'waiting on a writer for Mary Smith'; an identity match is not. These are
  -- every value readiness() and consider() can produce.
  k_states  text[] := ARRAY['ready','waiting on a writer','waiting on a push credential','stopped'];
  -- WHICH writer, same discipline (DR-1524). readiness()'s entry also carries
  -- `why` (a probe's own words) and `writer` (a NAME out of lesson-writers.json),
  -- so the entry is REBUILT from three fields and never filtered: a filter keeps
  -- whatever it did not think to remove.
  k_kinds   text[] := ARRAY['api','base','cli-local','cli-ssh','codex-cli','command','gemini-api','gemini-cli','ollama','openai','openai-api'];
  -- WHY a row still waits (0328). The census's own closed set; a verdict
  -- outside it is dropped rather than relayed, the same refusal every other
  -- list here performs.
  k_whys    text[] := ARRAY['declined','waits-for-governor','no-words','deferred','rate-limited','failed','ready'];
  -- WHICH GATE refused, from lesson-queue-census.py's GATE_NAMES. A gate's name
  -- is a fixed word; its faults quote the draft and the verse and never ride.
  k_gates   text[] := ARRAY['band','bands','curriculum','depth','placement','quotation',
                             'scripture','shape','structure','title','verse','voice'];
  -- WHICH PROBLEM, not only which gate (0336). `quotation` refused four of the
  -- seven waiting teachings and naming the gate still did not decide the fix:
  -- that gate refuses five different things and they call for opposite work.
  -- The verse gate answers in its own fixed vocabulary; for the others the
  -- census matches the builder's authored prose and publishes ITS OWN kind
  -- word, because lesson_gates.py:279 and :282 interpolate a NAME into two of
  -- those strings. So a name cannot ride even when it is the adversary's.
  k_faults  text[] := ARRAY['capitalises-the-adversary','curly-quotes','ellipsis',
                             'generic-God-not-Yahweh','lowercases-His-Name','not-the-verse',
                             'percentage','record-id','shouted',
                             'span-without-reference','unresolvable'];
  -- WHICH EXCEPTION crashed it, for lesson_builder.py:1029's `<Type>: <message>`
  -- -- the one site 0334 publishes as `other`. The census matches the token
  -- against the INTERPRETER's own BaseException subclasses plus a short stdlib
  -- list; this array is the independent second refusal. `Mary` is not an
  -- exception class and is in neither.
  k_excs    text[] := ARRAY['ArithmeticError','AssertionError','AttributeError','BadStatusLine',
                             'BaseException','BaseExceptionGroup','BlockingIOError','BrokenPipeError',
                             'BufferError','BytesWarning','CalledProcessError','ChildProcessError',
                             'ConnectionAbortedError','ConnectionError','ConnectionRefusedError','ConnectionResetError',
                             'DeprecationWarning','EOFError','EncodingWarning','EnvironmentError',
                             'Exception','ExceptionGroup','FileExistsError','FileNotFoundError',
                             'FloatingPointError','FutureWarning','GeneratorExit','HTTPError',
                             'IOError','ImportError','ImportWarning','IncompleteRead',
                             'IndentationError','IndexError','InterruptedError','IsADirectoryError',
                             'JSONDecodeError','KeyError','KeyboardInterrupt','LookupError',
                             'MemoryError','ModuleNotFoundError','NameError','NotADirectoryError',
                             'NotImplementedError','OSError','OverflowError','PendingDeprecationWarning',
                             'PermissionError','ProcessLookupError','RecursionError','ReferenceError',
                             'RemoteDisconnected','ResourceWarning','RuntimeError','RuntimeWarning',
                             'SSLCertVerificationError','SSLError','StopAsyncIteration','StopIteration',
                             'SyntaxError','SyntaxWarning','SystemError','SystemExit',
                             'TabError','TimeoutError','TimeoutExpired','TypeError',
                             'URLError','UnboundLocalError','UnicodeDecodeError','UnicodeEncodeError',
                             'UnicodeError','UnicodeTranslateError','UnicodeWarning','UserWarning',
                             'ValueError','Warning','ZeroDivisionError'];
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
               -- THE CAUSE ITSELF (0335). `stall` says which SITE refused and
               -- read `other` for six rows for six days; these two say WHAT
               -- refused, and the box writes them with no key and no hand.
               -- Both are vocabulary and neither is prose: a gate's NAME out of
               -- k_gates, and an exception CLASS NAME out of k_excs, each
               -- returned as THIS ARRAY'S OWN element via array_position so the
               -- row's own bytes never ride. A fault's text is not read on
               -- either side -- it quotes the draft and the verse.
               --
               -- ABSENT IS UNREAD, NEVER "NO CAUSE" (DR-0076 section 8): the
               -- census omits these when it could not read the builder's
               -- records, so a missing key means nobody looked, and the reader
               -- says so rather than reporting a clean build.
               'gates',      (SELECT CASE WHEN count(*) = 0 THEN NULL
                                          ELSE jsonb_agg(g ORDER BY g) END
                                FROM (SELECT k_gates[array_position(k_gates, x)] AS g
                                        FROM jsonb_array_elements_text(
                                               CASE WHEN jsonb_typeof(w -> 'gates') = 'array'
                                                    THEN w -> 'gates' ELSE '[]'::jsonb END) AS t(x)
                                       WHERE x = ANY(k_gates)
                                       LIMIT 20) q),
               'exception',  CASE WHEN (w ->> 'exception') = ANY(k_excs)
                                  THEN k_excs[array_position(k_excs, w ->> 'exception')] END,
               -- The KINDS behind those gates (0336), each returned as this
               -- array's own element. Capped, ordered, and absent when the
               -- census read no record -- never an empty list standing in for
               -- "nothing wrong" (DR-0076 section 8).
               'kinds',      (SELECT CASE WHEN count(*) = 0 THEN NULL
                                          ELSE jsonb_agg(f ORDER BY f) END
                                FROM (SELECT k_faults[array_position(k_faults, x)] AS f
                                        FROM jsonb_array_elements_text(
                                               CASE WHEN jsonb_typeof(w -> 'kinds') = 'array'
                                                    THEN w -> 'kinds' ELSE '[]'::jsonb END) AS t(x)
                                       WHERE x = ANY(k_faults)
                                       LIMIT 20) q),
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
           -- The scalar fields, then the writers array rebuilt separately. The
           -- generic agg below CANNOT carry `writers`: its type tests admit
           -- only boolean, number and two named strings, and an array is none
           -- of those -- so the array has exactly one way through, the rebuild.
           --
           -- HOISTED ON PURPOSE, and the asymmetry is stated rather than left
           -- to be discovered: the census writes this inside `status` (it comes
           -- from status.json like every other field there), and the receipt
           -- publishes it one level UP, beside `service` and `building`, where a
           -- list of writers belongs next to the other facts about the builder
           -- rather than among its scalar counters. Both depths are pinned by
           -- tests, so neither can drift quietly. Same reasoning as 0330's
           -- `code_sha`, which sits at a different depth from the builder's.
           'writers', (SELECT CASE WHEN count(*) = 0 THEN NULL ELSE jsonb_agg(e) END
                         FROM (SELECT jsonb_strip_nulls(jsonb_build_object(
                                 'kind', k_kinds[array_position(k_kinds, w ->> 'kind')],
                                 'ok', CASE WHEN jsonb_typeof(w -> 'ok') = 'boolean'
                                            THEN w -> 'ok' END,
                                 'configured', CASE WHEN jsonb_typeof(w -> 'configured') = 'boolean'
                                                    THEN w -> 'configured' END)) AS e
                                 FROM jsonb_array_elements(
                                        CASE WHEN jsonb_typeof(s -> 'writers') = 'array'
                                             THEN s -> 'writers' ELSE '[]'::jsonb END) AS w
                                WHERE jsonb_typeof(w) = 'object'
                                  AND (w ->> 'kind') = ANY(k_kinds)) AS q),
           'status', (SELECT jsonb_object_agg(k, s -> k)
                        FROM unnest(k_status) AS u(k)
                       WHERE s ? k
                         AND (jsonb_typeof(s -> k) = 'boolean'
                           OR (jsonb_typeof(s -> k) = 'number'
                               AND (s ->> k) ~ '^-?[0-9]{1,6}$')
                           OR (k = 'at' AND jsonb_typeof(s -> k) = 'string'
                               AND (s ->> k) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}')
                           OR (k = 'state' AND jsonb_typeof(s -> k) = 'string'
                               AND (s ->> k) = ANY(k_states))))
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
    -- WHICH CODE WROTE THIS CENSUS (0330). A verdict cannot be read without it:
    -- `ready` means one thing before DR-1516's owner check and another after,
    -- and nothing else in the payload distinguishes them. A sha is STRUCTURE
    -- and cannot carry a sentence, so the shape test is the whole guard.
    'code_sha', CASE WHEN (b ->> 'code_sha') ~ '^[0-9a-f]{7,40}$'
                     THEN b ->> 'code_sha' END,
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
    RAISE EXCEPTION '0336: the lesson-queue receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
