-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.6-legal.sql
--
-- v2.6 LEGAL migration — all 7 Legal tables (Q8 lock-in: full cut, not MVP).
-- Depends on: schema-v2.1-infra.sql, transactions (v1) for matter_financial_links.
--
-- CRITICAL — client-side AES-GCM 256 + PBKDF2 250k. Server stores ciphertext.
-- RLS still applies for instance scoping; the server CANNOT decrypt content.
-- PIN loss = data loss. Intentional. See LEGAL-PRIVACY-BOUNDARY.md.
--
-- POE binding: Legal data is the strictest in the schema. DELETE is forbidden
-- (matters can be status='closed', never removed).
--
-- Tables (all 7 per Darrell's Q8 lock-in 2026-05-25):
--   1. legal_matters
--   2. matter_parties
--   3. matter_counsel
--   4. matter_key_dates
--   5. matter_documents
--   6. matter_journal
--   7. matter_financial_links
--   8. conflict_checks  (also part of the Legal cut)
-- =====================================================================

BEGIN;

-- =====================================================================
-- legal_matters
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

  scope               text NOT NULL CHECK (scope IN
                        ('personal','real-estate','business','tax-regulatory')),
  sub_type            text,

  -- Encrypted content — server cannot decrypt
  title_ciphertext    bytea NOT NULL,
  title_iv            bytea NOT NULL,
  notes_ciphertext    bytea,
  notes_iv            bytea,

  -- Metadata that does NOT leak privileged content
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN
                          ('open','monitoring','in-progress','resolved','appealed','closed')),
  opened_at           timestamptz NOT NULL DEFAULT now(),
  expected_close_at   timestamptz,
  closed_at           timestamptz,

  -- Privacy flags (always true; columns kept for explicit enforcement)
  exclude_from_global_search     boolean NOT NULL DEFAULT true,
  exclude_from_action_queue      boolean NOT NULL DEFAULT true,
  exclude_from_connected_context boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS legal_matters_instance_idx ON legal_matters (instance_id);
CREATE INDEX IF NOT EXISTS legal_matters_status_idx
  ON legal_matters (status) WHERE status != 'closed';

ALTER TABLE legal_matters ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_matters_member_read ON legal_matters FOR SELECT
  USING (user_in_instance(instance_id));

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

CREATE POLICY legal_matters_update_owner_or_scope ON legal_matters FOR UPDATE
  USING (
    user_in_instance(instance_id)
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

-- DELETE forbidden — matters can be status='closed', never removed
CREATE POLICY legal_matters_no_delete ON legal_matters FOR DELETE USING (false);

-- =====================================================================
-- matter_parties
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_parties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id            uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  role                 text NOT NULL CHECK (role IN
                         ('plaintiff','defendant','opposing','co-counsel',
                          'witness','expert','other')),
  name_ciphertext      bytea NOT NULL,
  name_iv              bytea NOT NULL,
  contact_ciphertext   bytea,
  contact_iv           bytea,
  notes_ciphertext     bytea,
  notes_iv             bytea
);

CREATE INDEX IF NOT EXISTS matter_parties_matter_idx ON matter_parties (matter_id);

ALTER TABLE matter_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_parties_member_read ON matter_parties FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_parties_member_write ON matter_parties FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY matter_parties_member_update ON matter_parties FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY matter_parties_no_delete ON matter_parties FOR DELETE USING (false);

-- =====================================================================
-- matter_counsel
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_counsel (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id               uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  represents_us           boolean NOT NULL,
  firm_ciphertext         bytea,
  firm_iv                 bytea,
  attorney_ciphertext     bytea,
  attorney_iv             bytea,
  contact_ciphertext      bytea,
  contact_iv              bytea,
  billing_rate_ciphertext bytea,
  billing_rate_iv         bytea,
  engagement_letter_date  date
);

CREATE INDEX IF NOT EXISTS matter_counsel_matter_idx ON matter_counsel (matter_id);

ALTER TABLE matter_counsel ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_counsel_member_read ON matter_counsel FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_counsel_member_write ON matter_counsel FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY matter_counsel_member_update ON matter_counsel FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY matter_counsel_no_delete ON matter_counsel FOR DELETE USING (false);

