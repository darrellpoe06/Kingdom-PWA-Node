// =============================================================================
// garage-header — which garage doors the header offers, kept on this device
// =============================================================================
// Darrell 2026-10-21: "Garage door openers are supposed to be on the main page
// in the header of the app so we users who connect our Garage doors can use it
// for opening the garage without needing to open the cameras tab."
//
// ROOT CAUSE of the miss: the header's OpenerButton (2026-10-08) reads only the
// hand-registered `openers` rows, and the garage that actually works is the
// Wyze garage controller on a camera (DR-0777), which only the Cameras tab
// asked the NAS about. Two opener systems, and the header knew one.
//
// The header asks the NAS for the doors at most once every GARAGE_FRESH_MS per
// device and keeps the answer here; the Cameras tab refreshes the same record
// whenever it reads the devices. Wyze rate-limits the NAS (DR-1097, twelfth
// read), so a header on every page of every device must not ask it on every
// load. The record holds names and MACs only, never a key.
// =============================================================================
export const GARAGE_CACHE_KEY = 'poetech.garages.v1';
export const GARAGE_FRESH_MS = 6 * 60 * 60 * 1000;

const store = (storage) => storage || (typeof localStorage !== 'undefined' ? localStorage : null);

/** The garages last read on this device: { garages, at } (at 0 when never read). */
export function loadGarages(storage = null) {
  try {
    const raw = store(storage) && store(storage).getItem(GARAGE_CACHE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (!v || !Array.isArray(v.garages)) return { garages: [], at: 0 };
    const garages = v.garages
      .filter((g) => g && typeof g.mac === 'string' && g.mac)
      .map((g) => ({ mac: g.mac, nickname: String(g.nickname || g.mac), online: g.online !== false }));
    return { garages, at: Number(v.at) || 0 };
  } catch {
    return { garages: [], at: 0 };
  }
}

/** Keep what the NAS said about the doors (an empty list is an answer too). */
export function saveGarages(garages, now = Date.now(), storage = null) {
  const list = (garages || []).filter((g) => g && g.mac).map((g) => ({ mac: g.mac, nickname: g.nickname || g.mac, online: g.online !== false }));
  try { store(storage) && store(storage).setItem(GARAGE_CACHE_KEY, JSON.stringify({ garages: list, at: now })); } catch { /* a convenience only */ }
  return list;
}

/** True when the kept answer is missing or older than GARAGE_FRESH_MS. */
export function garagesStale(at, now = Date.now(), fresh = GARAGE_FRESH_MS) {
  return !at || now - at >= fresh;
}

/** The answer that ends a refresh: only a real reading replaces what is kept. */
export function keepAfterRead(result) {
  if (!result) return null;
  if (result.kind === 'ok') return 'replace';
  // No doors for this access, or no Wyze sign-in kept: the header shows none.
  if (result.kind === 'no-actions' || result.kind === 'no-credentials' || result.kind === 'unauthorized') return 'clear';
  // Wyze slow, NAS asleep, network gone: keep the doors already known.
  return null;
}
