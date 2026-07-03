// =============================================================================
// EmojiText — texting-grade emoji rendering for user content (2026-07-03).
// =============================================================================
// Renders a plain string with every emoji drawn from the SELF-HOSTED Twemoji
// set (app/public/emoji/ — synced from the pinned package, CC-BY 4.0 credited
// in About), exactly the way texting/social apps ship their own artwork instead
// of trusting the device's emoji font. Identical rendering on every device —
// including the older hardware at COLG (COMMUNITY-FIRST-MISSION).
//
// PROGRESSIVE + HONEST: an emoji outside the curated set falls back to the
// device font the moment its image misses (onError swaps the img for the raw
// character) — never worse than today, never a broken-image icon.
//
// A11y: each image carries the emoji character as alt text, so screen readers
// announce it exactly as they would the character; images are 1em and inherit
// line flow (they scale with the global text-size control for free).
//
// Use for USER CONTENT display (notes, feedback, chat, prayer requests) —
// app CHROME icons stay UiIcon (the consistency guard's lane).
// =============================================================================
import React, { useState } from 'react';
import { segmentEmoji, emojiAssetPath } from '../lib/emoji.js';

const IMG_STYLE = {
  width: '1em',
  height: '1em',
  display: 'inline-block',
  verticalAlign: '-0.125em', // Twemoji's own recommended baseline sit
};

function EmojiGlyph({ char }) {
  const [failed, setFailed] = useState(false);
  const src = emojiAssetPath(char);
  // Outside the curated set (or a load failure): the device font, as before.
  if (failed || !src) return <span>{char}</span>;
  return <img src={src} alt={char} draggable="false" loading="lazy" style={IMG_STYLE} onError={() => setFailed(true)} />;
}

export default function EmojiText({ children, text }) {
  const value = text ?? (typeof children === 'string' ? children : '');
  if (!value) return null;
  const tokens = segmentEmoji(value);
  if (tokens.length === 1 && tokens[0].type === 'text') return <>{value}</>;
  return (
    <>
      {tokens.map((t, i) => t.type === 'emoji'
        ? <EmojiGlyph key={i} char={t.value} />
        : <React.Fragment key={i}>{t.value}</React.Fragment>)}
    </>
  );
}

export { EmojiText };
