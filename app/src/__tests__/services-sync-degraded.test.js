// =============================================================================
// services-sync — a rider that cannot work today does not red the fleet
// =============================================================================
// Measured 2026-09-22 16:15Z → 2026-09-23 00:31Z on the NAS's own event log:
// every services-sync cycle ended `loop_run_fail`, and from 23:31 the ONLY
// failing service was choir-dates — `RuntimeError("yt-dlp not available")`
// at choir_dates_sync.py:134 — a YouTube read no installer can fix. Meanwhile
// the photo server, the tax archive, the sovereign stack and the new voice
// forwarder were all fine, and the loop that carries them read red all night.
// A fleet witness that is always red is no witness (DR-0076: a check must
// mean something). Exit 3 now means DEGRADED: named on the summary line the
// event log keeps, the fleet stays green, the rider's own witness
// (harvest-health) owns the incident.
//
// This is BEHAVIOURAL: the runner's embedded python is executed against a
// temp manifest with fake installers, not scanned as text.
import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repo = (rel) => fileURLToPath(new URL('../../../' + rel, import.meta.url));
const RUNNER = readFileSync(repo('infra/nas-loops/loops/services-sync.sh'), 'utf8');
const RIDER = readFileSync(repo('infra/church-media-golive/choir_dates_sync.py'), 'utf8');

// The runner's python body, extracted the way sh feeds it (quoted heredoc).
const PY = RUNNER.slice(RUNNER.indexOf("<<'EOF'") + 7, RUNNER.lastIndexOf('\nEOF'));

function runWith(services) {
  const root = mkdtempSync(join(tmpdir(), 'svc-sync-'));
  mkdirSync(join(root, 'inst'));
  const manifest = { services: services.map((s, i) => {
    const file = join('inst', `${s.name}.sh`);
    writeFileSync(join(root, file), `#!/bin/sh\necho "${s.name}: ${s.say}"\nexit ${s.exit}\n`);
    chmodSync(join(root, file), 0o755);
    return { name: s.name, install: file, enabled: true };
  }) };
  writeFileSync(join(root, 'services.json'), JSON.stringify(manifest));
  writeFileSync(join(root, 'runner.py'), PY);
  const r = spawnSync('python3', [join(root, 'runner.py'), join(root, 'services.json'), root], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

describe('services-sync: exit 3 is DEGRADED, not failed', () => {
  it('one degraded rider among healthy services → the cycle is GREEN and the rider is NAMED', () => {
    const r = runWith([
      { name: 'photos', say: 'ok', exit: 0 },
      { name: 'choir-dates', say: 'DEGRADED — page metadata unavailable', exit: 3 },
      { name: 'voice-transport', say: 'ok', exit: 0 },
    ]);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toMatch(/services-sync: all services synced; DEGRADED: choir-dates/);
    expect(r.out).toMatch(/choir-dates DEGRADED :: /);
  });

  it('PROVEN-TO-CATCH: a real failure (exit 1) still reds the cycle, degraded or not', () => {
    const r = runWith([
      { name: 'choir-dates', say: 'DEGRADED', exit: 3 },
      { name: 'supabase', say: 'FAILED - the gateway did not answer', exit: 1 },
    ]);
    expect(r.code, r.out).toBe(1);
    expect(r.out).toMatch(/services-sync: FAILED: supabase \(exit 1/);
  });

  it('all healthy → the old summary line, unchanged', () => {
    const r = runWith([{ name: 'photos', say: 'ok', exit: 0 }]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/services-sync: all services synced\n/);
    expect(r.out).not.toMatch(/DEGRADED/);
  });
});

describe('the choir-dates rider speaks the degraded class', () => {
  it('both "cannot work today" paths return 3 — the tool absent, and a chunk that dated nothing', () => {
    expect(RIDER).toMatch(/except RuntimeError as e:[\s\S]{0,400}return 3/);
    expect(RIDER).toMatch(/DEGRADED — dated 0 of[\s\S]{0,200}return 3/);
    // And the genuinely broken paths still return 1 (no credentials, no instance).
    expect(RIDER).toMatch(/emit\(False, 0, "no credentials"\)\s*\n\s*return 1/);
  });
});
