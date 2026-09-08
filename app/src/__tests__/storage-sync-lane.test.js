// @vitest-environment node
// =============================================================================
// The blob copy runs from the lane, not from Darrell's hand
// =============================================================================
// Darrell 2026-09-08: "you have cli and ssh..." — said after the storage copy
// DR-0317 built (infra/nas-supabase/storage_sync.py) had been handed back to
// him as a paste block for eight days, framed as needing the hosted service_role
// key. Two premises were wrong at once (DR-0108: a stated "must be by hand" is
// an unverified premise to challenge):
//
//   • The remote-hands channel — tailnet + NAS_SSH_KEY — IS this team's CLI on
//     the box. nas-health, nas-clock, the sovereign replay all ride it.
//   • A PUBLIC bucket needs no hosted credential at all. Shay's gallery is
//     public. It was copyable the whole time.
//
// These pins keep both facts wired: the workflow exists and is dispatch-only,
// the script rides the proven ssh shape, storage_sync.py no longer refuses to
// run without the hosted key, and a run without it NAMES the buckets it
// withheld rather than silently skipping them (the DR-0317 gap in a new coat).
// The pure logic itself is proven-to-catch by `storage_sync.py --selftest` in CI.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const WF = join(ROOT, '.github/workflows/nas-storage-sync.yml');
const SCRIPT = join(ROOT, 'scripts/storage-sync-over-tailnet.sh');
const PY = join(ROOT, 'infra/nas-supabase/storage_sync.py');
const README = join(ROOT, 'infra/nas-supabase/README.md');
const read = (p) => readFileSync(p, 'utf8');

describe('nas-storage-sync.yml — the copy is a dispatchable lane', () => {
  const wf = read(WF);

  it('exists and is dispatch-only (it mutates the sovereign storage; never on a timer)', () => {
    expect(existsSync(WF)).toBe(true);
    expect(wf).toMatch(/^on:\s*\n\s+workflow_dispatch:/m);
    expect(wf).not.toMatch(/^\s+schedule:/m);
    expect(wf).not.toMatch(/^\s+push:/m);
  });

  it('takes a bucket input that defaults to Shay’s public gallery, and empty means every bucket', () => {
    expect(wf).toMatch(/bucket:\s*\n\s+description:[^\n]*EMPTY[^\n]*every bucket/);
    expect(wf).toMatch(/default:\s*'moore-showcase'/);
  });

  it('rides the same remote-hands channel as nas-health (tailnet join, verified, then NAS_SSH_KEY)', () => {
    expect(wf).toMatch(/uses:\s*tailscale\/github-action@v3/);
    expect(wf).toMatch(/tailscale status --peers=false/);
    expect(wf).toMatch(/NAS_SSH_KEY:\s*\$\{\{\s*secrets\.NAS_SSH_KEY\s*\}\}/);
    expect(wf).toMatch(/STORAGE_BUCKET:\s*\$\{\{\s*inputs\.bucket\s*\}\}/);
    expect(wf).toMatch(/run:\s*bash scripts\/storage-sync-over-tailnet\.sh/);
  });

  it('is single-instance (a second dispatch queues behind the first, never stacks)', () => {
    expect(wf).toMatch(/concurrency:\s*\n\s+group:\s*nas-storage-sync\s*\n\s+cancel-in-progress:\s*false/);
  });
});

