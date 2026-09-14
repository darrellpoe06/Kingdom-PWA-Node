// `--generate` MUST NOT DESTROY THE LEDGER IT EXISTS TO PROTECT.
// =============================================================================
// Found 2026-09-14 while taking the ratchet re-freeze the guard itself asks for
// ("An extraction shrank the shell. Re-freeze the ratchet lower: node
// scripts/monolith-budget-guard.mjs --generate").
//
// Running it did re-freeze the budget correctly — and silently replaced the
// `note` field's ~13,000 characters with a 350-character stub, printing a
// success message while doing it.
//
// That field is not boilerplate. It is the ledger of every RAISE ever granted
// to the monolith freeze, each with the justification the note's own text
// demands: "To RAISE this number, edit by hand with a stated reason in the PR."
// Roughly fifteen decisions, from DR-0291's Your Data surface through 0214's
// giving book, each recording exactly which lines were irreducible and why.
// `--generate` deleted all of it and exited 0.
//
// This is the harmful-success class (P56, extracted the same night): a step that
// fails by SUCCEEDING is invisible to every check that only watches for errors.
// The git diff was the only witness, and only because someone read it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const guardSrc = () => readFileSync(join(ROOT, 'scripts/monolith-budget-guard.mjs'), 'utf8');

describe('the budget note is a ledger, and --generate preserves it', () => {
  it('does NOT write a hardcoded note unconditionally', () => {
    // The precise shape of the bug: `note:` assigned a string literal with no
    // reference to what was already on disk.
    const src = guardSrc();
    expect(src).not.toMatch(/note:\s*'Frozen ceiling for the hybrid-modular cutover/);
  });

  it('carries an existing note through, falling back only when there is none', () => {
    const src = guardSrc();
    expect(src).toMatch(/note:\s*\(budgetDoc\s*&&[\s\S]{0,120}budgetDoc\.note/);
    expect(src).toMatch(/:\s*DEFAULT_NOTE/);
  });

  it('still has a default to use when initialising a budget for the first time', () => {
    expect(guardSrc()).toMatch(/const DEFAULT_NOTE\s*=/);
  });
});

describe('the real ledger is intact on disk', () => {
  // A floor, not an exact length: the note only ever grows as raises are
  // granted, so this catches a truncation without pinning the text.
  it('still carries the full raise history', () => {
    const budget = JSON.parse(readFileSync(join(ROOT, 'scripts/monolith-budget.json'), 'utf8'));
    expect(typeof budget.note).toBe('string');
    expect(budget.note.length).toBeGreaterThan(10000);
  });

  it('still names the specific decisions it is the record of', () => {
    const { note } = JSON.parse(readFileSync(join(ROOT, 'scripts/monolith-budget.json'), 'utf8'));
    // Three raises from three different months; if the stub had been written,
    // every one of these would be gone.
    expect(note).toContain('DR-0291');
    expect(note).toContain('DR-0313');
    expect(note).toMatch(/RAISED 5358 -> 5359/);
  });
});
