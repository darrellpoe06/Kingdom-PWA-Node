-- ============================================================================
-- 0136 — transactions.updated_at becomes a trustworthy watermark
-- ============================================================================
-- THE MEASUREMENT THIS RESTS ON (2026-08-15, live production reads):
--   * 1,978 of 2,951 transactions rows have updated_at NULL — 67% of the
--     ledger is INVISIBLE to any updated_at watermark today.
--   * The only trigger on the table is transactions_resolve_account
--     (BEFORE INSERT OR UPDATE, resolve_account_slug_to_id) — nothing touches
--     updated_at, so an edited row keeps its stale timestamp and a delta sync
--     would silently skip the edit. That silent skip is the entire risk.
--   * record_events already records the ledger's deletes (18,502 measured,
--     concentrated in the Jul 18–21 dedupe), keyed by the LOCAL id in
--     record_id — so deletion reconciliation needs NO soft-delete column and
--     the ledger's semantics and RLS policies stay untouched.
--
-- WHY (DR-0305's second burner): transactions is 3.4 MB and re-downloads WHOLE
-- on every one of its 17,374 lifetime writes. The client's watermark delta
-- (table-sync.js `mutableDelta`) fetches only rows where updated_at advanced —
-- but only after this migration makes updated_at true on every row, forever.
--
-- Plan reviewed by a second model (Gemini), then corrected by measurement:
-- its "add last_modified_at" became "repair the updated_at you already have",
-- and its soft-delete column was dropped because the audit log already covers
-- deletes. Idempotent throughout; safe to re-run.

-- 1) The touch function. CREATE OR REPLACE + a fixed name: re-running is safe,
--    and other tables can adopt the same function later without a second copy.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.touch_updated_at() IS
  '0136: stamps NEW.updated_at on every INSERT/UPDATE so updated_at is a trustworthy delta-sync watermark. Attached to transactions; adoptable by any table.';

-- 2) Backfill the 1,978 NULLs. COALESCE(created_at, now()) rather than a flat
--    now(): created_at is the truthful "when did this row last change" for a
--    row never edited since insert, and any value <= now() is equally safe for
--    the watermark (clients hold no watermark until their first FULL read).
UPDATE public.transactions
   SET updated_at = COALESCE(created_at, now())
 WHERE updated_at IS NULL;

-- 3) The trigger. INSERT OR UPDATE — inserts too, so a fresh row is never
--    behind a client watermark that another row's edit just advanced.
DROP TRIGGER IF EXISTS transactions_touch_updated_at ON public.transactions;
CREATE TRIGGER transactions_touch_updated_at
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) The delta's read path: (instance_id, updated_at) is exactly the client's
--    `.eq(instance_id).gt(updated_at)` query shape.
CREATE INDEX IF NOT EXISTS transactions_instance_updated_at_idx
  ON public.transactions (instance_id, updated_at);

-- 5) PROVE it rather than trust it (DR-0076): zero NULLs may remain, and the
--    trigger must exist. A migration that half-applied fails loudly here.
DO $$
DECLARE nulls int; trig int;
BEGIN
  SELECT count(*) INTO nulls FROM public.transactions WHERE updated_at IS NULL;
  IF nulls > 0 THEN
    RAISE EXCEPTION '0136: % transactions rows still have NULL updated_at after backfill', nulls;
  END IF;
  SELECT count(*) INTO trig FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
   WHERE c.relname = 'transactions' AND t.tgname = 'transactions_touch_updated_at';
  IF trig <> 1 THEN
    RAISE EXCEPTION '0136: transactions_touch_updated_at trigger missing after CREATE';
  END IF;
END $$;
