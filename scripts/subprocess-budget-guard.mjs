#!/usr/bin/env node
// =============================================================================
// subprocess-budget-guard — a spawned script's own budget may not meet or
// exceed the test runner's timeout (DR-1348; the tests it guards are DR-1269;
// DR-0076 §3 proven-to-catch; DR-0239 gate-the-class)
// =============================================================================
// WHY THIS EXISTS. The runner KILLS a case rather than waiting for the script
// it spawned. So when a test hands a subprocess a budget equal to (or above)
// its own vitest ceiling, the two are tied by construction and the case dies on
// a contended runner with "Test timed out in Nms" — never an assertion failure,
// and never reproducibly on an idle machine. The test looks flaky. It is not;
// it is a race that was written down.
//
// This class has now bitten three times across two files:
//
//   1. the-deploy-has-more-than-one-road.test.js granted served-anon-key.py
//      --timeout 5 under the DEFAULT 5000ms ceiling. CI run 42081880950 shard
//      1/4 died at 5009ms. A 9ms overrun against an exactly-equal budget.
//   2. the same file's replay cases set SOVEREIGN_REPLAY_TIMEOUT=5 under the
//      same 5000ms default — and the single-flight case invokes the script
//      TWICE, so its worst case was 10s.
//   3. a-backup-on-request.test.js passed execFileSync { timeout: 60000 }
//      while every case carried a 60000ms ceiling. A dead tie at 60s.
//
// The same shape is already documented one layer up as P54 in
// app/vitest.config.js, where a DNS failure inherited an unbounded wait and
// 11 tests failed at ~5002ms in a loaded suite while passing alone in 1.7s.
// Three recurrences is enough: a comment cannot fail a build, so this does.
//
// WHAT IT FORBIDS: a test case that reaches a spawn, whose file declares an
// explicit subprocess budget >= that case's runner ceiling (its third argument
// to it()/test(), or vitest's 5000ms default when it has none).
//
// WHAT IT DOES NOT DO: it compares ONE declared budget against the ceiling. It
// does not know how many times a case invokes the script, and several of these
// budgets are PER INVOCATION or PER FETCH rather than a total wall clock — so a
// case can satisfy this guard and still be tied through a multiplier. That
// residual belongs to the test file, next to the fixtures that set the count:
// see `budgetsAreOrdered` in the-deploy-has-more-than-one-road.test.js, which
// pins (fetches x per-fetch) and (invocations x per-run) against the ceiling.
// This guard is the floor every spawning test must clear; that test is the
// ceiling for its own fixtures. Both are needed.
//
// PROVEN-TO-CATCH (DR-0076 §3): src/__tests__/subprocess-budget-guard.test.js
// feeds it the three ORIGINAL tied shapes above and REQUIRES a finding for
// each, then feeds it the corrected shapes and requires silence. A guard that
// cannot fail is theater.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TESTS = join(ROOT, 'app/src/__tests__');

// vitest's own default when a case names no ceiling. Kept here so a change to
// testTimeout in vitest.config.js is a deliberate edit in two places.
export const DEFAULT_CEILING_MS = 5000;

const SPAWN_RE = /\b(?:spawnSync|spawn|execFileSync|execFile|execSync|exec)\s*\(/g;

// ---------------------------------------------------------------------------
// A small scanner. We need real spans (which `it(` owns which text, where its
// third argument starts), and regex alone cannot give that across strings,
// template literals and comments.
// ---------------------------------------------------------------------------
function splitTopLevelArgs(src, openIdx) {
  let i = openIdx + 1;
  let paren = 1;
  let brace = 0;
  let bracket = 0;
  const args = [];
  let start = i;
  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (two === '//') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i += 1;
      while (i < src.length) {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          i += 1;
          break;
        }
        // `${ ... }` can itself hold quotes and parens; walk it as a nested span
        if (quote === '`' && src.slice(i, i + 2) === '${') {
          let d = 1;
          i += 2;
          while (i < src.length && d > 0) {
            if (src[i] === '{') d += 1;
            else if (src[i] === '}') d -= 1;
            i += 1;
          }
          continue;
        }
        i += 1;
      }
      continue;
    }
    if (c === '(') paren += 1;
    else if (c === ')') {
      paren -= 1;
      if (paren === 0) {
        args.push([start, i]);
        return { args, end: i };
      }
    } else if (c === '{') brace += 1;
    else if (c === '}') brace -= 1;
    else if (c === '[') bracket += 1;
    else if (c === ']') bracket -= 1;
    else if (c === ',' && paren === 1 && brace === 0 && bracket === 0) {
      args.push([start, i]);
      start = i + 1;
    }
    i += 1;
  }
  return { args, end: src.length };
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

