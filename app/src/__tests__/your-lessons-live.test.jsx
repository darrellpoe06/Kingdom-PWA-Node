// =============================================================================
// Your lessons, live — each lesson from arrival to live, and every writer's
// version side by side (DR-0672)
// =============================================================================
// Pins: the stage derivation (a stage is done only on evidence; times are
// real; elapsed is measured), the tenancy guard (never another member's rows),
// the live PR read (reusing the OpsBoard's reads), the compare view (same
// prompt proven, gates as measured, the shipped one and why, where they
// differ), and the render. Proven-to-catch cases are named in each test.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonItems, ownLessonRows, fetchMyLessons, GOVERNOR_LESSON_ACCOUNTS } from '../lib/lesson-inbox.js';
import { deriveLessonPipeline, fetchLessonPrs, lessonPrOf, lessonIdOf, findLessonInCatalog, formatSpan, MAX_DIRECT_PR_READS } from '../lib/lesson-pipeline.js';
import {
  LESSON_VERSION_COLUMNS, extractRefs, normalizeVersion, promptProof, compareVersions, shippedOf, readGates,
  mayCompareVersions, fetchLessonVersions, groupByTeaching, versionsForItem,
} from '../lib/lesson-versions.js';
import LessonInbox from '../components/LessonInbox.jsx';
import LessonVersionsCompare from '../components/LessonVersionsCompare.jsx';
import LessonReviewQueue from '../components/LessonReviewQueue.jsx';
import {
  LESSON_DECISION_COLUMNS, scriptureSpans, splitLocked, editSegment, joinSegments, editKeepsScripture,
  partsFor, partOf, defaultPicks, composeLesson, buildDecision, gateFailures, reviewState, publishDecision,
} from '../lib/lesson-decisions.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const [DESK, PHONE] = GOVERNOR_LESSON_ACCOUNTS;
const MEMBER = '99999999-0000-4000-a000-000000000001';
const OTHER = '99999999-0000-4000-a000-000000000002';
const CATALOG = [{ courseKey: 'living-lessons', lessonId: 'll200-rest-of-the-word', title: 'The Rest of the Word' }];

const spoken = (id, by, at, extra = []) => ({ id, body: 'Lesson. A spoken lesson (1:00)…', tags: ['lesson', 'voice', `audio:${by}/${id}.webm`, ...extra], created_at: at, created_by: by });
const transcript = (id, of, by, at, extra = []) => ({ id, body: 'Lesson. A spoken lesson, transcribed.\n\nCome unto me and I will give you rest.', tags: ['lesson', 'voice-transcript', `of:${of}`, 'whisper:nas-cpu', ...extra], created_at: at, created_by: by });
const typed = (id, by, at, extra = []) => ({ id, body: 'Lesson. Be ye doers of the word.', tags: ['lesson', ...extra], created_at: at, created_by: by });
const byStage = (road) => Object.fromEntries(road.stages.map((s) => [s.key, s.status]));

