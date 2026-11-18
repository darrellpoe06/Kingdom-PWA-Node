-- =============================================================================
-- 0334 — the house says whether its backup is good, and whether the books are
-- ready for FOS Money Phase 1.4, with no key (DR-1360 / DR-1399 / DR-1511)
-- =============================================================================
-- MEASURED, and the reason this exists. Christina set three conditions on
-- 2026-11-17 before any FOS Money migration: authorized database access, a
-- confirmed backup, and a tested migration. The Phase 1.4 handoff then routed
-- the first two through the runner's Tailscale key and a ConnectBot paste.
-- The record already said otherwise:
--   · DR-1269: the NAS applies merged migrations on its own clock;
--   · DR-1398: the migration's proof rides the public road;
--   · DR-1360: the NAS initiates every road; the lane never reaches in;
--   · DR-1399 / DR-1511: a census is the house's own write, read back through
--     a whitelisting receipt function the anon key may call.
-- Two facts still had no keyless reader:
--   1. the backup verdict (DR-1113): db_backup.sh writes status.json, read
--      only by nas-health.yml over ssh, behind the refused key;
--   2. the books' schema for Phase 1.4: which transaction columns exist,
--      whether a CHECK limits categories, whether the obligations tables
--      (0202) are live.
--
-- db_backup_receipt() reads the newest row the NAS writes with tag
-- db-backup-receipt and source nas-loops (infra/nas-loops/db-backup-receipt.py)
-- and rebuilds only typed, whitelisted fields: ok, the dump time, its size,
-- the archive entry count, how many are kept, the drill verdict (passed /
-- failed / skipped / unknown) with its four counts, and whether an error was
-- recorded (a flag; the words stay on the box). No file name, path or host.
--
-- money_readiness_receipt() reads the database's own catalog: whether each
-- Phase 1.4 column exists on transactions, whether any CHECK constraint on
-- transactions names category, whether the obligation tables exist, whether
-- row-level security is on for transactions. NO ROW of any financial table is
-- read: no amount, no count, no name, no description. It also carries the
-- backup receipt, so one call answers "may the migration be applied?".
--
-- SECURITY DEFINER with a fixed search_path; anon and authenticated may
-- execute; neither gains any table. ADDITIVE: two functions, no table, no
-- row, no grant on data. Idempotent: CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.db_backup_receipt()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r  record;
  b  jsonb;
  d  jsonb;
  v_at timestamptz;
  v_drill_at timestamptz;
  v_verdict text;
BEGIN
  SELECT body, created_at INTO r
    FROM public.agent_inbox
   WHERE tags @> '["db-backup-receipt"]'::jsonb
     AND source = 'nas-loops'
   ORDER BY created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('seen', false);
  END IF;
  BEGIN
    b := r.body::jsonb;
  EXCEPTION WHEN others THEN
    b := NULL;
  END;
  IF b IS NULL OR jsonb_typeof(b) <> 'object' OR (b -> 'readable') = 'false'::jsonb THEN
    RETURN jsonb_build_object('seen', true, 'written_at', r.created_at, 'readable', false);
  END IF;
  BEGIN v_at := (b ->> 'at')::timestamptz; EXCEPTION WHEN others THEN v_at := NULL; END;
  BEGIN v_drill_at := (b ->> 'last_drill_at')::timestamptz; EXCEPTION WHEN others THEN v_drill_at := NULL; END;
  d := CASE WHEN jsonb_typeof(b -> 'drill') = 'object' THEN b -> 'drill' END;
  v_verdict := CASE WHEN d ->> 'verdict' IN ('passed', 'failed', 'skipped', 'unknown') THEN d ->> 'verdict' END;
  RETURN jsonb_strip_nulls(jsonb_build_object(
    'seen', true,
    'readable', true,
    'written_at', r.created_at,
    'ok', CASE WHEN jsonb_typeof(b -> 'ok') = 'boolean' THEN b -> 'ok' END,
    'at', v_at,
    'bytes', CASE WHEN jsonb_typeof(b -> 'bytes') = 'number' THEN LEAST(1e15, GREATEST(0, (b ->> 'bytes')::numeric))::bigint END,
    'toc_entries', CASE WHEN jsonb_typeof(b -> 'toc_entries') = 'number' THEN LEAST(1e9, GREATEST(0, (b ->> 'toc_entries')::numeric))::bigint END,
    'kept', CASE WHEN jsonb_typeof(b -> 'kept') = 'number' THEN LEAST(1000, GREATEST(0, (b ->> 'kept')::numeric))::int END,
    'last_drill_at', v_drill_at,
    'drill', CASE WHEN v_verdict IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
      'verdict', v_verdict,
      'users', CASE WHEN jsonb_typeof(d -> 'users') = 'number' THEN LEAST(1e9, GREATEST(0, (d ->> 'users')::numeric))::bigint END,
      'users_live', CASE WHEN jsonb_typeof(d -> 'users_live') = 'number' THEN LEAST(1e9, GREATEST(0, (d ->> 'users_live')::numeric))::bigint END,
      'tables', CASE WHEN jsonb_typeof(d -> 'tables') = 'number' THEN LEAST(1e6, GREATEST(0, (d ->> 'tables')::numeric))::int END,
      'tables_live', CASE WHEN jsonb_typeof(d -> 'tables_live') = 'number' THEN LEAST(1e6, GREATEST(0, (d ->> 'tables_live')::numeric))::int END
    )) END,
    'error', CASE WHEN (b -> 'error') = 'true'::jsonb THEN true END
  ));
END
$fn$;

REVOKE ALL ON FUNCTION public.db_backup_receipt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.db_backup_receipt() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.money_readiness_receipt()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_cols jsonb;
  v_check boolean;
  v_rls boolean;
BEGIN
  SELECT jsonb_object_agg(c.name, EXISTS (
           SELECT 1 FROM information_schema.columns ic
            WHERE ic.table_schema = 'public' AND ic.table_name = 'transactions' AND ic.column_name = c.name))
    INTO v_cols
    FROM unnest(ARRAY['outstanding', 'cleared_on', 'pending', 'source', 'doc_id',
                      'linked_to_kind', 'linked_to_id', 'entity_override', 'category']) AS c(name);
  SELECT EXISTS (
           SELECT 1 FROM pg_constraint k
            WHERE k.conrelid = 'public.transactions'::regclass AND k.contype = 'c'
              AND pg_get_constraintdef(k.oid) ILIKE '%category%')
    INTO v_check;
  SELECT relrowsecurity INTO v_rls FROM pg_class WHERE oid = 'public.transactions'::regclass;
  RETURN jsonb_build_object(
    'transactions_columns', v_cols,
    'category_check', v_check,
    'transactions_rls', COALESCE(v_rls, false),
    'obligations_table', to_regclass('public.obligations') IS NOT NULL,
    'obligation_settlements_table', to_regclass('public.obligation_settlements') IS NOT NULL,
    'backup', public.db_backup_receipt()
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.money_readiness_receipt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.money_readiness_receipt() TO anon, authenticated;

-- Receipt for this migration itself: both functions answer with their shape.
DO $chk$
DECLARE r jsonb;
BEGIN
  r := public.money_readiness_receipt();
  IF r IS NULL OR NOT (r ? 'transactions_columns') OR NOT ((r -> 'backup') ? 'seen') THEN
    RAISE EXCEPTION '0334: the readiness receipt did not answer';
  END IF;
END
$chk$;

NOTIFY pgrst, 'reload schema';
