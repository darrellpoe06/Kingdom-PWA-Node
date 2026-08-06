// =============================================================================
// Braked deterministic NAS loop runner — proven-to-catch tests (DR-0076).
// =============================================================================
// The deterministic runner keeps the routine NAS loops going headless whether or
// not Claude/Dispatch is online. Its safety is the three brakes encoded in the
// PURE core (scripts/lib/nas-loops.mjs): the call-cap budget, the single-flight
// lock, the kill-switch + LOOPS_ARMED arm flag. A gate that always passes is a lie
// (DR-0076) — so each test below pins a brake by proving it BOTH blocks when it
// should AND opens only when every condition is genuinely met. If the bounded gate
// ever loosens, one of these fails loudly.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOOP_KINDS,
  validateLoop,
  validateRegistry,
  findLoop,
  decideRun,
  reelLine,
} from '../../../scripts/lib/nas-loops.mjs';

// A valid, enabled, deterministic loop with both budget brakes set.
const goodLoop = {
  name: 'health-check',
  kind: 'deterministic',
  script: 'health-check.sh',
  enabled: true,
  max_calls_per_day: 200,
  timeout_seconds: 60,
};
// The all-brakes-clear input that should produce GO.
const armedClear = { loop: goodLoop, killSwitch: false, loopsArmed: true, lockHeld: false, callsToday: 0 };

describe('validateLoop — the budget brakes and greenlight are required', () => {
  it('accepts a well-formed loop', () => {
    expect(validateLoop(goodLoop).ok).toBe(true);
  });
  it('rejects a non-object', () => {
    expect(validateLoop(null).ok).toBe(false);
    expect(validateLoop([]).ok).toBe(false);
  });
  it('requires enabled to be an explicit boolean (no default-true)', () => {
    const r = validateLoop({ ...goodLoop, enabled: undefined });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/enabled must be an explicit boolean/);
  });
  it('treats an unset/zero call cap as a MISSING budget brake', () => {
    expect(validateLoop({ ...goodLoop, max_calls_per_day: 0 }).ok).toBe(false);
    expect(validateLoop({ ...goodLoop, max_calls_per_day: undefined }).ok).toBe(false);
  });
  it('treats an unset/zero wall-clock timeout as a MISSING budget brake', () => {
    expect(validateLoop({ ...goodLoop, timeout_seconds: 0 }).ok).toBe(false);
  });
  it('rejects an unknown kind', () => {
    expect(validateLoop({ ...goodLoop, kind: 'magic' }).ok).toBe(false);
  });
  it('rejects path traversal / absolute / backslash in the script ref', () => {
    expect(validateLoop({ ...goodLoop, script: '../escape.sh' }).ok).toBe(false);
    expect(validateLoop({ ...goodLoop, script: '/etc/passwd' }).ok).toBe(false);
    expect(validateLoop({ ...goodLoop, script: '..\\win.sh' }).ok).toBe(false);
  });
  it('rejects a non-kebab name', () => {
    expect(validateLoop({ ...goodLoop, name: 'Health Check!' }).ok).toBe(false);
  });
  it('exposes exactly the two kinds', () => {
    expect(LOOP_KINDS).toEqual(['deterministic', 'ai']);
  });
});

describe('validateRegistry — shape + duplicate names', () => {
  it('accepts a v1 registry of valid loops', () => {
    expect(validateRegistry({ v: 1, loops: [goodLoop] }).ok).toBe(true);
  });
  it('rejects wrong version', () => {
    expect(validateRegistry({ v: 2, loops: [] }).ok).toBe(false);
  });
  it('rejects a non-array loops field', () => {
    expect(validateRegistry({ v: 1, loops: {} }).ok).toBe(false);
  });
  it('catches duplicate loop names (would break per-loop lock/accounting)', () => {
    const r = validateRegistry({ v: 1, loops: [goodLoop, { ...goodLoop }] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/duplicate loop name/);
  });
  it('findLoop returns the named loop or null', () => {
    const reg = { v: 1, loops: [goodLoop] };
    expect(findLoop(reg, 'health-check')).toBe(goodLoop);
    expect(findLoop(reg, 'nope')).toBeNull();
  });
});

describe('decideRun — the three brakes, proven to BOTH block and open', () => {
  it('GO only when every brake is clear (the one true path)', () => {
    const d = decideRun(armedClear);
    expect(d.go).toBe(true);
    expect(d.reason).toMatch(/GO/);
  });

  // KILL-SWITCH REMOVED (DR-0248, Darrell 2026-07-29: "Get rid of the kill
  // switch... we have over 6000 checks... they are all switching deterministic
  // logic"). A stray killSwitch input is IGNORED — the stop-paths are the lane
  // (registry enabled:false, delete ARMED-BY-RECORD, DSM toggle).
  it('IGNORES a killSwitch input — the manual override is removed from this class (DR-0248)', () => {
    const d = decideRun({ ...armedClear, killSwitch: true });
    expect(d.go).toBe(true);
    expect(d.reason).not.toMatch(/kill-switch/i);
  });

  // ARM flag (ships absent => inert)
  it('BLOCKS when LOOPS_ARMED is absent (ships inert)', () => {
    const d = decideRun({ ...armedClear, loopsArmed: false });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/disarmed/);
  });

  // BUDGET — call cap
  it('BLOCKS when the daily call cap is reached', () => {
    const d = decideRun({ ...armedClear, callsToday: 200 });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/daily call cap reached/);
  });
  it('opens on the call BELOW the cap and blocks AT the cap (boundary is exact)', () => {
    expect(decideRun({ ...armedClear, callsToday: 199 }).go).toBe(true);
    expect(decideRun({ ...armedClear, callsToday: 200 }).go).toBe(false);
  });

  // LOCK — single-flight
  it('BLOCKS (skips) when the single-flight lock is held', () => {
    const d = decideRun({ ...armedClear, lockHeld: true });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/lock held/);
  });

  // ENABLED greenlight
  it('BLOCKS a disabled loop', () => {
    const d = decideRun({ ...armedClear, loop: { ...goodLoop, enabled: false } });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/disabled/);
  });

  // AI loops are delegated, never run by this gate
  it('REFUSES kind:ai (delegated to the cap-resume/wake gate)', () => {
    const d = decideRun({ ...armedClear, loop: { ...goodLoop, kind: 'ai' } });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/delegated to the cap-resume/);
  });

  // Invalid loop never runs
  it('REFUSES an invalid loop regardless of brakes', () => {
    const d = decideRun({ ...armedClear, loop: { ...goodLoop, max_calls_per_day: 0 } });
    expect(d.go).toBe(false);
    expect(d.reason).toMatch(/invalid loop/);
  });
});