// --- 1. THE STAGES, DERIVED FROM REAL STATE ---------------------------------
describe('the road — each stage done only on evidence', () => {
  it('a full road: recorded, words, built, PR, live — each with its time and how long it took', () => {
    const [item] = lessonItems([
      spoken('v1', DESK, '2026-09-29T10:00:00Z'),
      transcript('t1', 'v1', DESK, '2026-09-29T10:06:00Z', ['mirrored', 'lesson-captured', 'lesson-pr:1901', 'lesson-id:ll200-rest-of-the-word']),
    ]);
    const prs = { 1901: { number: 1901, createdAt: '2026-09-29T11:00:00Z', mergedAt: '2026-09-29T11:12:00Z', state: 'closed' } };
    const road = deriveLessonPipeline(item, { prs, owner: true, catalog: CATALOG });
    expect(byStage(road)).toEqual({ recorded: 'done', words: 'done', building: 'done', pr: 'done', live: 'done' });
    const at = Object.fromEntries(road.stages.map((s) => [s.key, [s.at, s.elapsed]]));
    expect(at.recorded).toEqual(['2026-09-29T10:00:00Z', null]);
    expect(at.words).toEqual(['2026-09-29T10:06:00Z', '6 min']);
    // Captured has no time of its own; the PR opening is the push, so it is the time.
    expect(at.building).toEqual(['2026-09-29T11:00:00Z', '54 min']);
    expect(at.pr[1]).toBe(null); // same moment as the push: no invented gap
    expect(at.live).toEqual(['2026-09-29T11:12:00Z', '12 min']);
    expect(road.total).toBe('1 h 12 min');
    expect(road.lesson.href).toMatch(/lesson=ll200-rest-of-the-word/);
    expect(road.stages[1].line).toMatch(/the NAS CPU/);
  });

  it('PROVEN-TO-CATCH: merged is not live — a lesson not in the running build never reads live', () => {
    // Before this rule a merged PR would have painted "Live". The evidence is
    // the lesson in THIS build's catalog; merged alone is "waiting".
    const [item] = lessonItems([typed('x1', DESK, '2026-09-29T09:00:00Z', ['lesson-captured', 'lesson-pr:1902', 'lesson-id:ll999-not-deployed'])]);
    const prs = { 1902: { number: 1902, createdAt: '2026-09-29T09:30:00Z', mergedAt: '2026-09-29T09:40:00Z', state: 'closed' } };
    const road = deriveLessonPipeline(item, { prs, owner: true, catalog: CATALOG });
    expect(byStage(road).live).toBe('waiting');
    expect(road.stages[4].line).toMatch(/not in the build you are running/);
    expect(road.total).toBe(null);
  });

  it('with no progress reported, building is unknown and says so; nothing is painted', () => {
    const [item] = lessonItems([typed('x2', DESK, '2026-09-29T09:00:00Z', ['mirrored'])]);
    const road = deriveLessonPipeline(item, { owner: true, catalog: CATALOG });
    expect(byStage(road)).toEqual({ recorded: 'done', words: 'done', building: 'unknown', pr: 'waiting', live: 'waiting' });
    expect(road.stages[2].line).toMatch(/Handed to the lesson builder\. It has not reported back/);
    expect(road.stages.filter((s) => s.at).map((s) => s.key)).toEqual(['recorded', 'words']);
    expect(road.current.key).toBe('building');
  });

  it('DR-0771: the stale alarm is read from the row\'s own field, count and last time; a row never alarmed shows none', () => {
    const [plain] = lessonItems([spoken('s0', DESK, '2026-10-04T13:50:31Z')]);
    expect(plain.stale).toEqual({ count: 0, lastAt: '' });
    const [rung] = lessonItems([spoken('s1', DESK, '2026-10-04T13:50:31Z', ['stale-alarm@2026-10-07T04:00:00Z', 'stale-alarm@2026-10-08T04:00:00Z', 'stale-alarm@garbage'])]);
    expect(rung.stale).toEqual({ count: 2, lastAt: '2026-10-08T04:00:00Z' });
  });

  it('a spoken lesson waiting for Whisper waits; a failed one says why and stops', () => {
    const [waiting] = lessonItems([spoken('v2', DESK, '2026-09-29T09:00:00Z')]);
    expect(byStage(deriveLessonPipeline(waiting, { owner: true, catalog: CATALOG }))).toMatchObject({ words: 'waiting', building: 'waiting' });
    const [failed] = lessonItems([
      spoken('v3', DESK, '2026-09-29T09:00:00Z', ['voice-failed']),
      { id: 'f3', body: 'No Whisper rung answered: the tower is dark.', tags: ['lesson', 'voice-failed', 'of:v3'], created_at: '2026-09-29T09:20:00Z', created_by: DESK },
    ]);
    const road = deriveLessonPipeline(failed, { owner: true, catalog: CATALOG });
    expect(byStage(road)).toMatchObject({ words: 'failed', building: 'stopped' });
    expect(road.failed).toBe(true);
    expect(road.failReason).toBe('No Whisper rung answered: the tower is dark.');
    expect(road.stages[1].elapsed).toBe('20 min');
  });

  it('a member waits for the Governor, and a decline stops the road', () => {
    const [waiting] = lessonItems([typed('m1', MEMBER, '2026-09-29T09:00:00Z')]);
    expect(deriveLessonPipeline(waiting, { owner: false, catalog: CATALOG }).stages[2]).toMatchObject({ status: 'waiting', line: expect.stringMatching(/Governor/) });
    const [declined] = lessonItems([typed('m2', MEMBER, '2026-09-29T09:00:00Z', ['lesson-declined'])]);
    expect(deriveLessonPipeline(declined, { owner: false, catalog: CATALOG }).stages[2].status).toBe('stopped');
  });

  it('a teaching that was already a lesson skips the PR; a closed-unmerged PR fails; an unreadable one is unknown', () => {
    const [cmp] = lessonItems([typed('c1', DESK, '2026-09-29T09:00:00Z', ['lesson-captured', 'parallel-compared'])]);
    expect(byStage(deriveLessonPipeline(cmp, { owner: true, catalog: CATALOG }))).toMatchObject({ building: 'done', pr: 'skipped', live: 'skipped' });
    const [closed] = lessonItems([typed('c2', DESK, '2026-09-29T09:00:00Z', ['lesson-captured', 'lesson-pr:77'])]);
    const r2 = deriveLessonPipeline(closed, { prs: { 77: { number: 77, createdAt: '2026-09-29T09:10:00Z', mergedAt: null, closedAt: '2026-09-29T09:20:00Z', state: 'closed' } }, owner: true, catalog: CATALOG });
    expect(byStage(r2)).toMatchObject({ pr: 'failed', live: 'stopped' });
    const r3 = deriveLessonPipeline(closed, { prs: {}, prRead: 'rate-limited', owner: true, catalog: CATALOG });
    expect(r3.stages[3]).toMatchObject({ status: 'unknown', line: expect.stringMatching(/could not be read just now \(rate-limited\)/) });
    const [noPr] = lessonItems([typed('c3', DESK, '2026-09-29T09:00:00Z', ['lesson-captured'])]);
    expect(deriveLessonPipeline(noPr, { owner: true, catalog: CATALOG }).stages[3]).toMatchObject({ status: 'unknown', line: expect.stringMatching(/did not name its PR/) });
  });

  it('reads the tags and spans plainly', () => {
    expect(lessonPrOf(['lesson-pr:#1901'])).toBe(1901);
    expect(lessonPrOf(['lesson-pr:abc'])).toBe(null);
    expect(lessonIdOf(['lesson-id:living-lessons/ll200-rest-of-the-word'])).toBe('living-lessons/ll200-rest-of-the-word');
    expect(findLessonInCatalog('living-lessons/ll200-rest-of-the-word', CATALOG).number).toBe('L200');
    expect(findLessonInCatalog('sovereign-ai/ll200-rest-of-the-word', CATALOG)).toBe(null);
    // The real catalog of this build carries L194 and the Sovereign A.I. weeks.
    expect(findLessonInCatalog('ll194-i-am-who-he-said-he-was-every-hearer-all-of-them')).toMatchObject({ courseKey: 'living-lessons', number: 'L194' });
    expect(findLessonInCatalog('sov29-the-agent-that-went-past-the-bound')).toMatchObject({ courseKey: 'sovereign-ai' });
    expect([formatSpan(20000), formatSpan(5 * 60000), formatSpan(26 * 3600000), formatSpan(-1)]).toEqual(['under a minute', '5 min', '1 d 2 h', null]);
  });
});

// --- 2. THE PR, READ LIVE THROUGH THE OPSBOARD'S READS ------------------------
describe('the PR state reuses the OpsBoard reads', () => {
  it('open PRs from fetchOps, merged from fetchDeliveryRecord, the rest one by one (capped)', async () => {
    const calls = [];
    const deps = {
      fetchOps: async () => ({ ok: true, pulls: [{ number: 10, createdAt: '2026-09-29T01:00:00Z' }, { number: 99 }] }),
      fetchDeliveryRecord: async () => ({ ok: true, merges: [{ number: 11, createdAt: '2026-09-28T01:00:00Z', mergedAt: '2026-09-28T02:00:00Z' }] }),
      getPull: async (n) => { calls.push(n); return { number: n, created_at: '2026-09-01T00:00:00Z', merged_at: null, closed_at: '2026-09-02T00:00:00Z', state: 'closed' }; },
    };
    const { prs, read } = await fetchLessonPrs([10, 11, 12, 13, 14, 15, 16, 12], deps);
    expect(read).toBe('ok');
    expect(prs[10]).toMatchObject({ state: 'open', createdAt: '2026-09-29T01:00:00Z' });
    expect(prs[11]).toMatchObject({ mergedAt: '2026-09-28T02:00:00Z' });
    expect(calls).toEqual([12, 13, 14, 15].slice(0, MAX_DIRECT_PR_READS));
    expect(prs[99]).toBeUndefined();
  });
  it('no PR named, no GitHub read at all', async () => {
    let touched = 0;
    const r = await fetchLessonPrs([], { fetchOps: async () => { touched++; return {}; } });
    expect([r.prs, touched]).toEqual([{ byBranch: {} }, 0]);
  });
});

