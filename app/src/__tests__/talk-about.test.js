// Tests for lib/talk-about.js — the "TALK ABOUT THIS" voice EXPLAIN engine.
// Proves: deterministic Ari narration is grounded + honest, the sovereign/local
// routing holds, and a fabricated number can NEVER reach the speaker (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  TALK_MODEL, talkAboutEndpoint, narrateDigest, numbersIn, allowedNumbers,
  verifyNarrationGrounded, talkAboutSystemPrompt, buildTalkPayload,
  normalizeTalkReply, talkAboutSurface,
} from '../lib/talk-about.js';
import { ARI_PERSONA } from '../lib/ari.js';

const dashboardDigest = {
  title: 'Forecast',
  kind: 'dashboard',
  lead: 'Where the money is headed — projections, not promises.',
  facts: [
    { label: 'Cash today', value: '$12,400' },
    { label: 'Net / month', value: '+$1,850' },
    { label: 'Runway', value: '14 mo' },
  ],
  items: [{ label: 'LED wall purchase', note: 'in 3 months' }],
};

describe('numbersIn / allowedNumbers (grounding primitives)', () => {
  it('normalizes currency, commas, percents, trailing zeros', () => {
    expect(numbersIn('$12,400 and 22% and 14 mo')).toEqual(['12400', '22', '14']);
    expect(numbersIn('12,400.00')).toEqual(['12400']);
    expect(numbersIn('no numbers here')).toEqual([]);
  });

  it('collects every number the digest legitimately contains', () => {
    const allowed = allowedNumbers(dashboardDigest);
    expect(allowed.has('12400')).toBe(true);
    expect(allowed.has('1850')).toBe(true);
    expect(allowed.has('14')).toBe(true);
    expect(allowed.has('3')).toBe(true); // from the item note
  });
});

describe('narrateDigest — deterministic, grounded, honest', () => {
  it('speaks the real on-screen numbers and only those', () => {
    const text = narrateDigest(dashboardDigest);
    expect(text).toMatch(/Ari here/);
    expect(text).toContain('Cash today is $12,400');
    expect(text).toContain('Net / month is +$1,850');
    expect(text).toContain('Runway is 14 mo');
    expect(text).toContain('LED wall purchase');
    // The cornerstone guarantee: the authored narration is always grounded.
    expect(verifyNarrationGrounded(text, dashboardDigest).ok).toBe(true);
  });

  it('is honest when the surface is empty (no invented data)', () => {
    const text = narrateDigest({ title: 'Inventory', kind: 'dashboard', facts: [], items: [], empty: true });
    expect(text).toMatch(/nothing to show here yet/i);
    expect(numbersIn(text)).toEqual([]);
  });

  it('explains what a surface IS for a help-kind digest', () => {
    const text = narrateDigest({
      title: 'Forecast', kind: 'help', lead: 'Where the money is headed.',
      help: { what: 'It projects your cash flow forward.', why: 'So the future is clear.', how: ['Pick a horizon', 'Read the outlook'] },
    });
    expect(text).toContain('It projects your cash flow forward.');
    expect(text).toContain('So the future is clear.');
    expect(text).toMatch(/How you use it/);
    expect(text).toMatch(/I can be wrong/);
  });

  it('renders deltas and status as spoken phrases', () => {
    const text = narrateDigest({
      title: 'Harvest', kind: 'dashboard',
      facts: [{ label: 'Coverage', value: '22%', delta: '+4%', status: 'below target' }],
    });
    expect(text).toContain('Coverage is 22%, up 4%, below target.');
  });
});

describe('verifyNarrationGrounded — anti-fabrication guard', () => {
  it('passes grounded text and flags stray numbers', () => {
    expect(verifyNarrationGrounded('Cash today is $12,400.', dashboardDigest).ok).toBe(true);
    const bad = verifyNarrationGrounded('Cash today is $12,400, up 99% from last week.', dashboardDigest);
    expect(bad.ok).toBe(false);
    expect(bad.stray).toContain('99');
  });
});

describe('sovereign/local routing + prompt construction', () => {
  it('asks for the local model and the relative sovereign /llm/chat endpoint', () => {
    expect(TALK_MODEL).toBe('qwen2.5');
    const ep = talkAboutEndpoint();
    expect(ep).toContain('/llm/chat');
    expect(ep).not.toMatch(/https?:\/\//); // never an absolute Funnel/vendor URL
    expect(ep).not.toMatch(/n8n|webhook|tail5a2f35/i);
  });

  it('builds an Ari-persona prompt that forbids fabrication and lists the facts', () => {
    const sys = talkAboutSystemPrompt(dashboardDigest);
    expect(sys.startsWith(ARI_PERSONA)).toBe(true);
    expect(sys).toMatch(/use ONLY the facts/i);
    expect(sys).toContain('Cash today: $12,400');
    const payload = buildTalkPayload(dashboardDigest);
    expect(payload.model).toBe('qwen2.5');
    // The facts ride the system prompt; the generic messages array carries the ask.
    expect(payload.messages[0].content).toMatch(/Forecast/);
  });
});

describe('normalizeTalkReply', () => {
  it('extracts text from common shapes; rejects empty/failed', () => {
    expect(normalizeTalkReply({ text: '  hi  ' })).toEqual({ ok: true, text: 'hi', source: 'local', error: null });
    expect(normalizeTalkReply({ reply: 'yo', source: 'vendor' }).source).toBe('vendor');
    expect(normalizeTalkReply({ ok: false }).ok).toBe(false);
    expect(normalizeTalkReply(null).ok).toBe(false);
    expect(normalizeTalkReply({ text: '' }).ok).toBe(false);
  });
});

describe('talkAboutSurface — live-first, honest-offline, never fabricates', () => {
  it('uses a grounded live reply when the NAS is reachable', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({ text: 'Your Forecast looks steady — cash today is $12,400 and you are netting +$1,850 a month.', source: 'local' }),
    });
    const res = await talkAboutSurface(dashboardDigest, { fetchImpl });
    expect(res.source).toBe('live');
    expect(res.text).toContain('$12,400');
  });

  it('REJECTS a live reply that invents a number and falls back to authored', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({ text: 'Cash today is $12,400, a 73% jump from last quarter.', source: 'local' }),
    });
    const res = await talkAboutSurface(dashboardDigest, { fetchImpl });
    expect(res.source).toBe('authored');
    expect(res.error).toBe('ungrounded');
    expect(res.rejected).toMatch(/73%/);
    expect(verifyNarrationGrounded(res.text, dashboardDigest).ok).toBe(true);
  });

  it('falls back to authored on network error (honest offline)', async () => {
    const fetchImpl = async () => { throw new Error('unreachable'); };
    const res = await talkAboutSurface(dashboardDigest, { fetchImpl });
    expect(res.source).toBe('authored');
    expect(res.error).toBe('unreachable');
    expect(res.text).toContain('Cash today is $12,400');
  });

  it('falls back to authored on a non-2xx response', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
    const res = await talkAboutSurface(dashboardDigest, { fetchImpl });
    expect(res.source).toBe('authored');
    expect(res.error).toBe('http_503');
  });
});
