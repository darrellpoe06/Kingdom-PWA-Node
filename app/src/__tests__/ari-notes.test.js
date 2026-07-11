// @vitest-environment node
//
// ari-notes — Ari's record derives from live sources (DR-0120/DR-0121 item 3):
// notes from the decision ledger (one per dated DR, so the feed updates with
// every build and cannot silently stall), workload from the real board rows
// (owner = Ari), and standing duties whose DR refs resolve against the live
// ledger (a dead ref reads as missing, never papered over — DR-0076).
import { describe, it, expect } from 'vitest';
import {
  ariNotesFromLedger, ariAssignments, resolveDuties, ARI_STANDING_DUTIES,
} from '../lib/ari-notes.js';

const LEDGER = {
  ok: true,
  count: 3,
  items: [
    { id: 'DR-0120', title: 'Finish ripples into the record', date: '2026-07-07', status: 'accepted', decision: 'Boards ride the timelines.' },
    { id: 'DR-0100', title: 'Older decision', date: '2026-07-04', status: 'accepted', decision: 'Speak established fact.' },
    { id: 'DR-9999', title: 'Undated row', date: '', status: 'accepted', decision: 'x' },
  ],
};

describe('ariNotesFromLedger', () => {
  it('derives one note per dated DR, newest-first, carrying the DR ref', () => {
    const notes = ariNotesFromLedger(LEDGER);
    expect(notes.map((n) => n.drRef)).toEqual(['DR-0120', 'DR-0100']);
    expect(notes[0]).toMatchObject({ kind: 'decision', date: '2026-07-07', readOnly: true });
    expect(notes[0].body).toContain('Boards ride the timelines');
  });
  it('drops undated rows instead of inventing a date (DR-0076)', () => {
    expect(ariNotesFromLedger(LEDGER).some((n) => n.drRef === 'DR-9999')).toBe(false);
  });
  it('respects the limit and degrades honestly on a missing ledger', () => {
    expect(ariNotesFromLedger(LEDGER, { limit: 1 })).toHaveLength(1);
    expect(ariNotesFromLedger(null)).toEqual([]);
    expect(ariNotesFromLedger({ ok: false })).toEqual([]);
  });
});

describe('ariAssignments', () => {
  const t = (over) => ({ slug: 's', title: 'x', boardSlug: 'b', boardTitle: 'B', status: 'not-started', owner: 'Ari', ...over });
  it('counts only AI-owned items, split open/done (legacy AI labels included)', () => {
    const out = ariAssignments([
      t({ slug: 'a', owner: 'Ari' }),
      t({ slug: 'b', owner: 'claude', status: 'in-progress' }), // legacy label normalizes to Ari
      t({ slug: 'c', owner: 'Ari', status: 'done' }),
      t({ slug: 'd', owner: 'Darrell' }),
    ]);
    expect(out).toMatchObject({ total: 3, open: 2, done: 1 });
    expect(out.openItems.map((x) => x.slug)).toEqual(['a', 'b']);
  });
  it('degrades honestly on empty input', () => {
    expect(ariAssignments([])).toMatchObject({ total: 0, open: 0, done: 0 });
    expect(ariAssignments(null).openItems).toEqual([]);
  });
});

describe('resolveDuties', () => {
  it('marks a duty found when its DR is in the ledger, missing when not', () => {
    const out = resolveDuties(LEDGER, [
      { key: 'a', duty: 'Do a thing', drRef: 'DR-0120' },
      { key: 'b', duty: 'Ghost duty', drRef: 'DR-0001' },
    ]);
    expect(out[0]).toMatchObject({ found: true, drDate: '2026-07-07' });
    expect(out[1].found).toBe(false);
  });
  it('every standing duty carries a DR ref (no unattributed responsibility)', () => {
    for (const d of ARI_STANDING_DUTIES) expect(d.drRef).toMatch(/^DR-\d{4}$/);
  });
  it('the av-loop duty exists, cites DR-0166, and carries the guardrails + derived-report rule', () => {
    const av = ARI_STANDING_DUTIES.find((d) => d.key === 'av-loop');
    expect(av).toBeTruthy();
    expect(av.drRef).toBe('DR-0166');
    expect(av.duty).toMatch(/humans-keep-the-live-cut|live cut/i);
    expect(av.duty).toMatch(/UNVERIFIED/);
  });
});
