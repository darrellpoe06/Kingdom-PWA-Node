-- =============================================================================
-- 0262 — RENT IS REPORTED THE WAY IT IS PAID, AND EVERY CHANGE KEEPS ITS TIME
--        (DR-0899)
-- =============================================================================
-- Darrell, 2026-10-10, three messages in a row:
--   "The tenants can say they paying right not take them to cashapp or zelle
--    and other options... even cash... put it in Chase bank... etc"
--   "Full rent or percentage of rent... so its documents it and the notes for
--    the following remaining amount and when it will be paid... keeping the
--    historical events"
--   "Date and timestamps for everything possible... so we can recreate a
--    situation...."
--
-- MONEY STILL NEVER MOVES IN THE APP (DR-0094; money_moved_in_app is CHECKed
-- false since 0055 and is untouched). Three things change:
--
-- 1. rent_payee — HOW THIS LANDLORD IS PAID, in his own words: a Cash App
--    $cashtag, a Venmo handle, the Zelle phone or email, how cash is handed
--    over, the bank-deposit instruction ("Deposit at any Chase branch to Poe
--    Properties LLC"), who a check is payable to. One row per instance. The
--    family writes it; a tenant or household member of one of its doors reads
--    it through rent_payee_for_tenancy(), and nobody else does. NO ACCOUNT OR
--    ROUTING NUMBER: a CHECK refuses any run of seven or more digits in the
--    free-text lines, the same refusal 0201 makes for the household record.
--
-- 2. rent_records gains the part-payment facts, written at the moment the
--    tenant reports: what was due (due_amount), what remains after this
--    payment (remaining_after), when the rest is promised (rest_promised_on),
--    and the device's own clock (reported_on_device_at) beside the server's
--    reported_at. A remainder can never exceed what was due.
--
-- 3. record_events — AN APPEND-ONLY CLOCK FOR EVERY CHANGE to a rent record or
--    a work order: created, status moved (from → to), amount or promise
--    changed, assigned. Each row carries clock_timestamp() (the instant, not
--    the transaction start) and the user who did it. Written only by
--    triggers; nobody, the family included, can edit or delete one. A person
--    reads exactly the events of the records they can already read — the
--    policy asks the parent table, under the reader's own RLS. This is what
--    lets a situation be recreated in order, to the second.
--
-- IDEMPOTENT: IF NOT EXISTS, CREATE OR REPLACE, guarded constraints,
-- DROP/CREATE triggers and policies. ADDITIVE: no existing row changes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. How this landlord is paid.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rent_payee (
  instance_id       uuid PRIMARY KEY REFERENCES public.instances(id) ON DELETE CASCADE,
  cashtag           text CHECK (cashtag IS NULL OR cashtag ~ '^\$[A-Za-z][A-Za-z0-9_-]{0,19}$'),
  venmo             text CHECK (venmo IS NULL OR venmo ~ '^@?[A-Za-z0-9_-]{2,30}$'),
  zelle_to          text CHECK (zelle_to IS NULL OR length(zelle_to) <= 120),
  cash_note         text CHECK (cash_note IS NULL OR length(cash_note) <= 500),
  deposit_note      text CHECK (deposit_note IS NULL OR length(deposit_note) <= 500),
  check_payable_to  text CHECK (check_payable_to IS NULL OR length(check_payable_to) <= 120),
  square_link       text,
  updated_by        uuid REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
-- SQUARE (Darrell, 2026-10-10: "Christina already has a square account we
-- can use that for payment options"). The family's own Square PAYMENT LINK,
-- made in their Square dashboard — a Square address and nothing else: no key,
-- no token, no account number ever reaches this table. The tenant is handed
-- to it after the payment is recorded, exactly like Cash App and Venmo.
ALTER TABLE public.rent_payee ADD COLUMN IF NOT EXISTS square_link text;

-- Its own guarded step, so a replay restores it even where the table exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payee_square_link_is_square') THEN
    ALTER TABLE public.rent_payee ADD CONSTRAINT rent_payee_square_link_is_square CHECK (
      square_link IS NULL OR (length(square_link) <= 300
        AND square_link ~ '^https://(square\.link|checkout\.square\.site|squareup\.com|[a-z0-9-]+\.square\.site)/[^[:space:]]+$'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_payee_no_account_numbers') THEN
    ALTER TABLE public.rent_payee ADD CONSTRAINT rent_payee_no_account_numbers CHECK (
      coalesce(cash_note, '') !~ '\d{7,}' AND coalesce(deposit_note, '') !~ '\d{7,}'
      AND coalesce(check_payable_to, '') !~ '\d{7,}');
  END IF;
END $$;
COMMENT ON TABLE public.rent_payee IS
  'DR-0899: how this landlord is paid, in his own words (Cash App, Venmo, Zelle, Square payment link, cash, bank deposit, check). Never an account or routing number. Tenants read it through rent_payee_for_tenancy().';

REVOKE ALL ON public.rent_payee FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rent_payee TO authenticated;
ALTER TABLE public.rent_payee ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rent_payee_read ON public.rent_payee;
CREATE POLICY rent_payee_read ON public.rent_payee FOR SELECT TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
DROP POLICY IF EXISTS rent_payee_insert ON public.rent_payee;
CREATE POLICY rent_payee_insert ON public.rent_payee FOR INSERT TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
DROP POLICY IF EXISTS rent_payee_update ON public.rent_payee;
CREATE POLICY rent_payee_update ON public.rent_payee FOR UPDATE TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));

-- Dropped first: its shape gained square_link, and a function's return
-- shape cannot change under CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.rent_payee_for_tenancy(uuid);
CREATE FUNCTION public.rent_payee_for_tenancy(p_tenancy uuid)
RETURNS TABLE (cashtag text, venmo text, zelle_to text, cash_note text, deposit_note text, check_payable_to text, square_link text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.cashtag, p.venmo, p.zelle_to, p.cash_note, p.deposit_note, p.check_payable_to, p.square_link
  FROM rental_tenancies t JOIN rent_payee p ON p.instance_id = t.instance_id
  WHERE t.id = p_tenancy
    AND (user_is_tenant(t.id) OR user_is_tenancy_household(t.id)
         OR coalesce(user_role_in_instance(t.instance_id), '') IN ('owner','admin','member'))
$$;
REVOKE ALL ON FUNCTION public.rent_payee_for_tenancy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rent_payee_for_tenancy(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. The part-payment facts on a rent record.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS due_amount numeric;
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS remaining_after numeric;
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS rest_promised_on date;
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS reported_on_device_at timestamptz;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_records_part_payment_adds_up') THEN
    ALTER TABLE public.rent_records ADD CONSTRAINT rent_records_part_payment_adds_up CHECK (
      (due_amount IS NULL OR due_amount >= 0)
      AND (remaining_after IS NULL OR (remaining_after >= 0 AND (due_amount IS NULL OR remaining_after <= due_amount))));
  END IF;
END $$;
COMMENT ON COLUMN public.rent_records.remaining_after IS
  'DR-0899: what was still owed for the period after this payment, as the tenant reported it. With rest_promised_on and memo, the record of a part payment.';

-- ---------------------------------------------------------------------------
-- 3. The clock: every change to a rent record or a work order, append-only.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.record_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  subject     text NOT NULL CHECK (subject IN ('rent', 'work')),
  subject_id  uuid NOT NULL,
  event       text NOT NULL,
  from_value  text,
  to_value    text,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  at          timestamptz NOT NULL DEFAULT clock_timestamp(),
  by_user     uuid
);
CREATE INDEX IF NOT EXISTS record_events_subject_idx ON public.record_events(subject, subject_id, at);
CREATE INDEX IF NOT EXISTS record_events_instance_idx ON public.record_events(instance_id, at);
COMMENT ON TABLE public.record_events IS
  'DR-0899: append-only, to the instant (clock_timestamp), who changed what on a rent record or a work order. Written only by triggers; read exactly where the parent row is readable.';

REVOKE ALL ON public.record_events FROM anon, authenticated;
GRANT SELECT ON public.record_events TO authenticated;
ALTER TABLE public.record_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS record_events_read ON public.record_events;
CREATE POLICY record_events_read ON public.record_events FOR SELECT TO authenticated
  USING (CASE subject
           WHEN 'rent' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)
           WHEN 'work' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)
           ELSE false END);

CREATE OR REPLACE FUNCTION public.record_events_from_rent()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'reported', NEW.status,
            jsonb_strip_nulls(jsonb_build_object('amount', NEW.amount, 'method', NEW.method, 'for_period', NEW.for_period,
              'due_amount', NEW.due_amount, 'remaining_after', NEW.remaining_after, 'rest_promised_on', NEW.rest_promised_on,
              'memo', NEW.memo, 'on_device_at', NEW.reported_on_device_at, 'by_role', NEW.reported_by_role)),
            auth.uid());
    RETURN NULL;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.remaining_after IS DISTINCT FROM OLD.remaining_after
     OR NEW.rest_promised_on IS DISTINCT FROM OLD.rest_promised_on THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, detail, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'changed',
            jsonb_build_object('amount', jsonb_build_array(OLD.amount, NEW.amount),
              'remaining_after', jsonb_build_array(OLD.remaining_after, NEW.remaining_after),
              'rest_promised_on', jsonb_build_array(OLD.rest_promised_on, NEW.rest_promised_on)),
            auth.uid());
  END IF;
  IF NEW.posted_tx_id IS DISTINCT FROM OLD.posted_tx_id AND NEW.posted_tx_id IS NOT NULL THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'posted-to-books', auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_events_from_rent() FROM PUBLIC;

DROP TRIGGER IF EXISTS rent_records_events ON public.rent_records;
CREATE TRIGGER rent_records_events
  AFTER INSERT OR UPDATE ON public.rent_records
  FOR EACH ROW EXECUTE FUNCTION public.record_events_from_rent();

CREATE OR REPLACE FUNCTION public.record_events_from_work()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'work', NEW.id, 'filed', NEW.status,
            jsonb_strip_nulls(jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'by_role', NEW.created_by_role)),
            auth.uid());
    RETURN NULL;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'work', NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.assigned_to_label IS DISTINCT FROM OLD.assigned_to_label OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'work', NEW.id, 'assigned', OLD.assigned_to_label, NEW.assigned_to_label, auth.uid());
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO record_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'work', NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_events_from_work() FROM PUBLIC;

DROP TRIGGER IF EXISTS tenant_maintenance_requests_events ON public.tenant_maintenance_requests;
CREATE TRIGGER tenant_maintenance_requests_events
  AFTER INSERT OR UPDATE ON public.tenant_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.record_events_from_work();

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
