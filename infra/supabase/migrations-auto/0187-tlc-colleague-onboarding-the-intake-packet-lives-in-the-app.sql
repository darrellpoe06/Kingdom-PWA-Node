-- =============================================================================
-- 0187 -- TLC COLLEAGUE ONBOARDING: the intake packet lives in the app
--         (DR-0344)
-- =============================================================================
-- Darrell, 2026-09-10: "We need the TLC Therapy Solutions intake form inside
-- the TLC Therapy Solutions App... so Christina can on-board new colleagues
-- inside the TLC Therapy Solutions App... go look at our Google drive and use
-- that to build the system from as our scaling process or scaffolding."
--
-- WHAT EXISTED (the Ways review, DR-0108). The scaffolding is a Google Form,
-- "TLC Therapy Solutions - Therapist Onboarding | Hiring Form", feeding a
-- Google Sheet and a Drive folder of uploads. Five colleagues have come through
-- it. It works, and it carries a cost the app must not inherit: every answer
-- lands in one shared sheet in the clear -- dates of birth, home addresses,
-- bank routing and account numbers, and, in one row, a CAQH password typed
-- into a free-text box. The app already had the pieces the packet needs: the
-- clinicians roster (schema v2.3), a two-party invite handshake (0104 /
-- DR-0187), an owner/admin office role (0130 / DR-0271), private buckets born
-- by migration (0078 / 0180), and the rule that a list never carries the bytes
-- (DR-0303). Nothing joined them into an intake.
--
-- THE DESIGN, AND WHY EACH LINE IS THE SAFE ONE.
--
-- 1. THE INVITE IS A TOKEN, MINTED BY THE OFFICE OWNER/ADMIN. Christina mints
--    a one-time link for one email; the colleague opens it on the TLC door,
--    signs in (or creates a login), and the packet binds to THEIR account.
--    Nobody becomes a member of anything by filling in a form: membership is
--    still the 0104 handshake, granted separately. A forwarded link opens a
--    draft under the forwarder's own account and nothing else.
--
-- 2. THE PACKET IS ONE JSONB ROW, BOUNDED, WITH NO BYTES IN IT. Every answer
--    from the Drive form is a key in `packet`; every uploaded document is a
--    POINTER (a storage path in a private bucket), never a blob in the row.
--    The only picture in the row is the headshot THUMBNAIL (32,000 chars, the
--    0186 cap) fetched by id when a card opens, never in the list.
--
-- 3. BANKING IS WALLED. Routing and account numbers live in their own table
--    with RLS enabled and NO policies: nothing reads or writes it directly.
--    The applicant writes through tlc_onboarding_save(); an owner/admin reads
--    through tlc_onboarding_banking_read(), which writes an audit_log row on
--    every reveal. The list, the open call and the review call return only
--    the bank name and the last four digits.
--
-- 4. A CREDENTIAL IS NEVER COLLECTED. The Drive form asked for a "CAQH
--    Username/Password". The packet has no such key and the app has no such
--    field; the colleague is asked instead to grant TLC practice-manager
--    access inside CAQH. A password in a form is a leak waiting for a screen.
--
-- 5. APPROVAL WRITES THE ROSTER. tlc_onboarding_review('approve') inserts the
--    clinicians row from the packet (name, license, expiry, specialties,
--    bound to the applicant's user id), so the roster Practice reads is fed
--    by the intake, not retyped. The row is linked back; approving twice is
--    a no-op.
--
-- 6. WHO MAY SEE WHAT is the existing office role: user_role_in_instance()
--    in ('owner','admin') -- the same gate TlcTeamAccess uses (0130). An
--    assistant is denied by the 0130 overlay (re-run below); a viewer by the
--    0125 overlay (re-run below). The applicant is not a member at all and
--    reaches only their own packet, only through the functions here.
--
-- 7. THE RECORD IS THE COLLEAGUE'S (USER-ACCOUNTS-AND-HISTORIES-STANDARD;
--    DATA-AS-EMPOWERMENT behaviors 6 and 7). It is scoped to their account
--    AND to the office: they read it back any time and export it; they can
--    withdraw it, a hard delete that takes banking with it; the office can
--    remove one it holds; and every office read of a colleague's record --
--    not only the banking reveal -- writes an audit_log row.
--
-- IDEMPOTENT (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS). Every
-- function is NEW (no RETURNS shape is widened). The clinicians table is
-- created by infra/supabase/schema-v2.3-therapy.sql, which a bare replay of
-- this directory may not carry, so its foreign key and the approval insert
-- are guarded with to_regclass() and degrade to "no roster row" honestly.
--
-- Word-first: "Let all things be done decently and in order" (1 Corinthians
-- 14:40). An intake is the first order a colleague meets; it should be kept.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The invite
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tlc_onboarding_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  email        text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 5 AND 200),
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  note         text CHECK (note IS NULL OR char_length(note) <= 500),
  invited_by   uuid NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at   timestamptz
);
CREATE INDEX IF NOT EXISTS tlc_onboarding_invites_instance_idx ON public.tlc_onboarding_invites (instance_id);

