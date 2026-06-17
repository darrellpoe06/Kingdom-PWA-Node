-- =============================================================================
-- 0033 — public-form input hardening: server-side length + range CHECK constraints
-- =============================================================================
-- Declared by Darrell 2026-06-17 (conference-critical security hardening). The open,
-- anonymous public forms — conference_public_registrations (0027) and app_interest
-- (0025) — accept writes from ANYONE with the bundled anon key. Client-side cleaning
-- (lib/sanitize-input.js) keeps the HONEST path tidy, but a determined attacker
-- bypasses the React form and POSTs straight to PostgREST. So the ENFORCEABLE cap is
-- here, in the database: CHECK constraints that FAIL the write (DR-0076 — the gate
-- that catches, not the claim that the client trimmed it).
--
-- WHAT THIS DEFENDS:
--   - Payload-bloat DoS: every text field is length-bounded, so a single hostile row
--     cannot be megabytes. Caps MIRROR FIELD_CAPS in lib/sanitize-input.js
--     (public-form-caps-guard.test.js proves the two agree).
--   - Nonsense ranges: party_size is pinned to 1..99 (was DEFAULT 1, NOT NULL, but
--     unbounded — a direct POST could send 2_000_000_000).
--   - Empty/whitespace junk: name must have at least one non-blank character.
--
-- WHAT THIS DOES NOT CHANGE (no new leak surface — proven by the existing
-- conference-public-registration-security gate, which still passes):
--   - RLS stays exactly as 0027/0025 set it: anon INSERT-only, owner/admin-only read,
--     instance forced by the SECURITY DEFINER trigger. No GRANT or POLICY is touched.
--
-- CONSTRAINTS ARE ADDED **NOT VALID**: this enforces the cap on every NEW insert /
-- update immediately WITHOUT scanning existing rows (which are already short real
-- registrations). That guarantees a clean, fast, conference-safe apply on the live
-- table — it can never fail the migration on pre-existing data, and it never blocks
-- a legitimate registrant. (We deliberately do NOT VALIDATE afterward; the goal is
-- forward enforcement, not retroactive rejection of historical rows.)
--
-- DEPENDS ON: 0027 (conference_public_registrations), 0025 (app_interest).
-- IDEMPOTENT: each constraint is added only if absent (guarded by a pg_constraint
-- lookup), so re-running is a no-op. Tier C (security hardening on anon-write
-- surfaces) — ship reviewed.
-- =============================================================================

-- Helper pattern: add a CHECK constraint only if it does not already exist. Inlined
-- per-constraint as DO blocks so the file stays self-contained and idempotent.

-- ---------------------------------------------------------------------------
-- conference_public_registrations — length caps + party_size range + non-blank name
-- ---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_name_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_name_len
      CHECK (char_length(btrim(coalesce(name, ''))) BETWEEN 1 AND 120) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_email_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_email_len
      CHECK (email IS NULL OR char_length(email) <= 254) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_phone_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_phone_len
      CHECK (phone IS NULL OR char_length(phone) <= 40) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_dietary_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_dietary_len
      CHECK (dietary IS NULL OR char_length(dietary) <= 500) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_days_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_days_len
      CHECK (days IS NULL OR char_length(days) <= 200) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_confname_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_confname_len
      CHECK (conference_name IS NULL OR char_length(conference_name) <= 200) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_source_len') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_source_len
      CHECK (source IS NULL OR char_length(source) <= 60) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conf_pub_reg_party_range') THEN
    ALTER TABLE conference_public_registrations
      ADD CONSTRAINT conf_pub_reg_party_range
      CHECK (party_size BETWEEN 1 AND 99) NOT VALID;
  END IF;
END
$do$;

-- ---------------------------------------------------------------------------
-- app_interest — length caps. user_agent / referrer are attacker-controllable
-- (a direct POST sets any value), so they are bounded too.
-- ---------------------------------------------------------------------------
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_name_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_name_len
      CHECK (name IS NULL OR char_length(name) <= 120) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_email_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_email_len
      CHECK (email IS NULL OR char_length(email) <= 254) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_phone_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_phone_len
      CHECK (phone IS NULL OR char_length(phone) <= 40) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_issue_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_issue_len
      CHECK (issue IS NULL OR char_length(issue) <= 2000) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_platform_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_platform_len
      CHECK (platform IS NULL OR char_length(platform) <= 20) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_ua_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_ua_len
      CHECK (user_agent IS NULL OR char_length(user_agent) <= 1000) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_referrer_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_referrer_len
      CHECK (referrer IS NULL OR char_length(referrer) <= 1000) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_source_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_source_len
      CHECK (source IS NULL OR char_length(source) <= 60) NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_interest_signed_in_email_len') THEN
    ALTER TABLE app_interest
      ADD CONSTRAINT app_interest_signed_in_email_len
      CHECK (signed_in_email IS NULL OR char_length(signed_in_email) <= 254) NOT VALID;
  END IF;
END
$do$;

NOTIFY pgrst, 'reload schema';
