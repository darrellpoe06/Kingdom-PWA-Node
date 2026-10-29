// =============================================================================
// A dead tailnet key is never silent, and it never switches off the proofs
// =============================================================================
// Measured 2026-10-29. The TS_AUTHKEY secret began answering `backend error:
// invalid key` on 2026-10-28, and two things followed that nothing recorded:
//
//   1. db-migrate's sovereign replay -- the only step that lands a merged
//      migration on the database the APP READS (REPOINT-ARMED, DR-0317) --
//      failed every run. Migration 0313 merged 2026-10-28 02:38 and had not
//      reached the live database 22 hours later. No ledger held an entry.
//   2. The isolation proofs stopped. Their dispatch was `if: success()`, which
//      reads the JOB's status, and the job is red whenever the sovereign half
//      fails -- so a shut road on one database silently switched off the
//      proofs for the other. Last run: 2026-10-27 19:35, twenty-nine hours.
//
// Both halves are gated here, and most of this file is deliberately about the
// WORKFLOW FILES rather than the helper: the defect lived in two `if:`
// expressions, so a suite that only exercised the helper's arithmetic would
// have been green through the whole outage. Each workflow assertion is written
// in BOTH directions -- the condition names a step id, and that step really
// carries that id -- because a gate that reads a condition without checking
// what it refers to stays green over a renamed step, which is the same empty
// room DR-0076 section 3 forbids.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decide, body, TITLE, COOLDOWN_HOURS } from '../../../scripts/tailnet-key-incident.mjs';

const repo = join(__dirname, '..', '..', '..');
const wf = (n) => readFileSync(join(repo, '.github', 'workflows', n), 'utf8');

