// matched-services — the Layer-3 rules engine (client-side port of wf35, DR-0218
// zero-n8n). Proven-to-catch: these pin the exact scoring wf35 produced, so a
// stray edit that changes what services a family is shown FAILS the build.
import { describe, it, expect } from 'vitest';
import { matchServices, scoreService, SERVICES } from '../lib/matched-services.js';

describe('the service catalog', () => {
  it('has 5 services, each with the five BUSINESS-PROCESS-CONNECTIONS fields', () => {
    expect(SERVICES).toHaveLength(5);
    for (const s of SERVICES) {
      for (const f of ['invites', 'pipeline', 'governor', 'promise', 'timeline']) {
        expect(typeof s[f]).toBe('string');
        expect(s[f].length).toBeGreaterThan(0);
      }
    }
  });
  it('routes the waitlist sovereign-neutral, never an n8n webhook', () => {
    for (const s of SERVICES) {
      expect(s.waitlist_endpoint).toBe('/waitlist');
      expect(s.waitlist_endpoint).not.toContain('/webhook');
      expect(s.waitlist_endpoint).not.toContain('/n8n');
    }
  });
});

describe('scoreService — faithful to wf35 thresholds', () => {
  it('family-os: high alignment + steady buffer + steady income + family hint = 60+20+10+5+10 capped 100', () => {
    const svc = SERVICES.find((s) => s.service_id === 'family-os-public-beta');
    const { score, reasons } = scoreService(svc, { alignment: 'high', buffer_fund_discipline: 'steady', income_stability: 'steady' }, {}, [], 'a family');
    expect(score).toBe(100); // 60+20+10+5+10 = 105 -> capped at 100
    expect(reasons).toContain('alignment is high');
  });

  it('landlord: rental-income transaction adds 40 to the 20 baseline', () => {
    const svc = SERVICES.find((s) => s.service_id === 'landlord-module');
    const { score } = scoreService(svc, {}, {}, [{ description: 'RENT from tenant Unit 4' }], '');
    expect(score).toBe(60); // 20 + 40
  });

  it('church: tithe rate >5% (+20) and a church transaction (+25) over the 25 baseline', () => {
    const svc = SERVICES.find((s) => s.service_id === 'church-financial-discipleship');
    const { score, reasons } = scoreService(svc, {}, { tithe_rate_pct: 10 }, [{ description: 'Ministry offering' }], '');
    expect(score).toBe(70); // 25 + 20 + 25
    expect(reasons.some((r) => /tithe/.test(r))).toBe(true);
  });

  it('solo-practice with no signals stays at its low 20 baseline', () => {
    const svc = SERVICES.find((s) => s.service_id === 'solo-practice-module');
    expect(scoreService(svc, {}, {}, [{ description: 'Grocery store' }], '').score).toBe(20);
  });
});

describe('matchServices — ranking + the >=50 match cut', () => {
  it('ranks descending, returns <=3 matches (>=50) and the rest as non_matches', () => {
    const out = matchServices({
      profile: { alignment: 'high', buffer_fund_discipline: 'steady', income_stability: 'steady' },
      transactions: [{ description: 'RENT from tenant' }, { description: 'Ministry tithe' }],
      stats: { tithe_rate_pct: 8, income_total: 9000 },
      personaHint: 'family landlord',
    });
    expect(out.ok).toBe(true);
    expect(out.matches.length).toBeLessThanOrEqual(3);
    // sorted descending by fit_score
    const scores = out.matches.map((m) => m.fit_score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    // every match is >=50; every non_match is <50
    expect(out.matches.every((m) => m.fit_score >= 50)).toBe(true);
    expect(out.non_matches.every((m) => m.fit_score < 50)).toBe(true);
    // family-os leads on this strong-family profile
    expect(out.matches[0].service_id).toBe('family-os-public-beta');
  });

  it('an empty profile still returns a well-formed result (never throws)', () => {
    const out = matchServices({});
    expect(out.ok).toBe(true);
    expect(Array.isArray(out.matches)).toBe(true);
    expect(out.matches.length + out.non_matches.length).toBe(5);
  });
});
