-- =============================================================================
-- 0162 — the commercial event rate card the whole team can edit and discuss
-- =============================================================================
-- Christina, Director of Ministries for The Love Corner (The Church of the
-- Living God, Champaign, Illinois), 2026-08-30, submitting the "Commercial
-- Event Facility Rental Proposal" — the first real dollar rates this platform
-- has ever carried for the church's spaces. Then, in the same conversation:
--
--   "this will need to be able to be updated based on what the whole team and
--    staff would like to see, however it's a great opportunity for default
--    settings to be able to be discussed with the MVP in your account...
--    inside the Love Corner App."
--
-- So this migration does NOT freeze her numbers into the database. It builds
-- the place the team works them:
--
--   1. venue_bookings.event_type gains 'commercial' — a revenue-generating
--      event is its own type because it carries its own rate card, its own
--      staffing, and its own payment schedule, none of which apply to a
--      funeral or a church gathering.
--   2. venue_bookings.quote_detail (jsonb) — the quote INPUTS per booking
--      (hours, sound/security headcount and hours, which fees apply). Only the
--      inputs: totals are recomputed from the live rate card on every read, so
--      a quote can never go stale against a rate the team later changed.
--   3. venue_rate_cards — ONE row per instance holding only what the team has
--      CHANGED. Every untouched field falls through to the committed defaults
--      in app/src/lib/venue-commercial-rates.js (Christina's proposal). An
--      override row can therefore never blank out a rate by omission.
--   4. venue_rate_card_notes — the discussion itself, in the app, on the
--      record: append-only, staff-only, speaker stamped by the server. This is
--      the "discussed inside the Love Corner App" half of her ask, and it means
--      the reasoning behind an agreed rate outlives whoever typed it.
--
-- STATUS IS DATA, NOT CODE. Her document closes "Proposed rates and terms are
-- subject to approval," so the card starts at 'proposed' and only a staff
-- action moves it to 'under-review' or 'approved'. Surfaces render the status
-- beside the numbers — a proposal shown as a settled price would be a painted
-- number on a trust surface (DR-0076 / the reality-trace rule).
--
-- PRICING STAYS PRIVATE. Both new tables are owner/admin-only in BOTH
-- directions, matching venue_bookings: the community front door has never
-- shown a price and still doesn't. RLS is the real gate; the UI only agrees
-- with it (DR-0074).
--
-- DEPENDS ON: venue_bookings (+ 0146/0149 event-type CHECK lineage).
-- IDEMPOTENT: IF NOT EXISTS / OR REPLACE / DROP-then-CREATE policies.
-- =============================================================================

-- 1. 'commercial' joins the event vocabulary. Supersedes the 0149 CHECK; the
--    replay order keeps this one last.
ALTER TABLE venue_bookings DROP CONSTRAINT IF EXISTS venue_bookings_event_type_check;
ALTER TABLE venue_bookings ADD CONSTRAINT venue_bookings_event_type_check
  CHECK (event_type IN ('sunday-service','wednesday-service','funeral','wedding',
                        'concert','conference','community','commercial'));

-- 2. The per-booking quote inputs. Staff-only like every other internal column
--    (the whole table is owner/admin-read), and NOT exposed by my_venue_requests().
ALTER TABLE venue_bookings ADD COLUMN IF NOT EXISTS quote_detail jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. The team's rate card — one row per instance, holding only their edits.
CREATE TABLE IF NOT EXISTS venue_rate_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  -- Only the fields the team changed. Everything absent falls through to the
  -- committed defaults, so this can never blank a rate out by omission.
  values        jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Term-text overrides, keyed by term id; the definition paragraph likewise.
  terms         jsonb NOT NULL DEFAULT '{}'::jsonb,
  definition    text,
  status        text NOT NULL DEFAULT 'proposed'
                  CHECK (status IN ('proposed','under-review','approved')),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES auth.users(id),
  updated_by_email text
);
CREATE UNIQUE INDEX IF NOT EXISTS venue_rate_cards_instance_uniq
  ON venue_rate_cards(instance_id);

-- 4. The discussion, on the record. Append-only: no UPDATE, no DELETE policy,
--    so the reasoning behind an agreed rate survives people moving on.
CREATE TABLE IF NOT EXISTS venue_rate_card_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  author       uuid REFERENCES auth.users(id),
  author_email text,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_rate_card_notes_instance_idx
  ON venue_rate_card_notes(instance_id, created_at);

