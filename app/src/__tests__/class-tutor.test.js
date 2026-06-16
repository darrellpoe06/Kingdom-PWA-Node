// @vitest-environment node
//
// class-tutor — the per-week A.I. tutor must route LOCAL-FIRST (the Charter:
// sovereign Ollama on the family NAS via the same-origin /n8n path, model
// qwen2.5), never to a vendor URL from the client. These prove the route, the
// model, the per-week grounding, and the honest-offline normalization (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  TUTOR_MODEL, tutorEndpoint, tutorSystemPrompt, buildTutorPayload, normalizeTutorReply,
} from '../lib/class-tutor.js';
import { MODULES } from '../lib/church-classes.js';

describe('the tutor routes local-first (sovereign), not to a vendor', () => {
  it('uses the same-origin /n8n NAS path, not an absolute vendor/Funnel URL', () => {
    const url = tutorEndpoint();
    expect(url).toContain('/n8n/webhook/class-tutor');
    expect(url).not.toMatch(/^https?:\/\//); // same-origin relative path
    expect(url).not.toMatch(/openai|anthropic|googleapis|tail5a2f35/i);
  });
  it('asks for the local model qwen2.5', () => {
    expect(TUTOR_MODEL).toBe('qwen2.5');
    expect(buildTutorPayload(MODULES[0], []).model).toBe('qwen2.5');
  });
});

describe('the tutor is grounded in the real week', () => {
  it('the system prompt carries THIS week\'s authored content', () => {
    const sys = tutorSystemPrompt(MODULES[2]); // the Test week
    expect(sys).toContain(MODULES[2].title);
    expect(sys).toContain(MODULES[2].bigIdea);
    expect(sys.toLowerCase()).toContain('tutor');
    expect(sys.toLowerCase()).toContain('verify');
  });
  it('the payload sanitizes the running chat', () => {
    const p = buildTutorPayload(MODULES[0], [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: '' }, // dropped
      null,                          // dropped
    ]);
    expect(p.messages).toHaveLength(2);
    expect(p.week).toBe(MODULES[0].id);
  });
});

describe('honest offline (never fabricates an answer)', () => {
  it('normalizes a good reply', () => {
    expect(normalizeTutorReply({ reply: '  Hello there  ', source: 'local' }))
      .toEqual({ ok: true, reply: 'Hello there', source: 'local', error: null });
  });
  it('treats empty / failed bodies as not-ok (UI then shows the authored walkthrough)', () => {
    expect(normalizeTutorReply(null).ok).toBe(false);
    expect(normalizeTutorReply({ ok: false, error: 'down' }).ok).toBe(false);
    expect(normalizeTutorReply({ reply: '' }).ok).toBe(false);
  });
});
