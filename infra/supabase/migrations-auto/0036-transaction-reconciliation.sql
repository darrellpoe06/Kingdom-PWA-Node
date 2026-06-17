-- =============================================================================
-- 0036 — transaction.reconciliation: evidence-backed bank match + invoice rollup
-- =============================================================================
-- A single bank withdrawal can pay several merchant invoices at once. The flat
-- `transactions` ledger holds ONE row per bank debit (one amount, one date),
-- but it had nowhere to record (a) that the debit is CONFIRMED against the bank
-- statement / receipt email, and (b) the itemized invoices that rolled up into
-- that one debit. This adds a single additive jsonb column to carry both.
--
-- WHY A STORED ATTESTATION (not only the existing derived match): the Books Tx
-- feed already shows a "✓ bank-confirmed" badge when a manual entry dedupe-
-- matches a NAS bank-ingest row (Phase 2A/2E). That match is DERIVED at render
-- time and depends on the ingest feed being present. `reconciliation` is the
-- complementary STORED fact: "this debit was reconciled to the bank/email on
-- <date>, here is the receipt evidence and the invoices it covers." It is the
-- seed of the email-confirmed reconciliation the financial vision calls for
-- (verify the record against the receipt, then against the bank).
--
-- SHAPE (app-enforced, not a DB CHECK — jsonb stays flexible):
--   {
--     "matched": true,
--     "matched_to": ["bank","email"],   -- evidence sources
--     "merchant": "...", "method": "visa-debit", "card_last4": "6333",
--     "auth": "...", "reference": "...", "trans_id": "...", "invoice": "...",
--     "charged_at": "2026-06-15T13:58:00", "total": 833.53,
--     "orders": [ { "order","acct","patient","paid","tax","lines":[...] }, ... ]
--   }
-- INVARIANT (lib/reconciliation.js + proven-to-catch test): when matched,
--   sum(orders[].paid) === total === abs(transaction.amount). A mismatch fails
--   the gate so a bad rollup can never read as "matched." Only the last 4 of a
--   card is ever stored — never a full PAN.
--
-- ROLE-SCOPED / NO LEAK: `transactions` is already a family-private table
-- (RLS user_in_instance + owner-delete, set in schema-v1). This is a pure
-- additive column on that table — no new policy, no new grant, no anon path.
-- A logged-out client still cannot read a single row.
--
-- DEPENDS ON: schema-v1 (transactions table + its RLS/grants).
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS. Additive, family-internal, reversible.
-- =============================================================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reconciliation jsonb;

COMMENT ON COLUMN transactions.reconciliation IS
  'Optional bank-match attestation + itemized invoice rollup for a single debit. '
  'When matched, sum(orders[].paid) === total === abs(amount) (enforced in app). '
  'Stores only card last-4, never a full PAN. See migration 0036.';

NOTIFY pgrst, 'reload schema';
