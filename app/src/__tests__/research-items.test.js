// =============================================================================
// research-items — an unanswered item never looks done, and verified:false
// cannot disappear (DR-1172)
// =============================================================================
// The two behaviours worth a gate, both named in the brief:
//   1. A row nobody has looked into reads WAITING, not working and not answered.
//      A queue that looks finished is how an item he sent gets lost.
//   2. `verified:false` and its sentence are on EVERY item, and no row and no
//      edit can remove them (DR-0076 / DR-1101).
// Plus: a read that FAILS is never an empty list (unknown is not a no), and a
// source link can never be javascript: or file:.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  researchItems, waitingItems, fetchMyResearch, parseAnswer, researchKind, firstLink,
  UNVERIFIED_NOTE, RESEARCH_TAG, ANSWER_TAG, FAILED_TAG, CLAIMED_TAG,
} from '../lib/research-items.js';

const row = (o) => ({ id: 'a', body: '', tags: [], created_at: '2026-10-21T06:00:00Z', created_by: 'u1', ...o });

describe('an unanswered item never looks done', () => {
  it('a row nobody claimed reads waiting, however old it is', () => {
    const items = researchItems([row({ id: 'r1', body: 'https://youtu.be/aQgXzVSjwWg', tags: [RESEARCH_TAG], created_at: '2020-01-01T00:00:00Z' })]);
    expect(items).toHaveLength(1);
    expect(items[0].state).toBe('waiting');
    expect(items[0].label).toBe('Waiting to be looked into');
  });

  it('a claimed row reads working — claimed is not answered', () => {
    const items = researchItems([row({ id: 'r1', tags: [RESEARCH_TAG, CLAIMED_TAG], body: 'a question?' })]);
    expect(items[0].state).toBe('working');
  });

  it('an answer is senior to a claim: claimed THEN answered reads answered', () => {
    const items = researchItems([
      row({ id: 'r1', tags: [RESEARCH_TAG, CLAIMED_TAG], body: 'a question?' }),
      row({ id: 'c1', tags: [ANSWER_TAG, 'of:r1'], body: 'the answer text here, long enough' }),
    ]);
    expect(items[0].state).toBe('answered');
    expect(items[0].answer).toContain('the answer text here');
  });

  it('waitingItems counts only the ones nothing has taken', () => {
    const rows = [
      row({ id: 'r1', tags: [RESEARCH_TAG] }),
      row({ id: 'r2', tags: [RESEARCH_TAG, CLAIMED_TAG] }),
      row({ id: 'r3', tags: [RESEARCH_TAG] }),
      row({ id: 'c3', tags: [ANSWER_TAG, 'of:r3'], body: 'answered already, plenty of text' }),
    ];
    expect(waitingItems(rows).map((i) => i.id)).toEqual(['r1']);
  });

  it('a child row is never listed as an item of its own', () => {
    const items = researchItems([
      row({ id: 'r1', tags: [RESEARCH_TAG] }),
      // a child that ALSO carries the research tag must still not become an item
      row({ id: 'c1', tags: [RESEARCH_TAG, ANSWER_TAG, 'of:r1'], body: 'words enough to read' }),
    ]);
    expect(items.map((i) => i.id)).toEqual(['r1']);
  });

  it('a failure shows its why, and does not read as answered', () => {
    const items = researchItems([
      row({ id: 'r1', tags: [RESEARCH_TAG, CLAIMED_TAG] }),
      row({ id: 'c1', tags: [FAILED_TAG, 'of:r1'], body: 'no captions came back for this video' }),
    ]);
    expect(items[0].state).toBe('failed');
    expect(items[0].why).toContain('no captions');
  });
});

