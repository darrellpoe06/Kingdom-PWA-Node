// =============================================================================
// A tailnet join step is not a witness of the join (2026-10-29, DR-1284)
// =============================================================================
// MEASURED tonight, twice, on two different workflows:
//
//   db-migrate run 40795511412 — the action printed `backend error: invalid
//   key: ... not valid` on five attempts and `Tailscale up failed. Retrying in
//   25 seconds...`, and its own step closed
//   `outcome=success; conclusion=success`. The next step then failed with
//   `ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is
//   unreachable` — an error that reads like a dead NAS and was a dead key.
//
//   inbox-lessons-waiting run 40799538255 — step conclusions read
//   `Join the tailnet (to reach the live database)` SUCCESS and
//   `List the waiting lesson rows` FAILURE. The road was shut and the
//   conclusions said it was open.
//
// So `tailscale/github-action` succeeding as a STEP says nothing about whether
// the runner is on the tailnet. 64 workflows in this repository join it and
// only 16 ever asked. The remaining ones report a misleading step conclusion
// and surface the real fault further down, which is how an outage gets
// diagnosed as the wrong thing — DR-0076 §8, one layer below where it usually
// bites: not an unmeasured claim, a MIS-measured one.
//
// `nas-health.yml` has had the right idiom since it was written: a separate
// step running `tailscale status --peers=false` and exiting 1 with the reason.
// This gate does not invent anything; it spreads what one lane already knew.
//
// WHY THE DEBT IS PINNED RATHER THAN SWEPT. Adding a verify to 44 workflows is
// 44 judgment calls about what each should do when the road is shut, and
// several are deploy-adjacent (DR-0107: never change that lane without proving
// the site still deploys). So the four lanes carrying DARRELL'S OWN LESSON
// INTAKE are fixed here and named, and the rest is frozen as shrink-only debt
// the way `the-third-pile-is-a-worklist` freezes the honesty gap. The number
// may fall; it may never rise.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(__dirname, '..', '..', '..', '.github', 'workflows');

// Shrink-only. A joiner that neither verifies nor declares a second road.
// 2026-10-29: 64 joiners, 16 verify, 4 carry a second road, 44 left.
// LOWERED TO 43 the same night, by DR-1286: `cf-roads-worker.yml`'s join gained
// `continue-on-error` when the Worker deploy got a second road to the anon key,
// so it moved from this debt into the exempt set below. The number fell because
// a lane got a second road, which is the only honest way for it to fall — not
// because the pin was relaxed to make a run green. It may fall again; it may
// never rise.
// LOWERED TO 42 on 2026-11-02 by DR-1298: `camera-health.yml` gained the verify
// step. The bite was taken early, ahead of this pin's own re-review date,
// because that lane was measured doing something worse than this note knew. The
// harm written above is that a shut road "surfaces the real fault further
// down" -- late, but true. camera-health published a DIFFERENT fault: run
// 41456015879 wrote `the forwarder on the NAS did not answer /health` onto the
// family's rolling camera ledger (#2011) with the fix-now `priority:cameras`
// label, while the forwarder had never been asked and the real fault was the
// revoked key. So the debt has two tiers, and the ones that write an incident
// issue from inside the unverified set are the loud tier. 14 lanes join the
// tailnet without verifying AND write to an issue; camera-health was one, 13
// remain, and they are the order the next bites should be taken in.
// re-review: 2026-11-29 — next bite from the 13 issue-writing lanes first,
// then the quiet ones, deploy-adjacent lanes last.
// LOWERED TO 41 on 2026-11-03 by DR-1302: `public-shelf-witness.yml` gained
// the verify step, and the bite was taken early for the same reason -- that
// lane was MEASURED doing worse than this note knew. Six consecutive runs
// (2026-10-28 to 11-02) filed the bolded "the public shelf disagrees with what
// the doors are called" onto the `incident`-labelled ledger #2127 while
// neither reading had been taken: the database was unreachable and `Read the
// shelf in a real browser` was SKIPPED on all six.
//
// AND THE "LOUD TIER" COUNT ABOVE IS CORRECTED, because it was a proxy. The
// predicate "joins without verifying AND writes to an issue" measured 15 lanes
// on 2026-11-03, not 13 -- but only THREE of them write when the road is shut
// (an issue-writing step carrying `if: always()` / `failure()`), and of those
// three only ONE published a cause it had not measured:
//   - public-shelf-witness.yml  -- six false findings. FIXED HERE.
//   - public-shelf-anon-probe.yml -- honest: `anon probe: <job.status>` plus
//     "no browser reading" on a rolling run log, and no timer at all
//     (workflow_dispatch / probe/** only), so it cannot do this daily.
//   - openclaw-tower.yml -- honest already: it passes `reachable` explicitly,
//     derives `modelPresent: null` when unreachable (DR-1186), sets an
//     explicit `reason`, and reds separately at the key.
// So the real worklist is smaller and sharper than "13 loud lanes": the
// question is not whether a lane writes to an issue, it is whether a lane
// NAMES A CAUSE IT DID NOT MEASURE.
//
// AND THE LOUD TIER IS NOW CLOSED, measured over all 41 in the same session
// rather than left as a dated promise. Sharpened predicate -- writes to an
// issue on a step that runs when the road is shut -- over every remaining
// debt lane: TWO hits, `openclaw-tower.yml` and `public-shelf-anon-probe.yml`,
// both read and both honest (see the table in DR-1302). **No lane remains
// that can publish a cause it did not measure onto a ledger.** The count went
// 13 -> 15 -> 1 -> 0 as the predicate got sharper, which is why the predicate
// mattered more than the number.
//
// WHAT IS STILL OWED, and it is the debt below, not a scary tier: the other 39
// carry DR-1284's ORIGINAL harm -- they fail confusingly and surface the real
// fault further down. That is real and it is what this pin tracks. The sweep
// above covered steps that write to an ISSUE; a lane that prints a wrong cause
// into a step summary, a `::notice` or an Actions log is NOT covered, because
// that is not a surface a reader later trusts as a finding. If that turns out
// to matter it is a new measurement, not something DR-1302 settled.
const UNVERIFIED = 41;