describe('reelLine — safe one-line JSONL for the event reel', () => {
  it('produces a single parseable JSON line with the expected fields', () => {
    const line = reelLine({ ts: '2026-06-29T18:00:00Z', loop: 'health-check', event: 'loop_ok', ok: true, durationMs: 42, detail: 'n8n:200 ollama:200' });
    expect(line).not.toContain('\n');
    const o = JSON.parse(line);
    expect(o).toMatchObject({ agent: 'nas-loops', loop: 'health-check', event: 'loop_ok', ok: true, duration_ms: 42 });
  });
  it('strips newlines/tabs from detail (one object per line is the contract)', () => {
    const o = JSON.parse(reelLine({ detail: 'line1\nline2\tcol' }));
    expect(o.detail).toBe('line1 line2 col');
  });
  it('coerces a missing/garbage duration to 0 and ok to a strict boolean', () => {
    const o = JSON.parse(reelLine({ durationMs: 'x', ok: 'yes' }));
    expect(o.duration_ms).toBe(0);
    expect(o.ok).toBe(false);
  });
});

// The shipped registry must itself be valid + ship INERT (the runner is armed by
// hand, never in the repo). This guards the real artifact, not a fixture.
describe('the shipped registry.json is valid and ships inert', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  // app/src/__tests__ -> repo root is three up.
  const repoRoot = join(here, '..', '..', '..');
  const regPath = join(repoRoot, 'infra/nas-loops/registry.json');

  it('exists and validates', () => {
    expect(existsSync(regPath)).toBe(true);
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    expect(validateRegistry(reg).ok).toBe(true);
  });
  it('ships with NO LOOPS_ARMED flag (inert by default)', () => {
    expect(existsSync(join(repoRoot, 'infra/nas-loops/state/LOOPS_ARMED'))).toBe(false);
  });
  it('includes the health-check deterministic proof loop', () => {
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    const hc = findLoop(reg, 'health-check');
    expect(hc).not.toBeNull();
    expect(hc.kind).toBe('deterministic');
  });

  // Gate-the-class (DR-0239 review 2026-08-05): the transcript loader sat
  // parked on a manual app button for a month (81/858 transcribed) while the
  // deterministic fleet ran without it — the waiting-by-default miss. This pin
  // keeps the harvest's transcript source ON the armed fleet with real brakes;
  // its loop script must exist and stay bounded (trickle pace, not a burst the
  // YouTube block punishes).
  // CORRECTED 2026-08-06 by the ways review. This test originally asserted
  // `enabled: true` — but the loop has no DSM/cron entry, so enabled read GREEN
  // while nothing fired it (DR-0076 §3: a check that means nothing). The LIVE
  // path is the transcript-trickle services.json rider on the already-armed
  // services-sync clock; this entry is the documented DSM upgrade, held off by
  // record because arming it would ADD ~64 videos/day on top of the rider's ~32
  // and push the pair past the measured ~180/day IpBlocked ceiling.
  it('keeps the transcript-backfill loop braked and honest about not being clocked', () => {
    const reg = JSON.parse(readFileSync(regPath, 'utf8'));
    const tb = findLoop(reg, 'transcript-backfill');
    expect(tb).not.toBeNull();
    expect(tb.kind).toBe('deterministic');
    expect(tb.enabled).toBe(false);
    expect(tb.disabled_why).toBeTruthy();
    expect(tb.re_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tb.max_calls_per_day).toBeGreaterThan(0);
    expect(tb.max_calls_per_day).toBeLessThanOrEqual(8);
    expect(tb.timeout_seconds).toBeGreaterThan(0);
    expect(existsSync(join(repoRoot, 'infra/nas-loops/loops', tb.script))).toBe(true);
  });
});
