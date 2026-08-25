// =============================================================================
// lesson-format — every lesson reads as numbered sections, never a prose wall
// =============================================================================
// Darrell 2026-08-25: "I want all lessons to have the same flow or view or
// look... bullet points with the number next to the sections so we can keep
// the number of points in the lessons... instead of looking like run-on
// sentences... also the text when sharing needs the same clean up so there
// are breaks in the flow of words."
//
// The hard constraint (DR-0281 / the verse-pin gates): NOT ONE WORD may change.
// This formatter only chooses BREAK POINTS at existing spaces and derives
// section numbers from markers the author already wrote (FIRST/SECOND...,
// I./II./III., SOIL 1...). Reconstructing the output with single spaces yields
// the original text exactly — pinned in lesson-format.test.js. Where a lesson
// has no markers, it still gains breathing room: short sentence-grouped lines.
// Pure + deterministic (no Date/Math.random); shared by the render surface
// (ChurchLearn) and the share/copy text (lesson-links).

const ORDINALS = {
  FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4, FIFTH: 5,
  SIXTH: 6, SEVENTH: 7, EIGHTH: 8, NINTH: 9, TENTH: 10,
};
const ROMANS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };

// A section marker at the START of a sentence. Each pattern yields its own
// number, so numbering is stable even when the text is chunked for age pacing.
//   "FIRST, THE TWO WAYS." · "FIFTH — THE HOW." → ordinal word
//   "I. THE PROLOGUE (1:1-4):"                  → roman numeral + capital
//   "SOIL 1, the way side (8:5, 12):"           → SOIL n
const MARKER_RES = [
  { re: /^(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,—:]?/, num: (m) => ORDINALS[m[1]] },
  { re: /^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s+(?=[A-Z“"])/, num: (m) => ROMANS[m[1]] },
  { re: /^SOIL\s+(\d+)\b/, num: (m) => Number(m[1]) },
];

const MAX_LINE = 260; // chars per breath line — one or two sentences, phone-comfortable

// Split normalized text into sentences WITHOUT losing a character: cut after
// . ! ? … (optionally followed by closing quote/paren) when a space + opener
// follows. Verse refs like "(Psalms 1:6)." keep their sentence.
function sentences(text) {
  const out = [];
  let rest = text;
  const CUT = /([.!?…](?:['’”")\]]*))\s+(?=["“(']?[A-Z0-9])/g;
  for (;;) {
    let m;
    let from = 0;
    for (;;) {
      CUT.lastIndex = from;
      m = CUT.exec(rest);
      if (!m) break;
      const candidate = rest.slice(0, m.index + m[1].length);
      // Never cut a roman-numeral movement marker ("I.", "II.") into its own
      // fragment — the period belongs to the marker, and the heading detector
      // needs the marker attached to its title sentence. And never cut after
      // an abbreviation ("Dr.", "Mrs.", "vs.") — that period ends no sentence.
      if (/(?:^|\s)(?:[IVX]{1,4}|Dr|Mr|Mrs|Ms|Jr|Sr|St|vs)\.$/.test(candidate)) { from = m.index + 1; continue; }
      break;
    }
    if (!m) break;
    const end = m.index + m[1].length;
    out.push(rest.slice(0, end));
    rest = rest.slice(end + 1); // the single space consumed by the cut
  }
  if (rest) out.push(rest);
  return out;
}

// A single overlong sentence (heavy with quotes and refs) still gets breathing
// room: split it at existing "; " / " — " / ", " spaces, longest-first, so no
// breath line becomes a wall. Cut points are existing spaces — no word changes.
function splitLong(sentence, max) {
  if (sentence.length <= max) return [sentence];
  for (const sep of ['; ', ' — ', ', ']) {
    const at = sentence.lastIndexOf(sep, max);
    if (at > 40) {
      const head = sentence.slice(0, at + sep.trimEnd().length);
      const tail = sentence.slice(at + sep.length);
      return [head, ...splitLong(tail, max)];
    }
  }
  return [sentence];
}

function markerAt(sentence) {
  for (const { re, num } of MARKER_RES) {
    const m = re.exec(sentence);
    if (m) return { n: num(m) };
  }
  return null;
}

/**
 * formatLessonText(text) -> { items, sectionCount }
 * items: [{ kind: 'heading', n, text } | { kind: 'line', text }]
 * Headings are the author's own marker sentences (whole sentence, untouched);
 * lines are one-or-two-sentence groups. Joining every item's text with single
 * spaces reproduces the normalized input exactly.
 */
export function formatLessonText(text) {
  const clean = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!clean) return { items: [], sectionCount: 0 };
  const items = [];
  let buf = '';
  const flush = () => { if (buf) { items.push({ kind: 'line', text: buf }); buf = ''; } };
  let sectionCount = 0;
  for (const sent of sentences(clean)) {
    const mark = markerAt(sent);
    if (mark) {
      flush();
      sectionCount += 1;
      items.push({ kind: 'heading', n: mark.n, text: sent });
      continue;
    }
    for (const s of splitLong(sent, 320)) {
      if (!buf) { buf = s; continue; }
      if (buf.length + 1 + s.length <= MAX_LINE) { buf = `${buf} ${s}`; continue; }
      flush();
      buf = s;
    }
  }
  flush();
  return { items, sectionCount };
}

/**
 * lessonShareText(text) — the same structure as plain text for copy/share:
 * a blank line before each numbered section, one breath line per row.
 * Every word of the input survives; only line breaks are added.
 */
export function lessonShareText(text) {
  const { items } = formatLessonText(text);
  const rows = [];
  for (const it of items) {
    if (it.kind === 'heading') {
      if (rows.length) rows.push('');
      rows.push(`${it.n}. ${it.text}`);
    } else {
      rows.push(it.text);
    }
  }
  return rows.join('\n');
}
