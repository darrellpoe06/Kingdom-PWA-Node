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
  return loadReadingVoicePick(store).voiceId;
}

/**
 * The saved pick WITH the moment it was made: { voiceId, at, saved }. `at` is
 * 0 for a pick saved before picks were stamped; `saved` is false when this
 * device has never saved a pick at all. Never throws.
 */
export function loadReadingVoicePick(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    const raw = store && store.getItem(KEY);
    if (!raw) return { voiceId: SYSTEM_VOICE_ID, at: 0, saved: false };
    const v = JSON.parse(raw);
    const voiceId = v && typeof v.voiceId === 'string' && v.voiceId ? v.voiceId : SYSTEM_VOICE_ID;
    const at = v && Number.isFinite(Number(v.at)) ? Number(v.at) : 0;
    return { voiceId, at, saved: true };
  } catch (_) { return { voiceId: SYSTEM_VOICE_ID, at: 0, saved: false }; }
}

/** Persist the voice id to a store, stamped with when it was picked. Never throws. */
export function saveReadingVoiceId(voiceId, store = (typeof localStorage !== 'undefined' ? localStorage : undefined), at = Date.now()) {
  try { if (store) store.setItem(KEY, JSON.stringify({ voiceId: String(voiceId || SYSTEM_VOICE_ID), at: Number(at) || 0 })); }
  catch (_) { /* private mode / quota — non-fatal */ }
}

/**
 * Does the account's voice replace this device's pick? Only when it is NEWER.
 *
 * Darrell 2026-09-25, after picking another voice on his phone: "I did it
 * didn't work!!!!!" Hydration used to adopt the account's value whenever it
 * merely DIFFERED from the local one. The account write is best-effort and a
 * refused write (an expired session answers with an error object, it does not
 * throw) left the OLD voice there — so the next reader that mounted pulled the
 * old voice back over the one he had just chosen, without a word. A pick is
 * now stamped, and the older of the two never overwrites the newer. Pure.
 */
export function remoteVoiceWins(local, remote) {
  if (!remote || !remote.voiceId) return false;
  if (!local || !local.saved) return true;                // a fresh device takes the account's pick
  if (remote.voiceId === local.voiceId) return false;
  return (Number(remote.at) || 0) > (Number(local.at) || 0);
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
  const pick = await loadReadingVoicePickFromAccount(client);
  return pick ? pick.voiceId : null;
}

/** The account's pick with its stamp: { voiceId, at } or null. Never throws. */
export async function loadReadingVoicePickFromAccount(client) {
  try {
    const { data } = await client.auth.getUser();
    const meta = data && data.user && data.user.user_metadata;
    const id = meta && meta.reading_voice_id;
    if (typeof id !== 'string' || !id) return null;
    const at = Number(meta.reading_voice_at);
    return { voiceId: id, at: Number.isFinite(at) ? at : 0 };
  } catch (_) { return null; }
}

/** Sync the voice id to the account (best-effort; no-op when signed out). Never throws. */
export async function saveReadingVoiceToAccount(voiceId, client, at = Date.now()) {
  try { await client.auth.updateUser({ data: { reading_voice_id: String(voiceId || SYSTEM_VOICE_ID), reading_voice_at: Number(at) || 0 } }); }
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

  // Hydrate from the account once (cross-device) — "follows me to any device" —
  // but only when the account's pick is NEWER than this device's (see
  // remoteVoiceWins). A stale account value never overwrites a fresh pick.
  useEffect(() => {
    let alive = true;
    if (!client) return undefined;
    (async () => {
      const remote = await loadReadingVoicePickFromAccount(client);
      if (alive && remoteVoiceWins(loadReadingVoicePick(), remote)) {
        saveReadingVoiceId(remote.voiceId, undefined, remote.at);
        broadcastReadingVoice(remote.voiceId);
      }
    })();
    return () => { alive = false; };
  }, [client]);

  const setVoiceId = useCallback((id) => {
    const next = String(id || SYSTEM_VOICE_ID);
    const at = Date.now();
    saveReadingVoiceId(next, undefined, at);
    broadcastReadingVoice(next); // update THIS + every other instance in the tab
    if (client) saveReadingVoiceToAccount(next, client, at);
  }, [client]);

  return { voiceId, setVoiceId };
}
