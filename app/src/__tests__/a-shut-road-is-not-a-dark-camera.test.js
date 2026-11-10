// =============================================================================
// A shut road is not a dark camera (2026-11-02, DR-1298)
// =============================================================================
// MEASURED on the live surface, not reasoned about. `camera-health` run
// 41456015879 (2026-11-02T13:47Z) wrote this onto issue #2011, the rolling
// camera ledger, and put `priority:cameras` on it -- the label the lane treats
// as fix-now, before anything else:
//
//   **Now:** the NAS was not reachable from the runner
//   **REGRESSION:**
//   - the forwarder on the NAS did not answer /health
//   ```json
//   {"reachable":false}
//   ```
//
// Three separate untruths in six lines:
//
//   1. THE CAUSE IS WRONG. The forwarder was never asked. TS_AUTHKEY
//      k17y78NVwb11CNTRL is revoked, the runner never joined the tailnet, and
//      the SSH fell through to the `{"reachable": false}` default. The one
//      condition `!w.reachable || !w.health || w.health.ok !== true` turned a
//      transport fault into a sentence about the family's cameras. This is
//      exactly the shape DR-1291 fixed on the site witness six days earlier --
//      an unsigned road is not a dark layer; an unreachable runner is not a
//      dark forwarder -- in a lane nobody re-read afterwards.
//
//   2. THE LABEL IS WRONG. `priority:cameras` means go look at the cameras
//      now. A fix-now label aimed at the wrong box sends the next steward to
//      the wrong box, which costs more than no label at all.
//
//   3. THE LEDGER'S MEMORY WAS ERASED. `{"reachable":false}` was written in as
//      the new last witness, so the state the next run compares itself with is
//      gone. The last witness that actually reached the box (run 40615036439,
//      2026-10-28T01:26:35Z) read `streams: 32` -- recovered from that run's
//      archived log, because the ledger no longer held it. DR-1186 already says
//      it: a failed read is recorded as UNKNOWN, never as ZERO.
//
// `camera-health` was one of the 43 lanes frozen as shrink-only debt by
// `a-tailnet-join-is-not-a-witness` (DR-1284, re-review 2026-11-29), whose
// stated harm was that a shut road "surfaces the real fault further down". This
// lane is worse than that pin knew: it does not merely report the fault late,
// it publishes a different fault, loudly, on a family-facing surface. So this
// is the next bite of that debt taken early, and it is the right one to take
// first -- not deploy-adjacent (DR-0107 is untouched), and its judgment call is
// not a judgment call at all.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WF = join(__dirname, '..', '..', '..', '.github', 'workflows', 'camera-health.yml');
const yaml = readFileSync(WF, 'utf8');

// Pull one step's text out of the workflow, so a pin reads the step it means
// rather than anywhere in the file (P62: decide by exact identity).
const step = (name) => {
  const at = yaml.indexOf(name);
  if (at === -1) return '';
  const rest = yaml.slice(at);
  const next = rest.indexOf('\n      - ');
  return next === -1 ? rest : rest.slice(0, next);
};

// The judge is an inline `actions/github-script` block. Lift its body out so
// the test can RUN it, not just read it.
const judgeScript = () => {
  const s = step('Judge: a regression against the last witness');
  const at = s.indexOf('script: |');
  expect(at, 'the judge must still be an inline github-script block').toBeGreaterThan(-1);
  const lines = s.slice(s.indexOf('\n', at) + 1).split('\n');
  const body = [];
  for (const l of lines) {
    if (l.trim() === '') { body.push(''); continue; }
    if (!l.startsWith('            ')) break;
    body.push(l.slice(12));
  }
  return body.join('\n');
};

// A harness that runs the judge against a fixture witness and a fixture issue,
// recording every outward move it makes.
const runJudge = async (source, { witness, lastWitness, labels = [] }) => {
  const calls = { added: [], removed: [], comments: [], failed: null, bodies: [], created: null };
  const issue = lastWitness === undefined ? null : {
    number: 2011,
    title: 'Camera road witness — the rolling ledger (DR-0806)',
    body: `# Camera road witness\n\n\`\`\`json\n${JSON.stringify(lastWitness)}\n\`\`\`\n`,
    labels: labels.map((name) => ({ name })),
  };
  const github = {
    rest: {
      issues: {
        getLabel: async () => ({}),
        createLabel: async () => ({}),
        listForRepo: async () => ({ data: issue ? [issue] : [] }),
        create: async ({ body, labels: ls }) => { calls.created = { body, labels: ls }; calls.bodies.push(body); return { data: { number: 2011, labels: [] } }; },
        update: async ({ body }) => { calls.bodies.push(body); },
        addLabels: async ({ labels: ls }) => { calls.added.push(...ls); },
        removeLabel: async ({ name }) => { calls.removed.push(name); },
        createComment: async ({ body }) => { calls.comments.push(body); },
      },
    },
  };
  const core = {
    setFailed: (m) => { calls.failed = m; },
    summary: { addHeading() { return this; }, addRaw() { return this; }, write() {} },
  };
  const req = (m) => {
    if (m === 'fs') return { readFileSync: () => JSON.stringify(witness) };
    throw new Error(`the judge asked for an unexpected module: ${m}`);
  };
  const fn = new Function('github', 'context', 'core', 'require', `return (async () => {\n${source}\n})()`);
  await fn(github, { repo: { owner: 'o', repo: 'r' }, runId: 1 }, core, req);
  return { ...calls, body: calls.bodies[calls.bodies.length - 1] || '' };
};

