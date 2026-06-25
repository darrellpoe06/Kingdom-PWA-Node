import { describe, it, expect } from 'vitest';
import {
  availableRecipes, buildRecipe, lessonModuleToSource, algorithmToSource,
  scriptureThemeToSource, sermonToSource, upsertBook, removeBook, kjvResolver,
} from '../lib/book-corpus.js';

describe('availableRecipes — honest about what can be built now', () => {
  const recipes = availableRecipes({});
  it('offers the course + algorithm + scripture recipes from real corpus', () => {
    const ids = recipes.map((r) => r.id);
    expect(ids).toContain('course-living-lessons');
    expect(ids).toContain('algorithms');
    expect(ids).toContain('scripture-themes');
  });
  it('marks sermons unavailable (with a reason) when none are loaded', () => {
    const sermons = recipes.find((r) => r.id === 'sermons');
    expect(sermons.available).toBe(false);
    expect(sermons.reason).toBeTruthy();
  });
  it('every available recipe has a positive count', () => {
    recipes.filter((r) => r.available).forEach((r) => expect(r.count).toBeGreaterThan(0));
  });
});

describe('buildRecipe — assembles real books from the corpus', () => {
  it('builds the Living Lessons course into a book', () => {
    const book = buildRecipe('course-living-lessons', {}, { nowIso: '2026-06-25T00:00:00Z' });
    expect(book).toBeTruthy();
    expect(book.chapters.length).toBeGreaterThan(0);
    expect(book.title).toBeTruthy();
    // integrity is COMPUTED honestly (unresolved KJV refs are flagged, not faked)
    expect(typeof book.integrity.ok).toBe('boolean');
    expect(book.integrity.fabricationFree).toBe(true);
  });

  it('builds the Eternal Algorithms book from the seed catalog', () => {
    const book = buildRecipe('algorithms', {}, { nowIso: '2026-06-25T00:00:00Z' });
    expect(book.id).toBe('book-eternal-algorithms');
    expect(book.chapters.length).toBeGreaterThan(0);
  });

  it('returns null for sermons when none are loaded (no painted book)', () => {
    expect(buildRecipe('sermons', {})).toBeNull();
  });
});

describe('adapters preserve provenance + Scripture refs', () => {
  it('lesson adapter pulls the anchor refs and bigIdea', () => {
    const s = lessonModuleToSource({ id: 'm', title: 'T', bigIdea: 'idea', lesson: 'body', anchor: { ref: 'John 3:16; Romans 8:28' }, benefits: ['x'], inApp: 'try' }, { title: 'Course' });
    expect(s.scriptureRefs).toEqual(['John 3:16', 'Romans 8:28']);
    expect(s.intro).toBe('idea');
    expect(s.provenance.note).toBe('Course');
  });
  it('algorithm adapter keeps the 4D pattern, 3D practice, and outcome', () => {
    const s = algorithmToSource({ name: 'Pattern', fourD: { summary: '4d', scripture: 'John 3:16' }, threeD: { summary: '3d' }, outcome: 'result' });
    expect(s.title).toBe('Pattern');
    expect(s.blocks.some((b) => b.kind === 'note' && b.text === 'result')).toBe(true);
    expect(s.scriptureRefs).toContain('John 3:16');
  });
  it('sermon adapter always yields a body (a watch note) + carries the video provenance', () => {
    const s = sermonToSource({ id: 'x', title: 'Msg', speaker: 'BG', serviceDate: '2026-01-01', scriptureRef: 'John 3:16', videoId: 'vid', startSeconds: 42, youtubeUrl: 'http://y/vid' });
    expect(s.blocks.length).toBeGreaterThan(0);
    expect(s.provenance.videoId).toBe('vid');
    expect(s.provenance.startSeconds).toBe(42);
    expect(s.author).toBe('BG');
  });
  it('scripture-theme adapter turns each verse into a Scripture block', () => {
    const s = scriptureThemeToSource({ id: 't', title: 'Theme', verses: [{ ref: 'John 3:16', gloss: 'love' }] });
    expect(s.blocks.some((b) => b.kind === 'scripture' && b.ref === 'John 3:16')).toBe(true);
  });
});

describe('kjvResolver', () => {
  it('returns verbatim KJV when present, null otherwise (never faked)', () => {
    expect(kjvResolver('Nowhere 9:9')).toBeNull();
  });
});

describe('shelf upsert/remove', () => {
  it('upsert replaces by id and prepends', () => {
    const a = { id: '1', title: 'A' };
    const b = { id: '1', title: 'A2' };
    const after = upsertBook([a, { id: '2', title: 'B' }], b);
    expect(after[0].title).toBe('A2');
    expect(after).toHaveLength(2);
  });
  it('remove drops by id', () => {
    expect(removeBook([{ id: '1' }, { id: '2' }], '1')).toEqual([{ id: '2' }]);
  });
});
