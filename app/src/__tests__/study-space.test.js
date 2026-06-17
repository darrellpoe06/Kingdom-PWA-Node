// =============================================================================
// study-space + Study access — proven-to-catch gate (Verification Doctrine).
// =============================================================================
// Darrell's Study is PRIVATE (circle = Darrell + Christina + BG) and SOVEREIGN
// (device-local, never cloud). Two properties must hold and stay held:
//   1. ACCESS no-leak — isStudyCircleEmail admits EXACTLY the three, and nobody
//      else (anonymous, an outside signed-in user, a future church-staff email).
//   2. DATA shape + persistence — seed/distill/capture/filter behave, and the
//      device-local round-trip survives. Each test below is written to FAIL if
//      the corresponding behavior regresses (it asserts the catch, not just the
//      happy path).
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { isStudyCircleEmail } from '../poe-financial-mvp-v28.jsx';
import {
  emptyStudy, seedIfEmpty, SEED_THEMES, normalizeEntry, distillState,
  captureExchange, filterEntries, countsByKind, briefingReady,
  upsertEntry, removeEntry, togglePin, sortEntries,
  loadStudy, saveStudy, studyKey, KIND_ORDER,
} from '../lib/study-space.js';

describe('access — the circle is exactly three, no-leak', () => {
  it('admits Darrell, Christina (both emails), and BG', () => {
    expect(isStudyCircleEmail('darrellpoe06@gmail.com')).toBe(true);
    expect(isStudyCircleEmail('mrspoe06@gmail.com')).toBe(true);
    expect(isStudyCircleEmail('christina@tlctherapysolutions.com')).toBe(true);
    expect(isStudyCircleEmail('bg@thechurchofthelivinggod.com')).toBe(true);
  });
  it('is case-insensitive (sign-in casing must not bypass the gate)', () => {
    expect(isStudyCircleEmail('DarrellPoe06@Gmail.com')).toBe(true);
    expect(isStudyCircleEmail('BG@TheChurchOfTheLivingGod.com')).toBe(true);
  });
  it('DENIES everyone outside the circle (anonymous, outsider, empty)', () => {
    expect(isStudyCircleEmail('')).toBe(false);
    expect(isStudyCircleEmail(null)).toBe(false);
    expect(isStudyCircleEmail(undefined)).toBe(false);
    expect(isStudyCircleEmail('freddie@example.com')).toBe(false);
    expect(isStudyCircleEmail('someone@thechurchofthelivinggod.com')).toBe(false);
  });
});

describe('seed — today\'s themes land the first time only', () => {
  it('seeds an empty study with all seven titled reflections', () => {
    const s = seedIfEmpty(emptyStudy(), 1_700_000_000_000);
    expect(s.entries.length).toBe(SEED_THEMES.length);
    expect(s.entries.length).toBe(7);
    for (const e of s.entries) {
      expect(e.kind).toBe('reflection');
      expect(e.seed).toBe(true);
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.deep.length).toBeGreaterThan(0); // every seed has its deep source
    }
  });
  it('covers the named themes', () => {
    const s = seedIfEmpty(emptyStudy(), 1);
    const titles = s.entries.map((e) => e.title.toLowerCase()).join(' | ');
    for (const needle of ['metanoia', 'joy', 'wilderness', 'footstool', 'godhead', 'father of lights', 'pipeline']) {
      expect(titles).toContain(needle);
    }
  });
  it('is idempotent — never re-seeds a study that already has entries', () => {
    const seeded = seedIfEmpty(emptyStudy(), 1);
    const again = seedIfEmpty(seeded, 2);
    expect(again.entries.length).toBe(seeded.entries.length);
    // a study with one user entry is NOT seeded over
    const user = { ...emptyStudy(), entries: [normalizeEntry({ kind: 'processing', title: 'mine' }, 5)] };
    expect(seedIfEmpty(user, 9).entries.length).toBe(1);
  });
});

describe('distillation path — deep <-> plain', () => {
  it('classifies all four states', () => {
    expect(distillState({ deep: 'x', plain: 'y' })).toBe('both');
    expect(distillState({ deep: 'x', plain: '' })).toBe('deep-only');
    expect(distillState({ deep: '', plain: 'y' })).toBe('plain-only');
    expect(distillState({ deep: '  ', plain: '' })).toBe('empty');
  });
  it('briefingReady = reflections distilled BOTH ways only', () => {
    const entries = [
      normalizeEntry({ kind: 'reflection', title: 'a', deep: 'd', plain: 'p' }, 1),
      normalizeEntry({ kind: 'reflection', title: 'b', deep: 'd' }, 2),           // deep only
      normalizeEntry({ kind: 'processing', title: 'c', deep: 'd', plain: 'p' }, 3), // not a reflection
    ];
    const ready = briefingReady(entries);
    expect(ready.length).toBe(1);
    expect(ready[0].title).toBe('a');
  });
});

