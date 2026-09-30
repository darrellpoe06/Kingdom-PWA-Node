// =============================================================================
// lesson-inbox-bell.test — the bell replaces the hourly AI timer (DR-0697)
// =============================================================================
// Darrell 2026-09-30: "I don't like timers... they cost more than we need...
// don't we have a better solution/s?"
// Proves: the bell's decision (ring only on a changed waiting set, never a
// body); the workflow's triggers and brakes; the app's lesson save is the
// ring (the insert the 0243 trigger rings on) and sends nothing else; and no
// merge lane ever touches `bell/*`.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseWaiting, decide, formatComment, lastRungKeys, waitingKeys, MARKER,
} from '../../../scripts/lesson-inbox-bell.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const read = (p) => readFileSync(join(REPO, p), 'utf8');
const WF = (n) => read(`.github/workflows/${n}`);

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const WHO = 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';
const line = (id, tags) => `${id}|2026-09-30 12:00:00+00|${WHO}|app|${JSON.stringify(tags)}|412`;

describe('the bell decides (waiting-set diff, never a body)', () => {
  it('rings on the first waiting row, then stays quiet while nothing changed', () => {
    const rows = parseWaiting(line(A, ['lesson']));
    const first = decide(rows, []);
    expect(first).toMatchObject({ post: true, reason: 'first ring', waiting: 1 });
    const body = formatComment(rows, first.keys);
    expect(decide(rows, ['unrelated comment', body])).toMatchObject({ post: false, reason: 'nothing changed since the last ring' });
  });

  it('rings again when the set changes, and stays quiet when nothing waits', () => {
    const one = parseWaiting(line(A, ['lesson']));
    const body = formatComment(one, waitingKeys(one));
    const two = parseWaiting([line(A, ['lesson']), line(B, ['lesson', 'voice-transcript'])].join('\n'));
    expect(decide(two, [body])).toMatchObject({ post: true, reason: 'the waiting set changed', waiting: 2 });
    expect(decide([], [body])).toMatchObject({ post: false, reason: 'nothing waiting' });
  });

  it('PROVEN TO CATCH: a row the NAS tried and handed back rings again; bookkeeping tags do not', () => {
    const before = parseWaiting(line(A, ['lesson']));
    const body = formatComment(before, waitingKeys(before));
    const mirrored = parseWaiting(line(A, ['lesson', 'mirrored']));
    expect(decide(mirrored, [body]).post).toBe(false);
    const failed = parseWaiting(line(A, ['lesson', 'build:claimed@2026-09-30T12:01:00Z', 'build:failed@2026-09-30T12:09:00Z', 'build-failed']));
    expect(decide(failed, [body]).post).toBe(true);
  });

  it('PROVEN TO CATCH: no body ever reaches the comment, even if one were in the input', () => {
    const rows = parseWaiting(line(A, ['lesson']));
    rows[0].body = 'THE SECRET WORDS OF THE LESSON';
    const out = formatComment(rows, waitingKeys(rows));
    expect(out).not.toContain('SECRET');
    expect(Object.keys(parseWaiting(line(A, ['lesson']))[0]).sort()).toEqual(['created_by', 'id', 'tags']);
    // a tag that could close the marker or inject markup is dropped
    const evil = parseWaiting(line(A, ['lesson', 'x --> <b>', '`boom`']));
    expect(evil[0].tags).toEqual(['lesson']);
    expect(out).toContain(A);
    expect(out).toContain(WHO);
    expect(out).toContain(`<!-- ${MARKER} keys=${A} -->`);
  });

  it('reads only its own marker, and the newest one', () => {
    expect(lastRungKeys(['hello'])).toBeNull();
    expect(lastRungKeys([`<!-- ${MARKER} keys=${A} -->`, `<!-- ${MARKER} keys=${A},${B} -->`])).toEqual([A, B]);
  });

  it('the shared query selects the body only as a length', () => {
    const sql = read('scripts/lesson-inbox-waiting.sql').replace(/^--.*$/gm, '');
    expect(sql).toMatch(/length\(coalesce\(body,''\)\)/);
    expect(sql.replace(/length\(coalesce\(body,''\)\)/, '')).not.toMatch(/\bbody\b/);
  });
});