// --- 3. THE TENANCY GUARD ------------------------------------------------------
function fakeSb({ uid, email = '', rpcRows = null, rpcError = null, tableRows = [], versions = null, versionsError = null, decisions = [], insertError = null }) {
  const calls = { rpc: [], from: [], inserts: [] };
  const chain = (table) => {
    const st = { table, filters: [] };
    calls.from.push(st);
    const done = () => Promise.resolve(table === 'lesson_versions'
      ? { data: versionsError ? null : versions, error: versionsError }
      : table === 'lesson_decisions' ? { data: decisions, error: null } : { data: tableRows, error: null });
    const api = {
      select: (c) => { st.select = c; return api; },
      order: () => api, contains: (...a) => { st.filters.push(['contains', ...a]); return api; },
      eq: (...a) => { st.filters.push(['eq', ...a]); return api; }, in: (...a) => { st.filters.push(['in', ...a]); return api; },
      limit: done,
      insert: (row) => { calls.inserts.push([table, row]); return { select: () => Promise.resolve(insertError ? { data: null, error: insertError } : { data: [{ id: 'dec-1', status: 'pending', decided_at: '2026-09-29T12:00:00Z' }], error: null }) }; },
    };
    return api;
  };
  return {
    calls,
    from: chain,
    rpc: async (name, args) => { calls.rpc.push([name, args]); return rpcError ? { data: null, error: rpcError } : { data: rpcRows, error: null }; },
    auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid, email } } : null } }) },
  };
}

