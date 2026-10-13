-- =============================================================================
-- 0206 — The plan becomes rows: the dated bills import into the ledger (DR-0364)
-- =============================================================================
-- MEASURED FIRST, and the measurement is the whole reason this file exists
-- (2026-09-11, against the live database):
--
--   family_plans ..... 1 row — Christina's August workbook, carrying
--                      36 debtTracker entries, 61 dated monthly bills,
--                      13 cash-plan rows
--   transactions ..... 2,949 rows
--   rentals .......... 12 doors (1 with a rent figure, 1 with a mortgage
--                      payment, 0 with escrow)
--   debts ............ 0 rows
--   obligations ...... 0 rows
--   family_documents . 0 rows
--
-- The household's real financial picture exists as JSON inside ONE plan row.
-- Every structured table the accounting module reads is empty — which is why
-- the Owed surface, the aging ladder and the per-door gap all correctly show
-- "nothing entered". They are honest about a database that holds nothing.
--
-- The bottleneck was never the schema. It is that the numbers never became
-- rows. This is the path that turns them into rows.
--
-- WHAT IMPORTS, AND WHAT DELIBERATELY DOES NOT:
--
--   * The 61 DATED BILLS import. Each carries a `day` (measured: integers 1-29,
--     all 61 have both a day and an amount), so each becomes a payable with a
--     REAL due date — the thing `debts` has never had.
--   * The 36 DEBTS DO NOT import. They carry balance, APR, minimum payment and
--     a payoff timeline, and NO due day. An obligation without a day it is owed
--     by cannot be late, and inventing one would be exactly the painted number
--     this ledger exists to refuse (DR-0076). They stay named and unimported
--     until someone supplies the day. That is a finding, not a shortfall.
--
-- IDEMPOTENT BY CONSTRUCTION. Every imported row carries
-- external_ref = 'plan-bill:<day>:<payee>'. A second run for the same month
-- finds them and skips. Running it twice cannot double-count the household's
-- bills, which is the failure this ledger was built to prevent.
--
-- PREVIEW BEFORE WRITE. dry_run defaults TRUE: the function returns exactly
-- what it would create, and writes nothing, until it is called again with
-- dry_run false. Ninety-seven rows landing in someone's books unannounced is
-- not an import, it is an accident.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.plan_bills_import(
  month_in   date    DEFAULT NULL,
  dry_run_in boolean DEFAULT true,
  instance_in uuid   DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_month    date;
  v_plan     jsonb;
  v_title    text;
  v_bill     jsonb;
  v_ord      int;
  v_day      int;
  v_cents    bigint;
  v_payee    text;
  v_ref      text;
  v_due      date;
  v_exists   uuid;
  v_created  int := 0;
  v_skipped  int := 0;
  v_refused  int := 0;
  v_total    bigint := 0;
  v_rows     jsonb := '[]'::jsonb;
  v_debts    int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;

  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no books to write into'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the owner or an admin keeps the books';
  END IF;

  v_month := date_trunc('month', coalesce(month_in, current_date))::date;

  SELECT plan, title INTO v_plan, v_title
    FROM public.family_plans
   WHERE instance_id = v_instance
   ORDER BY updated_at DESC
   LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no-plan',
      'message', 'No family plan has been published for this household, so there is nothing to import.');
  END IF;

  -- Named, never imported: a debt with no due day cannot become an obligation.
  SELECT count(*) INTO v_debts
    FROM jsonb_array_elements(coalesce(v_plan->'debtTracker','[]'::jsonb));

  -- WITH ORDINALITY, and the ordinal goes INTO the key. Measured 2026-09-11:
  -- three of the 61 dated bills share a payee AND a day with another bill, so a
  -- key of payee+day collapsed them — a first run created 56 rows instead of
  -- 59 and silently dropped $184.99 of the household's real bills. A dedupe key
  -- that swallows genuine duplicates is the exact error this ledger exists to
  -- prevent. The plan array's order is stable, so the ordinal is stable, so a
  -- second run still skips every one.
  FOR v_bill, v_ord IN
    SELECT value, ordinality
      FROM jsonb_array_elements(coalesce(v_plan->'billCalendar'->'dated','[]'::jsonb)) WITH ORDINALITY
  LOOP
    v_payee := btrim(coalesce(v_bill->>'payee',''));
    v_day   := nullif(v_bill->>'day','')::int;
    v_cents := round(coalesce((v_bill->>'amount')::numeric, 0) * 100);

    -- A bill with no payee, no day, or no amount is reported, never guessed.
    IF v_payee = '' OR v_day IS NULL OR v_day < 1 OR v_day > 31 OR v_cents <= 0 THEN
      v_refused := v_refused + 1;
      CONTINUE;
    END IF;

    -- A day past the end of a short month lands on that month's last day
    -- rather than rolling into the next one, which would move the bill.
    v_due := least(
      (v_month + make_interval(days => v_day - 1))::date,
      (v_month + interval '1 month - 1 day')::date
    );

    v_ref := 'plan-bill:' || v_ord || ':' || v_day || ':' || v_payee;

    SELECT id INTO v_exists FROM public.obligations
     WHERE instance_id = v_instance AND external_ref = v_ref AND period_month = v_month
     LIMIT 1;

    IF v_exists IS NOT NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_total := v_total + v_cents;
    v_rows := v_rows || jsonb_build_object(
      'payee', v_payee, 'day', v_day, 'amountCents', v_cents,
      'dueDate', v_due, 'externalRef', v_ref,
      'note', nullif(btrim(coalesce(v_bill->>'note','')), ''));

    IF NOT dry_run_in THEN
      INSERT INTO public.obligations (
        instance_id, created_by, direction, counterparty, description, amount_cents,
        terms, issued_on, due_date, product, external_ref, period_month, note)
      VALUES (
        v_instance, auth.uid(), 'payable', v_payee,
        'Monthly bill', v_cents, 'custom', v_month, v_due, 'poetech', v_ref, v_month,
        nullif(btrim(coalesce(v_bill->>'note','')), ''));
      v_created := v_created + 1;
    END IF;
  END LOOP;

  IF NOT dry_run_in AND v_created > 0 THEN
    INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
    VALUES (v_instance, auth.uid(), 'create', 'obligation', NULL, NULL,
            jsonb_build_object('imported', v_created, 'month', v_month, 'from', v_title),
            'plan_bills_import');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'dryRun', dry_run_in,
    'month', v_month,
    'planTitle', v_title,
    'proposed', jsonb_array_length(v_rows),
    'created', v_created,
    'skippedAlreadyImported', v_skipped,
    'refusedIncomplete', v_refused,
    'totalCents', v_total,
    'rows', v_rows,
    -- The honest half: what this cannot bring across, and why.
    'debtsNotImported', v_debts,
    'debtsWhy', 'A debt in the plan carries a balance, an APR and a minimum payment but no day it is due. An obligation without a due date cannot be late, and inventing a day would be a painted number. These stay in the plan until someone supplies the day.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.plan_bills_import(date, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_bills_import(date, boolean, uuid) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
