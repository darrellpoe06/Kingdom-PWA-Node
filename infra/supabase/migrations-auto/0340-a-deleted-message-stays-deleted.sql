-- =============================================================================
-- 0340 — a deleted message stays deleted (DR-1609)
-- =============================================================================
-- Darrell, 2026-11-19, on The Word: his private, edited message, deleted,
-- "never leaves."
--
-- WHAT HAPPENED, MEASURED FROM THE CODE. The app deletes the row from the
-- sovereign database it reads (choir_sermons; 0011's owner/admin delete policy
-- allows it, and realtime refreshes the list). But the NAS rider
-- infra/nas-supabase/content_sync.py (services.json "content-sync", every 6
-- hours, --commit) copies into sovereign every content row the HOSTED project
-- holds and sovereign lacks. A row the family deleted is exactly such a row, so
-- within six hours the sync put it back. The delete worked; the carry undid it.
--
-- WHAT THIS ADDS
--   1. content_tombstones (table_name, row_id): one row per content row that
--      was deleted on this database. No policies: anon and authenticated read
--      nothing; the NAS sync reads it as the database owner.
--   2. An AFTER DELETE trigger on choir_sermons that writes the tombstone, and
--      an AFTER INSERT trigger that clears it, so a deliberate re-insert of the
--      same id (a restore) is never blocked.
--   content_sync.py now drops every planned insert whose id is tombstoned, and
--   reports how many it held back.
--
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION, triggers
-- dropped and re-created, grants re-applied.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.content_tombstones (
  table_name text        NOT NULL,
  row_id     text        NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid,
  PRIMARY KEY (table_name, row_id)
);

ALTER TABLE public.content_tombstones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.content_tombstones FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.content_tombstone_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_tombstones (table_name, row_id, deleted_by)
  VALUES (TG_TABLE_NAME, OLD.id::text, auth.uid())
  ON CONFLICT (table_name, row_id)
  DO UPDATE SET deleted_at = now(), deleted_by = EXCLUDED.deleted_by;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.content_tombstone_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.content_tombstones
   WHERE table_name = TG_TABLE_NAME AND row_id = NEW.id::text;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.content_tombstone_on_delete() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.content_tombstone_on_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS choir_sermons_tombstone_delete ON public.choir_sermons;
CREATE TRIGGER choir_sermons_tombstone_delete
  AFTER DELETE ON public.choir_sermons
  FOR EACH ROW EXECUTE FUNCTION public.content_tombstone_on_delete();

DROP TRIGGER IF EXISTS choir_sermons_tombstone_insert ON public.choir_sermons;
CREATE TRIGGER choir_sermons_tombstone_insert
  AFTER INSERT ON public.choir_sermons
  FOR EACH ROW EXECUTE FUNCTION public.content_tombstone_on_insert();
