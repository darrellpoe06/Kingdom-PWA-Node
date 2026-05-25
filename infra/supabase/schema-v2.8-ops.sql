-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.8-ops.sql
--
-- v2.8 CROSS-CUTTING OPS migration.
-- Depends on: schema-v2.1-infra.sql, schema-v2.2-rentals.sql (for
--             maintenance_requests.incident_id FK backfill),
--             schema-v2.3-therapy.sql (for inquiries link),
--             v1's transactions.
--
-- Contains:
--   - incidents
--   - tax_calendar
--   - recurring_obligations
--   - inflows
--   - subscriptions
--   - events
--   - checkout_intents
--
-- Continual Improvement Loop (§12.5):
--   - review_cadences
--   - review_cycles
--   - cycle_items
--   - change_requests
--   - cross_instance_signals
--
-- Awareness layer (§12.6):
--   - notifications
--   - notification_channels
--   - notification_preferences
--
-- Reports layer (§12.7):
--   - report_runs
--   - report_snapshots
--
-- POE binding: the system ranks (priority_score); the human decides
-- (user_priority_override). Disposition vocabulary is non-punitive:
-- "deferred", "rolled-forward" — never "failed" or "missed". The system
-- never auto-promotes past 'proposed'. The user always has the last word.
-- =====================================================================

BEGIN;

-- =====================================================================
-- incidents (ITSM-shaped issue log)
-- =====================================================================

CREATE TABLE IF NOT EXISTS incidents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"open","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  incident_date  date NOT NULL,
  amount         numeric(12,2),
  category       text NOT NULL CHECK (category IN
                   ('vehicle','property','medical','renter',
                    'maintenance','technology','financial','administrative','other')),
  description    text NOT NULL,
  urgency        text NOT NULL DEFAULT 'normal'
                   CHECK (urgency IN ('incident','change','request','problem','normal','urgent','low')),
  status         text NOT NULL DEFAULT 'open'
                   CHECK (status IN
                     ('open','triaging','in-progress','blocked',
                      'resolved','declined','duplicate')),
  due_date       date,
  resolved_at    timestamptz,
  resolved_by    uuid REFERENCES auth.users(id),
  linked_to_kind text,
  linked_to_id   uuid
);

CREATE INDEX IF NOT EXISTS incidents_instance_status_idx
  ON incidents (instance_id, status);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY incidents_member_read   ON incidents FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY incidents_member_insert ON incidents FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY incidents_member_update ON incidents FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

-- Backfill maintenance_requests.incident_id now that incidents exists
ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS incident_id uuid REFERENCES incidents(id);

-- =====================================================================
-- tax_calendar + recurring_obligations
-- =====================================================================

CREATE TABLE IF NOT EXISTS tax_calendar (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"upcoming","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  name                  text NOT NULL,
  description           text,
  amount                numeric(12,2),
  frequency             text NOT NULL CHECK (frequency IN
                          ('monthly','quarterly','biannual','annual','biennial','one-time')),
  next_due              date NOT NULL,
  applies_to_entity_ids uuid[] NOT NULL DEFAULT '{}',
  category              text,
  enabled               boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS tax_calendar_instance_due_idx
  ON tax_calendar (instance_id, next_due) WHERE enabled = true;

ALTER TABLE tax_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_calendar_member_read   ON tax_calendar FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY tax_calendar_member_insert ON tax_calendar FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY tax_calendar_member_update ON tax_calendar FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS recurring_obligations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"upcoming","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  name                  text NOT NULL,
  description           text,
  amount                numeric(12,2),
  frequency             text NOT NULL CHECK (frequency IN
                          ('monthly','quarterly','biannual','annual','biennial','one-time')),
  next_due              date NOT NULL,
  applies_to_entity_ids uuid[] NOT NULL DEFAULT '{}',
  category              text,
  enabled               boolean NOT NULL DEFAULT true
);

ALTER TABLE recurring_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rec_obl_member_read   ON recurring_obligations FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY rec_obl_member_insert ON recurring_obligations FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

-- =====================================================================
-- inflows / subscriptions / events
-- =====================================================================

CREATE TABLE IF NOT EXISTS inflows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"modeled","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  inflow_type text NOT NULL CHECK (inflow_type IN
                ('salary','rental','practice','consulting',
                 'royalty','dividend','other')),
  who         text,
  source      text,
  expected    numeric(12,2),
  actual      numeric(12,2),
  month       date NOT NULL,
  UNIQUE (instance_id, entity_id, who, source, month)
);

ALTER TABLE inflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY inflows_member_read   ON inflows FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY inflows_member_insert ON inflows FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

