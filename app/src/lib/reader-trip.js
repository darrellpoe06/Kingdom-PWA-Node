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
/** A wait between sentences this long is one the listener notices. */
export const LONG_WAIT_MS = 1000;
/** A sentence the device took this many times its own length to play was dragged (DR-0794). */
export const DRAG_RATIO = 1.2;

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
      if (kind === 'piece') { // one number, not a row per sentence — plus the waits, summed (DR-0786)
        current.piece = Number(detail.i);
        const wait = Number(detail.waitMs);
        if (Number.isFinite(wait) && wait >= 0) {
          const w = current.waits || { n: 0, sumMs: 0, maxMs: 0, maxAt: -1, fetched: 0, long: 0 };
          w.n += 1; w.sumMs += wait;
          if (wait > w.maxMs) { w.maxMs = wait; w.maxAt = current.piece; w.maxFetched = detail.inHand === false; }
          if (detail.inHand === false) w.fetched += 1;
          if (wait >= LONG_WAIT_MS) w.long += 1;
          current.waits = w;
        }
        return;
      }
      if (kind === 'pace') { // the pace of every piece, summed (DR-0794): one row, not one per sentence
        const p = current.pace || { n: 0, chars: 0, clipS: 0, timed: 0, wallS: 0, expectS: 0, dragged: 0, worst: 0, worstAt: -1, rateMin: null, rateMax: null, voicePace: null, mixedPace: false };
        const clipS = Number(detail.clipS);
        if (Number.isFinite(clipS) && clipS > 0) { p.n += 1; p.chars += Number(detail.chars) || 0; p.clipS += clipS; }
        const rate = Number(detail.playbackRate);
        if (Number.isFinite(rate) && rate > 0) {
          p.rateMin = p.rateMin == null ? rate : Math.min(p.rateMin, rate);
          p.rateMax = p.rateMax == null ? rate : Math.max(p.rateMax, rate);
        }
        const sp = Number(detail.pieceSpeed);
        if (Number.isFinite(sp) && sp > 0) {
          if (p.voicePace == null) p.voicePace = sp; else if (p.voicePace !== sp) p.mixedPace = true;
        }
        // Wall time counts only a piece that played through unpaused, start to end.
        const wallMs = Number(detail.wallMs);
        if (!detail.paused && Number.isFinite(wallMs) && wallMs > 0 && Number.isFinite(clipS) && clipS > 0 && Number.isFinite(rate) && rate > 0) {
          const expectS = clipS / rate;
          p.timed += 1; p.wallS += wallMs / 1000; p.expectS += expectS;
          const ratio = (wallMs / 1000) / expectS;
          if (ratio > p.worst) { p.worst = ratio; p.worstAt = Number(detail.i); }
          if (ratio >= DRAG_RATIO) p.dragged += 1;
        }
        current.pace = p;
        return;
      }
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

/** Why a saved reading could not be played as one file, in words. */
export function joinMissReason(e) {
  const r = e && e.reason;
  if (r === 'not-saved') return 'the reading is not saved on this device';
  if (r === 'missing-piece') return `piece ${(Number(e.i) || 0) + 1} of ${e.of || '?'} was not on the device`;
  if (r === 'not-joinable') return `the ${e.of || ''} saved pieces could not be joined${e.bytes ? ` (${Math.round(e.bytes / 1048576)} MB)` : ''}`;
  return 'no reason was given';
}

function fmtSec(ms) {
  const s = Math.max(0, Number(ms) || 0) / 1000;
  return s >= 10 ? `${Math.round(s)} s` : `${s.toFixed(1)} s`;
}

/** The waits between sentences, in one clause (DR-0786): where the silence was and where the piece came from. */
export function waitsLine(w) {
  if (!w || !(Number(w.n) > 0)) return '';
  const typical = fmtSec(w.sumMs / w.n);
  const from = w.fetched > 0 ? `${w.fetched} of ${w.n} fetched while you waited` : 'every piece already in hand';
  const longest = w.maxMs > 0 ? `, longest ${fmtSec(w.maxMs)} at sentence ${(Number(w.maxAt) || 0) + 1}${w.maxFetched ? ' (fetched)' : ''}` : '';
  const long = w.long > 0 ? `, ${w.long} over ${fmtSec(LONG_WAIT_MS)}` : '';
  return `waits between sentences: typical ${typical}${longest}${long}; ${from}`;
}

const fmtX = (n) => `${Math.round(Number(n) * 100) / 100}×`;

/**
 * The pace of a reading, in one clause (DR-0794): the pace the voice spoke
 * at, what the player did to it, how many letters a second reached the ear,
 * and whether the device took longer to play the sound than the sound was.
 */
