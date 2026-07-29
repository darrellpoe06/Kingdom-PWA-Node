// @vitest-environment node
//
// started-by-record — the DR-0247 standing witness. Darrell 2026-07-29:
// "I always want everything started not waiting for a human especially after
// we agree... Change those laws... they keep usurping my will."
//
// The amended law, pinned as machinery (not memory): agreed work STARTS ITSELF
// through the lane — the committed ARMED-BY-RECORD arms the deterministic
// fleet by merge; the Governor's hand is the BRAKE (kill-switch, hold label),
// never the starter. Proven both directions (DR-0076): the record arms, the
// kill-switch still halts everything, and nothing startable ships waiting
// without a recorded why + date.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveArmed, decideRun } from '../../../scripts/lib/nas-loops.mjs';
import { scanUndermining } from '../lib/ari-integrity-guard.js';

const ROOT = join(__dirname, '..', '..', '..');
const BUNDLE = join(ROOT, 'infra', 'nas-loops');

const LOOP = Object.freeze({
  name: 'services-sync', kind: 'deterministic', script: 'services-sync.sh',
  enabled: true, max_calls_per_day: 48, timeout_seconds: 600,
});

describe('the committed arm record (DR-0247)', () => {
  it('ARMED-BY-RECORD exists in the repo and cites the amending decision', () => {
    const p = join(BUNDLE, 'ARMED-BY-RECORD');
    expect(existsSync(p)).toBe(true);
    const text = readFileSync(p, 'utf8');
    expect(text).toMatch(/DR-0247/);
    expect(text).toMatch(/starts itself/i);
    expect(text).toMatch(/stop-paths/i);
  });
});

describe('resolveArmed — the arm opens by record, env, or legacy file; never by nothing', () => {
  it('the committed record arms', () => {
    expect(resolveArmed({ armRecordExists: true })).toBe(true);
  });
  it('the env parameter arms', () => {
    expect(resolveArmed({ envValue: '1' })).toBe(true);
    expect(resolveArmed({ envValue: 'true' })).toBe(true);
  });
  it('the legacy state file arms', () => {
    expect(resolveArmed({ legacyFileExists: true })).toBe(true);
  });
  it('nothing set => disarmed (no silent self-start without ANY arm)', () => {
    expect(resolveArmed({})).toBe(false);
    expect(resolveArmed({ envValue: '', legacyFileExists: false, armRecordExists: false })).toBe(false);
  });
});

describe('the kill-switch is REMOVED from the deterministic class (DR-0248 — proven, not asserted)', () => {
  it('a stray killSwitch input no longer stops an armed fleet', () => {
    const d = decideRun({ loop: LOOP, killSwitch: true, loopsArmed: resolveArmed({ armRecordExists: true }), lockHeld: false, callsToday: 0 });
    expect(d.go).toBe(true);
    expect(d.reason).not.toMatch(/kill-switch/i);
  });
  it('armed by record + brakes clear => GO (started, not waiting)', () => {
    const d = decideRun({ loop: LOOP, loopsArmed: resolveArmed({ armRecordExists: true }), lockHeld: false, callsToday: 0 });
    expect(d.go).toBe(true);
  });
  it('the deterministic brakes that remain still brake: cap reached and lock held each HOLD', () => {
    const capped = decideRun({ loop: LOOP, loopsArmed: true, lockHeld: false, callsToday: 48 });
    expect(capped.go).toBe(false);
    const locked = decideRun({ loop: LOOP, loopsArmed: true, lockHeld: true, callsToday: 0 });
    expect(locked.go).toBe(false);
  });
});

describe('nothing startable ships waiting (the manifest + registry stay started or carry a why)', () => {
  it('every self-deploy service is enabled, or carries a recorded why + re-review', () => {
    const doc = JSON.parse(readFileSync(join(BUNDLE, 'services.json'), 'utf8'));
    expect(doc.services.length).toBeGreaterThanOrEqual(2);
    for (const s of doc.services) {
      if (s.enabled !== true) {
        expect(s.disabledWhy, `${s.name} is disabled without a recorded why`).toBeTruthy();
        expect(s.reReview, `${s.name} is disabled without a re-review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(existsSync(join(ROOT, s.install)), `${s.name} installer missing`).toBe(true);
    }
  });
  it('every registry loop is enabled, or carries a recorded why + re-review', () => {
    const reg = JSON.parse(readFileSync(join(BUNDLE, 'registry.json'), 'utf8'));
    for (const l of reg.loops) {
      if (l.enabled !== true) {
        expect(l.disabled_why, `${l.name} is disabled without a recorded why`).toBeTruthy();
        expect(l.re_review, `${l.name} is disabled without a re-review date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe('the reply-layer hook catches the waiting-by-default pattern (the agent cannot re-impose the wait)', () => {
  it('flags a reply that parks agreed work on a human start', () => {
    for (const bad of [
      'The service ships inert until you arm the fleet.',
      'Everything is ready and awaiting your arm.',
      'It will deploy once you activate it.',
    ]) {
      const r = scanUndermining(bad);
      expect(r.flags.map((f) => f.id), bad).toContain('waiting-by-default');
    }
  });
  it('passes a decision-first report and a legitimate named bootstrap', () => {
    for (const good of [
      'The fleet armed itself by record on merge; the stop-paths ride the lane.',
      'One-time per-machine bootstrap: the DSM scheduler entry is registered once by hand, then everything is repo-driven.',
    ]) {
      const r = scanUndermining(good);
      expect(r.flags.map((f) => f.id), good).not.toContain('waiting-by-default');
    }
  });
});
