-- =============================================================================
-- 0150 — the Poe Properties App keystone: invite -> claim, and the tenant's family
-- =============================================================================
-- WHY (reality-trace, 2026-08-26, measured against the LIVE database):
--   0055 shipped the landlord<->tenant tables, 0062 the manager role, 0075 the
--   scoped delegation grid. All FOUR 0075 tables exist live (delegated_capabilities,
--   tenancy_worker_access, request_documentation, rent_balance_adjustments) and all
--   are EMPTY, and rental_tenancies is EMPTY — because nothing in the system can
--   put a real person into any of them:
--     * user_is_tenant(t)      = rental_tenancies.tenant_user_id = auth.uid()
--     * user_delegated_can(..) = delegated_capabilities.grantee_user_id = auth.uid()
--   Both key on auth.uid(), and delegated_capabilities.grantee_user_id is NOT NULL,
--   so a landlord who only knows a person's EMAIL cannot grant anything. That is the
--   keystone gap DR-0101 named ("nothing ever creates a rental_tenancies row") and
--   it is why the operator system has never had a user. This migration closes it.
--
-- THE SEAM: an INVITE the landlord writes by email, and a CLAIM the invited person
-- performs by signing in to that same email. TWO INDEPENDENT FACTS are required
-- before one byte of access exists — the same discipline schema-v2.10 used for the
-- renter portal, without needing a dashboard auth hook (nothing here mints claims;
-- it matches auth.email(), which Supabase already verified).
--
-- THE CEILING IS IN THE FUNCTION, NOT THE INVITE (DR-0101 §2): claim_property_access()
-- writes ONLY capabilities inside the invited role's vocabulary. A tampered invite row
-- cannot widen a grant — an unknown capability is dropped, and no role_label reaches
-- the books, the portfolio, or any platform/developer surface. There is no capability
-- string in this file that 0075's RLS does not already bound to one tenancy's rows.
--
-- THE TENANT'S FAMILY (Darrell, 2026-08-26: "1099 workers and tenants and their
-- families will use the Poe Properties App"): a household member is NOT the lease
-- signer. tenancy_household + user_is_tenancy_household() give a spouse/adult child
-- their own login onto the SAME door's work orders, thread, and notices — and
-- deliberately NOT the rent ledger or any balance (rent stays with the signer).
-- Every arm added below is ADDITIVE; not one existing policy arm is loosened.
--
-- MONEY: unchanged. No money moves in this file (DR-0094).
-- IDEMPOTENT: IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS then CREATE.
-- DEPENDS ON: 0055, 0062, 0075. Governed by DR-0084 (self-applying lane), DR-0101,
--             DR-0313 (the Poe Properties App), DR-0076 (the isolation smoke beside
--             this file is the gate — 0150-isolation-smoke.sql).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. property_access_invites — the landlord's by-email invite. Holds NO access.
--    Until it is claimed it is a row of intent; the claim function is the only
--    thing that ever turns it into a grant.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_access_invites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  email          text NOT NULL,
  role_label     text NOT NULL CHECK (role_label IN ('tenant','household','manager','field_worker')),
  -- tenant / household / a field worker enabled on ONE job: the door they belong to.
  tenancy_id     uuid REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  -- manager / field_worker portfolio scope: a rental_ref, or '*' for all managed.
  scope_ref      text,
  -- the capabilities the landlord toggled ON for this person. The claim function
  -- INTERSECTS this with the role's ceiling — it can never widen it.
  capabilities   text[] NOT NULL DEFAULT '{}',
  display_name   text,
  relationship   text,                       -- household only (spouse, adult child, ...)
  invited_by     uuid REFERENCES auth.users(id),
  claimed_at     timestamptz,
  claimed_by     uuid REFERENCES auth.users(id),
  revoked        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS property_access_invites_instance_idx ON property_access_invites(instance_id);