CREATE TABLE IF NOT EXISTS subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  service_name text NOT NULL,
  amount       numeric(12,2) NOT NULL,
  frequency    text NOT NULL CHECK (frequency IN ('monthly','annual','quarterly')),
  category     text,
  notes        text,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','cancelled','paused','trial')),
  next_charge  date
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subs_member_read   ON subscriptions FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY subs_member_insert ON subscriptions FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"scheduled","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  title           text NOT NULL,
  event_date      date NOT NULL,
  event_time      time,
  amount          numeric(12,2),
  category        text,
  description     text,
  all_day         boolean NOT NULL DEFAULT true,
  recurrence_rule text,
  privileged      boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS events_instance_date_idx ON events (instance_id, event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_member_read   ON events FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY events_member_insert ON events FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY events_member_update ON events FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS checkout_intents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"observed","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  user_id           uuid NOT NULL REFERENCES auth.users(id),
  tier_selected     text NOT NULL CHECK (tier_selected IN
                      ('foundation','poetech-plus','family','premium',
                       'business','enterprise','landlord')),
  action_taken      text NOT NULL CHECK (action_taken IN
                      ('subscribed','abandoned','requested-info')),
  stripe_session_id text
);

ALTER TABLE checkout_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY checkout_intents_member_read ON checkout_intents FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY checkout_intents_self_insert ON checkout_intents FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND user_id = auth.uid());

-- =====================================================================
-- §12.5 Continual Improvement Loop
-- =====================================================================

CREATE TABLE IF NOT EXISTS review_cadences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  cadence_name           text NOT NULL,
  cadence_frequency      text NOT NULL CHECK (cadence_frequency IN
                           ('continuous','hourly','daily','weekly',
                            'biweekly','monthly','quarterly','ad-hoc')),
  cron_expression        text,
  input_kinds            text[] NOT NULL DEFAULT
                           ARRAY['feedback','incident','maintenance_request','inquiry','prayer_request'],
  output_kinds           text[] NOT NULL DEFAULT
                           ARRAY['change_request','project','incident'],
  facilitator_user_id    uuid REFERENCES auth.users(id),
  attendee_user_ids      uuid[] NOT NULL DEFAULT '{}',
  auto_cluster           boolean NOT NULL DEFAULT true,
  auto_priority          boolean NOT NULL DEFAULT true,
  auto_promote_threshold int,
  enabled                boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS review_cadences_instance_idx
  ON review_cadences (instance_id) WHERE enabled = true;

ALTER TABLE review_cadences ENABLE ROW LEVEL SECURITY;
CREATE POLICY rev_cadences_member_read   ON review_cadences FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY rev_cadences_member_insert ON review_cadences FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY rev_cadences_member_update ON review_cadences FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS review_cycles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"pending","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  cadence_id       uuid NOT NULL REFERENCES review_cadences(id) ON DELETE CASCADE,
  cycle_start      timestamptz NOT NULL,
  cycle_end        timestamptz,
  window_start     timestamptz NOT NULL,
  window_end       timestamptz NOT NULL,
  agenda_notes     text,
  outcomes_summary text,
  items_reviewed   int NOT NULL DEFAULT 0,
  items_promoted   int NOT NULL DEFAULT 0,
  items_deferred   int NOT NULL DEFAULT 0,
  items_declined   int NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN
                       ('pending','in-progress','completed','skipped','cancelled'))
);

CREATE INDEX IF NOT EXISTS review_cycles_cadence_status_idx
  ON review_cycles (cadence_id, status);
CREATE INDEX IF NOT EXISTS review_cycles_window_idx
  ON review_cycles (window_start, window_end);

ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rev_cycles_member_read   ON review_cycles FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY rev_cycles_member_insert ON review_cycles FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY rev_cycles_member_update ON review_cycles FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS cycle_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"pending","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  cycle_id   uuid NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  item_kind  text NOT NULL CHECK (item_kind IN
               ('feedback','incident','change_request','project',
                'maintenance_request','inquiry','prayer_request','interaction')),
  item_id    uuid NOT NULL,

  priority_score   numeric(6,2),
  priority_factors jsonb NOT NULL DEFAULT '{}',
  cluster_id       uuid,

  -- POE binding: user override is the last word
  user_priority_override numeric(6,2),
  user_priority_set_by   uuid REFERENCES auth.users(id),
  user_priority_set_at   timestamptz,
  user_priority_reason   text,

  disposition          text CHECK (disposition IN
                         ('approved','approved-with-changes','deferred-next-cycle',
                          'declined','duplicate-of','more-info-needed','escalated',
                          'auto-classified','pending')),
  duplicate_of_item_id uuid,
  disposition_notes    text,
  disposition_at       timestamptz,
  disposition_by       uuid REFERENCES auth.users(id),

  produced_kind text,
  produced_id   uuid
);

