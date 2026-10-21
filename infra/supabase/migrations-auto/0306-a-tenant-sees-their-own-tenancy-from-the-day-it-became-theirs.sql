-- =============================================================================
-- 0306 — A tenant sees their own tenancy, from the day it became theirs (DR-1163)
-- =============================================================================
-- Darrell, 2026-10-21, looking at 805 North Prospect Avenue Apt 2 "seen as a
-- tenant": "A new tenant should only see their history... the landlord should
-- see all historical events and data make sense?" Then: "all tabs should make
-- sense."
--
-- What was true. A tenant reads a tenancy's rows through user_is_tenant() and
-- user_is_tenancy_household() (0150), which ask only WHOSE tenancy it is, never
-- SINCE WHEN. A tenancy row is not always born for its tenant: a vacant unit
-- record (DR-0870) carries the landlord's messages and notes before anyone
-- lives there, and a claim (0151) puts the new tenant's account on that same
-- row. From that moment everything ever written on it was theirs to read.
--
-- The rule. Every tenancy carries `tenant_from`: the moment it first had a
-- person on it (a name, an email, a phone or an account). A tenant, or a
-- member of their household, reads a row of that tenancy only when the row was
-- written at or after that moment. The landlord's side (owner, admin, member)
-- and every delegate keep reading what they read before: this narrows the
-- tenant arm only, as a RESTRICTIVE policy beside the existing ones, so no
-- earlier policy is rewritten.
--
-- When the window moves:
--   * a row inserted with a person on it starts its window at its creation;
--   * a vacant row given its first person starts its window then;
--   * an account replacing a different account starts the window again;
--   * an ENDED tenancy claimed by an account whose email or phone is not the
--     one on the row starts the window again — the old tenant's record stays
--     theirs; the tenant it was written for still sees all of it.
-- The landlord may set tenant_from by hand (the trigger keeps an explicit
-- value).
--
-- Tables narrowed: tenant_messages, tenancy_notes, tenant_maintenance_requests,
-- request_documentation, rent_records, tenant_notices, property_documents. The
-- records that hang off them (door_events, property_document_signatures) read
-- through EXISTS on their parent, so they follow.
--
-- Idempotent: every statement can run twice.
-- =============================================================================

ALTER TABLE public.rental_tenancies ADD COLUMN IF NOT EXISTS tenant_from timestamptz;

COMMENT ON COLUMN public.rental_tenancies.tenant_from IS
  'When this tenancy first had a person on it. Its tenant and household read the tenancy''s rows from this moment on (0306, DR-1163).';

-- Who is on a row: a name, an email, a phone or an account.
CREATE OR REPLACE FUNCTION public.tenancy_has_person(t public.rental_tenancies)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT t.tenant_user_id IS NOT NULL
      OR coalesce(btrim(t.tenant_name), '') <> ''
      OR coalesce(btrim(t.tenant_email), '') <> ''
      OR coalesce(btrim(t.tenant_phone), '') <> ''
$$;

CREATE OR REPLACE FUNCTION public.rental_tenancies_stamp_tenant_from()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_email text;
  u_phone text;
  matches boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tenant_from IS NULL AND public.tenancy_has_person(NEW) THEN
      NEW.tenant_from := coalesce(NEW.created_at, now());
    END IF;
    RETURN NEW;
  END IF;

  -- An explicit change by the landlord is kept as written.
  IF NEW.tenant_from IS DISTINCT FROM OLD.tenant_from THEN
    RETURN NEW;
  END IF;

  -- A vacant unit record is given its first person.
  IF NOT public.tenancy_has_person(OLD) AND public.tenancy_has_person(NEW) THEN
    NEW.tenant_from := now();
    RETURN NEW;
  END IF;

  IF NEW.tenant_user_id IS NOT NULL AND NEW.tenant_user_id IS DISTINCT FROM OLD.tenant_user_id THEN
    -- One account replacing another: a different person.
    IF OLD.tenant_user_id IS NOT NULL THEN
      NEW.tenant_from := now();
      RETURN NEW;
    END IF;
    -- An ended tenancy claimed by someone the row does not name.
    IF OLD.status = 'ended' THEN
      SELECT lower(btrim(u.email)), right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10)
        INTO u_email, u_phone
        FROM auth.users u WHERE u.id = NEW.tenant_user_id;
      matches := (coalesce(btrim(OLD.tenant_email), '') <> '' AND lower(btrim(OLD.tenant_email)) = u_email)
              OR (length(right(regexp_replace(coalesce(OLD.tenant_phone, ''), '\D', '', 'g'), 10)) = 10
                  AND right(regexp_replace(coalesce(OLD.tenant_phone, ''), '\D', '', 'g'), 10) = u_phone);
      IF NOT matches THEN
        NEW.tenant_from := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rental_tenancies_tenant_from ON public.rental_tenancies;
