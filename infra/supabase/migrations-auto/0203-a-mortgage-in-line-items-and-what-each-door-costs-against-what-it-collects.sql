-- =============================================================================
-- 0203 — A mortgage in line items, and what each door costs against what it
--        collects (DR-0359)
-- =============================================================================
-- Darrell, 2026-09-11:
--   "Mortgage payments for should be line items calculated to the total...
--    taxes... insurance... etc... then the tenants payments each month need to
--    show the difference in the two for gap/profit analytics etc..."
--
-- WHAT WAS TRUE BEFORE THIS FILE (traced against the live database, not the
-- schema files — DR-0061):
--   * `rentals` holds the 12 doors and carries `mortgage_payment` and
--     `mortgage_escrow` as two unrelated scalars. There is no breakdown: no
--     principal and interest, no taxes, no insurance, no HOA, no PMI, and
--     nothing that says those parts add up to the payment.
--   * `rentals.mortgage_payment` is a CURRENT number, not a monthly series, so
--     "what did this door cost in July" cannot be asked.
--   * `rent_payments` has the right shape (expected vs received per period) and
--     ZERO rows; `leases` has ZERO rows, and rent_payments keys off lease_id.
--   * Nothing anywhere computes a gap.
--   * Of the 12 doors, 1 carries a rent figure, 1 carries a mortgage payment,
--     and 0 carry escrow. The "$11,700/month gross scheduled rental income" the
--     Plan tab shows comes from Christina's workbook JSON, not from these rows.
--
-- So this migration builds the shape the question needs and REFUSES to invent
-- the numbers. A door with nothing entered reports "not entered", never a zero
-- that would read as "this door costs nothing" (DR-0076 — under-claiming and
-- over-claiming are both lying).
--
-- WHAT THIS ADDS
--   1. obligations.rental_id  — the door BY IDENTITY, not by spelling. `place`
--      stays as the household's own words; a report keyed on free text is a
--      report one typo breaks.
--   2. obligations.period_month — which month this obligation is FOR, so a
--      recurring mortgage or rent is one row per month and a month can be asked
--      about. NULL for a one-off bill, which is most of them.
--   3. obligation_lines — the components. Principal and interest, taxes,
--      insurance, HOA, PMI, other.
--   4. The sum rule, enforced by the database: WHEN LINES EXIST THEY MUST SUM
--      EXACTLY TO THE OBLIGATION'S AMOUNT. This is Darrell's "line items
--      calculated to the total" made impossible to violate — the same
--      discipline 0202 used for derived status, applied to arithmetic.
--   5. door_month — for one door and one month: what it cost (payable, in its
--      lines), what the tenant actually paid (settlements on the receivable),
--      and the gap between them. Every number traces to rows.
--
-- The role wall is 0202's, unchanged: child and assistant never read any of it.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The door, and the month.
-- ---------------------------------------------------------------------------
ALTER TABLE public.obligations
  ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL;

ALTER TABLE public.obligations
  ADD COLUMN IF NOT EXISTS period_month date;

-- A period is a MONTH, so it is always stored on the first of it. Without this
-- the same July shows up as three different months depending on who typed it.
ALTER TABLE public.obligations DROP CONSTRAINT IF EXISTS obligations_period_month_chk;
ALTER TABLE public.obligations
  ADD CONSTRAINT obligations_period_month_chk
  CHECK (period_month IS NULL OR period_month = date_trunc('month', period_month)::date);

CREATE INDEX IF NOT EXISTS obligations_door_month_idx
  ON public.obligations (rental_id, period_month)
  WHERE rental_id IS NOT NULL;

-- One door, one month, one direction, one recurring charge — a second identical
-- row is a double-count, which is the error this whole ledger exists to prevent.
CREATE UNIQUE INDEX IF NOT EXISTS obligations_door_month_recurring_uniq
  ON public.obligations (rental_id, period_month, direction, description)
  WHERE rental_id IS NOT NULL AND period_month IS NOT NULL AND lifecycle = 'open';

-- ---------------------------------------------------------------------------
-- 2. The line items.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.obligation_lines (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  obligation_id  uuid NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  created_by     uuid NOT NULL REFERENCES auth.users(id),
  -- The parts a mortgage statement actually names. 'other' carries its own
  -- label so a real statement line is never forced into a wrong bucket.
  kind           text NOT NULL,
  label          text,
  amount_cents   bigint NOT NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obligation_lines_kind_chk CHECK (kind IN (
    'principal-interest','taxes','insurance','hoa','pmi','escrow','other'
  )),
  -- A line may be a credit (an escrow refund reduces the payment), so zero is
  -- refused but a negative is not.
  CONSTRAINT obligation_lines_amount_chk CHECK (amount_cents <> 0),
  CONSTRAINT obligation_lines_other_labelled_chk CHECK (
    kind <> 'other' OR length(btrim(coalesce(label, ''))) > 0
  )
);

