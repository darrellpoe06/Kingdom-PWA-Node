// =============================================================================
// The waiting log says what KIND of work waits, not only how much (DR-1507)
// =============================================================================
// MEASURED on inbox-lessons-waiting run 43956538893 (2026-11-16 21:09 UTC), the
// first firing in which the second road answered at all. The tailnet was shut
// (`TAILNET: false`, step 5 `skipped`) and the house's own census answered over
// the public road with six facts:
//
//   ### Waiting lesson rows: 5
//   Counted on the NAS itself 6 min ago (fresh), read over the public road.
//   The oldest has waited 4 d 8 h (2026-11-12T12:17:12.767416+00:00).
//   By road -- research-inbox: 5.
//   By shape -- build-failed: 3, plain: 2.
//   Failed because -- other: 2, transient: 1.
//
// The rolling run log -- the ONE cheap road a cloud session has into this queue
// (DR-1186 opened it precisely because reading a step summary or the Actions
// listing costs thousands of tokens to learn nothing) -- carried the 5 and
// nothing else. So the next session learns the queue is not empty and cannot
// tell whether any of it is even buildable: a `voice-waiting-for-words` row is
// waiting on Whisper and must not be built, a `build-failed` row wants a retry
// or a person, and the oldest-waited is the only measure of how overdue the
// lane is. DR-1467's shape again -- a witness narrower than its name.
//
// This gate EXECUTES the log step's own shell rather than reading the YAML for
// a phrase, because the defect was in what the line CONTAINED, not in what the
// file said about it. `gh` is stubbed so nothing is posted.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const WORKFLOW = join(__dirname, '..', '..', '..', '.github', 'workflows', 'inbox-lessons-waiting.yml');
const STEP = 'Record the run (rolling log, pass or fail)';

// The census's real stdout from run 43956538893, byte for byte. A fixture
// invented by hand would prove the test and not the lane.
const SERVED_STDOUT = [
  '### Waiting lesson rows: 5',
  'Counted on the NAS itself 6 min ago (fresh), read over the public road.',
  'The oldest has waited 4 d 8 h (2026-11-12T12:17:12.767416+00:00).',
  'By road -- research-inbox: 5.',
  'By shape -- build-failed: 3, plain: 2.',
  'Failed because -- other: 2, transient: 1.',
  'Not counted as waiting: awaiting-review, lesson-building, lesson-captured, not-a-lesson, withdrawn.',
  '',
].join('\n');

/**
 * The `run: |` body of one named step, dedented. Deliberately strict: a renamed
 * step fails loudly here rather than silently testing nothing.
 */
function stepScript(yaml, name) {
  const lines = yaml.split('\n');
  const at = lines.findIndex((l) => l.includes(`- name: ${name}`));
  if (at < 0) throw new Error(`step not found: ${name}`);
  let i = at;
  while (i < lines.length && !/^\s*run: \|\s*$/.test(lines[i])) i += 1;
  if (i >= lines.length) throw new Error(`step has no "run: |": ${name}`);
  const indent = lines[i + 1].match(/^\s*/)[0].length;
  const body = [];
  for (let j = i + 1; j < lines.length; j += 1) {
    const l = lines[j];
    if (l.trim() !== '' && l.match(/^\s*/)[0].length < indent) break;
    body.push(l.slice(indent));
  }
  return body.join('\n');
}

let home;
const run = (env) => {
  const script = join(home, 'step.sh');
  writeFileSync(script, stepScript(readFileSync(WORKFLOW, 'utf8'), STEP), 'utf8');
  execFileSync('bash', ['-e', script], {
    cwd: home,
    env: {
      PATH: `${join(home, 'bin')}:${process.env.PATH}`,
      RUNNER_TEMP: home,
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_RUN_ID: '43956538893',
      REPO: 'darrellpoe06/Kingdom-PWA-Node',
      GH_TOKEN: 'stub',
      ...env,
    },
    stdio: 'pipe',
  });
  return readFileSync(join(home, 'intake-line.md'), 'utf8');
};

describe('the waiting log says what kind of work waits', () => {
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'waiting-log-'));
    mkdirSync(join(home, 'bin'));
    // `gh` stubbed: `issue list` finds the log, `issue comment` posts nothing.
    const gh = join(home, 'bin', 'gh');
    writeFileSync(gh, '#!/bin/sh\nif [ "$2" = "list" ]; then echo 2378; fi\nexit 0\n', 'utf8');
    chmodSync(gh, 0o755);
    writeFileSync(join(home, 'served-queue.txt'), SERVED_STDOUT, 'utf8');
  });
  afterEach(() => rmSync(home, { recursive: true, force: true }));

  it('carries the shape of the queue when the census answered, not only the count', () => {
    const line = run({ SERVED_READ: 'ok', SERVED_COUNT: '5', SERVED_AGE: '6', NAS_READ: '', NAS_COUNT: '' });
    expect(line).toMatch(/\*\*5\*\* lesson row\(s\) waiting/);
    // The three facts that decide the next move, each by name.
    expect(line).toContain('By shape -- build-failed: 3, plain: 2.');
    expect(line).toContain('Failed because -- other: 2, transient: 1.');
    expect(line).toContain('The oldest has waited 4 d 8 h');
  });

  it('does not repeat the count as a stray markdown heading inside the entry', () => {
    const line = run({ SERVED_READ: 'ok', SERVED_COUNT: '5', SERVED_AGE: '6', NAS_READ: '', NAS_COUNT: '' });
    expect(line).not.toContain('### Waiting lesson rows');
  });

  it('still says never a body, and carries no body', () => {
    const line = run({ SERVED_READ: 'ok', SERVED_COUNT: '5', SERVED_AGE: '6', NAS_READ: '', NAS_COUNT: '' });
    expect(line).toContain('never a body');
    // Nothing in the entry is prose from a teaching: every detail line is a
    // count, a tag name, a timestamp or the census's own wording.
    expect(line).not.toMatch(/\b(Yahweh|Jesus|saith|thus saith)\b/);
  });

  it('the NAS road keeps its own row listing and does not take the census block', () => {
    writeFileSync(join(home, 'waiting-rows.txt'), 'row-a | 2026-11-12 | acct | research-inbox | lesson | 812\n', 'utf8');
    const line = run({ NAS_READ: 'ok', NAS_COUNT: '1', SERVED_READ: '', SERVED_COUNT: '', SERVED_AGE: '' });
    expect(line).toContain('the NAS over the tailnet');
    expect(line).toContain('row-a | 2026-11-12');
    expect(line).not.toContain('By shape --');
  });

  it('a queue neither road read is still UNKNOWN and carries no shape block', () => {
    const line = run({ NAS_READ: 'failed', NAS_COUNT: '', SERVED_READ: 'failed', SERVED_COUNT: '', SERVED_AGE: '' });
    expect(line).toContain('**UNKNOWN**');
    expect(line).toContain('This is NOT an empty queue');
    expect(line).not.toContain('By shape --');
  });

  it('the census answering ZERO still reports the shape block, because zero is a reading', () => {
    writeFileSync(
      join(home, 'served-queue.txt'),
      '### Waiting lesson rows: 0\nCounted on the NAS itself 3 min ago (fresh), read over the public road.\nNothing is waiting.\n',
      'utf8'
    );
    const line = run({ SERVED_READ: 'ok', SERVED_COUNT: '0', SERVED_AGE: '3', NAS_READ: '', NAS_COUNT: '' });
    expect(line).toContain('**0** lesson row(s) waiting');
    expect(line).toContain('Nothing is waiting.');
  });
});
