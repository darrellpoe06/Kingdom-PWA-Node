// =============================================================================
// kept-recording — a spoken lesson stays on the device until it is actually sent
// =============================================================================
// Darrell, 2026-10-09, after the Pages-Functions outage swallowed a lesson he
// and Christina had just recorded: "Why wouldn't it also be on my cellphone?"
//
// MEASURED, which is what makes this a defect and not a preference
// (DR-0076 §4). Before this file:
//
//   OneVoiceInput.jsx:161   const [lessonTake, setLessonTake] = useState(null);
//                           // { blob, url, seconds, verdict }   ← MEMORY ONLY
//   OneVoiceInput.jsx:198   writeDraft(surface, { text, route, name });
//                           // the draft keeps TEXT, ROUTE and NAME. No blob.
//
// So the autosave that exists for typed words — Christina's own ask, 2026-07-10,
// "when you stall out with time or forget and come back, your information is
// still there" — never covered the recording. What survived a reload was the
// LINE of text the recorder writes into the box ("Spoken lesson, 14:05 (the
// words come back from Whisper)") and the remembered name choice. The audio
// behind that line did not. The screen therefore kept showing a lesson waiting
// to send after the recording it referred to was already gone — the worst
// shape a loss can take, because it looks exactly like a lesson that is fine.
//
// That is what the 2026-10-09 outage did: every POST through poetech.us
// answered 405 with an empty body for hours, the send died, and the words two
// people had just spoken had nowhere to wait.
//
// THE RULE THIS KEEPS: a recording is written to the device the moment it is
// taken, and removed only when it has actually been delivered. A send that
// fails — outage, dead battery, closed tab, a walk out of signal — leaves the
// recording exactly where the person can send it again.
//
// Fail-soft everywhere: private mode, a full disk, a browser with no
// IndexedDB, a blob that will not round-trip. None of it may break recording,
// and none of it may claim a recording is kept when it is not. The backend is
// injectable (the same memoryBackend()/indexedDbBackend() pair clip-cache uses),
// so the whole contract is proven without a browser.
// =============================================================================
import { memoryBackend, indexedDbBackend } from './clip-cache.js';

/** Its own database, so clearing cached reading clips never drops a lesson. */
export const KEPT_DB = 'poe-kept-recordings';

/** One kept take per surface — the Thinking Space has one recorder. */
export function keptKey(surface) {
  return `take:${String(surface || 'default')}`;
}

// A take nobody sent in two weeks is not a draft any more, it is litter. The
// window is generous on purpose: the person is the one who decides a recording
// is finished with, and an outage can easily outlast a weekend.
export const KEEP_MS = 14 * 24 * 60 * 60 * 1000;

let shared = null;
/** The device store, or null where the browser gives us nowhere to write. */
function backendOf(opts) {
  if (opts && opts.backend !== undefined) return opts.backend;
  if (shared === undefined || shared === null) shared = indexedDbBackend(KEPT_DB);
  return shared;
}
/** Tests reset the memoized device backend. */
export function resetKeptBackendForTests(b = null) { shared = b; }

/**
 * Write the take to the device. Returns true only when it is genuinely stored
 * — never when the store refused it, so a caller can tell the person the truth.
 */
export async function keepRecording(surface, take, opts = {}) {
  const be = backendOf(opts);
  const blob = take && take.blob;
  if (!be || !blob) return false;
  const now = typeof opts.now === 'function' ? opts.now() : Date.now();
  try {
    await be.put(keptKey(surface), blob, {
      at: now,
      seconds: Number(take.seconds) || 0,
      type: (blob && blob.type) || '',
      size: (blob && blob.size) || 0,
      kind: take.kind || null,
    });
    return true;
  } catch (_) {
    return false; // a device that cannot keep it must not pretend it did
  }
}

/**
 * The kept take, shaped like the one the recorder hands over so the Send path
 * needs no second case: { blob, seconds, at, type, kind }. null when there is
 * none, when it has aged out, or when anything at all goes wrong reading it.
 *
 * `verdict` is NOT stored and NOT invented here: the recorder's own check ran
 * when the take was made, and a stored take is by definition one that passed
 * it. The caller supplies the verdict shape it needs.
 */
export async function readKeptRecording(surface, opts = {}) {
  const be = backendOf(opts);
  if (!be) return null;
  const now = typeof opts.now === 'function' ? opts.now() : Date.now();
  const maxAge = Number.isFinite(opts.keepMs) ? opts.keepMs : KEEP_MS;
  try {
    const key = keptKey(surface);
    const meta = (await be.getMeta(key)) || null;
    if (!meta) return null;
    if (Number.isFinite(meta.at) && now - meta.at > maxAge) {
      await dropKeptRecording(surface, opts);
      return null;
    }
    const blob = await be.get(key);
    if (!blob || !blob.size) {
      // Meta without its audio is a half-written take: clear it rather than
      // offer a Send that would deliver nothing.
      await dropKeptRecording(surface, opts);
      return null;
    }
    return {
      blob,
      seconds: Number(meta.seconds) || 0,
      at: Number(meta.at) || now,
      type: meta.type || blob.type || '',
      kind: meta.kind || null,
    };
  } catch (_) {
    return null;
  }
}

/** Forget it — called when it is delivered, re-recorded, or thrown away. */
export async function dropKeptRecording(surface, opts = {}) {
  const be = backendOf(opts);
  if (!be) return false;
  try {
    await be.del(keptKey(surface));
    return true;
  } catch (_) {
    return false;
  }
}

/** A memory-backed store for tests, matching the device store's shape. */
export function keptMemoryBackend() { return memoryBackend(); }
