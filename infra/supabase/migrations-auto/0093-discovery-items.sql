-- =============================================================================
-- 0093 — discovery items: recorded client discovery, reviewable in the app
-- =============================================================================
-- CLIENT-BUSINESS-FACTORY step 1 (DR-0114/0117): a client's voice notes ride
-- the NAS rails into requirements.json; parseDiscoveryJson() turns that into
-- items that each carry the client's OWN source_quote. This table is where
-- those items land so a steward can review them IN THE APP (Projects → the
-- Clients queue): every item stays status='extracted' until a human confirms
-- it — nothing unreviewed is built (the extraction contract's own rule).
-- Confirmed requirements import as real board_tasks rows (0059) on the
-- client's build board.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add.
-- =============================================================================

CREATE TABLE IF NOT EXISTS discovery_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES auth.users(id),
  slug             text NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('requirement','pricing','policy','pain-point')),
  area             text,
  text             text NOT NULL,
  amount_text      text,
  confidence       text CHECK (confidence IN ('high','medium','low') OR confidence IS NULL),
  source_quote     text,
  client_name      text,
  business_name    text,
  source_recording text,
  source_run       text,
  extracted_at     timestamptz,
  -- The review gate: extracted → reviewed (build on it) or rejected (kept as
  -- record, never built). A steward's word, never the extractor's.
  status           text NOT NULL DEFAULT 'extracted' CHECK (status IN ('extracted','reviewed','rejected')),
  reviewed_by      uuid REFERENCES auth.users(id),
  reviewed_at      timestamptz,
  -- Where a confirmed requirement went: the board_tasks slug it imported to.
  imported_task_slug text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz,
  updated_by       uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS discovery_items_instance_idx ON discovery_items(instance_id);
CREATE INDEX IF NOT EXISTS discovery_items_status_idx   ON discovery_items(instance_id, status);
-- One row per (instance, slug): idempotent re-upload can never duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS discovery_items_slug_uniq ON discovery_items(instance_id, slug);

-- updated_at touch (shared function from 0011/0023).
DROP TRIGGER IF EXISTS discovery_items_touch_updated ON discovery_items;
CREATE TRIGGER discovery_items_touch_updated
  BEFORE UPDATE ON discovery_items
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- GRANTs: authenticated needs the explicit grant (0024 posture). NO grant to
-- anon — a client's discovery record is never publicly readable.
GRANT SELECT, INSERT, UPDATE, DELETE ON discovery_items TO authenticated;

ALTER TABLE discovery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discovery_items_read   ON discovery_items;
DROP POLICY IF EXISTS discovery_items_insert ON discovery_items;
DROP POLICY IF EXISTS discovery_items_update ON discovery_items;
DROP POLICY IF EXISTS discovery_items_delete ON discovery_items;

CREATE POLICY discovery_items_read ON discovery_items FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discovery_items_insert ON discovery_items FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discovery_items_update ON discovery_items FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY discovery_items_delete ON discovery_items FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- REALTIME — a review confirmed on the phone shows on the laptop live.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'discovery_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE discovery_items;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
