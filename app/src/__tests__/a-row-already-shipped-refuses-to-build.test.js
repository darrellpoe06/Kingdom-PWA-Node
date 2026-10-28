// @vitest-environment node
// A ROW ALREADY SHIPPED REFUSES TO BUILD -- the sweep DR-1250 asked for.
// =============================================================================
// DR-1250 (2026-10-27) found the bell calling four live lessons a backlog, and
// closed by naming the real defect: the sweep that caught it "was run four
// times, by hand, in one session. A check run four times by hand is a check
// that belongs in the instrument."
//
// 2026-10-28 made it urgent. While the runner's tailnet key was refused
// (DR-1269), the intake Routine's permitted fallback -- the hosted Supabase
// connector -- was measured against the ledger: it lists 22 rows as waiting and
// TWENTY are named in shipped decision records, three of them shipped hours
// earlier the same night. It is a different database from the one the app and
// the tagging road use, so its tags cannot be trusted, and `lesson-captured`
// is useless as the test precisely when it is needed.
//
// The ledger is the witness both roads share: a shipped lesson has a decision
// record, and that record names the row it came from. These cases pin that
// against the REAL ledger, not a fixture, because a fixture would not have
// caught either failure.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { sweep, anyShipped, readLedger, MIN_ID, DECISIONS } from '../../../scripts/lesson-row-shipped-sweep.mjs';

const REPO = resolve(import.meta.dirname, '../../..');
const TOOL = join(REPO, 'scripts', 'lesson-row-shipped-sweep.mjs');
const run = (...args) => spawnSync('node', [TOOL, ...args], { encoding: 'utf8' });

// Rows shipped on 2026-10-27/28, each with the record that names it. These are
// the three the hosted connector still listed as waiting.
const SHIPPED = [
  ['60972a31-db63-4959-8a50-ee58a28643d4', 'DR-1258'], // sov52
  ['d56b9e85-1903-4004-b6ec-04cb319784b0', 'DR-1259'], // ll268
  ['b97aa626-fb49-4347-b75c-3040eade2344', 'DR-1260'], // ll269
];

describe('the ledger is read, not the tags', () => {
  it('reads the real decision records and finds a lot of them', () => {
    const ledger = readLedger();
    expect(ledger.length).toBeGreaterThan(500);
    for (const rec of ledger) expect(rec.dr).toMatch(/^DR-\d{4}$/);
  });

  it('names the record for each row shipped this week, citing the whole id', () => {
    const found = sweep(SHIPPED.map(([id]) => id));
    for (const [id, dr] of SHIPPED) {
      expect(found.get(id).drs, `${id} should be named by ${dr}`).toContain(dr);
      expect(found.get(id).exact, `${id} is cited by its whole id`).toBe(true);
    }
    expect(anyShipped(found)).toBe(true);
  });

  it('a row no record names comes back unknown, not shipped', () => {
    // A well-formed uuid that is deliberately not in the ledger.
    const found = sweep(['00000000-dead-4bee-9999-ffffffffffff']);
    expect([...found.values()][0].drs).toEqual([]);
    expect(anyShipped(found)).toBe(false);
  });

  // THE DEFECT THE FIRST VERSION OF THIS TOOL HAD, pinned so it cannot return.
  // It searched the FULL uuid only. The ledger conventionally cites a row by
  // its first eight characters, so these two -- long since handled -- came back
  // UNKNOWN, which is the direction that lets a live lesson be rebuilt.
  it('finds a row the ledger cites by PREFIX only, and says the match is weaker', () => {
    const byPrefixOnly = [
      ['c3285321-3515-4a31-af33-438213bece79', 'DR-0771'],
      ['7ce13700-8255-4970-a5aa-079a20ac8dd0', 'DR-0768'],
    ];
    const found = sweep(byPrefixOnly.map(([id]) => id));
    for (const [id, dr] of byPrefixOnly) {
      expect(found.get(id).drs, `${id} should be found via its prefix in ${dr}`).toContain(dr);
      expect(found.get(id).exact, `${id} is cited by prefix, not whole id`).toBe(false);
    }
    expect(anyShipped(found)).toBe(true);
  });

  it('a prefix-only hit still fails the exit code, and says to read the record', () => {
    const r = run('c3285321-3515-4a31-af33-438213bece79');
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/SHIPPED\?/);
    expect(r.stdout).toMatch(/prefix only/);
    expect(r.stdout).toContain('DR-0771');
  });
});

describe('it refuses rather than guesses', () => {
  it('an id too short to search safely is refused, not answered', () => {
    expect(() => sweep(['7a74'])).toThrow(/too short/);
    const r = run('7a74');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/REFUSED/);
    // and it must not have printed a verdict for it
    expect(r.stdout).not.toMatch(/SHIPPED|unknown/);
  });

  it(`MIN_ID is at least 8, because a short prefix matches unrelated hashes`, () => {
    expect(MIN_ID).toBeGreaterThanOrEqual(8);
  });

  // THE FALSE POSITIVE THE PREFIX FIX INTRODUCED, pinned. Searching the bare
  // 8-char prefix as a substring made the fabricated id 00000000-... read as
  // SHIPPED, because DR-1235 carries the epoch 1761500000000. A false SHIPPED
  // blocks a teaching nobody has built, so the prefix must stand alone rather
  // than sit inside a longer hex run.
  it('a prefix buried in a longer hex run is not a citation', () => {
    const found = sweep(['00000000-dead-4bee-9999-ffffffffffff']);
    expect([...found.values()][0].drs).toEqual([]);
    expect(anyShipped(found)).toBe(false);
  });

  it('an id that is not hex is refused rather than compiled into a regex', () => {
    expect(() => sweep(['../../etc/passwd'])).toThrow(/not a row id/);
    expect(() => sweep(['(a|b)+cccccccc'])).toThrow(/not a row id/);
  });

  it('no arguments is a usage error, never a silent pass', () => {
    const r = run();
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/usage/);
  });
});

describe('the exit code is what a build lane can refuse on (proven to catch)', () => {
  it('exits 1 naming the record when a shipped row is offered', () => {
    const r = run(SHIPPED[0][0]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/SHIPPED/);
    expect(r.stdout).toContain(SHIPPED[0][1]);
    expect(r.stderr).toMatch(/ALREADY SHIPPED/);
  });

  it('exits 0 when nothing offered is shipped', () => {
    const r = run('00000000-dead-4bee-9999-ffffffffffff');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/unknown/);
  });

  it('a mixed batch still fails, so one shipped row cannot ride in beside new ones', () => {
    const r = run('00000000-dead-4bee-9999-ffffffffffff', SHIPPED[1][0]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/unknown/);
    expect(r.stdout).toMatch(/SHIPPED/);
    expect(r.stderr).toMatch(/1 of 2/);
  });

  it('DECISIONS points at the repository ledger, not a copy', () => {
    expect(DECISIONS).toBe(join(REPO, 'docs', 'decisions'));
  });
});
