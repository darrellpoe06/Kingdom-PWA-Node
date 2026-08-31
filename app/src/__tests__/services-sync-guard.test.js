// @vitest-environment node
//
// services-sync-guard — the self-deploy manifest cannot rot (DR-0236/DR-0076).
// Merge-is-the-deploy only works if what the manifest points at is REAL: every
// enabled service's installer exists, every registry loop's script exists, and
// every loop carries its brake fields (a missing cap/timeout is a missing
// brake — no-go, per the nas-loops contract). Proven-to-catch: the synthetic
// cases fire each failure class the guard exists to stop.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LOOPS_DIR = join(ROOT, 'infra/nas-loops');

// The pure checks (exported shape kept local — this guard is the only consumer).
export function manifestProblems(doc, fileExists) {
  const problems = [];
  for (const svc of (doc && doc.services) || []) {
    if (!svc.name) problems.push('service-missing-name');
    if (!svc.enabled) continue;
    if (!svc.install) problems.push(`${svc.name}:missing-install-path`);
    else if (!fileExists(svc.install)) problems.push(`${svc.name}:installer-not-found:${svc.install}`);
  }
  return problems;
}

// Pinned-image gate (DR-0266): every ENABLED manifest service that ships a
// docker-compose.yml must pin its image tags. A floating tag (:latest/:main/
// :edge or no tag at all) turns "merge is the deploy" into a silent moving
// target the gates never saw — the exact drift class DR-0076 exists to stop.
// readCompose(dirRel) returns the compose text, or null when the service has
// no compose file (the venv/systemd class — not this gate's business).
export function composePinProblems(doc, readCompose) {
  const problems = [];
  const FLOATING = new Set(['latest', 'main', 'edge']);
  for (const svc of (doc && doc.services) || []) {
    if (!svc.enabled || !svc.install) continue;
    const dir = svc.install.replace(/\/[^/]*$/, '');
    const text = readCompose(dir);
    if (text == null) continue;
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*image:\s*["']?([^\s"']+)/);
      if (!m) continue;
      const ref = m[1];
      const lastColon = ref.lastIndexOf(':');
      const tag = lastColon > ref.lastIndexOf('/') ? ref.slice(lastColon + 1) : null;
      if (!tag || FLOATING.has(tag)) problems.push(`${svc.name}:floating-image:${ref}`);
    }
  }
  return problems;
}

export function registryProblems(doc, fileExists) {
  const problems = [];
  for (const loop of (doc && doc.loops) || []) {
    const name = loop.name || 'unnamed';
    if (!loop.script) problems.push(`${name}:missing-script`);
    else if (!fileExists(`loops/${loop.script}`)) problems.push(`${name}:script-not-found:${loop.script}`);
    if (!Number.isFinite(loop.max_calls_per_day) || loop.max_calls_per_day <= 0) problems.push(`${name}:missing-brake:max_calls_per_day`);
    if (!Number.isFinite(loop.timeout_seconds) || loop.timeout_seconds <= 0) problems.push(`${name}:missing-brake:timeout_seconds`);
    if (loop.kind !== 'deterministic' && loop.kind !== 'ai') problems.push(`${name}:unknown-kind`);
  }
  return problems;
}

