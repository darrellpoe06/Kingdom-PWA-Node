-- =============================================================================
-- 0279 — AN ALLOW-LIST IS ADDED TO, NEVER REWRITTEN FROM MEMORY
-- =============================================================================
-- Restores the two door_events subjects 0275 deleted, and gives 0275's own
-- subject the read arm it never got. DR-0976.
--
-- WHAT BROKE, MEASURED. rls-isolation has failed every run since 2026-10-11
-- 04:44 (10 runs, ~28 hours), always on the same line:
--
--   0263-document-signing-smoke.sql:203: ERROR: DOCUMENT SIGNING SMOKE FAIL:
--   the family asks for both signatures (expected succeeds=t, got f)
--
-- The cause is 0275's rebuild of door_events_subject_check. The constraint's
-- whole history, read from the files:
--
--   0263 -> rent, work, document
--   0266 -> rent, work, document, camera
--   0269 -> rent, work, document, camera, stay
--   0275 -> rent, work, application, stay, portal-request   <-- two deleted
--
-- PROVEN on PostgreSQL 16.15 by applying those four ADD CONSTRAINT statements
-- in order, extracted verbatim from the real files, then performing the exact
-- INSERT the signature function performs:
--
--   ERROR: new row for relation "door_events" violates check constraint
--          "door_events_subject_check"
--   DETAIL: Failing row contains (..., document, ..., signature-requested, ...)
--
-- SO THREE THINGS ARE BROKEN ON THE LIVE DATABASE, not one:
--   * 'document' — 0263 writes it THREE times: signature-requested, signed and
--     fully-signed. Requesting a lease signature, signing one and completing
--     one all raise. Document signing is gone, end to end.
--   * 'camera' — 0266 writes it from a TRIGGER on door_camera_access, so the
--     insert on that table itself raises: asking for or granting door-camera
--     access fails outright. This has not even been REPORTED yet, because the
--     leg stops at the first failing smoke and 0263's runs first.
--   * 'portal-request' — the mirror image. 0275 added it to the constraint and
--     never touched the door_events_read POLICY, which still ends at 0269's
--     arms and falls through to `ELSE false`. So 0275's own audit events are
--     written successfully and are invisible to every authenticated reader.
--
-- WHY IT HAPPENED, AND WHY MORE CARE IS NOT THE FIX. 0275's own comment shows
-- the author reasoning about this exact hazard:
--
--   "ITS `subject` CHECK IS AN ALLOW-LIST and this widens it... the widened
--    list NAMES 'application' as well, because 0272 (open on PR #2106) adds
--    that value and this file carries the higher number -- so if it merges
--    first and mine rebuilt the constraint from 0262's two values, this
--    migration would SILENTLY DELETE its value and 0272's writes would start
--    failing."
--
-- They guarded against an UNMERGED SIBLING BRANCH and then did the thing they
-- feared to the ALREADY-MERGED ones: the list was reconstructed from 0262's
-- two values plus 'stay', so 0263's 'document' and 0266's 'camera' fell out.
-- The comment says "widens"; the statement narrows. Reconstructing an
-- allow-list from memory across four files is not something prose can be
-- trusted to do, which is why the durable output of this is a deterministic
-- check (scripts/constraint-allow-list-guard.mjs) and not a resolution to be
-- more careful.
--
-- THE RULE THIS FILE ESTABLISHES: an allow-list is ADDED TO. A migration that
-- rebuilds one carries the union of every value already allowed, and dropping
-- one is a declared act with a named reason, never a side effect of retyping.
--
-- IDEMPOTENT: DROP ... IF EXISTS then ADD; the policy is rebuilt from a
-- composed string. ADDITIVE — no data is touched, nothing is deleted, and the
-- allowed set only grows.
-- =============================================================================
DO $$
DECLARE
  has_portal boolean;
  arms text;
BEGIN
  -- Skipped entirely where door_events does not exist, so the earlier chain
  -- legs that stop before 0262 still replay clean. Same guard 0275 uses.
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'door_events') THEN
    RETURN;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 1. The allow-list: the UNION of every value any migration has allowed.
  --    0263's 'document' and 0266's 'camera' are restored; 0269's 'stay' and
  --    0275's 'application' and 'portal-request' are kept. Nothing is dropped.
  -- ---------------------------------------------------------------------------
  ALTER TABLE public.door_events DROP CONSTRAINT IF EXISTS door_events_subject_check;
  ALTER TABLE public.door_events ADD CONSTRAINT door_events_subject_check
    CHECK (subject IN ('rent', 'work', 'document', 'camera', 'stay', 'application', 'portal-request'));

  -- ---------------------------------------------------------------------------
  -- 2. The read policy gets an arm for every subject that has a table.
  --
  --    `ELSE false` means a subject with no arm is written and then unreadable,
  --    which is what has been happening to 'portal-request'. The arms are
  --    composed rather than written flat so the file applies both before and
  --    after 0275 — referencing a table that does not exist yet would fail at
  --    policy-creation time and roll the whole file back.
  --
  --    'application' gets NO arm here, deliberately. 0272 (PR #2106) is the
  --    file that adds that value and defines the table it points at; inventing
  --    a table name for it would be a guess, and a guess that does not compile.
  --    It stays ALLOWED by the constraint above — never narrow — and 0272
  --    carries its own arm. Recorded in DR-0976 so it is not lost.
  -- ---------------------------------------------------------------------------
  SELECT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'tenant_portal_requests')
    INTO has_portal;

  arms :=
    '    WHEN ''rent'' THEN EXISTS (SELECT 1 FROM rent_records r WHERE r.id = subject_id)' || E'\n' ||
    '    WHEN ''work'' THEN EXISTS (SELECT 1 FROM tenant_maintenance_requests w WHERE w.id = subject_id)' || E'\n' ||
    '    WHEN ''document'' THEN EXISTS (SELECT 1 FROM property_documents d WHERE d.id = subject_id)' || E'\n' ||
    '    WHEN ''camera'' THEN EXISTS (SELECT 1 FROM door_camera_access a WHERE a.id = subject_id)' || E'\n' ||
    '    WHEN ''stay'' THEN EXISTS (SELECT 1 FROM door_stays s WHERE s.id = subject_id)' || E'\n';
  IF has_portal THEN
    arms := arms ||
      '    WHEN ''portal-request'' THEN EXISTS (SELECT 1 FROM tenant_portal_requests p WHERE p.id = subject_id)' || E'\n';
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS door_events_read ON public.door_events';
  EXECUTE
    'CREATE POLICY door_events_read ON public.door_events FOR SELECT TO authenticated' || E'\n' ||
    '  USING (CASE subject' || E'\n' || arms || '    ELSE false END)';
END $$;
