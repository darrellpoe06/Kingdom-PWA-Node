-- =============================================================================
-- 0122 — member_stewardship: position, status, and the qualitative record
-- =============================================================================
-- Declared by Darrell 2026-07-27: "I want to be able to edit each member of
-- the app position and inspect them to be sure of their services and status so
-- qualitative information can help us keep track of satisfaction."
--
-- APPEND-ONLY observations (the engagement-guard receipt pattern): each row is
-- one steward observation of one member — their ministry position/title at
-- that moment, their status, a satisfaction read, and the qualitative note.
-- The member's CURRENT position/status is simply the newest row; the history
-- IS the satisfaction track. QUALITY-OF-LIFE holds: this is a mirror the
-- stewards hold for care, never a judge — reads are leader-only (pastoral
-- record), and the vocabulary is care-shaped (thriving/steady/strained/
-- hurting), not a score.
--
-- IDEMPOTENT: IF NOT EXISTS / OR REPLACE. Depends only on instances (0001+).
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_stewardship (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  member_user_id  uuid NOT NULL,
  position        text,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('new','active','away','stepping-back','inactive')),
  satisfaction    text CHECK (satisfaction IS NULL OR satisfaction IN ('thriving','steady','strained','hurting')),
  note            text,
  recorded_by     uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_stewardship_member_idx
  ON member_stewardship(instance_id, member_user_id, created_at DESC);

ALTER TABLE member_stewardship ENABLE ROW LEVEL SECURITY;

-- Leader-only, both directions: the observations are a pastoral record.
DROP POLICY IF EXISTS member_stewardship_read   ON member_stewardship;
DROP POLICY IF EXISTS member_stewardship_insert ON member_stewardship;
DROP POLICY IF EXISTS member_stewardship_delete ON member_stewardship;
CREATE POLICY member_stewardship_read ON member_stewardship FOR SELECT
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
CREATE POLICY member_stewardship_insert ON member_stewardship FOR INSERT
  WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin') AND recorded_by = auth.uid());
-- Delete only to correct a mistaken entry, and only by a leader; no UPDATE
-- policy at all — observations are never silently rewritten.
CREATE POLICY member_stewardship_delete ON member_stewardship FOR DELETE
  USING (user_role_in_instance(instance_id) IN ('owner','admin'));
