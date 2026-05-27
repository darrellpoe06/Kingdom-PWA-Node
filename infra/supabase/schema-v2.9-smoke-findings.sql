-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.9-smoke-findings.sql
--
-- Smoke-test gap-closure migration ratified 2026-05-26 (Dispatch overnight).
-- Authored after the 2026-05-26 production smoke test surfaced three gaps
-- in the live Supabase project (mjjlevhdufpaplypnqrv) relative to the
-- documented v2 schema set:
--
--   GAP 1: Legal cut (v2.6) tables not present in live DB
--          → legal_matters, matter_parties, matter_documents, matter_journal,
--            matter_key_dates, matter_counsel, matter_financial_links,
--            conflict_checks
--   GAP 2: Church giving reconciliation (v2.7 §11.5 Q6 lock-in) not present
--          → service_offerings, giving_reconciliations
--   GAP 3: change_requests.assigned_to first-class field missing
--          → requires digging through lifecycle/links jsonb to know who owns
--            the change; not n8n-friendly and not phone-friendly.
--          ALSO: notification_preferences row for Christina (737f5d3b...) on
--          kind='change_request_assigned' so the seeded change_requests
--          actually deliver a notification when she's the assignee.
--
-- THIS FILE IS IDEMPOTENT. Every CREATE uses IF NOT EXISTS. Every column
-- add uses IF NOT EXISTS. Every seed uses ON CONFLICT DO NOTHING. You may
-- run it on a live DB that already has some of these objects without harm;
-- it will only add the missing pieces.
--
-- DO NOT execute against the live DB until Darrell has reviewed and is
-- ready. To apply: paste this entire file into Supabase Dashboard →
-- SQL Editor and run. Expected runtime: < 5 seconds. No data loss path —
-- this migration is additive only.
--
-- Depends on: schema-v2.1-infra.sql (instances, user_in_instance(),
--             user_role_in_instance(), role_scopes, instance_members),
--             schema-v2.7-church.sql (donor_giving, parishioners) for
--             the church gap, schema-v2.8-ops.sql (change_requests,
--             notification_preferences) for GAP 3,
--             and the v1 transactions table for matter_financial_links.
-- =====================================================================

BEGIN;

-- =====================================================================
-- GAP 1 — Legal cut (v2.6 tables)
-- =====================================================================

CREATE TABLE IF NOT EXISTS legal_matters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"open","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  scope             text NOT NULL CHECK (scope IN
                      ('personal','real-estate','business','tax-regulatory')),
  sub_type          text,

  title_ciphertext  bytea NOT NULL,
  title_iv          bytea NOT NULL,
  notes_ciphertext  bytea,
  notes_iv          bytea,

  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN
                        ('open','monitoring','in-progress','resolved','appealed','closed')),
  opened_at         timestamptz NOT NULL DEFAULT now(),
  expected_close_at timestamptz,
  closed_at         timestamptz,

  exclude_from_global_search     boolean NOT NULL DEFAULT true,
  exclude_from_action_queue      boolean NOT NULL DEFAULT true,
  exclude_from_connected_context boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS legal_matters_instance_idx ON legal_matters (instance_id);
CREATE INDEX IF NOT EXISTS legal_matters_status_idx
  ON legal_matters (status) WHERE status != 'closed';

