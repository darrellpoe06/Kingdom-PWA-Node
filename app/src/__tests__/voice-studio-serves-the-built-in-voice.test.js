// THE STUDIO MUST SERVE THE BUILT-IN VOICE, NOT REFUSE IT.
// =============================================================================
// 2026-09-14 (DR-0394). Darrell, asked whether the built-in voice should reach
// the church's own studio by default: "Yes."
//
// The honest answer was that it never could, and the reason was not
// configuration. DR-0382 taught the CLIENT to ask — `allowBuiltIn`, a runtime
// probe that remembers the answer, and the System voice (the default nobody
// changes) routed to the studio at use-read-aloud.js:281. But NO SERVER WAS
// EVER TAUGHT TO ANSWER:
//
//   infra/voice-studio/server.py   → 400 "reference-required" with no sample
//   app/functions/api/voice-speak.js → 400 "reference-required" with no sample
//
// Both endpoints were clone-only by construction, so the probe's FIRST result
// was guaranteed 'no', that 'no' was remembered, and every lesson fell to the
// device robot permanently. The client asked a question nothing could answer.
//
// DR-0382 recorded this as unmeasurable "until a real read happens on a real
// device" and dated it. That was wrong: the repo IS the deployment, so reading
// our own server answered it in a minute. An unverified claim was carried for
// two months because nobody opened the file it was about.
//
// The behavioural half of this lives in infra/voice-studio/test_speak_contract.py
// (a fastapi stub lets the REAL handler run). There is no Python runner in this
// repo, so the JS suite shells out to it — a source scan could not tell you that
// the handler actually returns audio.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('the real /speak handler, exercised', () => {
  it('serves a built-in voice, refuses honestly without one, and leaves cloning alone', () => {
    // Fails loudly rather than skipping if python3 is absent: an unrun check
    // must never read as a passing one (DR-0076 §8).
    const out = execFileSync('python3', [join(ROOT, 'infra/voice-studio/test_speak_contract.py')], {
      encoding: 'utf8', cwd: ROOT,
    });
    expect(out).toContain('ALL BEHAVIOURAL CHECKS PASSED');
    expect(out).toContain('the built-in voice is served');
    expect(out).toContain("the probe's 'no' stays TRUE");
    expect(out).toContain('clone path untouched');
  });
});

describe('the source keeps the two properties that matter', () => {
  const server = () => readFileSync(join(ROOT, 'infra/voice-studio/server.py'), 'utf8');

  it('no longer refuses every request that arrives without a sample', () => {
    // The exact shape of the defect: an unconditional 400 as the first thing
    // that happens when `reference` is falsy.
    const src = server();
    expect(src).not.toMatch(/if not reference:\s*\n\s*return JSONResponse\(\{"error": "reference-required"\}/);
  });

  it('still refuses when the model genuinely has no speaker bank', () => {
    // The honest-failure half. If this is ever "simplified" away, the probe
    // would be told yes by a deployment that cannot deliver, which is worse
    // than the original bug.
    const src = server();
    expect(src).toMatch(/if not speakers:/);
    expect(src).toMatch(/"error": "reference-required"/);
  });
});
