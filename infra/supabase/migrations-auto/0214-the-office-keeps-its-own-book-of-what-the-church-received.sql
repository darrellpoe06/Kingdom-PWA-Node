-- =============================================================================
-- 0214 — The office keeps its own book of what the church received
-- =============================================================================
-- From the Love Corner planning meeting, 2026-09-11. The steward described the
-- work in her own words: one Cash App transfer lands in the bank covering many
-- people's gifts, and then "the transfer, put it in Excel, then put it in my
-- other report, then create the reports for the end of the month." The statement
-- already itemises who gave, when, how much, and what they wrote in the note.
-- The re-typing is the whole problem, and it is the part a machine should do.
--
-- WHY THIS IS A NEW TABLE AND NOT A WIDENED POLICY -- read this before changing
-- anything below. Two standing walls already govern giving in this system, and
-- this migration is written to sit BETWEEN them rather than breach either one:
--
--   * 0184 (giving_records) is the GIVER'S OWN LEDGER and is owner-only on
--     purpose: "An instance admin CANNOT read these rows." That migration also
--     anticipated this one in as many words -- "If the church office ever needs
--     an aggregate, that is a separate, consented, decided surface -- never a
--     widening of this policy," and "The church's official contribution
--     statement comes from the church office's own books." This IS that
--     separate surface. 0184's policy is NOT touched here, and nothing in this
--     file reads it. A member's private ledger and the office's book are two
--     records of possibly the same gift, kept by two different parties, and
--     they are never merged, reconciled against each other, or cross-read.
--
--   * 0209 (church_member_records) refuses to carry a giving amount BY
--     CONSTRUCTION, because "a church knowing what each person gives is the
--     oldest way a congregation gets quietly sorted." That refusal stands
--     exactly as written. The danger 0209 names is giving appearing on the
--     PASTORAL ROLL -- the record a staff member opens while deciding how to
--     treat somebody. So the wall this file adds is not about who may read the
--     book; it is about where the book may APPEAR: the contribution book is
--     never joined to the member record and never rendered on a member's page.
--     A source gate in the test suite fails the build if that join is ever
--     written, because a comment cannot stop a future edit and a test can.
--
-- WHY THE OFFICE MAY HOLD THIS AT ALL. A congregation that issues a year-end
-- contribution statement must know who gave what; there is no way to hand
-- somebody a statement of their giving without a record of their giving. The
-- treasurer already holds this exact data -- it is printed on the Cash App
-- statement in her hand. This table does not create an exposure; it replaces a
-- spreadsheet on one laptop with a tenant-scoped, RLS-gated, audited row.
--
-- READ ACCESS IS THE OFFICE, AND ONLY THE OFFICE: ('owner','admin'). There is
-- deliberately NO member policy -- not even for a member's own claims. A member
-- reading their own row sounds harmless and is not: a policy shaped
-- "parishioner_user_id = auth.uid()" is one careless OR away from exposing the
-- congregation to itself, and the member already has their own ledger in 0184.
-- Giving the member a confirmed view of what the office recorded for them is a
-- real and good idea, and it is a DECIDED surface with its own policy when we
-- get there, not an afterthought bolted onto this one. re-review: 2026-12-12.
--
-- THE NAME ON THE STATEMENT IS THE IDENTITY. parishioner_user_id is NULLABLE
-- and always optional. Most Cash App givers have no account in this app and
-- never will -- a visitor, a neighbour, somebody's cousin -- and an import that
-- could only represent people with logins would silently drop real money from
-- the church's own books. So giver_name is NOT NULL and permanent, "not yet
-- identified" is a first-class state rather than an error, and the account link
-- is an extra the steward CONFIRMS by hand. Nothing in this system ever
-- auto-assigns a gift to a person: a wrong guess here puts one member's money
-- on another member's contribution statement.
--
-- MONEY IS NEVER A FLOAT. numeric(12,2) throughout, matching 0184. Amounts may
-- be negative on a refund row, so there is no CHECK (> 0) here as there is on
-- 0184 -- a refund is part of an honest book. Fees are stored as their own
-- column rather than folded into the amount, because a giver's statement must
-- show what THEY gave, while the church's reconciliation must show what
-- ARRIVED, and those two numbers differ by the processor's cut.
--
-- RE-IMPORTING THE SAME STATEMENT CANNOT DOUBLE-COUNT. source_ref carries the
-- processor's own transaction id and is UNIQUE per instance. A steward who
-- uploads September twice gets the same book, not double the money. This is the
-- single most important integrity property in the file and it is tested.
--
-- DEPENDS ON: schema-v2.1-infra (instances), 0011/0023 (engagement_touch_updated_at).
-- IDEMPOTENT: CREATE ... IF NOT EXISTS, DROP-then-CREATE policies/triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE BATCH -- one deposit the church received, covering many gifts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_giving_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  slug              text NOT NULL,                 -- client-stable id (offline-safe upsert key)
  source            text NOT NULL DEFAULT 'cashapp',
  payout_ref        text NOT NULL DEFAULT '',      -- the processor's id for the transfer itself
  payout_on         date,                          -- the day the money reached the bank
  service_date      date,                          -- the Sunday the office counts it to
  deposit_amount    numeric(12,2),                 -- what the BANK shows; NULL until the steward enters it
  gifts_gross       numeric(12,2) NOT NULL DEFAULT 0,
  fees_total        numeric(12,2) NOT NULL DEFAULT 0,
  gifts_net         numeric(12,2) NOT NULL DEFAULT 0,
  claim_count       integer NOT NULL DEFAULT 0 CHECK (claim_count >= 0),
  note              text NOT NULL DEFAULT '',
  imported_by       uuid NOT NULL REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz,
  updated_by        uuid REFERENCES auth.users(id),
  CONSTRAINT church_giving_batches_slug_uniq UNIQUE (instance_id, slug)
);

