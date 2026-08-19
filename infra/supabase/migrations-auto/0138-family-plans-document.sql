-- ============================================================================
-- 0138 — family_plans: the written family plan, readable in the app
-- ============================================================================
-- Christina 2026-08-19, handing over the August financial workbook + report:
-- "I want Darrell to clearly see everything I showed in these spreadsheets so
-- you may have to make a new tab that has wording for him to read and the
-- information in the spreadsheet."
--
-- One row per (instance, slug): the plan's narrative + every worksheet as one
-- jsonb document. The DATA lives here — behind RLS, inside the family's
-- instance — never in the public repository or the shipped bundle (the same
-- line family_snapshots draws). The Books → Plan tab reads the newest row.
-- family_snapshots is the wrong home: it is the device-state remainder with
-- last-write-wins semantics; a prepared plan document is content, not state.
CREATE TABLE IF NOT EXISTS public.family_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  title       text NOT NULL,
  plan        jsonb NOT NULL,
  updated_by  uuid NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, slug)
);

ALTER TABLE public.family_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_plans' AND policyname = 'family_plans_member_read') THEN
    CREATE POLICY family_plans_member_read ON public.family_plans FOR SELECT USING (user_in_instance(instance_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_plans' AND policyname = 'family_plans_member_insert') THEN
    CREATE POLICY family_plans_member_insert ON public.family_plans FOR INSERT WITH CHECK (user_in_instance(instance_id) AND updated_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_plans' AND policyname = 'family_plans_member_update') THEN
    CREATE POLICY family_plans_member_update ON public.family_plans FOR UPDATE USING (user_in_instance(instance_id)) WITH CHECK (user_in_instance(instance_id) AND updated_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'family_plans' AND policyname = 'family_plans_member_delete') THEN
    CREATE POLICY family_plans_member_delete ON public.family_plans FOR DELETE USING (user_in_instance(instance_id));
  END IF;
END $$;

-- The 0125 viewer deny-overlay only covers tables that exist when it runs;
-- re-run it so the 'viewer' role stays read-only on THIS table too (DR-0241 —
-- the tenancy gate enforces exactly this line on every instance-scoped table).
SELECT public.apply_viewer_readonly_overlay();
