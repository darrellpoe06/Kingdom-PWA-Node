// book-engine.js — assemble a BOOK from the existing content corpus.
//
// This is the spine of the books<->app flywheel (Darrell, 2026-06-25): produce
// books that are SUPPORTED BY the app, generated from content the family +
// community already created (sermons, Bible studies, lessons, courses,
// discernment lessons, testimonies, Bishop Gwin's teaching, the eternal
// algorithms, the Scripture library).
//
// INTEGRITY (binding, per DR-0076 verification doctrine + the Scripture
// standard): this engine only *arranges* text it is handed. It never authors,
// paraphrases, or fabricates. Every chapter is traceable to a real source
// (chapter.sourceRef), and Scripture is resolved verbatim through an injected
// resolver (the corpus layer wires KJV from scriptures.js — public-domain,
// fetched-not-typed). The integrity report fails the book if any of that breaks.
//
// PURE: no I/O, no network, no module-level Date. Timestamps are passed in
// (nowIso) so output is deterministic and testable. The corpus adapters
// (book-corpus.js) own the impure edges (reading the real stores).

// The kinds of source a chapter can be built from. Each carries the companion
// deep-link target inside the app (the "supported by the app" wiring) and a
// short attribution noun used in the source manifest.
export const SOURCE_KINDS = {
  lesson:      { label: 'Lesson',      noun: 'lesson',      view: 'church', churchView: 'learn' },
  course:      { label: 'Course',      noun: 'course',      view: 'church', churchView: 'learn' },
  sermon:      { label: 'Message',     noun: 'message',     view: 'church', churchView: 'pulpit' },
  song:        { label: 'Song',        noun: 'song',        view: 'church', churchView: 'choir' },
  scripture:   { label: 'Scripture',   noun: 'passage',     view: 'church', churchView: 'scripture' },
  algorithm:   { label: 'Eternal Algorithm', noun: 'pattern', view: 'study', churchView: null },
  discernment: { label: 'Discernment', noun: 'lesson',      view: 'church', churchView: 'learn' },
  testimony:   { label: 'Testimony',   noun: 'testimony',   view: 'church', churchView: 'home' },
  discussion:  { label: 'Discussion',  noun: 'discussion',  view: 'notes',  churchView: null },
};

export function kindMeta(kind) {
  return SOURCE_KINDS[kind] || { label: 'Section', noun: 'section', view: null, churchView: null };
}

const asArr = (v) => (Array.isArray(v) ? v : []);
const asStr = (v) => (typeof v === 'string' ? v : '');

// A content block — the smallest faithful unit. We keep the structure explicit
// so formatters (markdown/html/epub) render the same source identically and so
// Scripture is always a distinct, resolvable block (never inlined prose).
//   { kind:'heading', text }
//   { kind:'text', text }              plain paragraph
//   { kind:'list', items:[...] }
//   { kind:'note', label, text }       facilitator/aside (rendered as a callout)
//   { kind:'scripture', ref, theme }   resolved verbatim at assembly time
export function normalizeBlock(raw = {}) {
  const kind = asStr(raw.kind) || 'text';
  if (kind === 'scripture') {
    return { kind, ref: asStr(raw.ref), theme: asStr(raw.theme) };
  }
  if (kind === 'list') {
    return { kind, items: asArr(raw.items).map(asStr).filter(Boolean) };
  }
  if (kind === 'note') {
    return { kind, label: asStr(raw.label) || 'Note', text: asStr(raw.text) };
  }
  if (kind === 'heading') {
    return { kind, text: asStr(raw.text) };
  }
  return { kind: 'text', text: asStr(raw.text) };
}

