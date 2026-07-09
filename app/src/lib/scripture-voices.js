// =============================================================================
// scripture-voices — the "who is speaking" color code (Darrell 2026-07-04). The
// red-letter Bible, generalized so a reader LEARNS the voices by their color:
// "I remember knowing everything Jesus said was in red... imagine if the evil
// voices are in another color and the good wise choices are in another."
//
// Jesus' words are RED — and that is on purpose: red is reserved for the Blood /
// the Son (DR-0099). The Son's words wear the Son's color. The tempter / the
// deceiver reads COLD and dishonored (never red). The Father, the Holy Spirit,
// the faithful prophet, and godly counsel each get their own steady color, so the
// eye comes to know the speaker before the mind reads the name.
//
// HONEST BY CONSTRUCTION (DR-0076): we do NOT guess who spoke. Every colored
// stretch is a QUOTE stored verbatim; the builder finds that exact quote inside
// the verse's real KJV text, and a test proves every quote exists verbatim in the
// shipped Bible. Where a speaker is not verified, the words render plain — never
// attributed by guess. The set is small and TRUE, and it grows verse by verified
// verse. Verbatim quotes keep their source capitalization inside the quote
// (DR-0076 honest edge) — e.g. the KJV's own "Satan".
// =============================================================================

// The voices palette. `css` is spread onto the spoken text; every color clears
// WCAG AA on the white verse card. Only Jesus is red (the Blood — DR-0099); the
// adversary is a cold grey-violet AND italic, so an evil voice is distinct even
// to a reader who cannot separate the hues.
export const VOICES = [
  {
    key: 'jesus', label: 'Jesus', meaning: 'the words of the Son — red-letter',
    swatch: '#B01E1E', css: { color: '#B01E1E', fontWeight: 600 },
  },
  {
    key: 'father', label: 'The Father', meaning: 'Yahweh speaking — the Father’s own voice',
    swatch: '#8A5A00', css: { color: '#8A5A00', fontWeight: 600 },
  },
  {
    key: 'spirit', label: 'The Holy Spirit', meaning: 'the Spirit speaking',
    swatch: '#0E7490', css: { color: '#0E7490', fontWeight: 600 },
  },
  {
    key: 'prophet', label: 'Prophet / apostle', meaning: 'a servant carrying God’s word',
    swatch: '#1F5AA6', css: { color: '#1F5AA6', fontWeight: 600 },
  },
  {
    key: 'wisdom', label: 'Wise counsel', meaning: 'godly, faithful human words',
    swatch: '#2F6B33', css: { color: '#2F6B33', fontWeight: 600 },
  },
  {
    key: 'adversary', label: 'the adversary', meaning: 'the tempter, the deceiver — a cold, dishonored voice',
    swatch: '#5A5570', css: { color: '#5A5570', fontStyle: 'italic' },
  },
];

const BY_VOICE = Object.fromEntries(VOICES.map((v) => [v.key, v]));
const KNOWN = new Set(VOICES.map((v) => v.key));

// The React inline-style for a voice — always an object, safe to spread. Unknown
// / 'none' resolves to plain so untagged text renders in the surface's own style.
export function cssForVoice(key) {
  const v = BY_VOICE[key];
  return v ? { ...v.css } : {};
}

