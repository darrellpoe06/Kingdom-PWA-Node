-- ===========================================================================
-- 0171 — Web Push subscriptions, an HONEST live signal, and a send ledger
-- ===========================================================================
-- ── WHY THIS IS 0171 AND NOT 0170 (2026-09-06, same-day correction) ────────
-- It shipped as 0170 and the db-migrate lane reported:
--
--   ERROR: ordinal 0170 already used by
--          0170-courses-a-lesson-belongs-to-a-course.sql
--          — pick the next free number
--
-- That file is NOT in this repository — `git log --all --diff-filter=A` finds
-- zero additions of it anywhere in history — so an 0170 was applied to the
-- database from outside main. This is the SECOND instance today of the class
-- 0169 documents in its own header (it hit 0168 the same way hours earlier),
-- and the consequence is exactly what 0169 records: the DDL below RAN AND
-- COMMITTED, so the three tables and the overlay redefinition exist in the
-- database, but the LEDGER INSERT was rejected. That leaves the migration
-- unrecorded and harmlessly re-applied on every subsequent run. Renumbering is
-- the whole fix, and it creates NO orphan ledger row here precisely because
-- the 0170 insert never succeeded (contrast DR-0332, where a rename of an
-- APPLIED file did leave one).
--
-- A SHARPER FINDING THAN THE RENAME, worth more than this file: the ordinal
-- ERROR did not fail the job. `--- summary: applied=2 skipped=180 failed=0 ---`
-- was printed in the same run, and db-migrate #454 went green on this very
-- commit while this migration sat unrecorded. So the lane can report success
-- over an unrecorded migration — a proxy for truth standing where the truth
-- was available, which is the DR-0332 shape again in a different instrument.
-- Raised for a gate rather than fixed here; this file's job is to apply.
--
-- THE HONEST LIMIT (DR-0076 §8): 0171 is the next ordinal free *in this repo*.
-- Nothing in this checkout can enumerate the database's ledger — the sandbox
-- has neither database credentials nor a route to the NAS — so whatever
-- supplied that 0170 may also have supplied an 0171. If so the guard rejects
-- this the same way and names the conflict, which is a cheap, self-correcting
-- failure rather than a silent one.
-- ===========================================================================
-- Darrell, 2026-09-06: "My phone didn't notify me of the livestream inside the
-- Love Corner App... why not... fix that so users are prompted the sermon is
-- live... and also to notifications from users who text us."
--
-- THE MEASURED ANSWER TO "WHY NOT" WAS: NOTHING WAS EVER BUILT.
--   * app/public/sw.js had FOUR listeners (install, activate, message, fetch)
--     and NO `push` handler and NO `notificationclick` handler.
--   * No pushManager.subscribe call, no VAPID key, no push_subscriptions table,
--     and no sender anywhere — not a Pages Function, not the NAS, not n8n.
--   * Every notification the app could raise was a FOREGROUND
--     `new Notification()` that requires the tab to still be open
--     (app/src/lib/dm-notify.js, app/src/poe-financial-mvp-v28.jsx).
--   * And there was no real live DETECTION either: app/src/lib/church-live.js
--     computes `live` from a hardcoded weekly schedule window (-20/+210 min
--     around Sun 11:00, Wed 13:00, Wed 18:00) and never asks whether a stream
--     actually started. The repo documented both gaps itself — DR-0231 §P3 and
--     the 2026-07-27 messaging review ("sw.js has zero push handlers; no
--     push_subscriptions, no VAPID... the single biggest 'intuitive' gap").
-- So a closed phone could not be notified, and there was no event to notify on.
-- This migration is the data half of closing both.
--
-- THE HONESTY RULE THAT SHAPES church_live_state (DR-0076, Reality-Trace P15):
-- we do NOT guess that a service is live and push on the guess. A schedule
-- window is a hint for the UI, never a notification trigger — pushing "we're
-- live" at 11:00 on a Sunday the stream never started is a fabricated state
-- delivered to a phone, which is worse than silence. This table holds the
-- AUTHORITATIVE signal only: the church itself saying it went live, set by a
-- director action or the NAS go-live pipeline. Real state, from a real actor.
--
-- TENANCY (DR-0060): all three tables below are instance-scoped and every one
-- ENABLEs ROW LEVEL SECURITY in this same file, which is what the tenancy guard
-- requires. Endpoints are capability URLs — a cross-tenant read of this table
-- would hand someone the ability to buzz another congregation's phones.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. PUSH SUBSCRIPTIONS — one row per browser/device that opted in
-- ---------------------------------------------------------------------------
-- `endpoint`, `p256dh` and `auth` come verbatim from the browser's
-- PushManager.subscribe(). The keys are the SUBSCRIBER's — the payload is
-- encrypted to them (RFC 8291), so the push service relays a blob it cannot
-- read. That is the sovereignty property: Google/Mozilla/Apple carry the
-- envelope and never see a prayer request or a sermon alert.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint       text NOT NULL,
  p256dh         text NOT NULL,
  auth           text NOT NULL,
  -- Per-topic OPT-IN. Absent a topic here, this device is NOT notified for it.
  -- Opt-in is per DR-0231's standing requirement; there is no implicit consent.
  topics         text[] NOT NULL DEFAULT ARRAY['live','message']::text[],
  user_agent     text,
  label          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  -- Delivery health. A push service answering 404/410 means the subscription is
  -- gone for good and the row is pruned; transient failures only count up.
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count  integer NOT NULL DEFAULT 0,
  disabled_at    timestamptz,
  disabled_reason text
);

