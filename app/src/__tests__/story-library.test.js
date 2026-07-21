// Locks the Story Library truth-label contract (Darrell 2026-07-21): the Layer-2
// curation spine where a user captures a story that fits the Word and a steward
// promotes it into a lesson. "never lie call a parable and testimony whatever
// they actually are." The gate here is the SAME rule the curriculum enforces in
// lesson-flow.test.js -- a promoted submission is always a valid lesson story.
//
// supabase is mocked so this is a pure unit test (no network). The tests are
// proven-to-catch (DR-0076): each includes cases that MUST fail the gate.
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    rpc: async () => ({ data: null, error: null }),
    from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  },
}));

import {
  validateSubmission, canPromote, normalizeForPromotion,
  STORY_KINDS, STORY_TONES, MIN_BODY_WORDS,
  saveDraft, listDrafts, removeDraft,
} from '../lib/story-library.js';

const BODY = 'A neighbor kept his door unlocked and every worry wandered in and made itself at home until he learned to meet each thought at the threshold and turn the liars away.';

function parable(over = {}) {
  return { kind: 'parable', tone: 'light', title: 'The Open Door', body: BODY, verse: '2 Corinthians 10:5', ...over };
}
function testimony(over = {}) {
  return { kind: 'testimony', tone: 'solemn', title: 'The Night I Was Kept', body: BODY, verse: 'Psalms 34:4', source: 'Told by Ada Poe, 2026', consent: true, ...over };
}

describe('validateSubmission -- the never-lie truth-label gate', () => {
  it('accepts a well-formed parable (claims nothing real -> no source/consent needed)', () => {
    const v = validateSubmission(parable());
    expect(v.ok).toBe(true);
    expect(v.errors).toEqual([]);
  });

  it('accepts a well-formed testimony that is attributed AND consented', () => {
    expect(validateSubmission(testimony()).ok).toBe(true);
  });

  it('REJECTS a testimony with no source (a real account is never anonymous-as-fact)', () => {
    const v = validateSubmission(testimony({ source: '' }));
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/attributed/i);
  });

  it('REJECTS a testimony without explicit consent', () => {
    const v = validateSubmission(testimony({ consent: false }));
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/consent/i);
  });

  it('REJECTS an invalid kind (never a fiction mislabeled true)', () => {
    const v = validateSubmission(parable({ kind: 'story' }));
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/parable.*testimony/i);
  });

  it('REJECTS a missing title or verse', () => {
    expect(validateSubmission(parable({ title: '' })).ok).toBe(false);
    expect(validateSubmission(parable({ verse: '' })).ok).toBe(false);
  });

  it('REJECTS a body shorter than the floor', () => {
    const v = validateSubmission(parable({ body: 'Too short.' }));
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/too short/i);
  });

  it('REJECTS a bad tone when one is set', () => {
    expect(validateSubmission(parable({ tone: 'angry' })).ok).toBe(false);
  });
});

describe('normalizeForPromotion -- produces a valid lesson story', () => {
  it('a parable promotes WITHOUT a fabricated source', () => {
    const story = normalizeForPromotion(parable());
    expect(story).toEqual({ kind: 'parable', tone: 'light', title: 'The Open Door', body: BODY, verse: '2 Corinthians 10:5' });
    expect('source' in story).toBe(false);
  });

  it('a testimony promotes WITH its attribution carried through', () => {
    const story = normalizeForPromotion(testimony());
    expect(story.kind).toBe('testimony');
    expect(story.source).toBe('Told by Ada Poe, 2026');
  });

  it('throws when the submission is not promotable', () => {
    expect(() => normalizeForPromotion(testimony({ consent: false }))).toThrow();
  });

  // The curriculum's OWN gate (mirrors lesson-flow.test.js): a promoted story
  // must satisfy exactly this, or it could never ride in a lesson.
  function curriculumGate(s) {
    const offenders = [];
    if (s.kind != null && s.kind !== 'parable' && s.kind !== 'testimony') offenders.push('invalid kind');
    if (s.kind === 'testimony' && !(typeof s.source === 'string' && s.source.trim())) offenders.push('testimony without source');
    return offenders;
  }

  it('every promoted story passes the curriculum truth-label gate', () => {
    for (const sub of [parable(), testimony(), parable({ tone: 'solemn' })]) {
      const story = normalizeForPromotion(sub);
      expect(curriculumGate(story)).toEqual([]);
    }
  });
});

describe('canPromote mirrors the gate', () => {
  it('is true iff validateSubmission is ok', () => {
    expect(canPromote(parable())).toBe(true);
    expect(canPromote(testimony({ source: '' }))).toBe(false);
  });
});

describe('exported vocabulary is the honest two-label set', () => {
  it('kinds are exactly parable + testimony; tones light + solemn', () => {
    expect(STORY_KINDS).toEqual(['parable', 'testimony']);
    expect(STORY_TONES).toEqual(['light', 'solemn']);
    expect(MIN_BODY_WORDS).toBeGreaterThan(0);
  });
});

describe('local draft store -- nothing is lost while signed out', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* jsdom */ } });

  it('saves, lists, and removes a draft with a stable id', () => {
    const saved = saveDraft(parable());
    expect(saved.id).toMatch(/^sl-/);
    expect(saved.status).toBe('draft');
    const list = listDrafts();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('The Open Door');
    removeDraft(saved.id);
    expect(listDrafts().length).toBe(0);
  });

  it('upserts by id rather than duplicating', () => {
    const a = saveDraft(parable());
    saveDraft({ ...parable(), id: a.id, title: 'The Open Door (edited)' });
    const list = listDrafts();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('The Open Door (edited)');
  });

  it('gives the same local id for the same kind+title+verse (deterministic)', () => {
    const one = saveDraft(parable());
    localStorage.clear();
    const two = saveDraft(parable());
    expect(one.id).toBe(two.id);
  });
});