// Blank out comments and TEMPLATE-LITERAL contents, preserving length so every
// index still lines up with the original. Template literals are where a test
// keeps code-as-data (the guard's own fixtures are tied shapes on purpose), and
// a budget quoted inside one is not a budget this file actually grants.
// Ordinary '...' strings are LEFT ALONE, because the real budgets live in them:
// `'--timeout', '5'` and `SOVEREIGN_REPLAY_TIMEOUT: '5'` are both quoted.
export function maskDataRegions(src) {
  const out = src.split('');
  const blank = (s, e) => {
    for (let k = s; k < e && k < out.length; k += 1) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two === '//') {
      const nl = src.indexOf('\n', i);
      const e = nl === -1 ? src.length : nl;
      blank(i, e);
      i = e;
      continue;
    }
    if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const e = end === -1 ? src.length : end + 2;
      blank(i, e);
      i = e;
      continue;
    }
    if (src[i] === '`') {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '`') break;
        j += 1;
      }
      blank(i + 1, j);
      i = Math.min(j + 1, src.length);
      continue;
    }
    if (src[i] === '"' || src[i] === "'") {
      const q = src[i];
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === q || src[j] === '\n') break;
        j += 1;
      }
      i = Math.min(j + 1, src.length);
      continue;
    }
    i += 1;
  }
  return out.join('');
}

// A test that IMPORTS this guard is this guard's own proven-to-catch suite: its
// fixtures are tied shapes by design, so inspecting it would make the gate flag
// the very evidence that it works.
//
// This requires a real import, never a mention. A substring match on the file
// name would exempt any test that merely DOCUMENTS the rule in a comment --
// which is exactly what a-backup-on-request.test.js now does, and exempting it
// would have hidden a live tie from the gate. Comments are masked out first for
// the same reason; the import path survives because ordinary strings are kept.
export const isOwnProofSuite = (raw) => /\bfrom\s+['"][^'"]*subprocess-budget-guard\.mjs['"]/.test(maskDataRegions(raw));

// `const NAME = 3;` -> 3. Only plain integer literals; anything computed is
// left unresolved on purpose rather than guessed at.
function numericConsts(src) {
  const out = new Map();
  for (const m of src.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(\d+)\s*;/g)) {
    out.set(m[1], Number(m[2]));
  }
  return out;
}

function resolveNumber(expr, consts) {
  const t = expr.trim();
  if (/^\d+$/.test(t)) return Number(t);
  if (consts.has(t)) return consts.get(t);
  return null;
}

