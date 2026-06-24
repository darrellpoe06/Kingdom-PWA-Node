// =============================================================================
// choir-songbook — cross-reference engine tests (proven-to-catch).
// Each block asserts a behavior the choir relies on to pull the right song in
// seconds: title grouping, scripture/theme matching, derived history, and the
// most-loved tally. Pure functions only — deterministic `today`, no clock.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  normalizeTitle, parseScriptureRefs, scriptureOverlap,
  suggestThemes, parseThemes, buildSongbook, tallyLoves, allThemes,
  searchSongbook, filterByTheme, scoreSong, suggestSongsForSermon,
  suggestSongsForText, crossRefSermons, lastSungLabel,
} from '../lib/choir-songbook.js';

const TODAY = '2026-06-24';

// A small real-shaped set-list: "Total Praise" sung twice + scheduled ahead;
// "Way Maker" once; an archived row that must never surface.
const songs = [
  { id: 'a1', title: 'Total Praise', serviceDate: '2026-05-10', serviceType: 'sunday', status: 'active', scriptureRef: 'Psalm 100', themes: ['praise'], songKey: 'Ab', arrangement: 'Choir + solo', soloist: 'Sis. M', youtubeUrl: 'https://youtu.be/abcdefghijk', notes: 'Big finish' },
  { id: 'a2', title: 'total praise!', serviceDate: '2026-06-14', serviceType: 'sunday', status: 'active', scriptureRef: 'Psalm 100:1', themes: ['worship'], songKey: null, arrangement: null, soloist: null, youtubeUrl: null, notes: null },
  { id: 'a3', title: 'Total Praise', serviceDate: '2026-07-05', serviceType: 'sunday', status: 'active', scriptureRef: null, themes: [], songKey: null },
  { id: 'b1', title: 'Way Maker', serviceDate: '2026-06-07', serviceType: 'sunday', status: 'active', scriptureRef: 'John 3:16', themes: ['faith'], songKey: 'E' },
  { id: 'z9', title: 'Old Song', serviceDate: '2026-01-01', serviceType: 'sunday', status: 'archived', scriptureRef: 'Psalm 23', themes: ['comfort'] },
];

describe('normalizeTitle — groups song variants into one identity', () => {
  it('collapses case, punctuation, and whitespace', () => {
    expect(normalizeTitle('Total Praise')).toBe('total praise');
    expect(normalizeTitle('total  praise!')).toBe('total praise');
    expect(normalizeTitle('TOTAL-PRAISE')).toBe('total praise');
  });
  it('PROVEN-TO-CATCH: distinct songs stay distinct', () => {
    expect(normalizeTitle('Way Maker')).not.toBe(normalizeTitle('Total Praise'));
  });
});

describe('parseScriptureRefs — reads the existing ref, never invents', () => {
  it('parses book + chapter', () => {
    expect(parseScriptureRefs('Psalm 100')).toEqual([{ book: 'psalms', chapter: 100, display: 'Psalm 100' }]);
  });
  it('normalizes abbreviations + numbered books', () => {
    expect(parseScriptureRefs('Ps 23')[0].book).toBe('psalms');
    expect(parseScriptureRefs('1 Cor 13')[0].book).toBe('1corinthians');
  });
  it('splits multiple refs and a verse range keeps the chapter', () => {
    const refs = parseScriptureRefs('1 Cor 13; Ps 23');
    expect(refs.map((r) => r.book)).toEqual(['1corinthians', 'psalms']);
    expect(parseScriptureRefs('John 3:16-18')[0]).toMatchObject({ book: 'john', chapter: 3 });
  });
  it('PROVEN-TO-CATCH: an unrecognized book is dropped, not mis-matched', () => {
    expect(parseScriptureRefs('Gibberish 4')).toEqual([]);
    expect(parseScriptureRefs('')).toEqual([]);
  });
});

describe('scriptureOverlap — matches songs/sermons on shared scripture', () => {
  it('same book + chapter is the strong hit', () => {
    expect(scriptureOverlap('Psalm 100', 'Ps 100:1')).toMatchObject({ hit: true, book: 'psalms', chapter: 100 });
  });
  it('same book, different chapter still hits (book-level)', () => {
    const ov = scriptureOverlap('Psalm 100', 'Psalm 23');
    expect(ov.hit).toBe(true);
    expect(ov.chapter).toBe(null);
  });
  it('PROVEN-TO-CATCH: different books do not match', () => {
    expect(scriptureOverlap('Psalm 100', 'John 3:16').hit).toBe(false);
  });
});