// The witness that actually reached the box, recovered from run 40615036439's
// archived log after the ledger had already been overwritten.
const LAST_REAL = { reachable: true, at: 1793150795, probe_all: false, streams: 32, probed: [], answering: 0, silent: [], health: { ok: true, forwarder: 'abc', on_disk: 'abc' } };
const SHUT = { reachable: false };

describe('camera-health asks whether it got onto the tailnet before it says anything about the cameras', () => {
  it('the join is verified, the verify is a brake, and it names the real cause', () => {
    // Either door counts: DR-1374 put every join behind the one composite
    // action, so pinning the raw action's name measured the spelling, not the
    // join (the DR-1363 / DR-1379 class).
    expect(yaml, 'the lane still joins the tailnet')
      .toMatch(/uses:\s*(\.\/\.github\/actions\/join-tailnet|tailscale\/github-action)/);
    const v = step('Verify the tailnet actually joined');
    expect(v, 'camera-health must verify its join (DR-1284)').toContain('tailscale status --peers=false');
    expect(v, 'a verify step is a brake, not a log line').toMatch(/exit 1/);
    expect(v, 'it must name the value that is actually wrong').toContain('TS_AUTHKEY');
    expect(v, 'and it must say plainly that this is not a camera fault').toMatch(/NOT a camera fault/);
  });

  it('a shut road escalates as a KEY incident, and the escalation can never fail the lane', () => {
    const v = step('Verify the tailnet actually joined');
    expect(v, 'a shut road must reach the fleet\'s rolling key entry (DR-1283)').toContain('scripts/tailnet-key-incident.mjs');
    expect(v, 'the escalation must not be able to fail the lane').toMatch(/tailnet-key-incident\.mjs[\s\S]*?\|\| true/);
    expect(yaml, 'the script it runs has to be on disk, so the lane needs a checkout').toContain('actions/checkout@v7');
    expect(yaml.indexOf('actions/checkout@v7'), 'the checkout must come before the step that runs a repo script')
      .toBeLessThan(yaml.indexOf('tailnet-key-incident.mjs'));
  });

  it('the verify sits between the join and the first question asked of the NAS', () => {
    const join = yaml.indexOf('Join the tailnet (ephemeral)');
    const verify = yaml.indexOf('Verify the tailnet actually joined');
    const ask = yaml.indexOf('Ask the NAS (read-only, scrubbed)');
    expect(verify).toBeGreaterThan(join);
    expect(ask, 'nothing may be asked of the camera road before the road is known to be open').toBeGreaterThan(verify);
  });
});

describe('the judge, run against a runner that never reached the box', () => {
  it('does not say the forwarder was asked, because it was not', async () => {
    const r = await runJudge(judgeScript(), { witness: SHUT, lastWitness: LAST_REAL });
    expect(r.body, 'the ledger must not report a camera fault for a transport fault')
      .not.toContain('the forwarder on the NAS did not answer /health');
    expect(r.body, 'and it must say what actually happened').toMatch(/never reached the NAS/);
    expect(r.body, 'pointing the reader at the key and the box, not the cameras').toMatch(/NOT at the cameras/);
  });

  it('does not raise the fix-now camera label, and clears it if it is stuck on', async () => {
    const r = await runJudge(judgeScript(), { witness: SHUT, lastWitness: LAST_REAL, labels: ['camera-incident', 'priority:cameras'] });
    expect(r.added, 'a shut road must not add priority:cameras').not.toContain('priority:cameras');
    expect(r.removed, 'and a stuck priority:cameras must come off').toContain('priority:cameras');
  });

  it('still fails the run — quietly passing a shut road would be the opposite mistake', async () => {
    const r = await runJudge(judgeScript(), { witness: SHUT, lastWitness: LAST_REAL });
    expect(r.failed, 'the run must fail').toBeTruthy();
    expect(r.failed, 'and the failure must name the road, not the cameras').toMatch(/road to the box was shut/);
  });

  it('keeps the last witness that actually reached the box (DR-1186: a failed read is not a zero)', async () => {
    const r = await runJudge(judgeScript(), { witness: SHUT, lastWitness: LAST_REAL });
    const m = r.body.match(/```json\n([\s\S]*?)\n```/);
    expect(m, 'the ledger must still carry a fenced witness').toBeTruthy();
    const kept = JSON.parse(m[1]);
    expect(kept.reachable, 'the unreachable run must not become the new last witness').toBe(true);
    expect(kept.streams, 'the stream count the next comparison needs must survive').toBe(32);
    expect(r.body, 'and the ledger must say the witness below is older than this run').toMatch(/kept, not overwritten/);
  });

  it('writes no regression comment for a road fault — 48 of them a day is not a signal', async () => {
    const r = await runJudge(judgeScript(), { witness: SHUT, lastWitness: LAST_REAL });
    expect(r.comments, 'a shut road updates the body; it does not comment every half hour').toEqual([]);
  });
});

