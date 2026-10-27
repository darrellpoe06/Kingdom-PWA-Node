// =============================================================================
// lesson-inbox-bell.test — the bell replaces the hourly AI timer (DR-0725)
// =============================================================================
// Darrell 2026-09-30: "I don't like timers... they cost more than we need...
// don't we have a better solution/s?" and 2026-10-01: "Why can't it just be
// triggered by me doing the lesson so it's not a timer!!!!!"
// Proves: the bell's decision (ring only on a changed waiting set, never a
// body, under a per-day cap); the workflow's triggers (no schedule) and
// brakes; the 0243 NOTIFY payloads carry no body; the app's lesson save is the
// ring (the insert the 0243 trigger rings on) and sends nothing else; and no
// merge lane ever touches `bell/*`.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseWaiting, decide, formatComment, lastRungKeys, waitingKeys, ringsToday, MARKER, MAX_PER_DAY,
  milestone, progressOf, formatStatus, parseVersions, parsePrs, humanSeconds, staleAlarms,
  shippedButUnmarked } from '../../../scripts/lesson-inbox-bell.mjs';

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
    expect(decide(two, [body])).toMatchObject({ post: true, reason: 'a row reached a new milestone', waiting: 2 });
    expect(decide([], [body])).toMatchObject({ post: false, reason: 'nothing in flight' });
    // a row leaving the set (captured by the intake) is not news
    const both = formatComment(two, waitingKeys(two));
    expect(decide(one, [both])).toMatchObject({ post: false, reason: 'nothing changed since the last ring' });
  });

  it('PROVEN TO CATCH: a row the NAS tried and handed back rings again; bookkeeping tags do not', () => {
    const before = parseWaiting(line(A, ['lesson']));
    const body = formatComment(before, waitingKeys(before));
    const mirrored = parseWaiting(line(A, ['lesson', 'mirrored', 'build:0123abcd']));
    expect(decide(mirrored, [body]).post).toBe(false);
    const failed = parseWaiting(line(A, ['lesson', 'build:claimed@2026-09-30T12:01:00Z', 'build:failed@2026-09-30T12:09:00Z', 'build-failed']));
    expect(decide(failed, [body]).post).toBe(true);
  });

  it('PROVEN TO CATCH (DR-0771): a stale alarm on a waiting row is new news, the comment names it, a handed-back row keeps both counts', () => {
    const base = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', created_by: 'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc', created_at: '2026-10-04T13:50:31Z' };
    const quiet = [{ ...base, tags: ['lesson', 'voice'] }];
    const first = decide(quiet, [], { now: Date.parse('2026-10-07T04:00:00Z') });
    expect(first.post).toBe(true);
    const rang = [{ body: formatComment(quiet, first.keys), created_at: '2026-10-04T13:51:00Z' }];
    expect(decide(quiet, rang, { now: Date.parse('2026-10-07T04:00:00Z') }).post).toBe(false);
    // 0252 writes the alarm FIELD on the row: the milestone changes, the bell rings again.
    const alarmed = [{ ...base, tags: ['lesson', 'voice', 'stale-alarm@2026-10-07T04:00:00Z'] }];
    expect(milestone(alarmed[0].tags)).toBe('waiting#s1');
    const again = decide(alarmed, rang, { now: Date.parse('2026-10-07T04:00:10Z') });
    expect(again.post, 'the alarm tag did not ring the bell').toBe(true);
    const body = formatComment(alarmed, again.keys, { now: Date.parse('2026-10-07T04:00:10Z') });
    expect(body).toMatch(/1 past the stale alarm/);
    expect(body).toMatch(/ALARM rang 1× \(last 2026-10-07T04:00:00Z\), waited 62 h/);
    // A second alarm is news again; a handed-back row carries both counts.
    expect(milestone(['lesson', 'stale-alarm@2026-10-07T04:00:00Z', 'stale-alarm@2026-10-08T04:00:00Z'])).toBe('waiting#s2');
    expect(milestone(['lesson', 'build:claimed@2026-10-04T14:04:36Z', 'build:failed@2026-10-04T14:04:44Z', 'stale-alarm@2026-10-07T04:00:00Z'])).toBe('waiting#b2#s1');
    expect(staleAlarms(['lesson', 'stale-alarm@2026-10-08T04:00:00Z', 'stale-alarm@2026-10-07T04:00:00Z', 'stale-alarm@nope'])).toEqual(['2026-10-07T04:00:00Z', '2026-10-08T04:00:00Z']);
  });

  it('PROVEN TO CATCH: no body ever reaches the comment, even if one were in the input', () => {
    const rows = parseWaiting(line(A, ['lesson']));
    rows[0].body = 'THE SECRET WORDS OF THE LESSON';
    const out = formatComment(rows, waitingKeys(rows));
    expect(out).not.toContain('SECRET');
    expect(Object.keys(parseWaiting(line(A, ['lesson']))[0]).sort()).toEqual(['created_at', 'created_by', 'id', 'tags']);
    expect(out).toContain('at `2026-09-30 12:00:00+00`');
    // a tag that could close the marker or inject markup is dropped
    const evil = parseWaiting(line(A, ['lesson', 'x --> <b>', '`boom`']));
    expect(evil[0].tags).toEqual(['lesson']);
    // free-text tags (a build-reason: can quote anything) never reach the bell
    expect(parseWaiting(line(A, ['lesson', 'build-reason:the words of a lesson']))[0].tags).toEqual(['lesson']);
    expect(out).toContain(A);
    expect(out).toContain(WHO);
    expect(out).toContain(`<!-- ${MARKER} keys=${A}|waiting -->`);
  });

  it('reads only its own marker, and the newest one (bodies or { body, created_at })', () => {
    expect(lastRungKeys(['hello'])).toBeNull();
    expect(lastRungKeys([`<!-- ${MARKER} keys=${A} -->`, `<!-- ${MARKER} keys=${A},${B} -->`])).toEqual([A, B]);
    expect(lastRungKeys([{ body: `<!-- ${MARKER} keys=${B} -->`, created_at: '2026-10-01T00:00:00Z' }])).toEqual([B]);
  });

  it('PROVEN TO CATCH: the per-day cap holds the ring (never more wakes than the hourly Routine)', () => {
    expect(MAX_PER_DAY).toBe(24);
    const now = Date.parse('2026-10-01T12:00:00Z');
    const rung = (i, at) => ({ body: `x <!-- ${MARKER} keys=k${i} -->`, created_at: at });
    const recent = Array.from({ length: 3 }, (_, i) => rung(i, '2026-10-01T06:00:00Z'));
    const old = Array.from({ length: 5 }, (_, i) => rung(i + 10, '2026-09-29T06:00:00Z'));
    expect(ringsToday([...old, ...recent, { body: 'not ours', created_at: '2026-10-01T06:00:00Z' }], now)).toBe(3);
    const rows = parseWaiting(line(A, ['lesson']));
    expect(decide(rows, [...old, ...recent], { maxPerDay: 3, now })).toMatchObject({ post: false, today: 3 });
    expect(decide(rows, [...old, ...recent], { maxPerDay: 4, now })).toMatchObject({ post: true, today: 3 });
    expect(decide(rows, old, { maxPerDay: 3, now })).toMatchObject({ post: true, today: 0 });
  });

  it('PROVEN TO CATCH: every query selects the body only as a length, and never a prompt', () => {
    for (const f of ['scripts/lesson-inbox-waiting.sql', 'scripts/lesson-inbox-progress.sql']) {
      const sql = read(f).replace(/^--.*$/gm, '');
      expect(sql).toMatch(/length\(coalesce\(body,''\)\)/);
      expect(sql.replace(/length\(coalesce\(body,''\)\)/, '')).not.toMatch(/\bbody\b/);
    }
    const v = read('scripts/lesson-builder-versions.sql').replace(/^--.*$/gm, '');
    expect(v).not.toMatch(/\bbody\b|prompt_text|prompt_sha256/);
    const sh = read('scripts/lesson-builder-status.sh');
    expect(sh).toContain('lesson-inbox-progress.sql');
    expect(sh).toContain('lesson-builder-versions.sql');
    expect(sh).not.toMatch(/SELECT[^;]*\bbody\b/);
  });
});

