-- =============================================================================
-- 0216 — Every door gets a way to say "this is broken"
-- =============================================================================
-- FROM 0215, WHICH IS THE WHOLE REASON THIS EXISTS. Sterling Moore's order
-- inquiry failed on every attempt for the entire life of the Moore Divahs door.
-- crm_leads held zero rows. Nothing alerted anyone. The ONLY reason it was ever
-- discovered is that Sterling told Shay and Shay told Darrell -- a favour from
-- a customer, not a process. Measured while fixing it: `grep -i feedback` over
-- MooreDoor.jsx returns nothing. Her door, and every other business door the
-- registry will serve, has no way for a customer to report that anything is
-- wrong.
--
-- WHY THE EXISTING CHANNELS DO NOT COVER THIS, both checked rather than assumed:
--
--   * public.feedback is PoeTech's own loop. Its client seam requires sign-in
--     and enrols the writer into 'poe-family' (feedback-sync.js:82). It reaches
--     Darrell, not the business owner, and it is behind OUR product's login.
--   * send_business_message opens with
--         IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated';
--     so the message thread cannot serve a signed-out customer. That is sound
--     -- customer_user_id IS the thread identity, so an anonymous message has
--     no thread to belong to and no way for the steward to reply.
--
-- And the signed-out customer is precisely the person who meets a broken door.
-- So this needs its own seam, shaped like the forced-safe capture RPC: SECURITY
-- DEFINER, anon-callable, auth.uid() recorded as a NULLABLE author rather than
-- used as a gate.
--
-- THE DESIGN DECISION INHERITED DIRECTLY FROM 0215'S BUG. 0215 existed because
-- crm_capture_lead hard-coded an allowlist of pipeline names that a second,
-- hand-maintained registry in JavaScript was supposed to match, and did not.
-- So this function DOES NOT ALLOWLIST DOOR SLUGS OR AREAS. It pins the tenant
-- by slug -- which is a real row in `instances`, not a copy of a list -- and
-- otherwise validates only SHAPE (non-empty, length-capped, trimmed). The
-- door and area vocabularies live in business-registry.js alone. A new client
-- door added as a registry row (DR-0114) works here on the day it ships, with
-- no migration and nothing to keep in sync. One registry, not two.
--
-- WHAT THE OFFICE SEES. Read is ('owner','admin') of the instance the feedback
-- was filed against -- the same office predicate church-access-store.js holds
-- and 0214 uses -- so Shay reads her own door's reports and nobody else's.
-- There is deliberately no member policy and no anon read: a customer telling
-- a business something is broken has not published it to other customers.
--
-- ABUSE. An anon write path with no rate limit is a flood waiting to happen.
-- The cap is per-instance-per-minute and deliberately generous, so a real
-- moment of many people hitting one broken door still gets through while a
-- script does not.
--
-- DEPENDS ON: instances, instance_members, user_role_in_instance (0131-era
-- NULL-safe role guard).
-- IDEMPOTENT: IF NOT EXISTS + CREATE OR REPLACE + DROP POLICY IF EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.door_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  -- The registry slug of the door it was filed from. Free text ON PURPOSE
  -- (see the 0215 note above): the vocabulary lives in business-registry.js.
  door_slug       text NOT NULL,
  -- Which part of the door. Also free text, same reason.
  area            text NOT NULL DEFAULT 'other',
  body            text NOT NULL,
  -- Optional, so she can reply. A customer who wants to stay anonymous still
  -- gets to report the break.
  contact         text,
  -- auth.uid() when signed in, NULL when not. Forced server-side; never read
  -- from the payload.
  submitted_by    uuid,
  -- The build the customer was actually on. Not identifying, and it is the
  -- difference between "it is broken" and "it was broken on that deploy".
  app_version     text,
  -- Forced to 'new' on insert. The office moves it; the client never sets it.
  status          text NOT NULL DEFAULT 'new',
  office_note     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT door_feedback_body_chk   CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  CONSTRAINT door_feedback_status_chk CHECK (status IN ('new','reading','answered','closed'))
);

CREATE INDEX IF NOT EXISTS door_feedback_instance_created_idx
  ON public.door_feedback (instance_id, created_at DESC);

ALTER TABLE public.door_feedback ENABLE ROW LEVEL SECURITY;

-- The office of THAT instance, and nobody else. No member policy, no anon
-- read. NULL-safe role guard: coalesce, so a caller with no membership row
-- compares against '' rather than evaluating NULL.
DROP POLICY IF EXISTS door_feedback_office ON public.door_feedback;
CREATE POLICY door_feedback_office ON public.door_feedback
  FOR ALL TO authenticated
  USING      (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- Writes arrive ONLY through the definer function below. No table grant to
-- anon at all -- the anon path is the function, which is the forced-safe seam.
REVOKE ALL ON public.door_feedback FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.door_feedback TO authenticated;

-- ---------------------------------------------------------------------------
-- The seam a signed-out customer can actually reach.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_feedback_submit(
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
  v_contact  text := btrim(coalesce(p_payload ->> 'contact', ''));
  v_version  text := btrim(coalesce(p_payload ->> 'appVersion', ''));
  v_recent   integer;
  v_id       uuid;
BEGIN
  -- 1. The tenant is a real row, pinned by slug. The caller cannot route into
  --    another business, and this is a LOOKUP rather than a copied list.
  SELECT id INTO v_instance FROM instances WHERE slug = p_instance_slug;
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'door_feedback_submit: unknown instance slug %', p_instance_slug;
  END IF;

  -- 2. Shape only. NO door/area allowlist, on purpose -- 0215 is what a
  --    hand-maintained second registry costs. Over-long values are TRIMMED
  --    rather than rejected: a customer reporting a break must never lose the
  --    report to a validation message about a field they did not type.
  IF v_door = '' THEN
    RAISE EXCEPTION 'door_feedback_submit: door slug is required';
  END IF;
  IF v_body = '' THEN
    RAISE EXCEPTION 'door_feedback_submit: empty feedback';
  END IF;
  v_door    := left(v_door, 64);
  v_area    := left(coalesce(nullif(v_area, ''), 'other'), 64);
  v_body    := left(v_body, 4000);
  v_contact := nullif(left(v_contact, 200), '');
  v_version := nullif(left(v_version, 64), '');

  -- 3. The flood brake. Generous enough that a real outage -- many people
  --    hitting one broken door in the same minute -- still gets through.
  SELECT count(*) INTO v_recent
    FROM door_feedback
   WHERE instance_id = v_instance
     AND created_at >= now() - interval '1 minute';
  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'door_feedback_submit: too many reports for this door right now, try again shortly';
  END IF;

  -- 4. The forced-safe insert. status is 'new' because the server says so, and
  --    submitted_by is auth.uid() -- NULL for an anonymous customer, which is
  --    the entire point of this seam rather than a failure of it.
  INSERT INTO door_feedback (instance_id, door_slug, area, body, contact, submitted_by, app_version, status)
  VALUES (v_instance, v_door, v_area, v_body, v_contact, auth.uid(), v_version, 'new')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.door_feedback_submit(text, text, jsonb) TO anon, authenticated;

-- The standing overlays, re-run for the new table (DR-0059 / DR-0241 / DR-0347:
-- a redefined overlay carries every earlier exception, so a new instance-scoped
-- table must be swept back in or it silently sits outside them). Three gates
-- caught this file for omitting them, and rightly: a read-only VIEWER could
-- otherwise write door_feedback, and an assistant could read what customers
-- told a business privately about its own door.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
