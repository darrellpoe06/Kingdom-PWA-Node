// decision-intelligence — the six readouts of Darrell's brief (DR-0589),
// derived from the rows the app already writes. Pinned: every readout comes
// from a real row and names it; no rows = unavailable; the clock is an
// argument; each readout is PROVEN-TO-CATCH with the row that should trip it
// and PROVEN-QUIET with the row that should not.
import { describe, it, expect } from 'vitest';
import { deriveDecisionIntelligence, concernChain, signatureOf, STALL_DAYS, DUE_SOON_DAYS } from '../lib/decision-intelligence.js';
import { deriveAppDecisions } from '../lib/decisions.js';
import { concernToRow, concernFromRow, CONCERN_COLUMN_OF } from '../lib/concerns-sync.js';

const NOW = Date.parse('2026-09-23T20:00:00Z');
const day = (n) => new Date(NOW + n * 86400000).toISOString().slice(0, 10);

const c = (over) => ({ id: 'cn-x', concern: 'Accounting workflow gaps block October go-live', status: 'open', area: 'accounting', updatedAt: new Date(NOW - 86400000).toISOString(), ...over });

describe('deriveDecisionIntelligence — honest when empty, and every readout names its rows', () => {
  it('no rows → unavailable, never a painted zero', () => {
    const r = deriveDecisionIntelligence({ nowMs: NOW });
    expect(r.ok).toBe(false);
    expect(r.risks).toEqual([]);
  });

  it('RISKS: the same worry stated twice is repeated; stated once is not', () => {
    const one = deriveDecisionIntelligence({ concerns: [c({ id: 'a' })], nowMs: NOW });
    expect(one.risks).toEqual([]);
    const two = deriveDecisionIntelligence({ concerns: [c({ id: 'a' }), c({ id: 'b', status: 'done', area: 'retail' })], nowMs: NOW });
    expect(two.risks).toHaveLength(1);
    expect(two.risks[0].count).toBe(2);
    expect(two.risks[0].open).toBe(1);
    expect(two.risks[0].sources.sort()).toEqual(['a', 'b']);
    expect(two.risks[0].why).toMatch(/Stated 2 times/);
    // and, because it spans two areas, it is a PATTERN too
    expect(two.patterns.some((p) => p.key === two.risks[0].key && p.areas.length === 2)).toBe(true);
  });

  it('DEPENDENCIES: an open concern waiting on an open row is named; one waiting on a done row is not', () => {
    const rows = [c({ id: 'a', links: { depends_on: ['b'] } }), c({ id: 'b', concern: 'Vendor enhancement delivered', status: 'in-progress' })];
    const r = deriveDecisionIntelligence({ concerns: rows, nowMs: NOW });
    expect(r.dependencies).toHaveLength(1);
    expect(r.dependencies[0]).toMatchObject({ id: 'a', waitsOn: 'b', sources: ['a', 'b'] });
    rows[1].status = 'done';
    expect(deriveDecisionIntelligence({ concerns: rows, nowMs: NOW }).dependencies).toEqual([]);
    // a project's own blocker field is a dependency too
    const p = deriveDecisionIntelligence({ projects: [{ id: 'pr-1', title: 'Prism', status: 'active', blocker: 'accounting enhancements' }], nowMs: NOW });
    expect(p.dependencies[0].why).toMatch(/names its own blocker/);
  });

  it('OWNERSHIP GAPS: an open concern with no owner, a project with no assignee, a hand-off with no receiver', () => {
    const r = deriveDecisionIntelligence({
      concerns: [c({ id: 'a' }), c({ id: 'b', owner: 'Prism' }), c({ id: 'd', status: 'done' })],
      projects: [{ id: 'pr-1', title: 'Roles', status: 'active', assigneePersonas: [] }, { id: 'pr-2', title: 'Owned', status: 'active', assigneePersonas: ['darrell'] }],
      discussions: [{ id: 'dc-1', kind: 'handoff', title: 'Push', meta: {} }, { id: 'dc-2', kind: 'handoff', title: 'Push', meta: { handoff: { to: 'ari' } } }],
      nowMs: NOW,
    });
    expect(r.ownershipGaps.map((g) => g.id).sort()).toEqual(['a', 'dc-1', 'pr-1']);
  });

  it('ESCALATIONS: a passed target or a quiet row is stalled; a fresh row with a future target is not', () => {
    const r = deriveDecisionIntelligence({
      concerns: [
        c({ id: 'slip', targetDate: day(-3) }),
        c({ id: 'idle', updatedAt: new Date(NOW - (STALL_DAYS + 1) * 86400000).toISOString() }),
        c({ id: 'fine', targetDate: day(40) }),
        c({ id: 'closed', status: 'done', targetDate: day(-30) }),
      ],
      projects: [{ id: 'pr-late', title: 'Late', status: 'active', endDate: day(-10) }],
      nowMs: NOW,
    });
    expect(r.escalations.map((e) => [e.id, e.kind])).toEqual([['idle', 'idle'], ['pr-late', 'slipped'], ['slip', 'slipped']]);
    expect(r.escalations.find((e) => e.id === 'slip').days).toBe(3);
  });

  it('TIMELINE THREATS: an open target inside the window with no work started; a project ending soon with a blocker or a linked open concern', () => {
    const r = deriveDecisionIntelligence({
      concerns: [
        c({ id: 'soon', targetDate: day(5) }),
        c({ id: 'started', status: 'in-progress', targetDate: day(5) }),
        c({ id: 'linked', links: { project_slug: 'pr-1' } }),
      ],
      projects: [
        { id: 'pr-1', title: 'Go-live', status: 'active', endDate: day(20) },
        { id: 'pr-2', title: 'Quiet', status: 'active', endDate: day(20) },
        { id: 'pr-3', title: 'Far', status: 'active', endDate: day(200), blocker: 'x' },
      ],
      nowMs: NOW,
    });
    expect(r.timelineThreats.map((t) => t.id)).toEqual(['soon', 'pr-1']);
    expect(r.timelineThreats[1].sources).toEqual(['pr-1', 'linked']);
    expect(DUE_SOON_DAYS).toBeGreaterThanOrEqual(5);
  });

  it('DECISIONS REQUIRED: only an open row that names a decision', () => {
    const r = deriveDecisionIntelligence({
      concerns: [c({ id: 'a', decisionRequired: 'Leadership: continue the roadmap?', impact: 'October window lost' }), c({ id: 'b' }), c({ id: 'd', status: 'done', decisionRequired: 'old' })],
      nowMs: NOW,
    });
    expect(r.decisionsRequired).toHaveLength(1);
    expect(r.decisionsRequired[0]).toMatchObject({ id: 'a', decision: 'Leadership: continue the roadmap?', impact: 'October window lost' });
    expect(r.counts.decisionsRequired).toBe(1);
  });

  it('is deterministic: same rows, same clock → same readout', () => {
    const rows = [c({ id: 'a', targetDate: day(-1) }), c({ id: 'b' })];
    expect(deriveDecisionIntelligence({ concerns: rows, nowMs: NOW })).toEqual(deriveDecisionIntelligence({ concerns: rows, nowMs: NOW }));
  });

  it('signatureOf ignores stop words and is stable', () => {
    expect(signatureOf('The accounting workflow gaps block the go-live')).toBe(signatureOf('accounting workflow GAPS block go-live!'));
    expect(signatureOf('')).toBe('');
  });
});

