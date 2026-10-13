-- =============================================================================
-- 0202 — What is owed, what was paid, and the document that proves it (DR-0358)
-- =============================================================================
-- Darrell 2026-09-11: "validate our accounting systems for evaluating our
-- process for payable and receivables... Accounting module needs to be tight."
-- And: "like pay this bill or you paid this bill and this is the supporting
-- documents associated with this bill or priority or paid in full documents so
-- people can review their documents that came in that day and sort them to
-- their respective products and locations for users to see a now or later."
--
-- WHAT THE TRACE FOUND (the reason this exists):
--   * "accounts payable", "accounts receivable", "aging", "net 30" and
--     "write-off" appeared NOWHERE in the app.
--   * The one table with the right shape (`invoices`) is in a schema FILE and
--     was never applied to the live database — it does not exist. Nothing
--     reads it. This migration does not resurrect it; it writes the ledger
--     properly instead of inheriting a shape nobody ever validated.
--   * `debts` has a balance and a rate and NO due date, so on-time-versus-late
--     is uncomputable for every household payable.
--   * Reconciliation proves arithmetic; it never closes an obligation.
--   * Rent is the only place an obligation meets a settlement today.
--
-- THREE TABLES, and the discipline is in what they refuse:
--   obligations            — a promise of money, one direction, with a due date.
--   obligation_settlements — money that actually moved. APPEND-ONLY: no UPDATE
--                            policy and no DELETE policy exist, so a payment
--                            can be added and never quietly rewritten.
--   obligation_documents   — the paper: the bill itself, the proof it was paid,
--                            whatever supports it. Darrell's own three roles.
--
-- STATUS IS NOT STORED. Open / partial / paid / past due are worked out from
-- the settlements and the calendar, in lib/obligations.js, every time they are
-- read. A stored status is a status that eventually disagrees with its own
-- rows; this one cannot.
--
-- MONEY IS INTEGER CENTS. Never a float. A ledger that rounds is a ledger that
-- argues.
--
-- THE ROLE WALL IS THE ONE THE BOOKS ALREADY HAVE. Read is denied to 'child'
-- and 'assistant' exactly as `transactions` and `debts` deny them (0082/0100);
-- writes go through SECURITY DEFINER functions that require owner or admin.
-- A child does not meet the household's debts by walking into a tab.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE OBLIGATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.obligations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  -- 'payable'    = accounts payable: we owe it.
  -- 'receivable' = accounts receivable: it is owed to us.
  direction     text NOT NULL,
  counterparty  text NOT NULL,          -- the vendor, or the customer
  description   text NOT NULL,
  amount_cents  bigint NOT NULL,
  terms         text NOT NULL,          -- due-on-receipt | net-7 | net-15 | net-30 | net-60 | custom
  issued_on     date,
  due_date      date,                   -- authoritative for 'custom'; derived from terms otherwise
  lifecycle     text NOT NULL DEFAULT 'open',   -- open | void | written-off
  lifecycle_note text,
  priority      smallint NOT NULL DEFAULT 2,    -- 1 urgent · 2 normal · 3 whenever
  -- WHICH PRODUCT AND WHICH PLACE. A household runs more than one thing; a bill
  -- belongs to one of them and usually to one door, one entity, one property.
  product       text,                   -- poetech | properties | tlc
  place         text,                   -- the door, the address, the entity — the household's own words
  entity_slug   text,                   -- ties to entities.slug where the books already split
  external_ref  text,                   -- their invoice number, so a human can match it
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obligations_direction_chk CHECK (direction IN ('payable','receivable')),
  CONSTRAINT obligations_terms_chk CHECK (terms IN ('due-on-receipt','net-7','net-15','net-30','net-60','custom')),
  CONSTRAINT obligations_lifecycle_chk CHECK (lifecycle IN ('open','void','written-off')),
  CONSTRAINT obligations_priority_chk CHECK (priority BETWEEN 1 AND 3),
  CONSTRAINT obligations_product_chk CHECK (product IS NULL OR product IN ('poetech','properties','tlc')),
  CONSTRAINT obligations_amount_chk CHECK (amount_cents > 0),
  CONSTRAINT obligations_counterparty_chk CHECK (length(btrim(counterparty)) > 0),
  CONSTRAINT obligations_description_chk CHECK (length(btrim(description)) > 0),
  -- A thing that is owed but has no day it is owed BY cannot be late, and a
  -- ledger that cannot say "late" is the exact hole `debts` has today.
  CONSTRAINT obligations_dated_chk CHECK (
    (terms = 'custom' AND due_date IS NOT NULL) OR (terms <> 'custom' AND issued_on IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS obligations_ledger_idx ON public.obligations(instance_id, direction, lifecycle, due_date);
CREATE INDEX IF NOT EXISTS obligations_product_idx ON public.obligations(instance_id, product, due_date);

-- ---------------------------------------------------------------------------
-- 2. THE SETTLEMENT — append-only, on purpose
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.obligation_settlements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id  uuid NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by     uuid NOT NULL REFERENCES auth.users(id),
  amount_cents   bigint NOT NULL,
  paid_on        date NOT NULL,
  method         text,
  -- THE TIE THAT WAS NEVER MADE: transactions has carried `linked_to_kind` and
  -- `linked_to_id` since the first schema and nothing ever resolved them.
  -- Settling from a real bank row is what turns reconciliation from "the parts
  -- sum to the whole" into "this obligation is closed, by that money".
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obligation_settlements_amount_chk CHECK (amount_cents > 0)
);

CREATE INDEX IF NOT EXISTS obligation_settlements_parent_idx ON public.obligation_settlements(obligation_id, paid_on);
-- One bank row settles one obligation once. This is the no-double-count rule
-- the rent ledger already learned (0150's posted_tx_uniq).
CREATE UNIQUE INDEX IF NOT EXISTS obligation_settlements_txn_uniq
  ON public.obligation_settlements(transaction_id) WHERE transaction_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. THE PAPER — Darrell's three roles, named as he named them
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.obligation_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id  uuid NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  document_id    uuid NOT NULL REFERENCES public.family_documents(id) ON DELETE CASCADE,
  -- 'the-bill'          — "pay this bill"
  -- 'proof-of-payment'  — "you paid this bill" / paid in full
  -- 'supporting'        — everything else that belongs with it
  role           text NOT NULL,
  added_by       uuid NOT NULL REFERENCES auth.users(id),
  added_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obligation_documents_role_chk CHECK (role IN ('the-bill','proof-of-payment','supporting')),
  UNIQUE (obligation_id, document_id)
);

CREATE INDEX IF NOT EXISTS obligation_documents_parent_idx ON public.obligation_documents(obligation_id, role);

-- ---------------------------------------------------------------------------
-- 4. THE DAY'S POST — a document arrives, and someone sorts it
-- ---------------------------------------------------------------------------
-- "people can review their documents that came in that day and sort them to
-- their respective products and locations... now or later whenever they want."
-- Sorting is a small, reversible, recorded act, so the pile is never a mystery.
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS arrived_on date;
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS means text;
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS routed_product text;
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS routed_place text;
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS routed_at timestamptz;
ALTER TABLE public.family_documents ADD COLUMN IF NOT EXISTS routed_by uuid REFERENCES auth.users(id);

DO $$
BEGIN
  ALTER TABLE public.family_documents
    ADD CONSTRAINT family_documents_means_chk
    CHECK (means IS NULL OR means IN ('bill-to-pay','proof-of-payment','for-the-record'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.family_documents
    ADD CONSTRAINT family_documents_routed_product_chk
    CHECK (routed_product IS NULL OR routed_product IN ('poetech','properties','tlc'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS family_documents_inbox_idx
  ON public.family_documents(instance_id, routed_at, arrived_on);

-- ---------------------------------------------------------------------------
-- 5. THE WALL — the books' own, not a new one
-- ---------------------------------------------------------------------------
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS obligations_books_read ON public.obligations;
CREATE POLICY obligations_books_read ON public.obligations FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') <> ALL (ARRAY['','child','assistant']));

DROP POLICY IF EXISTS obligation_settlements_books_read ON public.obligation_settlements;
CREATE POLICY obligation_settlements_books_read ON public.obligation_settlements FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') <> ALL (ARRAY['','child','assistant']));

DROP POLICY IF EXISTS obligation_documents_books_read ON public.obligation_documents;
CREATE POLICY obligation_documents_books_read ON public.obligation_documents FOR SELECT TO authenticated
  USING (coalesce(public.user_role_in_instance(instance_id), '') <> ALL (ARRAY['','child','assistant']));

-- No INSERT / UPDATE / DELETE policy on any of the three. Every write goes
-- through the functions below, so the append-only promise on settlements is
-- kept by the database and not by a habit.

-- ---------------------------------------------------------------------------
-- 6. THE WRITES
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obligation_books_role(instance_in uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  v_role := coalesce(public.user_role_in_instance(instance_in), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the owner or an admin keeps the books';
  END IF;
  RETURN v_role;
END;
$$;
REVOKE ALL ON FUNCTION public.obligation_books_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_books_role(uuid) TO authenticated;

/** Record a thing that is owed, in either direction. */
CREATE OR REPLACE FUNCTION public.obligation_record(payload_in jsonb, instance_in uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_row      public.obligations%ROWTYPE;
  v_amount   bigint := round(coalesce((payload_in->>'amountCents')::numeric, 0));
BEGIN
  v_instance := coalesce(instance_in, nullif(public.my_default_instance_role()->>'instance_id','')::uuid);
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no books to write into'; END IF;
  PERFORM public.obligation_books_role(v_instance);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'an obligation needs an amount greater than zero'; END IF;

  INSERT INTO public.obligations (
    instance_id, created_by, direction, counterparty, description, amount_cents, terms,
    issued_on, due_date, priority, product, place, entity_slug, external_ref, note)
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
    nullif(payload_in->>'note',''))
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_instance, auth.uid(), 'create', 'obligation', v_row.id, NULL,
          jsonb_build_object('direction', v_row.direction, 'amount_cents', v_row.amount_cents,
                             'counterparty', v_row.counterparty, 'due_date', v_row.due_date),
          coalesce(nullif(btrim(coalesce(payload_in->>'note','')), ''), 'obligation_record'));

  RETURN to_jsonb(v_row);
END;
$$;
REVOKE ALL ON FUNCTION public.obligation_record(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_record(jsonb, uuid) TO authenticated;

/** Money actually moved against it. Append-only; never rewrites a prior payment. */
CREATE OR REPLACE FUNCTION public.obligation_settle(
  obligation_id_in uuid,
  amount_cents_in  bigint,
  paid_on_in       date,
  method_in        text DEFAULT NULL,
  transaction_id_in uuid DEFAULT NULL,
  note_in          text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ob  public.obligations%ROWTYPE;
  v_set public.obligation_settlements%ROWTYPE;
  v_settled bigint;
BEGIN
  SELECT * INTO v_ob FROM public.obligations WHERE id = obligation_id_in;
  IF v_ob.id IS NULL THEN RAISE EXCEPTION 'no such obligation'; END IF;
  PERFORM public.obligation_books_role(v_ob.instance_id);
  IF amount_cents_in IS NULL OR amount_cents_in <= 0 THEN RAISE EXCEPTION 'a payment needs an amount greater than zero'; END IF;
  IF paid_on_in IS NULL THEN RAISE EXCEPTION 'name the day the money moved'; END IF;
  IF v_ob.lifecycle = 'void' THEN RAISE EXCEPTION 'a voided obligation cannot be settled'; END IF;

  -- A transaction belongs to the same books as the obligation it settles.
  IF transaction_id_in IS NOT NULL THEN
    PERFORM 1 FROM public.transactions t WHERE t.id = transaction_id_in AND t.instance_id = v_ob.instance_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'that transaction is not in these books'; END IF;
  END IF;

  INSERT INTO public.obligation_settlements (obligation_id, instance_id, created_by, amount_cents, paid_on, method, transaction_id, note)
  VALUES (v_ob.id, v_ob.instance_id, auth.uid(), amount_cents_in, paid_on_in,
          nullif(btrim(coalesce(method_in,'')),''), transaction_id_in, nullif(btrim(coalesce(note_in,'')),''))
  RETURNING * INTO v_set;

  -- Close the loop the other way: the bank row now knows what it settled, on
  -- the pointer the schema has carried unused since the beginning.
  IF transaction_id_in IS NOT NULL THEN
    UPDATE public.transactions
       SET linked_to_kind = 'obligation', linked_to_id = v_ob.id, updated_at = now()
     WHERE id = transaction_id_in;
  END IF;

  UPDATE public.obligations SET updated_at = now() WHERE id = v_ob.id;
  SELECT coalesce(sum(amount_cents), 0) INTO v_settled FROM public.obligation_settlements WHERE obligation_id = v_ob.id;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_ob.instance_id, auth.uid(), 'update', 'obligation', v_ob.id,
          jsonb_build_object('settled_before', v_settled - amount_cents_in),
          jsonb_build_object('settled_after', v_settled, 'amount_cents', amount_cents_in,
                             'paid_on', paid_on_in, 'transaction_id', transaction_id_in),
          'obligation_settle');

  RETURN jsonb_build_object('settlement', to_jsonb(v_set), 'settled_cents', v_settled,
                            'amount_cents', v_ob.amount_cents,
                            'balance_cents', greatest(0, v_ob.amount_cents - v_settled));
END;
$$;
REVOKE ALL ON FUNCTION public.obligation_settle(uuid, bigint, date, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_settle(uuid, bigint, date, text, uuid, text) TO authenticated;

/** Void it (it was never really owed) or write it off (we are not getting it). Never a delete. */
CREATE OR REPLACE FUNCTION public.obligation_set_lifecycle(
  obligation_id_in uuid, lifecycle_in text, note_in text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ob   public.obligations%ROWTYPE;
  v_prev text;
BEGIN
  IF lifecycle_in NOT IN ('open','void','written-off') THEN RAISE EXCEPTION 'that is not a state an obligation can be in'; END IF;
  SELECT * INTO v_ob FROM public.obligations WHERE id = obligation_id_in;
  IF v_ob.id IS NULL THEN RAISE EXCEPTION 'no such obligation'; END IF;
  PERFORM public.obligation_books_role(v_ob.instance_id);
  IF lifecycle_in <> 'open' AND length(btrim(coalesce(note_in,''))) < 3 THEN
    RAISE EXCEPTION 'say why in a few words — a write-off without a reason is a hole in the record';
  END IF;
  v_prev := v_ob.lifecycle;

  UPDATE public.obligations
     SET lifecycle = lifecycle_in, lifecycle_note = nullif(btrim(coalesce(note_in,'')),''), updated_at = now()
   WHERE id = v_ob.id RETURNING * INTO v_ob;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_ob.instance_id, auth.uid(), 'status-change', 'obligation', v_ob.id,
          jsonb_build_object('lifecycle', v_prev), jsonb_build_object('lifecycle', lifecycle_in),
          coalesce(nullif(btrim(coalesce(note_in,'')),''), 'obligation_set_lifecycle'));

  RETURN to_jsonb(v_ob);
END;
$$;
REVOKE ALL ON FUNCTION public.obligation_set_lifecycle(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_set_lifecycle(uuid, text, text) TO authenticated;

/** Attach the paper: the bill, the proof it was paid, or something supporting. */
CREATE OR REPLACE FUNCTION public.obligation_attach_document(
  obligation_id_in uuid, document_id_in uuid, role_in text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ob  public.obligations%ROWTYPE;
  v_doc public.family_documents%ROWTYPE;
  v_row public.obligation_documents%ROWTYPE;
BEGIN
  IF role_in NOT IN ('the-bill','proof-of-payment','supporting') THEN RAISE EXCEPTION 'a document is the bill, the proof it was paid, or supporting'; END IF;
  SELECT * INTO v_ob FROM public.obligations WHERE id = obligation_id_in;
  IF v_ob.id IS NULL THEN RAISE EXCEPTION 'no such obligation'; END IF;
  PERFORM public.obligation_books_role(v_ob.instance_id);
  SELECT * INTO v_doc FROM public.family_documents WHERE id = document_id_in;
  IF v_doc.id IS NULL THEN RAISE EXCEPTION 'no such document'; END IF;
  IF v_doc.instance_id <> v_ob.instance_id THEN RAISE EXCEPTION 'that document belongs to another household'; END IF;
  -- A person can only attach paper they can actually open.
  IF v_doc.created_by <> auth.uid() AND NOT v_doc.shared_with_household THEN
    RAISE EXCEPTION 'that document is not shared with the household';
  END IF;

  INSERT INTO public.obligation_documents (obligation_id, instance_id, document_id, role, added_by)
  VALUES (v_ob.id, v_ob.instance_id, v_doc.id, role_in, auth.uid())
  ON CONFLICT (obligation_id, document_id) DO UPDATE SET role = EXCLUDED.role, added_at = now()
  RETURNING * INTO v_row;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_ob.instance_id, auth.uid(), 'update', 'obligation', v_ob.id, NULL,
          jsonb_build_object('document_id', v_doc.id, 'role', role_in), 'obligation_attach_document');

  RETURN to_jsonb(v_row);
END;
$$;
REVOKE ALL ON FUNCTION public.obligation_attach_document(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_attach_document(uuid, uuid, text) TO authenticated;

/**
 * Sort a document that came in: what it means, which product it belongs to,
 * which place. Reversible, recorded, and only by the person who filed it or an
 * owner/admin of the household.
 */
CREATE OR REPLACE FUNCTION public.document_route(
  document_id_in uuid,
  means_in       text DEFAULT NULL,
  product_in     text DEFAULT NULL,
  place_in       text DEFAULT NULL,
  arrived_on_in  date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_doc  public.family_documents%ROWTYPE;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF means_in IS NOT NULL AND means_in NOT IN ('bill-to-pay','proof-of-payment','for-the-record') THEN
    RAISE EXCEPTION 'a document is a bill to pay, proof of payment, or for the record';
  END IF;
  IF product_in IS NOT NULL AND product_in NOT IN ('poetech','properties','tlc') THEN
    RAISE EXCEPTION 'no such product to sort it to';
  END IF;
  SELECT * INTO v_doc FROM public.family_documents WHERE id = document_id_in;
  IF v_doc.id IS NULL THEN RAISE EXCEPTION 'no such document'; END IF;
  v_role := coalesce(public.user_role_in_instance(v_doc.instance_id), '');
  IF v_doc.created_by <> auth.uid() AND coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the person who filed it, or an owner or admin, sorts it';
  END IF;

  UPDATE public.family_documents
     SET means = means_in,
         routed_product = product_in,
         routed_place = nullif(btrim(coalesce(place_in,'')),''),
         arrived_on = coalesce(arrived_on_in, arrived_on),
         routed_at = CASE WHEN means_in IS NULL AND product_in IS NULL THEN NULL ELSE now() END,
         routed_by = CASE WHEN means_in IS NULL AND product_in IS NULL THEN NULL ELSE auth.uid() END,
         updated_at = now()
   WHERE id = v_doc.id
   RETURNING * INTO v_doc;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_doc.instance_id, auth.uid(), 'update', 'family_document', v_doc.id, NULL,
          jsonb_build_object('means', v_doc.means, 'product', v_doc.routed_product, 'place', v_doc.routed_place),
          'document_route');

  RETURN to_jsonb(v_doc);
END;
$$;
REVOKE ALL ON FUNCTION public.document_route(uuid, text, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.document_route(uuid, text, text, text, date) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
