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
// re-review: 2026-11-29 — take the next bite, deploy-adjacent lanes last.
const UNVERIFIED = 44;

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
    expect(
      unverified.length,
      `unverified tailnet joins rose to ${unverified.length} (pinned ${UNVERIFIED}). `
      + 'A new lane must verify its own join; this number may fall and may never rise. New: '
      + unverified.join(', '),
    ).toBeLessThanOrEqual(UNVERIFIED);
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
      'deploy-cloudflare-pages.yml',
      'harvest-health.yml',
      'loops-health.yml',
      'ops-queue-health.yml',
    ]);
  });
});
