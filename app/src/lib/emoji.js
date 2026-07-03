// =============================================================================
// emoji — texting-grade emoji for user content (Darrell 2026-07-03: "emoji
// should work like texting and social media apps do" → "Yes. Scope and
// implement it.")
// =============================================================================
// WHY: an emoji character in a web app renders through the DEVICE's emoji font
// — rich on a modern phone, tofu (□) on older devices (the exact class COLG's
// elderly-staff hardware hits; COMMUNITY-FIRST-MISSION). Texting/social apps
// don't trust the device: they ship their own emoji artwork. This module does
// the same, SELF-HOSTED (sovereignty — no CDN at runtime): a curated set of
// Twemoji SVGs lives in app/public/emoji/ (synced from the pinned @twemoji/svg
// package by scripts/sync-emoji-assets.mjs; graphics CC-BY 4.0, credited in
// the app). Rendering is PROGRESSIVE: bundled emoji render as crisp identical
// images on every device; an emoji outside the curated set falls back to the
// device font — exactly today's behavior, never worse.
//
// PURE: segmentation + filename mapping are dependency-free and node-testable.
// The <EmojiText> component (components/EmojiText.jsx) owns the DOM.
//
// TWEMOJI FILENAME RULE (verified against the real package by the sync script,
// which HARD-FAILS on a miss — proven-to-catch): codepoints joined with '-',
// with U+FE0F (variation selector) dropped UNLESS the sequence contains a ZWJ
// (U+200D). E.g. ❤️ -> '2764', ❤️‍🔥 -> '2764-fe0f-200d-1f525'.
// =============================================================================

// Matches one full emoji "unit": an extended-pictographic base (or keycap/flag
// pair), optional VS16, optional skin-tone modifier, then any ZWJ continuations.
export const EMOJI_RE = /(?:\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️)?(?:\p{Emoji_Modifier})?(?:‍(?:\p{Extended_Pictographic}|\p{Emoji_Modifier_Base})(?:️)?(?:\p{Emoji_Modifier})?)*)/gu;

// Emoji string -> Twemoji asset basename (no extension).
export function emojiToName(emoji) {
  const points = Array.from(String(emoji || '')).map((c) => c.codePointAt(0));
  if (!points.length) return '';
  const hasZwj = points.includes(0x200d);
  const kept = hasZwj ? points : points.filter((p) => p !== 0xfe0f);
  return kept.map((p) => p.toString(16)).join('-');
}

// Where the self-hosted asset lives (Vite serves /public at the site root).
export function emojiAssetPath(emoji) {
  const name = emojiToName(emoji);
  return name ? `/emoji/${name}.svg` : '';
}

// Split text into [{ type: 'text'|'emoji', value }] tokens. Pure; total.
export function segmentEmoji(text) {
  const s = String(text ?? '');
  if (!s) return [];
  const out = [];
  let last = 0;
  for (const m of s.matchAll(EMOJI_RE)) {
    if (m.index > last) out.push({ type: 'text', value: s.slice(last, m.index) });
    out.push({ type: 'emoji', value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ type: 'text', value: s.slice(last) });
  return out;
}

export function hasEmoji(text) {
  EMOJI_RE.lastIndex = 0;
  return EMOJI_RE.test(String(text ?? ''));
}

// =============================================================================
// THE CURATED SET — what ships self-hosted. Everything here renders identically
// on every device; anything else falls back to the device font (honest
// progressive enhancement). Curated for how this family + church actually
// write: warm smileys, prayer/worship, hearts, the affirmation gestures with
// their skin tones, celebration, and the Word. Extend by adding the character
// here and re-running `node scripts/sync-emoji-assets.mjs` (which verifies the
// asset exists — a typo cannot ship silently).
// =============================================================================
export const CURATED_EMOJI = [
  // smileys — warm + expressive
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉',
  '😌', '😍', '🥰', '😘', '😋', '😎', '🤗', '🤔', '😐', '😏', '🙃', '🥲',
  '😢', '😭', '😤', '😠', '😳', '🥺', '😴', '🤯', '🤩', '🥳', '😷', '🤒',
  '😬', '😔', '😞', '😟', '🙁', '😲', '😥', '😓', '🤝',
  // hearts
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '❤️‍🔥', '❤️‍🩹',
  // gestures — all six skin tones for the ones the family uses most
  '👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿',
  '👎', '👏', '👏🏻', '👏🏼', '👏🏽', '👏🏾', '👏🏿',
  '🙏', '🙏🏻', '🙏🏼', '🙏🏽', '🙏🏾', '🙏🏿',
  '🙌', '🙌🏻', '🙌🏼', '🙌🏽', '🙌🏾', '🙌🏿',
  '👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿',
  '💪', '💪🏻', '💪🏼', '💪🏽', '💪🏾', '💪🏿',
  '🫡', '✌️', '🤞', '👌', '✊', '👊', '🤲', '👐', '✋', '🖐️', '☝️', '👆', '👇', '👈', '👉',
  // faith · worship · the Word
  '📖', '📜', '✝️', '⛪', '🕊️', '🐑', '🦁', '👑', '🍞', '🍇', '💧', '🚪',
  '🌾', '🌱', '🌿', '⭐', '🌟', '✨', '☀️', '🌈', '🔥', '💡', '🕯️',
  // celebration + affirmation
  '🎉', '🎊', '💯', '✅', '❌', '⚡', '🏆', '🥇', '🎯', '📈', '📉', '🎵',
  '🎶', '🎤', '🎁', '🌹', '🌸', '🌻', '💐',
  // family · home · work
  '👨‍👩‍👧‍👦', '👪', '🏠', '🏡', '🏘️', '🚗', '💰', '💵', '🧾', '📅', '📌', '📍',
  '🔑', '🛠️', '🔧', '⏰', '📱', '💻', '📷', '🍽️', '☕', '🍕', '🎂', '🧺',
  // nature + weather (the everyday texture of family notes)
  '🌧️', '⛅', '❄️', '🌊', '🌍', '🌙', '🐕', '🐈', '🦋', '🐝',
];

// The de-duplicated asset names the sync script materializes.
export function curatedAssetNames() {
  return [...new Set(CURATED_EMOJI.map(emojiToName).filter(Boolean))];
}