// The four that carry his spoken and in-app lessons. Named, not counted: if
// one of these loses its verify the gate must say WHICH, because a silent
// failure here is a teaching he spoke that nobody read.
const INTAKE_LANES = [
  'inbox-lessons-waiting.yml',
  'inbox-lesson-body.yml',
  'lesson-inbox-bell.yml',
  'lessons-sync.yml',
];

const read = (fn) => readFileSync(join(DIR, fn), 'utf8');
const workflows = readdirSync(DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).sort();

const classify = () => {
  const joiners = [];
  const verified = [];
  const secondRoad = [];
  const unverified = [];
  for (const fn of workflows) {
    const s = read(fn);
    if (!s.includes('tailscale/github-action')) continue;
    joiners.push(fn);
    const asks = s.includes('tailscale status') || s.includes('Verify the tailnet');
    // A join declared `continue-on-error` is one the workflow expects to fail
    // and has another way round (DR-1269's served-site road is the pattern).
    const i = s.indexOf('tailscale/github-action');
    const near = s.slice(Math.max(0, i - 500), i + 300);
    if (asks) verified.push(fn);
    else if (near.includes('continue-on-error')) secondRoad.push(fn);
    else unverified.push(fn);
  }
  return { joiners, verified, secondRoad, unverified };
};

describe('every lane that joins the tailnet either asks whether it worked, or has another road', () => {
  it('the debt is shrink-only, and it is measured rather than remembered', () => {
    const { joiners, verified, secondRoad, unverified } = classify();
    // Anti-vacuity: the sweep must be looking at the real fleet (DR-0076 §3).
    expect(joiners.length, 'the sweep found almost no joiners — it is measuring nothing').toBeGreaterThan(50);
    expect(verified.length + secondRoad.length + unverified.length).toBe(joiners.length);
    // PINNED EXACTLY, not as a ceiling. Measured 2026-10-29: written first as
    // `toBeLessThanOrEqual(UNVERIFIED)`, and its own proven-to-catch run showed
    // that raising the pin from 43 back to 44 left the suite GREEN — so the
    // "may never rise" half of a shrink-only pin was unenforceable, and the
    // slack would have let the debt creep back a lane at a time with nothing
    // red. An exact pin catches all three directions: a new unverified lane, a
    // pin raised without reality moving, and a lane fixed without the pin
    // lowered (which is a one-line edit with a reason, as it should be).
    expect(
      unverified.length,
      `unverified tailnet joins are ${unverified.length} but the pin says ${UNVERIFIED}. `
      + 'If a lane now verifies its join, LOWER the pin to '
      + `${unverified.length} and say why. If a lane stopped verifying, fix the lane — `
      + 'this number may fall and may never rise. Current: '
      + unverified.join(', '),
    ).toBe(UNVERIFIED);
  });

  it('PROVEN TO CATCH: each lane carrying his lesson intake verifies its join and says so in the ledger', () => {
    for (const fn of INTAKE_LANES) {
      const s = read(fn);
      expect(s, `${fn}: joins the tailnet and never asks whether it worked`).toMatch(/tailscale status/);
      expect(s, `${fn}: a shut road must reach the fleet's rolling entry (DR-1283)`)
        .toContain('scripts/tailnet-key-incident.mjs');
      // The escalation can never be what fails the lane.
      expect(s, `${fn}: the escalation must not be able to fail the lane`).toMatch(/tailnet-key-incident\.mjs[\s\S]*?\|\| true/);
    }
  });

  it('a verify step is a brake, not a log line: it exits non-zero on a shut road', () => {
    for (const fn of INTAKE_LANES) {
      const s = read(fn);
      const step = s.slice(s.indexOf('Verify the tailnet actually joined'));
      const body = step.slice(0, step.indexOf('\n      - name:') === -1 ? 1200 : step.indexOf('\n      - name:'));
      expect(body, `${fn}: the verify step must fail the run`).toMatch(/exit 1/);
      expect(body, `${fn}: the verify step must name the real cause`).toMatch(/TS_AUTHKEY/);
    }
  });

  it('the four exempt lanes are exempt for a stated reason, not by accident', () => {
    const { secondRoad } = classify();
    // Each of these declares `continue-on-error` on the join because it has
    // another way to the same value or reports DEGRADED rather than dying.
    // Listed so that a lane quietly joining this set is visible in a diff.
    expect(secondRoad.sort()).toEqual([
      // DR-1286: the Worker deploy's join may fail because the anon key has a
      // second road (the served site ships that public key). This list caught
      // it joining the set, on its first CI run after the change and before a
      // reader could have noticed — which is exactly what naming the lanes
      // instead of counting them is for.
      'cf-roads-worker.yml',
      'deploy-cloudflare-pages.yml',
      'harvest-health.yml',
      'loops-health.yml',
      'ops-queue-health.yml',
    ]);
  });
});