const C = 'build:claimed@2026-10-01T01:00:30Z';
const G = 'build:gated@2026-10-01T01:21:00Z';
const GROUP = '33333333-3333-4333-8333-333333333333';

describe('the bell reports progress, milestone by milestone (DR-0725: "how long?")', () => {
  const NOW = Date.parse('2026-10-01T01:30:30Z');
  const at = (tags) => parseWaiting(line(A, tags));

  it('PROVEN TO CATCH: each milestone is new news, a re-tag is not', () => {
    expect(milestone(['lesson'])).toBe('waiting');
    expect(milestone(['lesson', 'lesson-building', C])).toBe('building');
    expect(milestone(['lesson', 'lesson-building', 'build:gated@2026-09-30T01:00:00Z', C])).toBe('building');
    expect(milestone(['lesson', 'lesson-building', C, G])).toBe('gated');
    expect(milestone(['lesson', 'awaiting-review', C, G])).toBe('awaiting-review');
    expect(milestone(['lesson', 'lesson-captured', 'lesson-published', 'build:published@2026-10-01T01:40:00Z'])).toBe('shipped');
    expect(milestone(['thought'])).toBeNull();
    let prev = [];
    for (const tags of [['lesson'], ['lesson', 'lesson-building', C], ['lesson', 'lesson-building', C, G],
      ['lesson', 'lesson-captured', 'lesson-published', C, G, 'build:published@2026-10-01T01:40:00Z']]) {
      const rows = at(tags);
      expect(decide(rows, prev, { now: NOW }).post).toBe(true);
      prev = [{ body: formatComment(rows, waitingKeys(rows), { now: NOW }), created_at: '2026-10-01T01:00:00Z' }];
      expect(decide(at([...tags, 'mirrored']), prev, { now: NOW }).post).toBe(false);
    }
  });

  it('a building row shows its start, elapsed time, attempt and writer; never a body', () => {
    const rows = at(['lesson', 'build:claimed@2026-09-30T23:00:00Z', 'build:failed@2026-09-30T23:30:00Z', 'build-failed',
      'lesson-building', C, 'build:writing@2026-10-01T01:02:00Z', 'build-writer:claude-cli', 'build-reason:the words of a lesson']);
    rows[0].body = 'THE SECRET WORDS';
    const p = progressOf(rows[0], { now: NOW });
    expect(p).toMatchObject({ milestone: 'building', started: '2026-10-01T01:00:30Z', elapsed: 1800, attempt: 2, writers: ['claude-cli'] });
    const out = formatComment(rows, waitingKeys(rows), { now: NOW });
    expect(out).toContain('**building on the NAS** · started `2026-10-01T01:00:30Z` · elapsed 30 min 0 s · attempt 2');
    expect(out).not.toMatch(/SECRET|the words of a lesson/);
    expect(out).toContain('0 waiting for the intake · 1 building on the NAS');
  });

  it('gates and the PR show once the NAS reports them', () => {
    const versions = parseVersions([`${GROUP}|claude-cli|true|f|2026-10-01 01:20:00+00`, `${GROUP}|gemini|false|f|x`, 'junk|x|y|z'].join('\n'));
    expect(versions).toHaveLength(2);
    const prs = parsePrs(JSON.stringify([
      { number: 1901, url: 'https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/1901', headRefName: 'claude/lesson-l230-the-keeper', state: 'OPEN' },
      { number: 5, url: 'javascript:alert(1)', headRefName: 'claude/lesson-l230-x', state: 'OPEN' },
    ]));
    expect(prs.map((p) => p.number)).toEqual([1901]);
    const rows = at(['lesson', 'lesson-captured', 'lesson-published', C, `build-group:${GROUP}`, G, 'build-lesson:L230',
      'build-writer:claude-cli', 'lesson-id:the-keeper', 'build:published@2026-10-01T01:40:00Z']);
    const out = formatComment(rows, waitingKeys(rows), { versions, prs, now: NOW });
    expect(out).toContain('gates: claude-cli passed, gemini failed');
    expect(out).toContain('PR #1901 (open)');
    expect(out).toContain('1 shipped in the last day');
  });

  it('the status print names the service, each writer and every row in flight', () => {
    const rows = at(['lesson', 'lesson-building', C, 'build-writer:claude-cli']);
    const out = formatStatus(rows, { now: NOW }, { state: 'ready', at: '2026-10-01T01:00:31Z', push_credential: 'present', reachable: ['claude-cli'],
      writers: [{ writer: 'claude-cli', kind: 'cli', primary: true, ok: true, why: 'signed in' }] });
    expect(out).toContain('state: ready');
    expect(out).toContain('writer claude-cli (cli, primary): ok -- signed in');
    expect(out).toContain('building on the NAS; started 2026-10-01T01:00:30Z; elapsed 30 min 0 s; attempt 1');
    expect(out).toContain('stages: claimed@2026-10-01T01:00:30Z');
    expect(formatStatus([], {}, null)).toContain('state: unknown');
    expect(humanSeconds(3725)).toBe('1 h 2 min');
    const recent = parseWaiting(line(B, ['lesson', 'lesson-captured', 'build:abc1234', 'build-reason:words']));
    const r = formatStatus([], { now: NOW, recent }, null);
    expect(r).toContain('lesson rows made in the last day, any state: 1');
    expect(r).toContain(`${B}  made 2026-09-30 12:00:00+00  captured  [lesson-captured]`);
    const sql = read('scripts/lesson-inbox-recent.sql').replace(/^--.*$/gm, '');
    expect(sql.replace(/length\(coalesce\(body,''\)\)/, '')).not.toMatch(/\bbody\b/);
  });

  it('a shipped row names the lesson it became, on the line (DR-1187)', () => {
    // The real row a6f86a58 on 2026-10-21 printed `shipped ... [build-failed]`
    // and said nothing about what it became. It had shipped -- as ll257, at
    // 08:08 -- but answering that took six lookups, because `lesson-id:<id>`
    // is the one tag the mark filter dropped: its `$` anchor could not match
    // an id behind a colon. The id belongs on the line that raises the doubt.
    const shipped = parseWaiting(line(B, ['lesson', 'lesson-captured', 'lesson-published',
      'lesson-id:ll257-ten-christmases-left', 'build-failed', 'mirrored',
      'build:failed@2026-10-21T03:39:34Z', 'build-reason:the first attempt stopped']));
    const out = formatStatus([], { now: NOW, recent: shipped }, null);
    expect(out).toContain('lesson-id:ll257-ten-christmases-left');
    // It still reads as shipped, because it is: lesson-published is only ever
    // written after the push succeeds (lesson_builder.py).
    expect(out).toContain(`${B}  made 2026-09-30 12:00:00+00  shipped`);
    // Never a body, and never the reason text -- unchanged by this.
    expect(out).not.toMatch(/the first attempt stopped/);
  });

  it('PROVEN TO CATCH: the lesson id is not swallowed by the plainer lesson- rule', () => {
    // `lesson-[a-z-]+$` cannot match `lesson-id:ll257...`, so if the new
    // alternative were dropped the id would silently vanish again -- the
    // failure is an ABSENCE, which is the kind a test has to assert for.
    const marks = (tags) => {
      const out = formatStatus([], { now: NOW, recent: parseWaiting(line(B, tags)) }, null);
      const m = out.match(/\[([^\]]*)\]/);
      return (m ? m[1] : '').split(', ').filter(Boolean);
    };
    expect(marks(['lesson', 'lesson-published', 'lesson-id:ll257-x'])).toContain('lesson-id:ll257-x');
    // A malformed id is still not printed: the filter stays a whitelist.
    expect(marks(['lesson', 'lesson-published', 'lesson-id:has a space'])).not.toContain('lesson-id:has a space');
    expect(marks(['lesson', 'lesson-published'])).toEqual(['lesson-published']);
  });
});

