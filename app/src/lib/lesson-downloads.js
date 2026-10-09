// =============================================================================
// lesson-downloads — a lesson, a course, or every lesson, kept on this device
// =============================================================================
// Darrell 2026-10-01: "Also the ability to download all lessons at once or
// individually... of course.... make sense?" And, the same day: "Make sure the
// options for just adult or all reading levels as an option for those with and
// without children..."
//
// WHAT A DOWNLOAD KEEPS (DR-0722):
//   * THE WORDS — each saved reading level's lesson text and the exact text the
//     reader speaks for it, in IndexedDB `poe-lesson-words` (small: a few KB a
//     level). The lessons also ride in the app's own files, which the service
//     worker keeps for the build that is running.
//   * THE READING VOICE (optional) — every piece of the NAS voice for that
//     reading, in the same device clip store the reader plays from
//     (lib/clip-cache.js), each piece HELD by name ('<lesson>|<level>') so the
//     least-recently-played clearing never touches it. Pieces are keyed by
//     their words, so a piece two levels share is fetched once and held twice:
//     adding the children's levels later never fetches the adult version again.
//
// THE LEVELS ARE THE LESSON'S OWN. "All reading levels" is every version the
// lesson really carries (resolveForAge per band, the same words counted once):
// a lesson written once for everybody has one version, and "All" is "Adult".
//
// HONEST ABOUT ROOM. Before anything is fetched the plan is sized (words, and
// voice from the measured bytes a character of Piper speech takes), and
// checked against the reading-voice limit the person chose and the device's
// free space (navigator.storage.estimate). Short of either, it says so and
// offers the words alone or a higher limit. A held piece is never cleared to
// make room for another.
//
// Everything here is injectable (storage, clip cache, the voice fetch, the
// words store), so it is proven in tests without a browser or the NAS.
// =============================================================================
import { AGE_BANDS, DEFAULT_AGE_BAND, resolveForAge } from './learn-framework.js';
import { buildLessonArc, readAloudTextFromArc } from './lesson-flow.js';
import { chunkForClips } from './clip-queue.js';
import { clipKey, deviceClipCache, loadCapMb, CAP_CHOICES_MB } from './clip-cache.js';
import { toSpokenForm } from './speech-text.js';
import { forSynthesis } from './synthesis-text.js';
import { synthesizeLite } from './voice-service.js';
import { preferredClipFormat } from './clip-format.js';
import { hasBridgeToken } from './nas-photos.js';
import { provisionBridgeToken } from './bridge-provision.js';
import { supabase } from './supabase.js';
import { holdIntake } from './intake-guard.js';

const MB = 1024 * 1024;

// MEASURED, not guessed. A Piper clip is 16-bit 22,050 Hz mono WAV (DR-0659):
// 44,100 bytes a second. L191 saved whole on the built app was 276 pieces and
// 101 MB (DR-0659): 383,700 bytes a piece. Its spoken pieces here average 87.4
// characters (21,496 over 246), so a character of speech is about 4,400 bytes
// (about ten characters a second). DR-0722 "What was measured".
export const VOICE_BYTES_PER_CHAR = 4400;
export const VOICE_BYTES_PER_PIECE = 44;

// THE PACE IS SAID BEFORE THE DOWNLOAD STARTS (DR-0746; Darrell 2026-10-02,
// L105 with every level and the voice: "Not downloading..." over "0 of 1
// saved" and an empty bar). The reading voice is MADE on the church computer
// as the download runs, one sentence at a time, at about the speed it is
// spoken: measured 2026-10-01 (voice-lite-probe run 36926132891, outside-in
// through poetech.us), six pieces of 861 characters took 43.7 s to make, 19.7
// characters a second on one stream. The download runs two streams (the NAS
// takes two at a time), so a plan's voice is sized in minutes here, from its
// characters, and the run then says its own measured pace as it goes.
export const SYNTH_CHARS_PER_SECOND = 19.7;
export const DOWNLOAD_STREAMS = 2;

/** Seconds the church computer needs to make a plan's voice, from its characters. Pure. */
export function paceSeconds(voiceChars, { streams = DOWNLOAD_STREAMS, charsPerSecond = SYNTH_CHARS_PER_SECOND } = {}) {
  const c = Math.max(0, Number(voiceChars) || 0);
  if (!c) return 0;
  return c / (charsPerSecond * Math.max(1, streams));
}

