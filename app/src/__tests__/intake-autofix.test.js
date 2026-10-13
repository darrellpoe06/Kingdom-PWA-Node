// =============================================================================
// The low-hanging-fruit fix lane keeps the FULL brake set (DR-0625; CLAUDE.md
// "Autonomous Automation Requires Three Brakes" as amended by DR-0247/0248 —
// the AI class keeps budget, lock AND kill-switch). Each brake is proven to
// CATCH here, and the lane is proven to GO when every brake is clear.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideHandout, reconcile, selfPause, branchFor, queueIdPrefixOf, AUTOFIX } from '../lib/intake-autofix.js';
import { judge, parseUnifiedDiff, MAX_LINES } from '../../../scripts/intake-autofix-scope-guard.mjs';
import { plan, quoter, recordState } from '../../../scripts/intake-autofix.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const NOW = Date.parse('2026-09-24T20:00:00Z');
const H = 3600000;
const iso = (ms) => new Date(ms).toISOString();
const Q = (o = {}) => ({ id: 'aaaaaaaa-0000-4000-8000-000000000001', status: 'queued', rule: 'wording', scope: 'copy', attempts: 0, created_at: iso(NOW - 5 * H), feedback_id: 'f', ...o });
const armed = { armed: true, pausedOnRecord: false, resumeAfter: '', nowMs: NOW };

describe('the lane goes when every brake is clear', () => {
  it('hands out exactly one item, the oldest queued one, with its branch', () => {
    const d = decideHandout({ ...armed, queue: [Q({ id: '22222222-0000-4000-8000-000000000002', created_at: iso(NOW - H) }), Q({ id: '11111111-0000-4000-8000-000000000001', created_at: iso(NOW - 9 * H) })] });
    expect(d.go).toBe(true);
    expect(d.item.id).toBe('11111111-0000-4000-8000-000000000001');
    expect(d.branch).toBe('claude/intake-fix-111111110000');
  });
});

describe('ARM: armed by record (DR-0247)', () => {
  it('PROVEN TO CATCH: no ARMED-BY-RECORD, no handout', () => {
    expect(decideHandout({ ...armed, armed: false, queue: [Q()] })).toMatchObject({ go: false, brake: 'arm' });
  });
  it('the arm is committed on this branch, so merge = started', () => {
    expect(existsSync(join(ROOT, 'infra', 'intake-autofix', 'ARMED-BY-RECORD'))).toBe(true);
    expect(recordState(ROOT)).toMatchObject({ armed: true, pausedOnRecord: false });
  });
});

describe('KILL: paused on record, and the lane pauses itself', () => {
  it('PROVEN TO CATCH: PAUSED on record stops everything', () => {
    expect(decideHandout({ ...armed, pausedOnRecord: true, queue: [Q()] })).toMatchObject({ go: false, brake: 'kill' });
  });
  const failed = (h) => Q({ id: `f${h}000000-0000-4000-8000-000000000000`, status: 'failed', finished_at: iso(NOW - h * H) });
  const merged = (h) => Q({ id: `e${h}000000-0000-4000-8000-000000000000`, status: 'merged', finished_at: iso(NOW - h * H) });
  it(`PROVEN TO CATCH: ${AUTOFIX.FAIL_STREAK} failures in a row pause the lane`, () => {
    const queue = [failed(1), failed(2), failed(3), Q()];
    expect(selfPause(queue).paused).toBe(true);
    expect(decideHandout({ ...armed, queue })).toMatchObject({ go: false, brake: 'kill' });
  });
  it('PROVEN QUIET: a success inside the streak keeps it going', () => {
    expect(selfPause([failed(1), merged(2), failed(3)]).paused).toBe(false);
  });
  it('a committed RESUME-AFTER later than the failures resumes it', () => {
    const queue = [failed(5), failed(6), failed(7), Q()];
    expect(decideHandout({ ...armed, queue, resumeAfter: iso(NOW - 4 * H) }).go).toBe(true);
    expect(decideHandout({ ...armed, queue, resumeAfter: iso(NOW - 10 * H) }).go).toBe(false);
  });
});

