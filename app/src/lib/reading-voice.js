// =============================================================================
// reading-voice — the ONE persistent "my reading voice" preference (global)
// =============================================================================
// Darrell: "I want to PICK my voice for reading the app anywhere, anything,
// anytime." This is that single source of truth. Pick once; every read-aloud
// surface honors it (the floating control, the Voice tab, any reading page).
//
// Persistence is two-layer so the pick survives sessions AND devices:
//   - localStorage (instant, offline, per-device cache)
//   - the signed-in account: supabase auth user_metadata.reading_voice_id
//     (cross-device for the same person — no table/migration; syncs everywhere
//      they sign in). Signed-out still works via localStorage.
//
// The voice id is a small tagged string so one preference covers every kind:
//   'system'            -> the device's default voice (free, always works)
//   '<browserVoiceURI>' -> a specific browser voice / accent
//   'person:<key>'      -> a personal CLONED voice (stand-in until the studio is
//                          live, then the real voice — same preference, better
//                          backend; see lib/voice-service.js).
import { useCallback, useEffect, useState } from 'react';

const KEY = 'poe-reading-voice';
export const SYSTEM_VOICE_ID = 'system';
const PERSON_PREFIX = 'person:';

/** A personal (cloned) voice id, e.g. 'person:darrell'. Pure. */
export function personVoiceId(personKey) { return `${PERSON_PREFIX}${personKey}`; }
export function isPersonVoiceId(id) { return typeof id === 'string' && id.startsWith(PERSON_PREFIX); }
export function personKeyOf(id) { return isPersonVoiceId(id) ? id.slice(PERSON_PREFIX.length) : null; }
export function isSystemVoiceId(id) { return !id || id === SYSTEM_VOICE_ID; }

/** Read the saved voice id from a store (localStorage). Never throws. */
export function loadReadingVoiceId(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    const raw = store && store.getItem(KEY);
    if (!raw) return SYSTEM_VOICE_ID;
    const v = JSON.parse(raw);
    return v && typeof v.voiceId === 'string' && v.voiceId ? v.voiceId : SYSTEM_VOICE_ID;
  } catch (_) { return SYSTEM_VOICE_ID; }
}

/** Persist the voice id to a store. Never throws. */
export function saveReadingVoiceId(voiceId, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try { if (store) store.setItem(KEY, JSON.stringify({ voiceId: String(voiceId || SYSTEM_VOICE_ID) })); }
  catch (_) { /* private mode / quota — non-fatal */ }
}

// Same-tab reactivity: every useReadingVoice() instance (the header picker, the
// floating control, the Voice tab) subscribes here, so a pick in ONE place updates
// the chosen voice EVERYWHERE at once — not just in localStorage. (Browser
// 'storage' events only fire cross-tab, so a module pub/sub is needed same-tab.)
const _listeners = new Set();
export function subscribeReadingVoice(fn) {
  if (typeof fn !== 'function') return () => {};
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
export function broadcastReadingVoice(voiceId) {
  _listeners.forEach((fn) => { try { fn(String(voiceId || SYSTEM_VOICE_ID)); } catch (_) { /* ignore */ } });
}

/** Read the account-synced voice id (cross-device), or null. Never throws. */
export async function loadReadingVoiceFromAccount(client) {
  try {
    const { data } = await client.auth.getUser();
    const id = data && data.user && data.user.user_metadata && data.user.user_metadata.reading_voice_id;
    return typeof id === 'string' && id ? id : null;
  } catch (_) { return null; }
}

/** Sync the voice id to the account (best-effort; no-op when signed out). Never throws. */
export async function saveReadingVoiceToAccount(voiceId, client) {
  try { await client.auth.updateUser({ data: { reading_voice_id: String(voiceId || SYSTEM_VOICE_ID) } }); }
  catch (_) { /* signed out / offline — localStorage still holds it */ }
}

/**
 * useReadingVoice — the live global preference. Reads localStorage instantly,
 * hydrates from the signed-in account (so a pick on the phone shows on the laptop),
 * and writes BOTH on change. `client` is the supabase client (injected so it stays
 * testable / no hard import cycle).
 */
export function useReadingVoice(client) {
  const [voiceId, setVoiceIdState] = useState(() => loadReadingVoiceId());

  // Stay in sync with every other instance in this tab (header / floating / Voice
  // tab), and with other tabs via the 'storage' event.
  useEffect(() => {
    const unsub = subscribeReadingVoice((id) => setVoiceIdState(id));
    const onStorage = (e) => { if (e && e.key === KEY) setVoiceIdState(loadReadingVoiceId()); };
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('storage', onStorage);
    return () => { unsub(); if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('storage', onStorage); };
  }, []);

  // Hydrate from the account once (cross-device). The account is authoritative if
  // it differs from the local cache — that's the "follows me to any device" path.
  useEffect(() => {
    let alive = true;
    if (!client) return undefined;
    (async () => {
      const remote = await loadReadingVoiceFromAccount(client);
      if (alive && remote && remote !== loadReadingVoiceId()) { saveReadingVoiceId(remote); broadcastReadingVoice(remote); }
    })();
    return () => { alive = false; };
  }, [client]);

  const setVoiceId = useCallback((id) => {
    const next = String(id || SYSTEM_VOICE_ID);
    saveReadingVoiceId(next);
    broadcastReadingVoice(next); // update THIS + every other instance in the tab
    if (client) saveReadingVoiceToAccount(next, client);
  }, [client]);

  return { voiceId, setVoiceId };
}
