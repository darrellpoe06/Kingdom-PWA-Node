// =============================================================================
// re-review-ratchet-guard — PROVEN TO CATCH, on real copies of the tree
// =============================================================================
// DR-0075, Darrell's own words: "everything must get better perpetually; if
// not, why — and if the why makes sense it's a decision and a re-review date
// that makes sense for the issue." The teeth are the last clause: "Nothing
// parked is parked forever; the date is the promise it is revisited."
//
// NOTHING CHECKED WHETHER THE DATE HAD PASSED. The only gate that read these
// dates checked that they were SHAPED like a date and nothing more
// (system-flow-graph.mjs:205), so a parked thing kept its promise forever and
// the lane stayed green. Measured 2026-11-12: 54 of 73 machine-readable dates
// were already past due, across 9 files, the oldest by 103 days.
//
// AND IT HAD BEEN FOUND ONCE BEFORE. app/src/lib/sovereignty-gaps.js carries,
// in its own comment: "OVERDUE BY 52 DAYS when this was found (2026-09-14) —
// nothing surfaced it, which is the DR-0075 failure the date exists to
// prevent." It was written down, and nothing was built. A finding that becomes
// a comment instead of a check is a finding that recurs; that comment is the
// reason this gate exists rather than a tenth note about the same thing.
//
// Each case copies the real tree to a temp dir, breaks ONE thing, and runs the
// guard there. Nothing in the repo is touched.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, cpSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const TODAY = '2026-11-12';

let box = '';
beforeAll(() => {
  box = mkdtempSync(join(tmpdir(), 'rerev-'));
  mkdirSync(join(box, 'app', 'src'), { recursive: true });
  cpSync(join(REPO, 'scripts'), join(box, 'scripts'), { recursive: true });
  cpSync(join(REPO, 'infra'), join(box, 'infra'), { recursive: true });
  cpSync(join(REPO, 'app', 'src', 'lib'), join(box, 'app', 'src', 'lib'), { recursive: true });
});
afterAll(() => {
  if (box) rmSync(box, { recursive: true, force: true });
});