describe('the tenancy guard — never another member’s rows', () => {
  const mixed = [
    typed('a', MEMBER, '2026-09-29T09:00:00Z'),
    typed('b', OTHER, '2026-09-29T09:01:00Z'),
    typed('c', DESK, '2026-09-29T09:02:00Z'),
    typed('d', PHONE, '2026-09-29T09:03:00Z'),
  ];
  it('PROVEN-TO-CATCH: whatever a read returns, a member sees only their own', () => {
    // Remove the filter in ownLessonRows and this fails: the member would see b, c and d.
    expect(ownLessonRows(mixed, { uid: MEMBER, owner: false }).map((r) => r.id)).toEqual(['a']);
    expect(ownLessonRows(mixed, { uid: MEMBER, owner: true }).map((r) => r.id)).toEqual(['a']); // an owner flag alone widens nothing
  });
  it('the Governor sees both of his doors and never a member', () => {
    expect(ownLessonRows(mixed, { uid: PHONE, owner: true }).map((r) => r.id)).toEqual(['c', 'd']);
    expect(ownLessonRows(mixed, { uid: DESK, owner: true }).map((r) => r.id)).toEqual(['c', 'd']);
    expect(ownLessonRows(mixed, { uid: DESK, owner: false }).map((r) => r.id)).toEqual(['c']);
    expect(ownLessonRows(mixed, {})).toEqual([]);
    expect(ownLessonRows([{ id: 'z', tags: ['lesson'] }], { uid: MEMBER })).toEqual([]); // no author, not shown
  });
  it('reads through my_lesson_rows(), and falls back to the own-rows table read when 0241 is not there', async () => {
    const sb = fakeSb({ uid: MEMBER, rpcRows: mixed });
    const r = await fetchMyLessons({ supabase: sb });
    expect(sb.calls.rpc[0][0]).toBe('my_lesson_rows');
    expect(r.items.map((i) => i.id)).toEqual(['a']);
    const old = fakeSb({ uid: MEMBER, rpcError: { message: 'function public.my_lesson_rows does not exist' }, tableRows: mixed });
    const r2 = await fetchMyLessons({ supabase: old });
    expect(old.calls.from[0].filters).toEqual(expect.arrayContaining([['eq', 'created_by', MEMBER]]));
    expect(old.calls.from[0].select).toMatch(/created_by/);
    expect(r2.items.map((i) => i.id)).toEqual(['a']);
  });
  it('the database gate is written and proven in its own smoke (0241)', () => {
    const mig = readFileSync(join(REPO, 'infra/supabase/migrations-auto/0241-your-lessons-reads-the-governors-own-two-doors.sql'), 'utf8');
    expect(mig).toMatch(/is_lesson_governor\(\)\s+AND a\.created_by IN \(/);
    expect(mig).toMatch(/lesson_governor_emails\(\)/);
    expect(mig).not.toMatch(/DROP POLICY|CREATE POLICY/); // the read policy itself is untouched
    const smoke = readFileSync(join(REPO, 'infra/supabase/tests/0241-my-lesson-rows-smoke.sql'), 'utf8');
    expect(smoke).toMatch(/LEAK: member A read/);
    const leg = readFileSync(join(REPO, '.github/workflows/rls-isolation.yml'), 'utf8');
    expect(leg).toMatch(/0241-my-lesson-rows-smoke\.sql/);
  });
});

// --- 4. THE VERSIONS, COMPARED ---------------------------------------------------
const SHA = 'a'.repeat(64);
const vrow = (writer, model, extra = {}) => ({
  id: `ver-${writer}`, build_id: 'b0000000-0000-4000-a000-000000000001', teaching_row_id: 't1', instance_id: 'i1', lesson_id: 'll200-rest-of-the-word', writer, family: 'claude', model_label: model,
  prompt_sha256: SHA, prompt_text: 'THE STANDARD\n\nTHE TEACHING: Come unto me.',
  body: {
    verdict: 'lesson', title: `Rest by ${writer}`, anchor: { ref: 'Matthew 11:28; Hebrews 4:9' },
    lesson_intro: 'THE REST OF THE WORD.',
    movements: [{ title: 'Come unto Me', text: 'Matthew 11:28.' }, { title: 'The rest that remains', text: 'Hebrews 4:9-10.' }, { title: 'Enter in', text: 'Hebrews 4:11.' }],
    lesson_close: 'Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.',
  },
  gate_results: {
    structure: { passed: true, problems: [], counts: { movements: 3, bands: 4, quiz: 6 } },
    verse: { passed: true, spans: 3, verbatim: 3, faults: [], fault_count: 0, why: '' },
    quotation: { passed: true, problems: [] }, voice: { passed: true, problems: [] },
    repo_gates: { skipped: 'node is not on this machine' }, verse_passed: true, passed: true,
  },
  elapsed_ms: 42000, error: null, backfill: false, created_at: '2026-09-29T10:10:00Z', published: false, ...extra,
});

describe('the versions of one lesson, compared', () => {
  it('pins the lesson_versions shape to DR-0669\u2019s migration and the builder\u2019s own insert and gates, once they are on disk', () => {
    expect(LESSON_VERSION_COLUMNS).toEqual(['id', 'build_id', 'teaching_row_id', 'instance_id', 'lesson_id', 'writer', 'family', 'model_label', 'prompt_sha256', 'prompt_text', 'body', 'gate_results', 'elapsed_ms', 'error', 'published', 'backfill', 'created_at']);
    // The builder's own insert (DR-0669), once it is on disk: every column this
    // view reads is one it writes (id and created_at are the table's defaults).
    const builder = join(REPO, 'infra/nas-lesson-builder/lesson_builder.py');
    if (existsSync(builder)) {
      // The INSERT is written across adjacent Python string literals: join them.
      const insert = /INSERT INTO public\.lesson_versions \(([\s\S]*?)\) VALUES/.exec(readFileSync(builder, 'utf8'));
      expect(insert, 'lesson_builder.py no longer inserts into lesson_versions').not.toBe(null);
      const written = insert[1].replace(/"\s*"/g, '').replace(/"/g, '').split(',').map((c) => c.trim());
      for (const c of LESSON_VERSION_COLUMNS.filter((x) => x !== 'id' && x !== 'created_at')) expect(written, `the builder no longer writes ${c}`).toContain(c);
    }
    // And its gate record keeps the keys this view reads.
    const gates = join(REPO, 'infra/nas-lesson-builder/lesson_gates.py');
    if (existsSync(gates)) {
      const src = readFileSync(gates, 'utf8');
      for (const k of ['"structure"', '"verse"', '"quotation"', '"voice"', '"repo_gates"', '"verse_passed"', '"passed"', '"spans"', '"verbatim"', '"faults"', '"counts"']) expect(src, `lesson_gates.py no longer writes ${k}`).toContain(k);
    }
    // More than one migration may create lesson_versions: the tower parity
    // loop's 0240 (DR-0671) creates a narrower one if it runs first, and
    // DR-0669's own migration owns the table (ADD COLUMN IF NOT EXISTS). So the
    // pin is on the shape the database ENDS with, every CREATE body plus every
    // ADD COLUMN, once DR-0669's migration (its header names it) is on disk.
    const dir = join(REPO, 'infra/supabase/migrations-auto');
    const sqls = readdirSync(dir).sort().map((f) => readFileSync(join(dir, f), 'utf8'));
    const builderMigration = sqls.find((sql) => /\(DR-0669\)/.test(sql.split('\n').slice(0, 5).join('\n')) && /\blesson_versions\b/.test(sql));
    if (builderMigration) {
      const declared = new Set();
      for (const sql of sqls) {
        for (const m of sql.matchAll(/CREATE TABLE[^;(]*\blesson_versions\b\s*\(([\s\S]*?)\n\);/gi)) {
          for (const line of m[1].split('\n')) { const c = /^\s+([a-z_][a-z0-9_]*)\s/.exec(line); if (c) declared.add(c[1]); }
        }
        for (const m of sql.matchAll(/ALTER TABLE[^;]*\blesson_versions\b([^;]*);/gi)) {
          for (const c of m[1].matchAll(/ADD COLUMN IF NOT EXISTS\s+([a-z_][a-z0-9_]*)/gi)) declared.add(c[1]);
        }
      }
      for (const c of LESSON_VERSION_COLUMNS) expect([...declared], `lesson_versions is missing ${c}`).toContain(c);
    }
  });

  it('finds the verses each version names', () => {
    expect(extractRefs('See John 1:29, 1 Corinthians 13:1-3 and Song of Solomon 2:4; again John 1:29. Movement 2:3 is not a verse.'))
      .toEqual(['John 1:29', '1 Corinthians 13:1-3', 'Song of Solomon 2:4']);
  });

  it('PROVEN-TO-CATCH: a different prompt is said, never passed as the same', () => {
    const same = [vrow('claude-cli', 'claude-opus'), vrow('api', 'claude-sonnet')].map(normalizeVersion);
    expect(promptProof(same)).toMatchObject({ same: true, sha: SHA, count: 2 });
    const diff = [vrow('claude-cli', 'x'), vrow('api', 'y', { prompt_sha256: 'b'.repeat(64) }), vrow('ollama', 'z', { prompt_sha256: '' })].map(normalizeVersion);
    expect(promptProof(diff)).toMatchObject({ same: false, missing: 1 });
    expect(promptProof(diff).shas).toHaveLength(2);
  });

  it('a gate the builder did not measure reads "not measured", never a pass', () => {
    expect(readGates(null).verses).toMatchObject({ measured: false, allVerbatim: false });
    expect(readGates(null).structure).toMatchObject({ measured: false, ran: 0 });
    const g = readGates({
      verse: { passed: false, spans: 3, verbatim: 2, faults: [{ kind: 'not-the-verse', ref: 'Hebrews 4:9', where: 'levels.child', missing: ['a sabbath rest'] }] },
      structure: { passed: true, problems: [], counts: { movements: 3 } },
      quotation: { passed: false, problems: ['lesson: an ellipsis inside a quotation'] },
      repo_gates: { skipped: 'node is not on this machine' },
    });
    expect(g.verses).toMatchObject({ measured: true, verbatim: 2, total: 3, allVerbatim: false });
    expect(g.verses.mismatches[0]).toEqual({ ref: 'Hebrews 4:9', where: 'levels.child', quoted: '', why: 'not the verse as written; missing "a sabbath rest"' });
    // A skipped layer is shown as not run and never counted as passed.
    expect(g.structure).toMatchObject({ ran: 2, passed: 1 });
    expect(g.structure.checks.find((c) => c.skipped).detail).toBe('not run: node is not on this machine');
    expect(readGates({ verse: { spans: 0, verbatim: 0 } }).verses.allVerbatim).toBe(false);
  });

  it('names where they differ: a missing movement and a verse only one cites', () => {
    const b = vrow('api', 'claude-sonnet');
    b.body = { ...b.body, movements: b.body.movements.slice(0, 2), lesson_close: `Psalm 23:1. ${b.body.lesson_close}` };
    const vs = [vrow('claude-cli', 'claude-opus'), b].map(normalizeVersion);
    const d = compareVersions(vs);
    expect(d.movementCounts).toEqual([3, 2]);
    expect(d.movements.filter((m) => m.differs).map((m) => m.index)).toEqual([3]);
    expect(d.verses.filter((v) => v.differs).map((v) => [v.ref, v.citedBy])).toEqual([['Hebrews 4:11', [true, false]], ['Psalm 23:1', [false, true]]]);
    expect(d.onlyIn).toEqual([['Hebrews 4:11'], ['Psalm 23:1']]);
  });

  it('says which shipped and why, in the builder’s words when it gave them', () => {
    const vs = [vrow('a', 'm1'), vrow('b', 'm2', { published: true, gate_results: { verse: { spans: 3, verbatim: 3 }, shipped_because: 'Every verse verbatim and all structure checks pass.' } })].map(normalizeVersion);
    expect(shippedOf(vs)).toMatchObject({ why: 'Every verse verbatim and all structure checks pass.', count: 1 });
    expect(shippedOf(vs).version.writer).toBe('b');
    expect(shippedOf([vrow('a', 'm1')].map(normalizeVersion)).version).toBe(null);
  });

  it('PROVEN-TO-CATCH: versions go to the Governor only; a member never reaches the table', async () => {
    expect(mayCompareVersions({ uid: DESK })).toBe(true);
    expect(mayCompareVersions({ uid: PHONE })).toBe(true);
    expect(mayCompareVersions({ uid: MEMBER, email: 'member@example.com' })).toBe(false);
    const sb = fakeSb({ uid: MEMBER, versions: [vrow('a', 'm')] });
    const r = await fetchLessonVersions({ supabase: sb, ids: ['t1'], uid: MEMBER, email: 'member@example.com' });
    expect(r.state).toBe('refused');
    expect(sb.calls.from).toEqual([]);
  });

  it('a table that is not on the database yet is "no versions yet", not an error', async () => {
    const sb = fakeSb({ uid: DESK, versionsError: { message: 'relation "public.lesson_versions" does not exist', code: '42P01' } });
    expect((await fetchLessonVersions({ supabase: sb, ids: ['t1'], uid: DESK })).state).toBe('not-yet');
    const ok = fakeSb({ uid: DESK, versions: [vrow('a', 'm'), vrow('b', 'n')] });
    const got = await fetchLessonVersions({ supabase: ok, ids: ['t1', 't1'], uid: DESK });
    expect(ok.calls.from[0].select).toBe(LESSON_VERSION_COLUMNS.join(', '));
    expect(ok.calls.from[0].filters).toEqual([['in', 'teaching_row_id', ['t1']]]);
    expect(Object.keys(got.byTeaching)).toEqual(['t1']);
    const [item] = lessonItems([spoken('v1', DESK, '2026-09-29T10:00:00Z'), transcript('t1', 'v1', DESK, '2026-09-29T10:05:00Z')]);
    expect(versionsForItem(item, groupByTeaching([vrow('a', 'm')]))).toHaveLength(1);
  });
});

// --- 5. THE RENDER -----------------------------------------------------------------
describe('the screen', () => {
  let host; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
  const mount = async (el) => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => { root.render(el); });
    for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    return host;
  };
  const LIVE_ID = 'll194-i-am-who-he-said-he-was-every-hearer-all-of-them';
  const rows = [
    spoken('v1', PHONE, '2026-09-29T10:00:00Z'),
    transcript('t1', 'v1', PHONE, '2026-09-29T10:06:00Z', ['lesson-captured', 'lesson-pr:1901', `lesson-id:${LIVE_ID}`]),
    typed('x1', DESK, '2026-09-29T09:00:00Z'),
    typed('m1', MEMBER, '2026-09-29T08:00:00Z'), // a leak the guard must drop
  ];
  const github = {
    fetchOps: async () => ({ ok: true, pulls: [] }),
    fetchDeliveryRecord: async () => ({ ok: true, merges: [{ number: 1901, createdAt: '2026-09-29T11:00:00Z', mergedAt: '2026-09-29T11:12:00Z' }] }),
    getPull: async () => null,
  };

  it('the Governor sees both doors’ lessons, each road with its times, the live link, and a compare view', async () => {
    const supabase = fakeSb({ uid: PHONE, email: '15636502416@phone.poetech.us', rpcRows: rows, versions: [vrow('claude-cli', 'claude-opus', { published: true }), vrow('api', 'claude-sonnet')] });
    const el = await mount(<LessonInbox deps={{ supabase, github }} />);
    expect(el.textContent).toMatch(/Your lessons · 2/);
    expect(el.textContent).not.toMatch(/m1/);
    const roads = el.querySelectorAll('[data-testid="lesson-road"]');
    expect(roads).toHaveLength(2);
    const first = roads[0];
    expect([...first.querySelectorAll('li')].map((li) => li.getAttribute('data-status'))).toEqual(['done', 'done', 'done', 'done', 'done']);
    expect(first.querySelector('[data-testid="lesson-stage-words-when"]').textContent).toMatch(/\+6 min/);
    expect(first.querySelector('[data-testid="lesson-live-link"]').getAttribute('href')).toMatch(new RegExp(`lesson=${LIVE_ID}`));
    expect(first.querySelector('[data-testid="lesson-road-total"]').textContent).toBe('Arrival to live: 1 h 12 min');
    const second = roads[1];
    expect(second.querySelector('[data-testid="lesson-stage-building"]').getAttribute('data-status')).toBe('unknown');
    expect(second.querySelector('[data-testid="lesson-stage-building"]').textContent).toMatch(/unknown/);
    // Stacked on a phone, five across from 640px.
    expect(first.querySelector('ol').className).toMatch(/grid-cols-1 sm:grid-cols-5/);

    const toggle = el.querySelector('[data-testid="lesson-compare-toggle"]');
    expect(toggle.textContent).toMatch(/Compare versions · 2/);
    await act(async () => { toggle.click(); });
    const cmp = el.querySelector('[data-testid="versions-compare"]');
    expect(cmp.querySelectorAll('[data-testid="version-card"]')).toHaveLength(2);
    expect(cmp.querySelector('ul').className).toMatch(/grid-cols-1 lg:grid-cols-2/);
    expect(cmp.querySelector('[data-testid="prompt-proof"]').getAttribute('data-same')).toBe('yes');
    expect(cmp.querySelector('[data-testid="prompt-text"]').textContent).toMatch(/THE TEACHING: Come unto me/);
    expect(cmp.querySelector('[data-testid="version-shipped"]')).not.toBe(null);
    expect(cmp.querySelector('[data-testid="version-shipped-why"]').textContent).toMatch(/Shipped: claude-cli \(claude-opus\)/);
    expect(cmp.querySelector('[data-testid="version-verbatim"]').textContent).toBe('3 / 3');
    expect(cmp.querySelector('[data-testid="version-elapsed"]').textContent).toBe('42.0 s');
    expect(cmp.querySelectorAll('[data-testid="version-full"]')).toHaveLength(2);
  });

  it('a member sees only their own lesson, and no compare view', async () => {
    const supabase = fakeSb({ uid: MEMBER, email: 'member@example.com', rpcRows: rows });
    const el = await mount(<LessonInbox deps={{ supabase, github }} />);
    expect(el.textContent).toMatch(/Your lessons · 1/);
    expect(el.querySelector('[data-testid="lesson-compare-toggle"]')).toBe(null);
    expect(supabase.calls.from.map((c) => c.table)).not.toContain('lesson_versions');
  });

  it('no versions yet says so; a mismatch is named; different prompts are flagged', async () => {
    let el = await mount(<LessonVersionsCompare versions={[]} state="not-yet" />);
    expect(el.querySelector('[data-testid="versions-none"]').textContent).toMatch(/No versions yet/);
    act(() => root.unmount()); host.remove(); root = null;
    const bad = vrow('ollama', 'llama3', { prompt_sha256: 'c'.repeat(64), gate_results: { verse: { passed: false, spans: 3, verbatim: 2, faults: [{ kind: 'not-the-verse', ref: 'Hebrews 4:9', where: 'lesson', missing: ['rest'] }] }, structure: { passed: false, problems: ['quiz must carry at least 4 questions'] } } });
    el = await mount(<LessonVersionsCompare versions={[vrow('claude-cli', 'claude-opus'), bad].map(normalizeVersion)} />);
    expect(el.querySelector('[data-testid="prompt-proof"]').getAttribute('data-same')).toBe('no');
    expect(el.querySelector('[data-testid="version-mismatches"]').textContent).toMatch(/Hebrews 4:9 \(in lesson\): not the verse as written; missing "rest"/);
    expect([...el.querySelectorAll('[data-testid="version-check-failed"]')].map((x) => x.textContent).join(' | ')).toMatch(/structure: quiz must carry at least 4 questions/);
    expect(el.querySelector('[data-testid="version-shipped-why"]').textContent).toMatch(/None of these versions is marked published yet/);
  });

  it('the Governor’s Decisions area links to Your lessons', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'Projects.jsx'), 'utf8');
    const at = src.indexOf('data-testid="governor-your-lessons-link"');
    expect(at).toBeGreaterThan(src.indexOf("subView === 'governance' && isGovernor"));
    expect(src.slice(at, at + 900)).toMatch(/onNavigate\('notes'\)/);
    expect(src.slice(at, at + 900)).toMatch(/getElementById\('your-lessons'\)/);
  });
});

