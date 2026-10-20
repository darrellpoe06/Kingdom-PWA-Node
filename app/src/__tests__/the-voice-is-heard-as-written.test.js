// @vitest-environment node
// =============================================================================
// THE VOICE IS LISTENED TO, NOT ONLY INSPECTED (DR-1115)
// =============================================================================
// Darrell 2026-10-20, a Living Lessons week on the phone: "Our app is still
// mumbling in sections of the tts.... fix it so it can be fully functional
// without defective speaking parts of the lessons". DR-0653, DR-0794 and
// DR-0851 each changed what the Piper voice is handed, and each was proven on
// the TEXT. Nothing ever listened. voice-clarity-witness.yml does: real pieces
// through /voice-lite, transcribed back on a runner, scored as word error.
//
// This test keeps that instrument honest:
//   * the corpus it listens to IS the reader's own cut and spoken form, from
//     the live catalog, regenerated here and compared (a fixture that drifts
//     from the pipeline measures nothing);
//   * the piece that was lit in his screenshot is in it;
//   * the scorer's offline checks pass (python, stdlib only);
//   * the workflow is read-only, dispatch-only, braked, and runs the script
//     on that fixture.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildCorpus, SCREENSHOT_TEXT, PHOTOGRAPHED, FIXTURE } from '../../../scripts/voice-clarity-corpus.mjs';
import { chunkForClips } from '../lib/clip-queue.js';
import { toSpokenForm } from '../lib/speech-text.js';
import { forSynthesis } from '../lib/synthesis-text.js';

const ROOT = join(process.cwd(), '..');
const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const WF = readFileSync(join(ROOT, '.github', 'workflows', 'voice-clarity-witness.yml'), 'utf8');

describe('the corpus the witness listens to is the reader’s own cut, pinned', () => {
  it('regenerates byte-for-byte from the live catalog', () => {
    expect(fixture).toEqual(buildCorpus());
  });
  it('every piece is handed to the voice exactly as the reader hands it', () => {
    for (const p of fixture.pieces) expect(p.spoken, p.id).toBe(forSynthesis(toSpokenForm(p.written)));
  });
  it('carries the lit piece from his 2026-10-20 screenshot and the three photographed on 2026-10-09, as the reader cuts them', () => {
    const lit = chunkForClips(SCREENSHOT_TEXT)[0].text;
    expect(lit).toMatch(/^" \(Leviticus 19:34\) This week teaches what an education IS/);
    expect(fixture.pieces.find((p) => p.written === lit)).toBeTruthy();
    for (const t of PHOTOGRAPHED) expect(fixture.pieces.find((p) => p.written === t), t.slice(0, 40)).toBeTruthy();
  });
  it('has every group, with the longest sentences the catalog still hands the voice', () => {
    const groups = new Set(fixture.pieces.map((p) => p.group));
    expect([...groups].sort()).toEqual(['citation-led', 'longest', 'ordinary', 'photographed', 'screenshot']);
    const longest = fixture.pieces.filter((p) => p.group === 'longest');
    expect(longest.length).toBe(20);
    expect(Math.min(...longest.map((p) => p.longestSentenceWords))).toBeGreaterThan(18);
    const ordinary = fixture.pieces.filter((p) => p.group === 'ordinary');
    expect(ordinary.length).toBe(16);
    expect(Math.max(...ordinary.map((p) => p.longestSentenceWords))).toBeLessThanOrEqual(12);
    expect(new Set(fixture.pieces.map((p) => p.written)).size).toBe(fixture.pieces.length);
  });
});

describe('the scorer', () => {
  it('passes its own offline checks (word error rate, numbers as words, the summary)', () => {
    const r = spawnSync('python3', [join(ROOT, 'scripts', 'voice-clarity-witness.py'), '--selftest'], { encoding: 'utf8' });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/13 of 13 checks passed/);
  });
});

describe('the workflow', () => {
  it('is dispatch-only, read-only and braked', () => {
    expect(WF).toMatch(/^on:\n  workflow_dispatch:/m);
    expect(WF).not.toMatch(/^\s+schedule:/m);
    expect(WF).toMatch(/permissions:\n  contents: read/);
    expect(WF).toMatch(/concurrency:\n  group: voice-clarity-witness\n  cancel-in-progress: false/);
    expect(WF).toMatch(/timeout-minutes: 35/);
  });
  it('speaks the pinned corpus through the app’s own route and scores it with the script', () => {
    expect(WF).toContain('--corpus infra/nas-voice-lite/fixtures/clarity-corpus.json');
    expect(WF).toContain('scripts/voice-clarity-witness.py --selftest');
    expect(WF).toContain('https://poetech.us/voice-lite/health');
    expect(WF).toContain('::add-mask::$TOK');
    expect(WF).toContain('name: voice-clarity');
  });
});