describe('the bell workflow: triggers and brakes', () => {
  const y = WF('lesson-inbox-bell.yml');
  it('PROVEN TO CATCH: rings on the lesson-waiting dispatch (and by hand), never on a clock', () => {
    expect(y).toMatch(/repository_dispatch:\s*\n\s*types: \[lesson-waiting\]/);
    expect(y).toMatch(/\n {2}workflow_dispatch:/);
    expect(y).not.toMatch(/^\s*schedule:/m);
    expect(y).not.toMatch(/- cron:/);
  });
  it('the dispatch payload reaches the shell only through env, filtered to ids', () => {
    expect(y).not.toMatch(/run: \|[\s\S]*?\$\{\{ github\.event\.client_payload/);
    expect(y).toContain('RANG_IDS: ${{ toJSON(github.event.client_payload.ids) }}');
  });
  it('a proof insert ends its run, so the comment that follows is the NAS dispatch', () => {
    for (const step of ['Which lesson rows are in flight', "The bell's own last comments", 'Ring only on change']) {
      const at = y.indexOf(`- name: ${step}`);
      expect(at).toBeGreaterThan(0);
      expect(y.slice(at, at + 200)).toContain("if: ${{ env.PROOF != 'insert' }}");
    }
    expect(y).toContain("LESSON_BELL_MAX_PER_DAY: ${{ vars.LESSON_BELL_MAX_PER_DAY || '24' }}");
    expect(y).toContain('{body, created_at}');
  });
  it('carries its lock, its budget and its kill', () => {
    expect(y).toMatch(/concurrency:\s*\n\s*group: lesson-inbox-bell\s*\n\s*cancel-in-progress: false/);
    expect(y).toMatch(/timeout-minutes: 5/);
    expect(y).toContain("if: ${{ vars.LESSON_BELL != 'off' }}");
  });
  it('reads through the shared status script and decides with the tested script', () => {
    expect(y).toContain('bash scripts/lesson-builder-status.sh bell');
    expect(WF('inbox-lessons-waiting.yml')).toContain('< scripts/lesson-inbox-waiting.sql');
    expect(y).toContain('node scripts/lesson-inbox-bell.mjs --rows bell/rows.txt --versions bell/versions.txt --prs bell/prs.json');
    expect(y).toMatch(/if \[ "\$\(echo "\$D" \| jq -r \.post\)" = "true" \]/);
  });
  it('the proof delete removes only the labelled proof rows', () => {
    expect(y).toMatch(/DELETE FROM public\.agent_inbox WHERE tags \? 'bell-proof' AND source = 'bell-proof'/);
  });
});

describe("the builder's progress is printed on the NAS road (read-only)", () => {
  it('inbox-lessons-waiting prints the service status and every row in flight', () => {
    const w = WF('inbox-lessons-waiting.yml');
    expect(w).toContain('bash scripts/lesson-builder-status.sh status --nas');
    expect(w).toContain('node scripts/lesson-inbox-bell.mjs --status');
    expect(w).not.toMatch(/INSERT|UPDATE|DELETE/);
    // It used to ban `issues: write` too, as a proxy for "this workflow
    // mutates nothing". DR-1186 gave it a rolling run log -- the way six
    // existing witnesses in this repository record themselves -- so the proxy
    // is replaced by the thing it was standing in for, stated exactly. The
    // guarantees that MATTER are unchanged and now pinned individually:
    // nothing in the database, nothing in the repository, nothing on a PR.
    expect(w).not.toMatch(/pull-requests: write|contents: write/);
    expect(w).toMatch(/^ {2}contents: read$/m);
    expect(w).toMatch(/^ {2}pull-requests: read$/m);
    // And the ONE write it may now make is to its own log, by name. This is
    // stricter than the old blanket ban, not looser: that ban said nothing
    // about what a write would be if the permission were ever granted.
    expect(w).not.toMatch(/\bgit push\b|\bgit commit\b|\bgh pr\b|\bgh release\b|--method\s+(PUT|POST|PATCH|DELETE)/);
    const ghWrites = [...w.matchAll(/\bgh (issue|pr|api|release) (\w+)/g)].map((m) => `${m[1]} ${m[2]}`);
    expect(new Set(ghWrites)).toEqual(new Set(['issue list', 'issue comment', 'issue create']));
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
    // The lane's filter is read as written (one jq test() over headRefName) and
    // exercised as a regex: lane heads in, the bell's branch out. DR-0773 added
    // the cloud session's ccr- prefix beside claude/ (the anchor stays on each).
    const m = /select\(\.headRefName \| test\("([^"]+)"\)\)/.exec(WF('auto-merge.yml'));
    expect(m).toBeTruthy();
    const lane = new RegExp(m[1]);
    expect(lane.test('bell/lesson-inbox')).toBe(false);
    expect(lane.test('claude/x')).toBe(true);
    expect(lane.test('ccr-916ff311-lgoc4v')).toBe(true);
    expect(lane.test('xccr-anything')).toBe(false);
    expect(lane.test('main')).toBe(false);
    const keep = WF('keep-prs-current.yml');
    expect(keep).toContain('startswith(\\"claude/\\")');
    expect(keep).toContain('startswith(\\"ccr-\\")');
    expect(keep).not.toContain('startswith(\\"bell/\\")');
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
      expect(insert.mock.calls[0][0].tags).toContain('lesson');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = had;
    }
  });

  it('PROVEN TO CATCH: every 0243 NOTIFY payload is an id or a fixed word, never a body', () => {
    const sql = read('infra/supabase/migrations-auto/0243-the-lesson-builder-rings-on-the-words-keeps-every-version-and-reads-the-decision.sql');
    const calls = [...sql.matchAll(/pg_notify\(\s*'lesson_inbox'\s*,\s*([^;]+?)\);/g)].map((m) => m[1].trim());
    expect(calls).toEqual(["NEW.id::text", "'decision:' || NEW.id::text", "'backfill'"]);
    for (const c of calls) expect(c).not.toMatch(/body|prompt|NEW\.(?!id\b)/);
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
    expect(src).toContain('THE LESSON BELL (DR-0725)');
  });

  it('the NAS listener sends the lesson-waiting dispatch from the notification, row ids only', () => {
    const py = read('infra/nas-lesson-builder/lesson_builder.py');
    expect(py).toContain('BELL_EVENT = "lesson-waiting"');
    expect(py).toMatch(/if self\.bell is not None and job_of\(payload\)\[0\] in \("row", "sweep", "stage"\):\s*\n\s*self\._ring_bell\(job_of\(payload\)\)/);
    expect(py).toContain('"client_payload": {"source": "nas-lesson-builder", "ids": sorted(ids)}');
    // the bell reads tags only, never a body
    expect(py).toContain('SELECT tags FROM public.agent_inbox WHERE id = CAST(:id AS uuid)');
    expect(py).toMatch(/"SELECT id::text, tags FROM public\.agent_inbox WHERE tags \? 'lesson'/);
  });
});

describe('a shipped lesson does not go on waiting (DR-1250)', () => {
  // MEASURED 2026-10-27: the bell said "12 waiting", oldest 110h, and FOUR were
  // already built, merged and live -- their `lesson-captured` tag was never
  // written, and that tag IS the builder's lock, so the NAS builder re-claimed
  // and rebuilt each one every hour. These are the real ids and records.
  const row = (id, tags) => ({ id, created_by: 'c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc', tags });
  const WAITING = ['lesson', 'build:failed@2026-10-27T03:31:12Z'];
  const REAL = [
    ['031a898a-b98b-484e-8d06-0962dede6316', 'DR-1234-add-not-diminish-not-the-giants-and-the-edge-of-what-is-written-l261.md'],
    ['bee78650-c5bc-4701-9cb9-85a8faef8770', 'DR-1234-add-not-diminish-not-the-giants-and-the-edge-of-what-is-written-l261.md'],
    ['0593ae29-1547-46d8-b608-34ae8b09953e', 'DR-1223-nicaea-did-not-invent-him-the-word-said-it-first-l262.md'],
    ['6130c486-a7c0-4a8e-978d-a37ad1533b79', 'DR-1227-not-one-stone-the-word-jesus-spoke-over-jerusalem-l263.md'],
  ];
  const records = REAL.map(([id, file]) => ({ file: `docs/decisions/${file}`, text: `built from agent_inbox row \`${id}\`` }));

  it('names every waiting row whose teaching is already recorded', () => {
    const rows = REAL.map(([id]) => row(id, WAITING));
    const found = shippedButUnmarked(rows, records);
    expect(found.map((f) => f.id).sort()).toEqual(REAL.map(([id]) => id).sort());
    // and it says WHICH record, so the tag call needs no second search
    expect(found.find((f) => f.id.startsWith('0593ae29')).record).toMatch(/^DR-1223-/);
  });

  it('says nothing about a row that is genuinely unbuilt', () => {
    expect(shippedButUnmarked([row('60972a31-db63-4959-8a50-ee58a28643d4', WAITING)], records)).toEqual([]);
  });

  it('a prefix is not a match — a false positive would strand a teaching forever', () => {
    // A record that quotes only the first hex block must NOT count. Reporting a
    // teaching as already shipped is how one never gets built at all.
    const partial = [{ file: 'docs/decisions/DR-0001-x.md', text: 'see 0593ae29 and 6130c486' }];
    expect(shippedButUnmarked(REAL.map(([id]) => row(id, WAITING)), partial)).toEqual([]);
  });

  it('only the WAITING queue counts — a build holding a row is not this defect', () => {
    const held = row(REAL[0][0], ['lesson', 'lesson-building']);
    const reviewed = row(REAL[2][0], ['lesson', 'awaiting-review']);
    expect(shippedButUnmarked([held, reviewed], records)).toEqual([]);
  });

  it('a malformed id is ignored rather than guessed at', () => {
    expect(shippedButUnmarked([row('not-a-uuid', WAITING), row('', WAITING)], records)).toEqual([]);
    expect(shippedButUnmarked([row(REAL[0][0], WAITING)], [])).toEqual([]);
    expect(shippedButUnmarked([], records)).toEqual([]);
  });

  it('the comment names them, with the remedy, above the generic advice', () => {
    const rows = [row(REAL[0][0], WAITING), row('60972a31-db63-4959-8a50-ee58a28643d4', WAITING)];
    const out = formatComment(rows, [], { records });
    expect(out).toMatch(/1 of these ALREADY SHIPPED and was never tagged/);
    expect(out).toMatch(/Tag it with/); // singular reads as English, not as a template

    expect(out).toContain(REAL[0][0]);
    expect(out).toContain('DR-1234-');
    expect(out).toMatch(/inbox-lesson-tag\.yml/);
    // the duplicate hazard is stated, not just the waste
    expect(out).toMatch(/duplicate/);
    // and it sits ABOVE the generic "rows waiting" advice
    expect(out.indexOf('ALREADY SHIPPED')).toBeLessThan(out.indexOf('Rows waiting for the intake'));
  });

  it('reads as English for more than one, because the real case was four', () => {
    const rows = [row(REAL[0][0], WAITING), row(REAL[2][0], WAITING)];
    const out = formatComment(rows, [], { records });
    expect(out).toMatch(/2 of these ALREADY SHIPPED and were never tagged/);
    expect(out).toMatch(/Tag each with/);
  });

  it('with no records given, the comment is exactly what it was before', () => {
    const rows = [row(REAL[0][0], WAITING)];
    expect(formatComment(rows, [])).not.toMatch(/ALREADY SHIPPED/);
  });
});