describe('verified:false cannot disappear from an item', () => {
  it('every item carries verified:false and the sentence', () => {
    const items = researchItems([
      row({ id: 'r1', tags: [RESEARCH_TAG] }),
      row({ id: 'r2', tags: [RESEARCH_TAG, CLAIMED_TAG] }),
      row({ id: 'r3', tags: [RESEARCH_TAG] }),
      row({ id: 'c3', tags: [ANSWER_TAG, 'of:r3'], body: 'an answer with sources' }),
    ]);
    expect(items).toHaveLength(3);
    for (const i of items) {
      expect(i.verified).toBe(false);
      expect(i.note).toBe(UNVERIFIED_NOTE);
    }
    expect(UNVERIFIED_NOTE.toLowerCase()).toContain('unverified');
  });

  it('a row CLAIMING to be verified is still unverified — the row does not decide', () => {
    // The adversarial case: a row arrives asserting it was checked.
    const items = researchItems([
      row({ id: 'r1', tags: [RESEARCH_TAG, 'verified', 'verified:true'], body: 'trust me' }),
      row({ id: 'c1', tags: [ANSWER_TAG, 'of:r1'], body: 'an answer that says it is checked' }),
    ]);
    expect(items[0].verified).toBe(false);
  });
});

describe('an answer is parsed, and its links are safe', () => {
  it('splits the answer from its sources', () => {
    const { answer, sources } = parseAnswer('The answer.\n\nSources:\nhttps://a.example/x\nhttps://b.example/y\n');
    expect(answer).toBe('The answer.');
    expect(sources.map((s) => s.url)).toEqual(['https://a.example/x', 'https://b.example/y']);
  });

  it('drops a javascript: or file: source rather than drawing it', () => {
    const { sources } = parseAnswer('A.\n\nSources:\njavascript:alert(1)\nfile:///etc/passwd\nhttps://ok.example/z\n');
    expect(sources.map((s) => s.url)).toEqual(['https://ok.example/z']);
  });

  it('an answer with no Sources block is still an answer', () => {
    const { answer, sources } = parseAnswer('Just the answer, nothing else.');
    expect(answer).toBe('Just the answer, nothing else.');
    expect(sources).toEqual([]);
  });
});

describe('a link and a question are told apart', () => {
  it('a youtube link is a link', () => {
    expect(researchKind('Link to the research for our tvtyme https://youtu.be/aQgXzVSjwWg')).toBe('link');
    expect(firstLink('see https://youtu.be/aQgXzVSjwWg now')).toBe('https://youtu.be/aQgXzVSjwWg');
  });

  it('trailing punctuation is not part of the link', () => {
    expect(firstLink('read https://a.example/x.')).toBe('https://a.example/x');
  });

  it('plain words are a question', () => {
    expect(researchKind('which of these can we run ourselves?')).toBe('question');
  });
});

describe('a read that failed is never an empty list', () => {
  it('reports the reason instead of showing nothing (DR-0076)', async () => {
    const supabase = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
      from: () => ({
        select: () => ({
          or: () => ({
            eq: () => ({
              order: () => ({ limit: async () => ({ data: null, error: { message: 'permission denied' } }) }),
            }),
          }),
        }),
      }),
    };
    const r = await fetchMyResearch({ supabase });
    expect(r.ok).toBe(false);
    expect(r.items).toEqual([]);
    expect(r.reason).toBe('permission denied');
  });

  it('signed out says so, and does not claim the person has sent nothing', async () => {
    const supabase = { auth: { getSession: async () => ({ data: { session: null } }) } };
    const r = await fetchMyResearch({ supabase });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('signed-out');
  });

  it('a real read returns the items, newest first', async () => {
    const data = [
      row({ id: 'old', tags: [RESEARCH_TAG], created_at: '2026-10-01T00:00:00Z' }),
      row({ id: 'new', tags: [RESEARCH_TAG], created_at: '2026-10-21T00:00:00Z' }),
    ];
    const supabase = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
      from: () => ({
        select: () => ({
          or: () => ({
            eq: () => ({ order: () => ({ limit: async () => ({ data, error: null }) }) }),
          }),
        }),
      }),
    };
    const r = await fetchMyResearch({ supabase });
    expect(r.ok).toBe(true);
    expect(r.items.map((i) => i.id)).toEqual(['new', 'old']);
  });
});