-- 5. The server decides which instance a row belongs to and who wrote it — the
--    client's claim is overwritten every time. The rate card lives with the
--    bookings it prices, so it resolves to the same church instance they do.
CREATE OR REPLACE FUNCTION public.venue_rate_card_stamp()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.instance_id      := (SELECT id FROM instances WHERE slug = 'colg');
  NEW.updated_at       := now();
  NEW.updated_by       := auth.uid();
  NEW.updated_by_email := auth.jwt() ->> 'email';
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS venue_rate_card_stamp_t ON venue_rate_cards;
CREATE TRIGGER venue_rate_card_stamp_t
  BEFORE INSERT OR UPDATE ON venue_rate_cards
  FOR EACH ROW EXECUTE FUNCTION public.venue_rate_card_stamp();

CREATE OR REPLACE FUNCTION public.venue_rate_card_note_stamp()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  NEW.instance_id  := (SELECT id FROM instances WHERE slug = 'colg');
  NEW.author       := auth.uid();
  NEW.author_email := auth.jwt() ->> 'email';
  NEW.created_at   := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS venue_rate_card_note_stamp_t ON venue_rate_card_notes;
CREATE TRIGGER venue_rate_card_note_stamp_t
  BEFORE INSERT ON venue_rate_card_notes
  FOR EACH ROW EXECUTE FUNCTION public.venue_rate_card_note_stamp();

-- 6. RLS — owner/admin ONLY, both directions. Pricing is never public.
ALTER TABLE venue_rate_cards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_rate_card_notes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON venue_rate_cards TO authenticated;
GRANT SELECT, INSERT ON venue_rate_card_notes TO authenticated;

DROP POLICY IF EXISTS venue_rate_cards_read   ON venue_rate_cards;
DROP POLICY IF EXISTS venue_rate_cards_write  ON venue_rate_cards;
DROP POLICY IF EXISTS venue_rate_cards_update ON venue_rate_cards;
CREATE POLICY venue_rate_cards_read ON venue_rate_cards FOR SELECT
  TO authenticated
  USING (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin'));
-- INSERT is checked against the instance the trigger will stamp, not a client value.
CREATE POLICY venue_rate_cards_write ON venue_rate_cards FOR INSERT
  TO authenticated
  WITH CHECK (coalesce(user_role_in_instance((SELECT id FROM instances WHERE slug = 'colg')), '') IN ('owner','admin'));
CREATE POLICY venue_rate_cards_update ON venue_rate_cards FOR UPDATE
  TO authenticated
  USING (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin'));
-- No DELETE policy: the card is edited or reset to defaults, never dropped.

DROP POLICY IF EXISTS venue_rate_card_notes_read  ON venue_rate_card_notes;
DROP POLICY IF EXISTS venue_rate_card_notes_write ON venue_rate_card_notes;
CREATE POLICY venue_rate_card_notes_read ON venue_rate_card_notes FOR SELECT
  TO authenticated
  USING (coalesce(user_role_in_instance(instance_id), '') IN ('owner','admin'));
CREATE POLICY venue_rate_card_notes_write ON venue_rate_card_notes FOR INSERT
  TO authenticated
  WITH CHECK (coalesce(user_role_in_instance((SELECT id FROM instances WHERE slug = 'colg')), '') IN ('owner','admin'));
-- No UPDATE / DELETE policies: the discussion is append-only.

-- 7. Realtime, so an edit or a note lands on every staff device at once.
DO $realtime$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'venue_rate_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_rate_cards;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
       AND tablename = 'venue_rate_card_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE venue_rate_card_notes;
  END IF;
END $realtime$;

-- 8. Re-run the standing overlays over the two NEW instance-scoped tables.
--    DR-0059 / DR-0241: a viewer must never gain write on a table just because
--    it shipped later, and an assistant-scoped member must never see the church
--    back office at all. The rate card is money — exactly the class both
--    overlays exist to keep inside owner/admin. Both are idempotent by design,
--    so re-running them here costs nothing and closes the gap deterministically
--    (this is the gate the tenancy and assistant-scope guards enforce in CI).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

NOTIFY pgrst, 'reload schema';
