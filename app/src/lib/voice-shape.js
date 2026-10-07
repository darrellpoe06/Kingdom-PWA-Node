// =============================================================================
// voice-shape — each voice keeps its own pitch and pace, so one engine can
// sound like several people
// =============================================================================
// Darrell 2026-10-07, on the Firestick: "Can we choose different male and
// female voices... different pitches... or even a pitch and other voice kpi
// sliders to get a unique voice that has the right sound for each individual?"
// And, in the same breath, the measurement that makes it matter: "I only see
// one option other than my own that doesn't work yet until the 4070 does
// something."
//
// WHAT IS ACTUALLY TRUE (DR-0076, measured in use-read-aloud.js's catalog).
// The picker offers three groups: the System voice, the household's own
// recorded voices, and "Voices & accents" — which is whatever
// speechSynthesis.getVoices() hands back on THAT device. A TV browser hands
// back few or none, so on the Firestick the list really is one entry plus his
// own; the sovereign voices need the studio answering. The Web Speech API has
// NO gender field: male and female come from which named voices a device
// offers, never from a setting we can ask for.
//
// SO: PITCH IS THE LEVER WE OWN. The engine has carried a pitch all along
// (tts.js: engine.pitch, u.pitch, setPitch, and the saved pref) — the
// Scripture cast already tells its characters apart with it
// (voice-assignment.js standInPitch). What was missing was a control, and a
// memory: a pitch that belongs to the VOICE, not to the device, so picking a
// voice brings back the sound that was shaped for it. One engine voice plus
// five pitches is five distinguishable readers on a device that offers one.
//
// NAMED STEPS, NOT A SLIDER. A remote's D-pad cannot drag a slider; it can
// land on a chip, and it can tap one button that cycles. So the pitches are
// five named steps with a word apiece, and the rail's button cycles them.
// Pure: no DOM, no fetch. Storage can throw (private window, a TV browser):
// every read falls back, every write is best-effort.

export const VOICE_SHAPE_KEY = 'poetech.voice.shape.v1';
export const DEFAULT_PITCH = 1.0;
export const MIN_PITCH = 0.5;
export const MAX_PITCH = 1.8;

/**
 * The five pitches, lowest first. `label` is the one word under a rail icon;
 * `name` is what the tall panel and the aria-label say.
 */
export const PITCH_STEPS = Object.freeze([
  { value: 0.6, label: 'Deepest', name: 'Deepest — the lowest this voice goes' },
  { value: 0.8, label: 'Deeper', name: 'Deeper — a lower, fuller read' },
  { value: 1.0, label: 'Natural', name: 'Natural — the voice as the device makes it' },
  { value: 1.3, label: 'Lighter', name: 'Lighter — a higher, brighter read' },
  { value: 1.6, label: 'Highest', name: 'Highest — the highest this voice goes' },
]);

export function clampPitch(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return DEFAULT_PITCH;
  return Math.min(MAX_PITCH, Math.max(MIN_PITCH, n));
}

/** The named step a pitch belongs to — the nearest one, never undefined. */
export function pitchStep(pitch) {
  const p = clampPitch(pitch);
  let best = PITCH_STEPS[0];
  for (const s of PITCH_STEPS) if (Math.abs(s.value - p) < Math.abs(best.value - p)) best = s;
  return best;
}

/** The next step up, wrapping back to the lowest — what one tap on the rail does. */
export function nextPitch(pitch) {
  const i = PITCH_STEPS.indexOf(pitchStep(pitch));
  return PITCH_STEPS[(i + 1) % PITCH_STEPS.length].value;
}

function store(s) {
  if (s) return s;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

/** Every shape kept on this device, by voice id. Never throws. */
export function loadVoiceShapes(storage) {
  try {
    const s = store(storage);
    const raw = s ? s.getItem(VOICE_SHAPE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [id, shape] of Object.entries(parsed)) {
      if (!id || !shape || typeof shape !== 'object') continue;
      const pitch = Number(shape.pitch);
      if (Number.isFinite(pitch)) out[id] = { pitch: clampPitch(pitch) };
    }
    return out;
  } catch {
    return {};
  }
}

/** The shape kept for one voice, or the default — never null. */
export function shapeFor(voiceId, shapes) {
  const all = shapes || loadVoiceShapes();
  const one = voiceId ? all[voiceId] : null;
  return { pitch: one && Number.isFinite(Number(one.pitch)) ? clampPitch(one.pitch) : DEFAULT_PITCH };
}

/**
 * Keep a shape for one voice. Returns the whole set so a caller can hold it in
 * state without a second read. A voice shaped back to Natural is forgotten
 * rather than stored, so the file stays the size of what was actually changed.
 */
export function saveVoiceShape(voiceId, shape, storage) {
  const all = loadVoiceShapes(storage);
  if (!voiceId) return all;
  const pitch = clampPitch(shape && shape.pitch);
  if (Math.abs(pitch - DEFAULT_PITCH) < 0.001) delete all[voiceId];
  else all[voiceId] = { pitch };
  try {
    const s = store(storage);
    if (s) {
      if (Object.keys(all).length === 0) s.removeItem(VOICE_SHAPE_KEY);
      else s.setItem(VOICE_SHAPE_KEY, JSON.stringify(all));
    }
  } catch { /* best-effort */ }
  return all;
}

/**
 * How many voices a listener can actually tell apart on this device: every
 * usable voice, times the pitches shaped onto it. One engine voice with five
 * pitches is five readers. Honest about what the device really offers — it
 * counts the catalog it is given, never a hoped-for one.
 */
export function distinctVoices(catalog = [], shapes = {}) {
  const usable = (catalog || []).filter((c) => c && c.usable !== false);
  const shaped = new Set(Object.keys(shapes || {}));
  return {
    voices: usable.length,
    shaped: usable.filter((c) => shaped.has(c.id)).length,
    // what a listener could reach without the studio: each voice at any of the five steps
    reachable: usable.length * PITCH_STEPS.length,
  };
}