export function paceLine(p) {
  if (!p || !(Number(p.n) > 0)) return '';
  const parts = [];
  const voice = p.voicePace != null ? (p.mixedPace ? 'the voice spoke at more than one pace' : `the voice spoke at ${fmtX(p.voicePace)}`) : 'the voice named no pace';
  let player = '';
  if (p.rateMin != null) {
    const steady = Math.abs(p.rateMax - p.rateMin) < 0.005;
    const one = steady && Math.abs(p.rateMin - 1) < 0.005;
    player = one ? 'the player stretched nothing' : (steady ? `the player stretched it to ${fmtX(p.rateMin)}` : `the player stretched it between ${fmtX(p.rateMin)} and ${fmtX(p.rateMax)}`);
    if (p.rateMin < 0.995) player += ' (below 1× slurs the words)';
  }
  parts.push(player ? `${voice}, ${player}` : voice);
  if (p.chars > 0 && p.clipS > 0) {
    const heard = p.rateMin != null && p.rateMax != null ? (p.chars / p.clipS) * ((p.rateMin + p.rateMax) / 2) : p.chars / p.clipS;
    parts.push(`about ${Math.round(heard)} letters a second reached the ear`);
  }
  if (p.timed > 0 && p.expectS > 0) {
    const overall = p.wallS / p.expectS;
    if (p.dragged > 0) parts.push(`the device dragged ${p.dragged} of ${p.timed} sentences past ${fmtX(DRAG_RATIO)} their length (worst ${fmtX(p.worst)} at sentence ${(Number(p.worstAt) || 0) + 1})`);
    else parts.push(`the device played ${p.timed} sentence${p.timed === 1 ? '' : 's'} in ${fmtX(overall)} their length (no drag)`);
  }
  return `pace: ${parts.join('; ')}`;
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
  // Whether a saved reading played as ONE file (DR-0746): the fact that tells
  // a background stop apart from a piece-by-piece read.
  const joined = events.find((e) => e.kind === 'join');
  const joinMissed = events.find((e) => e.kind === 'join-missed');
  const head = `Last reading${trip.startedAt ? ` at ${fmtTime(trip.startedAt)}` : ''}${trip.title ? ` (${trip.title})` : ''}: ${voice}`;
  let what;
  if (!trip.end) what = 'still reading';
  else if (trip.end === 'ended') what = 'played to the end';
  else if (trip.end === 'stopped') what = `stopped by you at ${where}`;
  else if (trip.end === 'held') what = `stopped at ${where} while the screen was off: ${reasonText(trip.endDetail && trip.endDetail.reason)}${retries ? ` (tried again ${retries} time${retries === 1 ? '' : 's'} in the dark)` : ''} — it resumes when the app is seen again`;
  else if (trip.end === 'left') what = `the page was left at ${where}`;
  else what = `${trip.end} at ${where}`;
  const parts = [head, what];
  if (joined) parts.push(`played as one file (${joined.pieces} pieces${joined.seconds ? `, ${fmtSpan(joined.seconds * 1000)}` : ''}${joined.stretched ? '; the saved 1× pieces, stretched by the player because the NAS voice could not be reached' : ''})`);
  else if (joinMissed) parts.push(`played piece by piece: ${joinMissReason(joinMissed)}`);
  if (dark) parts.push(`screen went dark ${fmtSpan(dark.at)} in`);
  if (cameBack) parts.push('picked up again in the dark');
  if (handoff) parts.push(`the phone’s voice took over: ${reasonText(handoff.reason)}`);
  const waits = waitsLine(trip.waits);
  if (waits) parts.push(waits);
  const pace = paceLine(trip.pace);
  if (pace) parts.push(pace);
  return `${parts.join(' · ')}.`;
}

// THE TRIP RIDES WITH A FEEDBACK NOTE (DR-0744; Darrell 2026-10-01: "Why are
// we not able to continue to listen when inside the downloaded app"). A note
// about the reader is worth little without the reader's own account, and the
// person should not have to copy a line out of the panel. A recent trip is
// handed to the form as one line; an old one is not, so a note about
// something else does not carry a stale reading.
export const TRIP_RECENT_MS = 3 * 60 * 60 * 1000;

/** The last trip's line when it started or ended within the window, else ''. Pure. */
export function recentTripLine({ storage = defaultStorage(), now = () => Date.now(), withinMs = TRIP_RECENT_MS } = {}) {
  const trip = createTripLog({ storage, now }).last();
  if (!trip) return '';
  const t = now();
  const last = Math.max(Number(trip.endedAt) || 0, Number(trip.startedAt) || 0);
  if (!last || t - last > withinMs) return '';
  return tripSummary(trip);
}