-- The endpoint IS the device identity; re-subscribing must update, not duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key
  ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON push_subscriptions(instance_id, user_id) WHERE disabled_at IS NULL;
-- The sender's hot path: everyone opted in to a topic, still enabled.
CREATE INDEX IF NOT EXISTS push_subscriptions_topics_idx
  ON push_subscriptions USING GIN (topics) WHERE disabled_at IS NULL;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A person sees ONLY their own devices. Nobody enumerates the congregation's
-- endpoints — an endpoint is a capability URL, and a leaked one is spammable.
DROP POLICY IF EXISTS push_subscriptions_read ON push_subscriptions;
CREATE POLICY push_subscriptions_read ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_insert ON push_subscriptions;
CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_update ON push_subscriptions;
CREATE POLICY push_subscriptions_update ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Turning notifications off must always work, from the device that turned
-- them on. This is the user's own kill-switch and it is deliberately simple.
DROP POLICY IF EXISTS push_subscriptions_delete ON push_subscriptions;
CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE: the sender reads across all rows with the SERVICE ROLE, which bypasses
-- RLS by design. That key lives only in the Pages Function environment and is
-- never shipped to a client — the same posture as every other server-side path
-- in this repo.

-- ---------------------------------------------------------------------------
-- 2. THE LIVE SIGNAL — church_live_state (authoritative, never inferred)
-- ---------------------------------------------------------------------------
-- One row per church. `is_live` is TRUE only because someone with authority
-- said so. `source` records WHO said it, so a surface can always answer "how do
-- we know?" — which is the question a painted badge cannot answer.
CREATE TABLE IF NOT EXISTS church_live_state (
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  church_id     text NOT NULL,
  is_live       boolean NOT NULL DEFAULT false,
  video_id      text,
  title         text,
  service_label text,
  started_at    timestamptz,
  ended_at      timestamptz,
  -- 'director'  — a person pressed Go Live in the app
  -- 'nas'       — the church-media go-live pipeline reported it
  -- 'api'       — a verified upstream said so (no such source today)
  source        text NOT NULL DEFAULT 'director'
                CHECK (source IN ('director','nas','api')),
  announced_by  uuid REFERENCES auth.users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, church_id)
);

ALTER TABLE church_live_state ENABLE ROW LEVEL SECURITY;