const run = (args = []) => {
  try {
    const out = execFileSync(process.execPath, [join(box, 'scripts', 're-review-ratchet-guard.mjs'), ...args], {
      cwd: box,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, RE_REVIEW_TODAY: TODAY },
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
};

const BASE = () => join(box, 'scripts', 're-review-baseline.json');
const readBase = () => JSON.parse(readFileSync(BASE(), 'utf8'));
const writeBase = (b) => writeFileSync(BASE(), `${JSON.stringify(b, null, 2)}\n`);

describe('it passes on the real tree, and says what it measured', () => {
  it('green, with the counts in the message rather than a bare OK', () => {
    const { code, out } = run();
    expect(code, out).toBe(0);
    expect(out).toMatch(/54 past due/);
    expect(out).toMatch(/ceiling 54/);
  });
});

describe('RULE 1 — a NEW past-due date fails, which is the whole point', () => {
  it('fails when a date in a tracked file slips past today', () => {
    // open-source-candidates.js has 8 of 10 past due; push one of the two
    // current ones into the past, as a real week going by would.
    const p = join(box, 'app', 'src', 'lib', 'open-source-candidates.js');
    const before = readFileSync(p, 'utf8');
    // PICK A DATE THAT IS GENUINELY STILL FUTURE, by comparing, not by pattern.
    // A first draft matched /2026-1[1-9]-\d\d/ and happily chose 2026-11-08 —
    // already past due — so it swapped one overdue date for another, the count
    // never moved, and the case failed while the guard was working correctly.
    const future = [...before.matchAll(/reReview: '(\d{4}-\d{2}-\d{2})'/g)]
      .map((x) => x[1])
      .filter((d) => d > TODAY)
      .sort()
      .pop();
    expect(future, 'fixture needs one not-yet-due date to age').toBeTruthy();
    writeFileSync(p, before.replace(`reReview: '${future}'`, "reReview: '2026-01-01'"));
    const { code, out } = run();
    writeFileSync(p, before);
    expect(code).toBe(1);
    expect(out).toMatch(/open-source-candidates\.js now has 9 past-due/);
    expect(out).toMatch(/the ceiling never rises/);
  });

  it('fails when a whole new file starts carrying an overdue promise', () => {
    const p = join(box, 'scripts', 'a-newly-parked-thing.mjs');
    writeFileSync(p, "export const PARKED = [{ why: 'waits on a decision', reReview: '2026-02-02' }];\n");
    const { code, out } = run();
    rmSync(p);
    expect(code).toBe(1);
    expect(out).toMatch(/a-newly-parked-thing\.mjs carries 1 re-review date\(s\) that have passed/);
    expect(out).toMatch(/not in scripts\/re-review-baseline\.json/);
  });
});

describe('RULE 2 — the ceiling cannot be raised to admit it', () => {
  it('fails when a file count is padded above what the tree carries', () => {
    const b = readBase();
    const before = JSON.stringify(b);
    const f = b.files.find((x) => x.where.endsWith('contrast-guard.mjs'));
    f.overdue += 1;
    b.maxOverdue += 1;
    writeBase(b);
    const { code, out } = run();
    writeBase(JSON.parse(before));
    expect(code).toBe(1);
    // Padding is caught as a cleared-work claim: the tree has fewer than the
    // baseline allows, so the only honest move is to re-freeze lower.
    expect(out).toMatch(/contrast-guard\.mjs is allowed 2 past-due date\(s\) but now has only 1/);
  });

  it('--generate re-freezes DOWN only, and never up', () => {
    const b = readBase();
    const before = JSON.stringify(b);
    b.maxOverdue = 999;
    b.files.find((x) => x.where.endsWith('contrast-guard.mjs')).overdue = 50;
    writeBase(b);
    const { code } = run(['--generate']);
    const after = readBase();
    writeBase(JSON.parse(before));
    expect(code).toBe(0);
    expect(after.maxOverdue, 'the ceiling must land on the measured total, never the inflated one').toBe(54);
    expect(after.files.find((x) => x.where.endsWith('contrast-guard.mjs')).overdue).toBe(1);
  });
});

describe('RULE 3 — a cleared promise comes off the list', () => {
  it('fails rather than quietly passing when work was actually done', () => {
    // Move the oldest promise's date forward, as re-reviewing it would.
    const p = join(box, 'scripts', 'contrast-guard.mjs');
    const before = readFileSync(p, 'utf8');
    writeFileSync(p, before.replace("reReview: '2026-08-01'", "reReview: '2027-06-01'"));
    const { code, out } = run();
    writeFileSync(p, before);
    expect(code).toBe(1);
    expect(out).toMatch(/is allowed 1 past-due date\(s\) but now has only 0/);
    expect(out, 'it must name the command that re-freezes it').toMatch(/--generate/);
  });

  it('and --generate then drops the emptied file from the baseline entirely', () => {
    const p = join(box, 'scripts', 'contrast-guard.mjs');
    const src = readFileSync(p, 'utf8');
    const b = JSON.stringify(readBase());
    writeFileSync(p, src.replace("reReview: '2026-08-01'", "reReview: '2027-06-01'"));
    run(['--generate']);
    const after = readBase();
    writeFileSync(p, src);
    writeBase(JSON.parse(b));
    expect(after.files.some((x) => x.where.endsWith('contrast-guard.mjs'))).toBe(false);
    expect(after.maxOverdue).toBe(53);
  });
});

describe('RULE 4 — parked is never silent about its blocker', () => {
  it('fails when a baseline file stops saying where its blockers live', () => {
    const b = readBase();
    const before = JSON.stringify(b);
    delete b.files.find((x) => x.where.endsWith('services.json')).blockersLiveIn;
    writeBase(b);
    const { code, out } = run();
    writeBase(JSON.parse(before));
    expect(code).toBe(1);
    expect(out).toMatch(/does not say where its blockers live/);
  });
});

describe('it cannot be disarmed by emptying it', () => {
  it('an empty baseline fails loudly instead of passing vacuously', () => {
    const b = readBase();
    const before = JSON.stringify(b);
    writeBase({ _comment: b._comment, maxOverdue: 0, files: [] });
    const { code, out } = run();
    writeBase(JSON.parse(before));
    expect(code).toBe(1);
    // Every real past-due file is reported, not silence.
    expect(out).toMatch(/research-intake\.js/);
    expect(out).toMatch(/sovereignty-gaps\.js/);
  });

  it('a missing baseline fails rather than reading as nothing-is-parked', () => {
    const b = readFileSync(BASE(), 'utf8');
    rmSync(BASE());
    const { code, out } = run();
    writeFileSync(BASE(), b);
    expect(code).toBe(1);
    expect(out).toMatch(/is missing — nothing holds the parked promises/);
  });
});