describe('the judge still does its real job', () => {
  it('a forwarder that answered and is NOT ok is a camera regression, with the fix-now label', async () => {
    const dark = { reachable: true, at: 1, probe_all: false, streams: 32, probed: [], answering: 0, silent: [], health: { ok: false, forwarder: 'abc', on_disk: 'abc' } };
    const r = await runJudge(judgeScript(), { witness: dark, lastWitness: LAST_REAL, labels: ['camera-incident'] });
    expect(r.body, 'a real dark forwarder must still be named as one').toContain('the forwarder on the NAS did not answer /health');
    expect(r.added, 'and it must still earn the fix-now label').toContain('priority:cameras');
    expect(r.failed).toMatch(/camera road regression/);
  });

  it('a camera that answered last time and is silent now is still a regression', async () => {
    const last = { reachable: true, streams: 32, probed: [{ id: 'front', ok: true }], answering: 1, health: { ok: true } };
    const now = { reachable: true, at: 2, probe_all: false, streams: 32, probed: [{ id: 'front', ok: false }], answering: 0, silent: ['front'], health: { ok: true, forwarder: 'a', on_disk: 'a' } };
    const r = await runJudge(judgeScript(), { witness: now, lastWitness: last });
    expect(r.body).toMatch(/front.*went silent|went silent/);
    expect(r.added).toContain('priority:cameras');
  });

  it('a clean pass says so, clears the label, and becomes the new last witness', async () => {
    const now = { reachable: true, at: 3, probe_all: false, streams: 32, probed: [{ id: 'front', ok: true }], answering: 1, silent: [], health: { ok: true, forwarder: 'a', on_disk: 'a' } };
    const r = await runJudge(judgeScript(), { witness: now, lastWitness: LAST_REAL, labels: ['camera-incident', 'priority:cameras'] });
    expect(r.body).toContain('**No regression against the last witness.**');
    expect(r.removed).toContain('priority:cameras');
    expect(JSON.parse(r.body.match(/```json\n([\s\S]*?)\n```/)[1]).at, 'a run that reached the box IS the new last witness').toBe(3);
    expect(r.failed).toBeNull();
  });
});

describe('PROVEN TO CATCH: the shape that was live on #2011 fails every pin above', () => {
  // The judge as it stood before this change, rebuilt by undoing exactly the
  // two edits. If these assertions ever go green, the conflation is back.
  const old = () => {
    const s = judgeScript();
    const withConflation = s.replace(
      /const transport = \[\];[\s\S]*?else if \(!w\.health \|\| w\.health\.ok !== true\) reasons\.push\('the forwarder on the NAS did not answer \/health'\);/,
      "const transport = [];\n            if (!w.reachable || !w.health || w.health.ok !== true) reasons.push('the forwarder on the NAS did not answer /health');",
    );
    expect(withConflation, 'the rebuild of the old judge must actually differ').not.toBe(s);
    return withConflation.replace('JSON.stringify(keep)', 'JSON.stringify(w)');
  };

  it('the old judge blamed the forwarder, raised the fix-now label, and erased the ledger', async () => {
    const r = await runJudge(old(), { witness: SHUT, lastWitness: LAST_REAL, labels: ['camera-incident'] });
    // This is the measured output of run 41456015879, reproduced.
    expect(r.body).toContain('the forwarder on the NAS did not answer /health');
    expect(r.added).toContain('priority:cameras');
    expect(JSON.parse(r.body.match(/```json\n([\s\S]*?)\n```/)[1])).toEqual({ reachable: false });
    expect(r.comments.length, 'and it commented on every half-hourly run').toBe(1);
  });
});
