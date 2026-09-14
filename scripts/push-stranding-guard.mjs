#!/usr/bin/env node
// =============================================================================
// push-stranding-guard — THE VERIFY WINDOW IS A RACE, AND IT WAS LOST TWICE
// =============================================================================
// 2026-09-14, after the same accident twice inside one evening.
//
// WHAT ACTUALLY HAPPENED, MEASURED RATHER THAN RECALLED. `npm run verify` takes
// about four minutes (971 files, 14,595 tests). The delivery lane (DR-0103)
// squash-merges any agent PR the instant its gates pass, with no human in the
// path — which is the point of it, and is good. Those two facts collide:
//
//   23:38  verify starts on a branch based on main@ce533569
//   23:42  the lane squash-merges #1566 -> main@2066e992
//   23:58  verify finishes green; the commit is pushed
//
// A SQUASH MERGE CREATES A NEW COMMIT THAT DOES NOT CONTAIN THE BRANCH'S OWN
// COMMITS AS ANCESTORS. So at 23:58 the branch's earlier commits were still
// sitting there as distinct objects whose CONTENT was already in main under a
// different sha, and the freshly-verified commit landed on history main no
// longer had. THE PUSH SUCCEEDED — that is what makes this nasty. Nothing
// failed, nothing was printed, and the damage surfaced later as a PR carrying
// already-merged commits and an INDEX.md conflict. Two full recovery cycles.
//
// TWO CHECKS WERE TRIED. THE FIRST ONE WAS BLIND, AND SAYING SO IS THE POINT.
//
//   REJECTED — `git cherry origin/main HEAD`, on the theory that a commit whose
//   change is already upstream gets marked `-`. Run against the REAL 2026-09-14
//   shape (branch at 60f627a7, main at 2066e992) it printed SIX `+` and not one
//   `-`. It cannot work by construction: `git cherry` matches by patch-id, one
//   commit to one commit, and a SQUASH folds many commits into a single new
//   patch that matches none of them. It would have passed silently on the exact
//   accident it was written for. A gate that cannot catch its own founding
//   incident is theater (DR-0076 §3), so it was deleted rather than shipped.
//
//   SHIPPED — STAMP THE BASE, THEN RE-READ IT. The failure is not a property of
//   the branch's shape at all; it is a property of TIME. So record what
//   origin/main was when verification STARTED, and compare against what it is
//   when the push is about to happen. If the base moved in between, the green
//   that was just earned was earned against a tree that no longer exists.
//   Deterministic, squash-proof, merge-proof, rebase-proof — it never inspects
//   commits, only the base under them.
//
// WHY THIS IS NOT "IS THE BRANCH BEHIND". Being behind main is the normal,
// harmless state of nearly every feature branch nearly all the time, and a
// guard that cries on the normal case is ignored within a day — which is worse
// than no guard, because it looks like coverage. This fires ONLY when the base
// moved DURING the verify window, which is the measured failure and nothing
// else.
//
// WHY NOT IN CI. CI runs AFTER the push, so a CI gate cannot catch this by
// construction — by the time CI has an opinion, the stranded push already
// happened. This belongs in the seconds between "verify went green" and "git
// push", which is what `npm run ship` is for: stamp, verify, check, push.
//
// UNKNOWN IS NOT GREEN (DR-0076 §8). No stamp, no origin, or no network exits
// 2 and says the base was NOT verified, rather than printing a reassuring line.
//
// Pure core (`analyzeBaseDrift`) + a thin git shell, so the decision is unit-
// tested without a repository. Proven-to-catch in BOTH directions by
// src/__tests__/push-stranding-guard.test.js: it must FIRE on the real
// ce533569 -> 2066e992 drift, and STAY SILENT when the base held still.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const STAMP_PATH = join(HERE, '..', '.git', 'push-stranding-stamp.json');

/**
 * The whole decision, as a pure function. No git, no disk.
 *
 * @param {object} deps
 * @param {?object} deps.stamp    what was recorded when verification started,
 *                                `{upstream, sha, at}` — or null if never stamped.
 * @param {?string} deps.nowSha   what origin/<base> is RIGHT NOW, or null if unknown.
 * @param {string} [deps.upstream]
 * @returns {{ok: boolean, unknown: boolean, drifted: boolean, from: ?string, to: ?string, reason: string}}
 */
