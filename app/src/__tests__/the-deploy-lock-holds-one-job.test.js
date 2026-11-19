// =============================================================================
// The deploy lock holds one job (DR-1603)
// =============================================================================
// Measured on run 44476228421 (2026-11-19): the site went live at 07:27:45 and
// the run held the workflow-level `cf-pages-deploy` lock until 07:54:47, while
// its four post-deploy jobs (about a minute of work) waited 26 minutes for
// runners. Every newer deploy waited behind them. The lock now sits on the one
// `deploy` job, which also runs the boot check; the dispatches run outside it.
// These read the REAL workflow file.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const WF = readFileSync(join(ROOT, '.github/workflows/deploy-cloudflare-pages.yml'), 'utf8');

/** Each top-level job's text, by id. */
export function jobs(text) {
  const body = text.slice(text.search(/^jobs:\n/m));
  const out = {};
  for (const m of body.matchAll(/^ {2}([a-z0-9-]+):\n([\s\S]*?)(?=^ {2}[a-z0-9-]+:\n|(?![\s\S]))/gm)) out[m[1]] = m[2];
  return out;
}

/** Findings against the one-job lock; empty when the file is right. */
export function lockFindings(text) {
  const f = [];
  const head = text.slice(0, text.search(/^jobs:\n/m));
  if (/^concurrency:/m.test(head)) f.push('a workflow-level lock holds the whole run, post-deploy jobs included');
  const j = jobs(text);
  if (!j.deploy) return [...f, 'no deploy job'];
  if (!/^ {4}concurrency:\n {6}group: cf-pages-deploy\n {6}cancel-in-progress: false$/m.test(j.deploy))
    f.push('the deploy job does not hold cf-pages-deploy without cancelling');
  if (!/node scripts\/boot-check\.mjs/.test(j.deploy)) f.push('the boot check is not inside the locked job');
  for (const [id, t] of Object.entries(j)) {
    if (id !== 'deploy' && /cf-pages-deploy/.test(t)) f.push(`${id} also takes the deploy lock`);
    if (id !== 'deploy' && /needs: deploy/.test(t) && !/needs\.deploy\.outputs\.published == 'true'/.test(t)) f.push(`${id} does not run on the upload alone`);
  }
  if (!/steps\.propagate\.outcome == 'failure' \|\| steps\.boot\.outcome == 'failure'/.test(j.deploy))
    f.push('a failed build could file a boot-check incident');
  return f;
}

describe('the deploy lock holds one job (DR-1603)', () => {
  it('the real workflow has no findings', () => {
    expect(lockFindings(WF)).toEqual([]);
  });

  it('the dispatches still run after an upload whose boot check failed, and never without an upload', () => {
    const j = jobs(WF);
    for (const id of ['dispatch-lessons-sync', 'place-doors', 'dispatch-camera-health']) {
      expect(j[id]).toMatch(/if: \$\{\{ always\(\) && needs\.deploy\.outputs\.published == 'true' \}\}/);
    }
    expect(j.deploy).toMatch(/published: \$\{\{ steps\.published\.outputs\.published \}\}/);
    const at = (s) => j.deploy.indexOf(s);
    expect(at('pages deploy dist')).toBeLessThan(at('id: published'));
    expect(at('id: published')).toBeLessThan(at('id: propagate'));
  });

  it('PROVEN TO CATCH: the old workflow-level lock and a separate verify job are both named', () => {
    const old = WF.replace(/^permissions:/m, 'concurrency:\n  group: cf-pages-deploy\n  cancel-in-progress: false\n\npermissions:').replace(
      /\n {6}- name: Boot-check production[\s\S]*?boot-check\.mjs[^\n]*\n/,
      '\n'
    );
    const f = lockFindings(old);
    expect(f.some((x) => /workflow-level lock/.test(x))).toBe(true);
    expect(f.some((x) => /boot check is not inside/.test(x))).toBe(true);
    expect(lockFindings(WF.replace("always() && needs.deploy.outputs.published == 'true'", "vars.CF_PAGES_ENABLED == 'true'"))).not.toEqual([]);
  });
});
