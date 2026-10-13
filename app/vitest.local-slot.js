/* global process, console, setTimeout */
// Local test-run slot — one machine, many sessions, one memory (P65, DR-0697).
//
// Measured 2026-09-30 on the shared 16 GB / 4-CPU container: seven vitest
// runs from parallel builder sessions held ~13 GB, each run a ~1 GB parent
// plus up to three ~0.7 GB workers, four of them orphaned workers of runs
// that had been killed. Builds were OOM-killed (137) and builders shipped
// with "CI is the proof" instead of a local run. Darrell asked for the
// memory problem to be fixed before the work began.
//
// Outside CI, a run must hold one of MAX_SLOTS slot files before its tests
// start. A slot is free when its file is missing or names a process that is
// no longer alive, so a killed run never holds a slot forever. A run that
// cannot get a slot WAITS (it is not skipped): the tests still run, one pair
// at a time, instead of all at once into the OOM killer. CI (GitHub Actions
// sets CI=true) is untouched: every shard has its own runner.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const MAX_SLOTS = Number(process.env.LOCAL_VITEST_SLOTS || 2);
export const SLOT_DIR = process.env.LOCAL_VITEST_SLOT_DIR || path.join(os.tmpdir(), 'kingdom-vitest-slots');
const WAIT_MS = 2000;
const GIVE_UP_MS = 45 * 60 * 1000;

export function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// Try once to take a free slot for `pid`. Returns the slot path or null.
export function tryTakeSlot(pid = process.pid, dir = SLOT_DIR, max = MAX_SLOTS) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < max; i += 1) {
    const file = path.join(dir, `slot-${i}`);
    try {
      fs.writeFileSync(file, String(pid), { flag: 'wx' });
      return file;
    } catch {
      let holder = NaN;
      try { holder = Number(fs.readFileSync(file, 'utf8').trim()); } catch { /* raced away */ }
      if (!alive(holder)) {
        try { fs.unlinkSync(file); } catch { /* another run cleaned it */ }
        try { fs.writeFileSync(file, String(pid), { flag: 'wx' }); return file; } catch { /* lost the race */ }
      }
    }
  }
  return null;
}

export default async function setup() {
  if (process.env.CI) return undefined;
  const started = Date.now();
  let slot = tryTakeSlot();
  let told = false;
  while (!slot) {
    if (!told) {
      console.log(`[vitest] ${MAX_SLOTS} local test runs are already using this machine's memory; waiting for a slot (${SLOT_DIR}).`);
      told = true;
    }
    if (Date.now() - started > GIVE_UP_MS) throw new Error(`[vitest] no local test slot after ${GIVE_UP_MS / 60000} min; see ${SLOT_DIR}`);
    await new Promise((r) => setTimeout(r, WAIT_MS));
    slot = tryTakeSlot();
  }
  const release = () => { try { if (fs.readFileSync(slot, 'utf8').trim() === String(process.pid)) fs.unlinkSync(slot); } catch { /* already gone */ } };
  process.once('exit', release);
  return release;
}
