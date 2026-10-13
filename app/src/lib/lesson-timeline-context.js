// =============================================================================
// lesson-timeline-context — every lesson carries WHERE IT SITS IN TIME, and the
// years that go with it
// =============================================================================
// Darrell 2026-08-11: "Lessons... data... make sure we have easy context... in
// all lessons... that need the timelines that add context to all etc..."
//
// MEASURED GAP (DR-0076 §4 — measure, don't claim): at the time this was built,
// 29 of 74 Living Lessons resolved to a timeline epoch and 45 resolved to
// NOTHING — every lesson from L30 onward. The timeline knew about the lessons
// only through hand-written `lessons: [...]` arrays on each epoch, which stopped
// being maintained as the series grew past thirty. A reader on L52 got no
// chronological context at all.
//
// WHY DERIVED, NOT HAND-MAPPED: the same reason the Lord's Matrix is derived.
// A hand-kept list rots the moment a lesson is added, and it rotted here in a
// measurable way. This module reads the Scripture a lesson ALREADY cites and
// resolves those references to the epoch(s) they belong to, so a new lesson
// carries its timeline context the day it is written, with nothing to maintain.
//
// HOW THE MAPPING IS DEFENSIBLE: a reference is placed by WHERE ITS EVENTS SIT
// in the redemptive record, not by when the book was written. Genesis is split
// at the chapter level because Genesis alone spans four epochs (creation, the
// fall, the flood, Babel, then the patriarchs). Everything else maps by book,
// which is honest at the granularity this surface needs.
//
// CURATED WINS. Where an epoch's own `lessons` array names a lesson, that
// hand-made judgment is kept and marked `curated` — a human placing a lesson
// deliberately outranks a derivation. Derived epochs supplement it. The UI can
// therefore say plainly which is which.
//
// PURE: no DOM, no fetch — data in, data out, assertable in a plain test.
// =============================================================================
import { TIMELINE_EPOCHS, getEpoch } from './biblical-timeline.js';
import { refsForLesson } from './scripture-matrix.js';
import { markersForEpoch } from './scripture-chronology.js';

// Books whose events sit wholly inside one epoch.
const BOOK_EPOCH = {
  // The covenant people: patriarchs, Egypt, law, land, kings, prophets, exile.
  exodus: 'israel', leviticus: 'israel', numbers: 'israel', deuteronomy: 'israel',
  joshua: 'israel', judges: 'israel', ruth: 'israel', '1 samuel': 'israel',
  '2 samuel': 'israel', '1 kings': 'israel', '2 kings': 'israel',
  '1 chronicles': 'israel', '2 chronicles': 'israel', ezra: 'israel',
  nehemiah: 'israel', esther: 'israel', job: 'israel', psalms: 'israel',
  proverbs: 'israel', ecclesiastes: 'israel', 'song of solomon': 'israel',
  isaiah: 'israel', jeremiah: 'israel', lamentations: 'israel', ezekiel: 'israel',
  daniel: 'israel', hosea: 'israel', joel: 'israel', amos: 'israel',
  obadiah: 'israel', jonah: 'israel', micah: 'israel', nahum: 'israel',
  habakkuk: 'israel', zephaniah: 'israel', haggai: 'israel',
  zechariah: 'israel', malachi: 'israel',
  // The Son among us.
  matthew: 'christ', mark: 'christ', luke: 'christ', john: 'christ',
  // The Spirit in us, and the mission running.
  acts: 'church-age', romans: 'church-age', '1 corinthians': 'church-age',
  '2 corinthians': 'church-age', galatians: 'church-age', ephesians: 'church-age',
  philippians: 'church-age', colossians: 'church-age',
  '1 thessalonians': 'church-age', '2 thessalonians': 'church-age',
  '1 timothy': 'church-age', '2 timothy': 'church-age', titus: 'church-age',
  philemon: 'church-age', hebrews: 'church-age', james: 'church-age',
  '1 peter': 'church-age', '2 peter': 'church-age', '1 john': 'church-age',
  '2 john': 'church-age', '3 john': 'church-age', jude: 'church-age',
};

