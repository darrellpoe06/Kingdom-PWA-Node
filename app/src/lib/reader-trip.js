// =============================================================================
// reader-trip — what the last reading did, kept on the device, said in words
// =============================================================================
// Darrell 2026-10-01, after DR-0718 shipped: "It still stops when in the
// background... when should we expect that feature?"
//
// Nobody here can watch his phone, and the phone has never said what happened
// when a reading stopped: which voice was speaking, whether the screen went
// dark first, which sentence it was on, and what the voice said when it gave
// up. So the reading keeps its own trip log — a few facts and a few events,
// on the device, never sent anywhere by itself — and the READ ALOUD panel
// says the last one in one plain line. A stop is then a measurement, not a
// guess (DR-0076), and the next fix is aimed at what the phone actually did.
//
// PURE: storage and the clock are injectable; every storage call is wrapped,
// so a device that cannot keep the log still reads aloud exactly as before.
// =============================================================================

export const TRIPS_KEY = 'poe-reader-trips:v1';
export const TRIPS_KEPT = 10;

const defaultStorage = () => {
  try { return globalThis.localStorage; } catch { return null; }
};

const VOICE_NAMES = {
  audio: 'the NAS voice',
  saved: 'the saved recording',
  device: 'this phone’s own voice',
  '': 'no voice yet',
};

/** What a voice said when it gave up, in words. */
export function reasonText(reason) {
  const r = String(reason || '');
  if (!r) return 'no reason was given';
  if (r === 'fetch-failed' || r === 'voice-lite-road') return 'the next piece could not be fetched';
  if (r === 'voice-lite-timeout') return 'the NAS did not answer in time';
  if (r === 'voice-lite-503') return 'the NAS was busy';
  if (r === 'voice-lite-empty') return 'the NAS sent back nothing';
  if (/^voice-lite-(401|403)$/.test(r)) return 'the NAS refused this device’s key';
  if (r === 'voice-lite-404' || r === 'voice-lite-not-audio') return 'the NAS voice road was not there';
  if (r === 'play-refused' || r === 'NotAllowedError') return 'the phone would not start the sound without a tap';
  if (r === 'studio-clip-error') return 'the studio clip failed';
  return r;
}

function fmtTime(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtSpan(ms) {
  const s = Math.max(0, Math.round(Number(ms) / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/**
 * The trip log. `start` opens a trip, `note` adds an event to it, `end`
 * closes it; the last TRIPS_KEPT trips are kept in storage. Events are kept
 * small: piece changes update one number instead of adding a row each.
 */
export function createTripLog({ storage = defaultStorage(), now = () => Date.now() } = {}) {
  let current = null;

  const readAll = () => {
    try {
      const raw = storage ? storage.getItem(TRIPS_KEY) : null;
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };
  const writeAll = (arr) => {
    try { if (storage) storage.setItem(TRIPS_KEY, JSON.stringify(arr.slice(-TRIPS_KEPT))); } catch { /* a device that cannot keep the log */ }
  };
  const persist = () => {
    if (!current) return;
    const all = readAll().filter((t) => t && t.id !== current.id);
    all.push(current);
    writeAll(all);
  };

  return {
    start({ title = '', pieces = 0 } = {}) {
      const at = now();
      current = { id: `${at}-${Math.floor(Math.random() * 1e6)}`, startedAt: at, title: String(title || '').slice(0, 120), pieces: Number(pieces) || 0, voice: '', piece: -1, events: [], end: null, endedAt: null, endDetail: null };
      persist();
      return current;
    },
    /** True while a trip is open. */
    open() { return !!current; },
    setPieces(n) { if (current) { current.pieces = Number(n) || 0; } },
    note(kind, detail = {}) {
      if (!current) return;
      if (kind === 'piece') { current.piece = Number(detail.i); return; } // one number, not a row per sentence
      if (kind === 'voice') current.voice = String(detail.kind || '');
      current.events.push({ ...detail, at: now() - current.startedAt, kind: String(kind) });
      if (current.events.length > 60) current.events.splice(0, current.events.length - 60);
      persist();
    },
    end(reason, detail = null) {
      if (!current) return null;
      current.end = String(reason || 'ended');
      current.endedAt = now();
      current.endDetail = detail;
      persist();
      const done = current;
      current = null;
      return done;
    },
    /** The open trip, else the most recent kept one. */
    last() {
      if (current) return current;
      const all = readAll();
      return all.length ? all[all.length - 1] : null;
    },
    all() { return readAll(); },
    clear() { current = null; writeAll([]); },
  };
}

/** One plain line about a trip, for the panel and for a screenshot. */
export function tripSummary(trip) {
  if (!trip) return '';
  const voice = VOICE_NAMES[trip.voice] || VOICE_NAMES[''];
  const where = trip.pieces > 0 && trip.piece >= 0 ? `sentence ${trip.piece + 1} of ${trip.pieces}` : (trip.piece >= 0 ? `sentence ${trip.piece + 1}` : 'the start');
  const events = Array.isArray(trip.events) ? trip.events : [];
  const dark = events.find((e) => e.kind === 'hidden');
  const retries = events.filter((e) => e.kind === 'retry').length;
  const cameBack = events.find((e) => e.kind === 'resumed-in-the-dark');
  const handoff = events.find((e) => e.kind === 'handoff');
  const head = `Last reading${trip.startedAt ? ` at ${fmtTime(trip.startedAt)}` : ''}${trip.title ? ` (${trip.title})` : ''}: ${voice}`;
  let what;
  if (!trip.end) what = 'still reading';
  else if (trip.end === 'ended') what = 'played to the end';
  else if (trip.end === 'stopped') what = `stopped by you at ${where}`;
  else if (trip.end === 'held') what = `stopped at ${where} while the screen was off: ${reasonText(trip.endDetail && trip.endDetail.reason)}${retries ? ` (tried again ${retries} time${retries === 1 ? '' : 's'} in the dark)` : ''} — it resumes when the app is seen again`;
  else if (trip.end === 'left') what = `the page was left at ${where}`;
  else what = `${trip.end} at ${where}`;
  const parts = [head, what];
  if (dark) parts.push(`screen went dark ${fmtSpan(dark.at)} in`);
  if (cameBack) parts.push('picked up again in the dark');
  if (handoff) parts.push(`the phone’s voice took over: ${reasonText(handoff.reason)}`);
  return `${parts.join(' · ')}.`;
}
