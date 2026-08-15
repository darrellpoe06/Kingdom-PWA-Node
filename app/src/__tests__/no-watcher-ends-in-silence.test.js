// @vitest-environment node
// =============================================================================
// A watcher may never end in silence
// =============================================================================
// 2026-08-15. This one is about a defect in our own tooling, not the app, and it
// is pinned here because the shape recurs and the app inherits it.
//
// I armed a watcher on PR #1255's CI. It polled 40 times against a channel it
// could not read — shell access to the GitHub API answers 403 in this session,
// "GitHub access is not enabled for this session" — and ended with a bare
// TIMEOUT line. For twenty minutes "no news" was indistinguishable from "CI is
// fine." The script had no path that says I COULD NOT OBSERVE.
//
// Same shape as DR-0303 (an instrument trusted for a property it never
// measured), DR-0305 (a gate whose claim outran its reach), DR-0125 (every
// safeguard watched the pipeline; none watched the product). The rule: a green
// check must mean something, and SO MUST A QUIET ONE. Unknown is a third state
// and never reads as healthy (DR-0076).
//
// The guard found one real defect on its first run: scripts/ship.sh polled for
// "lint + vitest ... pass", and when its ~5-minute budget ran out with the check
// reporting NEITHER pass nor fail, it fell straight through to `gh pr merge`.
// Branch protection would likely have refused, but the script's own logic
// treated unobserved as good enough to try merging. Fixed there, gated here.
//
// It also produced two FALSE positives on its first run — auto-merge's
// `for n in "${prs[@]}"` and pr-janitor's `while IFS= read`, both correct code
// walking a finite list. Those are pinned below too: a noisy gate gets switched
// off, and a switched-off gate protects nothing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { inspect } from '../../../scripts/silent-watcher-guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = (p) => readFileSync(join(here, '../../..', p), 'utf8');

describe('no watcher ends in silence', () => {
  it('catches the exact silent watcher that prompted this — poll, sleep, bare echo', () => {
    const mine = [
      'for i in $(seq 1 40); do',
      '  OUT=$(curl -sS "https://api.github.com/x" 2>/dev/null) || { sleep 30; continue; }',
      '  echo "$OUT" | grep -q done && exit 0',
      '  sleep 30',
      'done',
      'echo "TIMEOUT waiting for CI"',
    ].join('\n');
    const found = inspect(mine, 'mine');
    expect(found).toHaveLength(1);
    expect(found[0].missing.join(' ')).toMatch(/LOUD END/);
  });

  it('catches an unbounded silent poll on BOTH counts', () => {
    const worst = inspect('while true; do curl -sS "$u"; sleep 5; done\n', 'worst');
    expect(worst).toHaveLength(1);
    expect(worst[0].missing).toHaveLength(2);
  });

  it('passes a bounded poll that fails loudly — the repo’s own hardened shape', () => {
    const good = [
      'start=$(date +%s); deadline=$(( start + 900 ))',
      'while :; do',
      '  ctype=$(curl -sS --max-time 20 "$url" || echo unreachable)',
      '  case "$ctype" in *javascript*) break ;; esac',
      '  if [ "$(date +%s)" -ge "$deadline" ]; then',
      '    echo "domain did NOT serve within 15 minutes" | tee -a "$GITHUB_STEP_SUMMARY"',
      '    exit 1',
      '  fi',
      '  sleep 10',
      'done',
    ].join('\n');
    expect(inspect(good, 'good')).toEqual([]);
  });

  it('does NOT flag finite iteration — the guard’s own first false positives', () => {
    expect(inspect('for n in "${prs[@]}"; do\n  gh pr merge --auto "$n"\ndone\n', 'a')).toEqual([]);
    expect(inspect('while IFS= read -r pr; do\n  gh api "x/$pr"\ndone <<<"$L"\n', 'b')).toEqual([]);
    expect(inspect('for f in *.txt; do echo "$f"; done\n', 'c')).toEqual([]);
  });

  it('ship.sh refuses to merge on an UNOBSERVED CI result, not just a failed one', () => {
    const sh = repo('scripts/ship.sh');
    // The failure branch existed already; the unknown branch is the fix.
    expect(sh, 'must refuse when the check never reported pass').toMatch(/could NOT observe/);
    expect(sh, 'and must say plainly that unknown is not green').toMatch(/UNKNOWN, not green/);
    // The refusal must come BEFORE the merge, or it protects nothing.
    expect(sh.indexOf('could NOT observe')).toBeLessThan(sh.indexOf('gh pr merge'));
  });

  it('every network poll in the live repo carries a bound and a loud end', () => {
    const files = ['.github/workflows/deploy-cloudflare-pages.yml', '.github/workflows/site-health.yml',
      '.github/workflows/auto-merge.yml', '.github/workflows/pr-janitor.yml', 'scripts/ship.sh'];
    const problems = files.flatMap((f) => inspect(repo(f), f));
    expect(problems.map((p) => `${p.file}:${p.line} missing ${p.missing.join(' + ')}`)).toEqual([]);
  });
});
