// @vitest-environment node
// THE LIKENESS STUDIO FAILS HONESTLY AND LABELS EVERY CLIP (DR-0430).
// The behavioural half lives in infra/avatar-studio/test_render_contract.py
// (a fastapi stub lets the REAL handler run); the JS suite shells out to it,
// as it does for the voice studio — a source scan cannot tell you a handler
// refuses a fake clip.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('the real /render handler, exercised', () => {
  it('refuses without a model, without a person, over budget, while busy — and labels a real render', () => {
    const out = execFileSync('python3', [join(ROOT, 'infra/avatar-studio/test_render_contract.py')], { encoding: 'utf8', cwd: ROOT });
    expect(out).toContain('ALL BEHAVIOURAL CHECKS PASSED');
    expect(out).toContain('never a fake clip');
    expect(out).toContain('an anonymous likeness is never rendered');
    expect(out).toContain('every clip is labelled AI-generated');
    expect(out).toContain('429 busy');
  });
});

describe('the deploy carries the studio beside the voice studio', () => {
  it('church-gpu-node compose declares avatar-studio on :8772 with a pinned image name and the model mounts', () => {
    const compose = readFileSync(join(ROOT, 'infra/church-gpu-node/docker-compose.yml'), 'utf8');
    expect(compose).toMatch(/avatar-studio:\n\s+build:\n\s+context: \.\.\/avatar-studio/);
    expect(compose).toContain('"8772:8772"');
    expect(compose).toContain('WAV2LIP_DIR=');
    expect(compose).toContain('X-AI-Generated');
  });
});
