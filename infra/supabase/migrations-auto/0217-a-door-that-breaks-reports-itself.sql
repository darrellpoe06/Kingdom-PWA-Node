-- =============================================================================
-- 0217 — A door that breaks reports itself
-- =============================================================================
-- THE HALF OF DR-0374 THAT 0216 DID NOT CLOSE. 0216 gave a customer a way to
-- say "this is broken." It did nothing about the fact that NOTHING TELLS
-- ANYONE on its own. Sterling Moore's order was refused on every attempt for
-- the whole life of the Moore Divahs door, and the client's entire response was
--
--     console.warn('[crm-sync] capture failed:', error)   (crm-sync.js:140)
--
-- a line printed on the customer's own phone, seen by nobody, kept by nothing.
-- The office learned of it only because Sterling told Shay and Shay told
-- Darrell. 0216 replaced that favour with a form -- but a form still waits on a
-- customer choosing to speak up, and most people who hit a dead form just
-- leave. A system that can only find out when someone is kind is not
-- instrumented; it is lucky.
--
-- SO THE DOOR FILES ITS OWN REPORT. When a forced-safe RPC the door depends on
-- refuses, the client files a SYSTEM-sourced row into the same book the office
-- already reads. No new screen to check, no second inbox: the steward opens
-- "Door reports" and sees "the order form is refusing" whether or not anybody
-- typed it.
--
-- DEDUPED, BECAUSE A BROKEN DOOR IS BROKEN FOR EVERYONE. A fault that fires for
-- a hundred visitors must not become a hundred rows -- that buries the customer
-- voice 0216 exists to carry, and it is worse signal besides. An identical open
-- fault inside the window has its `occurrences` incremented and `last_seen_at`
-- moved instead. The COUNT IS THE ALERT: "this failed 47 times since 9am" is a
-- far stronger statement than one row saying it failed.
--
-- A SEPARATE FUNCTION, NOT A FLAG ON door_feedback_submit. The customer path
-- was verified on both databases hours ago (md5 63cf8950..., DR-0376) and it is
-- not being touched, re-tested or put at risk to add a second behaviour. One
-- function, one job.
--
-- WHAT THIS DELIBERATELY IS NOT: it is not timer-driven, it spawns nothing, and
-- it wakes no compute. It writes a row when a real user action really failed,
-- and the office PULLS it when they open the board. So the three-brakes rule
-- (CLAUDE.md, DR-0247/DR-0248) does not attach -- there is no loop here to
-- budget, lock or stop. A push notification WOULD be that class, and is
-- deliberately left to its own decision rather than smuggled in here.
--
-- SPOOFING, STATED PLAINLY. The seam is anon-callable, so anyone who can reach
-- the door can file a row claiming to be a system fault. That is the same
-- exposure 0216 already accepted for customer reports, bounded by the same
-- per-minute flood brake, and the office reads the raw text either way. The
-- alternative -- trusting only server-observed faults -- cannot see a failure
-- that happens in the customer's browser, which is exactly where Sterling's
-- happened. Visible and spoofable beats invisible.
--
-- DEPENDS ON: 0216 (door_feedback, door_feedback_submit).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE.
-- =============================================================================

ALTER TABLE public.door_feedback
  ADD COLUMN IF NOT EXISTS source       text        NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS occurrences  integer     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'door_feedback_source_chk') THEN
    ALTER TABLE public.door_feedback
      ADD CONSTRAINT door_feedback_source_chk CHECK (source IN ('customer','system'));
  END IF;
END $$;

-- The office's first question is "what is broken NOW", so the index matches the
-- board's own order rather than the insert order.
CREATE INDEX IF NOT EXISTS door_feedback_open_faults_idx
  ON public.door_feedback (instance_id, source, status, last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- The door reporting itself.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_fault_report(
  p_door_slug     text,
  p_instance_slug text,
  p_payload       jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_instance uuid;
  v_door     text := btrim(coalesce(p_door_slug, ''));
  v_area     text := btrim(coalesce(p_payload ->> 'area', ''));
  v_body     text := btrim(coalesce(p_payload ->> 'body', ''));
  v_version  text := btrim(coalesce(p_payload ->> 'appVersion', ''));
  v_recent   integer;
  v_id       uuid;
BEGIN
  -- 1. Tenant pinned by a real row, exactly as 0216. No allowlist of doors or
  --    areas here either -- 0215 is what a hand-maintained second registry
  --    costs, and that lesson does not stop applying to the second function.
  SELECT id INTO v_instance FROM instances WHERE slug = p_instance_slug;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'door_fault_report: unknown instance slug %', p_instance_slug;
  END IF;
  IF v_door = '' THEN RAISE EXCEPTION 'door_fault_report: door slug is required'; END IF;
  IF v_body = '' THEN RAISE EXCEPTION 'door_fault_report: empty fault'; END IF;

  v_door    := left(v_door, 64);
  v_area    := left(coalesce(nullif(v_area, ''), 'other'), 64);
  v_body    := left(v_body, 4000);
  v_version := nullif(left(v_version, 64), '');

  -- 2. The same flood brake 0216 carries. A fault storm is precisely when this
  --    path is hottest, so the cap matters more here, not less.
  SELECT count(*) INTO v_recent
    FROM door_feedback
   WHERE instance_id = v_instance
     AND created_at >= now() - interval '1 minute';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'door_fault_report: too many reports for this door right now';
  END IF;

  -- 3. Fold into an OPEN identical fault rather than adding a row. Closed and
  --    answered rows are never reopened by a fold: if the office marked it
  --    handled and it breaks again, that is genuinely new and deserves its own
  --    row rather than a silent bump on something already dealt with.
  UPDATE door_feedback
     SET occurrences  = occurrences + 1,
         last_seen_at = now(),
         app_version  = coalesce(v_version, app_version)
   WHERE instance_id = v_instance
     AND source      = 'system'
     AND door_slug   = v_door
     AND area        = v_area
     AND body        = v_body
     AND status      IN ('new','reading')
     AND last_seen_at >= now() - interval '24 hours'
   RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- 4. First sighting. contact is NULL by construction -- a door has no inbox,
  --    and pretending otherwise would put a reply-to on a machine.
  INSERT INTO door_feedback
    (instance_id, door_slug, area, body, contact, submitted_by, app_version, status, source, occurrences, last_seen_at)
  VALUES
    (v_instance, v_door, v_area, v_body, NULL, auth.uid(), v_version, 'new', 'system', 1, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.door_fault_report(text, text, jsonb) TO anon, authenticated;

-- The standing overlays, re-run because this migration changes the shape of an
-- instance-scoped table (DR-0059 / DR-0241 / DR-0347).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
