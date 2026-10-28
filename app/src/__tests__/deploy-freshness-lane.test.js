// =============================================================================
// A merge always reaches the site — the deploy-heal lane, gated
// =============================================================================
// THE MISS (2026-09-17, measured on the merge of PR #1648; DR-0458). A
// GITHUB_TOKEN merge fires no push workflows, so auto-merge.yml polls for main
// to advance and dispatches the deploy itself. That poll ran 18:07:53 ->
// 18:20:48 and gave up. The merge landed at 18:21:12 — TWENTY-FOUR SECONDS
// later. No deploy fired for main's tip, and the outer net (this workflow's
// cron) got three fires that whole day: 05:29, 10:19, 15:05. The site would
// have served a stale build for hours; it was dispatched by hand (run #1155).
//
// Every earlier fix of this class raised the poll: 2 -> 6 -> 12 minutes. This
// one adds no number. `workflow_run` on Auto-merge completing fires the
// freshness check at the exact moment the old poll stops watching.
//
// These properties read the REAL workflow files, so deleting the fix fails the
// build rather than quietly re-opening a gap whose only symptom is a stale site.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (name) => readFileSync(join(ROOT, '.github', 'workflows', name), 'utf8');
const FRESH = read('deploy-freshness.yml');
const AUTOMERGE = read('auto-merge.yml');

/** A workflow's declared `name:`, which is the string a workflow_run trigger
 *  must match — GitHub matches on the NAME, not the filename. */