// --- 6. THE BUILDER'S OWN STAGES (DR-0669 vocabulary) ------------------------------
describe('the road reads the NAS builder’s own stage tags', () => {
  const T = (stage, at) => `build:${stage}@${at}`;
  it('a live build shows where it is and since when; a pushed one is timed by its push; its PR is found by its branch', () => {
    const [now] = lessonItems([typed('b1', DESK, '2026-09-29T09:00:00Z', ['lesson-building', T('claimed', '2026-09-29T09:00:05Z'), T('writing', '2026-09-29T09:01:00Z')])]);
    const r1 = deriveLessonPipeline(now, { owner: true, catalog: CATALOG });
    expect(r1.stages[2]).toMatchObject({ status: 'now', at: '2026-09-29T09:00:05Z' });
    expect(r1.stages[2].line).toMatch(/^Now writing, since /);
    const [done] = lessonItems([typed('b2', DESK, '2026-09-29T09:00:00Z', [T('claimed', '2026-09-29T09:00:05Z'), T('pushed', '2026-09-29T09:20:00Z'), 'lesson-captured', 'lesson-published', 'build-lesson:L200', 'lesson-id:ll200-rest-of-the-word'])]);
    const prs = { byBranch: { 'claude/lesson-l200-': { number: 1900, branch: 'claude/lesson-l200-rest', createdAt: '2026-09-29T09:21:00Z', mergedAt: '2026-09-29T09:40:00Z', state: 'closed' } } };
    const r2 = deriveLessonPipeline(done, { prs, owner: true, catalog: CATALOG });
    expect(byStage(r2)).toEqual({ recorded: 'done', words: 'done', building: 'done', pr: 'done', live: 'done' });
    expect(r2.stages.map((s) => s.elapsed)).toEqual([null, null, '20 min', '1 min', '19 min']);
    expect(r2.stages[3].line).toBe('PR #1900 opened.');
    expect(r2.prNumber).toBe(1900);
  });
  it('several versions wait for his decision; a failed build says why; a deferred one says where it went', () => {
    const [review] = lessonItems([typed('b3', DESK, '2026-09-29T09:00:00Z', ['awaiting-review', T('awaiting-review', '2026-09-29T09:15:00Z')])]);
    expect(deriveLessonPipeline(review, { owner: true, catalog: CATALOG }).stages[2]).toMatchObject({ status: 'waiting', line: expect.stringMatching(/waits for your decision/) });
    const [failed] = lessonItems([typed('b4', DESK, '2026-09-29T09:00:00Z', [T('failed', '2026-09-29T09:30:00Z'), 'build-failed', 'build-reason:budget 2700 s reached'])]);
    const r = deriveLessonPipeline(failed, { owner: true, catalog: CATALOG });
    expect(r.stages[2]).toMatchObject({ status: 'failed', at: '2026-09-29T09:30:00Z', line: 'The builder stopped: budget 2700 s reached' });
    expect(r.failed).toBe(true);
    const [deferred] = lessonItems([typed('b5', DESK, '2026-09-29T09:00:00Z', [T('deferred', '2026-09-29T09:02:00Z'), 'build-reason:placed in Sovereign A.I.'])]);
    expect(deriveLessonPipeline(deferred, { owner: true, catalog: CATALOG }).stages[2].line).toBe('Handed to the hourly lesson Routine: placed in Sovereign A.I.');
  });
  it('the PR read indexes open and merged PRs by the builder’s branch', async () => {
    const { prs } = await fetchLessonPrs([], {
      branchPrefixes: ['claude/lesson-l200-'],
      fetchOps: async () => ({ ok: true, pulls: [{ number: 5, branch: 'claude/other', createdAt: 'x' }] }),
      fetchDeliveryRecord: async () => ({ ok: true, merges: [{ number: 1900, branch: 'claude/lesson-l200-rest', createdAt: '2026-09-29T09:21:00Z', mergedAt: '2026-09-29T09:40:00Z' }] }),
    });
    expect(prs.byBranch['claude/lesson-l200-']).toMatchObject({ number: 1900, mergedAt: '2026-09-29T09:40:00Z' });
  });
});