ALTER TABLE legal_matters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY legal_matters_member_read ON legal_matters FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_matters_legal_scope_insert ON legal_matters FOR INSERT
    WITH CHECK (
      user_in_instance(instance_id)
      AND created_by = auth.uid()
      AND (
        user_role_in_instance(instance_id) = 'owner'
        OR EXISTS (
          SELECT 1 FROM role_scopes rs
          JOIN instance_members tm ON tm.id = rs.instance_member_id
          WHERE tm.user_id = auth.uid()
            AND tm.instance_id = legal_matters.instance_id
            AND rs.scope_kind  = 'module'
            AND rs.scope_value = 'legal'
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_matters_update_owner_or_scope ON legal_matters FOR UPDATE
    USING (user_in_instance(instance_id))
    WITH CHECK (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_matters_no_delete ON legal_matters FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_parties
CREATE TABLE IF NOT EXISTS matter_parties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,

  role            text NOT NULL CHECK (role IN
                    ('plaintiff','defendant','petitioner','respondent',
                     'third-party','witness','counsel','self','other')),
  name_ciphertext bytea NOT NULL,
  name_iv         bytea NOT NULL,
  contact_ciphertext bytea,
  contact_iv      bytea,
  is_self_party   boolean NOT NULL DEFAULT false,
  party_user_id   uuid REFERENCES auth.users(id),
  party_external_id uuid REFERENCES external_users(id),
  notes_ciphertext bytea,
  notes_iv        bytea
);

CREATE INDEX IF NOT EXISTS matter_parties_matter_idx ON matter_parties (matter_id);

ALTER TABLE matter_parties ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_parties_member_read ON matter_parties FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_parties_member_write ON matter_parties FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_parties_member_update ON matter_parties FOR UPDATE
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_parties_no_delete ON matter_parties FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_counsel
CREATE TABLE IF NOT EXISTS matter_counsel (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,

  counsel_type    text NOT NULL CHECK (counsel_type IN
                    ('attorney','paralegal','mediator','arbitrator','self')),
  firm_ciphertext bytea,
  firm_iv         bytea,
  name_ciphertext bytea NOT NULL,
  name_iv         bytea NOT NULL,
  contact_ciphertext bytea,
  contact_iv      bytea,
  retainer_amount numeric(12,2),
  retainer_paid   boolean DEFAULT false,
  active          boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS matter_counsel_matter_idx ON matter_counsel (matter_id);

ALTER TABLE matter_counsel ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_counsel_member_read ON matter_counsel FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_counsel_member_write ON matter_counsel FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_counsel_member_update ON matter_counsel FOR UPDATE
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_counsel_no_delete ON matter_counsel FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_key_dates
CREATE TABLE IF NOT EXISTS matter_key_dates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,

  date_kind        text NOT NULL CHECK (date_kind IN
                     ('filing','hearing','deadline','statute-of-limitations',
                      'mediation','arbitration','trial','appeal','other')),
  date_label_ciphertext bytea NOT NULL,
  date_label_iv    bytea NOT NULL,
  date_at          timestamptz NOT NULL,
  is_blocking      boolean NOT NULL DEFAULT false,
  resolved         boolean NOT NULL DEFAULT false,
  notes_ciphertext bytea,
  notes_iv         bytea
);

CREATE INDEX IF NOT EXISTS matter_key_dates_matter_idx ON matter_key_dates (matter_id);
CREATE INDEX IF NOT EXISTS matter_key_dates_upcoming_idx
  ON matter_key_dates (date_at) WHERE resolved = false;

ALTER TABLE matter_key_dates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_key_dates_member_read ON matter_key_dates FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_key_dates_member_write ON matter_key_dates FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_key_dates_member_update ON matter_key_dates FOR UPDATE
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_documents
CREATE TABLE IF NOT EXISTS matter_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),

  doc_kind        text NOT NULL CHECK (doc_kind IN
                    ('filing','contract','correspondence','evidence',
                     'order','opinion','transcript','statement','other')),
  filename_ciphertext bytea NOT NULL,
  filename_iv     bytea NOT NULL,
  storage_path    text NOT NULL,
  size_bytes      bigint,
  sha256_hex      text,
  privileged      boolean NOT NULL DEFAULT true,
  redacted        boolean NOT NULL DEFAULT false,
  notes_ciphertext bytea,
  notes_iv        bytea
);

CREATE INDEX IF NOT EXISTS matter_documents_matter_idx ON matter_documents (matter_id);

ALTER TABLE matter_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_documents_member_read ON matter_documents FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_documents_member_write ON matter_documents FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_documents_member_update ON matter_documents FOR UPDATE
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_documents_no_delete ON matter_documents FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_journal (immutable journal entries)
CREATE TABLE IF NOT EXISTS matter_journal (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  at          timestamptz NOT NULL DEFAULT now(),

  entry_kind  text NOT NULL CHECK (entry_kind IN
                ('note','call','meeting','strategy','filing','outcome',
                 'expense','reflection','other')),
  body_ciphertext bytea NOT NULL,
  body_iv     bytea NOT NULL,
  hours       numeric(6,2),
  related_party_id uuid REFERENCES matter_parties(id),
  related_doc_id   uuid REFERENCES matter_documents(id)
);

CREATE INDEX IF NOT EXISTS matter_journal_matter_at_idx ON matter_journal (matter_id, at DESC);

ALTER TABLE matter_journal ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_journal_member_read ON matter_journal FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_journal_member_write ON matter_journal FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_journal_no_update ON matter_journal FOR UPDATE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_journal_no_delete ON matter_journal FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matter_financial_links (Books integration)
CREATE TABLE IF NOT EXISTS matter_financial_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),

  link_kind       text NOT NULL CHECK (link_kind IN
                    ('retainer','filing-fee','expense','settlement','judgment',
                     'fee-award','recovery','other')),
  transaction_id  uuid REFERENCES transactions(id),
  amount          numeric(12,2),
  notes_ciphertext bytea,
  notes_iv        bytea
);

