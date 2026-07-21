// @vitest-environment node
//
// skill-analytics — Layer 2 (DR-0218 zero-n8n). Proves the DETERMINISTIC stats
// match wf34 exactly, the client routes LOCAL (sovereign /llm/chat, the 14b
// model, never a vendor), the profile JSON is extracted from a fenced/prose
// reply, and honest-offline never fabricates a profile (DR-0076).
import { describe, it, expect, afterEach } from 'vitest';
import {
  SKILL_MODEL, skillEndpoint, computeSkillStats, buildSkillAnalyticsPayload,
  skillAnalyticsSystemPrompt, parseSkillProfile, analyzeSkills,
} from '../lib/skill-analytics.js';

const TXNS = [
  { date: '2026-01-05', amount: 4200, description: 'ACME CORP PAYROLL' },
  { date: '2026-01-06', amount: -420, description: 'First Fruits tithe — Church' },
  { date: '2026-01-10', amount: -1500, description: 'Chase Card payment' },
  { date: '2026-01-12', amount: -300, description: 'Transfer to Vanguard brokerage' },
  { date: '2026-01-15', amount: -85, description: 'Grocery store' },
];

describe('computeSkillStats — faithful to wf34, deterministic', () => {
  it('computes income, tithe rhythm, debt, and savings from keywords', () => {
    const s = computeSkillStats(TXNS);
    expect(s.transaction_count).toBe(5);
    expect(s.income_total).toBe('4200.00');
    expect(s.tithe_total).toBe('420.00');
    expect(s.tithe_rate_pct).toBe('10.0');          // 420/4200
    expect(s.debt_payment_total).toBe('1500.00');
    expect(s.savings_transfer_total).toBe('300.00');
    expect(s.date_range).toBe('2026-01-05 to 2026-01-15');
  });
  it('is honest on empty input (no invented numbers)', () => {
    const s = computeSkillStats([]);
    expect(s.transaction_count).toBe(0);
    expect(s.income_total).toBe('0.00');
    expect(s.tithe_rate_pct).toBe('0.0');
    expect(s.date_range).toBe('(unknown)');
  });
});

describe('sovereign/local routing', () => {
  it('uses the relative /llm/chat path and the local 14b model, never a vendor', () => {
    const ep = skillEndpoint();
    expect(ep).toBe('/llm/chat');
    expect(ep).not.toMatch(/^https?:\/\//);
    expect(ep).not.toMatch(/openai|anthropic|googleapis|tail5a2f35|n8n|webhook/i);
    expect(SKILL_MODEL).toBe('qwen2.5:14b-instruct-q4_K_M');
    const payload = buildSkillAnalyticsPayload(TXNS);
    expect(payload.model).toBe('qwen2.5:14b-instruct-q4_K_M');
    expect(payload.messages[0].content).toContain('4200.00'); // grounded in real stats
    expect(skillAnalyticsSystemPrompt()).toMatch(/diagnostic and warm/i);
  });
});

describe('parseSkillProfile', () => {
  const good = '{"profile":{"alignment":"high"},"diagnostic_summary":"Steady.","strengths":["tithe"],"gaps_to_consider":["buffer"]}';
  it('extracts JSON from a fenced / prose-wrapped reply', () => {
    expect(parseSkillProfile('```json\n' + good + '\n```').profile.alignment).toBe('high');
    expect(parseSkillProfile('Sure!\n' + good + '\nHope that helps').diagnostic_summary).toBe('Steady.');
  });
  it('returns null on garbage (never a painted profile)', () => {
    expect(parseSkillProfile('no json here')).toBeNull();
    expect(parseSkillProfile('')).toBeNull();
    expect(parseSkillProfile(null)).toBeNull();
  });
});

describe('analyzeSkills — honest offline, stats always survive', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  it('returns a good profile + stats when the model replies well', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ ok: true, reply: '{"profile":{"alignment":"high","tithe_rhythm":"consistent"},"diagnostic_summary":"Warm.","strengths":["a"],"gaps_to_consider":["b"]}', source: 'local' }),
    });
    const res = await analyzeSkills(TXNS);
    expect(res.ok).toBe(true);
    expect(res.profile.alignment).toBe('high');
    expect(res.stats.tithe_rate_pct).toBe('10.0');
    expect(res.strengths).toEqual(['a']);
  });

  it('keeps the real STATS even when the model is unreachable (never fabricates)', async () => {
    globalThis.fetch = async () => { throw new Error('down'); };
    const res = await analyzeSkills(TXNS);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unreachable');
    expect(res.stats.income_total).toBe('4200.00'); // stats survive -> matched-services still runs
    expect(res.profile).toBeUndefined();
  });

  it('no transactions -> not-ok with honest-empty stats', async () => {
    const res = await analyzeSkills([]);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no transactions/);
  });
});
