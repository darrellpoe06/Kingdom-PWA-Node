-- =============================================================================
-- 0087 — Moore Divahs "My Orders": clients see THEIR OWN history, Shay sees all
-- =============================================================================
-- Darrell 2026-07-07: "Her clients will be able to have a user name and history
-- and be able to log back into the app and see their histories and Shay will be
-- able to see it too." Shay's side is already true (instance RLS). This adds
-- the CLIENT side as a narrow read-YOUR-OWN lane:
--   * customer_user_id links an order / class seat to the client's account.
--   * my_moore_orders() / my_moore_class_seats() (SECURITY DEFINER, signed-in
--     only, NEVER anon) return rows that are verifiably the caller's — linked
--     by customer_user_id, or matched to the caller's own verified sign-in
--     email in contact_value (so history works before Shay ever touches a uuid).
--   * Additive read-own RLS policies mirror the same rule at the table layer.
-- No client write path is added; steward writes are unchanged; no other
-- customer's row is ever reachable. Reusable lane for every future business
-- door (the customer-history pattern).
-- DEPENDS ON: 0083 (custom_orders), 0084 (class_signups). IDEMPOTENT.
-- =============================================================================

ALTER TABLE custom_orders ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);
ALTER TABLE class_signups ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS custom_orders_customer_idx ON custom_orders(customer_user_id);
CREATE INDEX IF NOT EXISTS class_signups_customer_idx ON class_signups(customer_user_id);

-- Read-YOUR-OWN policies (additive; policies OR together). A client reads only
-- rows explicitly linked to their account — steward scope is untouched.
DROP POLICY IF EXISTS custom_orders_read_own ON custom_orders;
CREATE POLICY custom_orders_read_own ON custom_orders FOR SELECT
  TO authenticated USING (customer_user_id = auth.uid());
DROP POLICY IF EXISTS class_signups_read_own ON class_signups;
CREATE POLICY class_signups_read_own ON class_signups FOR SELECT
  TO authenticated USING (customer_user_id = auth.uid());

-- The client history read: linked rows PLUS rows whose contact is the caller's
-- own verified sign-in email (case-insensitive). Field list is the customer's
-- own order only — no steward notes, no other customers, no materials cost.
CREATE OR REPLACE FUNCTION public.my_moore_orders()
RETURNS TABLE (
  slug            text,
  stage           text,
  product_type    text,
  description     text,
  quote_cents     integer,
  paid_at         timestamptz,
  turnaround_days integer,
  delivery        text,
  delivered_at    timestamptz,
  created_at      timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.slug, o.stage, o.product_type, o.description, o.quote_cents,
         o.paid_at, o.turnaround_days, o.delivery, o.delivered_at, o.created_at
  FROM custom_orders o
  WHERE auth.uid() IS NOT NULL
    AND (
      o.customer_user_id = auth.uid()
      OR (auth.email() IS NOT NULL AND lower(o.contact_value) = lower(auth.email()))
    )
  ORDER BY o.created_at DESC
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.my_moore_class_seats()
RETURNS TABLE (
  slug         text,
  session_slug text,
  student_name text,
  paid_at      timestamptz,
  created_at   timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.slug, g.session_slug, g.student_name, g.paid_at, g.created_at
  FROM class_signups g
  WHERE auth.uid() IS NOT NULL
    AND (
      g.customer_user_id = auth.uid()
      OR (auth.email() IS NOT NULL AND lower(g.contact_value) = lower(auth.email()))
    )
  ORDER BY g.created_at DESC
  LIMIT 100;
$$;

-- Signed-in only. NO anon execute — an anonymous visitor has no "own" history.
REVOKE EXECUTE ON FUNCTION public.my_moore_orders() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_moore_class_seats() FROM anon;
GRANT EXECUTE ON FUNCTION public.my_moore_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_moore_class_seats() TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon:   POST /rest/v1/rpc/my_moore_orders -> 401/permission denied.
--   As client: returns ONLY rows linked to their uid or their own email.
--   As a stranger with no orders: [] (never someone else's history).