describe('suggestThemes — derives candidates from text, never fabricates', () => {
  it('finds themes by keyword stem', () => {
    expect(suggestThemes('A song of praise and thanksgiving')).toEqual(expect.arrayContaining(['praise', 'thanksgiving']));
  });
  it('detects occasion themes', () => {
    expect(suggestThemes('He is risen — the empty tomb')).toContain('easter');
  });
  it('PROVEN-TO-CATCH: empty text yields no themes (no fabrication)', () => {
    expect(suggestThemes('')).toEqual([]);
    expect(suggestThemes('   ')).toEqual([]);
  });
  it('caps the number of suggestions', () => {
    expect(suggestThemes('praise worship thank saved grace faith hope love joy peace', 3)).toHaveLength(3);
  });
});

describe('parseThemes — cleans the director-entered tag field', () => {
  it('lowercases, trims, dedupes', () => {
    expect(parseThemes('Praise, praise ,  Thanksgiving')).toEqual(['praise', 'thanksgiving']);
  });
  it('splits on commas and newlines', () => {
    expect(parseThemes('praise\nworship')).toEqual(['praise', 'worship']);
  });
});

describe('buildSongbook — derives song entities from the real rows', () => {
  const book = buildSongbook(songs, { today: TODAY });
  const total = book.find((s) => s.titleKey === 'total praise');
  const way = book.find((s) => s.titleKey === 'way maker');

  it('groups title variants into ONE song', () => {
    expect(total).toBeTruthy();
    expect(total.rowIds.sort()).toEqual(['a1', 'a2', 'a3']);
  });
  it('PROVEN-TO-CATCH: archived rows never surface', () => {
    expect(book.find((s) => s.titleKey === 'old song')).toBeUndefined();
  });
  it('unions scripture + themes + practical metadata across rows', () => {
    expect(total.scriptureRefs).toEqual(expect.arrayContaining(['Psalm 100', 'Psalm 100:1']));
    expect(total.themes).toEqual(expect.arrayContaining(['praise', 'worship']));
    expect(total.keys).toContain('Ab');
    expect(total.soloists).toContain('Sis. M');
  });
  it('computes last-sung (past) and next-scheduled (future) from real dates', () => {
    expect(total.lastSung).toBe('2026-06-14');     // most recent <= today
    expect(total.nextScheduled).toBe('2026-07-05'); // soonest > today
    expect(total.timesUsed).toBe(3);
  });
  it('carries the freshest non-null video/notes forward', () => {
    expect(total.youtubeUrl).toBe('https://youtu.be/abcdefghijk');
    expect(total.notes).toBe('Big finish');
  });
  it('reflects loves count + mine from the tally', () => {
    const loves = tallyLoves([
      { titleKey: 'total praise', mine: true }, { titleKey: 'total praise', mine: false },
      { titleKey: 'way maker', mine: false },
    ]);
    const withLoves = buildSongbook(songs, { today: TODAY, loves });
    expect(withLoves[0].titleKey).toBe('total praise'); // most-loved sorts first
    expect(withLoves.find((s) => s.titleKey === 'total praise').lovesCount).toBe(2);
    expect(withLoves.find((s) => s.titleKey === 'total praise').lovedByMe).toBe(true);
  });
  it('Way Maker (one row, dated future of last sung) reads correctly', () => {
    expect(way.lastSung).toBe('2026-06-07');
    expect(way.timesUsed).toBe(1);
  });
});

describe('tallyLoves — titleKey -> { count, mine }', () => {
  it('counts and flags mine', () => {
    const map = tallyLoves([{ titleKey: 'x', mine: false }, { titleKey: 'x', mine: true }]);
    expect(map.get('x')).toEqual({ count: 2, mine: true });
  });
});