describe('proven-to-catch — the guard flags each rot class', () => {
  it('CATCHES an enabled service whose installer does not exist', () => {
    const doc = { services: [{ name: 'ghost', enabled: true, install: 'infra/nope/install.sh' }] };
    expect(manifestProblems(doc, () => false)).toEqual(['ghost:installer-not-found:infra/nope/install.sh']);
  });
  it('a disabled service with a missing installer is NOT a failure (committed off)', () => {
    const doc = { services: [{ name: 'parked', enabled: false, install: 'infra/nope/install.sh' }] };
    expect(manifestProblems(doc, () => false)).toEqual([]);
  });
  it('CATCHES a registry loop without its brake fields', () => {
    const doc = { loops: [{ name: 'brakeless', kind: 'deterministic', script: 'x.sh' }] };
    const problems = registryProblems(doc, () => true);
    expect(problems).toContain('brakeless:missing-brake:max_calls_per_day');
    expect(problems).toContain('brakeless:missing-brake:timeout_seconds');
  });
  it('CATCHES a registry loop whose script file is missing', () => {
    const doc = { loops: [{ name: 'ghost', kind: 'deterministic', script: 'gone.sh', max_calls_per_day: 1, timeout_seconds: 1 }] };
    expect(registryProblems(doc, () => false)).toEqual(['ghost:script-not-found:gone.sh']);
  });
  it('CATCHES a floating :latest image on an enabled docker service', () => {
    const doc = { services: [{ name: 'drifty', enabled: true, install: 'infra/nas-drifty/install.sh' }] };
    expect(composePinProblems(doc, () => 'services:\n  x:\n    image: ghcr.io/some/thing:latest\n'))
      .toEqual(['drifty:floating-image:ghcr.io/some/thing:latest']);
  });
  it('CATCHES a tagless image (implicit latest), including a registry-port ref', () => {
    const doc = { services: [{ name: 'bare', enabled: true, install: 'infra/nas-bare/install.sh' }] };
    expect(composePinProblems(doc, () => '    image: "registry.example:5000/some/thing"\n'))
      .toEqual(['bare:floating-image:registry.example:5000/some/thing']);
  });
  it('a PINNED image passes; a service with no compose file is not this gate\'s business', () => {
    const pinned = { services: [{ name: 'ok', enabled: true, install: 'infra/nas-ok/install.sh' }] };
    expect(composePinProblems(pinned, () => 'image: ghcr.io/pelski/ytzero:0.25.3\n')).toEqual([]);
    expect(composePinProblems(pinned, () => null)).toEqual([]);
  });
  it('a DISABLED service with a floating tag is NOT a failure (committed off)', () => {
    const doc = { services: [{ name: 'parked', enabled: false, install: 'infra/nas-parked/install.sh' }] };
    expect(composePinProblems(doc, () => 'image: thing:latest\n')).toEqual([]);
  });
});

describe('the REAL manifest + registry hold', () => {
  const fileExists = (rel) => existsSync(join(rel.startsWith('loops/') ? LOOPS_DIR : ROOT, rel));
  it('services.json parses and every enabled installer exists on disk', () => {
    const doc = JSON.parse(readFileSync(join(LOOPS_DIR, 'services.json'), 'utf-8'));
    expect(doc.services.length).toBeGreaterThan(0);
    expect(manifestProblems(doc, (rel) => existsSync(join(ROOT, rel)))).toEqual([]);
  });
  it('every enabled docker service in the REAL manifest rides a pinned image', () => {
    const doc = JSON.parse(readFileSync(join(LOOPS_DIR, 'services.json'), 'utf-8'));
    const readCompose = (dirRel) => {
      const p = join(ROOT, dirRel, 'docker-compose.yml');
      return existsSync(p) ? readFileSync(p, 'utf-8') : null;
    };
    expect(composePinProblems(doc, readCompose)).toEqual([]);
  });
  it('registry.json parses, every loop script exists, every loop carries its brakes', () => {
    const doc = JSON.parse(readFileSync(join(LOOPS_DIR, 'registry.json'), 'utf-8'));
    expect(registryProblems(doc, fileExists)).toEqual([]);
    const names = doc.loops.map((l) => l.name);
    expect(names).toContain('scribe-transcribe');
    expect(names).toContain('services-sync');
  });
});

