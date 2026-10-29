// =============================================================================
// The second door opens without the key (2026-10-29, DR-1285)
// =============================================================================
// MEASURED. `cf-roads-worker.yml` is the only deployer of the poetech-roads
// Worker — DR-1068's second same-origin door, built because no Cloudflare Pages
// Function on poetech-app has been invoked since 2026-10-09, so `/sb`, `/cams`,
// `/nas-photos`, `/taxes` and every other NAS-backed road answer the SPA shell.
// DR-1067 put the Edge Guard on the same Worker at `/edge/*`.
//
// The route list has carried `poetech.us/edge/*` since 2026-10-15 (commit
// 4b4198ce6). The workflow has run SIX times since — 10-16, 10-17, 10-20,
// 10-21, 10-27 and tonight — and its deploy job read `skipped` on every one,
// because every dispatch took the default `deploy: no`. So the door DR-1068
// decided on was built, merged, and never opened; tonight's site-health probe
// measuring `/edge/whoami` at `200 text/html` instead of a JSON 401 is that
// fact seen from outside for the first time.
//
// AND THE DEPLOY COULD NOT HAVE RUN TONIGHT EVEN IF DISPATCHED. DR-1067 §3
// rides two Worker secrets on the deploy job, and `SB_ANON_KEY` was fetched
// from the NAS over the tailnet by a single road that exits 1 when the value is
// not a JWT. With the Tailscale key refused since 2026-10-28 that step was a
// hard stop — while DR-1269 had already built a SECOND road to that same
// public value the same day (the served site ships it inside the bundle) and
// wired it into the Pages deploy only.
//
// So this is not a new road. It is DR-1269's proven one, reused where it was
// missing, which is the opposite of the drift this house has paid for three
// times (DR-0621, DR-1151, DR-1152).
//
// WHAT IS PINNED, AND WHY EACH LINE. The NAS is asked FIRST because only it can
// speak a ROTATED key; the served site can only ever repeat what is already
// shipped. The join is `continue-on-error` because a step that may fail and has
// another road must not end the job — the same shape the Pages deploy carries,
// and the reason this lane is a legitimate exemption from DR-1284's
// verify-your-join rule. And the fail-loud stays: a value that is not a JWT
// must still stop the deploy, because arming the Edge Guard's gate with a
// non-key would ship a road that cannot answer (DR-0107).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repo = join(__dirname, '..', '..', '..');
const wf = readFileSync(join(repo, '.github', 'workflows', 'cf-roads-worker.yml'), 'utf8');
const anonStep = wf.slice(wf.indexOf('Fetch the sovereign anon key'), wf.indexOf('Put the Worker secrets'));

describe('the Worker deploy has two roads to the anon key, in the right order', () => {
  it('PROVEN TO CATCH: the served-site road is wired, so a refused tailnet key no longer stops the deploy', () => {
    expect(anonStep, 'the second road is missing — a refused key is a hard stop again')
      .toContain('scripts/served-anon-key.py');
    expect(existsSync(join(repo, 'scripts', 'served-anon-key.py')), 'the road it calls must exist').toBe(true);
    expect(anonStep).toMatch(/DR-1269/);
  });

  it('the NAS is asked FIRST, because only it can speak a rotated key', () => {
    const nas = anonStep.indexOf('poetech.tail5a2f35.ts.net');
    const served = anonStep.indexOf('served-anon-key.py');
    expect(nas).toBeGreaterThan(-1);
    expect(served).toBeGreaterThan(-1);
    expect(nas, 'the served site must be the FALLBACK, never the first ask').toBeLessThan(served);
  });

  it('PROVEN TO CATCH: a value that is neither road can produce still fails loud', () => {
    // The whole point of the original single road was that a non-JWT stops the
    // deploy. Adding a fallback must not soften that — a road that cannot
    // answer is worse than a road that is not there (DR-0107).
    const tail = anonStep.slice(anonStep.lastIndexOf('case "$KEY" in'));
    expect(tail).toMatch(/eyJ\*\.eyJ\*\.\*/);
    expect(tail).toMatch(/exit 1/);
    expect(tail, 'the failure must name BOTH roads, so a reader knows what was tried')
      .toMatch(/neither road/);
  });

  it('the join may fail, and says so, because another road exists', () => {
    const join_ = wf.slice(wf.indexOf('Join the tailnet (for the anon key)'), wf.indexOf('Fetch the sovereign anon key'));
    expect(join_, 'a join with a second road behind it must not end the job').toContain('continue-on-error: true');
  });

  it('the road taken is NAMED in the log and the summary, never left to be guessed', () => {
    // DR-0076 §8: which road answered is a fact about the run, and a deploy
    // that does not say cannot be audited later.
    expect(anonStep).toMatch(/anon key road: \$ROAD/);
    expect(anonStep).toMatch(/GITHUB_STEP_SUMMARY/);
    expect(anonStep).toMatch(/ROAD="nas-over-tailnet"/);
    expect(anonStep).toMatch(/ROAD="served-site"/);
  });

  it('and the key is masked on both roads, so neither can print it', () => {
    expect(anonStep).toMatch(/::add-mask::\$KEY/);
    // One mask, after the selection — not one per road, which is how a road
    // added later gets forgotten.
    expect((anonStep.match(/::add-mask::/g) || []).length).toBe(1);
  });

  it('the deploy still proves itself from outside: the domain must answer JSON', () => {
    // DR-1068's own last step, untouched here. A green wrangler upload is not a
    // served road (DR-0107), and nothing in this change may weaken that.
    expect(wf).toContain('Read the custom domain back');
    expect(wf).toMatch(/x-poetech-road/);
  });
});