CREATE TRIGGER rental_tenancies_tenant_from
  BEFORE INSERT OR UPDATE ON public.rental_tenancies
  FOR EACH ROW EXECUTE FUNCTION public.rental_tenancies_stamp_tenant_from();

-- Rows already held: the window opens at the row's birth, except a unit
-- record that was claimed with no name on it, whose window opens at the claim.
UPDATE public.rental_tenancies t
   SET tenant_from = coalesce(
         CASE WHEN coalesce(btrim(t.tenant_name), '') = '' AND coalesce(btrim(t.tenant_email), '') = ''
                   AND coalesce(btrim(t.tenant_phone), '') = ''
              THEN (SELECT min(i.claimed_at) FROM public.property_access_invites i
                     WHERE i.tenancy_id = t.id AND i.role_label = 'tenant' AND i.claimed_at IS NOT NULL)
         END,
         t.created_at)
 WHERE t.tenant_from IS NULL AND public.tenancy_has_person(t);

-- May the reader see a row of this tenancy written at p_at? True for every
-- reader who is not this tenancy's tenant or household (their own policies
-- decide), and for the landlord's side always. SECURITY DEFINER so the tenant,
-- who cannot read tenancy_household's other rows, is matched all the same.
CREATE OR REPLACE FUNCTION public.tenancy_row_in_tenant_window(p_instance uuid, p_tenancy uuid, p_at timestamptz)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t record;
  hh_since timestamptz;
  start_at timestamptz;
BEGIN
  IF p_tenancy IS NULL THEN RETURN true; END IF;
  IF user_role_in_instance(p_instance) IN ('owner', 'admin', 'member') THEN RETURN true; END IF;
  SELECT r.tenant_user_id, r.tenant_from, r.created_at INTO t
    FROM rental_tenancies r WHERE r.id = p_tenancy;
  IF NOT FOUND THEN RETURN true; END IF;
  SELECT h.created_at INTO hh_since
    FROM tenancy_household h
   WHERE h.tenancy_id = p_tenancy AND h.member_user_id = auth.uid() AND h.active = true;
  IF t.tenant_user_id IS DISTINCT FROM auth.uid() AND hh_since IS NULL THEN
    RETURN true;
  END IF;
  start_at := coalesce(t.tenant_from, hh_since, now());
  RETURN p_at IS NOT NULL AND p_at >= start_at;
END;
$$;
REVOKE ALL ON FUNCTION public.tenancy_row_in_tenant_window(uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tenancy_row_in_tenant_window(uuid, uuid, timestamptz) TO authenticated;

-- The narrowing, one RESTRICTIVE SELECT policy per table, read against the
-- column each table is stamped with when it is written.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('tenant_messages',             'sent_at'),
    ('tenancy_notes',               'created_at'),
    ('tenant_maintenance_requests', 'created_at'),
    ('request_documentation',       'created_at'),
    ('rent_records',                'reported_at'),
    ('tenant_notices',              'posted_at'),
    ('property_documents',          'uploaded_at')
  ) AS v(tbl, stamp)
  LOOP
    IF to_regclass('public.' || r.tbl) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS tenant_window_read ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY tenant_window_read ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated '
      'USING (public.tenancy_row_in_tenant_window(instance_id, tenancy_id, %I))', r.tbl, r.stamp);
  END LOOP;
END $$;
