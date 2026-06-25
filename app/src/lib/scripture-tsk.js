// =============================================================================
// scripture-tsk — public-domain cross-reference data (Treasury of Scripture
// Knowledge), the classic "where else does the Word speak to this?" links.
// =============================================================================
// THE LOGOS-STYLE WORD-STUDY LANE (Darrell 2026-06-25): a navigable web of the
// biblically-known connections between passages — the kind of cross-referencing a
// study Bible / Logos gives — built ENTIRELY from OPEN / PUBLIC-DOMAIN data so the
// whole thing is sovereign and free to ship. No copyrighted study apparatus.
//
// LICENSE / PROVENANCE (binding — DR-0076, cite the source):
//   • The Treasury of Scripture Knowledge (R. A. Torrey, from Thomas Scott + others,
//     1830s–1880s) is PUBLIC DOMAIN. Its ~640k cross-references are the classic set.
//   • This SEED was sourced verse-by-verse from openbible.info's TSK-derived
//     cross-reference dataset (the underlying TSK is public domain; openbible.info's
//     compiled, weighted dataset is CC BY 4.0 — attributed below). Fetched, not
//     produced from memory (verification doctrine).
//   • It is a SEED, not the whole TSK: the anchor verses of the in-app library are
//     seeded here; the FULL public-domain dataset drops in as data with NO code
//     change (the accessors below don't care how many keys exist). Honest about the
//     boundary — `tskCoverage()` reports exactly what is and isn't seeded.
//
// Refs use full book names ("1 John 4:9", not "1Jn 4:9") so they normalize against
// the same scripture-kjv keys (normalizeRef). A ref may be a single verse or the
// authentic TSK verse-range; the connections engine resolves text where the library
// carries it and links out to read the rest (never paints text it doesn't have).
// =============================================================================
import { normalizeRef } from './scriptures.js';

export const TSK_LICENSE = Object.freeze({
  work: 'Treasury of Scripture Knowledge (R. A. Torrey et al., 1830s–1880s)',
  license: 'Public Domain',
  compiledFrom: 'openbible.info cross-reference dataset (CC BY 4.0)',
  attribution:
    'Cross-references: openbible.info (CC BY 4.0), derived from the Treasury of '
    + 'Scripture Knowledge (public domain). No copyrighted study apparatus is used.',
  note: 'Seed set — the anchor verses of the in-app library. The full public-domain '
    + 'TSK drops in as data with no code change.',
});

