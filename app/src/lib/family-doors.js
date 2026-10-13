// =============================================================================
// family-doors — the admin grants access from inside the app (migration 0142)
// =============================================================================
// Darrell 2026-08-21: "I'm inside the app... why can't I do solution inside
// the PoeTech App?" and "I should be able to give access instantly to her or
// anyone.... especially my family". This is the client half of
// admin_set_family_password: the RPC is the gate (admin caller + family/
// shared-instance target, enforced in the database — DR-0060); this module
// only shapes the call and mints a safe password locally. The password never
// touches any log or store here — it exists in the input field and the RPC
// call, nothing else.

import supabase from './supabase.js';

// The family identities an admin most often opens a door for — suggestions
// for the picker, not a limit (the RPC also allows anyone sharing one of the
// caller's instances).
export const FAMILY_DOOR_SUGGESTIONS = [
  'mrspoe06@gmail.com',
  'darrellpoejr@gmail.com',
  'christina@tlctherapysolutions.com',
  'darrellpoe06@gmail.com',
];

// Mint a 12-character password from an unambiguous alphabet (no 0/O/1/l/i).
// Real randomness only — if this environment has no crypto source we say so
// rather than silently minting something weak (DR-0076: no fake safety).
export function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('This browser cannot generate a safe password — type one instead (8+ characters).');
  }
  const buf = new Uint32Array(12);
  c.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < buf.length; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

// Set (or reset) a family member's password. Returns { ok, message } — the
// message is already in the app's voice, ready to render.
export async function setFamilyPassword(email, password) {
  const target = String(email || '').trim();
  if (!target || !target.includes('@')) {
    return { ok: false, message: 'Enter the person’s sign-in email first.' };
  }
  if (String(password || '').length < 8) {
    return { ok: false, message: 'The password needs at least 8 characters — tap Generate for a safe one.' };
  }
  try {
    const { error } = await supabase.rpc('admin_set_family_password', {
      target_email: target,
      new_password: password,
    });
    if (error) return { ok: false, message: error.message || 'The database declined — try again.' };
    return {
      ok: true,
      message: `Done — ${target} can sign in right now: Log in → “Prefer a password? Use one” → this password. Hand it over in person or by text.`,
    };
  } catch (e) {
    return { ok: false, message: (e && e.message) || 'Could not reach the database — check the connection and try again.' };
  }
}