CREATE INDEX IF NOT EXISTS obligation_lines_obligation_idx
  ON public.obligation_lines (obligation_id);

ALTER TABLE public.obligation_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS obligation_lines_books_read ON public.obligation_lines;
CREATE POLICY obligation_lines_books_read ON public.obligation_lines FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') <> ALL (ARRAY['','child','assistant']));

-- No INSERT / UPDATE / DELETE policy, exactly as 0202. The function below is
-- the only way in, so the sum rule cannot be walked around.

-- ---------------------------------------------------------------------------
-- 3. The sum rule — the database itself refuses lines that do not add up.
-- ---------------------------------------------------------------------------
-- Deferred to the end of the statement so a multi-line write lands as a set:
-- writing four lines one at a time would otherwise fail on the first.
CREATE OR REPLACE FUNCTION public.obligation_lines_sum_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_obligation uuid;
  v_total      bigint;
  v_amount     bigint;
  v_count      int;
BEGIN
  v_obligation := coalesce(NEW.obligation_id, OLD.obligation_id);

  SELECT count(*), coalesce(sum(amount_cents), 0)
    INTO v_count, v_total
    FROM public.obligation_lines WHERE obligation_id = v_obligation;

  -- No lines left is a legitimate state: a simple bill has none.
  IF v_count = 0 THEN RETURN NULL; END IF;

  SELECT amount_cents INTO v_amount FROM public.obligations WHERE id = v_obligation;
  IF v_amount IS NULL THEN RETURN NULL; END IF;

  IF v_total <> v_amount THEN
    RAISE EXCEPTION
      'the line items come to % but the payment is % — line items must add up to the total (%.2f vs %.2f)',
      v_total, v_amount, v_total / 100.0, v_amount / 100.0;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS obligation_lines_sum_trg ON public.obligation_lines;
CREATE CONSTRAINT TRIGGER obligation_lines_sum_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.obligation_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.obligation_lines_sum_guard();

