-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.7-church.sql
--
-- v2.7 CHURCH migration — COLG operations.
-- Depends on: schema-v2.1-infra.sql, transactions (v1).
--
-- Locked in 2026-05-25 by Darrell (Q6): two new reconciliation tables —
-- service_offerings (per-service cash + check + online counts) and
-- giving_reconciliations (named-claim → anonymous-offering linkage) —
-- so the annual tax statement is accurate WITHOUT forcing every giver
-- to be named at the moment of giving. Darrell's accuracy bar:
--   "making sure what was given is what was given — cash, check, and online."
--
-- Tables (8, after Q6 lock-in):
--   - parishioners
--   - prayer_requests
--   - ministries
--   - ministry_signups
--   - donor_giving
--   - volunteer_hours
--   - service_offerings        (§11.5 — Q6 lock-in 2026-05-25)
--   - giving_reconciliations   (§11.5 — Q6 lock-in 2026-05-25)
-- =====================================================================

BEGIN;

-- =====================================================================
-- parishioners — detailed member records
-- =====================================================================

CREATE TABLE IF NOT EXISTS parishioners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  display_name      text NOT NULL,
  preferred_name    text,
  contact_email     text,
  contact_phone     text,
  membership_status text NOT NULL DEFAULT 'attendee'
                      CHECK (membership_status IN
                        ('attendee','member','member-in-process','inactive','removed')),
  joined_at         date,
  baptized_at       date,
  sacraments        jsonb NOT NULL DEFAULT '[]',
  household_id      uuid REFERENCES parishioners(id),
  external_user_id  uuid REFERENCES external_users(id),
  care_notes        text
);

CREATE INDEX IF NOT EXISTS parishioners_instance_idx  ON parishioners (instance_id);
CREATE INDEX IF NOT EXISTS parishioners_household_idx ON parishioners (household_id);

ALTER TABLE parishioners ENABLE ROW LEVEL SECURITY;
CREATE POLICY parishioners_member_read   ON parishioners FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY parishioners_member_insert ON parishioners FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY parishioners_member_update ON parishioners FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- prayer_requests
-- =====================================================================

CREATE TABLE IF NOT EXISTS prayer_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  parishioner_id        uuid REFERENCES parishioners(id),
  submitted_by_external uuid REFERENCES external_users(id),
  request_text          text NOT NULL,
  audience              text NOT NULL DEFAULT 'leadership'
                          CHECK (audience IN
                            ('leadership','prayer-team','congregation',
                             'elders-only','anonymous-public')),
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN
                            ('active','answered','closed-with-care','removed')),
  expires_at            timestamptz,
  follow_up_notes       text
);

CREATE INDEX IF NOT EXISTS prayer_requests_instance_idx ON prayer_requests (instance_id);
CREATE INDEX IF NOT EXISTS prayer_requests_audience_idx ON prayer_requests (audience)
  WHERE status = 'active';

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY prayer_requests_member_read   ON prayer_requests FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY prayer_requests_member_insert ON prayer_requests FOR INSERT
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY prayer_requests_member_update ON prayer_requests FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- ministries + ministry_signups
-- =====================================================================

CREATE TABLE IF NOT EXISTS ministries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  name            text NOT NULL,
  description     text,
  leader_user_id  uuid REFERENCES auth.users(id),
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','seasonal','retired')),
  meeting_cadence text
);

ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ministries_member_read   ON ministries FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY ministries_member_insert ON ministries FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY ministries_member_update ON ministries FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS ministry_signups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  ministry_id      uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  parishioner_id   uuid REFERENCES parishioners(id),
  external_user_id uuid REFERENCES external_users(id),
  signed_up_at     timestamptz NOT NULL DEFAULT now(),
  role             text,
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','paused','completed','left'))
);

CREATE INDEX IF NOT EXISTS ministry_signups_ministry_idx ON ministry_signups (ministry_id);

ALTER TABLE ministry_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY ministry_signups_member_read   ON ministry_signups FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY ministry_signups_member_insert ON ministry_signups FOR INSERT
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- donor_giving
-- =====================================================================

CREATE TABLE IF NOT EXISTS donor_giving (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"logged","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  parishioner_id   uuid REFERENCES parishioners(id),
  external_user_id uuid REFERENCES external_users(id),
  gift_date        date NOT NULL,
  amount           numeric(12,2) NOT NULL,
  fund             text,
  method           text CHECK (method IN
                     ('cash','check','online','ach','stock','in-kind','other')),
  check_number     text,
  notes            text,
  transaction_id   uuid REFERENCES transactions(id),
  tax_year         int
);

CREATE INDEX IF NOT EXISTS donor_giving_instance_year_idx ON donor_giving (instance_id, tax_year);
CREATE INDEX IF NOT EXISTS donor_giving_parishioner_idx
  ON donor_giving (parishioner_id, tax_year) WHERE parishioner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS donor_giving_gift_date_idx ON donor_giving (gift_date DESC);

ALTER TABLE donor_giving ENABLE ROW LEVEL SECURITY;
CREATE POLICY donor_giving_member_read   ON donor_giving FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY donor_giving_member_insert ON donor_giving FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY donor_giving_member_update ON donor_giving FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- volunteer_hours
-- =====================================================================

CREATE TABLE IF NOT EXISTS volunteer_hours (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"logged","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  ministry_id      uuid REFERENCES ministries(id),
  parishioner_id   uuid REFERENCES parishioners(id),
  external_user_id uuid REFERENCES external_users(id),
  work_date        date NOT NULL,
  hours            numeric(5,2) NOT NULL,
  description      text,
  status           text NOT NULL DEFAULT 'logged'
                     CHECK (status IN ('logged','approved','disputed'))
);

CREATE INDEX IF NOT EXISTS volunteer_hours_ministry_idx ON volunteer_hours (ministry_id);

ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY volunteer_hours_member_read   ON volunteer_hours FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY volunteer_hours_member_insert ON volunteer_hours FOR INSERT
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- service_offerings (§11.5 — Q6 lock-in 2026-05-25)
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

CREATE INDEX IF NOT EXISTS service_offerings_date_idx ON service_offerings (service_date DESC);
CREATE INDEX IF NOT EXISTS service_offerings_instance_idx ON service_offerings (instance_id);

ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_offerings_member_read   ON service_offerings FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY service_offerings_member_insert ON service_offerings FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY service_offerings_member_update ON service_offerings FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- =====================================================================
-- giving_reconciliations (§11.5 — Q6 lock-in 2026-05-25)
-- =====================================================================

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
    'named-at-service',
    'claimed-after-service',
    'reconciled-from-online',
    'corrected-bookkeeping'
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
CREATE POLICY giving_recon_member_read   ON giving_reconciliations FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY giving_recon_member_insert ON giving_reconciliations FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY giving_recon_member_update ON giving_reconciliations FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

COMMIT;

-- =====================================================================
-- End of schema-v2.7-church.sql
-- =====================================================================