/** "about 40 seconds", "about 32 minutes", "about 3 hours", "about 2 days". Pure. */
export function paceWords(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (!s) return '';
  if (s < 90) return `about ${Math.max(10, Math.round(s / 10) * 10)} seconds`;
  const min = s / 60;
  if (min < 90) return `about ${Math.round(min)} minutes`;
  const hours = min / 60;
  if (hours < 36) return `about ${hours < 10 ? Math.round(hours * 2) / 2 : Math.round(hours)} hours`;
  return `about ${Math.round(hours / 24)} days`;
}

export const REGISTRY_KEY = 'poe-lesson-downloads-v1';
export const CHOICE_KEY = 'poe-lesson-download-choice';
export const JOB_KEY = 'poe-lesson-download-job';

// The bands, in the order a family reads them; "Adult only" leads.
export const LEVEL_BANDS = AGE_BANDS.map((b) => ({ id: b.id, label: b.label, range: b.range }));
export function bandLabel(id) {
  const b = LEVEL_BANDS.find((x) => x.id === id);
  return b ? b.label : String(id || '');
}

// ---------------------------------------------------------------------------
// Which versions a lesson really has
// ---------------------------------------------------------------------------
/**
 * The versions a lesson carries: one entry per distinct text, the adult first.
 * Each names the band that reads it and the other bands it serves.
 * @returns {{id:string,label:string,range:string,serves:string[]}[]}
 */
export function lessonVersions(module) {
  const m = module || {};
  const order = [DEFAULT_AGE_BAND, ...AGE_BANDS.map((b) => b.id).filter((id) => id !== DEFAULT_AGE_BAND)];
  const byText = new Map();
  const out = [];
  for (const id of order) {
    const r = resolveForAge(m, id);
    const text = (r && r.text) || '';
    if (byText.has(text)) { byText.get(text).serves.push(id); continue; }
    const band = LEVEL_BANDS.find((b) => b.id === id);
    const v = { id, label: band.label, range: band.range, serves: [id] };
    byText.set(text, v);
    out.push(v);
  }
  return out;
}

/** The version band that reads `bandId`'s words for this lesson. */
export function versionFor(module, bandId) {
  const v = lessonVersions(module).find((x) => x.serves.includes(bandId));
  return v ? v.id : DEFAULT_AGE_BAND;
}

// THE CHOICE. 'adult' | 'all' | { pick: [bandIds] }.
export function normalizeChoice(c) {
  if (c === 'adult' || c === 'all') return c;
  if (c && Array.isArray(c.pick)) {
    const pick = LEVEL_BANDS.map((b) => b.id).filter((id) => c.pick.includes(id));
    return pick.length ? { pick } : 'adult';
  }
  return 'adult';
}
export function choiceWords(c) {
  const n = normalizeChoice(c);
  if (n === 'adult') return 'Adult only';
  if (n === 'all') return 'All reading levels';
  return n.pick.map(bandLabel).join(', ');
}

/** The version bands one lesson saves under a choice. */
export function bandsForChoice(module, choice) {
  const c = normalizeChoice(choice);
  const versions = lessonVersions(module);
  if (c === 'adult') return [versionFor(module, DEFAULT_AGE_BAND)];
  if (c === 'all') return versions.map((v) => v.id);
  const want = new Set(c.pick.map((id) => versionFor(module, id)));
  return versions.map((v) => v.id).filter((id) => want.has(id));
}

// ---------------------------------------------------------------------------
// The words and the voice pieces of one level
// ---------------------------------------------------------------------------
/** The context a course reads its lessons in (the same the lesson guide uses). */
export function courseContext(course) {
  const c = course || {};
  return {
    courseKey: (c.meta && c.meta.key) || c.key || '',
    courseTitle: (c.meta && c.meta.title) || '',
    sessionFlow: c.sessionFlow || null,
    handsOnLabel: (c.meta && c.meta.handsOnLabel) || 'In the app',
  };
}

/** Exactly the text the reader speaks for this lesson at this level (TutorPanel's own call). */
export function lessonReading(module, bandId, ctx = {}) {
  return readAloudTextFromArc(buildLessonArc(module, {
    ageBand: bandId, levelOverride: null, sessionFlow: ctx.sessionFlow || null, handsOnLabel: ctx.handsOnLabel || 'In the app',
  }));
}

