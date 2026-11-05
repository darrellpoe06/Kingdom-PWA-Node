#!/usr/bin/env node
// =============================================================================
// error-text-guard — a response to a client never carries raw exception text
// =============================================================================
// DR-1330 D5 (2026-11-05). The Ways review found no stack traces reaching
// users (the slide's pitfall in its literal form) and 26 places where the
// exception's own words did: `detail: e.message` in three Pages Functions and
// the voice worker, `"detail": str(e)` in twelve FastAPI responses on the NAS.
// An exception's message is written for the engineer; it can carry a path, a
// host, a query, a library's internals. A person gets a short error code and
// a reference id; the full text goes to the log under that id, where someone
// who can act on it reads it.
//
// THE RULE, machine-shaped: on any line that builds an HTTP response
// (`JSONResponse(`, `HTTPException(`, `json(`, `new Response(`, `res.json(`,
// `res.send(`, `.end(`), the text of an exception (`str(e)`, `repr(e)`,
// `e.message`, `err.message`, `error.message`, `${e}`, `String(e)`) must not
// appear. Report dicts a batch runner writes to its own log or table are not
// responses and are not read. A deliberate exception lives in
// scripts/error-text-allowlist.json with a why and a date.
//
// Pure `scan()` exported for vitest (proven to catch: each shape on a response
// line requires a finding; the same text in a log line does not).
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const RESPONSE = /\b(JSONResponse|HTTPException|PlainTextResponse|HTMLResponse)\s*\(|\bjson\s*\(\s*\{|new Response\s*\(|\bres\.(json|send|end)\s*\(|\breply\.(send|code)\s*\(/;
export const EXC_TEXT = /\b(str|repr)\s*\(\s*(e|err|exc|error|ex)\b\s*\)|\b(e|err|exc|error|ex)\.(message|args)\b|\$\{\s*(e|err|exc|error|ex)\s*\}|String\s*\(\s*(e|err|exc|error|ex)\b/;
export const ROOTS = ['app/functions', 'backend', 'infra'];
export const SKIP = /(^|\/)(node_modules|vendor|\.venv|site-packages|__tests__|tests?|fixtures)\//;

/** @returns {{line:number, text:string}[]} */
export function scan(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim().startsWith('#') || l.trim().startsWith('//')) continue;
    if (RESPONSE.test(l) && EXC_TEXT.test(l)) out.push({ line: i + 1, text: l.trim().slice(0, 140) });
  }
  return out;
}

export function judge(findings, allowlist, today) {
  const failures = [];
  for (const a of allowlist) {
    if (!a.path || !a.line || !a.why || !a.reReview) failures.push(`allowlist entry ${JSON.stringify(a)} needs path, line, why and reReview`);
    else if (a.reReview <= today) failures.push(`allowlist entry ${a.path}:${a.line} passed its re-review date ${a.reReview}`);
  }
  for (const f of findings) {
    if (!allowlist.some((a) => a.path === f.path && a.line === f.line)) failures.push(`${f.path}:${f.line}: ${f.text}`);
  }
  return failures;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const files = execFileSync('git', ['ls-files', '-z', '--', ...ROOTS], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0').filter((p) => /\.(py|js|mjs|ts)$/.test(p) && !SKIP.test(p));
  const findings = [];
  for (const path of files) for (const f of scan(readFileSync(join(ROOT, path), 'utf8'))) findings.push({ path, ...f });
  const allowlist = JSON.parse(readFileSync(join(ROOT, 'scripts/error-text-allowlist.json'), 'utf8')).entries;
  const failures = judge(findings, allowlist, new Date().toISOString().slice(0, 10));
  if (failures.length) {
    console.error(`error-text-guard: ${failures.length} response(s) carry raw exception text (give the person a code and a ref; log the text under the ref):\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`error-text-guard: OK — ${files.length} server files, no response carries raw exception text (${findings.length} allowlisted).`);
}