ALTER TABLE public.tlc_onboarding_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tlc_onboarding_invites_office_read ON public.tlc_onboarding_invites;
CREATE POLICY tlc_onboarding_invites_office_read ON public.tlc_onboarding_invites
  FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner','admin'));
-- No INSERT / UPDATE / DELETE policy: minting and revoking go through the
-- SECURITY DEFINER functions below, which check the office role themselves.

-- ---------------------------------------------------------------------------
-- 2. The packet -- one bounded jsonb row per invite, pointers only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tlc_onboarding_packets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id        uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  invite_id          uuid NOT NULL UNIQUE REFERENCES public.tlc_onboarding_invites(id) ON DELETE CASCADE,
  applicant_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_email    text,
  status             text NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','submitted','returned','approved')),
  packet             jsonb NOT NULL DEFAULT '{}'::jsonb
                       CHECK (jsonb_typeof(packet) = 'object' AND pg_column_size(packet) <= 200000),
  headshot_thumb     text CHECK (headshot_thumb IS NULL OR (headshot_thumb LIKE 'data:image/%' AND char_length(headshot_thumb) <= 32000)),
  submitted_at       timestamptz,
  reviewed_by        uuid REFERENCES auth.users(id),
  reviewed_at        timestamptz,
  review_note        text CHECK (review_note IS NULL OR char_length(review_note) <= 2000),
  clinician_id       uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tlc_onboarding_packets_instance_idx  ON public.tlc_onboarding_packets (instance_id);
CREATE INDEX IF NOT EXISTS tlc_onboarding_packets_applicant_idx ON public.tlc_onboarding_packets (applicant_user_id);

-- The roster link is a real foreign key wherever the roster exists.
DO $$
BEGIN
  IF to_regclass('public.clinicians') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tlc_onboarding_packets_clinician_fk') THEN
    ALTER TABLE public.tlc_onboarding_packets
      ADD CONSTRAINT tlc_onboarding_packets_clinician_fk
      FOREIGN KEY (clinician_id) REFERENCES public.clinicians(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.tlc_onboarding_packets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tlc_onboarding_packets_office_read ON public.tlc_onboarding_packets;
CREATE POLICY tlc_onboarding_packets_office_read ON public.tlc_onboarding_packets
  FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS tlc_onboarding_packets_applicant_read ON public.tlc_onboarding_packets;
CREATE POLICY tlc_onboarding_packets_applicant_read ON public.tlc_onboarding_packets
  FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid());
-- Writes go through the functions below only.

-- ---------------------------------------------------------------------------
-- 3. Banking -- walled: RLS on, NO policies, function access only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tlc_onboarding_banking (
  packet_id       uuid PRIMARY KEY REFERENCES public.tlc_onboarding_packets(id) ON DELETE CASCADE,
  instance_id     uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  bank_name       text NOT NULL CHECK (char_length(bank_name) BETWEEN 1 AND 120),
  routing_number  text NOT NULL CHECK (routing_number ~ '^[0-9]{9}$'),
  account_number  text NOT NULL CHECK (account_number ~ '^[0-9]{4,17}$'),
  account_type    text NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking','savings')),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tlc_onboarding_banking ENABLE ROW LEVEL SECURITY;
-- Deliberately no CREATE POLICY here. With RLS enabled and no permissive
-- policy, every direct read and write is denied for every role; the two
-- SECURITY DEFINER functions below are the only doors.

-- ---------------------------------------------------------------------------
-- 4. The documents bucket -- private, born by migration (0078 / 0180)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('tlc-onboarding', 'tlc-onboarding', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0187: insufficient privilege on storage.buckets - create tlc-onboarding (PRIVATE) via the dashboard';
END $$;

-- Object paths are `<applicant user id>/<packet id>/<document key>-<file name>`.
-- The first folder is the applicant (owner-only writes); the second is the
-- packet, which is how the office owner/admin earns READ on a colleague's
-- documents -- through the packet's instance, never by guessing a path.
DO $$
BEGIN
  DROP POLICY IF EXISTS tlc_onboarding_object_read     ON storage.objects;
  DROP POLICY IF EXISTS tlc_onboarding_object_office   ON storage.objects;
  DROP POLICY IF EXISTS tlc_onboarding_object_write    ON storage.objects;
  DROP POLICY IF EXISTS tlc_onboarding_object_update   ON storage.objects;
  DROP POLICY IF EXISTS tlc_onboarding_object_delete   ON storage.objects;

  CREATE POLICY tlc_onboarding_object_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'tlc-onboarding' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY tlc_onboarding_object_office ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'tlc-onboarding' AND EXISTS (
      SELECT 1 FROM public.tlc_onboarding_packets p
       WHERE p.id::text = (storage.foldername(name))[2]
         AND public.user_role_in_instance(p.instance_id) IN ('owner','admin')));
  CREATE POLICY tlc_onboarding_object_write ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'tlc-onboarding'
      AND (storage.foldername(name))[1] = auth.uid()::text
      AND EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p
                   WHERE p.id::text = (storage.foldername(name))[2]
                     AND p.applicant_user_id = auth.uid()
                     AND p.status IN ('draft','returned')));
  CREATE POLICY tlc_onboarding_object_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'tlc-onboarding' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'tlc-onboarding' AND (storage.foldername(name))[1] = auth.uid()::text);
  -- Delete: the applicant on their own folder in ANY status (withdrawing a
  -- packet must take the files with it -- DATA-AS-EMPOWERMENT behavior 7), and
  -- the office owner/admin under a packet of their instance (removing one).
  CREATE POLICY tlc_onboarding_object_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'tlc-onboarding' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p
                  WHERE p.id::text = (storage.foldername(name))[2]
                    AND public.user_role_in_instance(p.instance_id) IN ('owner','admin'))));
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0187: insufficient privilege on storage.objects - create the five tlc-onboarding policies via the dashboard';
END $$;

