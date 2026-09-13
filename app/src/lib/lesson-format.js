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
const MAX_POINT = 700; // an uncited stretch still closes as a point by here

// The thought has LANDED when its sentence closes on a Scripture citation:
// "... (Psalms 1:6)." / "(Luke 8:12-15)" / "(1 John 2:3-4; Amos 3:3)." —
// a trailing parenthetical containing a chapter:verse.
function endsWithCitation(sentence) {
  const m = /\(([^()]*)\)['’”"]?[.!?…]?$/.exec(sentence);
  return !!(m && /\d+:\d+/.test(m[1]));
}

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
 * formatLessonText(text, { startAt }) -> { items, sectionCount, pointCount, nextStart }
 * items: [{ kind: 'heading', n, text } | { kind: 'point', p, lines } | { kind: 'line', text }]
 * Headings are the author's own marker sentences (whole sentence, untouched);
 * lines are one-or-two-sentence groups. Joining every item's text with single
 * spaces reproduces the normalized input exactly.
 *
 * ONE CHRONOLOGICAL COUNT PER LESSON (Darrell 2026-08-25, reviewing the first
 * points build: "each point would be chronological not for each section... 1-3
 * and restarting 1-3 again in the same lesson is very confusing... the whole
 * lesson should be building and the points are supposed to be associated with
 * each other never starting over inside the same lesson"). A lesson body is
 * PACED into segments for the reader's age band, and each segment used to
 * derive its own 1..K — restarting at every step. Now derived points take
 * `startAt` and report `nextStart`, so a caller rendering segments in order
 * threads one running count through the whole lesson. Author-marked sections
 * keep the speaker's own numbers (FIRST=1... SOIL 4=4) — those are chunk-stable
 * by construction and are never overridden by the machine.
 */
export function formatLessonText(text, { startAt = 1 } = {}) {
  const clean = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!clean) return { items: [], sectionCount: 0, pointCount: 0, nextStart: startAt };
  // THE POINT MODEL (Darrell 2026-08-25, refined live: "numbers on all
  // lessons... points of the messages... not every breath line... more like
  // after the main point is made from each section... maybe 3 to 6 points...
  // for the whole lesson"). Where the author wrote section markers, those
  // sections ARE the numbered points. Where no markers exist, the machine
  // derives 3-6 main points for the whole lesson: thought-atoms close where a
  // sentence lands on its Scripture citation (or at ~MAX_POINT chars), then
  // the atoms merge into K contiguous points sized by lesson length.
  const sents = sentences(clean);
  const hasMarkers = sents.some((s) => markerAt(s));
  const toLines = (sentList) => {
    const lines = [];
    let buf = '';
    for (const sent of sentList) {
      for (const s of splitLong(sent, 320)) {
        if (!buf) { buf = s; continue; }
        if (buf.length + 1 + s.length <= MAX_LINE) { buf = `${buf} ${s}`; continue; }
        lines.push(buf); buf = s;
      }
    }
    if (buf) lines.push(buf);
    return lines;
  };

  const items = [];
  if (hasMarkers) {
    let sectionCount = 0;
    let body = [];
    const flushBody = () => {
      for (const line of toLines(body)) items.push({ kind: 'line', text: line });
      body = [];
    };
    for (const sent of sents) {
      const mark = markerAt(sent);
      if (mark) {
        flushBody();
        sectionCount += 1;
        items.push({ kind: 'heading', n: mark.n, text: sent });
      } else {
        body.push(sent);
      }
    }
    flushBody();
    // The speaker's own count governs; the next number after their last section
    // keeps any following derived content in the same chronological run.
    const lastN = items.reduce((mx, it) => (it.kind === 'heading' ? Math.max(mx, it.n) : mx), 0);
    return { items, sectionCount, pointCount: sectionCount, nextStart: Math.max(startAt, lastN + 1) };
  }

  // Unmarked: atoms → K points (3..6, sized by length, never more than atoms).
  const atoms = [];
  let cur = [];
  let curLen = 0;
  for (const sent of sents) {
    cur.push(sent);
    curLen += sent.length + 1;
    if (endsWithCitation(sent) || curLen >= MAX_POINT) { atoms.push(cur); cur = []; curLen = 0; }
  }
  if (cur.length) atoms.push(cur);
  const target = Math.min(6, Math.max(3, Math.round(clean.length / 500)));
  // A citation-dense text can land on fewer atoms than the 3-point floor —
  // split the longest atom at its sentence midpoint until the floor is met
  // (only where an atom still has 2+ sentences to give).
  for (;;) {
    if (atoms.length >= target) break;
    let big = -1;
    for (let a = 0; a < atoms.length; a += 1) {
      if (atoms[a].length >= 2 && (big < 0 || atoms[a].join(' ').length > atoms[big].join(' ').length)) big = a;
    }
    if (big < 0) break;
    const mid = Math.ceil(atoms[big].length / 2);
    atoms.splice(big, 1, atoms[big].slice(0, mid), atoms[big].slice(mid));
  }
  const k = Math.max(1, Math.min(atoms.length, target));
  let pointCount = 0;
  let from = 0;
  for (let b = 0; b < k; b += 1) {
    const take = Math.ceil((atoms.length - from) / (k - b));
    const group = atoms.slice(from, from + take).flat();
    from += take;
    if (!group.length) continue;
    // Derived points continue from startAt — a paced segment mid-lesson picks
    // up the count where the previous segment left off, never back at 1.
    items.push({ kind: 'point', p: startAt + pointCount, lines: toLines(group) });
    pointCount += 1;
  }
  return { items, sectionCount: 0, pointCount, nextStart: startAt + pointCount };
}

/**
 * lessonShareText(text, { numbered }) — the same structure as plain text for
 * copy/share: a blank line before each section, one breath line per row.
 * Every word of the input survives; only line breaks are added.
 *
 * `numbered: false` keeps the paragraph structure but drops the "N. " labels —
 * used for the big idea, which is the lesson's THESIS: only the body carries
 * the lesson's one chronological run of points, so a shared block never reads
 * 1-3 and then 1-3 again (Darrell 2026-08-25: "never starting over inside the
 * same lesson").
 */
export function lessonShareText(text, { numbered = true } = {}) {
  const { items } = formatLessonText(text);
  const rows = [];
  for (const it of items) {
    if (it.kind === 'heading') {
      // The heading IS the numbered point; its number rides in front so the
      // share reads as a countable list even where the author wrote FIRST/III.
      if (rows.length) rows.push('');
      rows.push(numbered ? `${it.n}. ${it.text}` : it.text);
    } else if (it.kind === 'point') {
      if (rows.length) rows.push('');
      it.lines.forEach((line, i) => rows.push(i === 0 && numbered ? `${it.p}. ${line}` : line));
    } else {
      rows.push(it.text);
    }
  }
  return rows.join('\n');
}
