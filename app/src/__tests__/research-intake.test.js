// @vitest-environment node
//
// research-intake — the sourcing bench, the intake, and the Research Day
// (DR-0143). Pins: no instrument on the bench without a named constraint (a
// limitless entry is a painted claim, DR-0076); the consumer-tier instruments
// carry the no-API truth; premise-verify precedes ship in the intake; every
// non-adopted finding carries a re-review date (DR-0075); and the cadence is
// MEASURED — no record on file reads overdue, never fresh.
import { describe, it, expect } from 'vitest';
import {
  RESEARCH_DAY, SOURCING_BENCH, INTAKE_STEPS, RESEARCH_FINDINGS,
  FINDING_VERDICTS, VERDICT_MEANING, researchPasses, researchCadence,
} from '../lib/research-intake.js';

const DAY = 86400000;
const ms = (iso) => Date.parse(`${iso}T00:00:00Z`);

describe('SOURCING_BENCH', () => {
  it('every instrument names skills, a real constraint, and how its output enters', () => {
    expect(SOURCING_BENCH.length).toBeGreaterThanOrEqual(5);
    for (const b of SOURCING_BENCH) {
      expect(b.key).toBeTruthy();
      expect(b.skills.length).toBeGreaterThan(20);
      expect(b.constraint.length).toBeGreaterThan(20);
      expect(b.entry.length).toBeGreaterThan(10);
    }
  });
  it('the consumer-tier instruments carry the no-API constraint honestly', () => {
    for (const key of ['gemini', 'chatgpt']) {
      const b = SOURCING_BENCH.find((x) => x.key === key);
      expect(b, `${key} on the bench`).toBeTruthy();
      expect(b.constraint).toMatch(/no API/i);
      expect(b.entry).toMatch(/hand-carried/i);
    }
  });
  it('the whole team is on the bench — the principal and the NAS, not only the agent (DR-0108)', () => {
    const keys = SOURCING_BENCH.map((b) => b.key);
    expect(keys).toContain('principal');
    expect(keys).toContain('nas');
    expect(keys).toContain('claude-code');
  });
});

describe('INTAKE_STEPS', () => {
  it('premise-verify comes before anything ships (the 2026-07-10 catch, structural)', () => {
    const order = INTAKE_STEPS.map((s) => s.key);
    expect(order.indexOf('premise-verify')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('premise-verify')).toBeLessThan(order.indexOf('one-source'));
    expect(order.indexOf('tier')).toBeLessThan(order.indexOf('verdict'));
  });
  it('the house is checked before the market, and adoption demands evidence (Darrell 2026-07-10)', () => {
    const order = INTAKE_STEPS.map((s) => s.key);
    expect(order.indexOf('house-first')).toBeGreaterThan(order.indexOf('premise-verify'));
    expect(order.indexOf('house-first')).toBeLessThan(order.indexOf('verdict'));
    const verdict = INTAKE_STEPS.find((s) => s.key === 'verdict');
    expect(verdict.step).toMatch(/evidence/i);
    expect(verdict.step).toMatch(/agreement without testing/i);
  });
  it('every step carries its governing ref (no unattributed process)', () => {
    for (const s of INTAKE_STEPS) expect(s.ref).toMatch(/^DR-\d{4}$/);
  });
});

