// =============================================================================
// reviewer-lens-registry-guard — PROVEN TO CATCH, on real copies of the tree
// =============================================================================
// Darrell, 2026-11-12, reviewing as a new user from his phone, looking at his
// own Poe Properties work-order board: "I can see all this as a new person with
// no record?! They can see our businesses?!"
//
// What he had found was not one missing surface. The stranger banner reads "A
// person with no invite sees this: your own doors, vault, contacts and research
// are hidden." The headline before the colon is a GLOBAL claim about the whole
// screen; the list after it was PARTIAL; and they are one sentence. Four nouns
// were typed into the copy, four surfaces honoured the lens, and the copy, the
// code and even the test that checked the copy all agreed on four — while the
// app grew past them. Anything in the gap read straight through under a global
// promise that it would not: his work orders (which are his doors' own work)
// and the live payments ledger (money) both did.
//
// So the guard holds the sentence equal to the code. And a guard is only worth
// the breaks it has been SHOWN to catch (DR-0076 section 3) — a gate that
// cannot fail is itself a lie, and this one would otherwise be a long green
// tick over the exact class of defect it was written for.
//
// Each case copies the real tree to a temp dir, breaks ONE thing, and runs the
// guard from there. Nothing in app/src is touched.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const GUARD = join(REPO, 'scripts', 'reviewer-lens-registry-guard.mjs');

let sandbox = '';
beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'lens-guard-'));
  cpSync(join(REPO, 'app', 'src'), join(sandbox, 'app', 'src'), { recursive: true });
  cpSync(GUARD, join(sandbox, 'scripts', 'reviewer-lens-registry-guard.mjs'), { recursive: true });
});
afterAll(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
});

// Run the guard against the sandbox. Returns { code, out }.
const run = () => {
  try {
    const out = execFileSync(process.execPath, [join(sandbox, 'scripts', 'reviewer-lens-registry-guard.mjs')], {
      cwd: sandbox,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
};

const file = (rel) => join(sandbox, 'app', 'src', rel);
const edit = (rel, from, to) => {
  const p = file(rel);
  const s = readFileSync(p, 'utf8');
  expect(s.includes(from), `fixture text not found in ${rel}: ${from.slice(0, 60)}`).toBe(true);
  writeFileSync(p, s.replace(from, to));
  return () => writeFileSync(p, s);
};

describe('the guard passes on the real tree', () => {
  it('green, and it says what it checked rather than just "OK"', () => {
    const { code, out } = run();
    expect(code, out).toBe(0);
    expect(out).toMatch(/named rows/);
    expect(out).toMatch(/every one honoured/);
    expect(out).toMatch(/every honouring surface named/);
  });

  it('the guard it runs is the one in the repo, not a stale copy', () => {
    expect(existsSync(GUARD)).toBe(true);
    expect(readFileSync(GUARD, 'utf8')).toMatch(/STRANGER_HIDES/);
  });
});

describe('RULE 1 — a row the banner names must really be hidden', () => {
  // THIS CASE FOUND A HOLE IN THE GUARD, which is the whole point of writing
  // it: breaking the CALL alone changed nothing, because the surviving import
  // line still satisfied a check that only looked for the name. A file that
  // imports the lens and never asks it is exactly the shape of "we wired it"
  // that is not wiring at all, so the guard now requires a call site.
  it('fails when a named surface stops ASKING the lens, even with the import intact', () => {
    const p = file('components/Vault.jsx');
    const before = readFileSync(p, 'utf8');
    expect(before).toMatch(/isReviewerStranger\s*\(/);
    // Only the call goes; the import stays, so a mention-check would pass.
    writeFileSync(p, before.replace(/isReviewerStranger\s*\(\)/g, 'false && (() => false)('));
    const { code, out } = run();
    writeFileSync(p, before);
    expect(code).toBe(1);
    expect(out).toMatch(/names "vault"/);
    expect(out).toMatch(/never CALLS isReviewerStranger/);
  });

  it('fails when a named surface does not exist at all', () => {
    const undo = edit('lib/reviewer-lens.js', "module: 'components/Vault.jsx'", "module: 'components/NoSuchVault.jsx'");
    const { code, out } = run();
    undo();
    expect(code).toBe(1);
    expect(out).toMatch(/does not exist/);
  });
});

describe('RULE 2 — a surface that hides rows must be named', () => {
  // THIS IS THE ORIGINAL DRIFT, inverted: the four nouns stayed four precisely
  // because wiring a surface never obliged anyone to say so.
  it('fails when a lens-honouring surface is left out of the registry', () => {
    const undo = edit('lib/reviewer-lens.js', "  Object.freeze({ what: 'payments', module: 'components/PaymentsLedgerPanel.jsx' }),\n", '');
    const { code, out } = run();
    undo();
    expect(code).toBe(1);
    expect(out).toMatch(/PaymentsLedgerPanel\.jsx honours the stranger lens but is not in STRANGER_HIDES/);
  });
});

describe('RULE 3 — the words come from the registry, never a hand-typed list', () => {
  it('fails when the banner line spells the nouns out again', () => {
    const undo = edit(
      'lib/reviewer-mode.jsx',
      'A person with no invite sees this: your own ${strangerHidesList()} are hidden.',
      'A person with no invite sees this: your own doors, vault, contacts and research are hidden.'
    );
    const { code, out } = run();
    undo();
    expect(code).toBe(1);
    expect(out).toMatch(/type "doors" into a lens description by hand/);
  });

  it('fails when an Admin card spells them out again', () => {
    // The Admin cards are the OTHER place that describes the lens, read before
    // entering it. Both were four-nouns-by-hand; leaving either one unheld
    // would be the same defect with a different file name.
    const undo = edit('lib/admin-console.js', 'none of your ${strangerHidesList()}', 'no doors, no vault, no contacts, no research of yours');
    const { code, out } = run();
    undo();
    expect(code).toBe(1);
    expect(out).toMatch(/admin-console\.js/);
  });
});

describe('the guard cannot be quietly disarmed', () => {
  it('fails, rather than passing vacuously, when the registry is emptied', () => {
    const s = readFileSync(file('lib/reviewer-lens.js'), 'utf8');
    const start = s.indexOf('export const STRANGER_HIDES');
    const end = s.indexOf(']', start);
    writeFileSync(file('lib/reviewer-lens.js'), `${s.slice(0, start)}export const STRANGER_HIDES = Object.freeze([${s.slice(end)}`);
    const { code, out } = run();
    writeFileSync(file('lib/reviewer-lens.js'), s);
    expect(code).toBe(1);
    expect(out).toMatch(/empty or unreadable|honours the stranger lens but is not in STRANGER_HIDES/);
  });
});
