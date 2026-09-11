-- =============================================================================
-- 0207 — POE PROPERTIES RUNS IN ITS OWN INSTANCE (DR-0365)
-- =============================================================================
-- Darrell 2026-09-11, answering the open tenancy question: "yes. Poe Properties
-- gets it's own instance".
--
-- BEFORE (measured live 2026-09-11, not read off a schema file):
--   * All 12 doors live in `poe-family`. There is NO landlord instance.
--   * Of 19 property-scoped tables carrying instance_id, only two hold rows:
--     rentals (12) and property_notes (4). The other 17 are empty, so this
--     move is nearly all structure and almost no data — the same favourable
--     shape the TLC move had (DR-0351).
--   * 11 of the 12 doors point at the entity `e-poeprops` (Poe Properties
--     LLC); 1 points at `e-personal`.
--
-- THREE HAZARDS THE TRACE FOUND, each handled below rather than discovered in
-- production:
--
--   (a) THE TIER CAP. `rentals_tier_enforce` raises when an instance on the
--       `landlord` tier holds more than 10 ACTIVE doors — and 11 of these are
--       active. The trigger returns early when `instance_active_tier()` is
--       NULL, and a brand-new instance has no `instance_subscriptions` row, so
--       the move itself succeeds. But the landmine is real: the day this
--       instance is given an active `landlord` subscription, EVERY write to
--       rentals starts failing with "maximum 10 active doors (currently 11)".
--       That is a pricing decision, not a schema one, so this migration does
--       NOT create a subscription row and DR-0365 carries the dated re-review.
--
--   (b) THE CROSS-INSTANCE ENTITY. `rentals.entity_id` references `entities`
--       rows that belong to poe-family. Moving the doors without touching it
--       would leave a foreign key pointing across a tenancy boundary — exactly
--       what DR-0060 exists to forbid. So the landlord instance gets its OWN
--       entity rows (same slugs, its own ids), and each moved door's entity_id
--       is re-resolved WITHIN its new instance by slug. The family's entities
--       are untouched, so the family books keep their rollups.
--
--   (c) A PRE-EXISTING INCONSISTENCY, carried across UNCHANGED and reported
--       rather than silently "fixed": one door carries entity_slug
--       'e-personal' while its entity_id actually points at Poe Properties
--       LLC. The slug and the id disagree, and they have for as long as the
--       row has existed.
--
--       The first draft of this migration NULLed entity_id and let the
--       resolver re-fill it from entity_slug. Measured against the real rows,
--       that would have SILENTLY MOVED THAT DOOR FROM POE PROPERTIES LLC TO
--       PERSONAL — a change of legal entity, with tax consequences, performed
--       by a migration nobody asked to make it. It is fixed below: the move
--       maps each door to the new-instance entity carrying the SAME SLUG AS
--       THE ENTITY IT POINTS AT TODAY, so every door keeps exactly the
--       attachment it has. The slug/id disagreement survives the move intact,
--       which is the honest outcome: correcting it is Darrell's call on his
--       own books, not a side effect of a tenancy change.
--
-- WHAT DOES NOT CHANGE: the shell's `my_default_instance_role()` (the family
-- app keeps working for the same people), and DR-0313's rent-posting guard,
-- which is keyed on membership of the row's OWN instance — so posting rent to
-- the books continues to work for anyone who is a member of the instance the
-- rent record lives in.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The instance. Idempotent by slug.
-- ---------------------------------------------------------------------------
INSERT INTO public.instances (slug, display_name, instance_type)
SELECT 'poe-properties', 'Poe Properties', 'landlord'
 WHERE NOT EXISTS (SELECT 1 FROM public.instances WHERE slug = 'poe-properties');

-- ---------------------------------------------------------------------------
-- 2. The people. Darrell is the landlord and owns it (both of his sign-ins,
--    0140: the same person). Christina administers it — she keeps the books.
--    Nobody else is seeded; every other seat is granted from Governance.
-- ---------------------------------------------------------------------------
INSERT INTO public.instance_members (instance_id, user_id, role, display_name)
SELECT i.id, u.id, 'owner', coalesce(fm.display_name, 'Darrell')
  FROM public.instances i
  JOIN auth.users u ON lower(u.email) IN ('darrellpoe06@gmail.com', '15636502416@phone.poetech.us')
  LEFT JOIN public.instances fam ON fam.slug = 'poe-family'
  LEFT JOIN public.instance_members fm ON fm.instance_id = fam.id AND fm.user_id = u.id
 WHERE i.slug = 'poe-properties'
ON CONFLICT (instance_id, user_id) DO UPDATE SET role = 'owner';