-- Anyone signed in may READ whether their church is live; it is public-facing
-- information the moment it is true.
DROP POLICY IF EXISTS church_live_state_read ON church_live_state;
CREATE POLICY church_live_state_read ON church_live_state FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only a person on the church roster may DECLARE it. Announcing a service to
-- every phone in the congregation is an outward-facing act, so it is gated on
-- the same roster check the rest of the church surfaces use.
DROP POLICY IF EXISTS church_live_state_write ON church_live_state;
CREATE POLICY church_live_state_write ON church_live_state FOR ALL
  USING (user_on_any_roster(instance_id, auth.uid()))
  WITH CHECK (user_on_any_roster(instance_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. THE SEND LEDGER — push_sends (dedupe + a real record of what went out)
-- ---------------------------------------------------------------------------
-- Two jobs. First, DEDUPE: `dedupe_key` is unique, so a second attempt to
-- announce the same go-live — a double click, a retried webhook, a pipeline
-- that fires twice — cannot buzz the congregation twice. That is the
-- concurrency lock of the three-brakes rule applied to notifications, where a
-- duplicate is not merely waste but a nuisance in someone's pocket.
-- Second, OBSERVABILITY: what was sent, to how many devices, how many failed.
-- Without it "did the notification go out?" has no measured answer, which is
-- the exact hole this whole change exists to close.
CREATE TABLE IF NOT EXISTS push_sends (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  topic        text NOT NULL,
  dedupe_key   text NOT NULL,
  title        text NOT NULL,
  body         text,
  url          text,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  sent_by      uuid REFERENCES auth.users(id),
  device_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  pruned_count integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS push_sends_dedupe_key
  ON push_sends(instance_id, dedupe_key);
CREATE INDEX IF NOT EXISTS push_sends_recent_idx
  ON push_sends(instance_id, sent_at DESC);

ALTER TABLE push_sends ENABLE ROW LEVEL SECURITY;

-- Readable by the roster (it is an ops record of what the church sent);
-- written only by the sender under the service role.
DROP POLICY IF EXISTS push_sends_read ON push_sends;
CREATE POLICY push_sends_read ON push_sends FOR SELECT
  USING (user_on_any_roster(instance_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. VIEWER READ-ONLY OVERLAY (DR-0241) — re-run, and extended by exactly one
-- ---------------------------------------------------------------------------
-- The tenancy guard's Check E requires every migration that creates an
-- instance-scoped table to re-run the overlay, so a read-only guest cannot
-- write a table nobody remembered to think about. Two of the three tables here
-- take that deny-overlay and should: a viewer must NOT declare a service live
-- (that buzzes every phone in the congregation) and must NOT write the send
-- ledger.
--
-- `push_subscriptions` is the exception, and it is a deliberate, visible one
-- rather than a silent omission. It is a SELF-SCOPED PARTICIPATION table in
-- exactly the sense the overlay already recognises for `user_instance_settings`
-- and `direct_messages`: the only rows a person can touch are their own
-- (`auth.uid() = user_id`, enforced above). Denying a viewer write access here
-- would mean a guest could never turn notifications ON — and, far worse, could
-- never turn them OFF. **Being unable to stop a notification you consented to
-- is not a read-only guarantee, it is a trap.** So the function is redefined
-- with that one name added, every existing exception kept, and both invariants
-- the guard checks (RESTRICTIVE policies, the 'viewer' role test) intact.
CREATE OR REPLACE FUNCTION public.apply_viewer_readonly_overlay()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
  -- Self-scoped participation tables a read-only guest may still write to
  -- (their OWN rows, gated by each table's own self-scoped policies).
  participation text[] := ARRAY[
    'direct_messages',        -- send a DM to a leader (users_can_dm still gates)
    'group_messages',         -- speak in a group they were placed in
    'family_messages',        -- legacy family DM rail (self/recipient-scoped)
    'feedback',               -- a guest may always send feedback
    'usage_events',           -- their own telemetry
    'user_instance_settings', -- their own per-instance settings row
    'push_subscriptions'      -- their own devices: opting IN, and always OUT
  ];
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
      FROM pg_class c
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_attribute a  ON a.attrelid = c.oid
                          AND a.attname = 'instance_id'
                          AND NOT a.attisdropped
     WHERE ns.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relrowsecurity
       AND a.atttypid = 'uuid'::regtype
       AND NOT (c.relname = ANY (participation))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_insert ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_update ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'') '
      || 'WITH CHECK (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_readonly_delete ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY viewer_readonly_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated '
      || 'USING (public.user_role_in_instance(instance_id) IS DISTINCT FROM ''viewer'')', r.tbl);
    n := n + 1;
  END LOOP;
  RETURN n;
END
$$;

SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();
