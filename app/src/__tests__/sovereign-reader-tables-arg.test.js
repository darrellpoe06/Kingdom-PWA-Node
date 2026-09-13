// =============================================================================
// Asking the LIVE database WHICH TABLES it actually has
// =============================================================================
// 2026-09-13. The sovereign reader could ask about functions (DR-0374) but not
// about tables, and a function existing proves nothing about the table it
// reads. That gap has a live cost: the Guest ready checklist writes every tick,
// cost and note into board_tasks (0059) on the database the APP reads — the
// sovereign one — and nothing in this repo could establish that the table is
// there. A missing table would not error on screen; table-sync would report a
// failed write, the tab would say so, and the list would quietly be per-device.
//
// So `tables` is a mode, with the same decision the functions argument made:
// REJECT, never escape. The caller's string lands inside a SQL IN list on a
// database reached by ssh with admin credentials, and a character class that
// cannot express a quote, a space, a semicolon or a comment marker leaves no
// string that closes the list and starts a statement.
//
// These tests RUN the real script. Validation sits ahead of the NAS_SSH_KEY
// check, so a rejected input is proved to touch no network at all.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SCRIPT = path.resolve(__dirname, '../../../scripts/sovereign-read-over-tailnet.sh');
const raw = readFileSync(SCRIPT, 'utf8');
const code = raw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

function run(mode, tablesArg) {
  try {
    const stdout = execFileSync('bash', [SCRIPT, mode, '30', '', tablesArg], {
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, out: stdout };
  } catch (e) {
    return { status: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

describe('the mode exists and is reachable', () => {
  it('accepts tables alongside feedback and definitions', () => {
    const r = run('tables', 'board_tasks');
    // No ssh key in this env, so a VALID argument gets as far as that check —
    // which is the proof the argument was accepted, not rejected.
    expect(r.out).toMatch(/NAS_SSH_KEY/);
    expect(r.out).not.toMatch(/tables must be/);
  });

  it('still rejects a mode that is not one of the three', () => {
    const r = run('everything', '');
    expect(r.status).toBe(2);
    expect(r.out).toMatch(/unknown mode/);
  });
});

describe('a table name the caller supplies is REJECTED, never escaped', () => {
  const hostile = [
    ["a quote that would close the IN list", "board_tasks','x"],
    ['a statement terminator', 'board_tasks; DROP TABLE board_tasks'],
    ['a comment marker', 'board_tasks--'],
    ['a space', 'board tasks'],
    ['an uppercase name', 'Board_Tasks'],
    ['a schema qualifier', 'public.board_tasks'],
    ['a wildcard', '*'],
    ['a trailing comma', 'board_tasks,'],
    ['an empty element', 'board_tasks,,rentals'],
    ['a command substitution', 'board_tasks$(whoami)'],
    ['a backtick', 'board_tasks`id`'],
    ['a newline smuggling a second line', 'board_tasks\nDROP TABLE rentals'],
  ];

  for (const [why, arg] of hostile) {
    it(`rejects ${why}, and reads nothing`, () => {
      const r = run('tables', arg);
      expect(r.status).toBe(2);
      expect(r.out).toMatch(/tables must be comma-separated lowercase names/);
      expect(r.out).toMatch(/nothing was read/);
      // Proved to have stopped BEFORE the network: the key check never ran.
      expect(r.out).not.toMatch(/NAS_SSH_KEY is not set/);
    });
  }

  it('accepts an ordinary comma-separated list', () => {
    const r = run('tables', 'board_tasks,rentals,property_rooms');
    expect(r.out).not.toMatch(/tables must be/);
    expect(r.out).toMatch(/NAS_SSH_KEY/);
  });
});

describe('the anchors bind the whole string, not a line', () => {
  // grep matches line by line, so a newline argument would pass on its first
  // line while smuggling a second behind it. bash's own [[ =~ ]] is used.
  it('uses [[ =~ ]] for the tables gate, not grep', () => {
    expect(code).toMatch(/\[\[ "\$TABLES" =~ \^\[a-z0-9_\]\+/);
    expect(code).not.toMatch(/echo "\$TABLES".*\|\s*grep/);
  });
});

describe('what the mode reports', () => {
  it('asks for existence, RLS and policy count — not just presence', () => {
    expect(code).toMatch(/'rls_enabled', c\.relrowsecurity/);
    expect(code).toMatch(/'policies',/);
    expect(code).toMatch(/pg_policy/);
  });

  it('names the tables that are MISSING, so silence cannot read as fine', () => {
    expect(code).toMatch(/---MISSING---/);
    expect(code).toMatch(/WHERE NOT EXISTS/);
  });

  it('reads no row CONTENTS in tables mode — a count is not a record', () => {
    const tablesBlock = code.slice(code.indexOf('---TABLES---'), code.indexOf('---DEFINITIONS---'));
    expect(tablesBlock).toMatch(/n_live_tup/);
    expect(tablesBlock).not.toMatch(/SELECT \* FROM public\./);
  });

  it('carries board_tasks in the standing list, so the default ask covers it', () => {
    expect(code).toMatch(/DEFAULT_TABLES='board_tasks/);
  });
});
