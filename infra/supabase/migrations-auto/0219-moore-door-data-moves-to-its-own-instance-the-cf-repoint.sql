-- =============================================================================
-- 0219 — Moore Divahs' door data moves to its own instance (the cf re-point)
-- =============================================================================
-- Darrell 2026-09-14: "MooreDivahs App get done… 2." → "2. Sure." The Moore door
-- has always READ and WRITTEN its class/order data under the FAMILY instance
-- (`poe-family`) while the business's own identity is `moore-divahs`
-- (business-registry.js: doorDataInstanceSlug / captureInstanceSlug = 'poe-family',
-- with a standing comment that "the cf-instance re-point rides a later data
-- increment"). This is that increment — the same one-business-one-instance
-- principle DR-0365 set for Poe Properties.
--
-- MEASURED FIRST, on the backend the app actually reads (DR-0317), via
-- sovereign-read run 34871114927 (2026-09-14): custom_orders 0, business_messages
-- 0, class_sessions 1, class_signups 6, showcase_pieces 12 (already on
-- moore-divahs). So there is almost nothing to move; this migration exists to
-- move whatever IS stranded under poe-family and to PROVE none is left, so the
-- registry flip that rides with it is safe.
--
-- SAFE BY CONSTRUCTION.
--   * It MOVES rows (re-parents instance_id), never deletes — nothing is lost.
--   * These four tables are business-door features; the only reason the FAMILY
--     instance holds any of their rows is this very misconfiguration, so every
--     poe-family row in them is Moore's. (Moore is the only registry door;
--     TLC/Poe Properties have their own instances.)
--   * It self-asserts EXHAUSTION: after the move, zero door-data rows may remain
--     under poe-family, or it RAISES and the whole migration rolls back — the
--     DR-0311 floor+exhaustion discipline.
--   * A row under some OTHER instance (a null/seed instance) is untouched — it is
--     invisible to the door both before and after (the door read poe-family, not
--     null), so re-pointing to moore-divahs changes nothing for it. No regression.
-- IDEMPOTENT: a re-run moves 0 rows and the assertion still holds.
-- =============================================================================

DO $$
DECLARE
  v_poe   uuid;
  v_moore uuid;
  v_left  bigint;
BEGIN
  SELECT id INTO v_poe   FROM instances WHERE slug = 'poe-family';
  SELECT id INTO v_moore FROM instances WHERE slug = 'moore-divahs';

  IF v_moore IS NULL THEN
    RAISE EXCEPTION '0219 re-point: the moore-divahs instance is missing — cannot re-point onto nothing';
  END IF;
  IF v_poe IS NULL THEN
    RAISE NOTICE '0219 re-point: no poe-family instance on this database; nothing to move';
    RETURN;
  END IF;

  UPDATE custom_orders     SET instance_id = v_moore WHERE instance_id = v_poe;
  UPDATE class_sessions    SET instance_id = v_moore WHERE instance_id = v_poe;
  UPDATE class_signups     SET instance_id = v_moore WHERE instance_id = v_poe;
  UPDATE business_messages SET instance_id = v_moore WHERE instance_id = v_poe;

  SELECT (SELECT count(*) FROM custom_orders     WHERE instance_id = v_poe)
       + (SELECT count(*) FROM class_sessions    WHERE instance_id = v_poe)
       + (SELECT count(*) FROM class_signups     WHERE instance_id = v_poe)
       + (SELECT count(*) FROM business_messages WHERE instance_id = v_poe)
    INTO v_left;

  IF v_left <> 0 THEN
    RAISE EXCEPTION '0219 re-point incomplete: % door-data rows still under poe-family after the move', v_left;
  END IF;
END $$;
