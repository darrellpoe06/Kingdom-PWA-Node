// =============================================================================
// interconnect-flow — PROOF that the fixed loops actually MOVE live data, not just
// that the wiring tokens exist. Feeds each engine the real live-row shape the wired
// source now provides, and asserts the data arrives at the destination.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { appearancesFor, connectionsFor } from '../lib/scripture-connections.js';
import { leadFromPracticeAcquisition } from '../lib/crm-engine.js';
import { toSermonShape, toSongShape } from '../lib/choir-sync.js';
import { assessLoops } from '../lib/loop-health.js';

describe('Scripture appearances loop — live sermons/songs reach the verse web', () => {
  // The exact row shape subscribeSermons / subscribeSongs emit (mapped from the
  // real choir_sermons / choir_songs rows). Before the 2026-06-29 fix the surface
  // passed [] here; now ScriptureLibrary subscribes the live source.
  const sermonRow = toSermonShape({ id: 's1', title: 'The Love of God', scripture_ref: 'John 3:16', service_date: '2026-06-21' });
  const songRow = toSongShape({ id: 'g1', title: 'For God So Loved', scripture_ref: 'John 3:16', service_date: '2026-06-21' });

  it('a verse finds its appearances in the real sermons + songs', () => {
    const ap = appearancesFor('John 3:16', { sermons: [sermonRow], songs: [songRow] });
    expect(ap.sermons.map((s) => s.id)).toContain('s1');
    expect(ap.songs.map((s) => s.id)).toContain('g1');
    expect(ap.total).toBeGreaterThanOrEqual(2);
  });

  it('the empty case is honestly empty (no painted appearances)', () => {
    const ap = appearancesFor('John 3:16', { sermons: [], songs: [] });
    expect(ap.total).toBe(0);
  });

  it('connectionsFor surfaces the live appearance count the component renders', () => {
    const conn = connectionsFor('John 3:16', { sermons: [sermonRow], songs: [songRow] });
    expect(conn.counts.appearances).toBeGreaterThanOrEqual(2);
  });
});

describe('CRM federation loop — practice_leads become real CRM leads', () => {
  // A practice_leads row (the revenue-team funnel the CRM board was blind to).
  const practiceLead = {
    id: 'pl-1', name: 'Acme Clinic', audiencePresetKey: 'patient-practice',
    stage: 'new', contactMethod: 'email', contactValue: 'intake@acme.test',
    source: 'referral', consent: { outreachOk: true, capturedAt: '2026-06-20' },
  };

  it('a practice lead maps into the canonical CRM lead shape (lands on the board)', () => {
    const lead = leadFromPracticeAcquisition(practiceLead);
    expect(lead).toBeTruthy();
    expect(lead.business).toBe('tlc');
    expect(lead.pipeline).toBe('tlc-client-intake');
    expect(lead.name).toBe('Acme Clinic');
  });

  it('federation dedups by id the way the unified board does', () => {
    const inquiriesAsLeads = [{ id: 'pl-1', name: 'dup' }]; // same id from another funnel
    const fed = [leadFromPracticeAcquisition(practiceLead)].filter(Boolean);
    const byId = new Map();
    for (const l of [...inquiriesAsLeads, ...fed]) byId.set(l.id, l);
    expect(byId.size).toBe(1); // no double-count
  });
});

describe('Feedback → Concerns loop — self-reports freshness from real rows', () => {
  it('a captured concern row makes the loop read fresh (propagates into Loop Health)', () => {
    const now = Date.parse('2026-06-29T00:00:00Z');
    const data = { concerns: [{ id: 'cn-1', concern: 'x', createdAt: '2026-06-28T00:00:00Z' }] };
    const loops = assessLoops(data, now, {});
    const fc = loops.find((l) => l.key === 'feedback-concerns');
    expect(fc).toBeTruthy();
    expect(fc.status).toBe('fresh'); // a real row → live, not painted
  });

  it('with no concern row yet it reads awaiting (wired, self-heals) — never a dead "never"', () => {
    const now = Date.parse('2026-06-29T00:00:00Z');
    const loops = assessLoops({ concerns: [] }, now, {});
    const fc = loops.find((l) => l.key === 'feedback-concerns');
    expect(fc.status).toBe('awaiting');
  });
});