INSERT INTO public.instance_members (instance_id, user_id, role, display_name)
SELECT i.id, u.id, 'admin', coalesce(fm.display_name, split_part(u.email, '@', 1))
  FROM public.instances i
  JOIN auth.users u ON lower(u.email) IN ('mrspoe06@gmail.com', 'christina@tlctherapysolutions.com')
  LEFT JOIN public.instances fam ON fam.slug = 'poe-family'
  LEFT JOIN public.instance_members fm ON fm.instance_id = fam.id AND fm.user_id = u.id
 WHERE i.slug = 'poe-properties'
ON CONFLICT (instance_id, user_id) DO UPDATE SET role = 'admin'
  WHERE public.instance_members.role <> 'owner';

-- ---------------------------------------------------------------------------
-- 3. The entity the doors belong to, copied into the new instance.
--    Hazard (b). Same slug, its own id, so the doors can point INSIDE their
--    own instance. The family's row is left exactly as it is.
-- ---------------------------------------------------------------------------
-- Copied: every entity a door NAMES (entity_slug) and every entity a door
-- actually POINTS AT (entity_id). Those two sets differ on one row today, and
-- copying only one of them would strand the other.
INSERT INTO public.entities (instance_id, created_by, slug, display_name, entity_type)
SELECT p.id, e.created_by, e.slug, e.display_name, e.entity_type
  FROM public.entities e
  JOIN public.instances f ON f.id = e.instance_id AND f.slug = 'poe-family'
  CROSS JOIN public.instances p
 WHERE p.slug = 'poe-properties'
   AND (e.slug IN (SELECT entity_slug FROM public.rentals WHERE entity_slug IS NOT NULL)
        OR e.id  IN (SELECT entity_id   FROM public.rentals WHERE entity_id   IS NOT NULL))
   AND NOT EXISTS (
     SELECT 1 FROM public.entities x WHERE x.instance_id = p.id AND x.slug = e.slug);

-- ---------------------------------------------------------------------------
-- 4. The doors and everything hanging off them move.
--    Each door is re-pointed at the new-instance entity with the SAME SLUG AS
--    THE ONE IT POINTS AT TODAY — never re-resolved from entity_slug, which
--    would have re-attached the one mismatched door to a different legal
--    entity (hazard (c)). entity_slug is left exactly as it is.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_fam uuid;
  v_prop uuid;
  v_tbl text;
  v_moved int;
BEGIN
  SELECT id INTO v_fam  FROM public.instances WHERE slug = 'poe-family';
  SELECT id INTO v_prop FROM public.instances WHERE slug = 'poe-properties';
  IF v_fam IS NULL OR v_prop IS NULL THEN
    RAISE NOTICE '0207: one of the instances is missing; nothing moved';
    RETURN;
  END IF;

  -- The doors first. The entity is re-pointed BY THE SLUG IT CURRENTLY HAS,
  -- so the attachment is preserved to the letter.
  UPDATE public.rentals r
     SET instance_id = v_prop,
         entity_id = (SELECT n.id
                        FROM public.entities o
                        JOIN public.entities n ON n.slug = o.slug AND n.instance_id = v_prop
                       WHERE o.id = r.entity_id)
   WHERE r.instance_id = v_fam;
  GET DIAGNOSTICS v_moved = ROW_COUNT;
  RAISE NOTICE '0207: % door(s) moved to poe-properties', v_moved;

  -- Then every other property-scoped table that carries instance_id. Named
  -- explicitly rather than discovered by pattern: a migration that moves rows
  -- it was not written for is a migration nobody can review.
  FOREACH v_tbl IN ARRAY ARRAY[
    'leases', 'property_access_invites', 'property_documents', 'property_notes',
    'property_photos', 'property_rooms', 'property_system_events', 'property_systems',
    'rent_balance_adjustments', 'rent_payments', 'rent_records', 'rental_applications',
    'rental_tenancies', 'renter_household_members', 'renters',
    'tenant_maintenance_requests', 'tenant_messages', 'tenant_notices'
  ]
  LOOP
    EXECUTE format('UPDATE public.%I SET instance_id = $1 WHERE instance_id = $2', v_tbl)
      USING v_prop, v_fam;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. The properties resolver. Answers ONLY from a landlord membership, the
--    way my_office_instance_role() answers only from a therapy-practice one
--    (DR-0351 §4). The shell's my_default_instance_role() is NOT touched.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_properties_instance_role()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT jsonb_build_object(
           'instance_id',   i.id,
           'instance_slug', i.slug,
           'instance_type', i.instance_type,
           'role',          m.role)
    FROM public.instance_members m
    JOIN public.instances i ON i.id = m.instance_id
   WHERE m.user_id = auth.uid()
     AND i.instance_type = 'landlord'
   ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
            i.created_at
   LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.my_properties_instance_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_properties_instance_role() TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