describe('storage-sync-over-tailnet.sh — the proven ssh shape, and a verdict that is read, not assumed', () => {
  const sh = read(SCRIPT);

  it('refuses to report a copy it could not make (no key → exit, unreachable → exit)', () => {
    expect(sh).toMatch(/NAS_SSH_KEY missing - nothing was copied/);
    expect(sh).toMatch(/NAS unreachable - nothing was copied/);
  });

  it('runs the NAS side from a QUOTED heredoc with the bucket passed as environment', () => {
    expect(sh).toMatch(/<<'REMOTE'/);
    expect(sh).toMatch(/STORAGE_BUCKET='\$STORAGE_BUCKET' bash -s/);
  });

  it('resolves python3 rather than trusting a non-login PATH (the docker lesson, applied)', () => {
    expect(sh).toMatch(/command -v python3/);
    expect(sh).toMatch(/\/usr\/local\/bin\/python3/);
  });

  it('reports the hosted key by PRESENCE only, never its value', () => {
    expect(sh).toMatch(/HOSTED-KEY-PRESENT=yes/);
    expect(sh).toMatch(/HOSTED-KEY-PRESENT=no/);
    expect(sh).not.toMatch(/echo\s+"?\$HOSTED_SERVICE_ROLE_KEY/);
    expect(sh).not.toMatch(/sed -n 's\/\^HOSTED_SERVICE_ROLE_KEY=\/\/p'/);
  });

  it('goes red unless storage_sync.py itself said GO', () => {
    expect(sh).toMatch(/verdict=\$\(printf '%s\\n' "\$OUT" \| sed -n 's\/\^storage-sync: verdict \/\/p'/);
    expect(sh).toMatch(/\[ "\$verdict" != "GO" \]/);
  });
});

describe('storage_sync.py — public buckets copy without the hosted key, and the private ones are NAMED', () => {
  const py = read(PY);

  it('the hosted service key is no longer a precondition to run', () => {
    // The `missing` list that refuses the run names only what is truly required.
    const missing = py.match(/missing = \[n for n, v in \(([\s\S]*?)\) if not v\]/);
    expect(missing, 'the missing-list is still present').toBeTruthy();
    expect(missing[1]).toMatch(/AGENT_DB_URL/);
    expect(missing[1]).toMatch(/SERVICE_ROLE_KEY/);
    expect(missing[1]).not.toMatch(/HOSTED_SERVICE_ROLE_KEY/);
    expect(missing[1]).not.toMatch(/HOSTED_SB_URL/);
  });

  it('the hosted project URL defaults to the known project (a public fact, not a secret)', () => {
    expect(py).toMatch(/HOSTED_SB_URL_DEFAULT = "https:\/\/mjjlevhdufpaplypnqrv\.supabase\.co"/);
    expect(py).toMatch(/env_value\(AGENT_ENV, "HOSTED_SB_URL"\) or HOSTED_SB_URL_DEFAULT/);
  });

  it('a public object is read over the unauthenticated /object/public/ path, with no credential', () => {
    expect(py).toMatch(/def public_object_url\(base, bucket, name\)/);
    expect(py).toMatch(/\/storage\/v1\/object\/public\/\{\}\/\{\}/);
    expect(py).toMatch(/public_object_url\(hosted_api, bucket, name\), None\)/);
    expect(py).toMatch(/if key:\s*#.*no credential/);
  });

  it('without the key the scope is public-only and the withheld buckets are printed by name', () => {
    expect(py).toMatch(/def scope_to_reachable\(buckets, rows, have_hosted_key\)/);
    expect(py).toMatch(/scope public-only \(no HOSTED_SERVICE_ROLE_KEY in agent\.env\); "\s*\n\s*"private buckets NOT copied: " \+ ", "\.join\(withheld\)/);
    expect(py).toMatch(/is PRIVATE and cannot be read without/);
  });

  it('proves one object serves back anonymously through kong before it says GO', () => {
    expect(py).toMatch(/storage-sync: proof anonymous GET \{\}\/\{\} -> HTTP \{\}/);
    expect(py).toMatch(/if st != 200:\s*\n\s*failed \+= 1/);
  });

  it('the selftest pins the new pure logic (proven-to-catch rides CI)', () => {
    expect(py).toMatch(/CATCHES a private bucket silently dropped: the withheld buckets are NAMED/);
    expect(py).toMatch(/a public read uses the unauthenticated \/object\/public\/ path/);
  });
});

describe('the runbook says the lane runs it', () => {
  it('README points at the workflow, and keeps the key as the one value only Darrell adds', () => {
    const md = read(README);
    expect(md).toMatch(/dispatch `nas-storage-sync\.yml`/);
    expect(md).toMatch(/PUBLIC buckets only, and the withheld ones are\s*\nNAMED/);
    expect(md).toMatch(/HOSTED_SERVICE_ROLE_KEY=<the hosted project's service_role key>/);
    expect(md).toMatch(/PRESENCE only, never its value/);
  });
});
