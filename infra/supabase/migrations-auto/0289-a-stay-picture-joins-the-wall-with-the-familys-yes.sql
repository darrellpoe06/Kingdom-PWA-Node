-- =============================================================================
-- 0289 — A STAY PICTURE JOINS THE WALL WITH THE FAMILY'S YES (DR-1010)
-- =============================================================================
-- The task as spoken: "Tenant and guest stay pictures: a community wall ('Life
-- at 805') plus advertising, with a signed rights assignment and the family's
-- approval."
--
-- WHAT EXISTS. property_photos (0153) is the FAMILY's record of a door, filed by
-- the family and its workers; a stranger sees only kind='listing' through
-- public_vacancy_photos. A tenant can file a picture to a work order (0263) and
-- a paper to their tenancy (DR-0936). A guest can report a problem from inside
-- the door with no account (0261). The house's signing pattern — a typed legal
-- name, an attestation, the exact words signed, e-sign consent, the device
-- clock AND the server clock — is 0263's. NOTHING lets a tenant or a guest hand
-- the family a picture of life at the property, and nothing lets the family
-- show one to the world with the rights to do so on the record.
--
-- THE SHAPE.
--   * THE WORDING is a row (stay_wall_wordings), versioned, fingerprinted by
--     the database (SHA-256 of the exact text). A signature names the version
--     AND the fingerprint of the words the signer's screen showed; a different
--     fingerprint is refused, so nobody signs words other than the ones on
--     file. A new wording is a new version row, never a rewrite.
--   * THE COUNSEL RULE (documents.js, DR-0936): the wording is a DRAFT until
--     counsel attests it, per family (stay_wall_wording_attestations). The
--     community wall runs on the draft — it is the family's own wall. USING a
--     picture in ADVERTISING (the listing) waits on the attestation, because
--     that is where the assignment of rights is relied on.
--   * A SUBMISSION (stay_pictures) is signed over at the moment it is made:
--     the three attestations (my own pictures; everyone pictured agreed; no
--     minors without a parent), the typed name as the signature, the wording
--     version + fingerprint, the attestation and consent sentences, the
--     device time and the server instant. A tenant, a household member, a
--     confirmed guest with an account, and the family submit signed in; a
--     guest with no account submits through the door's guest card (0261's
--     key), rate-limited like the guest report.
--   * MODERATION is the family's: pending → approved / declined; removed at
--     any time. The poster may ASK for a take-down, and the picture leaves the
--     public wall and any listing the moment they ask — the family keeps the
--     file as a record of the stay. Every move is on the clock (door_events).
--   * THE PUBLIC WALL is per PROPERTY (the building: one family, one street
--     address), read by anon without the bytes (public_stay_walls: the
--     thumbnails, at most 24 newest a wall) and one picture at a time with
--     them (public_stay_wall_image). The wall is named "Life at 805" when the
--     family shows the street and "Life at this home" when they hold it
--     (DR-0977), and it is returned only for a building with a listed door.
--   * SELECTABLE FOR LISTINGS: the family copies an approved picture into the
--     door's own listing pictures (property_photos, kind='listing', source
--     'wall:<id>'), so it orders, archives and travels (DR-1006) like every
--     other listing picture; un-selecting archives the copy, re-selecting
--     brings the same copy back. 0285's source shape gains the 'wall:' form.
--
-- NOTHING ON THE CLIENT WRITES A ROW: the tables carry SELECT only; every
-- write is a SECURITY DEFINER function with its own refusals. IDEMPOTENT.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The wording, versioned and fingerprinted by the database.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stay_wall_wordings (
  version     text PRIMARY KEY,
  body        text NOT NULL CHECK (length(body) BETWEEN 200 AND 20000),
  body_hash   text NOT NULL DEFAULT '',
  is_current  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stay_wall_wordings IS
  'DR-1010: the rights assignment a poster signs when sharing a stay picture. One row per version, never rewritten; body_hash is SHA-256 of the exact words, set by the database. The app signs the version and the hash of what it showed.';

CREATE OR REPLACE FUNCTION public.stay_wall_wordings_fingerprint()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.body_hash := encode(sha256(convert_to(NEW.body, 'UTF8')), 'hex');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS stay_wall_wordings_fingerprint ON public.stay_wall_wordings;
CREATE TRIGGER stay_wall_wordings_fingerprint
  BEFORE INSERT OR UPDATE ON public.stay_wall_wordings
  FOR EACH ROW EXECUTE FUNCTION public.stay_wall_wordings_fingerprint();

-- Exactly one current wording.
CREATE UNIQUE INDEX IF NOT EXISTS stay_wall_wordings_one_current
  ON public.stay_wall_wordings ((true)) WHERE is_current;

REVOKE ALL ON public.stay_wall_wordings FROM anon, authenticated;
GRANT SELECT ON public.stay_wall_wordings TO anon, authenticated;
ALTER TABLE public.stay_wall_wordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stay_wall_wordings_read ON public.stay_wall_wordings;
CREATE POLICY stay_wall_wordings_read ON public.stay_wall_wordings FOR SELECT TO anon, authenticated USING (true);

-- The words. Plain ASCII on purpose: the app carries the same text
-- (stay-wall.js) and a test proves the two are byte-for-byte the same, so the
-- fingerprint the signer sends is the fingerprint the database holds.
-- stay-wall-wording-v1-begin
INSERT INTO public.stay_wall_wordings (version, body, is_current) VALUES ('v1', $wording$Rights assignment for a picture shared on the Life wall

1. What I am giving. I assign to the owner of this property (the "Family") all right, title and interest, including copyright, in each picture I submit with this form, together with its caption. This assignment is made under 17 U.S.C. 204(a) and is signed electronically under the federal E-SIGN Act (15 U.S.C. 7001) and the Illinois Electronic Commerce Security Act.

2. What the Family may do. The Family may show these pictures on the community wall for this property, in its advertising and listings for this property, and on the Poe Properties and PoeTech surfaces that carry them, with or without my name as I have chosen on this form, now and in the future, without payment to me.

3. What I promise. I took these pictures myself, or I hold the rights to them and may assign them. Everyone who can be recognized in them has agreed to be shown. No one under eighteen appears in them unless a parent or guardian agreed. The pictures show nothing unlawful and nothing of another resident's private space without that resident's agreement.

4. What stays with me. I may ask at any time that a picture be taken down, and it will leave the public wall and any listing when I ask. The Family keeps the file as a record of the stay. The Family may decline or remove a picture at any time.

5. The record. My typed name on this form is my signature. The app records the version of these words, their fingerprint, the time on my device and the time on the server with each picture.$wording$, true)
ON CONFLICT (version) DO NOTHING;
-- stay-wall-wording-v1-end

-- Counsel's attestation is per family (per instance): the family's counsel
-- reviews the wording the family relies on. A wording with no attestation for
-- an instance is a draft there (the counsel rule).
CREATE TABLE IF NOT EXISTS public.stay_wall_wording_attestations (
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  version      text NOT NULL REFERENCES public.stay_wall_wordings(version),
  attested_by  uuid NOT NULL,
  attested_at  timestamptz NOT NULL DEFAULT clock_timestamp(),
  note         text CHECK (note IS NULL OR length(note) <= 300),
  PRIMARY KEY (instance_id, version)
);
COMMENT ON TABLE public.stay_wall_wording_attestations IS
  'DR-1010: the family''s recorded attestation that counsel reviewed a wording version (who, when). Until a row exists the wording is a draft for that family: the wall runs, advertising use waits.';
REVOKE ALL ON public.stay_wall_wording_attestations FROM anon, authenticated;
GRANT SELECT ON public.stay_wall_wording_attestations TO authenticated;
ALTER TABLE public.stay_wall_wording_attestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stay_wall_wording_attestations_read ON public.stay_wall_wording_attestations;
CREATE POLICY stay_wall_wording_attestations_read ON public.stay_wall_wording_attestations FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner', 'admin', 'member'));

-- ---------------------------------------------------------------------------
-- 2. The pictures, signed over at submission.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stay_pictures (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  rental_id        uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  submitted_by     uuid REFERENCES auth.users(id),      -- NULL: through the door's guest card
  submitted_role   text NOT NULL CHECK (submitted_role IN ('tenant', 'household', 'guest', 'family')),
  poster_name      text NOT NULL CHECK (length(btrim(poster_name)) BETWEEN 2 AND 120),
  show_name        boolean NOT NULL DEFAULT false,
  caption          text NOT NULL DEFAULT '' CHECK (length(caption) <= 300),
  image            text NOT NULL CHECK (image ~ '^data:image/(jpeg|png|webp);base64,' AND length(image) <= 4200000),
  thumb            text CHECK (thumb IS NULL OR (thumb ~ '^data:image/(jpeg|png|webp);base64,' AND length(thumb) <= 200000)),
  taken_at         timestamptz CHECK (taken_at IS NULL OR taken_at > timestamptz '1900-01-01'),
  -- The three things the poster says are true. The CHECK is the wall; the
  -- function says it in words first.
  attests_own      boolean NOT NULL CHECK (attests_own),
  attests_consent  boolean NOT NULL CHECK (attests_consent),
  attests_minors   boolean NOT NULL CHECK (attests_minors),
  -- The signature: the words signed, by version and fingerprint, the two
  -- sentences agreed to, the device clock and the server clock.
  wording_version  text NOT NULL REFERENCES public.stay_wall_wordings(version),
  wording_hash     text NOT NULL CHECK (wording_hash ~ '^[0-9a-f]{64}$'),
  attestation      text NOT NULL CHECK (length(btrim(attestation)) BETWEEN 20 AND 600),
  consent          text NOT NULL CHECK (length(btrim(consent)) BETWEEN 20 AND 600),
  signed_on_device_at timestamptz,
  signed_at        timestamptz NOT NULL DEFAULT clock_timestamp(),
  -- The family's decision, and the poster's ask.
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'removed')),
  decided_by       uuid,
  decided_at       timestamptz,
  decline_reason   text CHECK (decline_reason IS NULL OR length(decline_reason) <= 300),
  removal_asked_at timestamptz,
  removed_by       uuid,
  removed_at       timestamptz,
  removed_reason   text CHECK (removed_reason IS NULL OR length(removed_reason) <= 300),
  -- The listing copy, when the family selected it for advertising.
  listing_photo_id uuid REFERENCES public.property_photos(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stay_pictures_door_idx ON public.stay_pictures(rental_id, status, created_at);
CREATE INDEX IF NOT EXISTS stay_pictures_instance_idx ON public.stay_pictures(instance_id, status);
CREATE INDEX IF NOT EXISTS stay_pictures_poster_idx ON public.stay_pictures(submitted_by) WHERE submitted_by IS NOT NULL;
COMMENT ON TABLE public.stay_pictures IS
  'DR-1010: a picture of life at the property, handed to the family by a tenant, a household member or a guest, signed over (rights assignment by version + fingerprint, three attestations, device and server clocks) at submission. The family approves, declines or removes; the poster may ask for a take-down. Written only by the stay_wall_* functions; the family reads its own, a poster reads theirs.';

DROP TRIGGER IF EXISTS stay_pictures_door_in_instance ON public.stay_pictures;
CREATE TRIGGER stay_pictures_door_in_instance
  BEFORE INSERT OR UPDATE ON public.stay_pictures
  FOR EACH ROW EXECUTE FUNCTION public.door_row_in_its_instance();

REVOKE ALL ON public.stay_pictures FROM anon, authenticated;
GRANT SELECT ON public.stay_pictures TO authenticated;
ALTER TABLE public.stay_pictures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stay_pictures_family_read ON public.stay_pictures;
CREATE POLICY stay_pictures_family_read ON public.stay_pictures FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner', 'admin', 'member'));
DROP POLICY IF EXISTS stay_pictures_my_own ON public.stay_pictures;
CREATE POLICY stay_pictures_my_own ON public.stay_pictures FOR SELECT TO authenticated
  USING (submitted_by IS NOT NULL AND submitted_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. The clock: 'stay-picture' joins door_events (0279: an allow-list is added
--    to, never rewritten — the union is carried) and gets its read arm.
-- ---------------------------------------------------------------------------
ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
ALTER TABLE public.door_events ADD CONSTRAINT door_events_subject_check
  CHECK (subject IN ('rent', 'work', 'document', 'camera', 'stay', 'application', 'portal-request', 'stay-picture'));

DO $$
DECLARE
  arms text;
  has_portal boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'tenant_portal_requests')
    INTO has_portal;
  arms :=
    '    WHEN ''rent'' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)' || E'\n' ||
    '    WHEN ''work'' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)' || E'\n' ||
    '    WHEN ''document'' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)' || E'\n' ||
    '    WHEN ''camera'' THEN EXISTS (SELECT 1 FROM door_camera_access a WHERE a.id = subject_id)' || E'\n' ||
    '    WHEN ''stay'' THEN EXISTS (SELECT 1 FROM door_stays s WHERE s.id = subject_id)' || E'\n' ||
    '    WHEN ''stay-picture'' THEN EXISTS (SELECT 1 FROM stay_pictures p WHERE p.id = subject_id)' || E'\n';
  IF has_portal THEN
    arms := arms ||
      '    WHEN ''portal-request'' THEN EXISTS (SELECT 1 FROM tenant_portal_requests p WHERE p.id = subject_id)' || E'\n';
  END IF;
  EXECUTE 'DROP POLICY IF EXISTS door_events_read ON public.door_events';
  EXECUTE
    'CREATE POLICY door_events_read ON public.door_events FOR SELECT TO authenticated' || E'\n' ||
    '  USING (CASE subject' || E'\n' || arms || '    ELSE false END)';
END $$;

-- ---------------------------------------------------------------------------
-- 4. A listing copy says where it came from: 0285's source shape gains
--    'wall:<stay picture id>'. One door files one wall picture once
--    (property_photos_source_once); un-selecting archives the copy and
--    re-selecting brings the same copy back.
-- ---------------------------------------------------------------------------
ALTER TABLE public.property_photos DROP CONSTRAINT IF EXISTS property_photos_source_shape;
ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_source_shape
  CHECK (source IS NULL
         OR source ~ '^nas:[A-Za-z0-9._-]{1,64}:[A-Za-z0-9._ -]{1,160}$'
         OR source ~ '^wall:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- ---------------------------------------------------------------------------
-- 5. The wording, as the signer's screen reads it: the current version, its
--    words, its fingerprint, and whether this door's family has counsel's
--    attestation on it. Anyone may read it (a guest with no account signs it).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stay_wall_wording(p_rental uuid DEFAULT NULL)
RETURNS TABLE (version text, body text, body_hash text, counsel_attested boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.version, w.body, w.body_hash,
         EXISTS (SELECT 1 FROM stay_wall_wording_attestations a
                   JOIN rentals r ON r.instance_id = a.instance_id
                  WHERE r.id = p_rental AND a.version = w.version) AS counsel_attested
    FROM stay_wall_wordings w
   WHERE w.is_current
   LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.stay_wall_wording(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_wording(uuid) TO anon, authenticated;

-- The family (owner or admin) records that counsel reviewed a version.
CREATE OR REPLACE FUNCTION public.stay_wall_wording_attest(p_instance uuid, p_version text, p_note text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR coalesce(user_role_in_instance(p_instance), '') NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'only the family records that counsel reviewed the wording' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM stay_wall_wordings WHERE version = p_version) THEN
    RAISE EXCEPTION 'no such wording version (%)', p_version;
  END IF;
  INSERT INTO stay_wall_wording_attestations (instance_id, version, attested_by, note)
  VALUES (p_instance, p_version, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''))
  ON CONFLICT (instance_id, version) DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_wording_attest(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_wording_attest(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Submitting: the one insert, shared by the signed-in road and the guest
--    card. Refuses in words before the CHECKs would.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stay_wall_file(
  p_rental uuid, p_instance uuid, p_by uuid, p_role text,
  p_image text, p_thumb text, p_caption text, p_poster_name text, p_show_name boolean,
  p_attests_own boolean, p_attests_consent boolean, p_attests_minors boolean,
  p_wording_version text, p_wording_hash text, p_attestation text, p_consent text,
  p_device_at timestamptz, p_taken_at timestamptz)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w record; v_id uuid; v_label text;
BEGIN
  IF NOT (coalesce(p_attests_own, false) AND coalesce(p_attests_consent, false) AND coalesce(p_attests_minors, false)) THEN
    RAISE EXCEPTION 'say that each of the three things is true: these are your own pictures, everyone pictured agreed, and no one under eighteen is shown without a parent''s agreement';
  END IF;
  IF length(btrim(coalesce(p_poster_name, ''))) < 2 THEN
    RAISE EXCEPTION 'type your full name: it is your signature';
  END IF;
  IF coalesce(p_image, '') !~ '^data:image/(jpeg|png|webp);base64,' THEN
    RAISE EXCEPTION 'the picture did not come through as an image; choose it again';
  END IF;
  IF length(p_image) > 4200000 THEN
    RAISE EXCEPTION 'that picture is too large for this form; the app shrinks pictures before sending, so try choosing it again';
  END IF;
  SELECT * INTO w FROM stay_wall_wordings WHERE is_current LIMIT 1;
  IF w.version IS NULL THEN RAISE EXCEPTION 'no wording is current; the family must set one'; END IF;
  IF p_wording_version IS DISTINCT FROM w.version OR p_wording_hash IS DISTINCT FROM w.body_hash THEN
    RAISE EXCEPTION 'the wording changed or did not load completely; reopen the form and read it again before signing';
  END IF;
  IF length(btrim(coalesce(p_attestation, ''))) < 20 OR length(btrim(coalesce(p_consent, ''))) < 20 THEN
    RAISE EXCEPTION 'the signature must carry what was agreed to';
  END IF;
  INSERT INTO stay_pictures
    (instance_id, rental_id, submitted_by, submitted_role, poster_name, show_name, caption, image, thumb, taken_at,
     attests_own, attests_consent, attests_minors, wording_version, wording_hash, attestation, consent, signed_on_device_at)
  VALUES
    (p_instance, p_rental, p_by, p_role, btrim(p_poster_name), coalesce(p_show_name, false),
     left(btrim(coalesce(p_caption, '')), 300), p_image, nullif(p_thumb, ''), p_taken_at,
     true, true, true, w.version, w.body_hash, btrim(p_attestation), btrim(p_consent), p_device_at)
  RETURNING id INTO v_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
  VALUES (p_instance, 'stay-picture', v_id, 'submitted', 'pending',
          jsonb_strip_nulls(jsonb_build_object('rental_id', p_rental, 'by_role', p_role, 'wording', w.version,
            'wording_hash', w.body_hash, 'on_device_at', p_device_at, 'show_name', coalesce(p_show_name, false))), p_by);
  -- Tell the family (never the guest's words; the office chooses the audience).
  IF p_role <> 'family' THEN
    BEGIN
      SELECT coalesce(nullif(r.display_name, ''), r.address) INTO v_label FROM rentals r WHERE r.id = p_rental;
      IF to_regclass('public.push_outbox') IS NOT NULL THEN
        EXECUTE 'INSERT INTO public.push_outbox (instance_id, kind, title, body, target_role) VALUES ($1, $2, $3, $4, $5)'
          USING p_instance, 'stay_picture', 'A picture was shared for the Life wall',
                'At ' || coalesce(v_label, 'a door') || '. Open the Life wall for that door to approve it.', 'owner_admin';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_file(uuid, uuid, uuid, text, text, text, text, text, boolean, boolean, boolean, boolean, text, text, text, text, timestamptz, timestamptz) FROM PUBLIC;

-- Signed in: a tenant, a household member, a guest with a confirmed stay on
-- this door, or the family.
CREATE OR REPLACE FUNCTION public.stay_wall_submit(
  p_rental uuid, p_image text, p_thumb text, p_caption text, p_poster_name text, p_show_name boolean,
  p_attests_own boolean, p_attests_consent boolean, p_attests_minors boolean,
  p_wording_version text, p_wording_hash text, p_attestation text, p_consent text,
  p_device_at timestamptz DEFAULT NULL, p_taken_at timestamptz DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role text; v_instance uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in to share a picture' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT r.instance_id INTO v_instance FROM rentals r WHERE r.id = p_rental;
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no such door' USING ERRCODE = 'insufficient_privilege'; END IF;
  -- NULL for a stranger: coalesce it, or NOT IN is NULL and the gate is skipped
  -- (caught by the smoke's stranger case on the first local run).
  v_role := coalesce(door_role_of_user(p_rental), '');
  IF v_role NOT IN ('family', 'tenant', 'household') THEN
    IF EXISTS (SELECT 1 FROM door_stays s WHERE s.rental_id = p_rental AND s.kind = 'stay'
                  AND s.status = 'confirmed' AND s.requested_by = auth.uid()) THEN
      v_role := 'guest';
    ELSE
      RAISE EXCEPTION 'only someone who lives here, stays here, or the family can share a picture of this place' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN stay_wall_file(p_rental, v_instance, auth.uid(), v_role,
    p_image, p_thumb, p_caption, p_poster_name, p_show_name,
    p_attests_own, p_attests_consent, p_attests_minors,
    p_wording_version, p_wording_hash, p_attestation, p_consent, p_device_at, p_taken_at);
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_submit(uuid, text, text, text, text, boolean, boolean, boolean, boolean, text, text, text, text, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_submit(uuid, text, text, text, text, boolean, boolean, boolean, boolean, text, text, text, text, timestamptz, timestamptz) TO authenticated;

-- Through the door's guest card (0261): no account, the key says which door;
-- rate-limited the way the guest report is.
CREATE OR REPLACE FUNCTION public.stay_wall_submit_as_guest(
  p_token text, p_image text, p_thumb text, p_caption text, p_poster_name text, p_show_name boolean,
  p_attests_own boolean, p_attests_consent boolean, p_attests_minors boolean,
  p_wording_version text, p_wording_hash text, p_attestation text, p_consent text,
  p_device_at timestamptz DEFAULT NULL, p_taken_at timestamptz DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rental uuid; v_instance uuid;
BEGIN
  SELECT g.rental_id, g.instance_id INTO v_rental, v_instance
    FROM door_guest_links g WHERE g.token = lower(trim(coalesce(p_token, '')));
  IF v_rental IS NULL THEN
    RAISE EXCEPTION 'This card is not active. Please contact your host directly.';
  END IF;
  IF (SELECT count(*) FROM stay_pictures WHERE rental_id = v_rental AND submitted_by IS NULL AND created_at > now() - interval '1 hour') >= 5
     OR (SELECT count(*) FROM stay_pictures WHERE rental_id = v_rental AND submitted_by IS NULL AND created_at > now() - interval '1 day') >= 20 THEN
    RAISE EXCEPTION 'Several pictures have already come from this place recently. Please try again later, or text your host.';
  END IF;
  RETURN stay_wall_file(v_rental, v_instance, NULL, 'guest',
    p_image, p_thumb, p_caption, p_poster_name, p_show_name,
    p_attests_own, p_attests_consent, p_attests_minors,
    p_wording_version, p_wording_hash, p_attestation, p_consent, p_device_at, p_taken_at);
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_submit_as_guest(text, text, text, text, text, boolean, boolean, boolean, boolean, text, text, text, text, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_submit_as_guest(text, text, text, text, text, boolean, boolean, boolean, boolean, text, text, text, text, timestamptz, timestamptz) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. The family decides; the poster asks; the listing copy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stay_wall_family_row(p_id uuid)
RETURNS public.stay_pictures
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures;
BEGIN
  SELECT * INTO p FROM stay_pictures WHERE id = p_id;
  IF p.id IS NULL OR auth.uid() IS NULL OR coalesce(user_role_in_instance(p.instance_id), '') NOT IN ('owner', 'admin', 'member') THEN
    RAISE EXCEPTION 'only the family decides about a picture on its wall' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN p;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_family_row(uuid) FROM PUBLIC;

-- Archive this picture's listing copy, if it has one. (property_photos has no
-- DELETE, ever: archived_at is the removal, 0154.)
CREATE OR REPLACE FUNCTION public.stay_wall_unlist(p public.stay_pictures, p_by uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p.listing_photo_id IS NOT NULL THEN
    UPDATE property_photos SET archived_at = clock_timestamp(), archived_by = p_by
     WHERE id = p.listing_photo_id AND archived_at IS NULL;
    UPDATE stay_pictures SET listing_photo_id = NULL WHERE id = p.id;
    INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, by_user)
    VALUES (p.instance_id, 'stay-picture', p.id, 'listing', 'off', p_by);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_unlist(public.stay_pictures, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.stay_wall_decide(p_id uuid, p_decision text, p_reason text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures;
BEGIN
  p := stay_wall_family_row(p_id);
  IF p_decision NOT IN ('approved', 'declined') THEN RAISE EXCEPTION 'approve it or decline it'; END IF;
  IF p.status NOT IN ('pending', 'approved', 'declined') THEN RAISE EXCEPTION 'that picture was removed (%)', p.status; END IF;
  IF p.status = p_decision THEN RETURN p.status; END IF;
  IF p_decision = 'declined' THEN PERFORM stay_wall_unlist(p, auth.uid()); END IF;
  UPDATE stay_pictures
     SET status = p_decision, decided_by = auth.uid(), decided_at = clock_timestamp(),
         decline_reason = CASE WHEN p_decision = 'declined' THEN nullif(left(btrim(coalesce(p_reason, '')), 300), '') END
   WHERE id = p_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, from_value, to_value, detail, by_user)
  VALUES (p.instance_id, 'stay-picture', p_id, 'status', p.status, p_decision,
          jsonb_strip_nulls(jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), ''))), auth.uid());
  RETURN p_decision;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_decide(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_decide(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.stay_wall_remove(p_id uuid, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures;
BEGIN
  p := stay_wall_family_row(p_id);
  IF p.status = 'removed' THEN RETURN true; END IF;
  PERFORM stay_wall_unlist(p, auth.uid());
  UPDATE stay_pictures
     SET status = 'removed', removed_by = auth.uid(), removed_at = clock_timestamp(),
         removed_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), '')
   WHERE id = p_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, from_value, to_value, detail, by_user)
  VALUES (p.instance_id, 'stay-picture', p_id, 'status', p.status, 'removed',
          jsonb_strip_nulls(jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), ''))), auth.uid());
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_remove(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_remove(uuid, text) TO authenticated;

-- The poster asks: it leaves the public wall and any listing at once. The
-- family keeps the file as a record of the stay and may remove it for good.
CREATE OR REPLACE FUNCTION public.stay_wall_ask_removal(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures;
BEGIN
  SELECT * INTO p FROM stay_pictures WHERE id = p_id;
  IF p.id IS NULL OR auth.uid() IS NULL OR p.submitted_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'only the person who shared a picture can ask for it to be taken down' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p.removal_asked_at IS NOT NULL THEN RETURN true; END IF;
  PERFORM stay_wall_unlist(p, auth.uid());
  UPDATE stay_pictures SET removal_asked_at = clock_timestamp() WHERE id = p_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, by_user)
  VALUES (p.instance_id, 'stay-picture', p_id, 'removal-asked', auth.uid());
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_ask_removal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_ask_removal(uuid) TO authenticated;

-- A guest with no account asks with the card's key and the id their own
-- submission returned: the pair is the proof.
CREATE OR REPLACE FUNCTION public.stay_wall_ask_removal_as_guest(p_token text, p_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures; v_rental uuid;
BEGIN
  SELECT g.rental_id INTO v_rental FROM door_guest_links g WHERE g.token = lower(trim(coalesce(p_token, '')));
  SELECT * INTO p FROM stay_pictures WHERE id = p_id;
  IF v_rental IS NULL OR p.id IS NULL OR p.rental_id <> v_rental OR p.submitted_by IS NOT NULL THEN
    RAISE EXCEPTION 'That picture is not one shared from this card.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p.removal_asked_at IS NOT NULL THEN RETURN true; END IF;
  PERFORM stay_wall_unlist(p, NULL);
  UPDATE stay_pictures SET removal_asked_at = clock_timestamp() WHERE id = p_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, detail)
  VALUES (p.instance_id, 'stay-picture', p_id, 'removal-asked', jsonb_build_object('by', 'guest card'));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_ask_removal_as_guest(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_ask_removal_as_guest(text, uuid) TO anon, authenticated;

-- Selected for the listing: a real listing picture of the door (kind
-- 'listing', source 'wall:<id>'), under the counsel rule.
CREATE OR REPLACE FUNCTION public.stay_wall_use_in_listing(p_id uuid, p_on boolean)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p public.stay_pictures; v_photo uuid; v_src text;
BEGIN
  p := stay_wall_family_row(p_id);
  IF NOT coalesce(p_on, false) THEN
    PERFORM stay_wall_unlist(p, auth.uid());
    RETURN NULL;
  END IF;
  IF p.status <> 'approved' THEN RAISE EXCEPTION 'approve the picture first; only an approved picture goes in a listing'; END IF;
  IF p.removal_asked_at IS NOT NULL THEN RAISE EXCEPTION 'the person who shared it asked for it to be taken down; it does not go in a listing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM stay_wall_wording_attestations a WHERE a.instance_id = p.instance_id AND a.version = p.wording_version) THEN
    RAISE EXCEPTION 'the wording this picture was signed under (%) is a draft until counsel reviews it; record that counsel reviewed it, then use it in a listing', p.wording_version;
  END IF;
  IF p.listing_photo_id IS NOT NULL THEN RETURN p.listing_photo_id; END IF;
  v_src := 'wall:' || p.id::text;
  -- The same copy comes back if it was archived by an earlier un-select.
  SELECT id INTO v_photo FROM property_photos WHERE rental_ref = p.rental_id AND source = v_src;
  IF v_photo IS NOT NULL THEN
    UPDATE property_photos SET archived_at = NULL, archived_by = NULL WHERE id = v_photo;
  ELSE
    INSERT INTO property_photos (instance_id, rental_ref, kind, caption, storage_path, thumb_path, taken_at, uploaded_by, author_label, source)
    VALUES (p.instance_id, p.rental_id, 'listing', p.caption, p.image, p.thumb,
            CASE WHEN p.taken_at IS NOT NULL AND p.taken_at <= now() THEN p.taken_at END,
            auth.uid(),
            CASE WHEN p.show_name THEN p.poster_name ELSE CASE p.submitted_role WHEN 'guest' THEN 'a guest' WHEN 'family' THEN 'the family' ELSE 'a resident' END END,
            v_src)
    RETURNING id INTO v_photo;
  END IF;
  UPDATE stay_pictures SET listing_photo_id = v_photo WHERE id = p_id;
  INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
  VALUES (p.instance_id, 'stay-picture', p_id, 'listing', 'on', jsonb_build_object('photo_id', v_photo), auth.uid());
  RETURN v_photo;
END $$;
REVOKE ALL ON FUNCTION public.stay_wall_use_in_listing(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stay_wall_use_in_listing(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. The public wall: per property, for anyone, without the bytes; then one
--    picture at a time with them.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_stay_walls()
RETURNS TABLE (
  id          uuid,
  wall_key    text,
  wall_label  text,
  door_ids    uuid[],
  unit        text,
  caption     text,
  poster      text,
  thumb       text,
  shown_at    timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH buildings AS (
    -- One wall per family per street address. Named after the house number
    -- when the family shows the street on any door of it (DR-0977), and
    -- "this home" when they hold it. Only buildings with a listed door.
    SELECT r.instance_id, lower(btrim(r.address)) AS addr,
           md5(r.instance_id::text || ':' || lower(btrim(r.address))) AS wall_key,
           CASE WHEN bool_or(public.rental_address_is_public(r.address_visibility))
                THEN 'Life at ' || CASE WHEN split_part(btrim(min(r.address)), ' ', 1) ~ '^[0-9]+[A-Za-z]?$'
                                        THEN split_part(btrim(min(r.address)), ' ', 1) ELSE btrim(min(r.address)) END
                ELSE 'Life at this home' END AS wall_label,
           array_agg(r.id) FILTER (WHERE r.listed_at IS NOT NULL) AS door_ids
      FROM rentals r
     WHERE coalesce(btrim(r.address), '') <> ''
     GROUP BY r.instance_id, lower(btrim(r.address))
    HAVING count(*) FILTER (WHERE r.listed_at IS NOT NULL) > 0
  ),
  shown AS (
    SELECT p.id, b.wall_key, b.wall_label, b.door_ids, nullif(btrim(r.unit), '') AS unit, p.caption,
           CASE WHEN p.show_name THEN p.poster_name ELSE NULL END AS poster,
           p.thumb, p.decided_at AS shown_at,
           row_number() OVER (PARTITION BY b.wall_key ORDER BY p.decided_at DESC, p.id) AS n
      FROM stay_pictures p
      JOIN rentals r ON r.id = p.rental_id
      JOIN buildings b ON b.instance_id = r.instance_id AND b.addr = lower(btrim(r.address))
     WHERE p.status = 'approved' AND p.removal_asked_at IS NULL AND p.removed_at IS NULL
  )
  SELECT id, wall_key, wall_label, door_ids, unit, caption, poster, thumb, shown_at
    FROM shown WHERE n <= 24
   ORDER BY wall_key, shown_at DESC
$$;
REVOKE ALL ON FUNCTION public.public_stay_walls() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_stay_walls() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_stay_wall_image(p_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.image FROM stay_pictures p
   WHERE p.id = p_id AND p.status = 'approved' AND p.removal_asked_at IS NULL AND p.removed_at IS NULL
$$;
REVOKE ALL ON FUNCTION public.public_stay_wall_image(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_stay_wall_image(uuid) TO anon, authenticated;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
