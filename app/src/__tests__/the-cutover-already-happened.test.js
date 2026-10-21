// @vitest-environment node
// =============================================================================
// THE CUTOVER ALREADY HAPPENED — the deploy lane must not describe itself as a
// dry run (DR-1188)
// =============================================================================
// On 2026-10-21 every open PR went red with `Vercel: failure — Resource is
// limited, try again in 24 hours (api-deployments-free-per-day)`, and the
// header of the workflow that ACTUALLY serves poetech.us still read:
//
//     SAFE-BY-DEFAULT / NO CUTOVER YET ... this workflow SKIPS cleanly -- it
//     builds and serves nothing, so it cannot break the live Vercel path
//
// Read as written, that tells you Vercel is production and a red Vercel status
// is an outage. Both are the opposite of the truth, and that is the most
// expensive kind of comment there is: the same session had already spent an
// hour treating a stale route list as fact (DR-1180's "second door", #2057's
// five days of "no Function ran"). A comment nobody re-measures becomes the
// premise of the next wrong decision.
//
// MEASURED, two independent ways, 2026-10-21:
//   · the Cloudflare Pages project `poetech-app` holds the domains
//     poetech.us and www.poetech.us, and every road probed there answered
//     signed `pages-function`;
//   · the CF_PAGES_ENABLED-gated deploy job is producing real successes on
//     main (90ac836 at 15:45Z, d44f366 at 15:06Z) -- impossible with the gate
//     shut.
//
// These cases pin the CLAIM, not the prose: the lane may not say the cutover is
// pending, and may not say Vercel is live. They are deliberately about the two
// sentences a reader acts on, so the header stays free to be rewritten.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LANE = readFileSync(join(ROOT, '.github/workflows/deploy-cloudflare-pages.yml'), 'utf8');
const VERCEL = readFileSync(join(ROOT, 'vercel.json'), 'utf8');
// Comment lines only: the point is what the file TELLS a reader, and `if:`
// expressions and step names are not where a stale premise hides.
const PROSE = LANE.split('\n').filter((l) => /^\s*#/.test(l)).join('\n');

describe('the deploy lane does not call itself a dry run', () => {
  it('never says the cutover is still pending', () => {
    expect(PROSE).not.toMatch(/NO CUTOVER YET/i);
    expect(PROSE).not.toMatch(/until Darrell (sets|flips)/i);
    expect(PROSE).not.toMatch(/serves nothing/i);
  });

  it('never says Vercel is the live or production path', () => {
    expect(PROSE).not.toMatch(/live Vercel (path|serving)/i);
    expect(PROSE).not.toMatch(/cutover is still|not yet (cut|live)/i);
  });

  it('says plainly that this is what serves the site', () => {
    expect(PROSE).toMatch(/THE CUTOVER HAPPENED|THIS IS PRODUCTION/);
    expect(PROSE).toMatch(/poetech\.us/);
    // And that a red Vercel is noise, since that is the question a reader
    // arrives with on the day the cap is spent.
    expect(PROSE).toMatch(/VERCEL IS NOT PRODUCTION/);
    expect(PROSE).toMatch(/blocks nothing|Treat a red\s*#?\s*Vercel as noise/i);
  });

  it('still points at the witness that DOES measure the live site', () => {
    // A comment saying "ignore the red" must say what to read instead, or it
    // just moves the blindness (DR-0125).
    expect(PROSE).toMatch(/site-health\.yml/);
  });
});

describe('the measured record in vercel.json is kept, not quietly dropped', () => {
  it('records that the cutover lever was taken, and that nothing in the repo can silence Vercel', () => {
    expect(VERCEL).toMatch(/MEASURED INEFFECTIVE/);
    expect(VERCEL).toMatch(/VERCEL NO LONGER SERVES THE SITE/);
    expect(VERCEL).toMatch(/DASHBOARD-side/);
    // The config itself stays: the Root Directory setting still reads it and a
    // rollback would need it, so the file is documentation AND a fallback.
    expect(JSON.parse(VERCEL).git.deploymentEnabled.main).toBe(true);
  });
});