const workflowName = (src) => {
  const m = src.match(/^name:\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

describe('deploy-freshness hears the merge, not a timer', () => {
  it('fires on Auto-merge completing', () => {
    expect(FRESH).toMatch(/workflow_run:/);
    const at = FRESH.indexOf('workflow_run:');
    const block = FRESH.slice(at, at + 200);
    expect(block).toMatch(/workflows:\s*\[/);
    expect(block).toMatch(/types:\s*\[completed\]/);
  });

  it('names the upstream workflow EXACTLY as that workflow names itself', () => {
    // THE CHECK THAT EARNS ITS KEEP. A workflow_run trigger matches on the
    // upstream workflow's `name:`, so renaming Auto-merge — a one-word edit in
    // a different file — silently unhooks this healer, and the only symptom is
    // a stale site hours later. Read both files and compare.
    const upstream = workflowName(AUTOMERGE);
    expect(upstream).toBeTruthy();
    const at = FRESH.indexOf('workflow_run:');
    const block = FRESH.slice(at, at + 200);
    expect(block, `deploy-freshness must list "${upstream}"`).toContain(`"${upstream}"`);
  });

  it('also hears CI completing, named EXACTLY as ci.yml names itself (DR-1012)', () => {
    // THE TENTH MISS (2026-10-14, #2161). The sweep a bot-opened PR starts
    // never runs (`action_required`, 0 jobs; measured live on #2162's own
    // sweep), so it never completes, so the Auto-merge hook above never fires
    // for a single-push PR. CI's run on the branch is started by a person's
    // push and completes normally; native auto-merge squashes within seconds
    // of it going green. Same rename hazard as above, so the name is read.
    const ci = workflowName(read('ci.yml'));
    expect(ci).toBeTruthy();
    const at = FRESH.indexOf('workflow_run:');
    const block = FRESH.slice(at, at + 200);
    expect(block, `deploy-freshness must list "${ci}"`).toContain(`"${ci}"`);
    expect(block).toMatch(/workflows:\s*\["Auto-merge", "CI"\]/);
  });

  it('keeps the cron and the manual dispatch — the hook is ADDITIVE', () => {
    // The event hook is a claim about GitHub's behaviour until a real merge
    // proves it. Removing either older net would make being wrong cost the
    // site, so both stay.
    expect(FRESH).toMatch(/schedule:/);
    expect(FRESH).toMatch(/cron: '\*\/5 \* \* \* \*'/);
    expect(FRESH).toMatch(/workflow_dispatch: \{\}/);
  });

  it('looks SEVERAL times on an event fire and ONCE on a timer fire', () => {
    // A single look on the event fire would have missed PR #1648 by 24
    // seconds — main had not moved yet when auto-merge's run ended.
    expect(FRESH).toMatch(/WATCH_TRIES:/);
    const m = FRESH.match(/WATCH_TRIES:\s*\$\{\{\s*github\.event_name == 'workflow_run' && '(\d+)' \|\| '(\d+)'\s*\}\}/);
    expect(m, 'WATCH_TRIES must branch on the event name').toBeTruthy();
    expect(Number(m[1]), 'event fire looks more than once').toBeGreaterThan(1);
    expect(Number(m[2]), 'timer fire looks exactly once').toBe(1);
  });

  it('is bounded: a ceiling on looks and a gap, never an open wait', () => {
    expect(FRESH).toMatch(/WATCH_GAP: '(\d+)'/);
    const tries = Number(FRESH.match(/&& '(\d+)' \|\|/)[1]);
    const gap = Number(FRESH.match(/WATCH_GAP: '(\d+)'/)[1]);
    expect(tries * gap, 'the whole watch must stay inside ~5 minutes').toBeLessThanOrEqual(300);
  });

  it('stops at the FIRST dispatch — never two deploys for one merge', () => {
    expect(FRESH).toMatch(/dispatched on look \$i; done\./);
    const at = FRESH.indexOf('dispatched on look');
    expect(FRESH.slice(at, at + 120)).toMatch(/exit 0/);
  });

  it('does NOT dispatch when a deploy run already exists for main\u2019s exact tip', () => {
    // MEASURED on the merge of PR #1650 — the same merge that proved the hook
    // works. This workflow compares against the last SUCCESSFUL deploy, so
    // while auto-merge's own heal had a deploy RUNNING on the new tip the last
    // success was still the previous tip: it read STALE and dispatched a second
    // build (#1157 and #1158, both on 003aaf22, both green). Two Cloudflare
    // Pages builds for one merge, and it would have happened on every merge.
    expect(FRESH).toMatch(/runs\?head_sha=\$main_sha/);
    expect(FRESH).toMatch(/ALREADY IN FLIGHT/);
  });

  // NARROWED 2026-10-28 (DR-1267 / DR-1271). This case used to assert the
  // OPPOSITE -- that the in-flight query must not filter by status, so a run of
  // ANY status counted, failed included. That was right for a build that failed
  // on its own merits and wrong for one killed by a transient cause: on
  // 2026-10-28 a refused Tailscale key (DR-1269) left seven failed deploys on
  // the tip, and this healer read ALREADY IN FLIGHT off those corpses and
  // reported SUCCESS while the site sat five commits behind for two hours.
  it('counts queued, running and successful runs as in flight -- but NOT a failed one', () => {
    expect(FRESH).toMatch(/select\(\.status != "completed" or \.conclusion == "success"\)/);
    expect(FRESH).toMatch(/ALREADY IN FLIGHT: a queued, running or successful deploy exists/);
    expect(FRESH).toMatch(/runs\?status=success/);
  });

  it('still cannot produce two builds for one merge -- the #1157/#1158 hazard', () => {
    // The incident that put the gate here was a RUNNING deploy, not a failed
    // one, and a running deploy is still in flight. The filter keeps anything
    // whose status is not yet completed, so a queued or in-progress run for
    // main's tip blocks the dispatch exactly as before.
    const at = FRESH.indexOf('select(.status != "completed"');
    expect(at, 'the in-flight filter must exist').toBeGreaterThan(0);
    const block = FRESH.slice(at, at + 160);
    expect(block).toMatch(/length/);
    expect(FRESH).toMatch(/#1157/);
  });

  it('a failed tip is retried at most once per window, so a broken build cannot loop', () => {
    expect(FRESH).toMatch(/RETRY_AFTER_MIN: '(\d+)'/);
    const mins = Number(FRESH.match(/RETRY_AFTER_MIN: '(\d+)'/)[1]);
    expect(mins).toBeGreaterThanOrEqual(15);
    expect(FRESH).toMatch(/FAILED BUT RECENT/);
    expect(FRESH).toMatch(/waiting out the \$\{RETRY_AFTER_MIN\}m retry window|RETRY_AFTER_MIN\}m retry window/);
    // the retry path must announce itself, so a log reader can see WHY a
    // second build exists for one tip
    expect(FRESH).toMatch(/RETRYING A FAILED TIP/);
  });

  it('treats already-handled as DONE, never as something to keep waiting on', () => {
    // Three outcomes, three codes: dispatched, already in flight, and
    // fresh-or-unresolved. Only the last one keeps looking, because only that
    // one can still change within the watch.
    expect(FRESH).toMatch(/return 2/);
    expect(FRESH).toMatch(/already handled on look \$i; done\./);
    const at = FRESH.indexOf('already handled on look');
    expect(FRESH.slice(at, at + 120)).toMatch(/exit 0/);
  });

  it('reads the return code explicitly, so a non-zero code is never a job failure', () => {
    // `set -euo pipefail` is on: calling check_once bare and letting it return
    // 1 or 2 would abort the job. The codes are captured around a `set +e`.
    expect(FRESH).toMatch(/set \+e\n\s+check_once\n\s+rc=\$\?\n\s+set -e/);
  });

  it('still compares main against the last SUCCESSFUL deploy, and dispatches on main', () => {
    expect(FRESH).toMatch(/deploy-cloudflare-pages\.yml\/runs\?status=success/);
    expect(FRESH).toMatch(/gh workflow run deploy-cloudflare-pages\.yml --repo "\$REPO" --ref main/);
  });

  it('keeps its three brakes: budget, lock and kill-switch', () => {
    expect(FRESH).toMatch(/concurrency:/);
    expect(FRESH).toMatch(/group: deploy-freshness/);
    expect(FRESH).toMatch(/cancel-in-progress: false/);
    expect(FRESH).toMatch(/vars\.DEPLOY_FRESHNESS_ENABLED != 'false'/);
  });

  it("auto-merge's own dispatch is NOT removed by this change", () => {
    // Belt and braces on the uptime path. The new hook is a second net, not a
    // replacement for the one that works most of the time.
    expect(AUTOMERGE).toMatch(/^ {2}heal-deploy:/m);
    expect(AUTOMERGE).toMatch(/gh workflow run deploy-cloudflare-pages\.yml/);
  });
});

// THE FILTER IS EXERCISED, NOT JUST QUOTED (DR-0076 section 3). Every other case
// in this file asserts the workflow's TEXT, which proves the words are present
// and nothing about what they do. These run the filter LIFTED FROM THE FILE
// against the payload shapes GitHub actually returns, so an edit that keeps the
// words and breaks the behaviour fails here.
describe('the in-flight filter, run against real payload shapes', () => {
  const FILTER = '[.workflow_runs[] | select(.status != "completed" or .conclusion == "success")] | length';

  it('is the filter the workflow actually carries', () => {
    expect(FRESH).toContain(FILTER);
  });

  const live = (runs) => {
    const r = spawnSync('jq', [FILTER], { input: JSON.stringify({ workflow_runs: runs }), encoding: 'utf8' });
    // jq is pre-installed on the GitHub-hosted runners and gh carries its own.
    // If it were missing this must FAIL rather than skip, because a skipped
    // behaviour check reads as a passing one.
    expect(r.error, 'jq must be available to exercise the filter').toBeUndefined();
    expect(r.status, r.stderr).toBe(0);
    return Number(r.stdout.trim());
  };

  const done = (conclusion) => ({ status: 'completed', conclusion });
  const running = (status) => ({ status, conclusion: null });

  it('ALL FAILED is not in flight -- the outage, and the whole point of the change', () => {
    expect(live([done('failure'), done('failure')])).toBe(0);
  });

  it('a cancelled-only tip is not in flight either', () => {
    expect(live([done('cancelled')])).toBe(0);
  });

  it('a tip with no runs at all is not in flight', () => {
    expect(live([])).toBe(0);
  });

  it('QUEUED is in flight -- the #1157/#1158 double-build hazard stays closed', () => {
    expect(live([running('queued')])).toBe(1);
  });

  it('IN_PROGRESS is in flight', () => {
    expect(live([running('in_progress')])).toBe(1);
  });

  it('SUCCESS is in flight, so a deployed tip is never redeployed', () => {
    expect(live([done('success')])).toBe(1);
  });

  it('a failed run beside a running one is still in flight', () => {
    expect(live([done('failure'), running('in_progress')])).toBe(1);
  });
});
