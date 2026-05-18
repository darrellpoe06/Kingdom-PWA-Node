-- =============================================================================
-- Cloudflare D1 — PoeTech Voice Ops schema (v1)
-- Stores inbound voicemails routed from Twilio Studio. Source of truth for the
-- PWA's 📞 Inbound tab until the user converts each row into an incident /
-- inquiry / project. Row marked `handled` once converted; kept for audit.
-- HIPAA-restricted lines (TLC) are NOT routed here — separate Phase 3 stack.
-- =============================================================================

CREATE TABLE IF NOT EXISTS inbound_calls (
  -- identity
  id                TEXT PRIMARY KEY,                  -- 'ic-<timestamp>-<rand>'
  twilio_call_sid   TEXT UNIQUE NOT NULL,              -- raw Twilio CallSid for dedup
  twilio_rec_sid    TEXT,                              -- RecordingSid (if voicemail captured)

  -- routing
  line              TEXT NOT NULL,                     -- 'poe-properties' | 'poetech'
  caller            TEXT,                              -- E.164 caller number
  caller_name       TEXT,                              -- from Twilio caller-name lookup (optional)
  called_number     TEXT,                              -- the business line that was dialed

  -- payload
  voicemail_url     TEXT,                              -- Twilio recording URL (auth required for fetch)
  voicemail_dur_sec INTEGER,                           -- recording duration
  transcript        TEXT,                              -- Twilio's auto-transcript
  transcript_conf   REAL,                              -- 0–1 confidence (optional)

  -- workflow
  status            TEXT NOT NULL DEFAULT 'new',       -- 'new' | 'handled' | 'archived'
  handled_at        TEXT,                              -- ISO timestamp when PWA converted it
  handled_as        TEXT,                              -- 'incident' | 'inquiry' | 'project' | 'discarded'
  handled_note      TEXT,                              -- free text note from user at conversion

  -- bookkeeping
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  webhook_payload   TEXT                               -- raw form-encoded body for debug, optional
);

CREATE INDEX IF NOT EXISTS idx_inbound_status_line ON inbound_calls(status, line);
CREATE INDEX IF NOT EXISTS idx_inbound_created    ON inbound_calls(created_at DESC);

-- Monthly usage metering — the PWA reads this to surface the Voice Ops cost panel.
-- Worker bumps these counters every time a webhook lands; the PWA divides by the
-- per-minute Twilio rates to compute an estimated cost.
CREATE TABLE IF NOT EXISTS usage_monthly (
  year_month        TEXT PRIMARY KEY,                  -- 'YYYY-MM'
  call_count        INTEGER NOT NULL DEFAULT 0,
  total_minutes     REAL    NOT NULL DEFAULT 0,
  transcript_min    REAL    NOT NULL DEFAULT 0,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