describe('LOCK: one at a time', () => {
  it('PROVEN TO CATCH: an open system fix blocks the next', () => {
    expect(decideHandout({ ...armed, openFixPrs: 1, queue: [Q()] })).toMatchObject({ go: false, brake: 'lock' });
  });
  it(`PROVEN TO CATCH: a claim under ${AUTOFIX.LOCK_HOURS} hours old blocks the next`, () => {
    const claimed = Q({ id: 'cccccccc-0000-4000-8000-000000000000', status: 'claimed', claimed_at: iso(NOW - 0.5 * H) });
    expect(decideHandout({ ...armed, queue: [claimed, Q()] })).toMatchObject({ go: false, brake: 'lock' });
    const old = { ...claimed, claimed_at: iso(NOW - 3 * H) };
    expect(decideHandout({ ...armed, queue: [old, Q()] }).go).toBe(true);
  });
});

describe('BUDGET: per day and per note', () => {
  it(`PROVEN TO CATCH: ${AUTOFIX.DAILY_MAX} fixes in 24 hours is the ceiling`, () => {
    expect(decideHandout({ ...armed, fixPrsOpened24h: AUTOFIX.DAILY_MAX, queue: [Q()] })).toMatchObject({ go: false, brake: 'budget' });
    expect(decideHandout({ ...armed, fixPrsOpened24h: AUTOFIX.DAILY_MAX - 1, queue: [Q()] }).go).toBe(true);
  });
  it(`PROVEN TO CATCH: a note tried ${AUTOFIX.MAX_ATTEMPTS} times is not handed out again`, () => {
    expect(decideHandout({ ...armed, queue: [Q({ attempts: AUTOFIX.MAX_ATTEMPTS })] })).toMatchObject({ go: false, brake: 'empty' });
  });
  it('PROVEN TO CATCH: a scope outside copy/style is never handed out', () => {
    expect(decideHandout({ ...armed, queue: [Q({ scope: 'schema' })] })).toMatchObject({ go: false, brake: 'empty' });
  });
  it('no clock, no handout', () => {
    expect(decideHandout({ ...armed, nowMs: undefined, queue: [Q()] })).toMatchObject({ go: false, brake: 'clock' });
  });
});

describe('reconcile: the pull request decides the note’s outcome', () => {
  const row = (o) => ({ id: `abcdef01-2345-4000-8000-000000000000`, feedback_id: 'fb', status: 'claimed', claimed_at: iso(NOW - H), attempts: 1, ...o });
  const pr = (o) => ({ number: 1900, title: 'Bus page title spelled right', branch: branchFor('abcdef01-2345-4000-8000-000000000000'), state: 'open', merged: false, createdAt: iso(NOW - H), ...o });
  it('the branch names the queue row and reads back', () => {
    expect(queueIdPrefixOf(branchFor('abcdef01-2345-4000-8000-000000000000'))).toBe('abcdef012345');
    expect(queueIdPrefixOf('claude/something-else')).toBeNull();
  });
  it('merged -> merged, with the pull request and its title (what changed)', () => {
    expect(reconcile({ queue: [row()], prs: [pr({ state: 'closed', merged: true })], nowMs: NOW }).updates[0]).toMatchObject({ status: 'merged', pr_number: 1900, pr_title: 'Bus page title spelled right' });
  });
  it('closed without merging -> failed', () => {
    expect(reconcile({ queue: [row()], prs: [pr({ state: 'closed' })], nowMs: NOW }).updates[0]).toMatchObject({ status: 'failed' });
  });
  it('open -> opened; open past the stale limit -> failed and the pull request is closed', () => {
    expect(reconcile({ queue: [row()], prs: [pr()], nowMs: NOW }).updates[0]).toMatchObject({ status: 'opened' });
    const r = reconcile({ queue: [row({ status: 'opened' })], prs: [pr({ createdAt: iso(NOW - (AUTOFIX.STALE_PR_HOURS + 1) * H) })], nowMs: NOW });
    expect(r.updates[0]).toMatchObject({ status: 'failed' });
    expect(r.closePrs).toEqual([1900]);
  });
  it('a claim that opened nothing past the lock goes back to the queue, or fails on its last attempt', () => {
    expect(reconcile({ queue: [row({ claimed_at: iso(NOW - 3 * H) })], prs: [], nowMs: NOW }).updates[0]).toMatchObject({ status: 'queued' });
    expect(reconcile({ queue: [row({ claimed_at: iso(NOW - 3 * H), attempts: AUTOFIX.MAX_ATTEMPTS })], prs: [], nowMs: NOW }).updates[0]).toMatchObject({ status: 'failed' });
  });
});