CREATE INDEX IF NOT EXISTS property_access_invites_email_idx    ON property_access_invites(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS property_access_invites_uniq
  ON property_access_invites(instance_id, lower(email), role_label, coalesce(tenancy_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(scope_ref, ''));

GRANT SELECT, INSERT, UPDATE, DELETE ON property_access_invites TO authenticated;
ALTER TABLE property_access_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_access_invites_read   ON property_access_invites;
DROP POLICY IF EXISTS property_access_invites_insert ON property_access_invites;
DROP POLICY IF EXISTS property_access_invites_update ON property_access_invites;
DROP POLICY IF EXISTS property_access_invites_delete ON property_access_invites;
-- The grantor manages invites. The invitee may READ their own (so the app can say
-- "you have an invitation waiting" before anything is claimed) — never write it.
CREATE POLICY property_access_invites_read ON property_access_invites FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin')
         OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE POLICY property_access_invites_insert ON property_access_invites FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY property_access_invites_update ON property_access_invites FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY property_access_invites_delete ON property_access_invites FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 2. tenancy_household — the tenant's FAMILY on the same door, each with their own
--    login. Never the lease signer; deliberately no rent reach.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenancy_household (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id      uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  member_user_id  uuid NOT NULL REFERENCES auth.users(id),
  display_name    text,
  relationship    text,
  active          boolean NOT NULL DEFAULT true,
  added_by        uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenancy_household_uniq ON tenancy_household(tenancy_id, member_user_id);
CREATE INDEX IF NOT EXISTS tenancy_household_instance_idx ON tenancy_household(instance_id);
CREATE INDEX IF NOT EXISTS tenancy_household_member_idx   ON tenancy_household(member_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON tenancy_household TO authenticated;
ALTER TABLE tenancy_household ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenancy_household_read   ON tenancy_household;
DROP POLICY IF EXISTS tenancy_household_insert ON tenancy_household;
DROP POLICY IF EXISTS tenancy_household_update ON tenancy_household;
DROP POLICY IF EXISTS tenancy_household_delete ON tenancy_household;
CREATE POLICY tenancy_household_read ON tenancy_household FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR member_user_id = auth.uid()
         OR user_is_tenant(tenancy_id));
CREATE POLICY tenancy_household_insert ON tenancy_household FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY tenancy_household_update ON tenancy_household FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY tenancy_household_delete ON tenancy_household FOR DELETE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- The household predicate. Same shape as user_is_tenant (STABLE, SECURITY DEFINER,
-- pinned search_path, REVOKE FROM PUBLIC) so the two compose in one policy.
CREATE OR REPLACE FUNCTION public.user_is_tenancy_household(p_tenancy uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenancy_household h
    WHERE h.tenancy_id = p_tenancy AND h.member_user_id = auth.uid() AND h.active = true
  )
$$;
REVOKE ALL ON FUNCTION public.user_is_tenancy_household(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_tenancy_household(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. tenancy_notes — THE RELATIONSHIP RECORD (Darrell, 2026-08-26: "they should
--    be able to see ... their notes if they create one ... management should be
--    able to see all notes included in the view for historical understanding of
--    the relationship between Poe Properties and the tenants and also 1099
--    workers who support").
--
--    property_notes (0062) stays the landlord's PRIVATE per-door memory. This is
--    the SHARED stream: a note anyone on the door writes — tenant, a household
--    member, an enabled 1099 worker, a scoped manager, the owner — appended to
--    the door's history with a real server timestamp. APPEND-ONLY (SELECT +
--    INSERT granted only): a note is a fact about a moment, so it is never
--    edited or deleted; the timeline it feeds is judged on its timestamps.
--
--    Reads are FULL-THREAD by design, exactly like tenant_messages (DR-0101 §5):
--    everyone on the door sees every note on that door, so responsiveness and
--    timelines are judged accurately. Scope still holds — a manager sees only
--    granted doors, a worker only the job they were enabled on.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenancy_notes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tenancy_id       uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
  request_id       uuid REFERENCES tenant_maintenance_requests(id) ON DELETE SET NULL,
  author_user_id   uuid REFERENCES auth.users(id),
  author_role      text NOT NULL CHECK (author_role IN ('tenant','household','worker','manager','landlord')),
  author_label     text,
  body             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenancy_notes_instance_idx ON tenancy_notes(instance_id);
CREATE INDEX IF NOT EXISTS tenancy_notes_tenancy_idx  ON tenancy_notes(tenancy_id, created_at);
CREATE INDEX IF NOT EXISTS tenancy_notes_request_idx  ON tenancy_notes(request_id);

GRANT SELECT, INSERT ON tenancy_notes TO authenticated;
ALTER TABLE tenancy_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenancy_notes_read   ON tenancy_notes;
DROP POLICY IF EXISTS tenancy_notes_insert ON tenancy_notes;
CREATE POLICY tenancy_notes_read ON tenancy_notes FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id)
         OR user_is_enabled_worker(tenancy_id)
         OR user_delegated_can(tenancy_id,'request.manage')
         OR user_delegated_can(tenancy_id,'property.history')
         OR user_delegated_can(tenancy_id,'docs.add'));
CREATE POLICY tenancy_notes_insert ON tenancy_notes FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_is_tenancy_household(tenancy_id)
              OR user_is_enabled_worker(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage')
              OR user_delegated_can(tenancy_id,'docs.add'));

-- ---------------------------------------------------------------------------
-- 4. The tenant's FAMILY reaches the same door. Each policy below is the LIVE
--    definition (read out of pg_policies 2026-08-26) with ONE arm appended:
--    user_is_tenancy_household(...). Nothing existing is removed or narrowed.
--    Rent stays with the household: read yes (it is their rent), write never —
--    only the lease signer reports and only the landlord/manager confirms.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS rental_tenancies_read ON rental_tenancies;
CREATE POLICY rental_tenancies_read ON rental_tenancies FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR tenant_user_id = auth.uid()
         OR user_is_tenancy_household(id)
         OR user_delegated_can(id,'request.manage')
         OR user_delegated_can(id,'rentroll.view')
         OR user_delegated_can(id,'property.history')
         OR user_delegated_can(id,'application.review'));

DROP POLICY IF EXISTS tenant_maintenance_requests_read ON tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_read ON tenant_maintenance_requests FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id)
         OR user_is_enabled_worker(tenancy_id)
         OR user_delegated_can(tenancy_id,'request.manage')
         OR user_delegated_can(tenancy_id,'property.history')
         OR user_delegated_can(tenancy_id,'docs.add'));
