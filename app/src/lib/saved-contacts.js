// =============================================================================
// saved-contacts — a real, returnable contact list (name + phone + email)
// =============================================================================
// Darrell 2026-07-28 (Messages screenshot): "What about the contact information
// to go back to the contact?... how is this comprehensive if we can't even put
// in a name?" The Add-a-contact form invited by email/phone but SAVED nothing —
// a phone-only contact you texted the app to simply vanished, and there was no
// name. This is the store that fixes it: every contact you add is KEPT with a
// name, so you can go back, text/call/email them again, and complete access
// (add their email) whenever.
//
// SOVEREIGN + no migration: device-local (localStorage), same posture the lease/
// tenant sub-objects started with. Cloud sync is a named follow-on; the phone is
// a trust-tier identifier (DR-0100), so a local address book is the right first
// increment. PURE over an injected storage so tests need no browser.
//
// DR-0076: ids are DETERMINISTIC (derived from email/phone/name) — no
// Date.now()/random, so the same person never duplicates and the store is stable.
// =============================================================================

const KEY = 'poetech.savedContacts.v1';

// A no-op storage so the module never throws in a sandbox without localStorage.
const memoryStore = () => {
  let v = null;
  return { getItem: () => v, setItem: (_k, val) => { v = val; } };
};

export function defaultStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch { /* access can throw in privacy modes */ }
  return memoryStore();
}

const digits = (s) => String(s || '').replace(/\D+/g, '');

/** A stable id for a contact: email (lowered) → phone digits → name (lowered). */
export function contactKey({ email, phone, name } = {}) {
  const e = String(email || '').trim().toLowerCase();
  if (e) return `e:${e}`;
  const p = digits(phone);
  if (p) return `p:${p}`;
  const n = String(name || '').trim().toLowerCase();
  return n ? `n:${n}` : '';
}

/** Read the saved contacts (newest first). Tolerates junk/empty. Never throws. */
export function readContacts(storage = defaultStorage()) {
  try {
    const raw = storage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function writeContacts(storage, list) {
  try { storage.setItem(KEY, JSON.stringify(list)); } catch { /* quota / privacy — best effort */ }
  return list;
}

/**
 * Insert-or-update a contact by its stable key, MERGING fields (a later add that
 * supplies an email fills in the email without losing the name/phone). Returns
 * the full list, newest first. `at` is injected (deterministic). Refuses an
 * entirely empty contact.
 */
export function upsertContact(storage = defaultStorage(), contact = {}, at = '') {
  const key = contactKey(contact);
  if (!key) return readContacts(storage); // nothing identifying — nothing to save
  const list = readContacts(storage);
  // Match on ANY shared strong identifier, not just the exact key — so a
  // phone-only contact who later gets an email merges onto the SAME person
  // (the key would otherwise change from phone to email and duplicate them).
  const inEmail = String(contact.email || '').trim().toLowerCase();
  const inPhone = digits(contact.phone);
  const idx = list.findIndex((c) => {
    if (c.id === key) return true;
    if (inEmail && String(c.email || '').trim().toLowerCase() === inEmail) return true;
    if (inPhone && digits(c.phone) === inPhone) return true;
    return false;
  });
  const clean = {
    id: key,
    name: String(contact.name || '').trim(),
    phone: String(contact.phone || '').trim(),
    email: String(contact.email || '').trim(),
    spaceId: contact.spaceId || '',
    spaceName: contact.spaceName || '',
    status: contact.status || 'saved',
    addedAt: at || '',
  };
  if (idx >= 0) {
    const prev = list[idx];
    const merged = {
      ...prev,
      name: clean.name || prev.name,
      phone: clean.phone || prev.phone,
      email: clean.email || prev.email,
      spaceId: clean.spaceId || prev.spaceId,
      spaceName: clean.spaceName || prev.spaceName,
      status: clean.status || prev.status,
      addedAt: prev.addedAt || clean.addedAt,
    };
    // Upgrade the id to the strongest identifier now known (phone → email).
    merged.id = contactKey(merged) || prev.id;
    const next = [merged, ...list.slice(0, idx), ...list.slice(idx + 1)];
    return writeContacts(storage, next);
  }
  return writeContacts(storage, [clean, ...list]);
}

/** Remove a contact by id. Returns the remaining list. */
export function removeContact(storage = defaultStorage(), id) {
  return writeContacts(storage, readContacts(storage).filter((c) => c.id !== id));
}
