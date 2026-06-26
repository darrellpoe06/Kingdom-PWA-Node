-- =============================================================================
-- 0052 — systems of record: inventory control + the immutable history log
-- =============================================================================
-- Declared by Darrell 2026-06-25. "Books are the same — not helping more than an
-- Excel document. It should keep historical accuracy and information processing
-- ... easy corporate business systems, typical inventory controls." This is the
-- backend for the move from flat surfaces to REAL systems of record: derived
-- truth over an append-only ledger, with a full, attributed, recoverable history
-- of every record.
--
-- THREE tables, two of them deliberately APPEND-ONLY (the corporate control that
-- a spreadsheet cannot give you — once written, a fact cannot be quietly edited):
--
--   inventory_items      — the catalog (editable). Each edit is ALSO captured in
--                          record_events, so the item is a versioned record.
--   inventory_movements  — the stock ledger (APPEND-ONLY). On-hand is DERIVED
--                          from the sum of these movements (lib/inventory.js),
--                          never stored. The ledger IS the audit trail.
--   record_events        — the generic history/version log (APPEND-ONLY) behind
--                          lib/record-history.js: one row per change to ANY
--                          tracked record (inventory item, Books transaction…).
--
-- IMMUTABILITY is enforced at the DB, not just in code: inventory_movements and
-- record_events grant ONLY SELECT + INSERT and have NO update/delete policy, so a
-- posted row can never be altered or removed. A correction is a NEW row (a count
-- adjustment, a reversing movement), exactly as a general ledger works.
--
-- ROLE-SCOPED / NO LEAK: family-internal operations data. RLS scopes every row to
-- the caller's instance and to owner/admin/member roles (the same family/governor
-- scope Projects / Discussions run under). There is NO anon policy — never public.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--             publication adds. Additive, family-internal — no public surface.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- inventory_items — the catalog (editable). slug is the stable local id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by     uuid REFERENCES auth.users(id),
  slug           text NOT NULL,                 -- stable local id ('inv-...')
  sku            text,
  name           text NOT NULL DEFAULT 'Untitled item',
  category       text,
  location       text,                          -- home/default storage location
  unit           text NOT NULL DEFAULT 'each',
  reorder_point  numeric NOT NULL DEFAULT 0,    -- low-stock threshold (derived status)
  unit_cost      numeric NOT NULL DEFAULT 0,    -- for valuation (on_hand * unit_cost)
  allow_negative boolean NOT NULL DEFAULT false,-- consignment/opt-in to negative stock
  notes          text,
  active         boolean NOT NULL DEFAULT true, -- soft-retire (never hard-deleted in app)
  author_persona text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS inventory_items_instance_idx ON inventory_items(instance_id);
CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON inventory_items(instance_id, category);
-- One row per (instance, slug): an idempotent re-upload can't duplicate an item.
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_slug_uniq ON inventory_items(instance_id, slug);

DROP TRIGGER IF EXISTS inventory_items_touch_updated ON inventory_items;
CREATE TRIGGER inventory_items_touch_updated
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_items TO authenticated;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_read   ON inventory_items;
DROP POLICY IF EXISTS inventory_items_insert ON inventory_items;
DROP POLICY IF EXISTS inventory_items_update ON inventory_items;
DROP POLICY IF EXISTS inventory_items_delete ON inventory_items;

CREATE POLICY inventory_items_read ON inventory_items FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_items_insert ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_items_update ON inventory_items FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- Hard delete tightened to the governors; members soft-retire via active=false.
CREATE POLICY inventory_items_delete ON inventory_items FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- inventory_movements — the APPEND-ONLY stock ledger. On-hand is derived from
-- the signed sum of these rows. NO update/delete policy → immutable by design.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid REFERENCES auth.users(id),
  slug          text NOT NULL,                  -- stable local id ('mv-...')
  item_slug     text NOT NULL,                  -- the inventory_items.slug it moves
  kind          text NOT NULL
                  CHECK (kind IN ('in','out','adjust','transfer-out','transfer-in')),
  qty           numeric NOT NULL,               -- positive magnitude (adjust may be signed)
  location      text,
  to_location   text,                           -- transfer destination
  from_location text,                           -- transfer source
  reason        text,
  ref           text,                           -- PO #, ticket, service ref…
  actor         text,                           -- who posted it (persona key)
  transfer_id   text,                           -- links the two legs of a transfer
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_movements_instance_idx ON inventory_movements(instance_id);
CREATE INDEX IF NOT EXISTS inventory_movements_item_idx     ON inventory_movements(instance_id, item_slug);
CREATE INDEX IF NOT EXISTS inventory_movements_occurred_idx ON inventory_movements(instance_id, occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_slug_uniq ON inventory_movements(instance_id, slug);

-- APPEND-ONLY: SELECT + INSERT only. No UPDATE/DELETE grant, no UPDATE/DELETE
-- policy → a posted movement is immutable. Correct by posting a new movement.
GRANT SELECT, INSERT ON inventory_movements TO authenticated;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_movements_read   ON inventory_movements;
DROP POLICY IF EXISTS inventory_movements_insert ON inventory_movements;

CREATE POLICY inventory_movements_read ON inventory_movements FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY inventory_movements_insert ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- record_events — the generic APPEND-ONLY history/version log. One row per
-- change to ANY tracked record. NO update/delete policy → immutable by design.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                   -- stable local id ('re-...')
  record_kind  text NOT NULL,                   -- 'inventory_item','transaction',…
  record_id    text NOT NULL,                   -- the tracked record's local id
  action       text NOT NULL DEFAULT 'update'
                 CHECK (action IN ('create','update','delete','restore','movement','note')),
  actor        text,                            -- who made the change (persona key)
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  before       jsonb,                           -- snapshot before (null on create)
  after        jsonb,                           -- snapshot after (null on delete)
  changes      jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { field: { from, to } }
  summary      text,
  meta         jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS record_events_instance_idx ON record_events(instance_id);
CREATE INDEX IF NOT EXISTS record_events_record_idx   ON record_events(instance_id, record_kind, record_id);
CREATE INDEX IF NOT EXISTS record_events_occurred_idx ON record_events(instance_id, occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS record_events_slug_uniq ON record_events(instance_id, slug);

-- APPEND-ONLY: SELECT + INSERT only. A history event, once written, is permanent.
GRANT SELECT, INSERT ON record_events TO authenticated;
ALTER TABLE record_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS record_events_read   ON record_events;
DROP POLICY IF EXISTS record_events_insert ON record_events;

CREATE POLICY record_events_read ON record_events FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY record_events_insert ON record_events FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream all three so a movement posted on one device updates the
-- derived on-hand on another live, the same way accounts / projects sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public' AND tablename = 'inventory_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public' AND tablename = 'inventory_movements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_movements;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public' AND tablename = 'record_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE record_events;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