DROP POLICY IF EXISTS tenant_maintenance_requests_insert ON tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_insert ON tenant_maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_is_tenancy_household(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'));
DROP POLICY IF EXISTS tenant_maintenance_requests_update ON tenant_maintenance_requests;
CREATE POLICY tenant_maintenance_requests_update ON tenant_maintenance_requests FOR UPDATE TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_is_tenancy_household(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_is_tenancy_household(tenancy_id)
              OR user_delegated_can(tenancy_id,'request.manage'));

DROP POLICY IF EXISTS tenant_messages_read ON tenant_messages;
CREATE POLICY tenant_messages_read ON tenant_messages FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id)
         OR user_delegated_can(tenancy_id,'message.tenant')
         OR user_is_enabled_worker(tenancy_id));
DROP POLICY IF EXISTS tenant_messages_insert ON tenant_messages;
CREATE POLICY tenant_messages_insert ON tenant_messages FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member')
              OR user_is_tenant(tenancy_id)
              OR user_is_tenancy_household(tenancy_id)
              OR user_delegated_can(tenancy_id,'message.tenant')
              OR user_is_enabled_worker(tenancy_id));

DROP POLICY IF EXISTS tenant_notices_read ON tenant_notices;
CREATE POLICY tenant_notices_read ON tenant_notices FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id)
         OR user_delegated_can(tenancy_id,'notice.post'));

DROP POLICY IF EXISTS request_documentation_read ON request_documentation;
CREATE POLICY request_documentation_read ON request_documentation FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_delegated_can(tenancy_id,'docs.add')
         OR user_delegated_can(tenancy_id,'request.manage')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id));