-- ---------------------------------------------------------------------------
-- 4. Writing the lines. All of them at once, because they are one fact.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obligation_set_lines(
  obligation_id_in uuid,
  lines_in         jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_line     jsonb;
  v_out      jsonb;
BEGIN
  SELECT instance_id INTO v_instance FROM public.obligations WHERE id = obligation_id_in;
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no such obligation'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the owner or an admin keeps the books';
  END IF;

  -- Replacing the set is the honest edit: the parts of one payment are one
  -- fact, and half-replacing them is how a total stops matching its parts.
  DELETE FROM public.obligation_lines WHERE obligation_id = obligation_id_in;

  FOR v_line IN SELECT * FROM jsonb_array_elements(coalesce(lines_in, '[]'::jsonb))
  LOOP
    INSERT INTO public.obligation_lines
      (instance_id, obligation_id, created_by, kind, label, amount_cents, note)
    VALUES (
      v_instance,
      obligation_id_in,
      auth.uid(),
      v_line->>'kind',
      nullif(btrim(coalesce(v_line->>'label', '')), ''),
      (v_line->>'amountCents')::bigint,
      nullif(btrim(coalesce(v_line->>'note', '')), '')
    );
  END LOOP;

  -- The deferred trigger fires when this function's statement completes, so a
  -- set that does not add up raises here and nothing is written.
  SELECT jsonb_agg(jsonb_build_object(
           'id', id, 'kind', kind, 'label', label,
           'amountCents', amount_cents, 'note', note
         ) ORDER BY kind)
    INTO v_out
    FROM public.obligation_lines WHERE obligation_id = obligation_id_in;

  RETURN coalesce(v_out, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.obligation_set_lines(uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. What a door cost, what it collected, and the gap.
-- ---------------------------------------------------------------------------
-- Every number here is a sum of rows the caller could open. A door with no
-- obligations for the month returns entered=false rather than zeros, because
-- "we have not entered it" and "it costs nothing" are different facts and only
-- one of them is ever true here (DR-0076).
CREATE OR REPLACE FUNCTION public.door_month(
  rental_id_in uuid,
  month_in     date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance   uuid;
  v_role       text;
  v_month      date;
  v_cost       bigint;
  v_billed     bigint;
  v_collected  bigint;
  v_rows       int;
  v_lines      jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;

  SELECT instance_id INTO v_instance FROM public.rentals WHERE id = rental_id_in;
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no such door'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') IN ('', 'child', 'assistant') THEN
    RAISE EXCEPTION 'these are the books';
  END IF;

  v_month := date_trunc('month', coalesce(month_in, current_date))::date;

  -- What the door COSTS this month: open payables against it.
  SELECT count(*), coalesce(sum(amount_cents), 0)
    INTO v_rows, v_cost
    FROM public.obligations
   WHERE rental_id = rental_id_in AND period_month = v_month
     AND direction = 'payable' AND lifecycle = 'open';

  -- What the tenant was BILLED, and what actually arrived. Billed is the
  -- receivable; collected is money that really moved, never the expectation.
  SELECT coalesce(sum(o.amount_cents), 0)
    INTO v_billed
    FROM public.obligations o
   WHERE o.rental_id = rental_id_in AND o.period_month = v_month
     AND o.direction = 'receivable' AND o.lifecycle = 'open';

  SELECT coalesce(sum(s.amount_cents), 0)
    INTO v_collected
    FROM public.obligation_settlements s
    JOIN public.obligations o ON o.id = s.obligation_id
   WHERE o.rental_id = rental_id_in AND o.period_month = v_month
     AND o.direction = 'receivable';

  -- The cost broken into the parts a mortgage statement names.
  SELECT jsonb_object_agg(kind, total)
    INTO v_lines
    FROM (
      SELECT l.kind, sum(l.amount_cents) AS total
        FROM public.obligation_lines l
        JOIN public.obligations o ON o.id = l.obligation_id
       WHERE o.rental_id = rental_id_in AND o.period_month = v_month
         AND o.direction = 'payable' AND o.lifecycle = 'open'
       GROUP BY l.kind
    ) parts;

  RETURN jsonb_build_object(
    'rentalId',      rental_id_in,
    'month',         v_month,
    -- The honest flag. False means nobody has entered this door's month yet.
    'entered',       (v_rows > 0 OR v_billed > 0 OR v_collected > 0),
    'costCents',     v_cost,
    'billedCents',   v_billed,
    'collectedCents', v_collected,
    -- Gap against what actually ARRIVED, which is the number that decides
    -- whether the month was funded. Billed-minus-cost is the plan; this is real.
    'gapCents',      v_collected - v_cost,
    'shortfallCents', v_billed - v_collected,
    'costByKind',    coalesce(v_lines, '{}'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.door_month(uuid, date) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Recording an obligation now accepts the door and the month.
-- ---------------------------------------------------------------------------
-- Same signature and same return type as 0202's, so this is a replacement and
-- not a new function. It adds two fields and one refusal: a door that belongs
-- to another household is never attachable to these books, which is the same
-- tenancy rule 0202 keeps for transactions and documents (DR-0060).
CREATE OR REPLACE FUNCTION public.obligation_record(payload_in jsonb, instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.obligations%ROWTYPE;
  v_amount   bigint := round(coalesce((payload_in->>'amountCents')::numeric, 0));
  v_rental   uuid   := nullif(payload_in->>'rentalId','')::uuid;
  v_period   date   := nullif(payload_in->>'periodMonth','')::date;
  v_door_inst uuid;
BEGIN
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no books to write into'; END IF;
  PERFORM public.obligation_books_role(v_instance);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'an obligation needs an amount greater than zero'; END IF;

  IF v_rental IS NOT NULL THEN
    SELECT instance_id INTO v_door_inst FROM public.rentals WHERE id = v_rental;
    IF v_door_inst IS NULL OR v_door_inst <> v_instance THEN
      RAISE EXCEPTION 'that door is not in these books';
    END IF;
  END IF;

  INSERT INTO public.obligations (
    instance_id, created_by, direction, counterparty, description, amount_cents, terms,
    issued_on, due_date, priority, product, place, entity_slug, external_ref, note,
    rental_id, period_month)
  VALUES (
    v_instance, auth.uid(),
    payload_in->>'direction',
    btrim(coalesce(payload_in->>'counterparty','')),
    btrim(coalesce(payload_in->>'description','')),
    v_amount,
    coalesce(payload_in->>'terms','custom'),
    nullif(payload_in->>'issuedOn','')::date,
    nullif(payload_in->>'dueDate','')::date,
    coalesce((payload_in->>'priority')::smallint, 2),
    nullif(payload_in->>'product',''),
    nullif(payload_in->>'place',''),
    nullif(payload_in->>'entitySlug',''),
    nullif(payload_in->>'externalRef',''),
    nullif(payload_in->>'note',''),
    v_rental,
    v_period)
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'create', 'obligation', v_row.id, NULL,
          jsonb_build_object('direction', v_row.direction, 'amount_cents', v_row.amount_cents,
                             'counterparty', v_row.counterparty, 'due_date', v_row.due_date,
                             'rental_id', v_row.rental_id, 'period_month', v_row.period_month),
          coalesce(nullif(btrim(coalesce(payload_in->>'note','')), ''), 'obligation_record'));

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.obligation_record(jsonb, uuid) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