-- ---------------------------------------------------------------------------
-- 4b. The public roster -- "Match a Preferred Provider", fed by approval
-- ---------------------------------------------------------------------------
-- Darrell, 2026-09-10, mid-build: "On-boarding should also update the Apps
-- and other online locations with new Therapists using the same format as
-- the current ones." The current ones are the seven cards in
-- lib/tlc-practice.js (name, role, specialty line, page link, headshot). A
-- row here IS that card. Approval writes one (the card Christina previewed);
-- the door, the Moore door and the Practice tab read the published rows
-- through tlc_public_roster() -- public columns only, SECURITY DEFINER, so
-- a signed-out client never touches the table or the office instance.
-- The picture is the 160px thumbnail already in the packet (a card shows it
-- at 72px); the roster stays a handful of small rows. The website
-- (tlctherapysolutions.me) has no write API we hold, so the app cannot push
-- there; the same card is exportable for pasting into its editor.
CREATE TABLE IF NOT EXISTS public.tlc_roster (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  office_id    text NOT NULL DEFAULT 'tlc' CHECK (char_length(office_id) BETWEEN 1 AND 40),
  packet_id    uuid UNIQUE REFERENCES public.tlc_onboarding_packets(id) ON DELETE SET NULL,
  clinician_id uuid,
  name         text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  role         text NOT NULL DEFAULT 'Specialist' CHECK (char_length(role) BETWEEN 1 AND 80),
  specialty    text NOT NULL DEFAULT '' CHECK (char_length(specialty) <= 200),
  url          text CHECK (url IS NULL OR (url ~ '^https://' AND char_length(url) <= 400)),
  photo_thumb  text CHECK (photo_thumb IS NULL OR (photo_thumb LIKE 'data:image/%' AND char_length(photo_thumb) <= 32000)),
  bio          text CHECK (bio IS NULL OR char_length(bio) <= 4000),
  published    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 100,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tlc_roster_office_idx ON public.tlc_roster (office_id, published, sort_order);

ALTER TABLE public.tlc_roster ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tlc_roster_office_read ON public.tlc_roster;
CREATE POLICY tlc_roster_office_read ON public.tlc_roster
  FOR SELECT TO authenticated
  USING (public.user_role_in_instance(instance_id) IN ('owner','admin'));
-- Writes go through tlc_roster_upsert / tlc_roster_remove / approval only.

CREATE OR REPLACE FUNCTION public.tlc_public_roster(office_in text DEFAULT 'tlc')
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id, 'name', r.name, 'role', r.role, 'specialty', r.specialty,
           'url', r.url, 'photo', r.photo_thumb)
         ORDER BY r.sort_order, r.created_at), '[]'::jsonb)
    FROM public.tlc_roster r
   WHERE r.office_id = office_in AND r.published;