// Normalize a source the engine was handed. We never invent — only coerce shape
// and drop empties. blocks is the body; scriptureRefs is the chapter's index.
export function normalizeSource(raw = {}) {
  const kind = SOURCE_KINDS[raw.kind] ? raw.kind : 'lesson';
  const blocks = asArr(raw.blocks).map(normalizeBlock)
    .filter((b) => (b.kind === 'list' ? b.items.length : (b.text || b.ref)));
  const scriptureRefs = Array.from(new Set([
    ...asArr(raw.scriptureRefs).map(asStr),
    ...blocks.filter((b) => b.kind === 'scripture').map((b) => b.ref),
  ].filter(Boolean)));
  return {
    id: asStr(raw.id) || `src-${kind}`,
    kind,
    title: asStr(raw.title) || kindMeta(kind).label,
    author: asStr(raw.author),
    date: asStr(raw.date) || null,
    intro: asStr(raw.intro),
    blocks,
    scriptureRefs,
    // provenance is the attribution receipt — where this content really came from.
    provenance: {
      source: asStr(raw.provenance?.source) || kindMeta(kind).noun,
      videoId: asStr(raw.provenance?.videoId) || null,
      startSeconds: Number.isFinite(raw.provenance?.startSeconds) ? raw.provenance.startSeconds : null,
      url: asStr(raw.provenance?.url) || null,
      date: asStr(raw.provenance?.date) || asStr(raw.date) || null,
      note: asStr(raw.provenance?.note),
    },
    // optional explicit deep-link override (else derived from kind)
    launch: raw.launch && typeof raw.launch === 'object' ? raw.launch : null,
  };
}

// The companion deep-links for a source — the heart of "supported by the app".
// A reader on a chapter can jump straight into the live, interactive surface
// the static page can only describe.
export function deepLinksFor(source) {
  const s = normalizeSource(source);
  const meta = kindMeta(s.kind);
  const links = [];
  const target = s.launch || (meta.view ? { view: meta.view, churchView: meta.churchView } : null);
  if (target) {
    links.push({ label: `Open in ${meta.label === 'Section' ? 'the app' : meta.label.toLowerCase()}`, ...target });
  }
  // Scripture refs always offer a jump to the Scripture library.
  if (s.scriptureRefs.length) {
    links.push({ label: 'Read the Scripture', view: 'church', churchView: 'scripture', ref: s.scriptureRefs[0] });
  }
  // Every chapter can open a discussion (community loop) and present live.
  links.push({ label: 'Discuss this', view: 'notes', kind: 'reflection', anchor: s.id });
  if (s.kind === 'lesson' || s.kind === 'course' || s.kind === 'sermon') {
    links.push({ label: 'Present live', view: 'church', churchView: meta.churchView || 'learn', present: true, anchor: s.id });
  }
  return links;
}

// Resolve a source into a chapter, materializing Scripture blocks verbatim via
// the injected resolver. resolver(ref) -> { text, version, ref } | null.
export function buildChapter(source, index, scriptureResolver) {
  const s = normalizeSource(source);
  const resolve = typeof scriptureResolver === 'function' ? scriptureResolver : () => null;
  const blocks = s.blocks.map((b) => {
    if (b.kind !== 'scripture') return b;
    const hit = resolve(b.ref);
    return {
      kind: 'scripture',
      ref: b.ref,
      theme: b.theme,
      text: asStr(hit?.text),            // verbatim or '' (flagged unresolved)
      version: asStr(hit?.version) || (hit?.text ? 'KJV' : ''),
      resolved: !!(hit && hit.text),
    };
  });
  return {
    id: s.id,
    number: index + 1,
    title: s.title,
    author: s.author,
    date: s.date,
    intro: s.intro,
    blocks,
    scriptureRefs: s.scriptureRefs,
    provenance: s.provenance,
    sourceRef: { id: s.id, kind: s.kind },   // the traceability anchor (integrity)
    deepLinks: deepLinksFor(s),
  };
}

const DEFAULT_ATTRIBUTION_NOTE =
  'This book was ASSEMBLED — arranged from existing teaching, never authored or ' +
  'paraphrased by a machine. No text was fabricated. Scripture is reproduced ' +
  'verbatim from the King James Version (public domain); other translations are ' +
  'referenced by citation, not reproduced.';

