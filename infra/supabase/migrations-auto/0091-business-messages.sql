-- =============================================================================
-- 0091 — business messages: Shay ↔ her customers, inside the app
-- =============================================================================
-- Darrell 2026-07-07: "messaging for her customers inside the app." This kills
-- the DM-scatter at the source: one thread per customer per business, the
-- steward sees every thread in her instance, a customer sees ONLY their own —
-- the 0087 read-own lane extended to write-own-thread.
--
-- Threads live in the BUSINESS instance (moore-divahs — Shay owner, Darrell
-- admin), keyed by the customer's auth uid. All traffic rides two SECURITY
-- DEFINER RPCs so the client stays dumb and the shape stays forced-safe:
--   * fetch_business_messages(slug, customer?) — steward: any thread in her
--     instance (or the thread list); customer: their own thread only.
--   * send_business_message(slug, body, customer?) — steward replies to a
--     named customer; a customer can only ever write to their own thread, and
--     the sender field is FORCED server-side (never client-claimed).
-- Direct-table RLS mirrors the same rule (read-own / steward-instance) so
-- realtime can stream later; no anon access anywhere; contact-level content
-- only (no payment data — the app never carries it).
-- DEPENDS ON: schema-v2.1-infra, 0089 (moore-divahs instance). IDEMPOTENT.
-- =============================================================================

CREATE TABLE IF NOT EXISTS business_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  customer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender           text NOT NULL CHECK (sender IN ('steward','customer')),
  sender_user_id   uuid REFERENCES auth.users(id),
  body             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_messages_instance_idx ON business_messages(instance_id);
CREATE INDEX IF NOT EXISTS business_messages_thread_idx   ON business_messages(instance_id, customer_user_id, created_at);

GRANT SELECT, INSERT ON business_messages TO authenticated;

ALTER TABLE business_messages ENABLE ROW LEVEL SECURITY;

-- Steward: full thread visibility inside her instance. Customer: their own
-- thread only. No UPDATE/DELETE policies — the thread is append-only history.
DROP POLICY IF EXISTS business_messages_read_steward   ON business_messages;
DROP POLICY IF EXISTS business_messages_read_own       ON business_messages;
DROP POLICY IF EXISTS business_messages_insert_steward ON business_messages;
DROP POLICY IF EXISTS business_messages_insert_own     ON business_messages;

CREATE POLICY business_messages_read_steward ON business_messages FOR SELECT
  TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY business_messages_read_own ON business_messages FOR SELECT
  TO authenticated USING (customer_user_id = auth.uid());
CREATE POLICY business_messages_insert_steward ON business_messages FOR INSERT
  TO authenticated WITH CHECK (
    user_role_in_instance(instance_id) IN ('owner','admin','member')
    AND sender = 'steward' AND sender_user_id = auth.uid()
  );
CREATE POLICY business_messages_insert_own ON business_messages FOR INSERT
  TO authenticated WITH CHECK (
    customer_user_id = auth.uid()
    AND sender = 'customer' AND sender_user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- The two RPC seams (SECURITY DEFINER; signed-in only, NEVER anon).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fetch_business_messages(p_instance_slug text, p_customer uuid DEFAULT NULL)
RETURNS TABLE (customer_user_id uuid, sender text, body text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst uuid;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  IF v_inst IS NULL THEN RAISE EXCEPTION 'unknown business'; END IF;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IN ('owner','admin','member') THEN
    RETURN QUERY SELECT m.customer_user_id, m.sender, m.body, m.created_at
      FROM business_messages m
      WHERE m.instance_id = v_inst
        AND (p_customer IS NULL OR m.customer_user_id = p_customer)
      ORDER BY m.created_at ASC LIMIT 500;
  ELSE
    RETURN QUERY SELECT m.customer_user_id, m.sender, m.body, m.created_at
      FROM business_messages m
      WHERE m.instance_id = v_inst AND m.customer_user_id = auth.uid()
      ORDER BY m.created_at ASC LIMIT 500;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.send_business_message(p_instance_slug text, p_body text, p_customer uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst uuid;
  v_role text;
  v_id uuid;
  v_body text := trim(coalesce(p_body, ''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF v_body = '' THEN RAISE EXCEPTION 'empty message'; END IF;
  IF length(v_body) > 4000 THEN RAISE EXCEPTION 'message too long'; END IF;
  SELECT id INTO v_inst FROM instances WHERE slug = p_instance_slug;
  IF v_inst IS NULL THEN RAISE EXCEPTION 'unknown business'; END IF;
  SELECT im.role INTO v_role FROM instance_members im WHERE im.instance_id = v_inst AND im.user_id = auth.uid();
  IF v_role IN ('owner','admin','member') AND p_customer IS NOT NULL THEN
    -- Steward reply to a named customer's thread; sender FORCED server-side.
    INSERT INTO business_messages (instance_id, customer_user_id, sender, sender_user_id, body)
    VALUES (v_inst, p_customer, 'steward', auth.uid(), v_body) RETURNING id INTO v_id;
  ELSE
    -- A customer writes only their OWN thread, whatever they passed.
    INSERT INTO business_messages (instance_id, customer_user_id, sender, sender_user_id, body)
    VALUES (v_inst, auth.uid(), 'customer', auth.uid(), v_body) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.fetch_business_messages(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_business_message(text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.fetch_business_messages(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_business_message(text, text, uuid) TO authenticated;

DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'business_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE business_messages;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';

-- Verify after apply:
--   As anon: both RPCs -> permission denied; table SELECT -> nothing.
--   As a customer: fetch -> own thread only; send lands sender='customer' on
--     their own uid regardless of p_customer.
--   As Shay: fetch(all/named) -> her instance's threads; send(customer) ->
--     sender='steward'. No UPDATE/DELETE path exists (append-only).
