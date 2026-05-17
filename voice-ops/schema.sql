-- PoeTech Voice Ops Phase 1 · D1 Schema
-- Apply with: npm run db:apply:remote

CREATE TABLE IF NOT EXISTS inbound_calls (
  id                       TEXT PRIMARY KEY,             -- Twilio CallSid
  line                     TEXT NOT NULL,                -- 'poe-properties' | 'poetech'
  caller_number            TEXT,
  caller_city              TEXT,
  caller_state             TEXT,
  recording_url            TEXT,                          -- Twilio's URL
  recording_r2_key         TEXT,                          -- our R2 archived key
  recording_duration_sec   INTEGER,
  transcript               TEXT,
  transcript_status        TEXT,                          -- 'completed' | 'failed' | 'in-progress'
  received_at              TEXT NOT NULL,                 -- ISO timestamp
  status                   TEXT NOT NULL DEFAULT 'new',   -- 'new' | 'reviewed' | 'converted' | 'archived'
  status_updated_at        TEXT,
  converted_to             TEXT,                          -- 'incident' | 'inquiry' | 'project'
  converted_record_id      TEXT,                          -- ID of the record created in the PWA
  notes                    TEXT                           -- free-form follow-up notes
);

CREATE INDEX IF NOT EXISTS idx_inbound_line     ON inbound_calls(line);
CREATE INDEX IF NOT EXISTS idx_inbound_status   ON inbound_calls(status);
CREATE INDEX IF NOT EXISTS idx_inbound_received ON inbound_calls(received_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT NOT NULL,
  actor        TEXT NOT NULL,             -- 'twilio' | 'pwa' | 'worker' | 'system'
  action       TEXT NOT NULL,             -- 'recording-complete' | 'transcription-complete' | 'status-updated' | ...
  call_id      TEXT,
  payload      TEXT                       -- JSON snapshot
);

CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);