// The verified attributions. Each: a reference, the EXACT quote spoken (a verbatim
// substring of that verse's KJV text), and whose voice it is. Small and true; it
// grows. The narration around a quote ("And the serpent said unto the woman,")
// stays plain — only the spoken words are colored, the way a red-letter Bible does.
export const VOICE_QUOTES = [
  // The Fall — the serpent's first lie (Genesis 3).
  { ref: 'Genesis 3:1', voice: 'adversary', quote: 'Yea, hath God said, Ye shall not eat of every tree of the garden?' },
  { ref: 'Genesis 3:4', voice: 'adversary', quote: 'Ye shall not surely die' },
  { ref: 'Genesis 3:5', voice: 'adversary', quote: 'For God doth know that in the day ye eat thereof, then your eyes shall be opened, and ye shall be as gods, knowing good and evil.' },
  // Creation — the Father speaks the worlds into being (Genesis 1). EVERY "And God
  // said…" is the Father's own voice (Darrell 2026-07-04: "all the God said should
  // be highlighted in the correct color"). Only the spoken words are colored; the
  // narration ("And God said," / "and it was so") stays plain. Verbatim (DR-0076).
  { ref: 'Genesis 1:3', voice: 'father', quote: 'Let there be light' },
  { ref: 'Genesis 1:6', voice: 'father', quote: 'Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.' },
  { ref: 'Genesis 1:9', voice: 'father', quote: 'Let the waters under the heaven be gathered together unto one place, and let the dry land appear' },
  { ref: 'Genesis 1:11', voice: 'father', quote: 'Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth' },
  { ref: 'Genesis 1:14', voice: 'father', quote: 'Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:' },
  { ref: 'Genesis 1:20', voice: 'father', quote: 'Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.' },
  { ref: 'Genesis 1:22', voice: 'father', quote: 'Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.' },
  { ref: 'Genesis 1:24', voice: 'father', quote: 'Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind' },
  { ref: 'Genesis 1:26', voice: 'father', quote: 'Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.' },
  { ref: 'Genesis 1:28', voice: 'father', quote: 'Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.' },
  { ref: 'Genesis 1:29', voice: 'father', quote: 'Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.' },
  // The Temptation — the tempter's voice COLD, Jesus' answers RED (Matthew 4).
  { ref: 'Matthew 4:3', voice: 'adversary', quote: 'If thou be the Son of God, command that these stones be made bread.' },
  { ref: 'Matthew 4:4', voice: 'jesus', quote: 'It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.' },
  { ref: 'Matthew 4:6', voice: 'adversary', quote: 'If thou be the Son of God, cast thyself down: for it is written, He shall give his angels charge concerning thee: and in their hands they shall bear thee up, lest at any time thou dash thy foot against a stone.' },
  { ref: 'Matthew 4:7', voice: 'jesus', quote: 'It is written again, Thou shalt not tempt the Lord thy God.' },
  { ref: 'Matthew 4:9', voice: 'adversary', quote: 'All these things will I give thee, if thou wilt fall down and worship me.' },
  { ref: 'Matthew 4:10', voice: 'jesus', quote: 'Get thee hence, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.' },
  // The great I AM saying (John 14) and the Luke parallel of the Temptation.
  { ref: 'John 14:6', voice: 'jesus', quote: 'I am the way, the truth, and the life: no man cometh unto the Father, but by me.' },
  { ref: 'Luke 4:8', voice: 'jesus', quote: 'Get thee behind me, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.' },
];

// Attributions grouped by reference for O(1) lookup while rendering a chapter.
const BY_REF = (() => {
  const map = {};
  for (const q of VOICE_QUOTES) {
    if (!KNOWN.has(q.voice)) continue; // guard: never emit a color that isn't in the palette
    (map[q.ref] || (map[q.ref] = [])).push(q);
  }
  return map;
})();

// The colored spans for one verse: find each verified quote inside the verse's
// real text and return { start, end, style } (style = voice key) for the reader's
// segmenter. A quote that is NOT found verbatim is skipped (fail-soft) — the test
// makes sure that never happens for the shipped data. Pure.
export function voiceSpansFor(ref, text) {
  const list = BY_REF[ref];
  if (!list) return [];
  const str = String(text == null ? '' : text);
  const spans = [];
  for (const q of list) {
    const idx = str.indexOf(q.quote);
    if (idx >= 0) spans.push({ start: idx, end: idx + q.quote.length, style: q.voice });
  }
  return spans;
}

// True if any verse in a chapter carries a verified voice (so the reader can show
// a "no voices tagged here yet" note honestly instead of an empty legend).
export function refHasVoices(ref) {
  return Array.isArray(BY_REF[ref]) && BY_REF[ref].length > 0;
}

// The distinct voices present across a set of references, in palette order — the
// live legend for what the reader is looking at.
export function voicesPresent(refs) {
  const hit = new Set();
  for (const r of refs || []) for (const q of (BY_REF[r] || [])) hit.add(q.voice);
  return VOICES.map((v) => v.key).filter((k) => hit.has(k));
}

export const VOICES_SOURCE = {
  name: 'PoeTech red-letter voices',
  note: 'Speaker color-coding, every quote verified verbatim against the shipped KJV; grows verse by verse.',
};