// --- 7. REVIEW AND DECIDE: choose, merge part by part, or take all ----------------
const SPAN = '"Come unto me, all ye that labour and are heavy laden, and I will give you rest." (Matthew 11:28)';
const drow = (writer, extra = {}, body = {}) => ({
  ...vrow(writer, `${writer}-model`),
  body: {
    verdict: 'lesson', title: `Rest, by ${writer}`, anchor: { ref: 'Matthew 11:28' }, bigIdea: `Big idea by ${writer}.`,
    lesson_intro: `He said it plainly: ${SPAN} So we come.`,
    movements: [{ title: 'Come', text: 'Matthew 11:28.' }, { title: 'Remain', text: 'Hebrews 4:9.' }, { title: 'Enter', text: 'Hebrews 4:11.' }],
    lesson_close: 'Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.',
    levels: { child: `Child band by ${writer}. ${SPAN}`, youth: `Youth by ${writer}.`, teen: `Teen by ${writer}.`, senior: `Senior by ${writer}.` },
    quiz: { questions: [{ q: `Q by ${writer}`, options: ['a', 'b'], answer: 0, explain: 'x' }] },
    ...body,
  },
  ...extra,
});

describe('the decision — the builder’s contract, from the Governor’s hand', () => {
  const A = normalizeVersion(drow('alpha'));
  // Beta: one verse fault in its child band, faster, two movements, a better title.
  const B = normalizeVersion(drow('beta', {
    elapsed_ms: 1000,
    gate_results: {
      structure: { passed: true, problems: [], counts: { movements: 2, quiz: 1 } },
      verse: { passed: false, spans: 3, verbatim: 2, faults: [{ kind: 'not-the-verse', ref: 'Matthew 11:28', where: 'levels.child', quoted: 'Come unto me' }] },
      verse_passed: false, passed: false,
    },
  }, { movements: [{ title: 'Come', text: 'Matthew 11:28.' }, { title: 'Remain', text: 'Hebrews 4:9.' }], title: 'Beta’s better title' }));
  const vs = [A, B];

  it('pins lesson_decisions to DR-0669’s migration and the builder’s PART_KEYS, once they are on disk', () => {
    expect(LESSON_DECISION_COLUMNS).toEqual(['id', 'build_id', 'teaching_row_id', 'instance_id', 'version_id', 'merge_map', 'edits', 'decided_by', 'decided_at', 'status', 'gate_result', 'lesson_id', 'branch', 'pr_url', 'processed_at']);
    const dir = join(REPO, 'infra/supabase/migrations-auto');
    const sql = readdirSync(dir).map((f) => readFileSync(join(dir, f), 'utf8')).find((x) => /CREATE TABLE IF NOT EXISTS (public\.)?lesson_decisions\b/.test(x));
    if (sql) {
      const table = sql.slice(sql.search(/CREATE TABLE IF NOT EXISTS (public\.)?lesson_decisions\b/));
      const body = table.slice(0, table.indexOf(');'));
      for (const c of LESSON_DECISION_COLUMNS) expect(body, `lesson_decisions is missing ${c}`).toMatch(new RegExp(`^\\s+${c}\\s`, 'm'));
      expect(body).toMatch(/'decided', 'building', 'shipped', 'gate-failed', 'failed'/);
    }
    const builder = join(REPO, 'infra/nas-lesson-builder/lesson_builder.py');
    if (existsSync(builder)) {
      const keys = /PART_KEYS = \(([^)]+)\)/.exec(readFileSync(builder, 'utf8'))[1].match(/"([^"]+)"/g).map((k) => k.slice(1, -1));
      for (const p of partsFor(vs).filter((x) => x !== 'base' && !x.startsWith('movements.'))) expect(keys, `the builder no longer merges ${p}`).toContain(p);
      expect(readFileSync(builder, 'utf8')).toMatch(/movements\\\.\(\\d\+\)/);
    }
  });

  it('the parts, and the best part of each for "take all"', () => {
    expect(partsFor(vs)).toEqual(['base', 'title', 'bigIdea', 'lesson_intro', 'movements.0', 'movements.1', 'movements.2', 'lesson_close', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior', 'quiz', 'benefits', 'facilitator']);
    expect(partOf(B, 'movements.2')).toBeUndefined();
    const picks = defaultPicks(vs);
    expect(picks.base).toBe('ver-alpha'); // passed every gate
    expect(picks['levels.child']).toBe('ver-alpha'); // beta's child band carries the verse fault
    expect(picks['movements.2']).toBe('ver-alpha'); // only alpha has it
  });

  it('the preview is the builder’s assembly: base, then merged parts, then edits', () => {
    const out = composeLesson(vs, { base: 'ver-alpha', title: 'ver-beta', 'levels.youth': 'ver-beta' }, { 'levels.teen': 'Teen, edited.', 'movements.1.title': 'Abide' });
    expect(out.title).toBe('Beta’s better title');
    expect(out.levels).toMatchObject({ child: expect.stringMatching(/by alpha/), youth: 'Youth by beta.', teen: 'Teen, edited.' });
    expect(out.movements.map((m) => m.title)).toEqual(['Come', 'Abide', 'Enter']);
    expect(out.anchor).toEqual({ ref: 'Matthew 11:28' });
  });

  it('PROVEN-TO-CATCH: quoted Scripture stays locked — the editor cannot touch a span, and the contract refuses any change to one', () => {
    const text = A.body.lesson_intro;
    expect(scriptureSpans(text)).toEqual([SPAN.slice(1, SPAN.indexOf('" ('))]);
    const segs = splitLocked(text);
    expect(segs.map((x) => x.locked)).toEqual([false, true, false]);
    expect(joinSegments(editSegment(segs, 1, '"Come unto me, all ye that work"'))).toBe(text);
    // A straight quote typed between spans cannot open a new span.
    expect(scriptureSpans(joinSegments(editSegment(segs, 0, 'He said "rest" plainly: ')))).toEqual(scriptureSpans(text));
    const base = { mode: 'choose', chosenVersionId: 'ver-alpha', versions: vs };
    for (const bad of [text.replace('heavy laden', 'weary'), text.replace(SPAN.slice(0, SPAN.indexOf(' (')), ''), `${text} "Rest in the LORD" (Psalm 37:7)`]) {
      expect(editKeepsScripture(text, bad)).toBe(false);
      const r = buildDecision({ ...base, edits: { lesson_intro: bad } });
      expect(r.ok).toBe(false);
      expect(r.problems.join(' ')).toMatch(/Scripture stays exactly as written/);
    }
    const ok = buildDecision({ ...base, edits: { lesson_intro: text.replace('So we come.', 'So we come to Him.') } });
    expect(ok.row.edits.lesson_intro).toMatch(/So we come to Him\./);
  });

  it('the publish contract: exactly the row the builder reads, or a refusal that says why', () => {
    const choose = buildDecision({ mode: 'choose', chosenVersionId: 'ver-beta', versions: vs, edits: { title: 'Beta’s better title' } });
    expect(choose.row).toEqual({ build_id: 'b0000000-0000-4000-a000-000000000001', teaching_row_id: 't1', instance_id: 'i1', version_id: 'ver-beta', merge_map: null, edits: {} });
    const merge = buildDecision({ mode: 'merge', picks: { base: 'ver-alpha', title: 'ver-beta', 'levels.child': 'ver-alpha' }, versions: vs });
    expect(merge.row).toMatchObject({ version_id: 'ver-alpha', merge_map: { title: 'ver-beta' } });
    const all = buildDecision({ mode: 'all', picks: defaultPicks(vs), versions: vs });
    expect(all.row.version_id).toBe('ver-alpha');
    const refusals = [
      [{ mode: 'choose', chosenVersionId: 'nope' }, /Choose one of these versions/],
      [{ mode: 'merge', picks: { base: 'ver-alpha', title: 'ver-alpha' } }, /at least two versions/],
      [{ mode: 'merge', picks: { title: 'ver-beta' } }, /Pick the base version/],
      [{ mode: 'all', picks: { base: 'ver-alpha', 'movements.2': 'ver-beta' } }, /beta has no movements\.2/],
      [{ mode: 'all', picks: { base: 'ver-alpha', nonsense: 'ver-beta' } }, /not a part of this lesson/],
      [{ mode: 'choose', chosenVersionId: 'ver-alpha', edits: { quiz: 'x' } }, /quiz cannot be edited here/],
      [{ mode: 'launch' }, /Unknown mode/],
    ];
    for (const [d, why] of refusals) {
      const r = buildDecision({ versions: vs, ...d });
      expect(r.ok, String(why)).toBe(false);
      expect(r.problems.join(' ')).toMatch(why);
    }
    const otherBuild = normalizeVersion(drow('gamma', { build_id: 'b-other' }));
    expect(buildDecision({ mode: 'choose', chosenVersionId: 'ver-alpha', versions: [A, otherBuild] }).problems.join(' ')).toMatch(/not from one build/);
  });

  it('PROVEN-TO-CATCH: only the Governor decides or reads the queue; a member never reaches either table', async () => {
    const member = fakeSb({ uid: MEMBER, versions: [drow('alpha'), drow('beta')] });
    const r = await publishDecision({ supabase: member, uid: MEMBER, email: 'member@example.com', decision: { mode: 'choose', chosenVersionId: 'ver-alpha', versions: vs } });
    expect(r.ok).toBe(false);
    expect(member.calls.inserts).toEqual([]);
    const { fetchReviewQueue } = await import('../lib/lesson-decisions.js');
    expect((await fetchReviewQueue({ supabase: member, uid: MEMBER, email: 'member@example.com' })).state).toBe('refused');
    expect(member.calls.from).toEqual([]);
    const gov = fakeSb({ uid: DESK });
    const sent = await publishDecision({ supabase: gov, uid: DESK, decision: { mode: 'choose', chosenVersionId: 'ver-alpha', versions: vs } });
    expect(sent.ok).toBe(true);
    expect(gov.calls.inserts[0][0]).toBe('lesson_decisions');
    for (const k of ['decided_by', 'status', 'gate_result']) expect(gov.calls.inserts[0][1]).not.toHaveProperty(k); // the database's
  });

  it('a failed gate on the composite names the check and the part; the queue follows the newest decision', () => {
    expect(gateFailures({ passed: false, failures: [{ check: 'verse:not-the-verse', part: 'levels.child', detail: '(Matthew 11:28) Come unto me' }] }))
      .toEqual([{ check: 'verse:not-the-verse', part: 'levels.child', detail: '(Matthew 11:28) Come unto me' }]);
    expect(reviewState(vs, []).state).toBe('awaiting');
    expect(reviewState([A], []).state).toBe('single');
    const older = { status: 'gate-failed', decided_at: '2026-09-29T10:00:00Z', gate_result: { failures: [{ check: 'voice', part: 'lesson_intro' }] } };
    expect(reviewState(vs, [older])).toMatchObject({ state: 'gate-failed', failures: [{ check: 'voice', part: 'lesson_intro' }] });
    expect(reviewState(vs, [older, { status: 'decided', decided_at: '2026-09-29T11:00:00Z' }]).state).toBe('pending');
    expect(reviewState(vs, [{ status: 'shipped', decided_at: '2026-09-29T12:00:00Z' }]).state).toBe('shipped');
  });
});