export function analyzeBaseDrift({ stamp, nowSha, upstream = 'origin/main' } = {}) {
  const fail = (reason, extra = {}) => ({
    ok: false, unknown: false, drifted: false, from: null, to: null, reason, ...extra,
  });

  if (!stamp || typeof stamp !== 'object' || !stamp.sha) {
    return fail(
      `no base stamp found — verification was not started through \`npm run ship\`, so the base it ran against is UNKNOWN.`,
      { unknown: true },
    );
  }
  if (!nowSha) {
    return fail(`could not read ${upstream} now, so base drift is UNKNOWN.`, { unknown: true });
  }
  if (stamp.upstream && stamp.upstream !== upstream) {
    return fail(
      `the stamp was taken against ${stamp.upstream} but this check is against ${upstream} — the two are not comparable.`,
      { unknown: true },
    );
  }
  if (stamp.sha !== nowSha) {
    return {
      ok: false,
      unknown: false,
      drifted: true,
      from: stamp.sha,
      to: nowSha,
      reason: [
        `${upstream} MOVED while this branch was being verified:`,
        `    verification started against  ${stamp.sha}`,
        `    ${upstream} is now              ${nowSha}`,
        '',
        'The green just earned was earned against a base that no longer exists.',
        'Pushing now puts verified work on history the base no longer has —',
        'which is exactly how #1565 and #1566 stranded a commit on 2026-09-13.',
      ].join('\n'),
    };
  }
  return {
    ok: true,
    unknown: false,
    drifted: false,
    from: stamp.sha,
    to: nowSha,
    reason: `${upstream} held still at ${String(nowSha).slice(0, 8)} for the whole verify window.`,
  };
}

/** The remedy, printed rather than performed — restarting a branch is the user's call. */
export function remedy(branch, upstream = 'origin/main') {
  const base = String(upstream).replace(/^origin\//, '');
  return [
    `  git fetch origin ${base}`,
    `  git checkout -B ${branch} ${upstream}`,
    '  git cherry-pick <each unmerged commit, oldest first>',
    '  npm run ship   # the replayed tree is a DIFFERENT tree; the old green does not carry over',
  ].join('\n');
}

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

export function readUpstreamSha({ cwd = process.cwd(), upstream = 'origin/main' } = {}) {
  const base = String(upstream).replace(/^origin\//, '');
  git(['fetch', 'origin', base], cwd);
  return git(['rev-parse', `origin/${base}`], cwd);
}

export function writeStamp(sha, upstream, path = STAMP_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ upstream, sha, at: new Date().toISOString() }, null, 2));
}

export function readStamp(path = STAMP_PATH) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const mode = process.argv.includes('--stamp') ? 'stamp' : 'check';
  const upstream = process.argv.find((a) => a.startsWith('origin/')) || 'origin/main';

  if (mode === 'stamp') {
    try {
      const sha = readUpstreamSha({ upstream });
      writeStamp(sha, upstream);
      console.log(`push-stranding-guard: base stamped — ${upstream} at ${sha.slice(0, 8)}.`);
    } catch (err) {
      console.error(`push-stranding-guard: COULD NOT STAMP — ${err.message.split('\n')[0]}`);
      process.exit(2);
    }
  } else {
    let nowSha = null;
    try { nowSha = readUpstreamSha({ upstream }); } catch { /* stays null -> UNKNOWN */ }
    const result = analyzeBaseDrift({ stamp: readStamp(), nowSha, upstream });
    if (result.ok) {
      console.log(`push-stranding-guard: ${result.reason}`);
    } else if (result.unknown) {
      console.error(`push-stranding-guard: BASE NOT VERIFIED — ${result.reason}`);
      console.error('Do not read this as "safe to push".');
      process.exit(2);
    } else {
      let branch = 'your-branch';
      try { branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], process.cwd()); } catch { /* label only */ }
      console.error('push-stranding-guard: THE BASE MOVED WHILE THIS BRANCH WAS VERIFIED\n');
      console.error(result.reason);
      console.error('\nRestart the branch and replay:\n');
      console.error(remedy(branch, upstream));
      process.exit(1);
    }
  }
}