CREATE INDEX IF NOT EXISTS cycle_items_priority_idx
  ON cycle_items (cycle_id, COALESCE(user_priority_override, priority_score) DESC);
CREATE INDEX IF NOT EXISTS cycle_items_cluster_idx
  ON cycle_items (cluster_id) WHERE cluster_id IS NOT NULL;

ALTER TABLE cycle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cycle_items_member_read   ON cycle_items FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY cycle_items_member_insert ON cycle_items FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY cycle_items_member_update ON cycle_items FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS change_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"proposed","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,

  title              text NOT NULL,
  description        text,
  change_type        text CHECK (change_type IN
                       ('standard','normal','emergency',
                        'config','copy','feature','process','infrastructure')),
  risk_level         text CHECK (risk_level IN ('low','medium','high','critical')),
  proposed_by_user_id     uuid REFERENCES auth.users(id),
  proposed_by_external_id uuid REFERENCES external_users(id),
  linked_feedback_id uuid REFERENCES feedback(id),
  linked_incident_id uuid REFERENCES incidents(id),
  review_cycle_id    uuid REFERENCES review_cycles(id),
  acceptance_criteria  text,
  implementation_notes text,
  rollback_plan        text,
  status             text NOT NULL DEFAULT 'proposed'
                       CHECK (status IN
                         ('proposed','reviewed','approved','scheduled',
                          'in-progress','completed','verified','rejected','declined','rolled-back')),
  scheduled_for      timestamptz,
  due_by             timestamptz,
  implemented_at     timestamptz,
  implemented_by     uuid REFERENCES auth.users(id),
  verified_at        timestamptz,
  verified_by        uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS change_requests_instance_status_idx
  ON change_requests (instance_id, status);
CREATE INDEX IF NOT EXISTS change_requests_scheduled_for_idx
  ON change_requests (scheduled_for)
  WHERE status IN ('approved','scheduled','in-progress');

ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY change_req_member_read   ON change_requests FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY change_req_member_insert ON change_requests FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY change_req_member_update ON change_requests FOR UPDATE
  USING (user_in_instance(instance_id))
  WITH CHECK (user_in_instance(instance_id));

CREATE TABLE IF NOT EXISTS cross_instance_signals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,  -- PoeTech central's own instance
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"detected","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  signal_kind             text NOT NULL CHECK (signal_kind IN
                            ('feedback-cluster','common-incident',
                             'template-link-pattern','churn-risk',
                             'feature-gap','high-priority-anomaly')),
  detected_at             timestamptz NOT NULL DEFAULT now(),
  window_start            timestamptz NOT NULL,
  window_end              timestamptz NOT NULL,
  affected_instance_count int,
  instance_template       text,
  signal_summary          text NOT NULL,
  sample_anonymized       jsonb,
  proposed_response       text,
  review_cycle_id         uuid REFERENCES review_cycles(id),
  status                  text NOT NULL DEFAULT 'detected'
                            CHECK (status IN
                              ('detected','triaged','acting','responded','closed','ignored'))
);

CREATE INDEX IF NOT EXISTS cross_signals_template_idx
  ON cross_instance_signals (instance_template, detected_at DESC);

ALTER TABLE cross_instance_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY xsignals_member_read ON cross_instance_signals FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY xsignals_member_insert ON cross_instance_signals FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

-- =====================================================================
-- §12.6 Awareness layer
-- =====================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"queued","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  target_user_id     uuid REFERENCES auth.users(id),
  target_external_id uuid REFERENCES external_users(id),
  kind               text NOT NULL CHECK (kind IN
                       ('cycle-board-ready','change-due-soon','change-overdue',
                        'incident-assigned','maintenance-update','prayer-followup',
                        'inquiry-status','rent-due','lease-renewal',
                        'court-date','tax-deadline','digest','custom')),
  channel            text NOT NULL CHECK (channel IN
                       ('in-app','email','sms','push','phone-call')),
  deliver_at         timestamptz NOT NULL,
  delivered_at       timestamptz,
  acknowledged_at    timestamptz,
  title              text NOT NULL,
  body               text NOT NULL,
  action_label       text,
  action_uri         text,
  linked_entity_kind text,
  linked_entity_id   uuid,
  priority           text NOT NULL DEFAULT 'normal'
                       CHECK (priority IN ('low','normal','high','urgent')),
  dedupe_key         text,
  status             text NOT NULL DEFAULT 'queued'
                       CHECK (status IN
                         ('queued','sent','delivered','acknowledged',
                          'failed','superseded','suppressed','expired'))
);

