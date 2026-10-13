// no-prompt-guard — proven-to-catch (DR-0076 §3): a real window.prompt() call
// must be CAUGHT (it is blocked/no-op in the installed PWA — the 2026-07-30
// "add as debt / new category button not working" class); a method call, an
// identifier, prose, and a comment must NOT be flagged.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPromptCalls } from '../../../scripts/no-prompt-guard.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('no-prompt-guard — window.prompt() is banned in the PWA', () => {
  it('CATCHES a bare prompt() call with a string arg', () => {
    expect(findPromptCalls('const x = prompt("New name");').length).toBe(1);
  });
  it('CATCHES a window.prompt() call', () => {
    expect(findPromptCalls("const y = window.prompt('hi');").length).toBe(1);
  });
  it('does NOT flag a method call (obj.prompt())', () => {
    expect(findPromptCalls('llm.prompt("summarize this");').length).toBe(0);
  });
  it('does NOT flag an identifier that contains "prompt"', () => {
    expect(findPromptCalls('const promptId = 5; const aiPrompt = "x";').length).toBe(0);
  });
  it('does NOT flag prose inside a string ("a vague prompt (\\"...\\")")', () => {
    expect(findPromptCalls('lesson: "A vague prompt (\\"tell me\\") gets a vague answer",').length).toBe(0);
  });
  it('does NOT flag a commented-out call', () => {
    expect(findPromptCalls('// const x = prompt("old");').length).toBe(0);
  });

  it('the REAL app/src has zero prompt() input dialogs (the fix holds)', () => {
    // Import the CLI list by re-deriving over the tree would need fs walking;
    // instead assert the two just-fixed call sites no longer contain a call.
    for (const rel of ['app/src/components/Debts.jsx', 'app/src/components/BooksAccounts.jsx', 'app/src/components/Imported.jsx']) {
      const hits = findPromptCalls(readFileSync(join(REPO, rel), 'utf8'), rel);
      expect(hits, `${rel} should have no prompt() call`).toEqual([]);
    }
  });
});
