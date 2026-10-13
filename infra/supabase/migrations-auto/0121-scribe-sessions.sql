-- =============================================================================
-- 0121 — scribe_sessions: Scribe recordings joined to the meeting record
-- =============================================================================
-- DR-0236 (nothing waits — built the same day the capture shipped). A Scribe
-- session (screen workflow or whole-meeting audio, PR #1067) becomes a REAL row:
-- the manifest lands here, the NAS consumer's transcript + minutes attach here,
-- and a 'meeting' session joins its ministry_meetings row (DR-0182) so minutes
-- live ON the meeting, not in a side file. Reality-trace (DR-0061): the Scribe
-- surface reads/writes THIS table; nothing painted.
--
-- CONSENT AT THE SCHEMA (DATA-AS-EMPOWERMENT + 720 ILCS 5/14 posture): the row
-- itself refuses consent-less sessions — the same rule the browser gate and the
-- ingest server enforce, held a third time where the data lives (DR-0076
-- independent verification).
--
-- DEPENDS ON: 0097-ministry-meetings.sql. IDEMPOTENT: IF NOT EXISTS / OR REPLACE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS scribe_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  session_id   text NOT NULL UNIQUE,   -- the capture manifest's id (browser-minted)
  kind         text NOT NULL CHECK (kind IN ('workflow','meeting')),
  meeting_id   uuid REFERENCES ministry_meetings(id) ON DELETE SET NULL,
  seconds      integer NOT NULL DEFAULT 0 CHECK (seconds >= 0 AND seconds <= 10800), -- 180-min ceiling, one truth
  consent      jsonb NOT NULL CHECK (coalesce((consent->>'allConsented')::boolean, false)), -- no consent, no row
  steps        jsonb NOT NULL DEFAULT '[]'::jsonb,
  transcript   jsonb,
  minutes_md   text,
  status       text NOT NULL DEFAULT 'recorded'
               CHECK (status IN ('recorded','queued','transcribed','minuted','failed')),
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scribe_sessions_instance_idx ON scribe_sessions(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scribe_sessions_meeting_idx  ON scribe_sessions(meeting_id) WHERE meeting_id IS NOT NULL;

ALTER TABLE scribe_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scribe_sessions_read   ON scribe_sessions;
DROP POLICY IF EXISTS scribe_sessions_write  ON scribe_sessions;
DROP POLICY IF EXISTS scribe_sessions_update ON scribe_sessions;
DROP POLICY IF EXISTS scribe_sessions_delete ON scribe_sessions;
CREATE POLICY scribe_sessions_read   ON scribe_sessions FOR SELECT USING (user_in_instance(instance_id));
CREATE POLICY scribe_sessions_write  ON scribe_sessions FOR INSERT WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid());
CREATE POLICY scribe_sessions_update ON scribe_sessions FOR UPDATE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR created_by = auth.uid())
  WITH CHECK (user_in_instance(instance_id));
CREATE POLICY scribe_sessions_delete ON scribe_sessions FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin') OR created_by = auth.uid());
