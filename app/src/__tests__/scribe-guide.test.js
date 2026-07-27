// scribe-guide.test.js — proven-to-catch coverage for the step-manifest guide
// generator (DR-0236). Fires: step-less recordings, invalid manifests, wrong
// narration attribution; proves the sound path emits a real guide.
import { describe, it, expect } from 'vitest';
import { buildConsent, buildManifest } from '../lib/workflow-scribe.js';
import { buildGuide, narrationForStep } from '../lib/scribe-guide.js';

const manifest = (steps) => buildManifest({
  sessionId: 'guide-1', kind: 'workflow', mime: 'video/webm',
  startedAtIso: '2026-07-27T18:00:00.000Z', seconds: 120, chunkCount: 2,
  steps, consent: buildConsent([{ name: 'Darrell', consented: true }]),
});

const STEPS = [
  { index: 1, label: 'Open Admin', atSeconds: 5 },
  { index: 2, label: 'Choose Actions', atSeconds: 40 },
  { index: 3, label: 'Run the review', atSeconds: 90 },
];

describe('narrationForStep — narration lands on the step it was spoken in', () => {
  const segments = [
    { start: 6, end: 10, text: 'First we open the admin console.' },
    { start: 42, end: 50, text: 'Now pick the action you need.' },
    { start: 95, end: 99, text: 'And run it.' },
  ];
  it('attributes each segment to the step whose window it starts in', () => {
    expect(narrationForStep(STEPS, segments, 1)).toBe('First we open the admin console.');
    expect(narrationForStep(STEPS, segments, 2)).toBe('Now pick the action you need.');
    expect(narrationForStep(STEPS, segments, 3)).toBe('And run it.');
  });
  it('CATCHES cross-window bleed (a segment never lands on two steps)', () => {
    const all = [1, 2, 3].map((i) => narrationForStep(STEPS, segments, i)).join('|');
    expect(all.match(/admin console/g)).toHaveLength(1);
  });
  it('an unknown step index yields empty, never a crash', () => {
    expect(narrationForStep(STEPS, segments, 9)).toBe('');
  });
});

describe('buildGuide', () => {
  it('a sound manifest with steps produces the guide', () => {
    const out = buildGuide(manifest(STEPS), { title: 'How to run the review' });
    expect(out.ok).toBe(true);
    expect(out.markdown).toContain('# How to run the review');
    expect(out.markdown).toContain('## Step 1: Open Admin');
    expect(out.markdown).toContain('## Step 3: Run the review');
    expect(out.markdown).toContain('*At 0:05 in the recording.*');
  });
  it('CATCHES a step-less recording (no painted guides)', () => {
    const out = buildGuide(manifest([]));
    expect(out.ok).toBe(false);
    expect(out.problems).toContain('no-steps');
    expect(out.markdown).toBe('');
  });
  it('CATCHES an invalid manifest (consent-less capture never becomes a guide)', () => {
    const bad = { ...manifest(STEPS), consent: buildConsent([]) };
    const out = buildGuide(bad);
    expect(out.ok).toBe(false);
    expect(out.problems).toContain('consent-missing');
  });
  it('folds transcript narration under the right step', () => {
    const out = buildGuide(manifest(STEPS), {
      segments: [{ start: 41, end: 44, text: 'Pick carefully here.' }],
    });
    const stepTwo = out.markdown.split('## Step 2')[1].split('## Step 3')[0];
    expect(stepTwo).toContain('Pick carefully here.');
  });
});
