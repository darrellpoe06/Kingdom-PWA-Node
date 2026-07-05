// =============================================================================
// voice-tutor — turn a written study into a SPOKEN, sequential teaching walk
// =============================================================================
// The HEAR-the-teaching half for The Church of the Living God — elderly,
// tech-novice members for whom TALKING with the app beats reading a screen
// (COMMUNITY-FIRST-MISSION; the accessibility default). The pattern is the
// PhysicsWallah/ElevenLabs voice-tutor mapping applied to teaching the Word:
// a member presses one button and HEARS the study taught, section by section,
// with the actual Word read aloud in place — not just the reference.
//
// This module is the PURE, tested core (no React, no browser). It assembles an
// ordered list of speakable segments from a real study object
// (lib/eternal-algorithms-studies.js shape: { title, subtitle, sections:[{
// heading, plain, deep, primaryRef }] }). The component feeds the assembled
// text to the existing read-aloud primitive (lib/tts.js useTextToSpeech) — one
// TTS engine for the whole app (UX-PATTERNS Pattern 2), swappable to a
// premium/sovereign voice later without touching this transform.
//
// WORD-FIRST + VERIFICATION (DR-0076 / DR-0097): the tutor speaks verse text
// ONLY when the caller's resolveVerse() returns it (backed by the in-app KJV —
// scriptures.js / bible-kjv.js). It NEVER fabricates the Word. When a verse is
// unresolved it says, honestly, to open your Bible — mirroring the on-screen
// Verse fallback exactly. "the Word" is capitalized in every framing line (the
// 4th-dimensional frame), never lowercase.
// =============================================================================

// Segment kinds, in the order a study is taught. Each segment is
// { kind, text, ref? } — `text` is what gets spoken; `ref` is carried for
// highlight-as-it-reads / captioning by the caller.
export const SEGMENT_KINDS = Object.freeze(['intro', 'heading', 'teaching', 'verse', 'deep', 'close']);

// Collapse whitespace so the curly-quoted, line-wrapped source strings speak as
// clean prose (the TTS engine segments on sentence punctuation downstream).
function clean(s) {
  return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';
}

// One section → its ordered spoken segments. `resolveVerse(ref) -> string|null`
// returns the in-app KJV text or null; we speak the Word only when it resolves.
function sectionSegments(section, { resolveVerse, includeDeep }) {
  const out = [];
  const heading = clean(section && section.heading);
  const plain = clean(section && section.plain);
  if (heading) out.push({ kind: 'heading', text: heading });
  if (plain) out.push({ kind: 'teaching', text: plain });

  const ref = section && section.primaryRef;
  if (ref) {
    const verse = typeof resolveVerse === 'function' ? clean(resolveVerse(ref)) : '';
    // Speak the actual Word when we have it; otherwise send the listener to their
    // Bible — NEVER read the bare reference as if it were the verse, and never
    // invent text (WORD-FIRST × DR-0076).
    out.push(verse
      ? { kind: 'verse', ref, text: `The Word says, in ${ref}: ${verse}` }
      : { kind: 'verse', ref, text: `Open your Bible to ${ref} and read it there.` });
  }

  if (includeDeep) {
    const deep = clean(section && section.deep);
    if (deep) out.push({ kind: 'deep', text: `Going deeper: ${deep}` });
  }
  return out;
}

// buildTutorScript(study, opts) -> ordered [{ kind, text, ref? }]
//
//   resolveVerse : (ref) => string|null   in-app KJV text for a reference
//   includeDeep  : boolean                also speak each section's deeper layer
//
// Null-safe by contract (the app is unbreakable): a missing/sections-less study
// still returns a coherent intro + close rather than throwing.
export function buildTutorScript(study, { resolveVerse, includeDeep = false } = {}) {
  const segments = [];
  const title = clean(study && study.title);
  const subtitle = clean(study && study.subtitle);

  const introText = title
    ? (subtitle ? `${title}. ${subtitle}.` : `${title}.`)
    : 'A study from the Word.';
  segments.push({ kind: 'intro', text: introText });

  const sections = Array.isArray(study && study.sections) ? study.sections : [];
  for (const section of sections) {
    for (const seg of sectionSegments(section, { resolveVerse, includeDeep })) {
      segments.push(seg);
    }
  }

  segments.push({ kind: 'close', text: 'That is the end of this teaching. Take it to the Lord, and run it.' });
  return segments;
}

// Join an assembled script into one string for tts.speak() (which segments it
// into utterances internally). A blank line between segments gives the engine a
// clean sentence boundary between the heading, the teaching, and the Word.
export function toSpeech(segments) {
  return (Array.isArray(segments) ? segments : [])
    .map((s) => (s && typeof s.text === 'string' ? s.text.trim() : ''))
    .filter(Boolean)
    .join('\n\n');
}
