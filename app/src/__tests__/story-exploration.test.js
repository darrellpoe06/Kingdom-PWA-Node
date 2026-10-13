// =============================================================================
// story-exploration.test.js — the "Explore Your Story" data + persistence
// =============================================================================
// Pins (DR-0076): every anchor verse is present VERBATIM (KJV), the exact
// question is framed for both depths, the TLC guardrail is on the surface data,
// and the device-local persistence is a correct, capped, private trace. These
// are proven-to-catch: change a verse and the assertion fails.
import { describe, it, expect } from 'vitest';
import {
  explorationFor, EXPLORATION_STEPS, EXPLORATION_LESSON_ID,
  EXPLORATION_OPENING, EXPLORATION_JOSEPH_ANCHOR, EXPLORATION_CLOSING, EXPLORATION_GUARDRAIL,
  loadReflections, saveReflection, deleteReflection, reflectionHasContent, STORY_MAX,
} from '../lib/story-exploration.js';

// A tiny in-memory storage stub (getItem/setItem) — the whole persistence trace
// is machine-checked without touching a real browser.
function memStorage(seed = null) {
  const m = new Map();
  if (seed !== null) m.set('poe.storyExploration.v1', seed);
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

describe('story-exploration — the exact question, verse-anchored', () => {
  it('is the L27 companion and offers the three Joseph-method steps', () => {
    expect(EXPLORATION_LESSON_ID).toBe('ll27-the-god-who-documents-his-grief');
    expect(EXPLORATION_STEPS.map((s) => s.key)).toEqual(['where', 'preserving', 'comfort']);
    expect(EXPLORATION_STEPS.map((s) => s.ref)).toEqual([
      'Isaiah 63:9', 'Genesis 45:5; Deuteronomy 8:2', '2 Corinthians 1:3-4',
    ]);
  });

  it('carries every anchor verse VERBATIM (KJV)', () => {
    expect(EXPLORATION_OPENING.ref).toBe('Psalms 56:8');
    expect(EXPLORATION_OPENING.verse).toBe(
      'Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?',
    );
    const byKey = Object.fromEntries(EXPLORATION_STEPS.map((s) => [s.key, s.verse]));
    expect(byKey.where).toBe(
      'In all their affliction he was afflicted, and the angel of his presence saved them: in his love and in his pity he redeemed them; and he bare them, and carried them all the days of old.',
    );
    expect(byKey.preserving).toContain('for God did send me before you to preserve life.');
    expect(byKey.preserving).toContain('And thou shalt remember all the way which the LORD thy God led thee');
    expect(byKey.comfort).toContain('the Father of mercies, and the God of all comfort');
    expect(byKey.comfort).toContain('that we may be able to comfort them which are in any trouble');
    expect(EXPLORATION_JOSEPH_ANCHOR.verse).toBe(
      'But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.',
    );
    expect(EXPLORATION_CLOSING.verse).toBe(
      'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
    );
  });

  it('frames for two depths — child reads child words, everything else the seasoned words', () => {
    const child = explorationFor('child');
    const senior = explorationFor('senior');
    const adult = explorationFor('older'); // any non-child level -> seasoned framing
    expect(child.invitation).not.toBe(senior.invitation);
    expect(adult.invitation).toBe(senior.invitation);
    expect(child.steps[0].prompt).not.toBe(senior.steps[0].prompt);
    // both depths still anchor on the same verse
    expect(child.steps[0].ref).toBe('Isaiah 63:9');
    expect(senior.steps[0].verse).toBe(child.steps[0].verse);
  });

  it('holds the TLC bright line on the surface — reflection, not clinical therapy', () => {
    expect(EXPLORATION_GUARDRAIL).toContain('not clinical therapy');
    expect(explorationFor('senior').guardrail).toBe(EXPLORATION_GUARDRAIL);
  });
});

describe('story-exploration — private device-local persistence', () => {
  it('an empty reflection never saves (no painted rows)', () => {
    const s = memStorage();
    expect(reflectionHasContent({ memory: '  ', where: '', preserving: '', comfort: '' })).toBe(false);
    const out = saveReflection(s, { memory: '   ', id: 'x', at: 't' });
    expect(out).toEqual([]);
    expect(loadReflections(s)).toEqual([]);
  });

  it('saves newest-first, trims fields, and reads back', () => {
    const s = memStorage();
    saveReflection(s, { memory: '  first  ', where: 'He was there', id: 'a', at: '2026-07-11T00:00:00Z' });
    const list = saveReflection(s, { memory: 'second', comfort: 'help others', id: 'b', at: '2026-07-11T01:00:00Z' });
    expect(list.map((r) => r.id)).toEqual(['b', 'a']);
    expect(list[1].memory).toBe('first'); // trimmed
    expect(loadReflections(s).map((r) => r.memory)).toEqual(['second', 'first']);
  });

  it('caps at STORY_MAX and deletes by id', () => {
    let s = memStorage();
    for (let i = 0; i < STORY_MAX + 5; i++) saveReflection(s, { memory: `m${i}`, id: `id${i}`, at: `t${i}` });
    expect(loadReflections(s).length).toBe(STORY_MAX);
    const first = loadReflections(s)[0];
    const after = deleteReflection(s, first.id);
    expect(after.find((r) => r.id === first.id)).toBeUndefined();
    expect(after.length).toBe(STORY_MAX - 1);
  });

  it('degrades to [] on malformed storage (never throws on the surface)', () => {
    expect(loadReflections(memStorage('not json{'))).toEqual([]);
    expect(loadReflections(memStorage('{"a":1}'))).toEqual([]); // non-array
    expect(loadReflections(null)).toEqual([]);
  });
});