CREATE INDEX IF NOT EXISTS matter_fin_links_matter_idx ON matter_financial_links (matter_id);

ALTER TABLE matter_financial_links ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY matter_fin_links_member_read ON matter_financial_links FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY matter_fin_links_member_write ON matter_financial_links FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- conflict_checks (also part of the Legal cut)
CREATE TABLE IF NOT EXISTS conflict_checks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id   uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),

  checked_at      timestamptz NOT NULL DEFAULT now(),
  checked_by      uuid REFERENCES auth.users(id),
  result          text NOT NULL CHECK (result IN ('clear','conflict','waivable','blocked')),
  rationale_ciphertext bytea,
  rationale_iv    bytea
);

CREATE INDEX IF NOT EXISTS conflict_checks_matter_idx ON conflict_checks (matter_id);

ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY conflict_checks_member_read ON conflict_checks FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY conflict_checks_member_write ON conflict_checks FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- GAP 2 — Church giving reconciliation (v2.7 §11.5 Q6)
-- =====================================================================

CREATE TABLE IF NOT EXISTS service_offerings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"counted","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  service_date    date NOT NULL,
  service_kind    text NOT NULL CHECK (service_kind IN (
    'sunday-morning','sunday-evening','wednesday-bible-study',
    'special-event','funeral','wedding','conference','revival','other'
  )),
  service_label   text,
  cash_total      numeric(12,2) NOT NULL DEFAULT 0,
  cash_count_by   uuid REFERENCES auth.users(id),
  check_total     numeric(12,2) NOT NULL DEFAULT 0,
  check_count     int NOT NULL DEFAULT 0,
  check_numbers   text[] NOT NULL DEFAULT '{}',
  online_total    numeric(12,2) NOT NULL DEFAULT 0,
  online_source   text,
  online_batch_id text,
  notes           text,
  reconciled_at   timestamptz,
  reconciled_by   uuid REFERENCES auth.users(id),
  transaction_id  uuid REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS service_offerings_date_idx     ON service_offerings (service_date DESC);
CREATE INDEX IF NOT EXISTS service_offerings_instance_idx ON service_offerings (instance_id);

ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY service_offerings_member_read ON service_offerings FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY service_offerings_member_insert ON service_offerings FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY service_offerings_member_update ON service_offerings FOR UPDATE
    USING (user_in_instance(instance_id))
    WITH CHECK (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS giving_reconciliations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"pending","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  service_offering_id uuid NOT NULL REFERENCES service_offerings(id) ON DELETE CASCADE,
  donor_giving_id     uuid REFERENCES donor_giving(id),
  parishioner_id      uuid REFERENCES parishioners(id),
  amount_claimed      numeric(12,2) NOT NULL,
  method              text NOT NULL CHECK (method IN ('cash','check','online','mixed')),
  check_number        text,
  claim_kind          text NOT NULL CHECK (claim_kind IN (
                        'named-at-service','claimed-after-service',
                        'reconciled-from-online','corrected-bookkeeping'
                      )),
  claim_status        text NOT NULL DEFAULT 'pending'
                       CHECK (claim_status IN
                         ('pending','verified','disputed','accepted','rejected')),
  verified_by         uuid REFERENCES auth.users(id),
  verified_at         timestamptz,
  notes               text,
  tax_year            int NOT NULL
);

CREATE INDEX IF NOT EXISTS giving_recon_service_idx
  ON giving_reconciliations (service_offering_id);