-- =====================================================================
-- matter_key_dates
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_key_dates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"upcoming","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id        uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  kind             text NOT NULL CHECK (kind IN
                     ('statute-of-limitations','filing-deadline','court-date',
                      'discovery','settlement-conference','arbitration','other')),
  at               timestamptz NOT NULL,
  completed        boolean NOT NULL DEFAULT false,
  label_ciphertext bytea,
  label_iv         bytea,
  note_ciphertext  bytea,
  note_iv          bytea,
  calendar_event_id uuid
);

CREATE INDEX IF NOT EXISTS matter_key_dates_matter_idx ON matter_key_dates (matter_id);
CREATE INDEX IF NOT EXISTS matter_key_dates_upcoming_idx
  ON matter_key_dates (at) WHERE completed = false;

ALTER TABLE matter_key_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_key_dates_member_read ON matter_key_dates FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_key_dates_member_write ON matter_key_dates FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY matter_key_dates_member_update ON matter_key_dates FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- matter_documents
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"filed","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id              uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  privileged             boolean NOT NULL DEFAULT true,
  label_ciphertext       bytea,
  label_iv               bytea,
  where_filed_ciphertext bytea,
  where_filed_iv         bytea,
  date_of                date,
  who_has_copies         text[] NOT NULL DEFAULT '{}',
  storage_uri_ciphertext bytea,
  storage_uri_iv         bytea,
  note_ciphertext        bytea,
  note_iv                bytea
);

CREATE INDEX IF NOT EXISTS matter_documents_matter_idx ON matter_documents (matter_id);

ALTER TABLE matter_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_documents_member_read ON matter_documents FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_documents_member_write ON matter_documents FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY matter_documents_member_update ON matter_documents FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY matter_documents_no_delete ON matter_documents FOR DELETE USING (false);

-- =====================================================================
-- matter_journal
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_journal (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"logged","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id         uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  privileged        boolean NOT NULL DEFAULT true,
  kind              text NOT NULL CHECK (kind IN
                      ('call','meeting','email','court','research','decision','other')),
  at                timestamptz NOT NULL DEFAULT now(),
  mins              int,
  with_ciphertext   bytea,
  with_iv           bytea,
  summary_ciphertext bytea NOT NULL,
  summary_iv        bytea NOT NULL
);

CREATE INDEX IF NOT EXISTS matter_journal_matter_at_idx ON matter_journal (matter_id, at DESC);

ALTER TABLE matter_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_journal_member_read ON matter_journal FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_journal_member_write ON matter_journal FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
-- Journal is essentially append-only; UPDATE/DELETE forbidden
CREATE POLICY matter_journal_no_update ON matter_journal FOR UPDATE USING (false);
CREATE POLICY matter_journal_no_delete ON matter_journal FOR DELETE USING (false);

-- =====================================================================
-- matter_financial_links
-- =====================================================================

CREATE TABLE IF NOT EXISTS matter_financial_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"linked","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id        uuid NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
  transaction_id   uuid NOT NULL REFERENCES transactions(id),
  kind             text CHECK (kind IN
                     ('fee','settlement-paid','settlement-received','filing-fee','expert-fee')),
  notes_ciphertext bytea,
  notes_iv         bytea
);

CREATE INDEX IF NOT EXISTS matter_fin_links_matter_idx ON matter_financial_links (matter_id);

ALTER TABLE matter_financial_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY matter_fin_links_member_read ON matter_financial_links FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY matter_fin_links_member_write ON matter_financial_links FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

-- =====================================================================
-- conflict_checks
-- =====================================================================

CREATE TABLE IF NOT EXISTS conflict_checks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"checked","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  matter_id                  uuid REFERENCES legal_matters(id),
  candidate_party_ciphertext bytea NOT NULL,
  candidate_party_iv         bytea NOT NULL,
  checked_at                 timestamptz NOT NULL DEFAULT now(),
  result                     text NOT NULL CHECK (result IN
                               ('no-conflict','potential-conflict','actual-conflict','waived')),
  notes_ciphertext           bytea,
  notes_iv                   bytea
);

CREATE INDEX IF NOT EXISTS conflict_checks_matter_idx ON conflict_checks (matter_id);

ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY conflict_checks_member_read ON conflict_checks FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY conflict_checks_member_write ON conflict_checks FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

COMMIT;

-- =====================================================================
-- End of schema-v2.6-legal.sql
-- =====================================================================
