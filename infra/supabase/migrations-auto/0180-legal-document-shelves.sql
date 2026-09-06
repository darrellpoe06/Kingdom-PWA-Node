-- ===========================================================================
-- RENUMBERED 0168 -> 0169 -> 0180. NOT a new defect in this file: the ordinal
-- guard rejected its ledger row and, until 2026-09-06, nothing failed the run.
--
-- db-migrate #459 on main 397cafb:
--   ERROR: ordinal 0169 already used by 0169-grants-are-asserted-after-every-migration.sql
--
-- So this migration's DDL has been applying and committing on every run while
-- its ledger row was refused -- exactly the state DR-0330 documented for its
-- 0168 -> 0169 move, which simply moved it onto a SECOND external collision.
-- It was invisible because the apply script counted only the DDL's exit status.
-- The ledger-rejection gate added 2026-09-06 is what made it loud, and this
-- file is the first thing that gate caught that nobody had gone looking for.
--
-- 0180 is a cushion above the contiguous external run (0168-0171 observed), not
-- a proven-free number -- see 0181's header for the full reasoning and the
-- honest limit. The stale `0168-legal-document-shelves.sql` ledger row from the
-- first rename is the orphan class DR-0332 names; the sovereign replay prints
-- the exact one-row DELETE that clears it, and it touches only bookkeeping.
-- ===========================================================================
-- =============================================================================
-- 0169 — Legal document shelves: the four categories become real (DR-0329)
-- =============================================================================
-- Darrell 2026-09-06, on the Books -> Legal tab: "I need a section that I can
-- upload legal documents for each of these categories."
--
-- WHAT WAS THERE. Four hardcoded <ul> lists in app/src/components/Legal.jsx --
-- orientation copy painted over nothing. No row, no file, no upload. The P15
-- class exactly: a surface whose entire value is trust, showing values that
-- trace to no real state.
--
-- ── A DELIBERATE EXTENSION OF THE FOUNDATION DOC, NOT A CONTRADICTION ──
-- docs/00-foundations/_root/LEGAL-PRIVACY-BOUNDARY.md binds documents as
-- "pointers only, not file content" -- a considered 2026-05-18 choice, not an
-- oversight. Darrell's direction above asks for real upload. Both are kept:
-- a shelf accepts a FILE (bytes to the private bucket below) or a POINTER (no
-- bytes; `where_filed` says where the paper actually is). The pointer path
-- needs no session and no network, so a shelf still works on a phone with no
-- signal -- a legal shelf that refuses to record anything while offline would
-- be worse than the placeholder it replaces.
--
-- ── CREATOR-SCOPED, NOT INSTANCE-SCOPED: a deliberate divergence from 0167 ──
-- The family trust ledger is instance-scoped BECAUSE a trustee must be able to
-- read a beneficiary's standing -- that sharing is the mechanism of the
-- provision. Legal is the opposite: LEGAL-PRIVACY-BOUNDARY calls it the highest
-- confidentiality requirement in the system, and a household member must not be
-- able to read another's will, custody file, or immigration matter by default.
-- So every policy here is `created_by = auth.uid()`. instance_id is still
-- carried (the sync rail writes it, and it scopes realtime), but it grants
-- NOTHING: membership in an instance is not a key to these rows. Broadening
-- later is a migration; narrowing after a leak is not a remedy.
--
-- ── WHAT THIS DOES *NOT* DO, stated rather than implied (DR-0076 §8) ──
-- Layer 2 of LEGAL-PRIVACY-BOUNDARY specifies AES-GCM-256 at rest with a key
-- derived from the Legal PIN. That is NOT in this migration and NOT in the code
-- that uses it. It cannot be, honestly, under the current architecture:
-- app/src/lib/pin.js:9 states the PIN is never hashed, stored, or compared in
-- the browser -- it is verified server-side -- so there is no PIN-derived key
-- material in the client to encrypt with. Building that means a new key
-- architecture, which is its own decision. What IS true here: private bucket,
-- creator-only RLS, short-lived signed URLs, a PIN-gated tab (PrivateGate), and
-- no title leaving the table. The surface says this plainly rather than
-- implying an encryption layer that does not exist. re-review: 2026-10-15.
--
-- ── WHY THIS IS 0169 AND NOT 0168 (2026-09-06, same-day correction) ──
-- It shipped as 0168 and the db-migrate lane went red on the merge:
--
--   ERROR: ordinal 0168 already used by
--          0168-the-ledger-refuses-a-second-file-with-the-same-number.sql
--          — pick the next free number
--
-- That file is NOT in this repository (code search: zero hits; no open PR
-- carries it), so an 0168 was applied to the database from outside main. The
-- DDL below ran and committed — the table and its policies exist — but the
-- LEDGER INSERT was rejected, which leaves the migration unrecorded and
-- re-applied (harmlessly, it is idempotent) on every subsequent run while the
-- lane stays red. Renumbering is the whole fix.
--
-- THE HONEST LIMIT (DR-0076 §8): 0169 is the next ordinal free *in this repo*.
-- Nothing in this checkout can enumerate the database's ledger — the sandbox
-- has neither database credentials nor a route to the NAS — so it is possible
-- that whatever supplied that 0168 also supplied an 0169. If so, the guard
-- rejects this the same way and names the conflict, which is a cheap and
-- self-correcting failure rather than a silent one. The deeper gap this
-- exposed: the uniqueness rule lives ONLY in the database, so no repo-side
-- check can catch the collision before a merge. Recorded in DR-0329.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies, guarded
--             publication add, ON CONFLICT DO NOTHING on the bucket.
-- APPLY: rides the db-migrate lane automatically on merge to main (DR-0084).
--        Until it applies, the app runs device-local and sync self-heals.
-- =============================================================================

