-- =============================================================================
-- 0083 — Moore Divahs custom orders (Shay's fashion business, DR-0113 board)
-- =============================================================================
-- Discovery: docs/99-session-notes/2026-07-07-moore-divahs-business-system-
-- discovery.md. One row = one custom order riding Shay's pipeline (inquiry →
-- designing → quoted → paid → in-production → ready → delivered → followed-up,
-- + declined/cancelled). The 3-week clock derives from paid_at (never stored as
-- a countdown — honest derivation, DR-0076). Bulk-apparel line items (the
-- 20-25-page Google-Doc killer), change orders (50%-floor ladder with fault
-- attribution), and follow-up state ride the row as jsonb.
--
-- NOT a CRM fork (DR-0081): acquisition leads ride crm_leads via a moore
-- pipeline config; this table begins where a lead converts — the ORDER
-- (fulfillment/production domain, like purchase_orders / board_tasks).
--
-- NO PAYMENT DATA, EVER: pay_method + paid_at record that/how Shay collected
-- (Square / Venmo / Apple Pay — the owner's hand). No card/bank columns exist
-- by design; the engine strips them client-side too (moore-divahs.js).
--
-- TENANT-SCOPED / NO LEAK: Moore Divahs is its own instance; RLS scopes every
-- row to the caller's instance role. NO anon policy — a customer-facing door
-- will write through a forced-safe RPC later (the crm_capture_lead pattern),
-- never direct table access.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger,
--             guarded publication add.
-- =============================================================================

CREATE TABLE IF NOT EXISTS custom_orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by           uuid REFERENCES auth.users(id),
  slug                 text NOT NULL,                    -- stable local id ('mo-...')
  stage                text NOT NULL DEFAULT 'inquiry'
                         CHECK (stage IN ('inquiry','designing','quoted','paid','in-production','ready','delivered','followed-up','declined','cancelled')),
  customer_name        text NOT NULL DEFAULT '',
  contact_value        text,                             -- handle/email — contact-level only
  channel              text NOT NULL DEFAULT 'other',    -- instagram/facebook/tiktok/email/whats-going-on-qc/partner-business/...
  product_type         text NOT NULL DEFAULT 'other',    -- custom-clothing/scrub-cap/custom-shoes/bulk-apparel/other
  description          text,                             -- what they want, in their words
  inspo_notes          text,                             -- inspo pictures stay in DMs; noted here
  size_or_measurements text,                             -- out-of-town = size; local = measured in person
  fabric               text,
  bulk_lines           jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{qty,cut,size,color,names[]}]
  quote_cents          integer NOT NULL DEFAULT 0,       -- materials included in the price
  paid_at              timestamptz,                      -- full payment up front; the 3-week clock derives from this
  pay_method           text,                             -- square/venmo/apple-pay/cash/other — a RECORD, never processing
  turnaround_days      integer NOT NULL DEFAULT 21,
  materials_cents      integer NOT NULL DEFAULT 0,       -- real spend, feeds margin
  delivery             text NOT NULL DEFAULT 'ship' CHECK (delivery IN ('ship','pickup')),
  delivered_at         timestamptz,
  follow_up            jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {asked,photoReceived,note}
  change_orders        jsonb NOT NULL DEFAULT '[]'::jsonb,   -- append-only fee ladder events
  policy_accepted      boolean NOT NULL DEFAULT false,   -- change/cancel policy consent at order time
  seed                 boolean NOT NULL DEFAULT false,
  history              jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{stage,at}] — the historical account
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  updated_by           uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS custom_orders_instance_idx ON custom_orders(instance_id);
CREATE INDEX IF NOT EXISTS custom_orders_stage_idx    ON custom_orders(stage);
CREATE INDEX IF NOT EXISTS custom_orders_paid_idx     ON custom_orders(paid_at);
-- One row per (instance, slug): idempotent re-upload can never duplicate an order.
CREATE UNIQUE INDEX IF NOT EXISTS custom_orders_slug_uniq ON custom_orders(instance_id, slug);

-- updated_at touch (shared function from 0011/0023).
DROP TRIGGER IF EXISTS custom_orders_touch_updated ON custom_orders;
CREATE TRIGGER custom_orders_touch_updated
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- GRANTs: authenticated needs the explicit grant (0024 posture; the Choir
-- incident). NO grant to anon — orders are never publicly readable/writable.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_orders TO authenticated;

ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Instance scope: owner/admin/member read+write; DELETE tightened to
-- owner/admin (a member can move/status an order but not hard-drop the record).
DROP POLICY IF EXISTS custom_orders_read   ON custom_orders;
DROP POLICY IF EXISTS custom_orders_insert ON custom_orders;
DROP POLICY IF EXISTS custom_orders_update ON custom_orders;
DROP POLICY IF EXISTS custom_orders_delete ON custom_orders;

CREATE POLICY custom_orders_read ON custom_orders FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY custom_orders_insert ON custom_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY custom_orders_update ON custom_orders FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY custom_orders_delete ON custom_orders FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — an order updated on Shay's phone shows on the laptop live.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'custom_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_orders;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- Verify after apply (adversarial RLS probe, per the 0059 pattern):
--   As anon:            GET /rest/v1/custom_orders?select=slug -> [] or 401 (never rows)
--   As a stranger auth: GET /rest/v1/custom_orders?select=slug -> [] (own instance empty)
--   As Shay/steward:    INSERT/UPDATE/SELECT succeed, scoped to the moore instance.
-- =============================================================================
