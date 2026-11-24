// =============================================================================
// account-profile — the profile on screen belongs to the person signed in
// =============================================================================
// DR-1617. Darrell 2026-11-24: "Christina logging in shows Darrell name
// instead of hers?!!!!!"
//
// Measured cause: the profile pill and Home's welcome name read
// `poe-current-profile`, ONE localStorage value per DEVICE. The sign-in effect
// honoured that saved value BEFORE the signed-in account's own mapping, and
// never re-ran once a profile was set. So the device Darrell last used said
// "Darrell" to whoever signed in next: Christina, or a parishioner, who then
// also got Darrell's entity visibility.
//
// The rule now (USER-ACCOUNTS-AND-HISTORIES-STANDARD: each user sees only
// their own): a saved profile is honoured only for the account that saved it
// (`poe-current-profile-owner` = that account's user id). Otherwise the
// account decides: a known family email maps to its own profile, anyone else
// is 'self'. A saved value from before this rule (no owner) is never trusted
// across accounts; the account's own mapping replaces it once. Nothing new is
// collected: the owner stamp is a user id the device already holds in its
// session, kept beside the key it qualifies, and cleared with it.
//
// Pure: no React. The monolith reads and writes the two keys through here.
// =============================================================================

export const PROFILE_KEY = 'poe-current-profile';
export const PROFILE_OWNER_KEY = 'poe-current-profile-owner';

/**
 * The profile to show for the account signed in on this device.
 * @param {{ uid?: string|null, email?: string|null, saved?: string|null, savedOwner?: string|null, familyMap?: Record<string,string> }} args
 * @returns {{ profile: string, source: 'saved'|'account'|'self', mapped: string|null }}
 */
export function profileForAccount({ uid, email, saved, savedOwner, familyMap = {} } = {}) {
  const mapped = familyMap[String(email || '').toLowerCase()] || null;
  if (saved && uid && savedOwner && savedOwner === uid) return { profile: saved, source: 'saved', mapped };
  if (mapped) return { profile: mapped, source: 'account', mapped };
  return { profile: 'self', source: 'self', mapped: null };
}

/** Read the saved profile and its owner from a Storage-like object. Never throws. */
export function readSavedProfile(store) {
  try {
    const ls = store !== undefined ? store : (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!ls) return { saved: null, savedOwner: null };
    return { saved: ls.getItem(PROFILE_KEY) || null, savedOwner: ls.getItem(PROFILE_OWNER_KEY) || null };
  } catch (_) {
    return { saved: null, savedOwner: null };
  }
}

/** Save (or clear) the profile, stamped with the account that chose it. Never throws. */
export function writeSavedProfile(ls, profile, uid) {
  try {
    if (!ls) return;
    if (profile) {
      ls.setItem(PROFILE_KEY, profile);
      if (uid) ls.setItem(PROFILE_OWNER_KEY, uid); else ls.removeItem(PROFILE_OWNER_KEY);
    } else {
      ls.removeItem(PROFILE_KEY);
      ls.removeItem(PROFILE_OWNER_KEY);
    }
  } catch (_) { /* storage blocked: state still changes, nothing persists */ }
}

/** The name a family persona is shown by when the account's profile has none (DR-1617).
 *  A person's own persona only; the household roll-up ('family') names nobody. */
export function personaName(persona) {
  return persona && persona !== 'family' ? persona.charAt(0).toUpperCase() + persona.slice(1) : null;
}
