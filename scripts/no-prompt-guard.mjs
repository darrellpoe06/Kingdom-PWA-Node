#!/usr/bin/env node
// =============================================================================
// no-prompt-guard — window.prompt() is BANNED in the PWA (DR-0076 proven-to-catch;
// DR-0239 gate-the-class).
//
// WHY: the app runs as an INSTALLED standalone PWA on the family's phones, where
// window.prompt() is blocked / a no-op — the tap does nothing visible and the
// action never completes. On 2026-07-30 Darrell reported the Books → Debts
// "Add as debt" button "not working when you push it": it called prompt() for
// the owed balance, so on his installed PWA the debt was never added. The fix
// made it one-tap (balance set with the existing inline edit). This guard keeps
// prompt() from creeping back into any input flow — a re-added prompt() call
// fails CI here instead of silently dying on a phone.
//
// SCOPE: matches a real CALL to the global prompt() — `prompt("...")`,
// `window.prompt('...')` — whose first arg is a string literal (every real
// prompt passes a message). It does NOT match method calls (`obj.prompt(`),
// identifiers (`promptId`), or JSX/prose text ("A.I. prompt(s)"), so it is
// precise. confirm()/alert() are out of scope (they degrade differently and are
// widespread); this guard is specifically the input-gathering dialog that
// breaks an action outright.
//
// PROVEN-TO-CATCH (DR-0076 §3): the unit test feeds a prompt() call and REQUIRES
// a finding; a method call, an identifier, and JSX text must produce none.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');

// A real global prompt() call: optional `window.`, `prompt(` (NO space before the
// paren — real calls are `prompt(`, while prose like 'a vague prompt ("...")'
// inside a lesson string writes `prompt (` with a space), then a string-literal
// first arg. `(?<![.\w])` rejects `.prompt(` (method) and `xprompt(`.
const PROMPT_CALL = /(?<![.\w])(?:window\s*\.\s*)?prompt\(\s*[`'"]/;

export function findPromptCalls(text, file = '') {
  const out = [];
  const lines = String(text || '').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue; // comment
    if (PROMPT_CALL.test(line)) out.push({ file, line: i + 1, text: line.trim().slice(0, 120) });
  }
  return out;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (name !== 'node_modules') walk(p, acc); }
    else if (/\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name)) acc.push(p);
  }
  return acc;
}

if (process.argv[1] && process.argv[1].endsWith('no-prompt-guard.mjs')) {
  const findings = [];
  for (const f of walk(SRC)) {
    for (const hit of findPromptCalls(readFileSync(f, 'utf8'), f.replace(ROOT + '/', ''))) findings.push(hit);
  }
  if (findings.length) {
    console.error('no-prompt-guard FAILED — window.prompt() is blocked in the installed PWA; use an inline input instead:');
    for (const h of findings) console.error(`  - ${h.file}:${h.line}  ${h.text}`);
    process.exit(1);
  }
  console.log('no-prompt-guard: OK — no window.prompt() input dialog in app/src (PWA-safe).');
}