CREATE TABLE IF NOT EXISTS legal_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  slug         text NOT NULL,                    -- stable client-side id
  category     text NOT NULL,
  doc_type     text,
  label        text NOT NULL,
  date_of      date,                             -- NULL = undated, reported as undated
  -- MANDATORY and NOT NULL on purpose. This flag is the single mechanical
  -- guarantee behind the privileged-stripped export: strip privileged=true and
  -- what remains is safe to hand a non-counsel party. A nullable column would
  -- let an undecided row exist, and an undecided row silently defeats the
  -- guarantee for the whole matter. The client refuses to save an undecided
  -- document (validateDocument, reason 'privilege-undecided'); this is the
  -- same rule expressed where it cannot be bypassed.
  privileged   boolean NOT NULL,
  where_filed  text,                             -- pointer records: where the paper is
  note         text,
  file_name    text,
  file_size    bigint,
  storage_path text,                             -- NULL = a POINTER record
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz,
  CONSTRAINT legal_documents_category_chk
    CHECK (category IN ('personal','real-estate','business','tax-regulatory')),
  CONSTRAINT legal_documents_label_chk
    CHECK (length(btrim(label)) > 0),
  -- A row with neither bytes nor a location names a document nobody can
  -- produce. Mirrors validateDocument's 'nowhere' refusal so a record the
  -- engine would reject cannot reach the table by another path.
  CONSTRAINT legal_documents_locatable_chk
    CHECK (storage_path IS NOT NULL OR length(btrim(coalesce(where_filed, ''))) > 0)
);

CREATE INDEX IF NOT EXISTS legal_documents_owner_idx
  ON legal_documents(created_by, category, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_slug_uk
  ON legal_documents(created_by, slug);

DROP TRIGGER IF EXISTS legal_documents_touch_updated ON legal_documents;
CREATE TRIGGER legal_documents_touch_updated
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — creator only, on all four verbs. No instance role grants anything.
-- ---------------------------------------------------------------------------
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_documents_read   ON legal_documents;
DROP POLICY IF EXISTS legal_documents_write  ON legal_documents;
DROP POLICY IF EXISTS legal_documents_update ON legal_documents;
DROP POLICY IF EXISTS legal_documents_delete ON legal_documents;

CREATE POLICY legal_documents_read ON legal_documents FOR SELECT
  TO authenticated USING (created_by = auth.uid());

CREATE POLICY legal_documents_write ON legal_documents FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY legal_documents_update ON legal_documents FOR UPDATE
  TO authenticated USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY legal_documents_delete ON legal_documents FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- Standing overlays — the viewer/reviewer read-only lens and the assistant
-- scope wall must account for this table too (the tenancy-guard and
-- assistant-scope gates fail the build on a migration that skips this).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- REALTIME — the owner's own devices only; RLS still applies to the stream, so
-- the subscription carries nothing another user could ever receive.
-- ---------------------------------------------------------------------------
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'legal_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE legal_documents;
  END IF;
END $realtime$;

-- ---------------------------------------------------------------------------
-- STORAGE — the private vault.
--
-- Bucket by MIGRATION, never by hand: 0078 exists because sermon-documents and
-- church-team-documents were created in a dashboard, so a database move brought
-- their policies without the buckets. This bucket is born the right way.
--
-- It is also born CLEAN with respect to DR-0317: the blob gap that broke the
-- gallery and the team library is a gap in COPYING legacy objects between
-- backends. This bucket has no legacy objects — every byte in it will be
-- written by the sovereign backend that serves it.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('legal-documents', 'legal-documents', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0169: insufficient privilege on storage.buckets - create legal-documents (PRIVATE) via the dashboard';
END $$;

-- Object paths are `<owner user id>/<slug>.<ext>`, so the first folder segment
-- IS the access rule and no join is needed to enforce it. All four verbs are
-- owner-only: a read policy alone would leave anyone able to overwrite another
-- person's will in place, which is worse than reading it.
DO $$
BEGIN
  DROP POLICY IF EXISTS legal_documents_object_read   ON storage.objects;
  DROP POLICY IF EXISTS legal_documents_object_write  ON storage.objects;
  DROP POLICY IF EXISTS legal_documents_object_update ON storage.objects;
  DROP POLICY IF EXISTS legal_documents_object_delete ON storage.objects;

  CREATE POLICY legal_documents_object_read ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY legal_documents_object_write ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY legal_documents_object_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY legal_documents_object_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE '0169: insufficient privilege on storage.objects - create the four legal-documents owner-only policies via the dashboard';
END $$;

NOTIFY pgrst, 'reload schema';
