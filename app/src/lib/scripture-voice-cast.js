// =============================================================================
// scripture-voice-cast — a DRAMATIZED reading: each speaker read in a different
// voice (Darrell 2026-07-04: "When the voice recorder is used maybe a different
// voice depends on the person speaking? That would be fire"). The same verified
// speaker attribution that COLORS the text (scripture-voices) also CASTS the
// audio — Jesus, the Father, the narrator, the tempter each in their own voice.
// One source of truth: what you see color-coded is what you hear voice-cast.
//
// It reuses the existing, tested voice engine (voice-assignment): the CAST is
// just another "catalog," so each speaker is assigned a DISTINCT, gender-correct
// device voice, deterministically. No new speech plumbing — the read-aloud path
// speaks the segments this module produces, each in its cast voiceURI.
//
// HONEST (DR-0076): only VERIFIED speech is cast to a character voice; every
// other word is 'narrator' (the reader's normal voice). We never guess who
// spoke — the attribution comes from scripture-voices, which is quote-verified
// against the real KJV. Pure + unit-tested.
// =============================================================================

import { KIND } from './voice-registry.js';
import { buildStandInAssignments, standInVoiceURI } from './voice-assignment.js';
import { segmentsForVerse } from './scripture-highlights.js';
import { voiceSpansFor, VOICES } from './scripture-voices.js';

// The cast, as a voice-catalog the assignment engine understands. 'narrator' is
// synthetic (it takes the reader's own/system voice); each character asks for a
// gender so a male speaker reads male, and distinct so two characters differ.
// gender 'unknown' lets the engine keep the voice distinct without forcing one.
export const CAST = [
  { id: 'narrator', kind: KIND.SYNTHETIC, gender: 'unknown', label: 'Narrator' },
  { id: 'jesus', kind: KIND.PERSONAL, gender: 'male', label: 'Jesus' },
  { id: 'father', kind: KIND.PERSONAL, gender: 'male', label: 'The Father' },
  { id: 'spirit', kind: KIND.PERSONAL, gender: 'unknown', label: 'The Holy Spirit' },
  { id: 'prophet', kind: KIND.PERSONAL, gender: 'male', label: 'Prophet / apostle' },
  { id: 'wisdom', kind: KIND.PERSONAL, gender: 'unknown', label: 'Wise counsel' },
  { id: 'mary', kind: KIND.PERSONAL, gender: 'female', label: 'Mary' },
  { id: 'woman', kind: KIND.PERSONAL, gender: 'female', label: 'A faithful woman' },
  { id: 'adversary', kind: KIND.PERSONAL, gender: 'unknown', label: 'the adversary' },
];

// The voice keys that carry a real character voice (everything but the narrator).
export const CAST_CHARACTERS = CAST.filter((c) => c.id !== 'narrator').map((c) => c.id);

// Assign each cast member a distinct device voice for THIS device's voice list.
// Deterministic (same device + cast → same mapping). Returns { castId -> voice }.
export function buildCast(availableVoices) {
  return buildStandInAssignments(CAST, availableVoices);
}

// The device voiceURI to speak a given voice key in (or undefined to let the
// engine use its default / the narrator's chosen voice). 'narrator' and unknown
// keys fall through to the reader's normal voice by returning undefined.
export function castVoiceURI(assignments, voiceKey) {
  if (!voiceKey || voiceKey === 'narrator') return undefined;
  return standInVoiceURI(assignments, voiceKey);
}

// Split ONE verse into ordered, voice-tagged runs: [{ text, voice }] where voice
// is 'narrator' for the narration and a character key for the verified quotes.
// Reuses the same segmenter the color view uses, so what is colored is what is
// cast — they can never drift. Pure.
export function segmentByVoice(ref, text) {
  const runs = segmentsForVerse(String(text == null ? '' : text), voiceSpansFor(ref, text));
  return runs.map((r) => ({ text: r.text, voice: r.style === 'none' ? 'narrator' : r.style }));
}

// A whole chapter as an ordered cast SCRIPT ready to speak: for each verse, its
// voice-tagged runs, with adjacent same-voice runs merged (so the engine speaks
// smooth phrases, not choppy fragments). `verses` is [{ v, text }]; `refOf(v)`
// builds the reference string. Returns [{ ref, voice, text }] in reading order.
export function castScript(verses, refOf) {
  const out = [];
  for (const { v, text } of (verses || [])) {
    const ref = refOf(v);
    for (const run of segmentByVoice(ref, text)) {
      const trimmed = run.text;
      if (!trimmed) continue;
      const last = out[out.length - 1];
      if (last && last.voice === run.voice && last.ref === ref) last.text += trimmed;
      else out.push({ ref, voice: run.voice, text: trimmed });
    }
  }
  return out;
}

// The character voices actually used across a set of verses (for a "cast list"
// legend), in CAST order. `refs` is the list of references being read.
export function castPresent(verses, refOf) {
  const hit = new Set();
  for (const { v, text } of (verses || [])) {
    for (const run of segmentByVoice(refOf(v), text)) if (run.voice !== 'narrator') hit.add(run.voice);
  }
  return CAST.filter((c) => c.id !== 'narrator' && hit.has(c.id));
}

// Human labels for the cast, borrowing the voice palette's own labels where they
// match so the audio legend and the color legend read the same.
export function castLabel(voiceKey) {
  const fromVoices = VOICES.find((v) => v.key === voiceKey);
  if (fromVoices) return fromVoices.label;
  const c = CAST.find((x) => x.id === voiceKey);
  return c ? c.label : voiceKey;
}