$$;
GRANT EXECUTE ON FUNCTION public.tlc_public_roster(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.tlc_roster_upsert(row_in jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_id     uuid;
  v_row    public.tlc_roster%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can edit the roster';
  END IF;
  IF row_in IS NULL OR jsonb_typeof(row_in) <> 'object' THEN RAISE EXCEPTION 'a roster card must be an object'; END IF;
  v_id := nullif(row_in->>'id', '')::uuid;
  IF v_id IS NOT NULL THEN
    UPDATE public.tlc_roster
       SET name = coalesce(nullif(trim(row_in->>'name'), ''), name),
           role = coalesce(nullif(trim(row_in->>'role'), ''), role),
           specialty = coalesce(trim(row_in->>'specialty'), specialty),
           url = CASE WHEN row_in ? 'url' THEN nullif(trim(row_in->>'url'), '') ELSE url END,
           photo_thumb = CASE WHEN row_in ? 'photo' THEN nullif(row_in->>'photo', '') ELSE photo_thumb END,
           bio = CASE WHEN row_in ? 'bio' THEN nullif(trim(row_in->>'bio'), '') ELSE bio END,
           published = coalesce((row_in->>'published')::boolean, published),
           sort_order = coalesce((row_in->>'sort_order')::integer, sort_order),
           updated_at = now()
     WHERE id = v_id AND instance_id = v_office.instance_id
     RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN RAISE EXCEPTION 'no such roster card in your office'; END IF;
  ELSE
    INSERT INTO public.tlc_roster (instance_id, office_id, packet_id, clinician_id, name, role, specialty, url, photo_thumb, bio, published, sort_order, created_by)
    VALUES (v_office.instance_id, coalesce(nullif(row_in->>'office_id', ''), 'tlc'),
            nullif(row_in->>'packet_id', '')::uuid, nullif(row_in->>'clinician_id', '')::uuid,
            trim(row_in->>'name'), coalesce(nullif(trim(row_in->>'role'), ''), 'Specialist'),
            coalesce(trim(row_in->>'specialty'), ''), nullif(trim(row_in->>'url'), ''),
            nullif(row_in->>'photo', ''), nullif(trim(row_in->>'bio'), ''),
            coalesce((row_in->>'published')::boolean, true), coalesce((row_in->>'sort_order')::integer, 100), auth.uid())
    ON CONFLICT (packet_id) DO UPDATE
      SET name = EXCLUDED.name, role = EXCLUDED.role, specialty = EXCLUDED.specialty, url = EXCLUDED.url,
          photo_thumb = EXCLUDED.photo_thumb, bio = EXCLUDED.bio, published = EXCLUDED.published, updated_at = now()
    RETURNING * INTO v_row;
  END IF;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_office.instance_id, auth.uid(), CASE WHEN v_id IS NULL THEN 'create' ELSE 'update' END, 'tlc_roster', v_row.id,
          NULL, jsonb_build_object('name', v_row.name, 'published', v_row.published), 'tlc_roster_upsert');
  RETURN jsonb_build_object('id', v_row.id, 'name', v_row.name, 'role', v_row.role, 'specialty', v_row.specialty,
                            'url', v_row.url, 'photo', v_row.photo_thumb, 'bio', v_row.bio, 'published', v_row.published,
                            'sort_order', v_row.sort_order, 'packet_id', v_row.packet_id, 'updated_at', v_row.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_roster_upsert(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_roster_upsert(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.tlc_roster_remove(id_in uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_row public.tlc_roster%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_row FROM public.tlc_roster WHERE id = id_in;
  IF v_row.id IS NULL THEN RETURN false; END IF;
  IF coalesce(public.user_role_in_instance(v_row.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can edit the roster';
  END IF;
  DELETE FROM public.tlc_roster WHERE id = v_row.id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_row.instance_id, auth.uid(), 'delete', 'tlc_roster', v_row.id, jsonb_build_object('name', v_row.name), NULL, 'tlc_roster_remove');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_roster_remove(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_roster_remove(uuid) TO authenticated;

-- The office's full roster (published or not) for the editor.
CREATE OR REPLACE FUNCTION public.tlc_roster_list()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN RETURN '[]'::jsonb; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
             'id', r.id, 'name', r.name, 'role', r.role, 'specialty', r.specialty, 'url', r.url,
             'photo', r.photo_thumb, 'bio', r.bio, 'published', r.published, 'sort_order', r.sort_order,
             'packet_id', r.packet_id, 'updated_at', r.updated_at)
           ORDER BY r.sort_order, r.created_at)
      FROM public.tlc_roster r WHERE r.instance_id = v_office.instance_id), '[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_roster_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_roster_list() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. The office the caller runs -- the SAME resolution 0130 gives the shell
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_my_office()
RETURNS TABLE (instance_id uuid, role text, office_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT im.instance_id, im.role, i.display_name
    FROM instance_members im
    JOIN instances i ON i.id = im.instance_id
   WHERE im.user_id = auth.uid() AND i.instance_type <> 'church'
   ORDER BY CASE WHEN i.instance_type = 'family' THEN 0 ELSE 1 END,
            im.joined_at ASC,
            i.id ASC
   LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_my_office() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_my_office() TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Mint an invite (owner/admin). One open invite per email per office: an
--    older open one for the same address is revoked so exactly one link works.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_invite(email_in text, note_in text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
  v_email  text := lower(trim(coalesce(email_in, '')));
  v_row    public.tlc_onboarding_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can invite a colleague';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'that is not a valid email address';
  END IF;

  UPDATE public.tlc_onboarding_invites
     SET revoked_at = now()
   WHERE instance_id = v_office.instance_id
     AND email = v_email
     AND revoked_at IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = tlc_onboarding_invites.id);

  INSERT INTO public.tlc_onboarding_invites (instance_id, email, note, invited_by)
  VALUES (v_office.instance_id, v_email, nullif(trim(coalesce(note_in, '')), ''), auth.uid())
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_office.instance_id, auth.uid(), 'invite', 'tlc_onboarding_invite', v_row.id,
          NULL, jsonb_build_object('email', v_email), 'tlc_onboarding_invite');

  RETURN jsonb_build_object('id', v_row.id, 'token', v_row.token, 'email', v_row.email,
                            'expires_at', v_row.expires_at, 'office_name', v_office.office_name);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_invite(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_invite(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.tlc_onboarding_revoke_invite(invite_id_in uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inv public.tlc_onboarding_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_inv FROM public.tlc_onboarding_invites WHERE id = invite_id_in;
  IF v_inv.id IS NULL THEN RETURN false; END IF;
  IF coalesce(public.user_role_in_instance(v_inv.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can revoke an invite';
  END IF;
  IF v_inv.revoked_at IS NULL THEN
    UPDATE public.tlc_onboarding_invites SET revoked_at = now() WHERE id = invite_id_in;
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_inv.instance_id, auth.uid(), 'permission-revoke', 'tlc_onboarding_invite', v_inv.id,
            jsonb_build_object('email', v_inv.email), NULL, 'tlc_onboarding_revoke_invite');
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_revoke_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_revoke_invite(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. The colleague opens the link (signed in): the packet binds to THEIR
--    account on first open; every later open returns their own draft.
--    Banking comes back masked -- bank name and last four only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_packet_view(p public.tlc_onboarding_packets, office_name text)
RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'packet_id',      p.id,
    'invite_id',      p.invite_id,
    'office_name',    office_name,
    'email',          p.applicant_email,
    'status',         p.status,
    'packet',         p.packet,
    'headshot_thumb', p.headshot_thumb,
    'submitted_at',   p.submitted_at,
    'reviewed_at',    p.reviewed_at,
    'review_note',    p.review_note,
    'clinician_id',   p.clinician_id,
    'updated_at',     p.updated_at,
    'banking',        (SELECT jsonb_build_object(
                          'bank_name',    b.bank_name,
                          'account_type', b.account_type,
                          'routing_last4', right(b.routing_number, 4),
                          'account_last4', right(b.account_number, 4))
                         FROM public.tlc_onboarding_banking b WHERE b.packet_id = p.id)
  );
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_packet_view(public.tlc_onboarding_packets, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tlc_onboarding_open(token_in text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_inv    public.tlc_onboarding_invites%ROWTYPE;
  v_pkt    public.tlc_onboarding_packets%ROWTYPE;
  v_name   text;
  v_email  text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_inv FROM public.tlc_onboarding_invites WHERE token = trim(coalesce(token_in, ''));
  IF v_inv.id IS NULL THEN RETURN jsonb_build_object('status', 'unknown'); END IF;
  IF v_inv.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'revoked'); END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_inv.instance_id;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE invite_id = v_inv.id;

  IF v_pkt.id IS NULL THEN
    IF v_inv.expires_at < now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
    SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
    INSERT INTO public.tlc_onboarding_packets (instance_id, invite_id, applicant_user_id, applicant_email)
    VALUES (v_inv.instance_id, v_inv.id, auth.uid(), coalesce(v_email, v_inv.email))
    RETURNING * INTO v_pkt;
  ELSIF v_pkt.applicant_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('status', 'taken');
  END IF;

  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_open(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_open(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. The colleague saves (a draft, any number of times) or submits (once the
--    packet carries the required answers and the three acknowledgments).
--    banking_in, when present, is written to the walled table; the row it
--    returns is masked like every other read.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_save(
  packet_id_in uuid,
  packet_in    jsonb,
  headshot_in  text DEFAULT NULL,
  banking_in   jsonb DEFAULT NULL,
  submit_in    boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt   public.tlc_onboarding_packets%ROWTYPE;
  v_name  text;
  v_missing text[] := '{}';
  v_key   text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL OR v_pkt.applicant_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'that packet is not yours';
  END IF;
  IF v_pkt.status NOT IN ('draft','returned') THEN
    RAISE EXCEPTION 'this packet was already %', v_pkt.status;
  END IF;
  IF packet_in IS NULL OR jsonb_typeof(packet_in) <> 'object' THEN
    RAISE EXCEPTION 'the packet must be an object';
  END IF;
  -- A credential never enters the row (design point 4).
  IF packet_in ? 'caqhPassword' OR packet_in ? 'password' THEN
    RAISE EXCEPTION 'a password is never stored in an intake packet';
  END IF;
  -- Banking never rides in the packet json either (design point 3).
  IF packet_in ? 'routingNumber' OR packet_in ? 'accountNumber' THEN
    RAISE EXCEPTION 'banking is saved separately, never inside the packet';
  END IF;

  IF banking_in IS NOT NULL AND jsonb_typeof(banking_in) = 'object'
     AND coalesce(banking_in->>'routingNumber', '') <> '' THEN
    INSERT INTO public.tlc_onboarding_banking (packet_id, instance_id, bank_name, routing_number, account_number, account_type)
    VALUES (v_pkt.id, v_pkt.instance_id,
            trim(coalesce(banking_in->>'bankName', '')),
            regexp_replace(coalesce(banking_in->>'routingNumber', ''), '\D', '', 'g'),
            regexp_replace(coalesce(banking_in->>'accountNumber', ''), '\D', '', 'g'),
            CASE WHEN banking_in->>'accountType' = 'savings' THEN 'savings' ELSE 'checking' END)
    ON CONFLICT (packet_id) DO UPDATE
      SET bank_name = EXCLUDED.bank_name,
          routing_number = EXCLUDED.routing_number,
          account_number = EXCLUDED.account_number,
          account_type = EXCLUDED.account_type,
          updated_at = now();
  END IF;

  IF submit_in THEN
    FOREACH v_key IN ARRAY ARRAY['firstName','lastName','phone','preferredEmail','licenseType','employmentStatus'] LOOP
      IF trim(coalesce(packet_in->>v_key, '')) = '' THEN v_missing := v_missing || v_key; END IF;
    END LOOP;
    FOREACH v_key IN ARRAY ARRAY['policies','confidentiality','contractorAgreement'] LOOP
      IF coalesce(packet_in->'acknowledgments'->v_key->>'agreed', 'false') <> 'true'
         OR trim(coalesce(packet_in->'acknowledgments'->v_key->>'signature', '')) = '' THEN
        v_missing := v_missing || ('acknowledgments.' || v_key);
      END IF;
    END LOOP;
    IF array_length(v_missing, 1) > 0 THEN
      RETURN jsonb_build_object('status', v_pkt.status, 'submitted', false, 'missing', to_jsonb(v_missing));
    END IF;
  END IF;

  UPDATE public.tlc_onboarding_packets
     SET packet = packet_in,
         headshot_thumb = CASE WHEN headshot_in IS NULL THEN headshot_thumb WHEN headshot_in = '' THEN NULL ELSE headshot_in END,
         status = CASE WHEN submit_in THEN 'submitted' ELSE status END,
         submitted_at = CASE WHEN submit_in THEN now() ELSE submitted_at END,
         updated_at = now()
   WHERE id = v_pkt.id
   RETURNING * INTO v_pkt;

  IF submit_in THEN
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_pkt.instance_id, auth.uid(), 'status-change', 'tlc_onboarding_packet', v_pkt.id,
            jsonb_build_object('status', 'draft'), jsonb_build_object('status', 'submitted'), 'tlc_onboarding_save');
  END IF;

  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('submitted', submit_in);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_save(uuid, jsonb, text, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_save(uuid, jsonb, text, jsonb, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. The office lists its invites and packets -- the LIST never carries the
--    packet body or the headshot (DR-0303). Open one by id to read it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_list()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_office FROM public.tlc_onboarding_my_office();
  IF v_office.instance_id IS NULL OR coalesce(v_office.role, '') NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('office_name', v_office.office_name, 'manager', false, 'invites', '[]'::jsonb, 'packets', '[]'::jsonb);
  END IF;
  RETURN jsonb_build_object(
    'office_name', v_office.office_name,
    'manager', true,
    'invites', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'id', i.id, 'email', i.email, 'note', i.note, 'token', i.token,
               'created_at', i.created_at, 'expires_at', i.expires_at, 'revoked_at', i.revoked_at,
               'opened', EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = i.id))
             ORDER BY i.created_at DESC)
        FROM public.tlc_onboarding_invites i
       WHERE i.instance_id = v_office.instance_id
         AND i.revoked_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM public.tlc_onboarding_packets p WHERE p.invite_id = i.id)), '[]'::jsonb),
    'packets', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'packet_id', p.id, 'invite_id', p.invite_id, 'email', p.applicant_email,
               'status', p.status,
               'applicant_name', nullif(trim(concat_ws(' ', p.packet->>'firstName', p.packet->>'lastName')), ''),
               'preferred_name', p.packet->>'preferredName',
               'license_type', p.packet->>'licenseType',
               'submitted_at', p.submitted_at, 'reviewed_at', p.reviewed_at,
               'clinician_id', p.clinician_id, 'updated_at', p.updated_at, 'created_at', p.created_at)
             ORDER BY p.updated_at DESC)
        FROM public.tlc_onboarding_packets p
       WHERE p.instance_id = v_office.instance_id), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_list() TO authenticated;

-- An office read of a colleague's record is a data access and is logged
-- (DATA-AS-EMPOWERMENT behavior 6); a person reading their own is not.
CREATE OR REPLACE FUNCTION public.tlc_onboarding_read(packet_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt  public.tlc_onboarding_packets%ROWTYPE;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RETURN NULL; END IF;
  IF v_pkt.applicant_user_id <> auth.uid() THEN
    IF coalesce(public.user_role_in_instance(v_pkt.instance_id), '') NOT IN ('owner','admin') THEN
      RAISE EXCEPTION 'that packet is not yours to read';
    END IF;
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_pkt.instance_id, auth.uid(), 'export', 'tlc_onboarding_packet', v_pkt.id,
            NULL, jsonb_build_object('status', v_pkt.status), 'tlc_onboarding_read');
  END IF;
  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_read(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 10. Banking, revealed to the office owner/admin only, and every reveal is
--     written to the audit log with who and when.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_banking_read(packet_id_in uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt public.tlc_onboarding_packets%ROWTYPE;
  v_b   public.tlc_onboarding_banking%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RETURN NULL; END IF;
  IF coalesce(public.user_role_in_instance(v_pkt.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin may read banking details';
  END IF;
  SELECT * INTO v_b FROM public.tlc_onboarding_banking WHERE packet_id = v_pkt.id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'export-privileged', 'tlc_onboarding_packet', v_pkt.id,
          NULL, jsonb_build_object('revealed', v_b.packet_id IS NOT NULL), 'tlc_onboarding_banking_read');
  IF v_b.packet_id IS NULL THEN RETURN jsonb_build_object('present', false); END IF;
  RETURN jsonb_build_object('present', true, 'bank_name', v_b.bank_name, 'account_type', v_b.account_type,
                            'routing_number', v_b.routing_number, 'account_number', v_b.account_number,
                            'updated_at', v_b.updated_at);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_banking_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_banking_read(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 11. Review: approve writes the roster row; return sends it back with a note.
-- ---------------------------------------------------------------------------
-- roster_in (optional, approve only): the card Christina previewed -- name,
-- role, specialty, url, photo, bio. When present the public roster gets the
-- row (or the row for this packet is refreshed); absent, only the roster
-- table of clinicians is written.
CREATE OR REPLACE FUNCTION public.tlc_onboarding_review(packet_id_in uuid, decision_in text, note_in text DEFAULT NULL, roster_in jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt      public.tlc_onboarding_packets%ROWTYPE;
  v_name     text;
  v_display  text;
  v_expires  date;
  v_spec     text[];
  v_clin     uuid;
  v_created  boolean := false;
  v_roster   jsonb := NULL;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RAISE EXCEPTION 'no such packet'; END IF;
  IF coalesce(public.user_role_in_instance(v_pkt.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can review a packet';
  END IF;
  IF decision_in NOT IN ('approve','return') THEN RAISE EXCEPTION 'decision must be approve or return'; END IF;

  IF decision_in = 'return' THEN
    IF v_pkt.status = 'approved' THEN RAISE EXCEPTION 'an approved packet cannot be returned'; END IF;
    UPDATE public.tlc_onboarding_packets
       SET status = 'returned', reviewed_by = auth.uid(), reviewed_at = now(),
           review_note = nullif(trim(coalesce(note_in, '')), ''), updated_at = now()
     WHERE id = v_pkt.id RETURNING * INTO v_pkt;
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_pkt.instance_id, auth.uid(), 'status-change', 'tlc_onboarding_packet', v_pkt.id,
            jsonb_build_object('status', 'submitted'), jsonb_build_object('status', 'returned'), 'tlc_onboarding_review');
    SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
    RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('clinician_created', false);
  END IF;

  -- approve
  IF v_pkt.status = 'approved' THEN
    SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
    RETURN public.tlc_onboarding_packet_view(v_pkt, v_name) || jsonb_build_object('clinician_created', false);
  END IF;
  IF v_pkt.status <> 'submitted' THEN RAISE EXCEPTION 'only a submitted packet can be approved'; END IF;

  v_display := nullif(trim(coalesce(v_pkt.packet->>'preferredName', '')), '');
  IF v_display IS NULL THEN
    v_display := nullif(trim(concat_ws(' ', v_pkt.packet->>'firstName', v_pkt.packet->>'lastName')), '');
  END IF;
  IF v_display IS NULL THEN v_display := coalesce(v_pkt.applicant_email, 'New colleague'); END IF;

  v_expires := NULL;
  IF coalesce(v_pkt.packet->>'licenseExpiration', '') ~ '^\d{4}-\d{2}-\d{2}$' THEN
    v_expires := (v_pkt.packet->>'licenseExpiration')::date;
  END IF;
  SELECT coalesce(array_agg(x), '{}') INTO v_spec
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_pkt.packet->'specialties') = 'array'
                                        THEN v_pkt.packet->'specialties' ELSE '[]'::jsonb END) AS x;

  IF to_regclass('public.clinicians') IS NOT NULL THEN
    EXECUTE $q$
      INSERT INTO public.clinicians
        (instance_id, created_by, display_name, title, license_number, license_expires,
         specialties, user_id, intake_role, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'clinician-only', $9, 'active')
      RETURNING id $q$
      INTO v_clin
      USING v_pkt.instance_id, auth.uid(), v_display,
            nullif(trim(coalesce(v_pkt.packet->>'licenseType', '')), ''),
            nullif(trim(coalesce(v_pkt.packet->>'licenseNumber', '')), ''),
            v_expires, v_spec, v_pkt.applicant_user_id,
            'Onboarded through the in-app intake packet ' || v_pkt.id::text || ' on ' || to_char(now(), 'YYYY-MM-DD');
    v_created := v_clin IS NOT NULL;
  END IF;

  UPDATE public.tlc_onboarding_packets
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
         review_note = nullif(trim(coalesce(note_in, '')), ''), clinician_id = v_clin, updated_at = now()
   WHERE id = v_pkt.id RETURNING * INTO v_pkt;

  -- The public card, in the format the current ones use (4b).
  IF roster_in IS NOT NULL AND jsonb_typeof(roster_in) = 'object' AND trim(coalesce(roster_in->>'name', '')) <> '' THEN
    v_roster := public.tlc_roster_upsert(
      (roster_in - 'id') || jsonb_build_object(
        'packet_id', v_pkt.id, 'clinician_id', v_clin,
        'photo', coalesce(nullif(roster_in->>'photo', ''), v_pkt.headshot_thumb),
        'bio', coalesce(nullif(roster_in->>'bio', ''), v_pkt.packet->>'bio')));
  END IF;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'status-change', 'tlc_onboarding_packet', v_pkt.id,
          jsonb_build_object('status', 'submitted'),
          jsonb_build_object('status', 'approved', 'clinician_id', v_clin, 'roster_id', v_roster->>'id'), 'tlc_onboarding_review');

  SELECT display_name INTO v_name FROM instances WHERE id = v_pkt.instance_id;
  RETURN public.tlc_onboarding_packet_view(v_pkt, v_name)
         || jsonb_build_object('clinician_created', v_created, 'roster', v_roster);
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_review(uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_review(uuid, text, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 12. Deletion is immediate and verifiable (DATA-AS-EMPOWERMENT behavior 7):
--     the colleague withdraws their own packet; the office removes one it
--     holds. Both are hard deletes (banking cascades; the client removes the
--     bucket objects first, which the delete policies above allow). An
--     approved packet's roster row is the office's record and stays; the
--     personal body (address, birth date, banking, documents) goes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tlc_onboarding_withdraw(packet_id_in uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt public.tlc_onboarding_packets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RETURN false; END IF;
  IF v_pkt.applicant_user_id <> auth.uid() THEN RAISE EXCEPTION 'that packet is not yours'; END IF;
  DELETE FROM public.tlc_onboarding_packets WHERE id = v_pkt.id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'delete', 'tlc_onboarding_packet', v_pkt.id,
          jsonb_build_object('status', v_pkt.status), NULL, 'tlc_onboarding_withdraw');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_withdraw(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_withdraw(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.tlc_onboarding_delete(packet_id_in uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pkt public.tlc_onboarding_packets%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT * INTO v_pkt FROM public.tlc_onboarding_packets WHERE id = packet_id_in;
  IF v_pkt.id IS NULL THEN RETURN false; END IF;
  IF coalesce(public.user_role_in_instance(v_pkt.instance_id), '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the office owner or admin can remove a packet';
  END IF;
  DELETE FROM public.tlc_onboarding_packets WHERE id = v_pkt.id;
  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_pkt.instance_id, auth.uid(), 'delete', 'tlc_onboarding_packet', v_pkt.id,
          jsonb_build_object('status', v_pkt.status, 'applicant', v_pkt.applicant_email), NULL, 'tlc_onboarding_delete');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.tlc_onboarding_delete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlc_onboarding_delete(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 13. The two overlays cover the three new instance-scoped tables: an
--     assistant (0130) and a viewer (0125) are denied on all of them.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
