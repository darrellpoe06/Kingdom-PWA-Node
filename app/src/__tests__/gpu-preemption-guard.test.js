// @vitest-environment node
//
// gpu-preemption-guard — PROVEN-TO-CATCH tests (DR-0076 §3)
//
// Darrell 2026-08-14: "we have cuda cpu's in our pipeline... already connected
// to the process... comprehensive process evaluation and reports"
//
// The evaluation read DR-0012 §3 and measured the tree against it:
//   infra/church-gpu-node/docker-compose.yml:66       KEEP_ALIVE=5m   (and CITED DR-0012)
//   infra/ai-orchestrator/node1/docker-compose.yml:43 KEEP_ALIVE=15m
// Both reserve `driver: nvidia` on a 12 GB 4070 shared with creative production
// and, on livestream-main-pc, with the NovaStar -> wall feed. DR-0012 §3 allows
// ~1 second, via OLLAMA_KEEP_ALIVE=0.
//
// A guard that always passes is itself a lie, so the first block below feeds it
// the exact two shapes that were live in the tree and requires it to FLAG them.
import { describe, it, expect } from 'vitest';
import {
  scanComposeForPreemption, scanGpuPreemption, listComposeFiles, EXCLUSIONS,
} from '../../../scripts/gpu-preemption-guard.mjs';

// The real shape, reduced: a GPU-reserving Ollama service.
const gpuOllama = (keepAlive) => `
services:
  ollama:
    image: ollama/ollama:latest
    environment:
      - TZ=America/Chicago${keepAlive === null ? '' : `
      - OLLAMA_KEEP_ALIVE=${keepAlive}`}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
`;

describe('proven-to-catch — it flags the two values that were actually live', () => {
  it('FLAGS 5m (church-gpu-node, the one that cited DR-0012 while breaking it)', () => {
    const r = scanComposeForPreemption(gpuOllama('5m'));
    expect(r.gpuOllama).toBe(1);
    expect(r.violations.map((v) => v.kind)).toContain('gpu-ollama-holds-vram');
    expect(r.violations[0].value).toBe('5m');
  });

  it('FLAGS 15m (node1)', () => {
    const r = scanComposeForPreemption(gpuOllama('15m'));
    expect(r.violations[0].value).toBe('15m');
  });

  it('FLAGS an absent KEEP_ALIVE — Ollama defaults to 5m, so silence is a hold', () => {
    const r = scanComposeForPreemption(gpuOllama(null));
    expect(r.violations.map((v) => v.kind)).toContain('gpu-ollama-without-keep-alive');
  });

  it('FLAGS -1, the never-unload pin that ran away on 2026-06-06', () => {
    expect(scanComposeForPreemption(gpuOllama('-1')).violations).toHaveLength(1);
  });

  it('PASSES 0, and the "0s"/"0m" spellings Ollama treats identically', () => {
    for (const v of ['0', '0s', '0m']) {
      const r = scanComposeForPreemption(gpuOllama(v));
      expect(r.violations, `KEEP_ALIVE=${v} should pass`).toEqual([]);
      expect(r.conforming).toBe(1);
    }
  });

  it('notices when a violating service CITES DR-0012 — the reads-correct trap', () => {
    const withCite = gpuOllama('5m').replace('- TZ=America/Chicago',
      '- TZ=America/Chicago\n      # DR-0012 absolute-priority preemption');
    expect(scanComposeForPreemption(withCite).violations[0].citesDr0012).toBe(true);
  });
});

describe('it must not cry wolf — a noisy gate gets disabled and protects nothing', () => {
  it('IGNORES a CPU/RAM-bound Ollama with no GPU reservation (the real NAS stack)', () => {
    const nasShape = `
services:
  ollama:
    image: ollama/ollama:latest
    environment:
      - OLLAMA_KEEP_ALIVE=15m
    deploy:
      resources:
        limits:
          memory: 24g
`;
    const r = scanComposeForPreemption(nasShape);
    expect(r.gpuOllama).toBe(0);
    expect(r.violations).toEqual([]);
  });

  it('IGNORES a GPU service that is not Ollama (whisper/voice hold no reasoner)', () => {
    const whisper = `
services:
  whisper-gpu:
    image: poetech/whisper-gpu:cuda
    environment:
      - WHISPER_DEVICE=cuda
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              capabilities: [gpu]
`;
    expect(scanComposeForPreemption(whisper).violations).toEqual([]);
  });

  it('does not count a `driver: nvidia` that appears only in a comment', () => {
    const commented = `
services:
  ollama:
    image: ollama/ollama:latest
    environment:
      - OLLAMA_KEEP_ALIVE=15m
    # deploy would add: driver: nvidia
`;
    expect(scanComposeForPreemption(commented).gpuOllama).toBe(0);
  });

  it('ignores a compose file with no Ollama at all', () => {
    expect(scanComposeForPreemption('services:\n  web:\n    image: nginx\n').violations).toEqual([]);
  });

  it('never throws on junk input', () => {
    for (const bad of [undefined, null, '', 42, {}, 'not: [valid: yaml']) {
      expect(() => scanComposeForPreemption(bad)).not.toThrow();
    }
  });

  it('separates sibling services — one bad neighbour does not condemn a good one', () => {
    const two = `
services:
  ollama:
    image: ollama/ollama:latest
    environment:
      - OLLAMA_KEEP_ALIVE=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              capabilities: [gpu]
  ollama-two:
    image: ollama/ollama:latest
    environment:
      - OLLAMA_KEEP_ALIVE=9m
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              capabilities: [gpu]
`;
    const r = scanComposeForPreemption(two);
    expect(r.gpuOllama).toBe(2);
    expect(r.conforming).toBe(1);
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].service).toBe('ollama-two');
  });
});

describe('the real tree holds the line', () => {
  it('actually scans compose files, not vacuously nothing', () => {
    expect(listComposeFiles().length).toBeGreaterThan(2);
  });

  it('EVERY GPU-reserving Ollama in the tree frees VRAM immediately', () => {
    const { violations, totals } = scanGpuPreemption();
    const msg = violations.map((v) => `${v.file}:${v.line} holds ${v.value}`).join('; ');
    // If this drops to 0 the guard has gone vacuous — the towers still exist.
    expect(totals.gpuOllama).toBeGreaterThanOrEqual(2);
    expect(violations, msg).toEqual([]);
    expect(totals.conforming).toBe(totals.gpuOllama);
  });

  it('every exclusion carries a written reason (no silent carve-outs)', () => {
    const { badExclusions } = scanGpuPreemption();
    expect(badExclusions).toEqual([]);
    for (const reason of Object.values(EXCLUSIONS)) {
      expect(typeof reason).toBe('string');
      expect(reason.trim().length).toBeGreaterThanOrEqual(10);
    }
  });
});