describe('the chain as database fields (0228) — mapper, columns, derived decision', () => {
  it('concernToRow sends the chain columns only when the local item carries them', () => {
    const bare = concernToRow({ id: 'cn-1', concern: 'C' }, { tenantId: 't', userId: 'u' });
    expect('evidence' in bare).toBe(false);
    expect('owner' in bare).toBe(false);
    const full = concernToRow({ id: 'cn-1', concern: 'C', evidence: 'E', impact: 'I', decisionRequired: 'D', outcome: 'O', owner: 'W' }, { tenantId: 't', userId: 'u' });
    expect(full).toMatchObject({ evidence: 'E', impact: 'I', decision_required: 'D', outcome: 'O', owner: 'W' });
  });

  it('concernFromRow reads them back, and CONCERN_COLUMN_OF maps each to its column', () => {
    const local = concernFromRow({ id: 'uuid', slug: 'cn-1', instance_id: 't', concern: 'C', evidence: 'E', decision_required: 'D', owner: 'W' });
    expect(local).toMatchObject({ evidence: 'E', decisionRequired: 'D', owner: 'W', impact: null, outcome: null });
    expect(CONCERN_COLUMN_OF.decisionRequired).toBe('decision_required');
    expect(CONCERN_COLUMN_OF.owner).toBe('owner');
  });

  it('concernChain says which of the five a row carries and which it lacks', () => {
    const ch = concernChain({ id: 'x', concern: 'C', evidence: 'E', solution: 'S' });
    expect(ch.concern.text).toBe('C');
    expect(ch.evidence.text).toBe('E');
    expect(ch.decision).toEqual({ heading: 'Solution', text: 'S' });
    expect(ch.missing).toEqual(['impact', 'outcome']);
    expect(concernChain({ id: 'y', concern: 'C', evidence: 'E', impact: 'I', decisionRequired: 'D', outcome: 'O' }).complete).toBe(true);
  });

  it('a resolved concern reaches the Governance ledger with its chain and its owner', () => {
    const out = deriveAppDecisions({ discussions: [], seeds: [], concerns: [{ id: 'cn-9', concern: 'C', status: 'done', solution: 'S', evidence: 'E', impact: 'I', outcome: 'O', owner: 'Prism', area: 'accounting' }] });
    expect(out).toHaveLength(1);
    expect(out[0].owner).toBe('Prism');
    expect(out[0].chain.complete).toBe(true);
    expect(out[0].chain.outcome.text).toBe('O');
  });
});