/** The lesson's written words at this level. */
export function lessonWords(module, bandId) {
  const r = resolveForAge(module || {}, bandId);
  return (r && r.text) || '';
}

/** The voice pieces of a reading: the same cut and key the player uses. */
export function readingPieces(text, voice = 'female') {
  return chunkForClips(String(text || '').trim()).map((c) => {
    const spoken = forSynthesis(toSpokenForm(c.text)); // what the voice is handed, and what keys the clip (DR-0851)
    return { key: clipKey({ voice, text: spoken }), spoken };
  });
}

// A LIGHTER CLIP (DR-0747; Darrell 2026-10-02: "Huge amount of data to
// download... can we make them lighter?"). Opus at 24 kbit/s is 3,000 bytes a
// second against WAV's 44,100: 4,400 x 3,000 / 44,100 = 299 bytes a character,
// plus the Ogg framing (about three in a hundred), 310. A device that plays
// and decodes Opus asks for it (lib/clip-format.js) and is sized by it.
export const VOICE_BYTES_PER_CHAR_BY_FORMAT = Object.freeze({ wav: VOICE_BYTES_PER_CHAR, opus: 310 });

export function pieceBytes(spoken, format = 'wav') {
  const perChar = VOICE_BYTES_PER_CHAR_BY_FORMAT[format] || VOICE_BYTES_PER_CHAR;
  return String(spoken || '').length * perChar + VOICE_BYTES_PER_PIECE;
}

const utf8 = (s) => {
  try { return new TextEncoder().encode(String(s || '')).length; } catch { return String(s || '').length; }
};

export function ownerOf(lessonId, bandId) { return `${lessonId}|${bandId}`; }

// ---------------------------------------------------------------------------
// The registry: what this device holds, by lesson and level
// ---------------------------------------------------------------------------
const listeners = new Set();
const defaultStorage = () => { try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; } };

export function readRegistry(storage = defaultStorage()) {
  try {
    const r = JSON.parse((storage && storage.getItem(REGISTRY_KEY)) || 'null');
    return r && r.lessons && typeof r.lessons === 'object' ? r : { v: 1, lessons: {} };
  } catch { return { v: 1, lessons: {} }; }
}
function writeRegistry(reg, storage = defaultStorage()) {
  try { if (storage) storage.setItem(REGISTRY_KEY, JSON.stringify(reg)); } catch { /* full or private: the store still holds the pieces */ }
  for (const fn of listeners) { try { fn(reg); } catch { /* a listener never breaks a save */ } }
}
export function subscribeDownloads(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** { [bandId]: { words, voice } } for one lesson, or {}. */
export function savedLevels(lessonId, storage) {
  const l = readRegistry(storage).lessons[lessonId];
  return (l && l.levels) || {};
}
export function isSaved(lessonId, storage) { return Object.keys(savedLevels(lessonId, storage)).length > 0; }

function markSaved(storage, { lessonId, courseKey, title, bandId, voice }) {
  const reg = readRegistry(storage);
  const l = reg.lessons[lessonId] || { course: courseKey, title, levels: {} };
  const prev = l.levels[bandId] || {};
  l.course = courseKey || l.course; l.title = title || l.title;
  l.levels[bandId] = { words: prev.words || Date.now(), voice: voice || prev.voice || null };
  reg.lessons[lessonId] = l;
  writeRegistry(reg, storage);
}

/** Is this level (or the version that serves it) saved WITH its voice? */
export function savedVoiceBand(module, bandId, storage) {
  if (!module) return null;
  const levels = savedLevels(module.id, storage);
  const v = versionFor(module, bandId);
  // Saved in the voice the reader will read in; another voice's pieces are other clips.
  return levels[v] && levels[v].voice && levels[v].voice === downloadVoice() ? v : null;
}

/**
 * The reading a downloaded lesson speaks with no connection: the saved text
 * of the version that serves this band, or null when that version's voice was
 * not saved (the reader then says so, DR-0722).
 */
export function savedReadingFor(module, bandId, ctx, storage) {
  const v = savedVoiceBand(module, bandId, storage);
  return v ? lessonReading(module, v, ctx) : null;
}

// The person's choice, remembered as their default.
export function loadChoice(storage = defaultStorage()) {
  try {
    const raw = storage && storage.getItem(CHOICE_KEY);
    if (!raw) return 'adult';
    if (raw === 'adult' || raw === 'all') return raw;
    if (raw.startsWith('pick:')) return normalizeChoice({ pick: raw.slice(5).split(',') });
  } catch { /* fall through */ }
  return 'adult';
}
export function saveChoice(choice, storage = defaultStorage()) {
  const c = normalizeChoice(choice);
  try { if (storage) storage.setItem(CHOICE_KEY, typeof c === 'string' ? c : `pick:${c.pick.join(',')}`); } catch { /* best-effort */ }
  return c;
}

// An unfinished download, remembered so it can be resumed after the app closes.
export function loadJob(storage = defaultStorage()) {
  try { const j = JSON.parse((storage && storage.getItem(JOB_KEY)) || 'null'); return j && j.scope ? j : null; } catch { return null; }
}
export function saveJob(job, storage = defaultStorage()) {
  try { if (storage) { if (job) storage.setItem(JOB_KEY, JSON.stringify(job)); else storage.removeItem(JOB_KEY); } } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// The words store (IndexedDB, Map-backed for tests)
// ---------------------------------------------------------------------------
export function memoryWords() {
  const m = new Map();
  return {
    async put(k, v) { m.set(k, v); },
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async del(k) { m.delete(k); },
    async keys() { return [...m.keys()]; },
    get size() { return m.size; },
  };
}
export function indexedDbWords(name = 'poe-lesson-words') {
  const idb = typeof indexedDB !== 'undefined' ? indexedDB : null;
  if (!idb) return null;
  let dbp = null;
  const db = () => {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = idb.open(name, 1);
        req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('words')) req.result.createObjectStore('words'); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }).catch((e) => { dbp = null; throw e; });
    }
    return dbp;
  };
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(['words'], mode);
      const req = fn(t.objectStore('words'));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  };
  return {
    put: (k, v) => tx('readwrite', (s) => s.put(v, k)),
    get: async (k) => (await tx('readonly', (s) => s.get(k))) || null,
    del: (k) => tx('readwrite', (s) => s.delete(k)),
    keys: async () => (await tx('readonly', (s) => s.getAllKeys())) || [],
  };
}
let sharedWords = null;
export function deviceWords() {
  if (!sharedWords) sharedWords = indexedDbWords() || memoryWords();
  return sharedWords;
}
export function _setDeviceWordsForTests(w) { sharedWords = w; }