describe('the escalation decides by measurement, and writes rather than assumes', () => {
  const now = new Date('2026-10-29T12:00:00Z');

  it('with no entry open, it files one', () => {
    expect(decide({ issue: null, now })).toMatchObject({ action: 'create' });
  });

  it('BUDGET BRAKE: inside the cooldown window it is a deliberate no-op that says why', () => {
    // 64 workflows read TS_AUTHKEY. Without this brake the entry meant to make
    // the outage readable would be the thing burying it.
    const v = decide({ issue: { number: 7, lastActivityAt: '2026-10-29T09:00:00Z' }, now });
    expect(v.action).toBe('skip');
    expect(v.hoursSince).toBeCloseTo(3, 5);
    expect(v.reason).toMatch(/#7/);
    expect(v.reason).toMatch(String(COOLDOWN_HOURS));
  });

  it('past the window the thread gets the next observation', () => {
    const v = decide({ issue: { number: 7, lastActivityAt: '2026-10-29T02:00:00Z' }, now });
    expect(v.action).toBe('comment');
    expect(v.hoursSince).toBeCloseTo(10, 5);
  });

  it('the boundary belongs to the window, not to the write', () => {
    const atEdge = new Date('2026-10-29T12:00:00Z');
    const justInside = decide({ issue: { number: 7, lastActivityAt: '2026-10-29T06:00:01Z' }, now: atEdge });
    const justOutside = decide({ issue: { number: 7, lastActivityAt: '2026-10-29T05:59:59Z' }, now: atEdge });
    expect(justInside.action).toBe('skip');
    expect(justOutside.action).toBe('comment');
  });

  it('DR-0076 section 8: a timestamp it could not read is never treated as recent', () => {
    // Unknown freshness must not read as fresh. A duplicate comment is the
    // cheaper error than a silent outage -- which is the whole defect here.
    const v = decide({ issue: { number: 7, lastActivityAt: 'not a date' }, now });
    expect(v.action).toBe('comment');
    expect(v.reason).toMatch(/could not be read/);
  });

  it('the body quotes the tool verbatim, names the live-database hazard, and asks for exactly one value', () => {
    const said = 'backend error: invalid key: THE-KEY-ID not valid';
    const text = body({ workflow: 'db-migrate (sovereign replay)', runUrl: 'https://example/run/1', measured: said, at: '2026-10-29 12:00 UTC' });
    expect(text).toContain(said);                       // re-typed claims are not evidence (DR-0076 §4)
    expect(text).toContain('db-migrate (sovereign replay)');
    expect(text).toContain('https://example/run/1');
    expect(text).toMatch(/sovereign database can fall behind the repo/);
    expect(text).toMatch(/REPOINT-ARMED/);
    expect(text).toMatch(/Reusable \+ Ephemeral/);
    expect(text).toMatch(/TS_AUTHKEY/);
    // It must not pretend to have read something it was handed nothing for.
    expect(body({ workflow: 'x', runUrl: 'y', measured: '   ', at: 'z' })).toMatch(/passed no measured text/);
  });

  it('the title is one rolling entry, so the ledger is a thread and not a drift of duplicates', () => {
    expect(TITLE).toMatch(/Tailnet key refused/);
    expect(COOLDOWN_HOURS).toBe(6);
  });
});

describe('db-migrate: the proofs are keyed on the half they actually need', () => {
  const y = wf('db-migrate.yml');

  it('PROVEN TO CATCH: the isolation dispatch is no longer gated on the whole job', () => {
    // The exact shape of the 29-hour outage: `if: success()` on this step.
    const dispatch = y.slice(y.indexOf('Dispatch the isolation proofs'));
    const cond = dispatch.slice(0, dispatch.indexOf('\n', dispatch.indexOf('if:')));
    expect(cond).not.toMatch(/if:\s*success\(\)/);
    expect(cond).toContain("steps.hosted.outcome == 'success'");
    expect(cond).toContain("steps.witness.outcome == 'success'");
    expect(cond).toContain('!cancelled()');
  });

  it('and the two ids that condition names really exist, so it cannot be green over nothing', () => {
    expect(y).toMatch(/name: Apply migrations[^\n]*\n\s*id: hosted/);
    expect(y).toMatch(/name: Witness the LIVE definitions[^\n]*\n\s*id: witness/);
    expect(y).toMatch(/name: Replay onto the sovereign database\n\s*id: replay/);
  });

  it('a shut sovereign road writes itself down, and only when it is actually shut', () => {
    const esc = y.slice(y.indexOf('Say so in the ledger when the sovereign road is shut'));
    const cond = esc.slice(0, esc.indexOf('\n', esc.indexOf('if:')));
    expect(cond).toContain("steps.replay.outcome == 'failure'");
    expect(cond).toContain('always()');
    expect(esc).toContain('scripts/tailnet-key-incident.mjs');
    expect(esc).toContain('--measured-file /tmp/replay-output.txt');
  });

  it('the replay output is captured without a pipe, so the step keeps the replay exit code', () => {
    // Reading through a pipe hands the step the LAST command's status. The
    // repo already pays for that lesson on its gate runs; it is not re-learned
    // here on the step that decides whether the live database is current.
    const replay = y.slice(y.indexOf('id: replay'), y.indexOf('Say so in the ledger'));
    const invocation = replay.match(/^.*sovereign-replay-over-tailnet\.sh.*$/m);
    expect(invocation, 'the replay step must still invoke the replay script').toBeTruthy();
    // `||` is not a pipe, and the guard that keeps `bash -e` quiet needs one.
    // Drop the pairs first, then any remaining `|` is a real pipe -- which is
    // what would hand this step the wrong exit status.
    expect(invocation[0].replace(/\|\|/g, ''), 'no pipe: the step must keep the replay exit code, not tee\'s').not.toContain('|');
    expect(replay).toContain('> /tmp/replay-output.txt 2>&1 || rc=$?');
    expect(replay).toContain('exit $rc');
  });

  it('the job may write the entry it is told to write', () => {
    const perms = y.slice(y.indexOf('permissions:'), y.indexOf('steps:'));
    expect(perms).toMatch(/issues:\s*write/);
  });
});

describe('node-availability: the witness for this outage records this outage', () => {
  const y = wf('node-availability.yml');

  it('PROVEN TO CATCH: a refused join files before it re-raises', () => {
    // It exited 1 straight out, so the rolling-incident step below -- gated on
    // the probe's exit code -- was skipped along with the probe itself.
    const verify = y.slice(y.indexOf('Verify the tailnet actually joined'), y.indexOf('Read the fleet'));
    expect(verify).toContain('scripts/tailnet-key-incident.mjs');
    expect(verify).toContain('exit 1');
    expect(verify.indexOf('tailnet-key-incident.mjs')).toBeLessThan(verify.lastIndexOf('exit 1'));
  });

  it('the escalation can never be what fails the lane', () => {
    const verify = y.slice(y.indexOf('Verify the tailnet actually joined'), y.indexOf('Read the fleet'));
    expect(verify).toMatch(/tailnet-key-incident\.mjs[\s\S]*?\|\| true/);
  });

  it('it still has the permission its own rolling incident needs', () => {
    expect(y.slice(0, y.indexOf('jobs:'))).toMatch(/issues:\s*write/);
  });
});
