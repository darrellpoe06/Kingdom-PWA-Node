import { describe, it, expect } from 'vitest';
import {
  emptyStudy, normalizeEntry, normalizeSource,
  entryFromSeed, seedKey, addSeedToStudy, deriveFrom,
} from '../lib/study-space.js';
import { studySeedFromVerse } from '../lib/studyable.js';

const VERSE_SEED = studySeedFromVerse({
  ref: 'John 3:16', kjv: 'For God so loved the world...', gloss: 'the gospel in one verse',
  themeId: 'salvation', themeTitle: 'Salvation & the Soul',
});

describe('study-space — provenance on the entry shape', () => {
  it('normalizeSource keeps a real pointer, drops an empty one', () => {
    expect(normalizeSource({ kind: 'scripture', id: 'John 3:16', label: 'Scripture' })).toMatchObject({ kind: 'scripture', id: 'John 3:16' });
    expect(normalizeSource({})).toBe(null);
    expect(normalizeSource(null)).toBe(null);
  });

  it('old entries (no source) load forward-compatibly to null', () => {
    expect(normalizeEntry({ title: 'old' }).source).toBe(null);
  });
});

describe('study-space — import a scripture lesson into the Study', () => {
  it('entryFromSeed lands the source as the DEEP layer, plain left for the owner', () => {
    const e = entryFromSeed(VERSE_SEED, 1000, 0);
    expect(e.kind).toBe('research');
    expect(e.deep).toContain('For God so loved');
    expect(e.plain).toBe('');
    expect(e.source).toMatchObject({ kind: 'scripture', id: 'John 3:16' });
  });

  it('addSeedToStudy is idempotent — re-saving refreshes, never duplicates', () => {
    let study = emptyStudy();
    const r1 = addSeedToStudy(study, VERSE_SEED, 1000, 0);
    expect(r1.added).toBe(true);
    expect(r1.study.entries.length).toBe(1);

    const r2 = addSeedToStudy(r1.study, VERSE_SEED, 2000, 0);
    expect(r2.added).toBe(false);                 // same source -> not a new entry
    expect(r2.study.entries.length).toBe(1);      // still one
  });

  it('PROVEN-TO-CATCH: distinct sources do NOT collide', () => {
    const other = studySeedFromVerse({ ref: 'Acts 4:12', kjv: 'Neither is there salvation...', themeId: 'salvation', themeTitle: 'Salvation & the Soul' });
    let study = emptyStudy();
    study = addSeedToStudy(study, VERSE_SEED, 1000, 0).study;
    study = addSeedToStudy(study, other, 1000, 1).study;
    expect(study.entries.length).toBe(2);
  });

  it('seedKey is the source identity', () => {
    expect(seedKey(VERSE_SEED)).toBe('scripture:John 3:16');
    expect(seedKey({})).toBe('');
  });
});

describe('study-space — the flywheel: create from an existing entry', () => {
  it('deriveFrom seeds a NEW study from the origin, plain blank, provenance set', () => {
    const origin = entryFromSeed(VERSE_SEED, 1000, 0);
    const child = deriveFrom(origin, 3000, 5);
    expect(child.id).not.toBe(origin.id);
    expect(child.title).toContain('From:');
    expect(child.deep).toContain('For God so loved'); // builds on the origin's material
    expect(child.plain).toBe('');
    expect(child.source).toMatchObject({ kind: 'study-entry', id: origin.id });
  });

  it('deriveFrom prefers the origin plain layer when present (build on the distilled)', () => {
    const origin = normalizeEntry({ title: 'T', deep: 'deep src', plain: 'plain distilled' }, 1000, 0);
    expect(deriveFrom(origin, 2000, 0).deep).toBe('plain distilled');
  });
});
