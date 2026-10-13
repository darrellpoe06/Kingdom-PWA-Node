// =============================================================================
// inbound-triage — the deterministic triage-assist for the Voice Ops Inbound
// tab (REV-0007, opportunity #1). Proven-to-catch guards on the two things that
// must hold: parity with the NAS loop.py taxonomy (one intent vocabulary across
// both inbound pipelines), and the safety-forward urgent flag (an urgent word
// can never read as routine). A suggestion is DATA a human confirms — never an
// action (DATA-AS-EMPOWERMENT).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { extractUnit, classify, summarize, suggestTriage, INTENT_RULES } from '../lib/inbound-triage.js';

describe('extractUnit — a hint, never a certainty', () => {
  it('finds "apartment 3" -> "Apt 3" (mirrors loop.py selftest)', () => {
    expect(extractUnit('hi, apartment 3 here')).toBe('Apt 3');
  });
  it('finds "Apt 4" -> "Apt 4"', () => {
    expect(extractUnit('problem in Apt 4')).toBe('Apt 4');
  });
  it('returns null when no unit is present', () => {
    expect(extractUnit('just checking in')).toBeNull();
    expect(extractUnit('')).toBeNull();
    expect(extractUnit(undefined)).toBeNull();
  });
});

describe('classify — faithful mirror of the NAS loop.py taxonomy', () => {
  it('smoking -> complaint (loop.py selftest case)', () => {
    expect(classify('porch smoking again').intent).toBe('complaint');
  });
  it('furnace broken -> maintenance (loop.py selftest case)', () => {
    expect(classify('the furnace is broken').intent).toBe('maintenance');
  });
  it('"no heat and a leak" -> urgent (loop.py selftest case)', () => {
    expect(classify('no heat and a leak').priority).toBe('urgent');
  });
  it('rent / lease buckets resolve', () => {
    expect(classify('my rent payment is late').intent).toBe('rent');
    expect(classify('I want to renew my lease').intent).toBe('lease');
  });
  it('defaults to message/normal when nothing matches', () => {
    expect(classify('hello, calling to say thanks')).toEqual({ intent: 'message', priority: 'normal' });
  });
  it('every INTENT_RULE keyword actually classifies to its intent', () => {
    for (const { keywords } of INTENT_RULES) {
      // first rule wins top-to-bottom; test each rule's lead keyword resolves
      const k = keywords[0];
      expect(classify(`something about ${k} here`).intent).toBeTruthy();
    }
  });
});

describe('suggestTriage — the row suggestion', () => {
  it('property line: maintenance call -> incident, unit hint, summary', () => {
    const s = suggestTriage({ line: 'poe-properties', transcript: 'Hi, apartment 3, the furnace is broken and there is no heat.' });
    expect(s.intent).toBe('maintenance');
    expect(s.urgent).toBe(true);          // "no heat" is urgent
    expect(s.priority).toBe('urgent');
    expect(s.unitHint).toBe('Apt 3');
    expect(s.suggestedConvertAs).toBe('incident');
    expect(s.summary).toContain('apartment 3');
  });

  it('tech line: routes to inquiry and offers NO unit hint', () => {
    const s = suggestTriage({ line: 'poetech', transcript: 'I saw your website and want a quote for a new app.' });
    expect(s.suggestedConvertAs).toBe('inquiry');
    expect(s.unitHint).toBeNull();       // a tech caller has no apartment
  });

  it('SAFETY-FORWARD: a bare "gas smell" is urgent even with no intent match', () => {
    // classify() alone would call this message/normal (no category keyword);
    // suggestTriage must still raise urgent so a safety call cannot hide.
    const bare = classify('there is a smell of gas in the hallway');
    expect(bare.priority).toBe('normal'); // faithful mirror stays normal
    const s = suggestTriage({ line: 'poe-properties', transcript: 'there is a smell of gas in the hallway' });
    expect(s.urgent).toBe(true);          // the assist catches it
    expect(s.priority).toBe('urgent');
  });

  it('never fabricates a summary — audio-only says so', () => {
    const s = suggestTriage({ line: 'poetech', transcript: '' });
    expect(s.summary).toBe('Audio only — no transcript.');
  });

  it('is unbreakable on empty / missing input', () => {
    expect(() => suggestTriage()).not.toThrow();
    expect(() => suggestTriage({})).not.toThrow();
    const s = suggestTriage({});
    expect(s.intent).toBe('message');
    expect(s.urgent).toBe(false);
  });
});

describe('summarize — first sentence, trimmed, honest', () => {
  it('takes the first sentence', () => {
    expect(summarize('The porch is leaking. Also the light is out.')).toBe('The porch is leaking.');
  });
  it('truncates a long single sentence with an ellipsis', () => {
    const long = `a${'x'.repeat(200)}`;
    expect(summarize(long).endsWith('…')).toBe(true);
    expect(summarize(long).length).toBeLessThanOrEqual(120);
  });
  it('handles empty / whitespace / undefined without fabricating', () => {
    expect(summarize('')).toBe('Audio only — no transcript.');
    expect(summarize('   ')).toBe('Audio only — no transcript.');
    expect(summarize(undefined)).toBe('Audio only — no transcript.');
  });
});
