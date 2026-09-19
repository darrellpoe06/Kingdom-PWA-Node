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

// THE HOUSE STYLE IS ITSELF A MARKER (Darrell 2026-09-13, from the pulpit's
// point of view: "All lessons need to be using these highlighted numbers for
// the points in the lessons... we need the speaker to be able to keep their
// place while looking away from the text to look people in their eyes").
//
// MEASURED BEFORE BUILDING, not assumed: of 144 lessons only 31 carried any
// numbered point at all -- 113 had none, because the explicit markers above
// (FIRST/SECOND, I./II., SOIL n) are used by a minority of authors. A tally of
// how sentences actually START across the corpus found the real convention:
// 313 ALL-CAPS LEAD CLAUSES ("THE DIRECTIVE.", "SO THE PRACTICAL ANSWER:",
// "AND IT ANSWERS WHY PEOPLE QUESTION HIM AT ALL."). That is where the points
// live, and it was going unnumbered.
//
// So a capitalised lead clause is a point. Deliberately narrow:
//   * at least two words, so "I AM" or a shouted single word is not a point;
//   * letters/space/apostrophe/hyphen/comma only, so a verse reference or a
//     figure cannot start one;
//   * closed by . : — or , so it is a LEAD-IN to prose, not a whole shouted
//     sentence;
//   * 70 chars max, because a long shout is a sentence, not a heading.
// Not one character is altered -- the clause is the author's own words and the
// number is rendered beside it (pinned by the reconstruction test).
const CAPS_LEAD = /^([A-Z][A-Z'’\- ]{4,68}?)([.:,—])\s/;

// AND THE SAME CLAUSE WHEN IT STANDS ALONE AS ITS OWN SENTENCE.
//
// The pass above only ever fired on a lead clause that keeps its prose in the
// SAME sentence -- "SO THE PRACTICAL ANSWER: the thing to do is" -- because it
// needs the punctuation to be followed by a space. The house's most common
// form closes with a FULL STOP ("THE OCCASION. A friend of this house set out
// his position..."), and sentences() cuts exactly there, handing the detector
// the bare fragment "THE OCCASION." with nothing after the period to match.
// So the commonest heading in the corpus was the one form that could never be
// seen, which is why a 4,777-character lesson reported a single point (Darrell
// 2026-09-13, from the pulpit: "1 point for the whole lesson?! Very
// unlikely!!!"). Measured, not assumed: 60 of 145 lessons scored ZERO points
// and 93 scored one or none before this.
//
// Same narrowness as above, plus two guards that keep a SHOUTED line out: the
// clause must be 2-9 words, and it must actually HEAD something -- the next
// sentence has to be ordinary prose with lower-case in it. A shout that ends a
// passage heads nothing and stays a line.
const CAPS_ALONE = /^([A-Z][A-Z'’\-, ]{4,68})([.:])$/;

function capsHeadingAlone(sentence, next) {
  const m = CAPS_ALONE.exec(String(sentence).trim());
  if (!m) return false;
  const clause = m[1];
  if (!/[A-Z]{2,}\s+[A-Z]/.test(clause)) return false;          // two capitalised words
  const words = clause.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 9) return false;        // a heading, not a shout
  return /[a-z]/.test(String(next || ''));                       // it must head real prose
}

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

// Does this sentence open with a capitalised lead clause? Must contain a real
// lower-case remainder, so a sentence that is ENTIRELY upper case (a shouted
// line, not a heading over prose) is left as ordinary text.
function capsLeadAt(sentence) {
  const m = CAPS_LEAD.exec(sentence);
  if (!m) return false;
  if (!/[a-z]/.test(sentence.slice(m[0].length))) return false;   // all-caps sentence
  if (!/[A-Z]{2,}\s+[A-Z]/.test(m[1])) return false;              // needs 2+ caps words
  return true;
}

/**
 * formatLessonText(text) -> { items, sectionCount }
 * items: [{ kind: 'heading', n, text } | { kind: 'line', text }]
 * Headings are the author's own marker sentences (whole sentence, untouched);
 * lines are one-or-two-sentence groups. Joining every item's text with single
 * spaces reproduces the normalized input exactly.
 */
/**
 * lessonSectionPlan(fullText) -> { hasExplicit, headings: [{ text, n }], total }
 *
 * THE NUMBERS BELONG TO THE LESSON, NOT TO THE STEP ON SCREEN (DR-0520).
 * Darrell 2026-09-19, with two screenshots of L175: "Stop adding numbers that
 * don't make sense!!! Make it make sense!!! Why do we count from 1 - whatever
 * each section?!" And: "Obvious!!!"
 *
 * It was. Step 1 of 13 rendered headings 1, 2, 3; Step 2 rendered a heading
 * numbered 1; Step 3 rendered 1 and then 2. Three different points on one
 * screen all called 1. The cause is mechanical: the paced reader chunks a band
 * into steps and calls the formatter ONCE PER STEP, so the auto counter — and
 * the hasExplicit decision — were both computed per chunk and reset at every
 * step boundary.
 *
 * So the numbering is computed ONCE over the whole band text and carried into
 * each chunk. This function is that single computation; pass its result to
 * formatLessonText as `plan` and every step continues the lesson's count.
 *
 * It is also the source of truth for WHICH sentences are headings, which fixes
 * a second boundary defect: capsHeadingAlone looks at the NEXT sentence, and at
 * a chunk boundary the next sentence lives in the following chunk, so a heading
 * could be detected differently depending on where the pacer happened to cut.
 *
 * NOT ONE WORD OF ANY LESSON CHANGES. Only which number is rendered beside a
 * heading the author already wrote.
 */
export function lessonSectionPlan(fullText) {
  const clean = typeof fullText === 'string' ? fullText.replace(/\s+/g, ' ').trim() : '';
  const sents = sentences(clean);
  // EXPLICIT MARKERS WIN OUTRIGHT. Where the author numbered their own points
  // (FIRST/SECOND, I./II., SOIL n) those numbers are theirs and the caps-lead
  // pass is switched off entirely -- otherwise a lesson would count 1,2,3 from
  // its shouted lead-ins and then hit "FIRST" and restart at 1. This also means
  // the 31 lessons that already carried numbers render byte-identically to
  // before; only the 113 that had none gain any.
  const hasExplicit = sents.some((x) => markerAt(x));
  const headings = [];
  let auto = 0;
  for (let si = 0; si < sents.length; si += 1) {
    const sent = sents[si];
    const mark = markerAt(sent);
    if (mark) { headings.push({ text: sent, n: mark.n }); continue; }
    if (!hasExplicit && (capsLeadAt(sent) || capsHeadingAlone(sent, sents[si + 1]))) {
      auto += 1;
      headings.push({ text: sent, n: auto });
    }
  }
  return { hasExplicit, headings, total: headings.length };
}

export function formatLessonText(text, plan = null) {
  const clean = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!clean) return { items: [], sectionCount: 0 };
  const items = [];
  let buf = '';
  const flush = () => { if (buf) { items.push({ kind: 'line', text: buf }); buf = ''; } };
  let sectionCount = 0;

  const sents = sentences(clean);
  // With no plan the text IS the whole lesson, so it plans itself and behaves
  // exactly as it always did. With a plan, this chunk is one step of a longer
  // lesson and takes its numbers from there.
  const P = (plan && Array.isArray(plan.headings)) ? plan : lessonSectionPlan(clean);
  // Headings are consumed in order, so a chunk that repeats a heading sentence
  // verbatim still advances rather than re-reading the first occurrence.
  //
  // The match is a PREFIX match, not equality, because the pacer cuts by word
  // count and can land inside a sentence. Measured on ll94's youth band: two
  // headings each carry a quotation whose closing `. "` reads like a sentence
  // end, so the chunk holds only the opening fragment of the heading and an
  // equality match dropped the number entirely (the reader saw 6 then 8). The
  // fragment that STARTS the heading is where the badge belongs; the remainder
  // lands in the next step as ordinary prose, and the cursor has already moved
  // past it so it can never take a second number.
  let cursor = 0;
  const MIN_MATCH = 12;
  const starts = (a, b) =>
    a === b || (a.length >= MIN_MATCH && b.length >= MIN_MATCH && (a.startsWith(b) || b.startsWith(a)));
  const numberFor = (sent) => {
    for (let i = cursor; i < P.headings.length; i += 1) {
      if (starts(P.headings[i].text, sent)) { cursor = i + 1; return P.headings[i].n; }
    }
    return null;
  };

  for (const sent of sents) {
    const n = numberFor(sent);
    if (n != null) {
      flush();
      sectionCount += 1;
      items.push({ kind: 'heading', n, text: sent });
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

/**
 * lessonPoints(text) -> [{ n, text, label, itemIndex }]
 *
 * THE SPEAKER'S INDEX (Darrell 2026-09-13: "we also want the number of points
 * to be known and for them to be available in a list somehow").
 *
 * A preacher standing in front of people cannot scan a wall of prose to find
 * where they were. They need to know there are seven points, see the seven,
 * and land on one. This returns exactly that, derived from the same headings
 * the renderer numbers -- so the list and the body can never disagree.
 *
 * `label` is the short form for a chip or a row: the lead clause up to its
 * first terminator, never the whole paragraph. Words are not altered; the
 * label is a PREFIX of the author's own sentence, cut at a punctuation mark.
 * `itemIndex` is the position in formatLessonText().items, which is what a
 * jump target uses.
 */
export function lessonPoints(text) {
  const { items } = formatLessonText(text);
  const out = [];
  items.forEach((it, itemIndex) => {
    if (it.kind !== 'heading') return;
    // A LABEL MUST CARRY THE POINT, NOT THE MARKER. Cutting at the first
    // terminator gave "FIRST", "SECOND", "THIRD" -- which tells a speaker
    // scanning the list absolutely nothing. So the author's marker token is
    // stepped over first and the label is taken from what follows it, which is
    // where the author actually named the point ("FIRST, the trouble lab: ..."
    // -> "the trouble lab"). Still a prefix of their own words, still uncut
    // mid-word.
    const body = it.text.replace(
      /^(?:(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,—:]?|(?:I{1,3}|IV|V|VI{0,3}|IX|X)\.|SOIL\s+\d+\b[,—:]?)\s*/,
      '',
    );
    const cut = /^(.{4,80}?)([.:,—])(\s|$)/.exec(body);
    const label = ((cut ? cut[1] : body.slice(0, 80)).replace(/^[\s—–\-:,]+/, '').trim())
      || it.text.slice(0, 80).trim();
    out.push({ n: it.n, text: it.text, label, itemIndex });
  });
  return out;
}

/**
 * lessonPointCount(text) — how many points this lesson makes. Zero is a real
 * and honest answer: 60 of the 144 lessons are flowing narrative with no point
 * structure their author wrote, and inventing numbers for those would be
 * fabricating an outline rather than showing one (DR-0076). A surface that
 * gets 0 should say the lesson runs as one continuous reading, not pretend.
 */
export function lessonPointCount(text) {
  return lessonPoints(text).length;
}

/**
 * lessonSections(text) — the lesson broken into its POINTS WITH THEIR PROSE.
 *
 * lessonPoints() returns the headings alone, which is all a chip row or a jump
 * list needs. A presenter needs the other half: the words that belong UNDER
 * each heading, so the part of the deck called "The method" can hand the
 * speaker the lesson's own paragraphs on the method instead of an empty panel
 * (Darrell 2026-09-13, from the pulpit: "How can there be no presenters notes
 * with all this content?!"). Measured before building: on L142 six of nine
 * parts carried ZERO notes while the lesson itself held ~14,000 characters.
 *
 * Returns [{ n, label, heading, body }] in document order, where `body` is the
 * joined prose between this heading and the next. Any prose BEFORE the first
 * heading is returned as a leading section with n = 0 and no heading, so not
 * one character of the lesson is dropped — pinned by a reconstruction test the
 * same way formatLessonText is.
 */
export function lessonSections(text) {
  const { items } = formatLessonText(text);
  if (!items.length) return [];
  const out = [];
  let cur = { n: 0, label: '', heading: '', lines: [] };
  const push = () => {
    if (!cur.heading && !cur.lines.length) return;
    out.push({ n: cur.n, label: cur.label, heading: cur.heading, body: cur.lines.join(' ').trim() });
  };
  const labelOf = (heading) => {
    const pts = lessonPoints(heading);
    return pts.length ? pts[0].label : heading.replace(/[.:,—\s]+$/, '').trim();
  };
  items.forEach((it) => {
    if (it.kind === 'heading') {
      push();
      cur = { n: it.n, label: labelOf(it.text), heading: it.text, lines: [] };
      return;
    }
    cur.lines.push(it.text);
  });
  push();
  return out;
}