CREATE INDEX IF NOT EXISTS giving_recon_parishioner_year_idx
  ON giving_reconciliations (parishioner_id, tax_year);

ALTER TABLE giving_reconciliations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY giving_recon_member_read ON giving_reconciliations FOR SELECT
    USING (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY giving_recon_member_insert ON giving_reconciliations FOR INSERT
    WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY giving_recon_member_update ON giving_reconciliations FOR UPDATE
    USING (user_in_instance(instance_id))
    WITH CHECK (user_in_instance(instance_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- GAP 3 — change_requests.assigned_to + Christina notification preference
-- =====================================================================

-- Add first-class assigned_to column (was being inferred from lifecycle/links jsonb).
-- References auth.users so RLS/policy stays consistent with proposed_by_user_id.
DO $$ BEGIN
  ALTER TABLE change_requests
    ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS change_requests_assigned_to_idx
  ON change_requests (assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Seed notification_preferences row for Christina (737f5d3b-...) so the
-- already-seeded change_requests routed to her actually deliver. The
-- seed-2026-05-25-projects.sql migration uses display-name lookup to find
-- her id; this seed uses the same lookup so it works whether her stable
-- UUID is 737f5d3b... or a different value at migration time.
--
-- Channel = 'pushover' is the dual-path notifier from v2.8 n8n workflows.
-- lead_times empty = fire on insert, no advance reminder.
DO $$
DECLARE
  v_christina_id   uuid;
  v_instance_id    uuid;
BEGIN
  SELECT id INTO v_instance_id FROM instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    RAISE NOTICE 'smoke-findings: no instances row found; skipping Christina notif_pref seed';
    RETURN;
  END IF;

  -- Try the stable UUID Darrell flagged first; fall back to a name lookup.
  SELECT user_id INTO v_christina_id
    FROM instance_members
   WHERE user_id = '737f5d3b-0000-0000-0000-000000000000'::uuid
   LIMIT 1;

  IF v_christina_id IS NULL THEN
    SELECT im.user_id INTO v_christina_id
      FROM instance_members im
      JOIN auth.users u ON u.id = im.user_id
     WHERE im.instance_id = v_instance_id
       AND (u.email ILIKE '%christina%' OR u.email ILIKE 'cpoe%')
     LIMIT 1;
  END IF;

  IF v_christina_id IS NULL THEN
    RAISE NOTICE 'smoke-findings: Christina user not yet present; notif_pref seed deferred to her first login';
    RETURN;
  END IF;

  INSERT INTO notification_preferences
    (instance_id, created_by, target_user_id, kind, channel, enabled)
  VALUES
    (v_instance_id, v_christina_id, v_christina_id,
     'change_request_assigned', 'pushover', true)
  ON CONFLICT (target_user_id, kind, channel) DO NOTHING;

  INSERT INTO notification_preferences
    (instance_id, created_by, target_user_id, kind, channel, enabled)
  VALUES
    (v_instance_id, v_christina_id, v_christina_id,
     'change_request_assigned', 'ntfy', true)
  ON CONFLICT (target_user_id, kind, channel) DO NOTHING;

  RAISE NOTICE 'smoke-findings: notif_pref seed landed for Christina (user_id=%)', v_christina_id;
END $$;

COMMIT;

-- =====================================================================
-- End of schema-v2.9-smoke-findings.sql
--
-- Verification queries (run separately to confirm landing):
--
--   SELECT count(*) FROM legal_matters;             -- table exists, 0 rows
--   SELECT count(*) FROM matter_parties;            -- ditto
--   SELECT count(*) FROM matter_documents;
--   SELECT count(*) FROM matter_journal;
--   SELECT count(*) FROM matter_key_dates;
--   SELECT count(*) FROM matter_counsel;
--   SELECT count(*) FROM matter_financial_links;
--   SELECT count(*) FROM conflict_checks;
--   SELECT count(*) FROM service_offerings;
--   SELECT count(*) FROM giving_reconciliations;
--
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='change_requests' AND column_name='assigned_to';
--
--   SELECT target_user_id, kind, channel, enabled
--     FROM notification_preferences
--    WHERE kind='change_request_assigned';
-- =====================================================================
