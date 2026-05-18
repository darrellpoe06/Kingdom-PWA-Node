-- =============================================================================
-- 0002 — property_cache table (r27)
--
-- Caches RentCast property-lookup responses for 24 hours so repeated opens of
-- the same property don't burn the free-tier API quota (50 calls / month).
-- Apply: `wrangler d1 execute poetech_voice_ops --file=migrations/0002_property_cache.sql`
-- =============================================================================

CREATE TABLE IF NOT EXISTS property_cache (
  cache_key   TEXT PRIMARY KEY,           -- 'rentcast:<full lowercase address>'
  payload     TEXT NOT NULL,              -- JSON: normalized RentCast response
  fetched_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_property_cache_fetched ON property_cache(fetched_at DESC);