// ---------------------------------------------------------------------------
// The voice a download uses: the reader publishes its own (use-read-aloud)
// ---------------------------------------------------------------------------
let currentVoice = 'female';
export function setDownloadVoice(v) { if (v === 'male' || v === 'female') currentVoice = v; }
export function downloadVoice() { return currentVoice; }

// ---------------------------------------------------------------------------
// The plan: what a choice saves, sized before anything is fetched
// ---------------------------------------------------------------------------
/**
 * @param {{module:object, ctx:object}[]} items  lessons with their course context
 * @param {object} o
 * @param {*} o.choice
 * @param {string} [o.voice]
 * @param {Storage} [o.storage]
 * @param {number} [o.yieldEvery]  yield to the page every N lessons (a big plan never freezes it)
 * @returns {Promise<{lessons:number, toSave:number, already:number, levels:number,
 *   wordsBytes:number, voiceBytes:number, pieces:number, work:object[]}>}
 */
export async function planDownload(items, { choice = 'adult', voice = downloadVoice(), storage, yieldEvery = 25, withVoice = true, format = preferredClipFormat() } = {}) {
  const seen = new Set();
  let wordsBytes = 0; let voiceBytes = 0; let voiceChars = 0; let pieces = 0; let levels = 0; let already = 0;
  const work = [];
  const list = Array.isArray(items) ? items : [];
  for (let i = 0; i < list.length; i++) {
    if (yieldEvery && i && i % yieldEvery === 0) await new Promise((r) => setTimeout(r, 0));
    const { module: m, ctx = {} } = list[i] || {};
    if (!m || !m.id) continue;
    const held = savedLevels(m.id, storage);
    const bands = bandsForChoice(m, choice);
    const todo = [];
    for (const b of bands) {
      levels += 1;
      const have = held[b];
      if (have && (!withVoice || have.voice)) continue;
      const reading = lessonReading(m, b, ctx);
      if (!have) wordsBytes += utf8(reading) + utf8(lessonWords(m, b));
      if (withVoice) {
        for (const p of readingPieces(reading, voice)) { if (seen.has(p.key)) continue; seen.add(p.key); pieces += 1; voiceBytes += pieceBytes(p.spoken, format); voiceChars += p.spoken.length; }
      }
      todo.push(b);
    }
    if (!todo.length) { already += 1; continue; }
    work.push({ module: m, ctx, todo });
  }
  return { lessons: list.length, toSave: work.length, already, levels, wordsBytes, voiceBytes, voiceChars, paceSeconds: paceSeconds(voiceChars), pieces, work, withVoice, voice, format, choice: normalizeChoice(choice) };
}