// Assemble a full Book from an ordered list of sources.
export function assembleBook({
  id, title, subtitle, author, edition, frontMatter,
  sources = [], scriptureResolver, nowIso, businesses = ['church'],
} = {}) {
  const chapters = asArr(sources).map((s, i) => buildChapter(s, i, scriptureResolver));

  // Unique Scripture index across the whole book, resolved once.
  const refSet = [];
  chapters.forEach((c) => c.scriptureRefs.forEach((r) => { if (r && !refSet.includes(r)) refSet.push(r); }));
  const resolve = typeof scriptureResolver === 'function' ? scriptureResolver : () => null;
  const scriptureIndex = refSet.map((ref) => {
    const hit = resolve(ref);
    return { ref, text: asStr(hit?.text), version: asStr(hit?.version) || (hit?.text ? 'KJV' : ''), resolved: !!(hit && hit.text) };
  });

  const sourceManifest = chapters.map((c) => ({
    chapter: c.number,
    title: c.title,
    kind: c.sourceRef.kind,
    author: c.author || null,
    provenance: c.provenance,
  }));

  const book = {
    id: asStr(id) || `book-${asStr(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'}`,
    title: asStr(title) || 'Untitled',
    subtitle: asStr(subtitle),
    author: asStr(author) || 'PoeTech / Church of the Living God',
    edition: asStr(edition) || 'First edition',
    createdIso: asStr(nowIso) || '',
    businesses: asArr(businesses).map(asStr).filter(Boolean),
    frontMatter: asStr(frontMatter),
    chapters,
    scriptureIndex,
    sourceManifest,
    attribution: {
      note: DEFAULT_ATTRIBUTION_NOTE,
      scripture: 'Scripture quotations: King James Version (KJV), public domain.',
      generatedBy: 'Assembled by the PoeTech app from the family + community corpus.',
    },
  };
  book.stats = bookStats(book);
  book.integrity = bookIntegrityReport(book);
  return book;
}

// Plain-text length of a chapter, for word/reading-time stats.
function chapterText(c) {
  return c.blocks.map((b) => {
    if (b.kind === 'list') return b.items.join(' ');
    if (b.kind === 'scripture') return b.text;
    return b.text || '';
  }).join(' ');
}

export function bookStats(book) {
  const chapters = asArr(book?.chapters);
  const words = chapters.reduce((n, c) => n + (chapterText(c).trim().split(/\s+/).filter(Boolean).length), 0);
  const scriptures = asArr(book?.scriptureIndex).length;
  return {
    chapters: chapters.length,
    words,
    scriptures,
    sources: asArr(book?.sourceManifest).length,
    estReadingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

// The verification gate: a book that lies, fabricates, or loses its sourcing
// does not ship. This report is what the approve-to-publish gate reads.
export function bookIntegrityReport(book) {
  const chapters = asArr(book?.chapters);
  const issues = [];

  const unsourced = chapters.filter((c) => !c.sourceRef || !c.sourceRef.id).map((c) => c.number);
  if (unsourced.length) issues.push(`Chapters without a traceable source: ${unsourced.join(', ')}`);

  const empty = chapters.filter((c) => !chapterText(c).trim()).map((c) => c.number);
  if (empty.length) issues.push(`Empty chapters (no body): ${empty.join(', ')}`);

  const unresolved = asArr(book?.scriptureIndex).filter((s) => !s.resolved).map((s) => s.ref);
  if (unresolved.length) issues.push(`Unresolved Scripture references (not reproduced verbatim): ${unresolved.join('; ')}`);

  if (!asStr(book?.title).trim()) issues.push('Missing title.');
  if (!chapters.length) issues.push('A book needs at least one chapter.');

  return {
    ok: issues.length === 0,
    fabricationFree: true,           // true by construction — the engine adds no prose
    everyChapterSourced: unsourced.length === 0,
    everyChapterHasBody: empty.length === 0,
    everyScriptureResolved: unresolved.length === 0,
    unresolvedScripture: unresolved,
    issues,
  };
}

// The stable companion manifest — what a QR code / deep link on the printed or
// exported book points back into. Aggregates every chapter's live surfaces.
export function companionManifest(book) {
  const chapters = asArr(book?.chapters);
  return {
    bookId: asStr(book?.id),
    bookTitle: asStr(book?.title),
    readerRoute: { view: 'library', book: asStr(book?.id) },
    chapters: chapters.map((c) => ({
      number: c.number,
      title: c.title,
      anchor: c.id,
      deepLinks: c.deepLinks,
    })),
    scriptureCount: asArr(book?.scriptureIndex).length,
  };
}
