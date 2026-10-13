// ari-adjustments — proven-to-catch tests for the AUTO-APPLY GATE. This is the
// safety-critical layer: it must NEVER let Ari auto-apply a change to money,
// people/PHI, or published/outward data, and must only auto-apply deterministic,
// reversible, evidence-backed corrections. A green test here means the gate
// actually holds the line (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  classifyFinding, partitionAdjustments, makeApplyLogEntry, adjustmentsSummary,
  touchesNeverAuto, isSafeOp,
} from '../lib/ari-adjustments.js';

const NOW = '2026-07-13T18:00:00.000Z';
const f = (over = {}) => ({ dimension: 'delivery', severity: 'warning', title: 'Board out of sync', evidence: '2 rows', action: 're-sync the board from the build record', ...over });

describe('ari-adjustments — the gate NEVER auto-applies high-stakes changes', () => {
  it('anything touching money is proposed, never auto-applied', () => {
    expect(classifyFinding(f({ dimension: 'data', title: 'Payment total mismatch', action: 'recompute the payment balance' })).mode).toBe('propose');
    expect(classifyFinding(f({ dimension: 'data', action: 'recompute tuition owed' })).mode).toBe('propose');
  });
  it('anything touching people / PHI / clients is proposed', () => {
    expect(classifyFinding(f({ dimension: 'data', action: 're-sync the client contact list' })).mode).toBe('propose');
    expect(classifyFinding(f({ title: 'Confidential record drift', action: 'refresh' })).mode).toBe('propose');
  });
  it('anything touching published / outward-facing / send is proposed', () => {
    expect(classifyFinding(f({ dimension: 'data', action: 'refresh the published site copy' })).mode).toBe('propose');
    expect(classifyFinding(f({ dimension: 'data', action: 'send the outreach email' })).mode).toBe('propose');
  });
});

describe('ari-adjustments — the gate DOES auto-apply safe, deterministic fixes', () => {
  it('a reversible recompute/re-sync in a safe dimension is auto', () => {
    expect(classifyFinding(f()).mode).toBe('auto'); // delivery + "re-sync"
    expect(classifyFinding(f({ dimension: 'data', action: 'recompute the derived on-hand from the ledger' })).mode).toBe('auto');
  });
  it('a judgment dimension (plan/reviews/backlog) always proposes, even with a safe verb', () => {
    expect(classifyFinding(f({ dimension: 'plan', action: 're-sync the timeline' })).mode).toBe('propose');
    expect(classifyFinding(f({ dimension: 'backlog', action: 'refresh' })).mode).toBe('propose');
  });
  it('the default is PROPOSE when nothing marks it provably safe', () => {
    expect(classifyFinding(f({ dimension: 'delivery', action: 'decide what to do about the drift' })).mode).toBe('propose');
    expect(classifyFinding(null).mode).toBe('propose');
  });
});

describe('ari-adjustments — partition, summary, and the audit log', () => {
  it('partitions a mixed set correctly and never loses a finding', () => {
    const findings = [
      f({ title: 'a', action: 're-sync board' }),                          // auto
      f({ title: 'b', dimension: 'data', action: 'recompute derived x' }), // auto
      f({ title: 'c', dimension: 'data', action: 'recompute the payment' }), // propose (money)
      f({ title: 'd', dimension: 'plan', action: 'refresh' }),             // propose (judgment)
    ];
    const { auto, propose } = partitionAdjustments(findings);
    expect(auto.map((x) => x.title).sort()).toEqual(['a', 'b']);
    expect(propose.map((x) => x.title).sort()).toEqual(['c', 'd']);
    expect(auto.length + propose.length).toBe(findings.length);
    expect(auto.every((x) => x.mode === 'auto' && x.reason)).toBe(true);
  });
  it('the summary headline reflects the real split', () => {
    expect(adjustmentsSummary([]).headline).toMatch(/data is sound/i);
    const s = adjustmentsSummary([f(), f({ dimension: 'data', action: 'recompute the payment' })]);
    expect(s.autoCount).toBe(1);
    expect(s.proposeCount).toBe(1);
  });
  it('every auto-apply writes a reversible, attributed audit-log entry', () => {
    const entry = makeApplyLogEntry(f(), NOW);
    expect(entry.reversible).toBe(true);
    expect(entry.by).toBe('Ari');
    expect(entry.appliedIso).toBe(NOW);
    expect(entry.evidence).toBeTruthy();
  });
});

describe('ari-adjustments — the helper predicates', () => {
  it('touchesNeverAuto catches the high-stakes vocabulary', () => {
    expect(touchesNeverAuto({ action: 'update the invoice' })).toBe(true);
    expect(touchesNeverAuto({ action: 're-sync the board' })).toBe(false);
  });
  it('isSafeOp recognizes deterministic verbs only', () => {
    expect(isSafeOp({ action: 'recompute the value' })).toBe(true);
    expect(isSafeOp({ action: 'rewrite the strategy' })).toBe(false);
  });
});
