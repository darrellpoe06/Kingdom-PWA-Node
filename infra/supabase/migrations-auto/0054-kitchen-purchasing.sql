-- =============================================================================
-- 0054 — kitchen PURCHASING: vendor on items + purchase-order drafts (approve-gate)
-- =============================================================================
-- Declared by Darrell + Chef Mario 2026-06-26. The first purchasing increment of
-- Mario's direct-to-purchasing north star (docs/kitchen-inventory/PRD.md sec 9, P4):
-- from the LIVE inventory + par levels, generate "what to order" purchase-order
-- DRAFTS grouped by vendor (qty to hit par), which a human REVIEWS and APPROVES.
--
-- BINDING — approve-to-purchase: the system drafts + previews and records an
-- APPROVED order; PLACING the order / spending money stays the owner's hand (an
-- explicit human action). Nothing here transmits an order or moves money. PO
-- status walks draft -> approved -> placed -> received; only a human advances it.
-- RECEIVING reconciles back into stock by posting 'in' movements into the 0052
-- append-only ledger (the perpetual-inventory tie), so on-hand stays derived.
--
-- Adds:
--   * inventory_items.vendor  — the preferred vendor a draft groups an item under.
--   * purchase_orders         — the draft/approved order header (per vendor).
--   * purchase_order_lines    — one ordered item (qty to par, cost snapshot).
--
-- DEPENDS ON: 0052-systems-of-record (inventory_items / inventory_movements),
--   schema-v2.1-infra (instances, user_role_in_instance), 0024 (grants),
--   0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT EXISTS, DROP-then-CREATE
--   policies/triggers, guarded publication add. Additive, family-internal.
-- APPLY: Darrell's hand (Supabase Studio / db-migrate). App runs device-local
--   until applied; then drafts + approved POs sync cross-device.
-- =============================================================================

-- Preferred vendor on the catalog item (drives draft grouping). Free text so a
-- new vendor needs no migration; the app owns the vendor list.
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS vendor text;

-- ---------------------------------------------------------------------------
-- purchase_orders — the order header (one per vendor per draft/approval).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                            -- stable local id ('po-...')
  vendor       text,                                     -- vendor this order is for
  label        text NOT NULL DEFAULT 'Purchase order',
  status       text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','approved','placed','received')),
  total_qty    numeric NOT NULL DEFAULT 0,               -- snapshot at approval
  total_cost   numeric NOT NULL DEFAULT 0,               -- snapshot at approval (estimate)
  note         text,
  approved_by  uuid REFERENCES auth.users(id),           -- the human who approved
  approved_at  timestamptz,
  placed_at    timestamptz,                              -- owner placed the order (their hand)
  received_at  timestamptz,                              -- received into stock
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS purchase_orders_instance_idx ON purchase_orders(instance_id);
CREATE INDEX IF NOT EXISTS purchase_orders_created_idx  ON purchase_orders(instance_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_slug_uniq ON purchase_orders(instance_id, slug);

DROP TRIGGER IF EXISTS purchase_orders_touch_updated ON purchase_orders;
CREATE TRIGGER purchase_orders_touch_updated
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_orders_read   ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_insert ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_update ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_delete ON purchase_orders;

CREATE POLICY purchase_orders_read ON purchase_orders FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY purchase_orders_insert ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY purchase_orders_update ON purchase_orders FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- DELETE tightened to governors (owner/admin) — discard a draft.
CREATE POLICY purchase_orders_delete ON purchase_orders FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- purchase_order_lines — one ordered item within a PO (qty-to-par + cost snapshot).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id),
  slug         text NOT NULL,                            -- stable local id ('pol-...')
  po_slug      text NOT NULL,                            -- the purchase_orders.slug it belongs to
  item_slug    text NOT NULL,                            -- the inventory_items.slug ordered
  item_name    text,                                     -- snapshot of the item name at order time
  order_qty    numeric NOT NULL DEFAULT 0,               -- qty to bring on-hand up to par
  unit         text,                                     -- the item's stock unit (snapshot)
  unit_cost    numeric NOT NULL DEFAULT 0,               -- snapshot for the estimate
  line_cost    numeric NOT NULL DEFAULT 0,               -- order_qty * unit_cost (snapshot)
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS purchase_order_lines_instance_idx ON purchase_order_lines(instance_id);
CREATE INDEX IF NOT EXISTS purchase_order_lines_po_idx       ON purchase_order_lines(instance_id, po_slug);
CREATE UNIQUE INDEX IF NOT EXISTS purchase_order_lines_slug_uniq ON purchase_order_lines(instance_id, slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_lines TO authenticated;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_order_lines_read   ON purchase_order_lines;
DROP POLICY IF EXISTS purchase_order_lines_insert ON purchase_order_lines;
DROP POLICY IF EXISTS purchase_order_lines_update ON purchase_order_lines;
DROP POLICY IF EXISTS purchase_order_lines_delete ON purchase_order_lines;

CREATE POLICY purchase_order_lines_read ON purchase_order_lines FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY purchase_order_lines_insert ON purchase_order_lines FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY purchase_order_lines_update ON purchase_order_lines FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY purchase_order_lines_delete ON purchase_order_lines FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream so a draft built on one device shows up live on another.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'purchase_orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'purchase_order_lines') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchase_order_lines;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
