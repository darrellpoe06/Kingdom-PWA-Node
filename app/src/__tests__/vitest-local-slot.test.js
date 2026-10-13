// The local test-run slot keeps parallel sessions from filling one machine's
// memory (P65, DR-0697). Proven-to-catch: a slot held by a live process is
// never handed out twice, and a slot held by a dead process is reclaimed.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tryTakeSlot, alive } from '../../vitest.local-slot.js';

const freshDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'slot-test-'));

describe('local vitest slots', () => {
  it('hands out at most the configured number of slots to live runs', () => {
    const dir = freshDir();
    const me = process.pid;
    expect(tryTakeSlot(me, dir, 2)).toBeTruthy();
    expect(tryTakeSlot(me, dir, 2)).toBeTruthy();
    expect(tryTakeSlot(me, dir, 2), 'a third run must wait').toBeNull();
  });

  it('reclaims a slot whose holder is no longer alive', () => {
    const dir = freshDir();
    const dead = 2 ** 22 + 12345; // above the default pid_max: never a live process
    expect(alive(dead)).toBe(false);
    fs.writeFileSync(path.join(dir, 'slot-0'), String(dead));
    fs.writeFileSync(path.join(dir, 'slot-1'), String(process.pid));
    const got = tryTakeSlot(process.pid, dir, 2);
    expect(got).toBe(path.join(dir, 'slot-0'));
    expect(fs.readFileSync(got, 'utf8')).toBe(String(process.pid));
  });

  it('the config wires the slot in and caps local workers', () => {
    const cfg = fs.readFileSync(path.join(__dirname, '..', '..', 'vitest.config.js'), 'utf8');
    expect(cfg).toContain("globalSetup: ['./vitest.local-slot.js']");
    expect(cfg).toMatch(/maxWorkers: Number\(process\.env\.LOCAL_VITEST_WORKERS \|\| 2\)/);
  });
});
