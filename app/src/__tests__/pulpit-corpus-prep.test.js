// @vitest-environment node
//
// Pulpit — corpusPrep retrieval (DR-0076: the prep help is "sourced from him"
// because it is REAL retrieval over his own messages, nothing invented). These
// pin the behavior so a future change can't quietly turn it into fabrication.
import { describe, it, expect } from 'vitest';
import { corpusPrep } from '../lib/pulpit-prep.js';

const CORPUS = [
  { id: 1, title: 'You Were Built To Win', scriptureRef: 'Romans 8', notes: 'victory in Christ', serviceDate: '2024-05-12', status: 'active' },
  { id: 2, title: 'Faith, The Final Frontier', scriptureRef: 'Hebrews 11', notes: '', serviceDate: '2026-01-14', status: 'active' },
  { id: 3, title: 'Keep The Fire Burning', scriptureRef: 'Romans 8', notes: 'do not give up faith', serviceDate: '2025-05-28', status: 'active' },
  { id: 4, title: 'A planning draft', scriptureRef: 'John 1', notes: 'faith', serviceDate: '2026-07-01', status: 'draft' },
];

describe('corpusPrep — real retrieval over BG\'s own messages', () => {
  it('an empty query surfaces nothing but still counts the corpus (no fabrication)', () => {
    const r = corpusPrep(CORPUS, '');
    expect(r.matches).toEqual([]);
    expect(r.total).toBe(3); // drafts excluded from the studyable corpus
  });

  it('matches on title, scripture, OR notes, case-insensitively', () => {
    const r = corpusPrep(CORPUS, 'FAITH');
    // titles/notes mention faith on #2 and #3; draft #4 is excluded entirely.
    expect(r.matches.map((m) => m.id).sort()).toEqual([2, 3]);
  });

  it('dedupes + sorts the scriptures he has actually used, and spans the years', () => {
    const r = corpusPrep(CORPUS, 'romans');
    expect(r.matches.map((m) => m.id).sort()).toEqual([1, 3]);
    expect(r.scriptures).toEqual(['Romans 8']); // deduped across the two messages
    expect(r.span).toBe('2024–2025');
  });

  it('never returns a draft as a finished message', () => {
    const r = corpusPrep(CORPUS, 'planning');
    expect(r.matches).toEqual([]); // the only "planning" hit is a draft
  });

  it('a single-year match reports just that year', () => {
    const r = corpusPrep(CORPUS, 'frontier');
    expect(r.span).toBe('2026');
  });
});
