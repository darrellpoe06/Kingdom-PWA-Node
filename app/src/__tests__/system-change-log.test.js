// @vitest-environment node
// =============================================================================
// system-change-log (DR-1111) — what changed, when, in which layer, and how it
// is reversed. The test pins the one thing the log must never do: promise an
// undo a layer cannot give. A migration revert removes a file, not the change
// already applied to the database.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  layerOf, layersOf, migrationsOf, reversalOf, refsOf, entryOf, toMarkdown,
} from '../../../scripts/system-change-log.mjs';

describe('every path lands in exactly one named layer', () => {
  it('names the real layers of this repository', () => {
    expect(layerOf('app/src/components/OpsBoard.jsx')).toBe('app');
    expect(layerOf('app/functions/_lib/funnel-proxy.js')).toBe('transport');
    expect(layerOf('app/public/_routes.json')).toBe('transport');
    expect(layerOf('infra/nas-announce/install.sh')).toBe('nas');
    expect(layerOf('infra/church-media-golive/stream_length_sync.py')).toBe('nas');
    expect(layerOf('infra/supabase/migrations-auto/0300-x.sql')).toBe('data');
    expect(layerOf('.github/workflows/site-health.yml')).toBe('factory');
    expect(layerOf('scripts/ops-announce.mjs')).toBe('factory');
    expect(layerOf('app/src/lib/car-research-course.js')).toBe('content');
    expect(layerOf('app/src/lib/living-lessons-class.js')).toBe('content');
    expect(layerOf('app/public/bible/kjv/John.json')).toBe('content');
    expect(layerOf('app/src/__tests__/a-dead-bell-says-so.test.js')).toBe('tests');
    expect(layerOf('docs/decisions/DR-1110-a-200-is-not-a-ring.md')).toBe('ledger');
    expect(layerOf('docs/99-session-notes/x.md')).toBe('docs');
  });
  it('places EVERY tracked file in the repository in a named layer — nothing falls into "other"', () => {
    // CI checks out one commit (a shallow clone), so a walk over history sees
    // that commit "add" the whole tree; the first version of this case failed
    // there on .gitignore, LICENSE, _archive/, backend/, builds/... So the
    // check is the stronger one: every file git tracks today has a layer,
    // with or without history.
    const root = join(process.cwd(), '..');
    const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim().split('\n').filter(Boolean);
    expect(files.length).toBeGreaterThan(1000);
    const unplaced = [...new Set(files.filter((f) => layerOf(f) === 'other'))];
    expect(unplaced).toEqual([]);
    expect(layerOf('_archive/voice-ops-typescript-v0/src/worker.ts')).toBe('archive');
    expect(layerOf('backend/voice-worker/src/index.js')).toBe('transport');
    expect(layerOf('LICENSE')).toBe('repo');
    expect(layerOf('store/android.keystore.enc')).toBe('factory');
  });
});

describe('reversal says what each layer can really undo', () => {
  it('a migration is named as forward-only, with the file it must undo', () => {
    const r = reversalOf({ sha: 'abcdef1234567', paths: ['infra/supabase/migrations-auto/0300-the-office-opens.sql', 'app/src/lib/x.js'] }).join(' ');
    expect(r).toMatch(/SCHEMA IS FORWARD-ONLY/);
    expect(r).toMatch(/NOT what was already applied/);
    expect(r).toContain('0300-the-office-opens.sql');
  });
  it('PROVEN TO CATCH: a change with no migration never claims to be forward-only, and one with a migration always does', () => {
    expect(reversalOf({ sha: 'a', paths: ['app/src/x.jsx'] }).join(' ')).not.toMatch(/FORWARD-ONLY/);
    expect(reversalOf({ sha: 'a', paths: ['infra/supabase/migrations-auto/0001-a.sql'] }).join(' ')).toMatch(/FORWARD-ONLY/);
  });
  it('never promises a deploy time the backstop cannot keep, and names the branch the lane will pick up', () => {
    const r = reversalOf({ sha: 'a', paths: ['app/src/x.jsx'] }).join(' ');
    expect(r).not.toMatch(/within 5 min/);
    expect(r).toMatch(/7\.7% of fires/);
    expect(r).toMatch(/not GitHub's Revert button/);
  });
  it('app and transport changes say they redeploy; NAS changes say they ride services-sync; workflows name their brakes', () => {
    expect(reversalOf({ sha: 'a', paths: ['app/functions/sb/[[path]].js'] }).join(' ')).toMatch(/redeploys Pages/);
    expect(reversalOf({ sha: 'a', paths: ['infra/nas-cameras/install.sh'] }).join(' ')).toMatch(/services-sync/);
    expect(reversalOf({ sha: 'a', paths: ['.github/workflows/site-health.yml'] }).join(' ')).toMatch(/kill-switch variable or the `hold` label/);
  });
});

describe('the references and the rendered log', () => {
  it('reads the PR number from the squash subject and every DR named', () => {
    expect(refsOf('A 200 is not a ring (DR-1110) (#2267)', 'see DR-0970')).toEqual({ pr: 2267, drs: ['DR-1110', 'DR-0970'] });
    expect(refsOf('Merge remote-tracking branch')).toEqual({ pr: null, drs: [] });
  });
  it('an entry carries its time to the second, its layers and its reversal', () => {
    const e = entryOf({ sha: '0123456789abcdef', at: '2026-10-19T07:39:04+00:00', author: 'x', subject: 'Cameras (DR-1097) (#2264)', paths: ['infra/nas-cameras/cams_forwarder.py', 'docs/decisions/DR-1097-x.md'] });
    expect(e.pr).toBe(2264);
    expect(e.layers).toEqual(['nas', 'ledger']);
    const md = toMarkdown([e], { since: '2026-10-12' });
    expect(md).toContain('2026-10-19 07:39:04 UTC');
    expect(md).toContain('#2264');
    expect(md).toContain('Layers: nas, ledger');
    expect(md).toContain('Reverse: git revert 012345678');
  });
  it('layersOf and migrationsOf are stable and exact', () => {
    expect(layersOf(['docs/a.md', 'app/src/a.js', 'app/src/b.js'])).toEqual(['app', 'docs']);
    expect(migrationsOf(['infra/supabase/migrations-auto/0299-a.sql', 'infra/supabase/schema-v1.sql'])).toEqual(['infra/supabase/migrations-auto/0299-a.sql']);
  });
});