describe('the review queue on the screen', () => {
  let host; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
  const settle = async () => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
  const mount = async (el) => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => { root.render(el); });
    await settle();
    return host;
  };
  const withGovernor = (extra = {}) => fakeSb({ uid: DESK, email: 'darrellpoe06@gmail.com', versions: [drow('alpha'), drow('beta'), drow('old', { backfill: true, build_id: 'b-backfill' })], ...extra });
  const openFirst = async (el) => { await act(async () => { [...el.querySelectorAll('button')].find((b) => /Review and decide/.test(b.textContent)).click(); }); };

  it('a build with two versions waits; he chooses one and publishes the row the builder reads', async () => {
    const supabase = withGovernor();
    const el = await mount(<LessonReviewQueue deps={{ supabase }} />);
    expect(el.textContent).toMatch(/Lessons to decide · 1/); // the backfill row is never in the queue
    expect(el.querySelector('[data-testid="review-queue-item"]').getAttribute('data-state')).toBe('awaiting');
    await openFirst(el);
    expect(el.querySelector('[data-testid="decide-status"]').getAttribute('data-state')).toBe('awaiting');
    expect(el.querySelector('[data-testid="decide-merge-map"]').querySelectorAll('tbody tr')).toHaveLength(15);
    await act(async () => { el.querySelector('[data-testid="decide-mode-choose"]').click(); });
    await act(async () => { el.querySelectorAll('[data-testid="decide-choose-option"]')[1].click(); });
    expect(el.querySelector('[data-testid="decide-preview-title"]').textContent).toBe('Rest, by beta');
    await act(async () => { el.querySelector('[data-testid="decide-publish"]').click(); });
    await settle();
    expect(supabase.calls.inserts).toHaveLength(1);
    expect(supabase.calls.inserts[0][1]).toEqual({ build_id: 'b0000000-0000-4000-a000-000000000001', teaching_row_id: 't1', instance_id: 'i1', version_id: 'ver-beta', merge_map: null, edits: {} });
  });

  it('the editor shows each quoted span locked, never as a field', async () => {
    const el = await mount(<LessonReviewQueue deps={{ supabase: withGovernor() }} />);
    await openFirst(el);
    await act(async () => { el.querySelector('[data-testid="decide-edit-lesson_intro"]').click(); });
    const editor = el.querySelector('[data-testid="decide-editor-lesson_intro"]');
    expect(editor.querySelector('[data-testid="decide-locked-span"]').textContent).toContain('heavy laden');
    for (const ta of editor.querySelectorAll('textarea')) expect(ta.value).not.toContain('heavy laden');
    expect(editor.querySelectorAll('textarea')).toHaveLength(2);
  });

  it('a gate that failed on the final lesson comes back, naming the check and the part; a shipped one links its PR', async () => {
    const failed = withGovernor({ decisions: [{ build_id: 'b0000000-0000-4000-a000-000000000001', status: 'gate-failed', decided_at: '2026-09-29T11:00:00Z', gate_result: { failures: [{ check: 'verse:not-the-verse', part: 'levels.child', detail: '(Matthew 11:28) Come unto me' }] } }] });
    let el = await mount(<LessonReviewQueue deps={{ supabase: failed }} />);
    expect(el.querySelector('[data-testid="review-queue-item"]').getAttribute('data-state')).toBe('gate-failed');
    await openFirst(el);
    expect(el.querySelector('[data-testid="decide-gate-failures"]').textContent).toMatch(/verse:not-the-verse · Child band: \(Matthew 11:28\) Come unto me/);
    act(() => root.unmount()); host.remove(); root = null;
    const shipped = withGovernor({ decisions: [{ build_id: 'b0000000-0000-4000-a000-000000000001', status: 'shipped', decided_at: '2026-09-29T11:00:00Z', lesson_id: 'll200-rest', pr_url: 'https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/1900' }] });
    el = await mount(<LessonReviewQueue deps={{ supabase: shipped }} />);
    expect(el.textContent).toMatch(/Nothing waiting for you/);
  });

  it('a member sees no queue at all', async () => {
    const supabase = fakeSb({ uid: MEMBER, email: 'member@example.com', versions: [drow('alpha'), drow('beta')] });
    const el = await mount(<LessonReviewQueue deps={{ supabase }} />);
    expect(el.querySelector('[data-testid="lesson-review-queue"]')).toBe(null);
    expect(supabase.calls.from).toEqual([]);
  });
});