describe('RESEARCH_FINDINGS', () => {
  it('every finding carries a verdict from the enum, a why, and a constraint', () => {
    expect(RESEARCH_FINDINGS.length).toBeGreaterThanOrEqual(8);
    for (const f of RESEARCH_FINDINGS) {
      expect(FINDING_VERDICTS).toContain(f.verdict);
      expect(f.why.length).toBeGreaterThan(30);
      expect(f.constraint.length).toBeGreaterThan(20);
    }
  });
  it('every non-adopted finding carries a re-review date — no silent parking (DR-0075)', () => {
    for (const f of RESEARCH_FINDINGS) {
      if (f.verdict !== 'adopted') {
        expect(f.reReview, `${f.key} needs a re-review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
  it('a declined finding still states its why and its revisit path', () => {
    const declined = RESEARCH_FINDINGS.filter((f) => f.verdict === 'declined');
    for (const f of declined) expect(f.reReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('every verdict carries its evidence-rule meaning, and adoption means proven in use', () => {
    for (const v of FINDING_VERDICTS) expect(VERDICT_MEANING[v]).toBeTruthy();
    expect(VERDICT_MEANING.adopted).toMatch(/proven in real use/i);
    expect(VERDICT_MEANING.staged).toMatch(/measured result/i);
  });
  it('recorded house experience is senior — nothing recommends n8n back onto the critical path (DR-0132; Darrell 2026-07-10)', () => {
    for (const f of RESEARCH_FINDINGS) {
      if (/n8n/i.test(`${f.name} ${f.why}`) && f.verdict !== 'declined') {
        // A finding may MENTION n8n only to point at the DR-0132 path instead.
        expect(f.why).toMatch(/DR-0132/);
        expect(f.why).toMatch(/not n8n/i);
      }
    }
    const n8n = RESEARCH_FINDINGS.find((f) => f.key === 'nas-agent-node');
    expect(n8n.verdict).toBe('declined');
    expect(n8n.constraint).toMatch(/governance/i);
    const houseFirst = INTAKE_STEPS.find((s) => s.key === 'house-first');
    expect(houseFirst.step).toMatch(/RECORDED EXPERIENCE IS SENIOR/);
    expect(houseFirst.ref).toBe('DR-0132');
  });
});

describe('researchPasses', () => {
  const REG = {
    ok: true,
    items: [
      { id: 'REV-0033', date: '2026-07-10', surface: 'Research Day — sourcing bench + intake', type: 'orchestration' },
      { id: 'REV-0031', date: '2026-07-10', surface: 'Comprehensive UI/UX review', type: 'ui-ux' },
      { id: 'REV-0040', date: '2026-07-17', surface: 'research day pass #2', type: 'orchestration' },
      { id: 'REV-0002', date: '', surface: 'Research Day but undated', type: 'orchestration' },
    ],
  };
  it('keeps only marker-carrying, dated records, newest first', () => {
    const passes = researchPasses(REG);
    expect(passes.map((p) => p.id)).toEqual(['REV-0040', 'REV-0033']);
  });
  it('degrades honestly on a missing registry', () => {
    expect(researchPasses(null)).toEqual([]);
    expect(researchPasses({ ok: false })).toEqual([]);
  });
});

describe('researchCadence', () => {
  const reg = (date) => ({ ok: true, items: [{ id: 'REV-0033', date, surface: 'Research Day pass', type: 'orchestration' }] });

  it('no record on file reads OVERDUE — unknown freshness never reads fresh (DR-0076)', () => {
    const c = researchCadence({ ok: true, items: [] }, ms('2026-07-10'));
    expect(c).toMatchObject({ hasRecord: false, lastPass: null, overdue: true, passCount: 0 });
  });
  it('a fresh pass reads current with the next due date derived', () => {
    const c = researchCadence(reg('2026-07-10'), ms('2026-07-13'));
    expect(c).toMatchObject({ hasRecord: true, daysSince: 3, overdue: false, nextDue: '2026-07-17' });
    expect(c.lastPass.date).toBe('2026-07-10');
  });
  it('past the interval reads overdue', () => {
    const c = researchCadence(reg('2026-07-10'), ms('2026-07-10') + 8 * DAY);
    expect(c.overdue).toBe(true);
    expect(c.daysSince).toBe(8);
  });
  it('exactly at the due date is not yet overdue; a day past is', () => {
    expect(researchCadence(reg('2026-07-10'), ms('2026-07-17')).overdue).toBe(false);
    expect(researchCadence(reg('2026-07-10'), ms('2026-07-18')).overdue).toBe(true);
  });
  it('the cadence contract is weekly', () => {
    expect(RESEARCH_DAY.intervalDays).toBe(7);
    expect(RESEARCH_DAY.marker).toBe('Research Day');
  });
});
