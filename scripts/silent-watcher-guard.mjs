// =============================================================================
// silent-watcher-guard — a watcher may never end in silence
// =============================================================================
// Born 2026-08-15 from a defect I shipped in this session's own tooling, not
// from the app. I armed a watcher on PR #1255's CI, it polled 40 times against
// a channel it could not read, and it ended with a bare TIMEOUT. For twenty
// minutes "no news" was indistinguishable from "CI is fine." The root cause was
// mundane — shell access to the GitHub API answers 403 in this session
// ("GitHub access is not enabled for this session"), so every poll returned
// nothing — but the FAILURE MODE is the thing worth gating: the script had no
// path that says "I could not observe."
//
// This is the same shape as DR-0303 (an instrument trusted for a property it
// never measured), DR-0309 (a gate whose claim was wider than its reach), and
// DR-0125 (every safeguard watched the pipeline; none watched the product).
// Stated as a rule: A GREEN CHECK MUST MEAN SOMETHING, AND SO MUST A QUIET ONE.
// Unknown is a THIRD state. It is never allowed to read as healthy (DR-0076).
//
// WHAT THIS CHECKS, HONESTLY (DR-0076 — no overclaiming). It is not a universal
// liveness prover; no such thing exists. It reads shell poll loops in the
// workflows and scripts and requires each to carry BOTH:
//   1. a BOUND — a deadline, a bounded counter, or an explicit `break` on a
//      terminal condition, so the loop cannot spin forever; and
//   2. a LOUD END — on exhausting that bound, a non-zero exit or a failure
//      written to the step summary / stderr. Falling out of a loop with only a
//      progress `echo` is the defect: the run goes green having proven nothing.
//
// The repo's existing polls already pass — the Cloudflare propagation sentinel
// (deploy-cloudflare-pages.yml) carries a 900s shared deadline and `exit 1`,
// and site-health's backend probe was hardened earlier this session. That is
// the point of adding the gate now rather than later: it is cheap while the
// tree is clean, and it fails the next one written in a hurry.
//
// PROVEN-TO-CATCH (DR-0076 §3): `--selftest` feeds the guard the exact loop I
// wrote — poll, sleep, fall out with a bare echo — and requires a catch; then a
// bounded loop with `exit 1`, and requires a pass.
//
// Usage:
//   node scripts/silent-watcher-guard.mjs
//   node scripts/silent-watcher-guard.mjs --list
//   node scripts/silent-watcher-guard.mjs --selftest
// =============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// A loop that makes a network call or reads external state is a WATCHER. A loop
// over local files is not, and gating it would be noise.
const NETWORKY = /\bcurl\b|\bwget\b|\bgh\s+(api|run|pr|issue)\b|\bnc\s|\bfetch\(|\bssh\b|\bdig\b|\bping\b/;
const LOOP_START = /^\s*(while\s|until\s|for\s+\w+\s+in\s)/;
// A bound: a deadline comparison, a bounded counter, or a terminal break.
const BOUND = /deadline|\bseq\s+\d|\btimeout\b|-(ge|gt)\s+"?\$?\{?\w+|\bbreak\b|--max-time/;
// INHERENTLY bounded iteration — walking a finite list or reading a stream to
// EOF. These are not polls at all, and flagging them was this guard's own first
// defect: two of its three initial hits (auto-merge's `for n in "${prs[@]}"`,
// pr-janitor's `while IFS= read`) were correct code. A noisy gate gets switched
// off, and a switched-off gate protects nothing.
const FINITE = /^\s*for\s+\w+\s+in\s+"?\$\{?\w+\[[@*]\]|^\s*while\s+(IFS=\S*\s+)?read\b/;
// A loud end: a non-zero exit, a failure written somewhere a human reads.
const LOUD = /exit\s+[1-9]|exit\s+\$\{?[A-Za-z_]|>&2|GITHUB_STEP_SUMMARY|::error|FAIL|UNREACHABLE|could not|did NOT|incident/i;

/** Collect indented loop bodies plus a short tail, so `exit 1` just after counts. */
export function loopBlocks(src) {
  const lines = src.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!LOOP_START.test(lines[i])) continue;
    if (/^\s*#/.test(lines[i])) continue;
    // Body runs to `done`, at any nesting; then take 6 trailing lines.
    let depth = 0, end = i;
    for (let j = i; j < lines.length && j < i + 200; j += 1) {
      if (LOOP_START.test(lines[j]) && !/^\s*#/.test(lines[j])) depth += 1;
      if (/^\s*done\b/.test(lines[j])) { depth -= 1; if (depth <= 0) { end = j; break; } }
      end = j;
    }
    const body = lines.slice(i, Math.min(end + 7, lines.length)).join('\n');
    blocks.push({ line: i + 1, body });
  }
  return blocks;
}

/** A watcher block is defective when it polls the network with no bound or no loud end. */
export function inspect(src, file = 'input') {
  const problems = [];
  for (const b of loopBlocks(src)) {
    // Comment lines describe; they do not execute. Judge the code only.
    const code = b.body.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    if (!NETWORKY.test(code)) continue;
    if (FINITE.test(b.body.split('\n')[0])) continue; // walks a finite list, not a poll
    const missing = [];
    if (!BOUND.test(code)) missing.push('a BOUND (deadline, bounded counter, or terminal break)');
    if (!LOUD.test(code)) missing.push('a LOUD END (non-zero exit, or a failure written to stderr/step-summary)');
    if (missing.length) problems.push({ file, line: b.line, missing });
  }
  return problems;
}

function walk(dir, out = [], depth = 0) {
  if (!existsSync(dir) || depth > 4) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.git') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out, depth + 1);
    else if (/\.(ya?ml|sh)$/.test(e)) out.push(p);
  }
  return out;
}

async function selftest() {
  let failures = 0;
  const check = (n, pass, d) => { if (!pass) failures += 1; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

  // The exact loop I shipped: polls, sleeps, falls out with a bare echo.
  const mine = `
for i in $(seq 1 40); do
  OUT=$(curl -sS "https://api.github.com/x" 2>/dev/null) || { sleep 30; continue; }
  echo "$OUT" | grep -q done && exit 0
  sleep 30
done
echo "TIMEOUT waiting for CI"
`;
  const a = inspect(mine, 'mine');
  check('the silent watcher I actually wrote is caught', a.length === 1, JSON.stringify(a[0]?.missing));
  check('...and it is the LOUD END that is missing', !!a[0]?.missing.some((m) => m.includes('LOUD')));

  // The repo's hardened shape: bounded deadline, explicit failure exit.
  const good = `
start=$(date +%s); deadline=$(( start + 900 ))
while :; do
  ctype=$(curl -sS --max-time 20 "$url" || echo unreachable)
  case "$ctype" in *javascript*) break ;; esac
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "domain did NOT serve within 15 minutes" | tee -a "$GITHUB_STEP_SUMMARY"
    exit 1
  fi
  sleep 10
done
`;
  check('a bounded loop with a loud failure passes', inspect(good, 'good').length === 0, JSON.stringify(inspect(good, 'good')));

  // An unbounded poll with no exit is the worst case and must be caught twice.
  const worst = 'while true; do curl -sS "$u"; sleep 5; done\n';
  const w = inspect(worst, 'worst');
  check('an unbounded silent poll is caught on both counts', w.length === 1 && w[0].missing.length === 2,
    JSON.stringify(w[0]?.missing));

  // A local loop is NOT a watcher — gating it would be noise, and a noisy gate
  // gets switched off (the lesson recorded on unbounded-select-guard).
  check('a local file loop is not flagged', inspect('for f in *.txt; do echo "$f"; done\n', 'local').length === 0);

  // This guard's OWN first defect: it flagged two correct files because walking
  // a finite list looked like an unbounded poll. Pinned so it cannot come back.
  const finiteArr = 'for n in "${prs[@]}"; do\n  gh pr merge --auto "$n"\ndone\n';
  check('walking a finite array is not a poll', inspect(finiteArr, 'arr').length === 0, JSON.stringify(inspect(finiteArr, 'arr')));
  const finiteRead = 'while IFS= read -r pr; do\n  gh api "x/$pr"\ndone <<<"$LIST"\n';
  check('reading a stream to EOF is not a poll', inspect(finiteRead, 'read').length === 0, JSON.stringify(inspect(finiteRead, 'read')));

  console.log(`\n${failures === 0 ? 'SELFTEST OK' : 'SELFTEST FAILED'} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const files = [...walk(join(ROOT, '.github/workflows')), ...walk(join(ROOT, 'scripts'))];
  const problems = [];
  for (const f of files) problems.push(...inspect(readFileSync(f, 'utf8'), relative(ROOT, f)));

  console.log(`silent-watcher-guard: ${files.length} workflow/shell files scanned.`);
  if (process.argv.includes('--list')) {
    for (const p of problems) console.log(`${p.file}:${p.line} — missing ${p.missing.join(' AND ')}`);
    return process.exit(0);
  }
  if (!problems.length) {
    console.log('OK — every network poll carries a bound and a loud end.');
    return process.exit(0);
  }
  console.error('\nsilent-watcher-guard: FAIL —');
  for (const p of problems) {
    console.error(`  ${p.file}:${p.line}\n     missing ${p.missing.join('\n     missing ')}`);
  }
  console.error('\nA watcher that cannot say "I could not observe" reports silence as health.');
  console.error('Unknown is a third state and never reads as healthy (DR-0076, DR-0125, DR-0310).');
  return process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('silent-watcher-guard.mjs')) main();