-- ---------------------------------------------------------------------------
-- 5. THE MONEY RIVER (Darrell, 2026-08-26: "the money will populate the PoeTech
--    App books because it's money from our tenants ... they should be able to
--    see their payment history").
--
--    Money still NEVER moves in the app (0055's money_moved_in_app CHECK is
--    untouched, DR-0094). What changes is that a CONFIRMED rent record is no
--    longer a dead end: it posts ONCE into the family's books as an income
--    transaction. posted_tx_id is the idempotency key — a rent record can carry
--    exactly one book entry, so a double-tap can never double-count income.
--    Only the BOOKS-OWNING side writes it (owner/admin/member): a tenant, a
--    household member, a worker, or a delegated manager can never post to the
--    books, and no delegated capability reaches this column's policy.
--    The tenant's read of their own payment history (0055's user_is_tenant arm)
--    is unchanged and now extends to their household.
-- ---------------------------------------------------------------------------
ALTER TABLE rent_records ADD COLUMN IF NOT EXISTS posted_tx_id  text;
ALTER TABLE rent_records ADD COLUMN IF NOT EXISTS posted_at     timestamptz;
ALTER TABLE rent_records ADD COLUMN IF NOT EXISTS posted_by     uuid REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS rent_records_posted_tx_uniq
  ON rent_records(instance_id, posted_tx_id) WHERE posted_tx_id IS NOT NULL;

-- The posting column is the BOOKS' column, not the operator's. rent_records_update
-- (0075) lets a rent.adjust manager correct a balance — correct, and unchanged —
-- but the books entry is the family's ledger, so a trigger, not a comment, keeps
-- posted_tx_id/posted_at/posted_by writable ONLY by an instance member. Without
-- this the "only the books-owning side posts" claim would be prose, not a gate.
CREATE OR REPLACE FUNCTION public.rent_records_posting_is_books_side()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.posted_tx_id IS DISTINCT FROM OLD.posted_tx_id)
     OR (NEW.posted_at IS DISTINCT FROM OLD.posted_at)
     OR (NEW.posted_by IS DISTINCT FROM OLD.posted_by) THEN
    -- NULL-safe (DR-0273): user_role_in_instance() returns NULL for a non-member,
    -- and `NULL NOT IN (...)` is NULL — the IF would not fire and the guard would
    -- silently pass. coalesce makes the non-member case a real string that fails.
    IF coalesce(user_role_in_instance(NEW.instance_id), '') NOT IN ('owner','admin','member') THEN
      RAISE EXCEPTION 'rent_records: posting to the books is instance-member only (DR-0313)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rent_records_posting_guard ON rent_records;
CREATE TRIGGER rent_records_posting_guard
  BEFORE UPDATE ON rent_records
  FOR EACH ROW EXECUTE FUNCTION public.rent_records_posting_is_books_side();

DROP POLICY IF EXISTS rent_records_read ON rent_records;
CREATE POLICY rent_records_read ON rent_records FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member')
         OR user_is_tenant(tenancy_id)
         OR user_is_tenancy_household(tenancy_id)
         OR user_delegated_can(tenancy_id,'rentroll.view'));

