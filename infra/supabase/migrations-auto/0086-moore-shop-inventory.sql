-- =============================================================================
-- 0086 — Moore Divahs shop inventory (materials on hand + spend → margin)
-- =============================================================================
-- Discovery 2026-07-07 §5: Shay holds inventory at home and needs what's on
-- hand, what she spends, and what each order consumes — the cost input to the
-- margin/KPI engine. Same recipe as 0083/0084 (0059 pattern): instance RLS,
-- explicit authenticated GRANT, NO anon, realtime. On-hand VALUE is derived
-- (qty × unit cost) in the engine — never stored (DR-0076).
-- DEPENDS ON: schema-v2.1-infra, 0024, 0011/0023. IDEMPOTENT throughout.
-- =============================================================================

CREATE TABLE IF NOT EXISTS shop_inventory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id),
  slug            text NOT NULL,                 -- stable local id ('mi-...')
  name            text NOT NULL DEFAULT '',
  category        text NOT NULL DEFAULT 'other'
                    CHECK (category IN ('fabric','notions','blanks','thread','other')),
  qty             numeric NOT NULL DEFAULT 0,    -- yards / count on hand
  unit            text NOT NULL DEFAULT 'each',
  unit_cost_cents integer NOT NULL DEFAULT 0,    -- real spend per unit
  notes           text,
  seed            boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  updated_by      uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS shop_inventory_instance_idx ON shop_inventory(instance_id);
CREATE UNIQUE INDEX IF NOT EXISTS shop_inventory_slug_uniq ON shop_inventory(instance_id, slug);

DROP TRIGGER IF EXISTS shop_inventory_touch_updated ON shop_inventory;
CREATE TRIGGER shop_inventory_touch_updated
  BEFORE UPDATE ON shop_inventory
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON shop_inventory TO authenticated;

ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_inventory_read   ON shop_inventory;
DROP POLICY IF EXISTS shop_inventory_insert ON shop_inventory;
DROP POLICY IF EXISTS shop_inventory_update ON shop_inventory;
DROP POLICY IF EXISTS shop_inventory_delete ON shop_inventory;
CREATE POLICY shop_inventory_read ON shop_inventory FOR SELECT
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY shop_inventory_insert ON shop_inventory FOR INSERT
  TO authenticated WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY shop_inventory_update ON shop_inventory FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY shop_inventory_delete ON shop_inventory FOR DELETE
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shop_inventory'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_inventory;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
