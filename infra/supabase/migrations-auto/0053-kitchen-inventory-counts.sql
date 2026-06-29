-- =============================================================================
-- 0053 — kitchen inventory COUNTS: physical-count sessions + their counted lines
-- =============================================================================
-- Declared by Darrell + Chef Mario 2026-06-25. The chef/kitchen inventory app is
-- the rich VERTICAL on the systems-of-record inventory base (0052): it reuses
-- inventory_items (the catalog: name, category, location, unit, reorder_point as
-- the PAR level, unit_cost) and inventory_movements (the append-only ledger that
-- on-hand is DERIVED from). The kitchen domain (categories, storage areas, count
-- units) is app-level taxonomy carried in the item's existing category / location
-- columns — no new item columns needed for this increment.
--
-- What is genuinely NEW is the COUNT SESSION: a chef walks the walk-in (or the
-- whole kitchen) and records what is physically on the shelf. The system already
-- knows what it EXPECTED (derived on-hand); the difference is variance (shrink /
-- overage) and its dollar value. Closing a count posts an 'adjust' movement per
-- line into inventory_movements so the ledger agrees with the shelf — counts are
-- the reconciliation engine, never a parallel source of truth.
--
-- Two tables:
--   * inventory_counts      — the session header (label, storage-area scope,
--                             status open/closed, who, when). Editable (status
--                             flips open -> closed; updated_at trigger).
--   * inventory_count_lines — one counted item within a session (counted_qty,
--                             the unit/mode it was counted in, plus a SNAPSHOT of
--                             the expected on-hand and unit_cost at count time so
--                             a later catalog edit can't rewrite a closed count's
--                             history). Working data while the count is open, so
--                             members may edit/delete a mis-keyed line; the
--                             permanent audit trail is the adjust MOVEMENTS that
--                             close-out posts into the append-only 0052 ledger.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at),
--             0052-systems-of-record (inventory_items / inventory_movements).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger, guarded
--             publication add. Additive, family-internal — no public surface.
-- APPLY: Darrell's hand (Supabase Studio SQL editor or db-migrate), per the
--        db-migrate gap. The app runs device-local until this is applied; once
--        applied, count sessions sync cross-device the same proven way.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- inventory_counts — the physical-count session header.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_counts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                          -- stable local id ('count-...')
  label         text NOT NULL DEFAULT 'Inventory count',
  storage_area  text,                                   -- scope (null = whole kitchen)
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed')),
  counted_by    text,                                   -- persona key
  note          text,
  started_at    timestamptz,
  closed_at     timestamptz,                            -- set when reconciled
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS inventory_counts_instance_idx ON inventory_counts(instance_id);
CREATE INDEX IF NOT EXISTS inventory_counts_created_idx  ON inventory_counts(instance_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_counts_slug_uniq ON inventory_counts(instance_id, slug);

DROP TRIGGER IF EXISTS inventory_counts_touch_updated ON inventory_counts;
CREATE TRIGGER inventory_counts_touch_updated
  BEFORE UPDATE ON inventory_counts
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_counts TO authenticated;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_counts_read   ON inventory_counts;
DROP POLICY IF EXISTS inventory_counts_insert ON inventory_counts;
DROP POLICY IF EXISTS inventory_counts_update ON inventory_counts;
DROP POLICY IF EXISTS inventory_counts_delete ON inventory_counts;

CREATE POLICY inventory_counts_read ON inventory_counts FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_counts_insert ON inventory_counts FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_counts_update ON inventory_counts FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- DELETE tightened to governors (owner/admin) — discard an abandoned session.
CREATE POLICY inventory_counts_delete ON inventory_counts FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- inventory_count_lines — one counted item within a session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                          -- stable local id ('cl-...')
  count_slug    text NOT NULL,                          -- the inventory_counts.slug it belongs to
  item_slug     text NOT NULL,                          -- the inventory_items.slug counted
  counted_qty   numeric NOT NULL DEFAULT 0,             -- physically on the shelf, in count_unit
  count_unit    text NOT NULL DEFAULT 'each',           -- the unit physically counted in
  count_mode    text NOT NULL DEFAULT 'unit'
                  CHECK (count_mode IN ('unit','weight')),
  expected_qty  numeric NOT NULL DEFAULT 0,             -- SNAPSHOT: derived on-hand at count time
  unit_cost     numeric NOT NULL DEFAULT 0,             -- SNAPSHOT: unit cost at count time (valuation)
  counted_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_count_lines_instance_idx ON inventory_count_lines(instance_id);
CREATE INDEX IF NOT EXISTS inventory_count_lines_count_idx    ON inventory_count_lines(instance_id, count_slug);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_count_lines_slug_uniq ON inventory_count_lines(instance_id, slug);
-- One line per (count, item) so re-counting an item updates the same row.
CREATE UNIQUE INDEX IF NOT EXISTS inventory_count_lines_item_uniq ON inventory_count_lines(instance_id, count_slug, item_slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_count_lines TO authenticated;
ALTER TABLE inventory_count_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_count_lines_read   ON inventory_count_lines;
DROP POLICY IF EXISTS inventory_count_lines_insert ON inventory_count_lines;
DROP POLICY IF EXISTS inventory_count_lines_update ON inventory_count_lines;
DROP POLICY IF EXISTS inventory_count_lines_delete ON inventory_count_lines;

CREATE POLICY inventory_count_lines_read ON inventory_count_lines FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_count_lines_insert ON inventory_count_lines FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_count_lines_update ON inventory_count_lines FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- count lines are working data of an open session — a member may discard a
-- mis-keyed line. The permanent record is the adjust MOVEMENTS that close posts
-- into inventory_movements (0052), which remain append-only / immutable.
CREATE POLICY inventory_count_lines_delete ON inventory_count_lines FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream both tables so a count started on the line tablet shows up
-- live on the chef's phone, the same way the 0052 inventory tables sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'inventory_counts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_counts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'inventory_count_lines'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_count_lines;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
