-- =============================================================================
-- 0022 — multi-point auth, Phase 1 (2026-06-14)
-- =============================================================================
-- Phase 1 of the multi-point auth design (design calls locked by Darrell). The
-- access rule: a user needs >= 2 of 3 points to get in.
--   P1 Identity  — Supabase Auth (email OTP / Google / Apple). Already live;
--                  no DB object here. Being signed in IS the identity point.
--   P2 Device    — a device-trust token issued on a full multi-point login and
--                  stored ON-DEVICE. The server stores only a HASH of it
--                  (process-don't-store): a DB leak cannot mint device trust.
--   P3 Knowledge — a PIN the user sets. Stored ONLY as a salted bcrypt hash,
--                  computed server-side via pgcrypto. The plaintext PIN is sent
--                  over TLS to these SECURITY DEFINER RPCs, hashed, and dropped.
--                  It is NEVER stored in plaintext, NEVER returned, NEVER logged.
--
-- Plus the family shared-device gate: selecting a family persona in the
-- "Who's using this device?" picker now requires that PERSON's PIN
-- (instance_persona_pins) — fixes "anyone taps Darrell".
--
-- SECURITY MODEL — why there are no client-facing RLS policies on these tables:
--   user_credentials / trusted_devices / instance_persona_pins have RLS ENABLED
--   with NO policies. Under RLS, "enabled + no policy" = default DENY for the
--   anon/authenticated API roles. So the browser bundle (anon key) can NEVER
--   read these tables directly — not the bcrypt hashes, not the token hashes.
--   Every access goes through the SECURITY DEFINER functions below, which run as
--   the table owner (bypassing RLS) and return only booleans / metadata / a
--   one-time token. This is the strongest guarantee that hash material never
--   crosses the API boundary.
--
-- NO-LOCKOUT (hard guardrail): rate-limiting here is a SHORT, escalating backoff
-- that is NEVER permanent — a fumbling legitimate user waits at most a few
-- minutes, never forever. A user who forgets their PIN re-proves identity via a
-- fresh email-OTP / OAuth sign-in (which is itself P1) and then overwrites the
-- PIN with set_user_pin — set_* is always permitted for the authenticated user,
-- so identity alone is always a path back in.
--
-- Idempotent: CREATE EXTENSION IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
-- CREATE OR REPLACE FUNCTION. The lane applies every migration on every run.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared helper: validate a PIN's FORMAT (not its strength policy — kept light
-- so a scared, fumbling user is never blocked by a fussy rule). 4-8 digits,
-- and not a single repeated digit. Returns the PIN unchanged or RAISES.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._mpa_validate_pin(pin text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF pin IS NULL OR pin !~ '^[0-9]{4,8}$' THEN
    RAISE EXCEPTION 'PIN must be 4 to 8 digits' USING ERRCODE = '22023';
  END IF;
  IF pin ~ ('^(.)\1{' || (length(pin) - 1)::text || '}$') THEN
    RAISE EXCEPTION 'PIN cannot be a single repeated digit' USING ERRCODE = '22023';
  END IF;
  RETURN pin;
END;
$$;

-- =============================================================================
-- P3 · Knowledge — per-user account PIN
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash       text,                       -- bcrypt(crypt) — salted; NEVER plaintext
  pin_set_at     timestamptz,
  failed_attempts int  NOT NULL DEFAULT 0,
  locked_until   timestamptz,                -- short backoff window; NEVER permanent
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
-- (Deliberately no policies — RPC-only access. See SECURITY MODEL above.)

-- Set or replace the caller's PIN. Always allowed for the authenticated user
-- (this is the no-lockout recovery path: re-auth, then set a new PIN).
CREATE OR REPLACE FUNCTION public.set_user_pin(pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  PERFORM public._mpa_validate_pin(pin);
  INSERT INTO user_credentials (user_id, pin_hash, pin_set_at, failed_attempts, locked_until, updated_at)
    VALUES (v_uid, crypt(pin, gen_salt('bf', 10)), now(), 0, NULL, now())
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(pin, gen_salt('bf', 10)),
        pin_set_at = now(), failed_attempts = 0, locked_until = NULL, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Does the caller have a PIN set? (Drives "set PIN" vs "enter PIN" in the UI.)
CREATE OR REPLACE FUNCTION public.has_user_pin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_uid uuid := auth.uid(); v_has boolean;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  SELECT pin_hash IS NOT NULL INTO v_has FROM user_credentials WHERE user_id = v_uid;
  RETURN COALESCE(v_has, false);
END;
$$;

-- Verify the caller's PIN. Returns ONLY a verdict + backoff metadata — never the
-- hash. Short escalating lockout, never permanent (no-lockout guardrail).
CREATE OR REPLACE FUNCTION public.verify_user_pin(pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row user_credentials%ROWTYPE;
  v_lock_seconds int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  SELECT * INTO v_row FROM user_credentials WHERE user_id = v_uid;
  IF NOT FOUND OR v_row.pin_hash IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'no_pin', true);
  END IF;

  -- Inside a backoff window: refuse without consuming an attempt.
  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'locked', true,
      'retry_after_seconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.locked_until - now())))::int));
  END IF;

  IF crypt(pin, v_row.pin_hash) = v_row.pin_hash THEN
    UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', true);
  END IF;

  -- Wrong PIN: count it. After 5 misses, start a SHORT escalating backoff,
  -- capped at 300s. Never permanent — identity re-auth + set_user_pin always
  -- recovers, and the window always elapses.
  v_row.failed_attempts := v_row.failed_attempts + 1;
  IF v_row.failed_attempts >= 5 THEN
    v_lock_seconds := LEAST(300, 30 * POWER(2, v_row.failed_attempts - 5)::int);
    UPDATE user_credentials
       SET failed_attempts = v_row.failed_attempts,
           locked_until = now() + make_interval(secs => v_lock_seconds), updated_at = now()
     WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', false, 'locked', true, 'retry_after_seconds', v_lock_seconds);
  END IF;

  UPDATE user_credentials SET failed_attempts = v_row.failed_attempts, updated_at = now()
    WHERE user_id = v_uid;
  RETURN jsonb_build_object('ok', false, 'attempts_remaining', 5 - v_row.failed_attempts);
END;
$$;

-- =============================================================================
-- P2 · Device trust — issued on a full multi-point login, stored on-device.
-- The server keeps only a SHA-256 hash of the token.
-- =============================================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id    text NOT NULL,                -- client-generated stable id
  token_hash   text NOT NULL,                -- sha256(token) — NEVER the raw token
  label        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz,
  UNIQUE (user_id, device_id)
);
CREATE INDEX IF NOT EXISTS trusted_devices_user_idx ON trusted_devices (user_id);
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
-- (RPC-only; no policies.)

-- Mint a device-trust token for (caller, device_id). Returns the RAW token ONCE;
-- only its hash is persisted. Re-issuing rotates the token and un-revokes.
CREATE OR REPLACE FUNCTION public.issue_device_trust(device_id text, label text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE v_uid uuid := auth.uid(); v_token text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF device_id IS NULL OR length(device_id) < 8 THEN
    RAISE EXCEPTION 'invalid device_id' USING ERRCODE = '22023';
  END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO trusted_devices (user_id, device_id, token_hash, label, created_at, last_seen_at, revoked_at)
    VALUES (v_uid, device_id, encode(digest(v_token, 'sha256'), 'hex'),
            NULLIF(trim(coalesce(label, '')), ''), now(), now(), NULL)
  ON CONFLICT (user_id, device_id) DO UPDATE
    SET token_hash = encode(digest(v_token, 'sha256'), 'hex'),
        label = COALESCE(NULLIF(trim(coalesce(label, '')), ''), trusted_devices.label),
        last_seen_at = now(), revoked_at = NULL;
  RETURN v_token;
END;
$$;

-- Is (caller, device_id, token) a currently-trusted device? Updates last_seen.
CREATE OR REPLACE FUNCTION public.verify_device_trust(device_id text, token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE v_uid uuid := auth.uid(); v_ok boolean;
BEGIN
  IF v_uid IS NULL OR token IS NULL OR device_id IS NULL THEN RETURN false; END IF;
  UPDATE trusted_devices SET last_seen_at = now()
   WHERE user_id = v_uid AND device_id = verify_device_trust.device_id
     AND revoked_at IS NULL
     AND token_hash = encode(digest(token, 'sha256'), 'hex')
  RETURNING true INTO v_ok;
  RETURN COALESCE(v_ok, false);
END;
$$;

-- The caller's trusted devices (no hash material). For the manage/revoke list.
CREATE OR REPLACE FUNCTION public.list_trusted_devices()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_uid uuid := auth.uid(); v_out jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', id, 'device_id', device_id, 'label', label,
           'created_at', created_at, 'last_seen_at', last_seen_at,
           'revoked', revoked_at IS NOT NULL) ORDER BY last_seen_at DESC), '[]'::jsonb)
    INTO v_out FROM trusted_devices WHERE user_id = v_uid;
  RETURN v_out;