// ---------------------------------------------------------------------------
// The declared subprocess budgets in a file, normalised to milliseconds.
// ---------------------------------------------------------------------------
export function declaredBudgetsMs(raw) {
  const src = maskDataRegions(raw);
  const consts = numericConsts(src);
  const found = [];
  const push = (ms, idx, text) => {
    if (ms !== null) found.push({ ms, line: lineOf(src, idx), text });
  };
  const num = (raw) => {
    const s = String(raw)
      .trim()
      .replace(/^String\(|\)$/g, '')
      .replace(/^['"]|['"]$/g, '');
    return resolveNumber(s, consts);
  };

  // child_process option, already milliseconds: { timeout: 60000 }
  for (const m of src.matchAll(/\btimeout\s*:\s*([\w$]+)\s*[,}]/g)) {
    push(num(m[1]), m.index, m[0].trim());
  }
  // a CLI flag in seconds: '--timeout', '5'  |  '--timeout', String(FOO)
  for (const m of src.matchAll(/['"]--timeout['"]\s*,\s*(String\([\w$]+\)|['"][\w$]+['"]|[\w$]+)/g)) {
    const n = num(m[1]);
    push(n === null ? null : n * 1000, m.index, m[0].trim());
  }
  // the same flag joined: --timeout=5
  for (const m of src.matchAll(/--timeout=(\d+)/g)) {
    push(Number(m[1]) * 1000, m.index, m[0].trim());
  }
  // an env budget in seconds: SOMETHING_TIMEOUT: '5' | String(FOO)
  for (const m of src.matchAll(/\b[A-Z][A-Z0-9_]*_TIMEOUT\s*:\s*(String\([\w$]+\)|['"]\d+['"]|[\w$]+)/g)) {
    const n = num(m[1]);
    push(n === null ? null : n * 1000, m.index, m[0].trim());
  }
  return found;
}

// ---------------------------------------------------------------------------
// Which cases can actually reach a spawn? The spawn is usually inside a helper
// (`run()`, `select()`, `runSelector()`), so containment alone is not enough:
// we mark helpers that spawn, then helpers that call those, to a fixpoint.
// ---------------------------------------------------------------------------
function spawnIndices(src) {
  return [...src.matchAll(SPAWN_RE)].map((m) => m.index);
}

function declaredFunctions(src) {
  const decls = [];
  const res = [/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g, /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|function\b)/g];
  for (const re of res) {
    for (const m of src.matchAll(re)) {
      const paren = src.indexOf('(', m.index);
      if (paren === -1) continue;
      const { end } = splitTopLevelArgs(src, paren);
      // the body runs from the arg list to the end of the following block or
      // expression; a brace walk covers both arrow bodies and function bodies
      let i = end + 1;
      let depth = 0;
      let bodyEnd = src.length;
      let started = false;
      while (i < src.length) {
        const c = src[i];
        if (c === '{') {
          depth += 1;
          started = true;
        } else if (c === '}') {
          depth -= 1;
          if (started && depth === 0) {
            bodyEnd = i;
            break;
          }
        } else if (!started && c === ';') {
          bodyEnd = i;
          break;
        }
        i += 1;
      }
      decls.push({ name: m[1], start: m.index, end: Math.max(bodyEnd, end) });
    }
  }
  return decls;
}

function spawningHelperNames(src) {
  const spawns = spawnIndices(src);
  const decls = declaredFunctions(src);
  const marked = new Set();
  for (const d of decls) {
    if (spawns.some((s) => s > d.start && s < d.end)) marked.add(d.name);
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of decls) {
      if (marked.has(d.name)) continue;
      const body = src.slice(d.start, d.end);
      for (const n of marked) {
        if (new RegExp(`\\b${n}\\s*\\(`).test(body)) {
          marked.add(d.name);
          grew = true;
          break;
        }
      }
    }
  }
  return { marked, spawns };
}

export function findBudgetTies(raw, file) {
  if (isOwnProofSuite(raw)) return [];
  const budgets = declaredBudgetsMs(raw);
  if (!budgets.length) return [];
  // every structural scan runs on the masked text, so a tied shape quoted as a
  // fixture neither grants a budget nor counts as reaching a spawn
  const src = maskDataRegions(raw);
  const { marked, spawns } = spawningHelperNames(src);
  if (!spawns.length) return [];
  const consts = numericConsts(src);
  // the widest declared budget: any spawning case could be the one that uses it
  const worst = budgets.reduce((a, b) => (b.ms > a.ms ? b : a));

  const findings = [];
  for (const m of [...src.matchAll(/\b(?:it|test)\s*(?:\.\w+)?\s*\(/g)]) {
    const open = src.indexOf('(', m.index);
    const { args } = splitTopLevelArgs(src, open);
    if (args.length < 2) continue;
    const bodySpan = args[1];
    const body = src.slice(bodySpan[0], bodySpan[1]);
    const reaches = spawns.some((s) => s > bodySpan[0] && s < bodySpan[1]) || [...marked].some((n) => new RegExp(`\\b${n}\\s*\\(`).test(body));
    if (!reaches) continue;

    const ceilingExpr = args.length >= 3 ? src.slice(args[2][0], args[2][1]) : null;
    const ceiling = ceilingExpr === null ? DEFAULT_CEILING_MS : resolveNumber(ceilingExpr, consts);
    if (ceiling === null) continue; // unresolvable on purpose; not a guess
    if (worst.ms >= ceiling) {
      const name = /['"`]([^'"`]{0,70})/.exec(raw.slice(args[0][0], args[0][1]));
      findings.push({
        file,
        line: lineOf(src, m.index),
        case: name ? name[1] : '(unnamed)',
        budgetMs: worst.ms,
        budgetLine: worst.line,
        budgetText: worst.text,
        ceilingMs: ceiling,
        ceilingSource: ceilingExpr === null ? 'vitest default' : ceilingExpr.trim(),
      });
    }
  }
  return findings;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name !== 'node_modules') walk(p, acc);
    } else if (/\.test\.(jsx?|tsx?)$/.test(name)) acc.push(p);
  }
  return acc;
}

if (process.argv[1] && process.argv[1].endsWith('subprocess-budget-guard.mjs')) {
  const files = walk(TESTS);
  const findings = [];
  let watched = 0;
  let exempt = 0;
  for (const f of files) {
    const raw = readFileSync(f, 'utf8');
    if (isOwnProofSuite(raw)) {
      exempt += 1;
      continue;
    }
    if (!declaredBudgetsMs(raw).length || !spawnIndices(maskDataRegions(raw)).length) continue;
    watched += 1;
    findings.push(...findBudgetTies(raw, f.replace(`${ROOT}/`, '')));
  }
  if (findings.length) {
    console.error("subprocess-budget-guard FAILED — a spawned script's budget meets or exceeds the test");
    console.error("runner's ceiling. The runner KILLS the case rather than waiting, so this is a race by");
    console.error('construction: it dies as "Test timed out in Nms" on a loaded runner and passes when idle');
    console.error('(DR-1269). Lower the subprocess budget, or give the case an explicit larger ceiling.');
    for (const h of findings) {
      console.error(`  - ${h.file}:${h.line}  "${h.case}"`);
      console.error(`      budget ${h.budgetMs}ms  (${h.budgetText} at line ${h.budgetLine})`);
      console.error(`      ceiling ${h.ceilingMs}ms  (${h.ceilingSource})`);
    }
    process.exit(1);
  }
  console.log(
    `subprocess-budget-guard: OK — ${watched} test file(s) spawn with an explicit budget, every one strictly under its runner ceiling (${exempt} proof-suite file(s) hold tied shapes as fixtures and are exempt).`
  );
}