describe('the bell workflow: triggers and brakes', () => {
  const y = WF('lesson-inbox-bell.yml');
  it('rings on the lesson-saved dispatch, with ONE daily safety schedule', () => {
    expect(y).toMatch(/repository_dispatch:\s*\n\s*types: \[lesson-saved\]/);
    expect(y.match(/- cron: '/g)).toHaveLength(1);
    expect(y).toMatch(/- cron: '\d+ \d+ \* \* \*'/);
  });
  it('carries its lock, its budget and its kill', () => {
    expect(y).toMatch(/concurrency:\s*\n\s*group: lesson-inbox-bell\s*\n\s*cancel-in-progress: false/);
    expect(y).toMatch(/timeout-minutes: 5/);
    expect(y).toContain("if: ${{ vars.LESSON_BELL != 'off' }}");
  });
  it('shares the waiting query with inbox-lessons-waiting and decides with the tested script', () => {
    expect(y).toContain('< scripts/lesson-inbox-waiting.sql');
    expect(WF('inbox-lessons-waiting.yml')).toContain('< scripts/lesson-inbox-waiting.sql');
    expect(y).toContain('node scripts/lesson-inbox-bell.mjs');
    expect(y).toMatch(/if \[ "\$\(echo "\$D" \| jq -r \.post\)" = "true" \]/);
  });
  it('the proof delete removes only the labelled proof rows', () => {
    expect(y).toMatch(/DELETE FROM public\.agent_inbox WHERE tags \? 'bell-proof' AND source = 'bell-proof'/);
  });
});

describe('the merge lanes never touch bell/*', () => {
  it('auto-open-pr only fires on lane branches', () => {
    const branches = [...WF('auto-open-pr.yml').matchAll(/^\s+- '([^']+)'\s*$/gm)].map((m) => m[1]);
    expect(branches.length).toBeGreaterThan(0);
    for (const b of branches) expect(b.startsWith('bell/')).toBe(false);
    expect(branches.some((b) => b === '**' || b.startsWith('*'))).toBe(false);
  });
  it('auto-merge and keep-prs-current select only lane heads', () => {
    const m = /test\("(\^\([a-z|]+\)\/)"\)/.exec(WF('auto-merge.yml'));
    expect(m).toBeTruthy();
    expect(new RegExp(m[1]).test('bell/lesson-inbox')).toBe(false);
    expect(new RegExp(m[1]).test('claude/x')).toBe(true);
    expect(WF('keep-prs-current.yml')).toContain('startswith(\\"claude/\\")');
  });
});

// ---------------------------------------------------------------------------
// The app: a lesson save is the ring, and it sends nothing more.
// ---------------------------------------------------------------------------
const insert = vi.fn();
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: WHO } } } })) },
    from: vi.fn(() => ({ insert: (row) => { insert(row); return { select: () => ({ single: async () => ({ data: { id: A }, error: null }) }) }; } })),
  },
}));
vi.mock('../lib/table-sync.js', () => ({ getInstanceId: vi.fn(async () => 'inst-1') }));

describe('the app rings the bell by saving the lesson row', () => {
  beforeEach(() => { insert.mockClear(); });

  it('a lesson save is ONE insert tagged lesson, and no network call to GitHub', async () => {
    const fetchSpy = vi.fn();
    const had = globalThis.fetch;
    globalThis.fetch = fetchSpy;
    try {
      const { relayThought } = await import('../lib/agent-inbox-sync.js');
      const res = await relayThought({ body: 'a teaching', tags: ['lesson'] });
      expect(res).toEqual({ ok: true, reason: '', id: A });
      expect(insert).toHaveBeenCalledTimes(1);
      expect(insert.mock.calls[0][0].tags).toEqual(['lesson']);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = had;
    }
  });

  it('the 0243 trigger rings on exactly what the app writes', () => {
    const sql = read('infra/supabase/migrations-auto/0243-the-lesson-builder-rings-on-the-words-keeps-every-version-and-reads-the-decision.sql');
    expect(sql).toContain(`NEW.tags @> '["lesson"]'::jsonb`);
    expect(sql).toContain(`PERFORM pg_notify('lesson_inbox', NEW.id::text)`);
    expect(sql).toMatch(/AFTER INSERT OR UPDATE OF tags ON agent_inbox/);
    expect(read('app/src/components/OneVoiceInput.jsx')).toMatch(/relayThought\(\{ body: t, tags: \['lesson'/);
  });

  it('PROVEN TO CATCH: no browser code holds a dispatch to GitHub (the NAS rings)', () => {
    const src = read('app/src/lib/agent-inbox-sync.js');
    expect(src).not.toMatch(/api\.github\.com|repository_dispatch|dispatches/);
    expect(src).toContain('THE LESSON BELL (DR-0697)');
  });

  it('the NAS listener sends the lesson-saved dispatch from the notification', () => {
    const py = read('infra/nas-lesson-builder/lesson_builder.py');
    expect(py).toContain('BELL_EVENT = "lesson-saved"');
    expect(py).toMatch(/if self\.bell is not None and job_of\(payload\)\[0\] == "row":\s*\n\s*self\.bell\.ring\(\)/);
  });
});