// =============================================================================
// The 2026-08-06 ways-review pins. Three findings, three gates.
// =============================================================================
describe('the transcript trickle rides the clock safely (2026-08-06 ways review)', () => {
  const services = () => JSON.parse(readFileSync(join(LOOPS_DIR, 'services.json'), 'utf-8'));
  const registry = () => JSON.parse(readFileSync(join(LOOPS_DIR, 'registry.json'), 'utf-8'));

  // FINDING: services-sync gives each installer 480s, but run.mjs kills the WHOLE
  // services-sync tree at the registry's timeout_seconds. A cheap stamp-gated
  // rider registered LAST behind docker pulls and the choir-dates drain can be
  // SIGKILLed before it ever runs — silently, forever, with the cycle still green.
  it('the cheap stamp-gated rider runs FIRST so a slow sibling cannot starve it', () => {
    const names = services().services.map((s) => s.name);
    expect(names[0]).toBe('transcript-trickle');
  });

  // FINDING: `enabled: true` on a registry loop with no DSM/cron entry reads
  // GREEN while nothing fires it — a check that means nothing (DR-0076 §3). The
  // live path is the services.json rider; this entry must stay off with a why.
  it('the duplicate unclocked loop stays disabled and says why + when to revisit', () => {
    const loop = registry().loops.find((l) => l.name === 'transcript-backfill');
    expect(loop).toBeTruthy();
    expect(loop.enabled).toBe(false);
    expect(loop.disabled_why).toMatch(/rider|unclocked|additive/i);
    expect(loop.re_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // FINDING: the loader's pause pointed at the app's resume-transcripts job,
  // which routes through ops-runner.py — installed by NOTHING. A pause would
  // have stopped the drain permanently and silently. Any stop-path a rider
  // documents must be reachable, so nothing may name ops-runner as its clear
  // path until that runner is itself in the self-deploy manifest.
  it('no installer documents a stop-path through an uninstalled runner', () => {
    const doc = services();
    const opsRunnerInstalled = doc.services.some(
      (s) => s.enabled && /ops-runner/i.test(s.install || ''),
    );
    for (const svc of doc.services) {
      if (!svc.enabled) continue;
      // Normalize comment markers + wrapping first: the acknowledgment is prose
      // in a shell header, so it wraps across lines and a naive line-scoped
      // regex would miss it and fire a false positive.
      const src = readFileSync(join(ROOT, svc.install), 'utf-8')
        .replace(/^\s*#+/gm, ' ')
        .replace(/\s+/g, ' ');
      const claimsOpsRunner = /resume-transcripts|ops-runner/i.test(src)
        && !/installed by nothing|no reachable clear path|is installed by NOTHING/i.test(src);
      expect(
        claimsOpsRunner && !opsRunnerInstalled,
        `${svc.name} points its stop-path at ops-runner, which no enabled service installs`,
      ).toBe(false);
    }
  });
});

describe('the harvest pipeline has a witness OUTSIDE its own failure domain', () => {
  // FINDING (the root cause of the month-long stall): the only alarms lived ON
  // the NAS — the loop reel's ntfy needs the loop to run, and the announce relay
  // is a Funnel URL on the same box. A NAS that is off emits nothing. The stall
  // guard script reads a gitignored path nothing writes. So a data-plane stall
  // could only ever be found by a human opening the app, and was — after a month.
  const wf = () => readFileSync(join(ROOT, '.github/workflows/harvest-health.yml'), 'utf-8');

  it('exists, runs on a schedule, and is not dispatch-only', () => {
    const src = wf();
    expect(src).toMatch(/^\s*schedule:/m);
    expect(src).toMatch(/cron:/);
  });

  it('runs on a GitHub runner, NOT on the NAS it is watching', () => {
    expect(wf()).toMatch(/runs-on:\s*ubuntu-latest/);
  });

  it('carries the three brakes and ships ACTIVE (a witness that waits is the bug)', () => {
    const src = wf();
    expect(src).toMatch(/concurrency:/);              // lock
    expect(src).toMatch(/cancel-in-progress:\s*false/);
    expect(src).toMatch(/timeout-minutes:/);          // budget
    expect(src).toMatch(/HARVEST_HEALTH_ENABLED\s*!=\s*'false'/); // kill, default-on
  });

  it('never reports an unmeasurable state as healthy (DR-0076)', () => {
    const src = wf();
    expect(src).toMatch(/unknown=true/);
    expect(src).toMatch(/steps\.probe\.outputs\.unknown\s*!=\s*'true'/);
  });

  it('files a durable record and fails the run when the pipeline stops advancing', () => {
    const src = wf();
    expect(src).toMatch(/--label incident/);
    expect(src).toMatch(/exit 1/);
  });
});

// ===========================================================================
// THE RIDER INSTALLS WHAT IT NEEDS (measured 2026-08-11)
// ===========================================================================
// The transcript corpus sat at 81/860 from 2026-07-06 to 2026-08-11 — 35 days
// with ZERO rows written, not even error rows. That absence was the diagnosis:
// a YouTube IP block writes failure rows, so total silence meant the loader
// never reached YouTube. It never did. Every services-sync cycle ended with
// load-transcripts.py's own ImportError hint — "ERROR: pip install
// youtube-transcript-api" — and exit 2, because nothing in the installer or the
// manifest had ever installed that module on the NAS python3.
//
// The rider was armed, clocked, and faithfully running into an import error for
// over a month. These pin the fix so the dependency cannot silently vanish
// again, and so nobody "simplifies" the failure into a quiet skip — a silent
// skip is precisely how a month passed unnoticed.
describe('transcript-trickle can actually run on the box', () => {
  const installer = () => readFileSync(
    join(ROOT, 'infra/nas-sme-pipeline/transcript_trickle_install.sh'), 'utf8');

  it('ensures youtube-transcript-api before invoking the loader', () => {
    const src = installer();
    expect(src).toMatch(/import youtube_transcript_api/);
    expect(src).toMatch(/pip install[^\n]*youtube-transcript-api/);
    // The check must come BEFORE the loader call, or it guards nothing.
    // Anchor on the INVOCATION, not the word — the file name also appears in
    // the header prose, and matching that would pass no matter where the guard sat.
    const invocation = src.indexOf('python3 "$REPO/infra/nas-sme-pipeline/load-transcripts.py"');
    expect(invocation, 'the loader invocation must exist').toBeGreaterThan(-1);
    expect(src.indexOf("import youtube_transcript_api")).toBeLessThan(invocation);
  });

  it('is idempotent — it only installs when the import is actually missing', () => {
    expect(installer()).toMatch(/if ! python3 -c 'import youtube_transcript_api'/);
  });

  it('handles a PEP 668 externally-managed python rather than dying on it', () => {
    expect(installer()).toMatch(/--break-system-packages/);
  });

  it('PROVEN-TO-CATCH: a host that still cannot import it FAILS LOUD, never skips quietly', () => {
    const src = installer();
    expect(src).toMatch(/FAILED to make youtube-transcript-api importable/);
    expect(src).toMatch(/exit 1/);
  });
});

// ===========================================================================
// choir-dates: the yt-dlp wrapper repairs itself (measured 2026-08-11)
// ===========================================================================
// With the transcript rider's dependency fixed, services-sync failed one
// installer later — choir_dates_sync.py raising "yt-dlp not available" while
// the wrapper file was sitting right there, executable. Two faults met: the
// --version check only ran when the wrapper was CREATED, so an existing-but-
// broken wrapper was never re-tested; and the wrapper called `docker run` bare
// on a box where nas-health had already established the socket denies dpoe's
// plain shell without `sudo -n`. Present, executable, and unable to reach
// docker at all — failing silently one layer below the python that shells out.
describe('choir-dates yt-dlp wrapper is verified every cycle', () => {
  const installer = () => readFileSync(
    join(ROOT, 'infra/church-media-golive/choir_dates_install.sh'), 'utf8');

  it('health-checks the wrapper on EVERY run, not only at creation', () => {
    const src = installer();
    expect(src).toMatch(/ytdlp_ok\(\)/);
    // PROVEN-TO-CATCH: the old guard short-circuited on mere existence.
    expect(src).not.toMatch(/if ! python3 -c "import yt_dlp" 2>\/dev\/null && \[ ! -x "\$YTDLP" \]; then/);
    expect(src).toMatch(/! ytdlp_ok/);
  });

  it('reaches docker through sudo -n when the plain socket is denied', () => {
    expect(installer()).toMatch(/sudo -n docker/);
  });

  it('still fails LOUD when the wrapper cannot be made to work', () => {
    const src = installer();
    expect(src).toMatch(/failed its --version check/);
    expect(src).toMatch(/exit 1/);
  });
});

// ===========================================================================
// The transcript dependency must not depend on WHICH USER runs the loop
// ===========================================================================
// Measured 2026-08-11 (nas-health run 31535277388): as dpoe,
// `import youtube_transcript_api` succeeds — the first fix really did install
// it. But services-sync runs the loop as ROOT via `sudo -n`, and both pip and
// the module live in /var/services/homes/dpoe/.local, a PER-USER location root
// does not read. So as root the import failed, the pip retry failed too (root
// cannot see pip, which is itself in dpoe's .local), and the loud guard exited
// 1 before the stamp was written — proven by the stamp's mtime being identical
// across two cycles. "It works when I run it" was true and useless.
describe('transcript-trickle dependency is user-independent', () => {
  const installer = () => readFileSync(
    join(ROOT, 'infra/nas-sme-pipeline/transcript_trickle_install.sh'), 'utf8');

  it('vendors into the REPO, which every user can read', () => {
    const src = installer();
    expect(src).toMatch(/VENDOR="\$REPO\/infra\/nas-sme-pipeline\/\.vendor"/);
    expect(src).toMatch(/--target "\$VENDOR"/);
  });

  it('PROVEN-TO-CATCH: it no longer relies on --user site-packages', () => {
    expect(installer()).not.toMatch(/pip install --user --quiet youtube-transcript-api/);
  });

  it('exports PYTHONPATH BEFORE the loader runs, or the loader cannot import it', () => {
    const src = installer();
    const exportAt = src.indexOf('export PYTHONPATH');
    const loaderAt = src.indexOf('load-transcripts.py"');
    expect(exportAt).toBeGreaterThan(-1);
    expect(loaderAt).toBeGreaterThan(exportAt);
  });

  it('still fails LOUD, and names the user it failed as', () => {
    const src = installer();
    expect(src).toMatch(/FAILED to make youtube-transcript-api importable as \$\(id -un\)/);
    expect(src).toMatch(/exit 1/);
  });
});

// A CLAIMED WITNESS MUST EXIST (2026-08-31).
// ===========================================================================
// Writing the ops-runner service entry, I typed "Witness: ops-queue-health.yml
// probes the queue from OUTSIDE the NAS" into its description BEFORE that
// workflow existed — a false claim, in a committed artifact, in the house
// voice, about the one property this manifest cannot verify for itself. It
// would have read as reviewed precisely because it looked right.
//
// That is the same shape as the failure the ops-runner entry documents: the
// transcript-trickle note said its stop-path routed through "ops-runner.py,
// which nothing installs" — a documented path to a thing that was not there.
// A description in this file is load-bearing (it is what a future session
// reads to decide whether a lane is watched), so a witness named here is a
// promise the repo must keep.
export function witnessProblems(doc, fileExists) {
  const problems = [];
  for (const svc of (doc && doc.services) || []) {
    const desc = String((svc && svc.description) || '');
    // "Witness: harvest-health.yml probes ..." — take the first .yml token after
    // the marker, which is how every existing entry writes it.
    const m = desc.match(/Witness:\s*([A-Za-z0-9._-]+\.ya?ml)/i);
    if (!m) continue;
    const wf = `.github/workflows/${m[1]}`;
    if (!fileExists(wf)) problems.push(`${svc.name}:witness-not-found:${m[1]}`);
  }
  return problems;
}

describe('a claimed witness exists (the 2026-08-31 near-miss, made mechanical)', () => {
  const services = () => JSON.parse(readFileSync(join(LOOPS_DIR, 'services.json'), 'utf-8'));
  const onDisk = (rel) => existsSync(join(ROOT, rel));

  it('PROVEN-TO-CATCH: a description naming a workflow that does not exist fails', () => {
    const doc = { services: [{ name: 'x', enabled: true, description: 'Witness: not-a-real-witness.yml probes it.' }] };
    expect(witnessProblems(doc, onDisk)).toEqual(['x:witness-not-found:not-a-real-witness.yml']);
  });

  it('a description that claims no witness is not this gate\'s business', () => {
    expect(witnessProblems({ services: [{ name: 'y', enabled: true, description: 'no claim here' }] }, onDisk)).toEqual([]);
  });

  it('the REAL manifest keeps every witness it names', () => {
    expect(witnessProblems(services(), onDisk)).toEqual([]);
  });

  it('the ops queue names its witness, and that witness is scheduled (not dispatch-only)', () => {
    const ops = services().services.find((s) => s.name === 'ops-runner');
    expect(ops, 'ops-runner must be registered — a hand-placed daemon is what died').toBeTruthy();
    expect(ops.enabled).toBe(true);
    expect(ops.description).toMatch(/Witness:\s*ops-queue-health\.yml/i);
    const wf = readFileSync(join(ROOT, '.github/workflows/ops-queue-health.yml'), 'utf-8');
    expect(wf).toMatch(/^\s*schedule:/m);
    expect(wf).toMatch(/cron:/);
    // it must live OUTSIDE the NAS's failure domain, like harvest-health
    expect(wf).toMatch(/runs-on:\s*ubuntu-latest/);
    // and never report "cannot measure" as healthy
    expect(wf).toMatch(/never\s+reported\s+as\s+healthy|Unknown is NEVER/i);
  });

  it('the ops-runner installer rides the armed clock rather than re-arming a daemon', () => {
    const src = readFileSync(join(ROOT, 'infra/nas-sme-pipeline/ops_runner_install.sh'), 'utf-8');
    expect(src, 'must drain one bounded cycle, not spawn a survivor').toMatch(/--once/);
    expect(src, 'a --loop daemon is the thing that died').not.toMatch(/python3 .*--loop/);
    // the human-cleared pause is what could stop the lane silently forever
    expect(src).toMatch(/PAUSE_DECAY/);
    // a missing credential is a polite no-op, not a red cycle every 15 minutes
    expect(src).toMatch(/no credential/i);
  });
});