CREATE INDEX IF NOT EXISTS notifications_deliver_at_idx
  ON notifications (deliver_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS notifications_target_user_idx
  ON notifications (target_user_id, status);
CREATE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON notifications (target_user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_self_read ON notifications FOR SELECT
  USING (
    user_in_instance(instance_id)
    AND (target_user_id = auth.uid()
         OR user_role_in_instance(instance_id) IN ('owner','admin'))
  );
CREATE POLICY notifications_member_insert ON notifications FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY notifications_self_update ON notifications FOR UPDATE
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS notification_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  target_user_id     uuid REFERENCES auth.users(id),
  target_external_id uuid REFERENCES external_users(id),
  channel            text NOT NULL CHECK (channel IN ('email','sms','push','phone-call')),
  address            text NOT NULL,
  verified_at        timestamptz,
  preferred          boolean NOT NULL DEFAULT false,
  quiet_hours_start  time,
  quiet_hours_end    time,
  timezone           text,
  status             text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','paused','revoked','bounced')),
  UNIQUE (target_user_id, channel, address)
);

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_channels_self_read   ON notification_channels FOR SELECT
  USING (target_user_id = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY notif_channels_self_insert ON notification_channels FOR INSERT
  WITH CHECK (target_user_id = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY notif_channels_self_update ON notification_channels FOR UPDATE
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS notification_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"active","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  target_user_id     uuid REFERENCES auth.users(id),
  target_external_id uuid REFERENCES external_users(id),
  kind               text NOT NULL,
  channel            text NOT NULL,
  lead_times         interval[] NOT NULL DEFAULT '{}',
  enabled            boolean NOT NULL DEFAULT true,
  UNIQUE (target_user_id, kind, channel)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_prefs_self_read   ON notification_preferences FOR SELECT
  USING (target_user_id = auth.uid());
CREATE POLICY notif_prefs_self_insert ON notification_preferences FOR INSERT
  WITH CHECK (target_user_id = auth.uid());
CREATE POLICY notif_prefs_self_update ON notification_preferences FOR UPDATE
  USING (target_user_id = auth.uid())
  WITH CHECK (target_user_id = auth.uid());

-- =====================================================================
-- §12.7 Reports layer
-- =====================================================================

CREATE TABLE IF NOT EXISTS report_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"generated","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  report_kind     text NOT NULL CHECK (report_kind IN
                    ('cycle-summary','weekly-digest','monthly-status',
                     'quarterly-review','annual-summary',
                     'completion-rate','overdue-list','custom')),
  linked_cycle_id uuid REFERENCES review_cycles(id),
  window_start    timestamptz NOT NULL,
  window_end      timestamptz NOT NULL,
  generated_at    timestamptz NOT NULL DEFAULT now(),
  generated_by    text NOT NULL DEFAULT 'system',
  summary         jsonb NOT NULL,
  narrative       text,
  distribution_user_ids uuid[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS report_runs_instance_kind_idx
  ON report_runs (instance_id, report_kind, generated_at DESC);

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_runs_member_read   ON report_runs FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY report_runs_member_insert ON report_runs FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

CREATE TABLE IF NOT EXISTS report_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  lifecycle   jsonb NOT NULL DEFAULT '{"phase":"captured","log":[]}',
  links       jsonb NOT NULL DEFAULT '[]',

  report_run_id  uuid REFERENCES report_runs(id) ON DELETE CASCADE,
  snapshot_at    timestamptz NOT NULL DEFAULT now(),
  metric_kind    text NOT NULL CHECK (metric_kind IN
                   ('items-committed','items-completed','items-overdue',
                    'completion-rate','median-time-to-close',
                    'notifications-acknowledged-rate',
                    'feedback-volume','incident-volume',
                    'change-request-volume','cycle-on-time-rate')),
  metric_subject text,
  value_numeric  numeric(14,4),
  value_text     text,
  context_jsonb  jsonb
);

CREATE INDEX IF NOT EXISTS report_snapshots_metric_idx
  ON report_snapshots (instance_id, metric_kind, snapshot_at DESC);

ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_snapshots_member_read   ON report_snapshots FOR SELECT
  USING (user_in_instance(instance_id));
CREATE POLICY report_snapshots_member_insert ON report_snapshots FOR INSERT
  WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());

COMMIT;

-- =====================================================================
-- End of schema-v2.8-ops.sql
-- =====================================================================