// Genesis spans several epochs, so it is placed by chapter.
function genesisEpoch(chapter) {
  if (chapter <= 2) return 'creation';
  if (chapter <= 5) return 'the-fall';
  if (chapter <= 10) return 'genesis-6';
  if (chapter === 11) return 'babel';
  return 'israel';
}

// Revelation: the return, then the consummation.
function revelationEpoch(chapter) {
  return chapter >= 21 ? 'eternity' : 'the-return';
}

/** The epoch a single "Book C:V" reference belongs to, or null. */
export function epochForRef(ref) {
  const m = String(ref || '').match(/^((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)/);
  if (!m) return null;
  // Callers may hand us a raw citation ("Psalm 27:10") rather than one already
  // canonicalized by scripture-matrix ("Psalms 27:10"). Resolve the same
  // spellings here so this function is correct on its own, not only downstream
  // of that normalization — the coverage gate passed while this was broken.
  const ALIASES = {
    psalm: 'psalms', ps: 'psalms', song: 'song of solomon',
    'song of songs': 'song of solomon', canticles: 'song of solomon',
    revelations: 'revelation',
  };
  const raw = m[1].trim().toLowerCase().replace(/\s+/g, ' ');
  const book = ALIASES[raw] || raw;
  const chapter = Number(m[2]);
  if (book === 'genesis') return genesisEpoch(chapter);
  if (book === 'revelation') return revelationEpoch(chapter);
  return BOOK_EPOCH[book] || null;
}

/**
 * The timeline context for one lesson: which epochs it stands in, whether that
 * placement was curated or derived, and the YEARS Scripture states in each —
 * so the context carries data, not just a label.
 *
 * Epochs come back in timeline order. `weight` is how many of the lesson's own
 * references land in that epoch, so a UI can lead with the dominant one.
 */
export function timelineContextFor(module, { limit = 3 } = {}) {
  if (!module) return [];
  const curated = new Set(
    TIMELINE_EPOCHS.filter((e) => (e.lessons || []).includes(module.id)).map((e) => e.id),
  );
  const counts = new Map();
  for (const ref of refsForLesson(module)) {
    const id = epochForRef(ref);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  const ids = new Set([...curated, ...counts.keys()]);
  const out = [];
  for (const id of ids) {
    const epoch = getEpoch(id);
    if (!epoch) continue;
    out.push({
      id,
      era: epoch.era,
      when: epoch.when,
      order: epoch.order,
      source: curated.has(id) ? 'curated' : 'derived',
      weight: counts.get(id) || 0,
      years: markersForEpoch(id).map((mk) => ({ figure: mk.figure, label: mk.label, ref: mk.ref })),
    });
  }
  // Curated first, then by how much of the lesson actually sits there, then order.
  out.sort((a, b) => (
    (a.source === b.source ? 0 : a.source === 'curated' ? -1 : 1)
    || (b.weight - a.weight)
    || (a.order - b.order)
  ));
  return out.slice(0, limit);
}

/** A one-line "where this sits in time" label for a lesson card. */
export function timelineLabelFor(module, opts = {}) {
  const ctx = timelineContextFor(module, opts);
  if (ctx.length === 0) return '';
  return ctx.map((c) => c.era).join(' · ');
}

/** Plain-text block for the printed export and copy blocks. */
export function timelineContextText(module, opts = {}) {
  const ctx = timelineContextFor(module, opts);
  if (ctx.length === 0) return '';
  const lines = ctx.map((c) => {
    const years = c.years.slice(0, 3).map((y) => `${y.figure} (${y.ref})`).join('; ');
    return `• ${c.era} — ${c.when}${years ? ` · years stated here: ${years}` : ''}`;
  });
  return `WHERE THIS SITS IN TIME\n${lines.join('\n')}`;
}
