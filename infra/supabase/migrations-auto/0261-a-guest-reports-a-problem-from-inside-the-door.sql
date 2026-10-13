-- =============================================================================
-- 0261 — A GUEST REPORTS A PROBLEM FROM INSIDE THE DOOR (DR-0898)
-- =============================================================================
-- Darrell, 2026-10-10: "So even a person walking through an Airbnb or
-- short-term rental works great for getting work done or issues with systems
-- or cleaning done asap... make sense?"
--
-- 0260 (DR-0897) let everyone WITH a seat file work on a door: the family, a
-- manager, the 1099 worker or cleaner walking it. The one person a short stay
-- most depends on to say "the fan rattles" or "there are no towels" is the
-- guest, and a guest has no account and should not need one — 0152 already
-- decided that a person who has not committed to anything should not have to
-- sign up to talk to us (the vacancy application).
--
-- THE SHAPE. A landlord OPENS a guest link on one door. The database mints a
-- long random token (two v4 UUIDs, 244 random bits) and keeps it in
-- door_guest_links, which only the family can read. The card printed for the
-- inside of the unit carries that token. A guest who scans it can:
--   * see which door they are reporting on (guest_report_door: the door's own
--     display name and unit, nothing else — no address, no rent, no people);
--   * file one report (guest_report_problem), which lands on that door's Work
--     board as a normal work order created_by_role = 'guest', with no tenancy
--     and no account behind it.
-- The guest can read NOTHING back: not their report, not the board, not the
-- table (anon holds no grant on any of it). The two functions are the only
-- door, and both are SECURITY DEFINER with their own walls.
--
-- WHY A TOKEN HERE WHEN THE APPLY CODE CARRIES NONE (apply-link.js). Applying
-- grants nothing and writes nowhere anyone works; a stale apply card degrades
-- to "not available". A guest report WRITES onto the family's Work board and
-- pings the office. That is a permission, so it is carried by a key: one door
-- only, minted by the family, revocable (close it) and replaceable (open it
-- again — the old card stops working the moment the new one exists).
--
-- THE WALLS, ALL IN THE DATABASE:
--   * A report needs a live token; a closed or replaced link is refused.
--   * Five reports per door per hour, twenty per day. A card on a fridge is
--     public to everyone who stays; the ceiling is what keeps a prank from
--     burying the board. The refusal says to call the host.
--   * Lengths are bounded (title 160, detail 2000, name 80, contact 120).
--   * The office push names WHAT happened and WHERE, never the guest's words
--     (DR-0334 §4, 0220's rule), and is enqueued server-side so the caller
--     cannot choose the audience. Best-effort: a failed enqueue never undoes
--     the report.
--   * created_by_role widens to admit 'guest'; nothing else about the 0150
--     CHECK changes.
--
-- ACTIVATION IS THE LANDLORD'S, PER DOOR. No door has a link until he opens
-- one; shipping this changes nothing on any door by itself.
--
-- DEPENDS ON: 0260 (rental_id on tenant_maintenance_requests, the
-- door-in-its-instance trigger function), 0055, rentals, instances,
-- user_role_in_instance. push_outbox (0220) is used when present.
-- IDEMPOTENT: IF NOT EXISTS, CREATE OR REPLACE, guarded constraint swap,
-- DROP/CREATE policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. A guest is a role a work order can be created by.
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenant_maintenance_requests DROP CONSTRAINT IF EXISTS tenant_maintenance_requests_created_by_role_check;
ALTER TABLE public.tenant_maintenance_requests ADD CONSTRAINT tenant_maintenance_requests_created_by_role_check
  CHECK (created_by_role IN ('tenant','household','worker','manager','landlord','guest'));

-- ---------------------------------------------------------------------------
-- 2. The link: one per door, readable only by the family.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.door_guest_links (
  rental_id    uuid PRIMARY KEY REFERENCES public.rentals(id) ON DELETE CASCADE,
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE CHECK (token ~ '^[0-9a-f]{64}$'),
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.door_guest_links IS
  'DR-0898: the key printed inside a door so a guest can report a problem with no account. One per door; opened, replaced and closed only through door_guest_link_open / door_guest_link_close; read only by the family.';

DROP TRIGGER IF EXISTS door_guest_links_door_in_instance ON public.door_guest_links;
CREATE TRIGGER door_guest_links_door_in_instance
  BEFORE INSERT OR UPDATE ON public.door_guest_links
  FOR EACH ROW EXECUTE FUNCTION public.door_row_in_its_instance();

REVOKE ALL ON public.door_guest_links FROM anon, authenticated;
GRANT SELECT ON public.door_guest_links TO authenticated;
ALTER TABLE public.door_guest_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS door_guest_links_read ON public.door_guest_links;
CREATE POLICY door_guest_links_read ON public.door_guest_links FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- 3. Open (or replace) and close a door's link — the family only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_guest_link_open(p_rental uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_instance uuid; v_token text;
BEGIN
  SELECT instance_id INTO v_instance FROM rentals WHERE id = p_rental;
  IF v_instance IS NULL OR coalesce(user_role_in_instance(v_instance), '') NOT IN ('owner','admin','member') THEN
    RAISE EXCEPTION 'only the family can open a guest link on this door' USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO door_guest_links (rental_id, instance_id, token, created_by)
  VALUES (p_rental, v_instance, v_token, auth.uid())
  ON CONFLICT (rental_id) DO UPDATE
    SET token = EXCLUDED.token, created_by = EXCLUDED.created_by, created_at = now();
  RETURN v_token;
END $$;
REVOKE ALL ON FUNCTION public.door_guest_link_open(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_guest_link_open(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.door_guest_link_close(p_rental uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_instance uuid;
BEGIN
  SELECT instance_id INTO v_instance FROM rentals WHERE id = p_rental;
  IF v_instance IS NULL OR coalesce(user_role_in_instance(v_instance), '') NOT IN ('owner','admin','member') THEN
    RAISE EXCEPTION 'only the family can close a guest link on this door' USING ERRCODE = 'insufficient_privilege';
  END IF;
  DELETE FROM door_guest_links WHERE rental_id = p_rental;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.door_guest_link_close(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.door_guest_link_close(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. What a guest may see: which door this is. Nothing else.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guest_report_door(p_token text)
RETURNS TABLE (label text, unit text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(nullif(r.display_name, ''), 'This place') AS label, nullif(r.unit, '') AS unit
  FROM door_guest_links g JOIN rentals r ON r.id = g.rental_id
  WHERE g.token = lower(trim(coalesce(p_token, '')))
$$;
REVOKE ALL ON FUNCTION public.guest_report_door(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_report_door(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. What a guest may do: file one report on that door.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guest_report_problem(
  p_token text, p_title text, p_detail text DEFAULT NULL,
  p_name text DEFAULT NULL, p_contact text DEFAULT NULL, p_urgent boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rental uuid; v_instance uuid; v_label text;
  v_title text := trim(coalesce(p_title, ''));
  v_detail text := nullif(trim(coalesce(p_detail, '')), '');
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_contact text := nullif(trim(coalesce(p_contact, '')), '');
  v_who text;
BEGIN
  SELECT g.rental_id, g.instance_id, coalesce(nullif(r.display_name, ''), r.address)
    INTO v_rental, v_instance, v_label
    FROM door_guest_links g JOIN rentals r ON r.id = g.rental_id
   WHERE g.token = lower(trim(coalesce(p_token, '')));
  IF v_rental IS NULL THEN
    RAISE EXCEPTION 'This report link is not active. Please contact your host directly.';
  END IF;
  IF length(v_title) < 2 OR length(v_title) > 160 THEN
    RAISE EXCEPTION 'Say what is wrong in a few words (up to 160 characters).';
  END IF;
  IF length(coalesce(v_detail, '')) > 2000 OR length(coalesce(v_name, '')) > 80 OR length(coalesce(v_contact, '')) > 120 THEN
    RAISE EXCEPTION 'That is longer than this form takes. Please shorten it.';
  END IF;
  IF (SELECT count(*) FROM tenant_maintenance_requests
       WHERE rental_id = v_rental AND created_by_role = 'guest' AND created_at > now() - interval '1 hour') >= 5
     OR (SELECT count(*) FROM tenant_maintenance_requests
       WHERE rental_id = v_rental AND created_by_role = 'guest' AND created_at > now() - interval '1 day') >= 20 THEN
    RAISE EXCEPTION 'Several reports have already come from this place recently. Please call or text your host.';
  END IF;

  v_who := concat_ws(', ', v_name, v_contact);
  INSERT INTO tenant_maintenance_requests
    (instance_id, rental_id, tenancy_id, created_by, created_by_role, title, detail, priority, status)
  VALUES
    (v_instance, v_rental, NULL, NULL, 'guest', v_title,
     concat_ws(E'\n', v_detail, 'Reported by a guest' || CASE WHEN v_who <> '' THEN ' (' || v_who || ')' ELSE '' END || '.'),
     CASE WHEN p_urgent THEN 'urgent' ELSE 'normal' END, 'submitted');

  -- Tell the office. Who and where, never the guest's words; server-chosen
  -- audience; never undoes the report.
  BEGIN
    IF to_regclass('public.push_outbox') IS NOT NULL THEN
      EXECUTE 'INSERT INTO public.push_outbox (instance_id, kind, title, body, target_role) VALUES ($1, $2, $3, $4, $5)'
        USING v_instance, 'door_guest_report',
              CASE WHEN p_urgent THEN 'A guest reported an URGENT problem' ELSE 'A guest reported a problem' END,
              'At ' || v_label || '. Open the Work board for that door.', 'owner_admin';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.guest_report_problem(text, text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_report_problem(text, text, text, text, text, boolean) TO anon, authenticated;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
