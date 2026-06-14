// =============================================================================
// pin — P3 (Knowledge) client wrapper around the server-side PIN RPCs
// =============================================================================
// The PIN is NEVER hashed, stored, or compared in the browser. It is sent over
// TLS to the SECURITY DEFINER RPCs in migration 0022, which compute the salted
// bcrypt hash in Postgres. This module:
//   - NEVER writes the PIN to localStorage, state, or any cache.
//   - NEVER logs the PIN. Console warnings here log only error metadata, and we
//     deliberately strip anything that could echo an argument value.
//   - Treats a missing RPC (function not yet deployed to the cloud DB) as
//     "backend unavailable" so the caller can degrade per the no-lockout rule.
//
// Account PIN (per Supabase user): setUserPin / hasUserPin / verifyUserPin.
// Persona PIN (per family instance+persona, shared-device picker gate):
//   setPersonaPin / hasPersonaPin / listPersonaPins / verifyPersonaPin.
// =============================================================================
import supabase from './supabase.js';

// A Postgrest "function does not exist" surfaces as code PGRST202 (and/or an
// HTTP 404). We map that to backendAvailable:false so the app degrades instead
// of hard-failing on a preview that runs before 0022 is applied.
function isMissingRpc(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return code === 'PGRST202'
    || code === '404'
    || msg.includes('could not find the function')
    || msg.includes('does not exist');
}

// Local format check mirrors the server's _mpa_validate_pin so the UI can give
// instant feedback. The server re-validates (it is the source of truth).
export function isValidPinFormat(pin) {
  if (typeof pin !== 'string' || !/^[0-9]{4,8}$/.test(pin)) return false;
  if (new RegExp(`^(.)\\1{${pin.length - 1}}$`).test(pin)) return false; // all-same
  return true;
}

async function callRpc(fn, args) {
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) {
      if (isMissingRpc(error)) return { backendAvailable: false };
      // Log metadata ONLY — never the args (they contain the PIN).
      console.warn(`[pin] ${fn} failed:`, error.code || error.message || 'error');
      return { backendAvailable: true, error: { code: error.code, message: error.message } };
    }
    return { backendAvailable: true, data };
  } catch (e) {
    console.warn(`[pin] ${fn} threw`);
    return { backendAvailable: true, error: { message: 'network' } };
  }
}

// --- Account PIN (P3) --------------------------------------------------------

/** Create/replace the signed-in user's PIN. @returns {ok, backendAvailable, error?} */
export async function setUserPin(pin) {
  if (!isValidPinFormat(pin)) {
    return { ok: false, backendAvailable: true, error: { message: 'PIN must be 4–8 digits and not a single repeated digit.' } };
  }
  const r = await callRpc('set_user_pin', { pin });
  return { ok: !!(r.data && r.data.ok), backendAvailable: r.backendAvailable !== false, error: r.error };
}

/** Does the signed-in user have a PIN? @returns {hasPin, backendAvailable} */
export async function hasUserPin() {
  const r = await callRpc('has_user_pin', {});
  return { hasPin: r.data === true, backendAvailable: r.backendAvailable !== false };
}

/**
 * Verify the signed-in user's PIN.
 * @returns {ok, backendAvailable, locked?, retryAfterSeconds?, attemptsRemaining?, noPin?}
 */
export async function verifyUserPin(pin) {
  const r = await callRpc('verify_user_pin', { pin });
  const d = r.data || {};
  return {
    ok: !!d.ok,
    backendAvailable: r.backendAvailable !== false,
    locked: !!d.locked,
    retryAfterSeconds: d.retry_after_seconds,
    attemptsRemaining: d.attempts_remaining,
    noPin: !!d.no_pin,
    error: r.error,
  };
}

// --- Persona PIN (family shared-device picker gate) --------------------------

export async function setPersonaPin(instanceId, persona, pin) {
  if (!isValidPinFormat(pin)) {
    return { ok: false, backendAvailable: true, error: { message: 'PIN must be 4–8 digits and not a single repeated digit.' } };
  }
  const r = await callRpc('set_persona_pin', { p_instance: instanceId, p_persona: persona, pin });
  return { ok: !!(r.data && r.data.ok), backendAvailable: r.backendAvailable !== false, error: r.error };
}

export async function hasPersonaPin(instanceId, persona) {
  const r = await callRpc('has_persona_pin', { p_instance: instanceId, p_persona: persona });
  return { hasPersonaPin: r.data === true, backendAvailable: r.backendAvailable !== false };
}

/** @returns {personas:string[], backendAvailable} — personas that have a PIN. */
export async function listPersonaPins(instanceId) {
  const r = await callRpc('list_persona_pins', { p_instance: instanceId });
  return { personas: Array.isArray(r.data) ? r.data : [], backendAvailable: r.backendAvailable !== false };
}

export async function verifyPersonaPin(instanceId, persona, pin) {
  const r = await callRpc('verify_persona_pin', { p_instance: instanceId, p_persona: persona, pin });
  const d = r.data || {};
  return {
    ok: !!d.ok,
    backendAvailable: r.backendAvailable !== false,
    locked: !!d.locked,
    retryAfterSeconds: d.retry_after_seconds,
    attemptsRemaining: d.attempts_remaining,
    noPin: !!d.no_pin,
    forbidden: !!d.forbidden,
    error: r.error,
  };
}
