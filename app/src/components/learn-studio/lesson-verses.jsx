// =============================================================================
// lesson-verses -- quoted verses in a lesson's text, wrapped for the reader
// =============================================================================
// Split out of LessonExperience.jsx (file budget). The verse text is never changed: only grouped.
// =============================================================================
import React from 'react';

// A quoted verse with its own reference, e.g. `"...text..." (Colossians 3:23)`
// -- the EXACT original run of characters (quote marks, parens and all) is
// kept intact; this only wraps it in a styled callout, it never rewrites a
// single character of it.
export const VERSE_RE = /"[^"]+"\s*\([^)]+\)/g;

// THE JOINING PUNCTUATION STAYS WITH ITS VERSE (Darrell 2026-11-26: "Too much space in between the
// words"). Between two quoted verses the text is often only "; " or ". ", and each verse is a block,
// so that leftover sat on a line of its own with a block's margin above and below -- a lone ";" and
// a sentence starting with ". ". The leading punctuation of the text after a verse is kept INSIDE
// that verse's span (same characters, same order), so nothing stands alone. Exported for its test.
const LEAD_PUNCT = /^[\s;:,.!?]+/;
export function verseParts(text) {
  const parts = [];
  let last = 0;
  let m;
  VERSE_RE.lastIndex = 0;
  while ((m = VERSE_RE.exec(text))) {
    if (m.index > last) parts.push({ verse: false, text: text.slice(last, m.index) });
    parts.push({ verse: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ verse: false, text: text.slice(last) });
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].verse || !parts[i - 1].verse) continue;
    const lead = (parts[i].text.match(LEAD_PUNCT) || [''])[0];
    if (!lead) continue;
    parts[i - 1].text += lead;
    parts[i].text = parts[i].text.slice(lead.length);
  }
  return parts.filter((p) => p.text.length > 0);
}

export function renderWithVerses(text, keyPrefix) {
  return verseParts(text).map((p, i) =>
    p.verse ? (
      <span className="le-verse" key={`${keyPrefix}-v${i}`}>
        {p.text}
      </span>
    ) : (
      <span key={`${keyPrefix}-t${i}`}>{p.text}</span>
    )
  );
}
