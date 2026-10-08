-- =============================================================================
-- 0254 — the house openers, and a record of every press of one
-- =============================================================================
-- Darrell 2026-10-08: "Let's add the garage door opener and any system opener
-- to the header in PoeTech App... so if your listening to you lesson as you
-- drive when you get home the garage door opener button is there for easy
-- access... make sense?"
--
-- REALITY-TRACE (DR-0061). Before this migration the repo had NO opener
-- integration at all: a search of app/, infra/ and scripts/ for garage, myq,
-- homekit and home-assistant returned only lesson prose and the properties room
-- list. So the header button has to draw from a real row or draw nothing, and
-- this is the row. There is no seed, no demo opener and no default: an empty
-- table means the header shows no button, which is the honest state of a house
-- whose opener nobody has registered yet.
--
-- WHAT IS DELIBERATELY NOT HERE. No device address, no GPIO pin, no MQTT topic,
-- no vendor URL. Those live on the NAS beside the service that presses the
-- relay (infra/nas-openers), because a browser that can read them can leak
-- them, and the cloud has no business knowing how to open his garage. The row
-- carries an id, a human name, a place, and a `kind` naming WHICH adapter the
-- NAS should use. The NAS resolves kind + id to the actual device locally.
--
-- WHY THE PRESS LEDGER. A physical actuator on a family's house needs an
-- answerable record: who pressed it, which opener, when, and what came back.
-- `opener_presses` is append-only from the app's side (insert + select, no
-- update, no delete by a member) so the record cannot be quietly tidied.
--
-- THE GATE IS RLS, NOT THE CLIENT (DR-0060). The policies below return rows
-- only to a member of the `poe-family` instance, the same gate as 0073, 0145
-- and 0253. A church or premium account that asks this question gets an empty
-- result and therefore no button, with no client-side check standing in for a
-- server one. The app's own family check is a convenience on top, never the
-- boundary.
--
-- IDEMPOTENT: every statement guarded, safe to apply twice.

-- ---------------------------------------------------------------------------
-- The openers a household owns.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS household_openers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances (id) ON DELETE CASCADE,
  name        text NOT NULL,                  -- "Garage", "Front gate"
  place       text NOT NULL DEFAULT '',       -- "House", "Drive"
  -- WHICH ADAPTER the NAS uses. Kept in step with OPENER_KINDS in
  -- app/src/lib/openers.js; a kind the app does not know is dropped before a
  -- button is drawn, so a typo here hides the row rather than painting a
  -- button that cannot work.
  kind        text NOT NULL CHECK (kind IN ('relay-http', 'relay-gpio', 'mqtt', 'webhook')),
  -- FALSE unless the device genuinely reports its own position. A door that
  -- cannot report is NEVER shown as closed just because nothing said otherwise.
  reports     boolean NOT NULL DEFAULT false,
  enabled     boolean NOT NULL DEFAULT false, -- ships OFF; armed on purpose
  note        text NOT NULL DEFAULT '',
  created_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS household_openers_name_once ON household_openers (instance_id, lower(name));
CREATE INDEX IF NOT EXISTS household_openers_instance_idx ON household_openers (instance_id, enabled);

-- ---------------------------------------------------------------------------
-- Every press, kept. Append-only from a member's side.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opener_presses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opener_id  uuid NOT NULL REFERENCES household_openers (id) ON DELETE CASCADE,
  pressed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  at         timestamptz NOT NULL DEFAULT now(),
  -- 'sent' (the press left), 'confirmed' (the door reported movement),
  -- 'failed' (the house said why), 'unknown' (nothing came back). NEVER
  -- 'opened' on silence — that is the lie DR-0076 exists to stop.
  result     text NOT NULL DEFAULT 'unknown' CHECK (result IN ('sent', 'confirmed', 'failed', 'unknown')),
  reason     text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS opener_presses_opener_at_idx ON opener_presses (opener_id, at DESC);

-- ---------------------------------------------------------------------------
-- RLS. The family instance only, on both tables.
-- ---------------------------------------------------------------------------
ALTER TABLE household_openers ENABLE ROW LEVEL SECURITY;
ALTER TABLE opener_presses    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS household_openers_read   ON household_openers;
DROP POLICY IF EXISTS household_openers_write  ON household_openers;
DROP POLICY IF EXISTS household_openers_update ON household_openers;
DROP POLICY IF EXISTS household_openers_delete ON household_openers;
DROP POLICY IF EXISTS opener_presses_read      ON opener_presses;
DROP POLICY IF EXISTS opener_presses_insert    ON opener_presses;

-- A member of the household sees its openers. Nobody else does.
CREATE POLICY household_openers_read ON household_openers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = auth.uid() AND im.instance_id = household_openers.instance_id AND i.slug = 'poe-family'
  ));

-- Registering, renaming and arming an opener is a household act, so it takes
-- the same membership. There is no self-service path for a non-member.
CREATE POLICY household_openers_write ON household_openers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = auth.uid() AND im.instance_id = household_openers.instance_id AND i.slug = 'poe-family'
  ));
CREATE POLICY household_openers_update ON household_openers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = auth.uid() AND im.instance_id = household_openers.instance_id AND i.slug = 'poe-family'
  ));
CREATE POLICY household_openers_delete ON household_openers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM instance_members im
      JOIN instances i ON i.id = im.instance_id
     WHERE im.user_id = auth.uid() AND im.instance_id = household_openers.instance_id AND i.slug = 'poe-family'
  ));

-- The press ledger: a member reads the house's record and may add to it.
-- No UPDATE policy and no DELETE policy, on purpose — the record of who opened
-- the house and when is not something a member can tidy away.
CREATE POLICY opener_presses_read ON opener_presses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM household_openers o
      JOIN instance_members im ON im.instance_id = o.instance_id
      JOIN instances i ON i.id = o.instance_id
     WHERE o.id = opener_presses.opener_id AND im.user_id = auth.uid() AND i.slug = 'poe-family'
  ));
CREATE POLICY opener_presses_insert ON opener_presses FOR INSERT
  WITH CHECK (
    pressed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM household_openers o
        JOIN instance_members im ON im.instance_id = o.instance_id
        JOIN instances i ON i.id = o.instance_id
       WHERE o.id = opener_presses.opener_id AND im.user_id = auth.uid() AND i.slug = 'poe-family'
    )
  );

-- ---------------------------------------------------------------------------
-- THE OVERLAYS, in 0232's order. household_openers is instance-scoped, so the
-- assistant scope overlay (0130) and the viewer read-only overlay (DR-0241)
-- have to be re-run or a viewer could WRITE it — which on this table means a
-- viewer could arm an opener on somebody's house. The tenancy guard catches a
-- migration that forgets this, and it caught this one.
-- ---------------------------------------------------------------------------
SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();