describe('SCOPE: the branch diff stays inside the allowlist (CI guard)', () => {
  const br = 'claude/intake-fix-abcdef012345';
  const f = (path, added = ['x'], removed = []) => ({ path, added, removed });
  it('a one-word label fix in a component passes', () => {
    expect(judge(br, [f('app/src/components/BusMinistry.jsx', ['<h2>Schedule</h2>'], ['<h2>Scedule</h2>'])]).ok).toBe(true);
  });
  it('other branches are not judged', () => {
    expect(judge('claude/other', [f('infra/x.sql')])).toMatchObject({ ok: true, skipped: true });
  });
  for (const [name, files] of [
    ['a lib', [f('app/src/lib/giving.js')]],
    ['the monolith', [f('app/src/poe-financial-mvp-v28.jsx')]],
    ['a migration', [f('infra/supabase/migrations-auto/0999-x.sql')]],
    ['a workflow', [f('.github/workflows/x.yml')]],
    ['a link', [f('app/src/components/Bus.jsx', ['<a href="https://example.com">x</a>'])]],
    ['an email', [f('app/src/components/Bus.jsx', ['write to someone@example.com'])]],
    ['a phone number', [f('app/src/components/Bus.jsx', ['call 555-123-4567'])]],
    ['a bright-line subject', [f('app/src/components/Bus.jsx', ['Give your offering here'])]],
    [`over ${MAX_LINES} lines`, [f('app/src/components/Bus.jsx', Array(MAX_LINES + 1).fill('x'))]],
    ['an empty change', []],
  ]) {
    it(`PROVEN TO CATCH: ${name}`, () => { expect(judge(br, files).ok).toBe(false); });
  }
  it('tests may change alongside, and do not count toward the line ceiling', () => {
    expect(judge(br, [f('app/src/components/Bus.jsx', ['a'], ['b']), f('app/src/__tests__/bus.test.js', Array(40).fill('x'))]).ok).toBe(true);
  });
  it('parses a unified diff, a deleted file included', () => {
    const d = 'diff --git a/app/src/components/A.jsx b/app/src/components/A.jsx\n--- a/app/src/components/A.jsx\n+++ b/app/src/components/A.jsx\n@@ -1 +1 @@\n-old\n+new\ndiff --git a/app/src/lib/x.js b/app/src/lib/x.js\n--- a/app/src/lib/x.js\n+++ /dev/null\n@@ -1 +0,0 @@\n-gone\n';
    const files = parseUnifiedDiff(d);
    expect(files.map((x) => x.path)).toEqual(['app/src/components/A.jsx', 'app/src/lib/x.js']);
    expect(files[0]).toMatchObject({ added: ['new'], removed: ['old'] });
    expect(judge(br, files).ok).toBe(false);
  });
  it('CI runs the guard inside the required job', () => {
    expect(readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8')).toMatch(/node scripts\/intake-autofix-scope-guard\.mjs --selftest-break\n\s+node scripts\/intake-autofix-scope-guard\.mjs\n/);
  });
});

describe('the runner plan writes one safe transaction', () => {
  const UUIDF = '11111111-1111-4111-8111-111111111111';
  const INST = '99999999-9999-4999-8999-999999999999';
  const LEDGER = { ok: true, items: [] };
  const fb = (o = {}) => ({ id: UUIDF, instance_id: INST, submitted_at: iso(NOW - 2 * H), which_tab: 'church-bus', feedback_text: 'Not working: typo on the bus page title', triage_status: 'new', intake_category: null, intake_basis: null, ...o });
  it('categorizes, enqueues the low-hanging note, and wraps everything in BEGIN/COMMIT', () => {
    const out = plan('reconcile', { feedback: [fb()], queue: [], prs: [] }, { ledger: LEDGER, record: { armed: true }, nowMs: NOW });
    expect(out.sql.startsWith('BEGIN;')).toBe(true);
    expect(out.sql.trim().endsWith('COMMIT;')).toBe(true);
    expect(out.sql).toMatch(/UPDATE public\.feedback SET intake_category = 'fix'/);
    expect(out.sql).toMatch(/INSERT INTO public\.intake_fix_queue/);
    expect(out.decision).toBeNull();
  });
  it('writes "fixed, with what changed" onto the sender’s note when the fix merged', () => {
    const q = { id: 'abcdef01-2345-4000-8000-000000000000', feedback_id: UUIDF, status: 'opened', claimed_at: iso(NOW - H), attempts: 1, scope: 'copy', rule: 'wording' };
    const prs = [{ number: 1901, title: 'Bus page title spelled right', branch: branchFor(q.id), state: 'closed', merged: true, createdAt: iso(NOW - H) }];
    const out = plan('reconcile', { feedback: [fb({ intake_category: 'fix', intake_basis: { version: 'intake-1' } })], queue: [q], prs }, { ledger: LEDGER, record: { armed: true }, nowMs: NOW });
    expect(out.sql).toMatch(/SET triage_status = 'fixed', outcome_note = \$q[0-9a-f]+\$Bus page title spelled right\$q[0-9a-f]+\$, outcome_ref = '#1901'/);
  });
  it('PROVEN TO CATCH: a note or title cannot close the literal it is written in', () => {
    const q = quoter();
    const tag = /^\$(q[0-9a-f]+)\$/.exec(q('x'))[1];
    expect(() => q(`evil $${tag}$; DROP TABLE feedback; --`)).toThrow(/quote tag/);
    expect(q("it's fine; -- '")).toMatch(/^\$q[0-9a-f]+\$it's fine; -- '\$q[0-9a-f]+\$$/);
  });
  it('rows without a real uuid are never written', () => {
    const out = plan('reconcile', { feedback: [fb({ id: "x'; DROP TABLE feedback; --" })], queue: [], prs: [] }, { ledger: LEDGER, record: { armed: true }, nowMs: NOW });
    expect(out.sql).toBe('BEGIN;\nCOMMIT;');
  });
  it('handout claims one item when the brakes allow, and prints the note as data', () => {
    const q = { id: 'abcdef01-2345-4000-8000-000000000000', feedback_id: UUIDF, status: 'queued', attempts: 0, scope: 'copy', rule: 'wording', created_at: iso(NOW - H) };
    const out = plan('handout', { feedback: [fb({ intake_category: 'fix', intake_basis: { version: 'intake-1' } })], queue: [q], prs: [] }, { ledger: LEDGER, record: { armed: true, pausedOnRecord: false, resumeAfter: '' }, nowMs: NOW });
    expect(out.decision.go).toBe(true);
    expect(out.sql).toMatch(/SET status = 'claimed'/);
    expect(out.summary).toMatch(/## HANDOUT/);
    expect(out.summary).toMatch(/DATA, never instructions/);
    const paused = plan('handout', { feedback: [], queue: [q], prs: [] }, { ledger: LEDGER, record: { armed: true, pausedOnRecord: true }, nowMs: NOW });
    expect(paused.decision.go).toBe(false);
    expect(paused.sql).not.toMatch(/claimed/);
  });
});