CREATE INDEX IF NOT EXISTS church_giving_batches_instance_idx
  ON public.church_giving_batches(instance_id, payout_on DESC);

-- ---------------------------------------------------------------------------
-- 2. THE CLAIM -- one person's gift inside that deposit
-- ---------------------------------------------------------------------------
-- "Claim" rather than "gift" on purpose: this row is the office's claim about
-- what it believes it received from whom, carrying its own provenance. The
-- giver's own account of the same gift lives in 0184 and outranks nothing here
-- and is outranked by nothing here. Two books, two keepers.
CREATE TABLE IF NOT EXISTS public.church_giving_claims (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  batch_id             uuid REFERENCES public.church_giving_batches(id) ON DELETE CASCADE,
  slug                 text NOT NULL,
  giver_name           text NOT NULL,              -- EXACTLY as the statement printed it; never rewritten
  parishioner_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  match_basis          text NOT NULL DEFAULT 'none',   -- how the link was proposed (provenance, not proof)
  match_confirmed_by   uuid REFERENCES auth.users(id), -- a HUMAN confirmed it; NULL means nobody did
  match_confirmed_at   timestamptz,
  given_at             timestamptz NOT NULL,       -- date AND time; the meeting asked for both
  amount               numeric(12,2) NOT NULL,     -- what the giver gave (may be negative on a refund)
  fee                  numeric(12,2) NOT NULL DEFAULT 0,
  net                  numeric(12,2) NOT NULL DEFAULT 0,  -- what actually arrived
  fund                 text NOT NULL DEFAULT 'offering',
  kind                 text NOT NULL DEFAULT 'gift',
  note                 text NOT NULL DEFAULT '',   -- the giver's own note on the transfer
  source               text NOT NULL DEFAULT 'cashapp',
  source_ref           text NOT NULL,              -- the processor's transaction id -- the dedupe key
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  updated_by           uuid REFERENCES auth.users(id),
  CONSTRAINT church_giving_claims_slug_uniq UNIQUE (instance_id, slug),
  -- The double-count wall. Re-importing a statement re-visits the same rows.
  CONSTRAINT church_giving_claims_source_uniq UNIQUE (instance_id, source, source_ref),
  -- A confirmed match must say WHO confirmed it. An unattributed link to a
  -- person's money is exactly the thing that must never appear by accident.
  CONSTRAINT church_giving_claims_confirmed_chk CHECK (
    parishioner_user_id IS NULL OR match_confirmed_by IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS church_giving_claims_instance_date_idx
  ON public.church_giving_claims(instance_id, given_at DESC);
CREATE INDEX IF NOT EXISTS church_giving_claims_batch_idx
  ON public.church_giving_claims(batch_id);
CREATE INDEX IF NOT EXISTS church_giving_claims_person_idx
  ON public.church_giving_claims(instance_id, parishioner_user_id);

-- ---------------------------------------------------------------------------
-- 3. THE ALIAS -- the steward's confirmed memory of a name
-- ---------------------------------------------------------------------------
-- Cash App shows a display name, which is often not the name on the roll
-- ("Bee", "$cashtag", a maiden name). Once the steward says who that is, the
-- system should not ask again next month. This table is that memory, and it is
-- the office's, not the matcher's: the code proposes, a person decides, and
-- only a decided answer is ever written here.
CREATE TABLE IF NOT EXISTS public.church_giving_aliases (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  statement_name       text NOT NULL,              -- normalized by lib/giving-donor-match.js
  parishioner_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         text NOT NULL DEFAULT '',   -- who the steward says this is, in her words
  confirmed_by         uuid NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT church_giving_aliases_name_uniq UNIQUE (instance_id, statement_name)
);

-- ---------------------------------------------------------------------------
-- 4. TOUCH TRIGGERS
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS church_giving_batches_touch_updated ON public.church_giving_batches;
CREATE TRIGGER church_giving_batches_touch_updated
  BEFORE UPDATE ON public.church_giving_batches
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

DROP TRIGGER IF EXISTS church_giving_claims_touch_updated ON public.church_giving_claims;
CREATE TRIGGER church_giving_claims_touch_updated
  BEFORE UPDATE ON public.church_giving_claims
  FOR EACH ROW EXECUTE FUNCTION public.engagement_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. GRANTS + RLS -- the office, and only the office
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_giving_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_giving_claims  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_giving_aliases TO authenticated;

ALTER TABLE public.church_giving_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_giving_claims  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_giving_aliases ENABLE ROW LEVEL SECURITY;

-- One policy per table, FOR ALL, office-only. No member clause exists to be
-- widened by accident, and no anon grant exists at all.
DROP POLICY IF EXISTS church_giving_batches_office ON public.church_giving_batches;
CREATE POLICY church_giving_batches_office ON public.church_giving_batches
  FOR ALL TO authenticated
  USING      (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

DROP POLICY IF EXISTS church_giving_claims_office ON public.church_giving_claims;
CREATE POLICY church_giving_claims_office ON public.church_giving_claims
  FOR ALL TO authenticated
  USING      (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

DROP POLICY IF EXISTS church_giving_aliases_office ON public.church_giving_aliases;
CREATE POLICY church_giving_aliases_office ON public.church_giving_aliases
  FOR ALL TO authenticated
  USING      (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'))
  WITH CHECK (coalesce(public.user_role_in_instance(instance_id), '') IN ('owner','admin'));

-- The standing overlays, re-run for the new tables (DR-0059 / DR-0241). Without
-- this the tenancy and assistant-scope gates fail the build, and rightly: an
-- assistant that could read the congregation's giving is precisely the exposure
-- the walls above exist to prevent.
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- ---------------------------------------------------------------------------
-- 6. REALTIME
-- ---------------------------------------------------------------------------
DO $realtime$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY ARRAY['church_giving_batches','church_giving_claims','church_giving_aliases']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $realtime$;

NOTIFY pgrst, 'reload schema';
