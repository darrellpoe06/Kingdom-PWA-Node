-- =============================================================================
-- 0265 — THE DOOR KEEPS ITS MONEY, WITH OR WITHOUT A TENANT (DR-0903)
-- =============================================================================
-- Darrell, 2026-10-10, on the Rent tab: "How to add payments to the historical
-- events?" And then: "We want the historical money for each property to be
-- available... with or without the tenants information... so the door always
-- pays... the most important thing is to see how much money is being
-- accumulated by each asset... make sense?"
--
-- WHAT WAS TRUE BEFORE THIS FILE (traced, DR-0061):
--   * rent_records.tenancy_id is NOT NULL (0055). A payment could only be
--     written against a tenancy, so money that came in on a door with no
--     tenancy on record (every door on this account today, a short stay, the
--     months before the app) had nowhere to go.
--   * A payment knew its tenancy and nothing else. The door is reached only by
--     the tenancy's rental_ref TEXT matched to rentals.slug, so the moment a
--     tenancy ends the door's own history of what it collected is scattered
--     across tenancies and asked about by spelling.
--   * The only landlord write was "Confirm received" on a TENANT's report. A
--     payment the landlord received himself (cash in hand, a deposit he saw in
--     Chase, last year's rent) could not be written at all.
--   * reported_at is when someone typed it, not when the money came. A January
--     payment entered in October read as October.
--   * rent_payments (0203's door_month reads its settlements) has zero rows;
--     rent_records is where the Poe Properties app actually keeps rent.
--
-- THE SHAPE.
--   1. rent_records.rental_id — the DOOR, by identity. tenancy_id becomes
--      optional; a row names its tenancy, its door, or both, never neither.
--      A row with a tenancy has its door filled in from that tenancy by the
--      database (and every existing row is backfilled), so the door's money
--      survives every tenant who ever lived there.
--   2. rent_records.paid_on — the day the money actually came. Past dates
--      are the point (recording history); a date in the future is refused.
--   3. A payment with no tenancy is the family's (landlord or manager)
--      record — a tenant only ever reports against their own tenancy.
--   4. Door-level policy arms, exactly the 0260 pattern: a delegated manager
--      reads a door's money with rentroll.view on that door, records with
--      rent.confirm, corrects with rent.adjust. The instance-role arms of
--      0075/0150 are untouched (owner/admin/member see and write as before).
--   5. door_money_months — per door, per month the money came: confirmed
--      received, how many payments, and what is reported but not yet
--      confirmed (a claim, not a receipt, so it is never added to the total).
--      security_invoker: it is computed under the reader's own RLS, so a
--      tenant who opens it sees only their own payments and a stranger
--      sees nothing.
--
-- No money moves (DR-0094): money_moved_in_app stays false by CHECK.
-- IDEMPOTENT + ADDITIVE: IF NOT EXISTS, guarded constraints, CREATE OR
-- REPLACE, DROP/CREATE trigger and policy.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The door, and the day the money came.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE;
ALTER TABLE public.rent_records ADD COLUMN IF NOT EXISTS paid_on date;
ALTER TABLE public.rent_records ALTER COLUMN tenancy_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS rent_records_rental_idx ON public.rent_records(rental_id, paid_on);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_records_on_a_tenancy_or_a_door') THEN
    ALTER TABLE public.rent_records ADD CONSTRAINT rent_records_on_a_tenancy_or_a_door
      CHECK (tenancy_id IS NOT NULL OR rental_id IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rent_records_doorlevel_is_the_familys') THEN
    ALTER TABLE public.rent_records ADD CONSTRAINT rent_records_doorlevel_is_the_familys
      CHECK (tenancy_id IS NOT NULL OR reported_by_role IN ('landlord', 'manager'));
  END IF;
END $$;

COMMENT ON COLUMN public.rent_records.rental_id IS
  'DR-0903: the door this money came in on. Filled from the tenancy when there is one; the only anchor when there is not. The door keeps its money through every tenant.';
COMMENT ON COLUMN public.rent_records.paid_on IS
  'DR-0903: the day the money actually came (may be long past). reported_at is when it was typed.';

-- ---------------------------------------------------------------------------
-- 2. A row with a tenancy is on that tenancy's door; the door is in the row's
--    instance; the day it came is not in the future.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rent_records_on_its_door()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_door uuid;
BEGIN
  IF NEW.tenancy_id IS NOT NULL THEN
    SELECT r.id INTO v_door
      FROM rental_tenancies t
      JOIN rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
     WHERE t.id = NEW.tenancy_id;
    IF v_door IS NOT NULL THEN
      IF NEW.rental_id IS NULL THEN
        NEW.rental_id := v_door;
      ELSIF NEW.rental_id <> v_door THEN
        RAISE EXCEPTION 'this payment names one door and a tenancy on another'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  IF NEW.rental_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM rentals r WHERE r.id = NEW.rental_id AND r.instance_id = NEW.instance_id
  ) THEN
    RAISE EXCEPTION 'the door named on this payment is not in its instance'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.paid_on IS NOT NULL AND NEW.paid_on > (now() AT TIME ZONE 'utc')::date + 1 THEN
    RAISE EXCEPTION 'a payment cannot be received on a day that has not come yet (%)', NEW.paid_on
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.rent_records_on_its_door() FROM PUBLIC;

DROP TRIGGER IF EXISTS rent_records_door ON public.rent_records;
CREATE TRIGGER rent_records_door
  BEFORE INSERT OR UPDATE OF tenancy_id, rental_id, instance_id, paid_on ON public.rent_records
  FOR EACH ROW EXECUTE FUNCTION public.rent_records_on_its_door();

-- Every payment already on record finds its door. Only rows whose door is
-- still unnamed are touched, so a replay touches nothing.
UPDATE public.rent_records rr
   SET rental_id = r.id
  FROM public.rental_tenancies t
  JOIN public.rentals r ON r.instance_id = t.instance_id AND r.slug = t.rental_ref
 WHERE rr.tenancy_id = t.id
   AND rr.rental_id IS NULL;

-- ---------------------------------------------------------------------------
-- 3. The door-level delegate arms (additive; 0075/0150's policies stand).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS rent_records_door_read ON public.rent_records;
CREATE POLICY rent_records_door_read ON public.rent_records FOR SELECT TO authenticated
  USING (rental_id IS NOT NULL AND user_delegated_can_rental(rental_id, 'rentroll.view'));

DROP POLICY IF EXISTS rent_records_door_insert ON public.rent_records;
CREATE POLICY rent_records_door_insert ON public.rent_records FOR INSERT TO authenticated
  WITH CHECK (rental_id IS NOT NULL
              AND reported_by = auth.uid()
              AND reported_by_role IN ('landlord', 'manager')
              AND user_delegated_can_rental(rental_id, 'rent.confirm'));

DROP POLICY IF EXISTS rent_records_door_update ON public.rent_records;
CREATE POLICY rent_records_door_update ON public.rent_records FOR UPDATE TO authenticated
  USING      (rental_id IS NOT NULL AND user_delegated_can_rental(rental_id, 'rent.adjust'))
  WITH CHECK (rental_id IS NOT NULL AND user_delegated_can_rental(rental_id, 'rent.adjust'));

-- ---------------------------------------------------------------------------
-- 4. The clock carries the door and the day (0262's event, widened).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.door_events_from_rent()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, to_value, detail, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'reported', NEW.status,
            jsonb_strip_nulls(jsonb_build_object('amount', NEW.amount, 'method', NEW.method, 'for_period', NEW.for_period,
              'due_amount', NEW.due_amount, 'remaining_after', NEW.remaining_after, 'rest_promised_on', NEW.rest_promised_on,
              'memo', NEW.memo, 'on_device_at', NEW.reported_on_device_at, 'by_role', NEW.reported_by_role,
              'paid_on', NEW.paid_on, 'rental_id', NEW.rental_id)),
            auth.uid());
    RETURN NULL;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, from_value, to_value, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'status', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.remaining_after IS DISTINCT FROM OLD.remaining_after
     OR NEW.rest_promised_on IS DISTINCT FROM OLD.rest_promised_on OR NEW.paid_on IS DISTINCT FROM OLD.paid_on THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, detail, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'changed',
            jsonb_build_object('amount', jsonb_build_array(OLD.amount, NEW.amount),
              'remaining_after', jsonb_build_array(OLD.remaining_after, NEW.remaining_after),
              'rest_promised_on', jsonb_build_array(OLD.rest_promised_on, NEW.rest_promised_on),
              'paid_on', jsonb_build_array(OLD.paid_on, NEW.paid_on)),
            auth.uid());
  END IF;
  IF NEW.posted_tx_id IS DISTINCT FROM OLD.posted_tx_id AND NEW.posted_tx_id IS NOT NULL THEN
    INSERT INTO door_events (instance_id, subject, subject_id, event, by_user)
    VALUES (NEW.instance_id, 'rent', NEW.id, 'posted-to-books', auth.uid());
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.door_events_from_rent() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 5. What each door has accumulated, month by month, under the reader's RLS.
-- ---------------------------------------------------------------------------
-- The month is the month the money CAME (paid_on), else when it was
-- confirmed, else when it was reported — never the month it was typed when
-- the day it came is known. Disputed and void rows are not money received.
CREATE OR REPLACE VIEW public.door_money_months
WITH (security_invoker = true) AS
SELECT
  rr.rental_id,
  rr.instance_id,
  date_trunc('month', coalesce(rr.paid_on, rr.confirmed_at::date, rr.reported_at::date))::date AS month,
  coalesce(sum(rr.amount) FILTER (WHERE rr.status = 'confirmed'), 0)  AS received,
  count(*) FILTER (WHERE rr.status = 'confirmed')::int                AS payments,
  coalesce(sum(rr.amount) FILTER (WHERE rr.status = 'reported'), 0)   AS awaiting,
  count(*) FILTER (WHERE rr.status = 'reported')::int                 AS awaiting_count,
  count(*) FILTER (WHERE rr.tenancy_id IS NULL)::int                  AS without_tenant
FROM public.rent_records rr
WHERE rr.rental_id IS NOT NULL
  AND rr.status IN ('confirmed', 'reported')
GROUP BY rr.rental_id, rr.instance_id, 3;

COMMENT ON VIEW public.door_money_months IS
  'DR-0903: per door, per month the money came — confirmed received, count, and reported-not-yet-confirmed (never added to received). security_invoker: read under the reader''s own RLS.';

REVOKE ALL ON public.door_money_months FROM anon, PUBLIC;
GRANT SELECT ON public.door_money_months TO authenticated;

NOTIFY pgrst, 'reload schema';