END;
$$;

-- Revoke one of the caller's devices (cannot touch another user's row).
CREATE OR REPLACE FUNCTION public.revoke_device_trust(device_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_uid uuid := auth.uid(); v_n int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  UPDATE trusted_devices SET revoked_at = now()
   WHERE id = device_uuid AND user_id = v_uid AND revoked_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_n > 0);
END;
$$;

-- =============================================================================
-- Family shared-device persona gate — PIN per (instance, persona)
-- Decoupled from the per-user PIN so any MEMBER of the shared family instance
-- can be challenged for the SELECTED persona's PIN (the shared device may be
-- signed in as one account but used by several family members).
-- =============================================================================
CREATE TABLE IF NOT EXISTS instance_persona_pins (
  instance_id     uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  persona         text NOT NULL,             -- 'darrell' | 'christina' | ...
  pin_hash        text NOT NULL,             -- bcrypt — salted; NEVER plaintext
  failed_attempts int  NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  set_by          uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, persona)
);
ALTER TABLE instance_persona_pins ENABLE ROW LEVEL SECURITY;
-- (RPC-only; no policies.)

CREATE OR REPLACE FUNCTION public.set_persona_pin(p_instance uuid, p_persona text, pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF NOT public.user_in_instance(p_instance) THEN
    RAISE EXCEPTION 'not a member of this instance' USING ERRCODE = '42501';
  END IF;
  PERFORM public._mpa_validate_pin(pin);
  INSERT INTO instance_persona_pins (instance_id, persona, pin_hash, failed_attempts, locked_until, set_by, updated_at)
    VALUES (p_instance, p_persona, crypt(pin, gen_salt('bf', 10)), 0, NULL, auth.uid(), now())
  ON CONFLICT (instance_id, persona) DO UPDATE
    SET pin_hash = crypt(pin, gen_salt('bf', 10)), failed_attempts = 0,
        locked_until = NULL, set_by = auth.uid(), updated_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_persona_pin(p_instance uuid, p_persona text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_has boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.user_in_instance(p_instance) THEN RETURN false; END IF;
  SELECT true INTO v_has FROM instance_persona_pins
    WHERE instance_id = p_instance AND persona = p_persona AND pin_hash IS NOT NULL;
  RETURN COALESCE(v_has, false);
END;
$$;

-- Which personas in this instance have a PIN set (for the picker UI).
CREATE OR REPLACE FUNCTION public.list_persona_pins(p_instance uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_out jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.user_in_instance(p_instance) THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(persona ORDER BY persona), '[]'::jsonb) INTO v_out
    FROM instance_persona_pins WHERE instance_id = p_instance AND pin_hash IS NOT NULL;
  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_persona_pin(p_instance uuid, p_persona text, pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_row instance_persona_pins%ROWTYPE;
  v_lock_seconds int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.user_in_instance(p_instance) THEN
    RETURN jsonb_build_object('ok', false, 'forbidden', true);
  END IF;
  SELECT * INTO v_row FROM instance_persona_pins
    WHERE instance_id = p_instance AND persona = p_persona;
  IF NOT FOUND OR v_row.pin_hash IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'no_pin', true);
  END IF;
  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'locked', true,
      'retry_after_seconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.locked_until - now())))::int));
  END IF;
  IF crypt(pin, v_row.pin_hash) = v_row.pin_hash THEN
    UPDATE instance_persona_pins SET failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE instance_id = p_instance AND persona = p_persona;
    RETURN jsonb_build_object('ok', true);
  END IF;
  v_row.failed_attempts := v_row.failed_attempts + 1;
  IF v_row.failed_attempts >= 5 THEN
    v_lock_seconds := LEAST(300, 30 * POWER(2, v_row.failed_attempts - 5)::int);
    UPDATE instance_persona_pins
       SET failed_attempts = v_row.failed_attempts,
           locked_until = now() + make_interval(secs => v_lock_seconds), updated_at = now()
     WHERE instance_id = p_instance AND persona = p_persona;
    RETURN jsonb_build_object('ok', false, 'locked', true, 'retry_after_seconds', v_lock_seconds);
  END IF;
  UPDATE instance_persona_pins SET failed_attempts = v_row.failed_attempts, updated_at = now()
    WHERE instance_id = p_instance AND persona = p_persona;
  RETURN jsonb_build_object('ok', false, 'attempts_remaining', 5 - v_row.failed_attempts);
END;
$$;

-- -----------------------------------------------------------------------------
-- Grants — authenticated only. (anon has no auth.uid(), and every function
-- either RAISES or returns false/empty for a NULL caller.)
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.set_user_pin(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_pin()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_pin(text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_device_trust(text, text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_device_trust(text, text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_trusted_devices()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_device_trust(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_persona_pin(uuid, text, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_persona_pin(uuid, text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_persona_pins(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_persona_pin(uuid, text, text) TO authenticated;

COMMIT;

-- =============================================================================
-- Verify after apply:
--   SELECT proname, prosecdef FROM pg_proc
--    WHERE proname IN ('set_user_pin','verify_user_pin','has_user_pin',
--                      'issue_device_trust','verify_device_trust',
--                      'list_trusted_devices','revoke_device_trust',
--                      'set_persona_pin','verify_persona_pin','has_persona_pin',
--                      'list_persona_pins');
--   Expected: all prosecdef = true.
--   SELECT relrowsecurity FROM pg_class
--    WHERE relname IN ('user_credentials','trusted_devices','instance_persona_pins');
--   Expected: all true (RLS enabled, default-deny for the API roles).
-- =============================================================================
