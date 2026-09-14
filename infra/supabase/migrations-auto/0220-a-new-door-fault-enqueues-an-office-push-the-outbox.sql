-- =============================================================================
-- 0220 — A new door fault enqueues an office push (the outbox); delivery is armed
--        separately
-- =============================================================================
-- DR-0378 named this and deliberately left it: door_fault_report (0217) makes a
-- fault FINDABLE on the board, but nothing PUSHES the office when they are away
-- from it. Darrell 2026-09-14: "4." → the office push, recommended targeting
-- Shay + owner/admin only, per-fault (deduped), who/what not customer content.
--
-- THE ENQUEUE, HERE. When door_fault_report files a genuinely NEW system fault
-- (step 4 — the first sighting; a fold at step 3 is a repeat and must NOT
-- re-alert), it also writes one push_outbox row addressed to the instance's
-- owner/admin. Written SERVER-SIDE inside the SECURITY DEFINER function, so the
-- anon caller cannot choose the audience or spam pushes (DR-0378: the anon path
-- never sends; the server decides who is told). The body carried is the system's
-- OWN sentence ("The <form> is failing for customers…"), never customer content
-- (DR-0334 §4: a push names who/what, never the message).
--
-- THE DELIVERY, NOT HERE. Draining the outbox to a real phone is the timer-driven
-- class (three brakes) and rides the web-push stack whose live delivery is still
-- unproven (DR-0334's phone re-review). That drain ships as push-outbox-drain.yml
-- INACTIVE (P10/P11/P12; DR-0225 gates ACTIVATION, not building) and is armed on
-- the day a real phone is proven to receive. Until then the outbox simply fills
-- and the board still shows every fault — no row is lost, nothing is sent.
--
-- office-only read (the same predicate door_feedback uses, 0216 — reused, never
-- re-derived, DR-0374's two-registry lesson); anon has NO reach to the table; the
-- one writer is this SECURITY DEFINER function.
-- DEPENDS ON: 0217 (door_fault_report), instances, user_role_in_instance.
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE + policy re-create.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  fault_id     uuid,
  kind         text        NOT NULL DEFAULT 'door_fault',
  title        text        NOT NULL,
  body         text        NOT NULL,
  target_role  text        NOT NULL DEFAULT 'owner_admin',
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,          -- null = pending delivery
  attempts     integer     NOT NULL DEFAULT 0
);

-- The drain reads "pending, oldest first"; this index matches that.
CREATE INDEX IF NOT EXISTS push_outbox_pending_idx
  ON public.push_outbox (created_at) WHERE sent_at IS NULL;

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_outbox FROM PUBLIC, anon;

-- Office-only read, the SAME predicate door_feedback uses (0216). No write policy
-- at all: the only writer is door_fault_report (SECURITY DEFINER) and the only
-- reader-that-marks-sent is the drain (service key). A customer-facing session
-- can never see or touch the queue.
DROP POLICY IF EXISTS push_outbox_office ON public.push_outbox;
CREATE POLICY push_outbox_office ON public.push_outbox
  FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- door_fault_report, re-stated verbatim from 0217 with ONE addition: the new
-- fault at step 4 enqueues one office push. Everything else is byte-for-byte the
-- 0217 function (same signature, flood brake, fold, forced-safe insert).
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

  SELECT count(*) INTO v_recent
    FROM door_feedback
   WHERE instance_id = v_instance
     AND created_at >= now() - interval '1 minute';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'door_fault_report: too many reports for this door right now';
  END IF;

  -- Fold into an OPEN identical fault. A fold is a REPEAT — it must not re-alert.
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

  -- First sighting.
  INSERT INTO door_feedback
    (instance_id, door_slug, area, body, contact, submitted_by, app_version, status, source, occurrences, last_seen_at)
  VALUES
    (v_instance, v_door, v_area, v_body, NULL, auth.uid(), v_version, 'new', 'system', 1, now())
  RETURNING id INTO v_id;

  -- NEW (0220): a genuinely new fault tells the office once. Server-side, so the
  -- anon caller cannot pick the audience; owner/admin only; the body is the
  -- system's own sentence, never customer content. Best-effort — the fault is
  -- already recorded above, so a failure to enqueue must never undo it.
  BEGIN
    INSERT INTO public.push_outbox (instance_id, fault_id, kind, title, body, target_role)
    VALUES (v_instance, v_id, 'door_fault', 'A door is reporting a problem', v_body, 'owner_admin');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- enqueue is additive; never turn a recorded fault into a failed call
  END;

  RETURN v_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.door_fault_report(text, text, jsonb) TO anon, authenticated;

-- Standing overlays, because a new instance-scoped table (push_outbox) shipped
-- (DR-0059 / DR-0241 / DR-0347): the tenancy guard fails the build otherwise.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