// The seed. Key = a reference; value = the classic cross-references (ranked, as TSK
// orders them). Every list was fetched from the source, not written from memory.
export const TSK = Object.freeze({
  'John 3:16': ['Romans 5:8', '1 John 4:9-10', 'Romans 8:32', 'John 3:15', 'John 11:25-26', 'John 6:40', 'John 3:36', '1 John 4:19', 'John 10:28', '1 Timothy 1:15-16', 'Romans 5:10', 'John 1:29'],
  'John 3:3': ['2 Corinthians 5:17', 'John 3:5-6', '1 Peter 1:23-25', '1 John 3:9', '1 John 5:1', 'Titus 3:5', 'John 1:13', '1 John 2:29', '1 Peter 1:3', 'Galatians 6:15'],
  'John 14:6': ['Acts 4:12', 'John 10:9', 'Ephesians 2:18', 'John 11:25-26', 'John 1:4', '1 John 5:20', 'John 1:14', '1 John 5:11-12', 'Isaiah 35:8-9', 'John 1:17'],
  'Acts 4:12': ['John 14:6', '1 Corinthians 3:11', 'John 3:36', '1 Timothy 2:5-6', '1 John 5:11-12', 'Acts 10:42-43', 'Luke 24:47', 'Mark 16:15-16', 'Matthew 1:21', 'Hebrews 2:3'],
  'Romans 10:9': ['Luke 12:8', 'Acts 16:31', 'Philippians 2:11', 'Matthew 10:32-33', '1 John 4:2-3', '1 Peter 1:21', 'Romans 8:34', '1 Corinthians 15:14-18', 'Romans 14:11', '1 Corinthians 12:3'],
  'Romans 12:2': ['1 Peter 1:14', 'Ephesians 4:22-24', '2 Corinthians 5:17', 'Colossians 3:10', '1 John 2:15-17', 'Ephesians 5:17', 'Ezekiel 36:26', '1 Peter 4:2', 'Romans 12:1', 'John 15:19'],
  '2 Corinthians 5:17': ['Ezekiel 36:26', 'Ephesians 4:22-24', 'Isaiah 43:18-19', 'John 3:3', 'Psalm 51:10', 'Ezekiel 11:19', 'Colossians 3:1-10', 'Romans 8:1', 'Galatians 6:15', 'Ephesians 2:10'],
  'Romans 6:23': ['John 3:36', 'Romans 5:12', 'James 1:15', 'John 6:40', 'Ezekiel 18:20', 'Matthew 25:46', 'John 5:24', 'Ezekiel 18:4', 'Romans 5:21', 'Romans 2:7'],
  'Romans 8:28': ['1 Peter 5:10', 'James 1:12', 'Genesis 50:20', 'Romans 5:3-5', '1 Corinthians 2:9', 'Romans 8:35-39', 'James 1:3-4', 'Romans 8:30', '2 Timothy 1:9', '1 Peter 1:7-8'],
  'John 1:1': ['Genesis 1:1', 'John 17:5', 'Revelation 19:13', 'Colossians 1:17', 'John 1:14', '1 John 1:1-2', 'Revelation 22:13', 'John 1:2', 'Revelation 1:8', 'John 10:30-33'],
  'Philippians 4:8': ['James 3:17', 'Titus 2:7', 'Romans 12:9-21', '2 Corinthians 8:21', 'Galatians 5:22', '1 Thessalonians 5:21-22', '2 Peter 1:3-7', 'Hebrews 13:18', 'Ephesians 5:9', '1 Peter 2:12'],
  'Matthew 6:33': ['Luke 12:31', 'Matthew 5:6', 'John 6:27', 'Psalm 34:9-10', 'Psalm 84:11-12', 'Mark 10:29-30', 'Romans 14:17', 'Proverbs 3:9-10', 'Proverbs 2:1-9', 'Psalm 37:25'],
  'Proverbs 3:5': ['Psalm 37:5', 'Jeremiah 17:7-8', 'Proverbs 28:26', 'Psalm 37:3', 'Psalm 62:8', 'Isaiah 26:3-4', 'Isaiah 12:2', 'Psalm 37:7', 'Proverbs 3:7', 'Jeremiah 10:23'],
  'Hebrews 4:12': ['Jeremiah 23:29', 'Isaiah 55:11', 'Ephesians 6:17', 'Psalm 119:130', '1 Peter 1:23', 'Isaiah 49:2', 'Revelation 1:16', '1 Thessalonians 2:13', 'Jeremiah 17:10', 'Romans 1:16'],
  'Isaiah 53:5': ['1 Peter 2:24-25', '1 Peter 3:18', 'Matthew 20:28', '2 Corinthians 5:21', 'Romans 5:6-10', 'Isaiah 53:10-12', 'Hebrews 10:14', 'Hebrews 9:12-15', 'Romans 4:25', 'Hebrews 10:10'],
  'Matthew 28:19': ['Mark 16:15-16', 'Acts 2:38-39', 'Acts 1:8', 'Luke 24:47-48', 'Acts 19:3-5', 'Isaiah 49:6', 'Galatians 3:27', 'Acts 13:46-47', 'Acts 10:47-48', 'Romans 6:3-4'],
  'John 16:33': ['John 14:27', '1 John 5:4', '2 Thessalonians 3:16', '1 John 4:4', 'Philippians 4:7', 'John 14:1', '1 Peter 5:9', '2 Timothy 3:12', 'Acts 14:22', 'John 15:18-21'],
});

// The classic cross-references for a reference (public-domain TSK). [] when the ref
// is not in the seed — honest absence, never a fabricated list.
export function tskRefsFor(ref) {
  const key = normalizeRef(ref);
  return Object.prototype.hasOwnProperty.call(TSK, key) ? TSK[key].slice() : [];
}

// Does the seed carry classic cross-references for this reference?
export function hasTsk(ref) {
  return Object.prototype.hasOwnProperty.call(TSK, normalizeRef(ref));
}

// Every reference the seed covers (the anchor set).
export function tskKeys() {
  return Object.keys(TSK);
}

// Honest coverage readout: how much of a requested set the seed actually carries,
// so a surface can say "12 of 20 anchors seeded" instead of implying completeness.
export function tskCoverage(refs = tskKeys()) {
  const list = Array.isArray(refs) ? refs : [];
  const seeded = list.filter((r) => hasTsk(r));
  const totalRefs = Object.values(TSK).reduce((n, arr) => n + arr.length, 0);
  return {
    seededKeys: tskKeys().length,
    totalCrossRefs: totalRefs,
    requested: list.length,
    covered: seeded.length,
    missing: list.filter((r) => !hasTsk(r)),
  };
}
