-- =============================================================================
-- 0056 — church device inventory: the asset register for church resources
-- =============================================================================
-- Declared by Darrell 2026-06-29. A real ASSET REGISTER (inventory control) for
-- the church's physical infrastructure — every device recorded as a singular,
-- identified asset: the NAS (DS1621xs), the 2x RTX 4070 GPU machine(s), the
-- NovaStar VX1000 processor, the LED video wall, network gear, cameras/security,
-- the sound board, media-team rigs. Each carries type, location, specs, status,
-- owner/steward, and (where applicable) the JOB CAPABILITIES it can run.
--
-- WHY ITS OWN TABLE (not inventory_items): inventory_items (0052) is a CONSUMABLE
-- stock ledger — quantity-on-hand DERIVED from append-only movements ("how many
-- LED panels / HDMI cables do we have"). A device register is the opposite shape:
-- ONE row per identified asset, with mutable operational status (online/offline)
-- and a capabilities array. Different primitive, so a sibling table — it LINKS to
-- the LED-wall capital project (church_capital_projects, 0030) by slug rather than
-- duplicating it, and reuses record_events (0052) for edit history.
--
-- CAPABILITIES feed the deterministic idle-GPU job router (lib/gpu-scheduler.js):
-- a job that needs 'llm-inference' routes only to a device whose capabilities
-- include it. The register is the single source of which node can take which job.
--
-- ROLE-SCOPED / NO LEAK: church infrastructure — never public seed. RLS scopes
-- every row to the church instance. Read = owner/admin/member (any church staff);
-- write = owner/admin/member; hard delete = owner/admin only (members soft-retire
-- via active=false). Sensitive fields (serial, ip_address) are gated to editors in
-- the UI; the row itself is staff-only by RLS. There is NO anon policy.
--
-- DEPENDS ON: schema-v2.1-infra (instances, user_role_in_instance), 0024
--             (restore-authenticated-grants), 0011/0023 (engagement_touch_updated_at),
--             0030 (church_capital_projects, soft-linked by slug).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--             publication add. Additive, church-internal — no public surface.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- church_devices — the asset register. slug is the stable local id ('dev-...').
-- One row per identified physical device. status is mutable (operational state);
-- capabilities[] is the job-type tokens this device can run (empty = runs none).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_devices (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by           uuid REFERENCES auth.users(id),
  slug                 text NOT NULL,                 -- stable local id ('dev-...')
  name                 text NOT NULL DEFAULT 'Untitled device',
  device_type          text NOT NULL DEFAULT 'other'
                         CHECK (device_type IN (
                           'nas','gpu-node','server','led-processor','led-wall',
                           'display','network','camera','security','audio-console',
                           'media-rig','other')),
  location             text,                          -- where it physically lives
  status               text NOT NULL DEFAULT 'planned'
                         CHECK (status IN (
                           'online','offline','standby','maintenance','retired','planned')),
  steward              text,                          -- owner/steward label (role/name, no PII required)
  make_model           text,                          -- e.g. 'Synology DS1621xs'
  serial               text,                          -- gated to editors in UI (sensitive)
  ip_address           text,                          -- LAN address; gated to editors in UI
  specs                jsonb NOT NULL DEFAULT '{}'::jsonb,   -- flexible spec bag (cpu/vram/storage/ports…)
  capabilities         text[] NOT NULL DEFAULT '{}',  -- job-type tokens it can run (feeds gpu-scheduler)
  capital_project_slug text,                          -- soft link to church_capital_projects.slug
  sme_needed           boolean NOT NULL DEFAULT false, -- specs unknown — flagged for Darrell to confirm
  confirmed            boolean NOT NULL DEFAULT false, -- specs verified off the hardware (DR-0076)
  notes                text,
  active               boolean NOT NULL DEFAULT true,  -- soft-retire (never hard-deleted in app)
  author_persona       text,
  sort_order           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  updated_by           uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS church_devices_instance_idx ON church_devices(instance_id);
CREATE INDEX IF NOT EXISTS church_devices_type_idx     ON church_devices(instance_id, device_type);
-- GIN on the capabilities array so the router can query "who can run X" server-side.
CREATE INDEX IF NOT EXISTS church_devices_caps_idx     ON church_devices USING gin (capabilities);
-- One row per (instance, slug): an idempotent re-upload can't duplicate a device.
CREATE UNIQUE INDEX IF NOT EXISTS church_devices_slug_uniq ON church_devices(instance_id, slug);

DROP TRIGGER IF EXISTS church_devices_touch_updated ON church_devices;
CREATE TRIGGER church_devices_touch_updated
  BEFORE UPDATE ON church_devices
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON church_devices TO authenticated;
ALTER TABLE church_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS church_devices_read   ON church_devices;
DROP POLICY IF EXISTS church_devices_insert ON church_devices;
DROP POLICY IF EXISTS church_devices_update ON church_devices;
DROP POLICY IF EXISTS church_devices_delete ON church_devices;

CREATE POLICY church_devices_read ON church_devices FOR SELECT
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY church_devices_insert ON church_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
CREATE POLICY church_devices_update ON church_devices FOR UPDATE
  TO authenticated
  USING      (user_role_in_instance(instance_id) IN ('owner','admin','member'))
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin','member'));
-- Hard delete tightened to the governors; members soft-retire via active=false.
CREATE POLICY church_devices_delete ON church_devices FOR DELETE
  TO authenticated
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- REALTIME — stream the register so a device flipped online on one device shows
-- live on another, the same way the inventory / capital projects sync.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public' AND tablename = 'church_devices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE church_devices;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
