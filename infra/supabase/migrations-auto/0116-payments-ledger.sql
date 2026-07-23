-- =============================================================================
-- 0116 — payments ledger: every settled live payment, append-only (DR-0230)
-- =============================================================================
-- Declared by Darrell 2026-07-23: "Start the live payments build now" +
-- "Our Accountant can review however we want it organizationally perfect
--  based on what is up to date."
--
-- One row per processor event: the money truth the Books bridge, the 1099s
-- tab, and the DR-0212 reports read. Written ONLY by the same-origin webhook
-- function (service key, signature-verified — app/functions/api/stripe-webhook.js);
-- no client writes ever. UNIQUE(provider, provider_event_id) makes webhook
-- retries idempotent (at-least-once delivery never double-counts a dollar).
--
-- APPEND-ONLY: no UPDATE/DELETE grants or policies for any client role. A
-- correction is a NEW event (refund/adjustment rows come with their own
-- processor events), never an edit — the accountant's audit trail stays whole.
--
-- PRIVACY (DATA-AS-EMPOWERMENT / DR-0228): payer email is the only personal
-- field, held for receipts/reconciliation; SELECT is steward-scoped (owner/
-- admin of the instance). Rows the webhook cannot scope (no instance metadata)
-- land with NULL instance_id — readable only via the service key, an honest
-- review queue, never guessed onto a family.
--
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies.
-- APPLY: Darrell's hand (db-migrate / Supabase Studio). Until applied, the
-- webhook function answers 503 processor-not-configured and no money is
-- accepted — nothing breaks, nothing silently drops.
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid REFERENCES instances(id) ON DELETE SET NULL,
  provider             text NOT NULL DEFAULT 'stripe',
  provider_event_id    text NOT NULL,          -- idempotency key (Stripe evt_...)
  provider_payment_id  text,                   -- pi_... / cs_... (the money object)
  status               text NOT NULL CHECK (status IN ('settled','pending','refunded')),
  amount_cents         integer NOT NULL CHECK (amount_cents >= 0),
  fee_cents            integer NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  net_cents            integer NOT NULL,
  currency             text NOT NULL DEFAULT 'usd',
  product_key          text,                   -- what was bought (metadata.product)
  entity_id            text NOT NULL DEFAULT 'unassigned',  -- e-personal / e-moore / e-tlc / unassigned
  payer_email          text,
  occurred_at          timestamptz,            -- the processor's event time
  recorded_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS payments_instance_idx ON payments(instance_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS payments_entity_year_idx ON payments(entity_id, occurred_at);

-- Steward read only; NO client INSERT/UPDATE/DELETE — the webhook's service
-- key is the single writer, and even it only ever INSERTs.
GRANT SELECT ON payments TO authenticated;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_steward_read ON payments;
CREATE POLICY payments_steward_read ON payments FOR SELECT
  USING (instance_id IS NOT NULL AND user_role_in_instance(instance_id) IN ('owner','admin'));
