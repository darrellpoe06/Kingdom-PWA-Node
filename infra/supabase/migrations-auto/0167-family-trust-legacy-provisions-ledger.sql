-- =============================================================================
-- 0167 — Family trust: the Legacy Provisions ledger
-- =============================================================================
-- Declared by Darrell 2026-09-02, naming the three provisions written into the
-- family trust and asking for them as a WORKING SYSTEM in the app: the family
-- constitution the trust points at, the spendthrift provision, and forced income
-- production ("beneficiaries don't just take distributions, they also learn to
-- produce, build, invest, and contribute value back into it").
--
-- TEMPLATE vs LEDGER — the 0052-recipes / 0164-Road-to-150 split, again.
-- The AUTHORED content (the constitution articles, the three provision records,
-- the production policy, the spendthrift review questions) ships as
-- version-controlled code in app/src/lib/family-trust.js, so the canonical
-- family document can never be lost and reaches every device on deploy. This
-- table holds only what a family ACTUALLY DID: a production entry, a
-- distribution, an article attestation, an exemption, a spendthrift answer.
-- There is therefore no write path by which recorded activity can overwrite the
-- authored rule — that split is structural, not conventional.
--
-- ── SCOPE: FAMILY, NOT PERSON — a deliberate divergence from 0164 ──
-- A weigh-in is one person's alone; a TRUST LEDGER is the house's shared record.
-- A trustee must be able to read a beneficiary's standing — that is the entire
-- mechanism of the forced-production provision — so these policies scope rows to
-- the INSTANCE (owner/admin/member), the 0052 family pattern, not to
-- created_by. Cross-instance reads remain impossible: user_role_in_instance is
-- the wall, and one family can never see another's ledger.
--
-- AMOUNTS ARE NULLABLE ON PURPOSE. A contribution whose value nobody costed is
-- recorded with a NULL amount, and the engine reports the ratio check as
-- 'unknown' rather than computing over a fabricated zero (DR-0076: absent is not
-- zero). A NOT NULL DEFAULT 0 here would silently manufacture the exact painted
-- number the whole system exists to refuse.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/triggers,
--             guarded publication add. Additive; no existing table is altered.
-- APPLY: rides the db-migrate lane automatically on merge to main (DR-0084) —
--        no Studio paste. The app runs device-local until it applies, then syncs.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- family_trust_records — one flat ledger, grouped by `kind` (the 0132 model).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_trust_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  slug            text NOT NULL,                    -- stable client-side id
  kind            text NOT NULL DEFAULT 'production',
  beneficiary     text NOT NULL DEFAULT '',         -- '' only for house-level rows
  occurred_at     date,                             -- NULL = undated, reported as undated
  label           text,
  production_kind text,                             -- earned/business/invested/labor/skill/service/contribution
  amount          numeric(14,2),                    -- NULL = not costed, NOT zero
  article_id      text,                             -- constitution article attested
  item_id         text,                             -- spendthrift review item answered
  answer          text,                             -- 'yes' | 'no' for a spendthrift row
  reason          text,                             -- exemption reason
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz,
  CONSTRAINT family_trust_records_kind_chk
    CHECK (kind IN ('production','distribution','attestation','exemption','spendthrift')),
  CONSTRAINT family_trust_records_answer_chk
    CHECK (answer IS NULL OR answer IN ('yes','no')),
  -- Every kind but a house-level spendthrift answer belongs to a person. This
  -- mirrors normalizeEntry() in family-trust.js so a row the engine would refuse
  -- cannot reach the table in the first place.
  CONSTRAINT family_trust_records_beneficiary_chk
    CHECK (kind = 'spendthrift' OR length(btrim(beneficiary)) > 0)
);

CREATE INDEX IF NOT EXISTS family_trust_records_instance_idx
  ON family_trust_records(instance_id);
CREATE INDEX IF NOT EXISTS family_trust_records_kind_idx
  ON family_trust_records(instance_id, kind, occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS family_trust_records_slug_uk
  ON family_trust_records(instance_id, slug);

-- updated_at touch (shared function from 0011/0023).
DROP TRIGGER IF EXISTS family_trust_records_touch_updated ON family_trust_records;
CREATE TRIGGER family_trust_records_touch_updated
  BEFORE UPDATE ON family_trust_records
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — family-scoped. Read and write require a real role in the instance the
-- row belongs to; INSERT is checked against the instance the client claims, so
-- a row can never be written into someone else's tenancy.
-- ---------------------------------------------------------------------------
ALTER TABLE family_trust_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS family_trust_records_read   ON family_trust_records;
DROP POLICY IF EXISTS family_trust_records_write  ON family_trust_records;
DROP POLICY IF EXISTS family_trust_records_update ON family_trust_records;
DROP POLICY IF EXISTS family_trust_records_delete ON family_trust_records;

CREATE POLICY family_trust_records_read ON family_trust_records FOR SELECT
  TO authenticated
  USING (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin','member'));

CREATE POLICY family_trust_records_write ON family_trust_records FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid()
              AND coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin','member'));

CREATE POLICY family_trust_records_update ON family_trust_records FOR UPDATE
  TO authenticated
  USING (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin','member'))
  WITH CHECK (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin','member'));

-- A mis-entered record is corrected by its author or by an owner/admin. The
-- ledger is the provision, so deletion is deliberately narrow.
CREATE POLICY family_trust_records_delete ON family_trust_records FOR DELETE
  TO authenticated
  USING (created_by = auth.uid()
         OR coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- ---------------------------------------------------------------------------
-- Standing overlays — the viewer/reviewer read-only lens and the assistant
-- scope wall must account for this table too. The tenancy-guard and
-- assistant-scope gates fail the build on a migration that skips this.
-- ---------------------------------------------------------------------------
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- REALTIME — a contribution entered on a phone at the shop shows on the tablet
-- at the family table. RLS still applies to the stream.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'family_trust_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE family_trust_records;
  END IF;
END $realtime$;

NOTIFY pgrst, 'reload schema';