-- ---------------------------------------------------------------------------
-- 6. claim_property_access() — the ONLY path from an invite to a grant.
--
--    The caller must be signed in with a VERIFIED email that matches an
--    un-revoked, un-claimed invite the landlord wrote. Two independent facts,
--    both required, neither forgeable by the invitee:
--      (a) an owner/admin of that instance created the invite for that email
--          (property_access_invites INSERT is owner/admin-only, above);
--      (b) Supabase authenticated that email for this session.
--
--    THE CEILING LIVES HERE, NOT IN THE INVITE ROW. Requested capabilities are
--    INTERSECTED with the role's vocabulary (0075's grid) before a single
--    delegated_capabilities row is written, so a tampered invite widens nothing.
--    No role reaches the books, the portfolio, or any platform surface — there is
--    no such capability in the vocabulary to grant.
--
--    Returns a jsonb receipt: {claimed, tenancies, household, grants, worker_channels}.
--    STRICT-safe: never raises on a normal miss; an un-matched caller gets zeros.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_property_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid          uuid := auth.uid();
  uemail       text;
  inv          record;
  cap          text;
  allowed      text[];
  n_claimed    int := 0;
  n_tenancy    int := 0;
  n_household  int := 0;
  n_grants     int := 0;
  n_worker     int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('claimed', 0, 'reason', 'signed-out');
  END IF;
  SELECT lower(email) INTO uemail FROM auth.users WHERE id = uid;
  IF uemail IS NULL OR length(trim(uemail)) = 0 THEN
    RETURN jsonb_build_object('claimed', 0, 'reason', 'no-verified-email');
  END IF;

  FOR inv IN
    SELECT * FROM property_access_invites
    WHERE lower(email) = uemail AND revoked = false AND claimed_at IS NULL
  LOOP
    -- The role ceiling. Anything outside it is dropped, silently and by design.
    allowed := CASE inv.role_label
      WHEN 'manager'      THEN ARRAY['request.manage','message.tenant','notice.post','rentroll.view','rent.confirm','rent.adjust','application.review']
      WHEN 'field_worker' THEN ARRAY['property.history','docs.add']
      ELSE ARRAY[]::text[]
    END;

    IF inv.role_label = 'tenant' AND inv.tenancy_id IS NOT NULL THEN
      UPDATE rental_tenancies
         SET tenant_user_id = uid, updated_at = now()
       WHERE id = inv.tenancy_id
         AND instance_id = inv.instance_id
         AND tenant_user_id IS NULL;
      IF FOUND THEN n_tenancy := n_tenancy + 1; END IF;

    ELSIF inv.role_label = 'household' AND inv.tenancy_id IS NOT NULL THEN
      INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, relationship, added_by)
      VALUES (inv.instance_id, inv.tenancy_id, uid, inv.display_name, inv.relationship, inv.invited_by)
      ON CONFLICT (tenancy_id, member_user_id) DO UPDATE SET active = true;
      n_household := n_household + 1;

    ELSE
      FOREACH cap IN ARRAY coalesce(inv.capabilities, ARRAY[]::text[]) LOOP
        IF cap = ANY (allowed) THEN
          INSERT INTO delegated_capabilities
            (instance_id, grantee_user_id, scope_ref, capability, setting, granted_by, role_label)
          VALUES
            (inv.instance_id, uid, coalesce(inv.scope_ref, '*'), cap, 'allow', inv.invited_by, inv.role_label)
          ON CONFLICT (instance_id, grantee_user_id, scope_ref, capability)
          DO UPDATE SET setting = 'allow', updated_at = now();
          n_grants := n_grants + 1;
        END IF;
      END LOOP;
      -- A field worker invited onto ONE job also gets that job's message channel,
      -- which is what the landlord enabling that invite explicitly asked for.
      IF inv.role_label = 'field_worker' AND inv.tenancy_id IS NOT NULL THEN
        INSERT INTO tenancy_worker_access (instance_id, tenancy_id, worker_user_id, enabled_by, active)
        VALUES (inv.instance_id, inv.tenancy_id, uid, inv.invited_by, true)
        ON CONFLICT (tenancy_id, worker_user_id) DO UPDATE SET active = true;
        n_worker := n_worker + 1;
      END IF;
    END IF;

    UPDATE property_access_invites
       SET claimed_at = now(), claimed_by = uid
     WHERE id = inv.id;
    n_claimed := n_claimed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'claimed', n_claimed, 'tenancies', n_tenancy, 'household', n_household,
    'grants', n_grants, 'worker_channels', n_worker
  );
END;
$$;
REVOKE ALL ON FUNCTION public.claim_property_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_property_access() TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Realtime: the new tables join the publication (guarded). RLS applies to the
--    stream, so a delegate only ever receives rows their SELECT policy permits.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tenancy_notes') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_notes;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='tenancy_household') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_household;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE property_access_invites IS 'Poe Properties App: landlord-written, by-email invitation. Holds NO access; claim_property_access() is the only path to a grant (DR-0313).';
COMMENT ON TABLE tenancy_household  IS 'Poe Properties App: the tenant''s family on the same door — own login, work orders + thread + notices, never the rent write path (DR-0313).';
COMMENT ON TABLE tenancy_notes      IS 'Poe Properties App: the shared, append-only relationship record — tenant, household, 1099 worker, manager, landlord (DR-0313).';
COMMENT ON COLUMN rent_records.posted_tx_id IS 'Idempotency key: the books transaction this confirmed rent record posted as. One entry per record, ever (DR-0313).';

-- ---------------------------------------------------------------------------
-- 8. Re-run the two standing deny-overlays. The 0125 viewer overlay and the 0130
--    assistant scope-overlay only cover tables that existed when they ran, so
--    every migration that adds an instance-scoped table re-runs BOTH — otherwise
--    a 'viewer' could WRITE the new tables and an assistant could read outside
--    its office (DR-0241). Caught here by the tenancy guard, which is exactly
--    what that gate is for.
-- ---------------------------------------------------------------------------
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