describe('capture — a pasted exchange becomes a deep-source reflection', () => {
  it('uses the first non-empty line as the title when none given', () => {
    const e = captureExchange({ text: '\n  Metanoia is the renewed mind\nmore text' }, 10);
    expect(e.kind).toBe('reflection');
    expect(e.title).toBe('Metanoia is the renewed mind');
    expect(e.deep).toContain('more text');
    expect(distillState(e)).toBe('deep-only'); // plain is the work he does next
  });
  it('respects an explicit title', () => {
    const e = captureExchange({ title: 'The Table', text: 'body' }, 10);
    expect(e.title).toBe('The Table');
  });
});

describe('list ops are pure + behave', () => {
  it('filters by room and free-text across every field', () => {
    const entries = [
      normalizeEntry({ kind: 'reflection', title: 'Joy', plain: 'strength' }, 1),
      normalizeEntry({ kind: 'research', title: 'Reach', culture: 'campus students' }, 2),
      normalizeEntry({ kind: 'processing', title: 'Build', deep: 'const x = 1' }, 3),
    ];
    expect(filterEntries(entries, 'reflection').length).toBe(1);
    expect(filterEntries(entries, null, 'students').map((e) => e.title)).toEqual(['Reach']);
    expect(filterEntries(entries, null, 'const x').map((e) => e.title)).toEqual(['Build']);
    expect(countsByKind(entries)).toEqual({ reflection: 1, processing: 1, research: 1 });
  });
  it('upsert / remove / pin / sort do not mutate the input', () => {
    const a = normalizeEntry({ id: 'a', kind: 'reflection', title: 'A', createdAt: '2026-01-01T00:00:00.000Z' }, 1);
    const b = normalizeEntry({ id: 'b', kind: 'reflection', title: 'B', createdAt: '2026-02-01T00:00:00.000Z' }, 2);
    const list = [a, b];
    const added = upsertEntry(list, normalizeEntry({ id: 'c', kind: 'processing', title: 'C' }, 3));
    expect(list.length).toBe(2); // unchanged
    expect(added.length).toBe(3);
    const pinned = togglePin(added, 'a');
    expect(added.find((e) => e.id === 'a').pinned).toBe(false); // input unchanged
    expect(pinned.find((e) => e.id === 'a').pinned).toBe(true);
    const sorted = sortEntries(pinned);
    expect(sorted[0].id).toBe('a'); // pinned first
    expect(removeEntry(added, 'b').map((e) => e.id)).toEqual(['c', 'a']);
  });
});

describe('device-local persistence round-trips + fails soft', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
  });
  it('keys by identity so two profiles never collide', () => {
    expect(studyKey('a@x.com')).not.toBe(studyKey('b@x.com'));
    saveStudy('a@x.com', { label: 'A', entries: [normalizeEntry({ title: 'mine' }, 1)] });
    saveStudy('b@x.com', { label: 'B', entries: [] });
    expect(loadStudy('a@x.com').entries.length).toBe(1);
    expect(loadStudy('b@x.com').entries.length).toBe(0);
    expect(loadStudy('a@x.com').label).toBe('A');
  });
  it('round-trips a seeded study', () => {
    const seeded = seedIfEmpty(emptyStudy(), 1);
    saveStudy('darrellpoe06@gmail.com', seeded);
    const back = loadStudy('darrellpoe06@gmail.com');
    expect(back.entries.length).toBe(seeded.entries.length);
    expect(back.entries[0].title).toBe(seeded.entries[0].title);
  });
  it('does not throw when localStorage is missing', () => {
    delete globalThis.localStorage;
    expect(() => loadStudy('x')).not.toThrow();
    expect(loadStudy('x').entries).toEqual([]);
    expect(saveStudy('x', emptyStudy())).toEqual({ skipped: 'no-storage' });
  });
});

describe('room model is the three named rooms', () => {
  it('exposes reflection, processing, research in order', () => {
    expect(KIND_ORDER).toEqual(['reflection', 'processing', 'research']);
  });
});