describe('searchSongbook / filterByTheme — type a theme or a verse', () => {
  const book = buildSongbook(songs, { today: TODAY });
  it('finds by title substring', () => {
    expect(searchSongbook(book, 'way').map((s) => s.titleKey)).toEqual(['way maker']);
  });
  it('finds by theme', () => {
    expect(searchSongbook(book, 'worship').map((s) => s.titleKey)).toContain('total praise');
  });
  it('PROVEN-TO-CATCH: scripture-aware — "Psalm 100" finds "Ps 100:1"', () => {
    const hit = searchSongbook(book, 'Psalm 100').map((s) => s.titleKey);
    expect(hit).toContain('total praise');
    expect(hit).not.toContain('way maker');
  });
  it('empty query returns all; theme filter narrows', () => {
    expect(searchSongbook(book, '')).toHaveLength(book.length);
    expect(filterByTheme(book, 'faith').map((s) => s.titleKey)).toEqual(['way maker']);
  });
  it('allThemes lists every tag sorted', () => {
    expect(allThemes(book)).toEqual(['faith', 'praise', 'worship']);
  });
});

describe('scoreSong — scripture beats theme; reasons explain the match', () => {
  const song = { scriptureRefs: ['Psalm 100'], themes: ['praise'], lovesCount: 0 };
  it('same chapter scores highest', () => {
    expect(scoreSong(song, { scriptureRef: 'Psalm 100', themes: [] }).score).toBe(5);
  });
  it('same book (no chapter match) scores lower', () => {
    expect(scoreSong(song, { scriptureRef: 'Psalm 23', themes: [] }).score).toBe(3);
  });
  it('theme overlap scores and gives a reason', () => {
    const r = scoreSong(song, { scriptureRef: '', themes: ['praise'] });
    expect(r.score).toBe(2);
    expect(r.reasons[0]).toMatch(/praise/);
  });
  it('PROVEN-TO-CATCH: no overlap scores zero', () => {
    expect(scoreSong(song, { scriptureRef: 'John 3', themes: ['easter'] }).score).toBe(0);
  });
});

describe('suggestSongsForSermon / ForText — what should we sing?', () => {
  const book = buildSongbook(songs, { today: TODAY });
  it('ranks by scripture/theme fit and returns the reason', () => {
    const sermon = { id: 's1', title: 'A Praise Sunday', scriptureRef: 'Psalm 100', notes: '' };
    const out = suggestSongsForSermon(book, sermon);
    expect(out[0].song.titleKey).toBe('total praise');
    expect(out[0].reasons.join(' ')).toMatch(/Psalm 100|praise/i);
  });
  it('PROVEN-TO-CATCH: no sermon -> no suggestions (never guesses)', () => {
    expect(suggestSongsForSermon(book, null)).toEqual([]);
  });
  it('free-text theme suggests songs', () => {
    expect(suggestSongsForText(book, 'praise').map((r) => r.song.titleKey)).toContain('total praise');
  });
  it('free-text scripture suggests songs', () => {
    expect(suggestSongsForText(book, 'Psalm 100').map((r) => r.song.titleKey)).toContain('total praise');
  });
});

describe('crossRefSermons — which messages a song fits', () => {
  const book = buildSongbook(songs, { today: TODAY });
  const total = book.find((s) => s.titleKey === 'total praise');
  it('matches a sermon sharing the scripture', () => {
    const sermons = [
      { id: 's1', title: 'Enter His Gates', scriptureRef: 'Psalm 100', serviceDate: '2026-06-21', notes: '' },
      { id: 's2', title: 'For God So Loved', scriptureRef: 'John 3:16', serviceDate: '2026-06-14', notes: '' },
    ];
    const out = crossRefSermons(total, sermons);
    expect(out[0].sermon.id).toBe('s1');
    expect(out.find((x) => x.sermon.id === 's2')).toBeUndefined();
  });
});

describe('lastSungLabel — honest relative recency', () => {
  it('new song never sung', () => {
    expect(lastSungLabel({ lastSung: null }, TODAY)).toBe('New — not sung yet');
  });
  it('this week / weeks ago', () => {
    expect(lastSungLabel({ lastSung: '2026-06-22' }, TODAY)).toBe('Sung this week');
    expect(lastSungLabel({ lastSung: '2026-05-10' }, TODAY)).toMatch(/weeks ago/);
  });
});
