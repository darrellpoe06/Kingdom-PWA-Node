// =============================================================================
// SEARCH IT OUT — every lesson sends you deeper into the Word (DR-0734)
// =============================================================================
// Darrell, 2026-10-01: "Integrated lessons also so they make users want to
// learn more about Yahweh and the Word's mysteries... so we produce kings like
// the Word says!!!!!" and "Use the Word as the book we gain our lessons from to
// enhance our Spiritual Mindset so we exist with Him eternally... lesson... and
// workflows..."
//
// The Word's own frame for wanting to learn more is Proverbs 25:2: the honour
// of kings is to search out a matter. So every lesson card ends with SEARCH IT
// OUT: the lessons in the same course that stand on the same verses (derived
// from each lesson's anchor references, never typed), three questions that send
// the reader back into the text and out to someone, and the verse itself.
// Nothing here is authored per lesson; it is read off the catalog, so it can
// never go stale and never claims a link that is not there.
//
// Every verse constant below is the King James text, verbatim, and the test
// re-reads each against app/public/bible/kjv.

export const SEARCH_IT_OUT_VERSE = {
  ref: 'Proverbs 25:2',
  text: 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
};

export const SEARCH_IT_OUT_REVEALED = {
  ref: 'Deuteronomy 29:29',
  text: 'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.',
};

export const SEARCH_IT_OUT_AIM = 'The Word is the book our lessons come from. Search it out, and keep searching: a mind set on it grows for ever, and that is how kings are made.';

/** The three standing questions, built from the lesson's own title. */
export function searchQuestions(title) {
  const t = String(title || '').split(/\s[—-]\s/)[0].trim() || 'this lesson';
  return [
    `What does ${t} show you about Yahweh that you did not see before?`,
    'Pick one verse quoted here and search out where else the Word says it. Write what you find.',
    'Who will you tell what you found, and which lesson below will you open next?',
  ];
}

/** Normalize one reference string into a comparable key: "Psalm 1:2" -> "Psalms 1:2". */
export function refKey(ref) {
  let s = String(ref || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = s.replace(/^Psalm\b/, 'Psalms').replace(/^Song of Songs\b/, 'Song of Solomon');
  // "Genesis 6:1-4" and "Genesis 6:1" share the chapter; keep the span as written.
  return s;
}

/** A lesson's anchor references as keys (the anchor is a semicolon-joined string). */
export function anchorRefs(module) {
  const raw = module && module.anchor && typeof module.anchor.ref === 'string' ? module.anchor.ref : '';
  const out = [];
  const seen = new Set();
  for (const part of raw.split(';')) {
    const k = refKey(part);
    if (k && !seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

/** Chapter key "Book c" of a reference key, for a looser second pass. */
export function chapterKey(ref) {
  const m = /^(.+?)\s+(\d+):/.exec(ref);
  return m ? `${m[1]} ${m[2]}` : '';
}

const num = (m) => Number((/^ll(\d+)-/.exec(String(m && m.id || '')) || [])[1]) || null;

/**
 * The other lessons in `modules` that stand on the same ground: first by shared
 * verses, then by shared chapters when verses alone give fewer than `limit`.
 * Returns [{ id, title, number, shared: [refs] }] sorted most-shared first.
 */
export function sharedGround(module, modules = [], { limit = 3 } = {}) {
  const mine = anchorRefs(module);
  if (!mine.length) return [];
  const mineSet = new Set(mine);
  const mineChapters = new Set(mine.map(chapterKey).filter(Boolean));
  const scored = [];
  for (const other of modules) {
    if (!other || other.id === module.id) continue;
    const theirs = anchorRefs(other);
    if (!theirs.length) continue;
    const verses = theirs.filter((r) => mineSet.has(r));
    const chapters = verses.length ? [] : [...new Set(theirs.map(chapterKey).filter((c) => c && mineChapters.has(c)))];
    if (!verses.length && !chapters.length) continue;
    scored.push({ id: other.id, title: other.title, number: num(other), shared: verses.length ? verses : chapters, byVerse: verses.length > 0, score: verses.length * 10 + chapters.length });
  }
  scored.sort((a, b) => b.score - a.score || (a.number || 1e9) - (b.number || 1e9) || String(a.id).localeCompare(String(b.id)));
  return scored.slice(0, limit).map(({ score, ...rest }) => rest);
}

/** Everything the SEARCH IT OUT part shows for one lesson. */
export function searchItOutFor(module, modules = [], opts = {}) {
  const ground = anchorRefs(module);
  return {
    verse: SEARCH_IT_OUT_VERSE,
    revealed: SEARCH_IT_OUT_REVEALED,
    aim: SEARCH_IT_OUT_AIM,
    ground: ground.length,
    questions: searchQuestions(module && module.title),
    next: sharedGround(module, modules, opts),
  };
}

/** How many lessons have at least one other lesson standing on the same ground. */
export function searchItOutCoverage(modules = []) {
  let linked = 0; let withAnchor = 0;
  for (const m of modules) {
    if (anchorRefs(m).length) withAnchor += 1;
    if (sharedGround(m, modules, { limit: 1 }).length) linked += 1;
  }
  return { lessons: modules.length, withAnchor, linked };
}
