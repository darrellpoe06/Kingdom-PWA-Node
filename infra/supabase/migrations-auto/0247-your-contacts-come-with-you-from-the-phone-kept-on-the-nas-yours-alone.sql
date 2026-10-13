-- =============================================================================
-- 0247 — Your contacts come with you from the phone, kept on your own server,
--        yours alone by default (DR-0736)
-- =============================================================================
-- Darrell 2026-10-01: bring the contacts on the phone in his hand into the
-- PoeTech App — all of them, or the ones he picks — kept there and usable.
-- Until now the app's address book (lib/saved-contacts.js) lived in one
-- browser's localStorage on one phone: lose the phone, lose the list. This
-- table is the keeper. The device list stays the offline cache.
--
-- WHO MAY SEE A ROW: its owner, and nobody else. A person's address book is
-- theirs (DR-0231: contact info is a first-class record the member keeps;
-- DR-0342: nobody can enumerate other people's records). Sharing a contact with
-- the household is a later, explicit choice, not a default, so there is no
-- instance_id here and no member-read policy. No anon policy: never public.
--
-- ONE ROW PER (owner, contact key): the key is the same deterministic key the
-- device list uses (email, else phone digits, else name), so bringing the same
-- file in twice UPDATES instead of duplicating.
--
-- matched_user is a HINT the app wrote ("already on PoeTech"), never a merge:
-- the row stays the owner's contact, the person stays their own account.
--
-- DEPENDS ON: auth.users only. Self-contained touch trigger (no reliance on
-- 0011/0023's shared function) so the CI smoke applies it on a bare PostgreSQL.
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_key   text NOT NULL,
  name          text NOT NULL DEFAULT '',
  phones        text[] NOT NULL DEFAULT '{}',
  emails        text[] NOT NULL DEFAULT '{}',
  addresses     text[] NOT NULL DEFAULT '{}',
  org           text NOT NULL DEFAULT '',
  note          text NOT NULL DEFAULT '',
  source        text NOT NULL DEFAULT 'file' CHECK (source IN ('picker','file','manual')),
  matched_user  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  CONSTRAINT contacts_key_not_blank CHECK (length(trim(contact_key)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_owner_key_uniq ON public.contacts(owner_id, contact_key);
CREATE INDEX IF NOT EXISTS contacts_owner_idx ON public.contacts(owner_id);

CREATE OR REPLACE FUNCTION public.contacts_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contacts_touch_updated ON public.contacts;
CREATE TRIGGER contacts_touch_updated
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.contacts_touch_updated_at();

-- The grant reaches the table; RLS decides the rows. Nothing for anon.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_owner_read   ON public.contacts;
DROP POLICY IF EXISTS contacts_owner_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_owner_update ON public.contacts;
DROP POLICY IF EXISTS contacts_owner_delete ON public.contacts;

CREATE POLICY contacts_owner_read ON public.contacts FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

CREATE POLICY contacts_owner_insert ON public.contacts FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY contacts_owner_update ON public.contacts FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY contacts_owner_delete ON public.contacts FOR DELETE
  TO authenticated USING (owner_id = auth.uid());
