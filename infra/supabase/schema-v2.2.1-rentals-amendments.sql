-- =====================================================================
-- Kingdom-PWA / SKOS / PoeTech — schema-v2.2.1-rentals-amendments.sql
--
-- v2.2.1 RENTALS AMENDMENTS (locked in 2026-05-25 by Darrell, follow-on
-- to the original Q5 lock-in answers).
-- Depends on: schema-v2.1-infra.sql, schema-v2.2-rentals.sql,
--             schema-v2.8-ops.sql (for the notifications table the
--             tier-check now writes to when it fires).
--
-- Two amendments:
--
--  Q3 lock-in (2026-05-25 follow-on): Family-tier covers exactly ONE
--  rental door. The original rentals_tier_enforce trigger checked
--  no-third-party-renters + Landlord tier 10-door cap. This amendment
--  extends it to refuse a SECOND rental row on a Family-tier instance.
--
--  Q4 lock-in (2026-05-25 follow-on): when the tier-check fires, the
--  landlord (instance owner) should see actionable information — what
--  was attempted, why it was refused, and the upgrade path. Instead of
--  only RAISE EXCEPTION (which surfaces as a generic SQL error in the
--  React app), the trigger now ALSO writes a `notifications` row to
--  every owner + admin of the instance so the constraint failure is
--  visible in the in-app awareness layer.
--
-- POE binding: the user still has the last word — they can read the
-- notification, decide whether to upgrade, and either re-attempt or
-- stay at Family tier. The trigger refuses the write, but it informs
-- the human why.
-- =====================================================================

BEGIN;

-- =====================================================================
-- Replacement rentals_tier_enforce — adds Family single-door cap +
-- emits a notifications row on every refusal.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rentals_tier_enforce()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_door_count   int;
  v_active_doors int;
  v_tier         text;
  v_owner_user   uuid;
  v_msg          text;
  v_admin        record;
BEGIN
  v_tier := instance_active_tier(NEW.instance_id);

  -- Family-tier: no third-party renters (carried forward from v2.2)
  IF v_tier = 'family' AND TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM leases l
    JOIN renters r ON r.id = l.renter_id
    WHERE l.rental_id = NEW.id
      AND r.external_user_id IS NOT NULL
  ) THEN
    v_msg := 'Family tier: rentals cannot have non-family renters. '
          || 'Upgrade to Landlord or Business tier.';
    PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
    RAISE EXCEPTION '%', v_msg;
  END IF;

  -- Family-tier: single-door cap (Q3 lock-in 2026-05-25)
  IF v_tier = 'family' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_active_doors FROM rentals
      WHERE instance_id = NEW.instance_id AND status != 'sold';
    -- v_active_doors does NOT include NEW yet (BEFORE-row triggers vs AFTER —
    -- we're AFTER per the existing trigger declaration). The new row has been
    -- inserted; refuse if its insertion pushes the active door count above 1.
    IF v_active_doors > 1 THEN
      v_msg := 'Family tier: maximum 1 active rental door. '
            || 'Currently ' || v_active_doors || ' at this instance; '
            || 'upgrade to Landlord (up to 10 doors) or Business (up to 50) tier.';
      PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
      RAISE EXCEPTION '%', v_msg;
    END IF;
  END IF;

  -- Landlord-tier: 10-door cap (carried forward from v2.2)
  IF v_tier = 'landlord' THEN
    SELECT COUNT(*) INTO v_door_count FROM rentals
      WHERE instance_id = NEW.instance_id AND status != 'sold';
    IF v_door_count > 10 THEN
      v_msg := 'Landlord tier: maximum 10 active doors. '
            || 'Currently ' || v_door_count || ' at this instance; '
            || 'upgrade to Premium or Business tier.';
      PERFORM rentals_tier_notify(NEW.instance_id, NEW.id, v_tier, v_msg);
      RAISE EXCEPTION '%', v_msg;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================================
-- Helper: write notifications rows to every owner + admin of the instance
--         describing the tier-check failure (Q4 lock-in 2026-05-25).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rentals_tier_notify(
  p_instance uuid,
  p_rental   uuid,
  p_tier     text,
  p_msg      text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target record;
BEGIN
  FOR v_target IN
    SELECT tm.user_id
      FROM instance_members tm
     WHERE tm.instance_id = p_instance
       AND tm.role IN ('owner','admin')
  LOOP
    BEGIN
      INSERT INTO notifications (
        instance_id, created_by,
        target_user_id, kind, channel,
        deliver_at, title, body,
        action_label, action_uri,
        linked_entity_kind, linked_entity_id,
        priority, dedupe_key, status
      ) VALUES (
        p_instance, v_target.user_id,
        v_target.user_id, 'custom', 'in-app',
        now(),
        'Tier check fired on rentals',
        p_msg
          || E'\nInstance tier: ' || COALESCE(p_tier, 'none')
          || E'\nRental row: ' || COALESCE(p_rental::text, '(pending)'),
        'Review upgrade options',
        '/billing/upgrade',
        'rentals', p_rental,
        'high',
        'tier-check:' || COALESCE(p_rental::text, gen_random_uuid()::text)
                     || ':' || COALESCE(p_tier, 'none'),
        'queued'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Notification insertion is best-effort; the tier-check refusal is the
      -- authoritative outcome. Swallow notification failures so the error
      -- the user sees is the original tier message, not a downstream issue.
      NULL;
    END;
  END LOOP;
END;
$$;

-- Re-attach the trigger to pick up the new function body. (CREATE OR REPLACE
-- updates the function; existing triggers reference it by name, so the
-- replacement is picked up automatically. The DROP/CREATE below is belt-and-
-- suspenders to guarantee the trigger uses the new definition on platforms
-- with aggressive function caching.)
DROP TRIGGER IF EXISTS rentals_tier_enforce_trg ON rentals;
CREATE TRIGGER rentals_tier_enforce_trg
  AFTER INSERT OR UPDATE OF status ON rentals
  FOR EACH ROW EXECUTE FUNCTION rentals_tier_enforce();

COMMIT;

-- =====================================================================
-- End of schema-v2.2.1-rentals-amendments.sql
-- =====================================================================