/** "1.2 MB", "340 KB", "3.4 GB" */
export function formatBytes(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b >= 1000 * MB) return `${(b / (1024 * MB)).toFixed(1)} GB`;
  if (b >= MB) return `${b >= 10 * MB ? Math.round(b / MB) : (b / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

// ---------------------------------------------------------------------------
// Room: the limit the person chose, and the device's free space
// ---------------------------------------------------------------------------
/** navigator.storage.estimate(), or null where the browser does not say. */
export async function deviceSpace(nav = (typeof navigator !== 'undefined' ? navigator : undefined)) {
  try {
    if (!nav || !nav.storage || typeof nav.storage.estimate !== 'function') return null;
    const e = await nav.storage.estimate();
    if (!e || !Number.isFinite(e.quota)) return null;
    return { quota: e.quota, usage: e.usage || 0, free: Math.max(0, e.quota - (e.usage || 0)) };
  } catch { return null; }
}
/** Ask the browser to keep this site's storage (never cleared under pressure). */
export async function askToKeep(nav = (typeof navigator !== 'undefined' ? navigator : undefined)) {
  try {
    if (!nav || !nav.storage) return null;
    if (typeof nav.storage.persisted === 'function' && await nav.storage.persisted()) return true;
    if (typeof nav.storage.persist === 'function') return !!(await nav.storage.persist());
  } catch { /* the download still runs */ }
  return null;
}

// Keep a little back so the rest of the app still has room to save a place.
export const SPACE_MARGIN = 50 * MB;

/**
 * Does the plan fit? { fits, short: null|'cap'|'space', needBytes, capBytes,
 * heldBytes, freeBytes, raiseTo (the smallest limit that fits, MB, or null),
 * wordsFit }.
 */
export function checkRoom(plan, { capMb = loadCapMb(), heldBytes = 0, space = null } = {}) {
  const words = plan ? plan.wordsBytes : 0;
  const voice = plan && plan.withVoice ? plan.voiceBytes : 0;
  const capBytes = capMb * MB;
  const freeBytes = space ? Math.max(0, space.free - SPACE_MARGIN) : null;
  const needVoice = heldBytes + voice;
  const spaceOk = freeBytes == null || (words + voice) <= freeBytes;
  const capOk = needVoice <= capBytes;
  const wordsFit = freeBytes == null || words <= freeBytes;
  let raiseTo = null;
  if (!capOk) {
    const mb = CAP_CHOICES_MB.find((c) => c * MB >= needVoice);
    raiseTo = mb && (freeBytes == null || (words + voice) <= freeBytes) ? mb : null;
  }
  return {
    fits: capOk && spaceOk,
    short: !spaceOk ? 'space' : (!capOk ? 'cap' : null),
    needBytes: words + voice, capBytes, heldBytes, freeBytes, raiseTo, wordsFit,
  };
}

/** The reason a lesson could not be saved, in plain words. */
export function reasonWords(code, { capMb } = {}) {
  const c = String(code || '');
  if (c === 'cap') return `The reading-voice limit on this device${capMb ? ` (${formatBytes(capMb * MB)})` : ''} is full.`;
  if (c === 'space') return 'This device has no more free space.';
  if (c === 'offline') return 'No connection: the reading voice comes from the church computer.';
  if (c === 'voice-lite-timeout') return 'The reading voice took too long to answer.';
  if (c === 'voice-lite-503') return 'The reading voice was busy.';
  if (/^voice-lite-40[13]$/.test(c)) return 'The reading voice would not let this device in. Sign in again, then retry.';
  if (c === 'words') return 'The words could not be written to this device.';
  return `The reading voice could not be reached (${c || 'no answer'}).`;
}

// ---------------------------------------------------------------------------
// The run: one lesson at a time, pausable, skipping what is already here
// ---------------------------------------------------------------------------
async function nasPiece(spoken, voice, format) {
  // The same family key a read asks for first (DR-0654): without it every piece is a 401.
  if (!hasBridgeToken()) await provisionBridgeToken(supabase).catch(() => { /* the piece says why */ });
  let got = await synthesizeLite({ text: spoken, voice, format });
  for (let tries = 0; got.error === 'voice-lite-503' && tries < 4; tries++) {
    await new Promise((r) => setTimeout(r, 600 * (tries + 1)));
    got = await synthesizeLite({ text: spoken, voice, format });
  }
  if (got.url) { try { URL.revokeObjectURL(got.url); } catch { /* ignore */ } }
  return got;
}

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * Save every lesson in the plan. Progress counts LESSONS ("124 of 750 saved").
 * @param {object} o
 * @param {object} o.plan             from planDownload
 * @param {{paused?:boolean, aborted?:boolean}} [o.signal]
 * @param {(p:object) => void} [o.onProgress]
 * @param {object} [o.deps]  { cache, words, fetchPiece(spoken, voice), storage, roomFor(bytes) => null|'cap'|'space', offline() }
 * @returns {Promise<{total, saved, skipped, failed:{lessonId,title,reason}[], voiceStopped:null|string, cancelled:boolean, bytes:number}>}
 */
export async function runDownload({ plan, signal = {}, onProgress, deps = {} }) {
  // NOTHING INTERRUPTS WORDS COMING IN (DR-0748): a running download holds
  // the app still (no update reload under it), released however the run ends.
  const releaseHold = holdIntake('download');
  try {
    return await runDownloadHeld({ plan, signal, onProgress, deps });
  } finally {
    releaseHold();
  }
}

async function runDownloadHeld({ plan, signal, onProgress, deps }) {
  const cache = deps.cache || deviceClipCache();
  const words = deps.words || deviceWords();
  const fetchPiece = deps.fetchPiece || nasPiece;
  const storage = deps.storage !== undefined ? deps.storage : defaultStorage();
  const offline = deps.offline || isOffline;
  const roomFor = deps.roomFor || (async () => null);
  const voice = plan.voice || downloadVoice();
  const total = plan.lessons;
  let saved = 0; let bytes = 0; let voiceStopped = null;
  const skipped = plan.already;
  const failed = [];
  // THE PIECES ARE COUNTED TOO (DR-0746). A lesson with every level and the
  // voice is hundreds of pieces made one by one on the church computer; a bar
  // that moves only when a whole lesson lands reads as "not downloading".
  // So the progress also carries the pieces done of the plan's pieces, the
  // characters made (the pace is measured from them), when the last one
  // landed, and the last thing the voice said when it would not answer.
  const now = (deps.now || Date.now);
  const startedAt = now();
  const piecesTotal = plan.withVoice ? (Number(plan.pieces) || 0) : 0;
  let piecesDone = 0; let piecesHeld = 0; let charsDone = 0; let lastPieceAt = startedAt; let lastError = null;
  // A piece is counted once in a run, as the plan counts it: the same
  // sentence in two levels is one piece, held or fetched, never two.
  const counted = new Set();
  let currentTitle = null;
  const report = (current) => {
    if (current !== undefined) currentTitle = current;
    if (!onProgress) return;
    const elapsed = Math.max(0.001, (now() - startedAt) / 1000);
    onProgress({
      total, done: saved + skipped + failed.length, saved, skipped, failed: failed.slice(), bytes, voiceStopped, current: currentTitle,
      pieces: { done: piecesDone + piecesHeld, total: piecesTotal, fetched: piecesDone, held: piecesHeld },
      charsDone, charsPerSecond: charsDone / elapsed, startedAt, lastPieceAt, lastError,
    });
  };
  report(null);
  for (const job of plan.work) {
    while (signal.paused && !signal.aborted) await new Promise((r) => setTimeout(r, 200));
    if (signal.aborted) break;
    const m = job.module;
    report(m.title || m.id);
    let reason = null;
    for (const bandId of job.todo) {
      const reading = lessonReading(m, bandId, job.ctx);
      const t = { bandId, reading, words: lessonWords(m, bandId), pieces: plan.withVoice ? readingPieces(reading, voice) : [] };
      const owner = ownerOf(m.id, t.bandId);
      // The words first: small, and they never need the network.
      try {
        await words.put(owner, { lessonId: m.id, bandId: t.bandId, course: job.ctx.courseKey || '', title: m.title || '', words: t.words, reading: t.reading, at: Date.now() });
      } catch { reason = reason || 'words'; continue; }
      markSaved(storage, { lessonId: m.id, courseKey: job.ctx.courseKey, title: m.title, bandId: t.bandId, voice: null });
      if (!plan.withVoice || voiceStopped) continue;
      // The voice: each piece held by this lesson-level; a piece on the device is held, not fetched.
      let ok = true;
      const missing = [];
      const seenHere = new Set();
      for (const p of t.pieces) {
        // The same sentence twice in one level is one key: pinned once,
        // fetched once (two workers used to fetch it twice, side by side).
        if (seenHere.has(p.key)) continue;
        seenHere.add(p.key);
        if (await cache.has(p.key)) {
          await cache.pin(p.key, owner);
          if (!counted.has(p.key)) { counted.add(p.key); piecesHeld += 1; }
        } else missing.push(p);
      }
      if (piecesHeld) report();
      const need = missing.reduce((n, p) => n + pieceBytes(p.spoken, plan.format || 'wav'), 0);
      const short = need ? await roomFor(need) : null;
      if (short) { voiceStopped = short; reason = reason || short; ok = false; }
      else if (missing.length && offline()) { reason = reason || 'offline'; ok = false; }
      let next = 0;
      const worker = async () => {
        while (ok && next < missing.length) {
          if (signal.aborted) { ok = false; return; }
          const p = missing[next++];
          let got;
          try { got = await fetchPiece(p.spoken, voice, plan.format || 'wav'); } catch (e) { got = { error: (e && e.message) || 'fetch-failed' }; }
          if (got && got.blob && got.blob.size && await cache.put(p.key, got.blob, { pin: owner })) {
            bytes += got.blob.size; lastPieceAt = now(); lastError = null;
            if (!counted.has(p.key)) { counted.add(p.key); piecesDone += 1; charsDone += p.spoken.length; }
            report();
            continue;
          }
          ok = false; reason = reason || (got && got.error) || 'fetch-failed'; lastError = reason;
          report();
        }
      };
      if (ok && missing.length) await Promise.all([worker(), worker()]);
      if (ok) markSaved(storage, { lessonId: m.id, courseKey: job.ctx.courseKey, title: m.title, bandId: t.bandId, voice });
    }
    if (signal.aborted && !reason) break;
    if (reason) failed.push({ lessonId: m.id, title: m.title || m.id, reason });
    else saved += 1;
    report();
  }
  const out = { total, saved, skipped, failed, voiceStopped, cancelled: !!signal.aborted, bytes };
  if (onProgress) {
    const elapsed = Math.max(0.001, (now() - startedAt) / 1000);
    onProgress({
      ...out, done: saved + skipped + failed.length, finished: true, current: null,
      pieces: { done: piecesDone + piecesHeld, total: piecesTotal, fetched: piecesDone, held: piecesHeld },
      charsDone, charsPerSecond: charsDone / elapsed, startedAt, lastPieceAt, lastError,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Remove: a lesson, a course, or everything
// ---------------------------------------------------------------------------
/**
 * @param {object} o
 * @param {(entry:{lessonId:string, course:string}) => boolean} o.which
 * @returns {Promise<{lessons:number, freed:number}>}
 */
export async function removeDownloads({ which = () => true, deps = {} } = {}) {
  const cache = deps.cache || deviceClipCache();
  const words = deps.words || deviceWords();
  const storage = deps.storage !== undefined ? deps.storage : defaultStorage();
  const reg = readRegistry(storage);
  const owners = new Set();
  let lessons = 0;
  for (const [lessonId, l] of Object.entries(reg.lessons)) {
    if (!which({ lessonId, course: l.course })) continue;
    lessons += 1;
    for (const b of Object.keys(l.levels || {})) owners.add(ownerOf(lessonId, b));
    delete reg.lessons[lessonId];
  }
  let freed = 0;
  if (owners.size) {
    freed = await cache.unpinWhere((p) => owners.has(p));
    for (const o of owners) { try { await words.del(o); } catch { /* next */ } }
  }
  writeRegistry(reg, storage);
  return { lessons, freed };
}

/** Bytes the downloads hold on the device (the reading voice). */
export async function heldVoiceBytes(cache = deviceClipCache()) {
  try { return await cache.pinnedBytes(); } catch { return 0; }
}
