// =============================================================================
// The Learn presentation pipeline resumes, retries, stays in budget, rejects
// duplicates and NEVER writes to a lesson (scripts/learn-presentation)
// =============================================================================
// Mock providers only — no network, no keys, no spend. Lessons are deep-frozen
// and compared byte-for-byte after a full text + image run.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ledger } from '../../scripts/learn-presentation/lib/ledger.mjs';
import { ProviderError, withTimeout, TokenBucket } from '../../scripts/learn-presentation/lib/limits.mjs';
import { Budget, buildItems, coursesForValidation, runText, runImages, exportRecords, hamming } from '../../scripts/learn-presentation/lib/pipeline.mjs';
import { parseCopy, userPrompt } from '../../scripts/learn-presentation/lib/prompts.mjs';
import { estimate } from '../../scripts/learn-presentation/lib/prices.mjs';
import { anthropicText } from '../../scripts/learn-presentation/providers/text.mjs';
import { bflImage } from '../../scripts/learn-presentation/providers/image.mjs';
import { verifyRecovery } from '../../scripts/learn-presentation/lib/recovery.mjs';
import { writeFileSync, rmSync } from 'node:fs';

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
};
const noSleep = async () => {};

function fixture() {
  const mk = (id, title) => ({
    id,
    title,
    bigIdea: `Big idea of ${title}.`,
    lesson: `The adult text of ${title}. "In the beginning God created the heaven and the earth." (Genesis 1:1)`,
    levels: { teen: `Teen text of ${title}.` },
  });
  return deepFreeze([
    {
      key: 'living-lessons',
      title: 'Living Lessons from the Word',
      department: 'Living Lessons',
      meta: { title: 'Living Lessons from the Word', category: 'Living Lessons' },
      lessons: [mk('ll1-a', 'Not with Eyeservice — faithful work'), mk('ll2-b', 'Give Me This Mountain'), mk('ll3-c', 'Whoso Removeth Stones')],
    },
    {
      key: 'stocks',
      title: 'Stocks',
      department: 'Stock Market',
      meta: { title: 'Stocks', category: 'Stock Market' },
      lessons: [mk('stk1-d', 'When you buy a share'), mk('stk2-e', 'Primary and secondary')],
    },
  ]);
}

const COPY = {
  'Not with Eyeservice — faithful work': 'Who Are You When Nobody Is Watching?',
  'Give Me This Mountain': 'Your Greatest Years May Still Be Ahead',
  'Whoso Removeth Stones': 'One Small Mistake Can Ground Everything',
  'When you buy a share': 'Where Does Your Stock Money Really Go?',
  'Primary and secondary': 'Two Markets, One Name',
};
const titleFrom = (user) => /ORIGINAL TITLE[^:]*\): (.*)/.exec(user)[1];
const goodCopy = (t) =>
  JSON.stringify({
    displayTitle: COPY[t],
    thumbHeadline: `${COPY[t].split(' ')[0]} HEADLINE NOW`,
    promoDescription: 'What the lesson teaches.',
    imagePrompt: 'A cinematic scene.',
    imageAlt: 'A person at work.',
  });

function mockText(fn) {
  const p = {
    name: 'mock',
    model: 'mock-1',
    costCents: 1,
    calls: [],
    complete: async (req) => {
      p.calls.push(req);
      return { text: await fn(req, p.calls.length), model: 'mock-1', costCents: 1 };
    },
  };
  return p;
}
function mockImage(fn = (prompt) => Buffer.from(`img:${prompt.slice(0, 40)}:${Math.random()}`)) {
  const p = {
    name: 'mockimg',
    model: 'mock-img',
    costCents: 6,
    calls: 0,
    generate: async ({ prompt }) => {
      p.calls += 1;
      return { bytes: await fn(prompt, p.calls), ext: 'jpg', model: 'mock-img', costCents: 6 };
    },
  };
  return p;
}

let dir;
let inv;
let courses;
let items;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lp-'));
  inv = fixture();
  courses = coursesForValidation(inv);
  items = buildItems(inv);
});
const ledger = () => new Ledger(join(dir, 'state'));
const textRun = (l, provider, extra = {}) => runText({ items, ledger: l, provider, courses, batchId: 'b1', concurrency: 1, sleep: noSleep, ...extra });

describe('the pipeline never writes to a lesson', () => {
  it('a full text + image run leaves deep-frozen lessons byte-identical', async () => {
    const before = JSON.stringify(inv);
    const l = ledger();
    const t = await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    expect(t).toMatchObject({ done: 5, failed: 0, needsReview: 0 });
    const im = await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 3, sleep: noSleep });
    expect(im).toMatchObject({ done: 5, failed: 0 });
    expect(JSON.stringify(inv)).toBe(before);
    expect(existsSync(join(dir, 'img', 'living-lessons', 'll1-a.jpg'))).toBe(true);
    const rec = l.getRecord('living-lessons', 'll1-a');
    expect(rec.originalTitleAtApproval).toBe('Not with Eyeservice — faithful work');
    expect(rec.image.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('resume', () => {
  it('a second run skips every succeeded job and calls no provider', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const again = mockText(() => {
      throw new Error('must not be called');
    });
    const t = await textRun(new Ledger(join(dir, 'state')), again);
    expect(t).toMatchObject({ done: 0, skipped: 5 });
    expect(again.calls.length).toBe(0);
  });

  it('a lesson whose content changed is re-queued, never reused', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const changed = items.map((it) => (it.lessonId === 'll2-b' ? { ...it, contentSha: 'f'.repeat(64) } : it));
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await runText({ items: changed, ledger: new Ledger(join(dir, 'state')), provider: p, courses, batchId: 'b1', concurrency: 1, sleep: noSleep });
    expect(t).toMatchObject({ done: 1, skipped: 4 });
  });

  it('a job left running past its lease is resumed', () => {
    let now = 1_000_000;
    const l = new Ledger(join(dir, 'state'), { clock: () => now, leaseMs: 1000 });
    l.write({
      idempotencyKey: 'k',
      courseKey: 'stocks',
      lessonId: 'stk1-d',
      kind: 'text',
      contentSha: 'x',
      state: 'running',
      attempts: 1,
      leaseUntil: new Date(now + 1000).toISOString(),
    });
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' }).run).toBe(false);
    now += 5000;
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' })).toMatchObject({ run: true, reason: 'lease-expired' });
  });
});

describe('retries, timeouts and budget', () => {
  it('retries a 503 with backoff, then records the failure', async () => {
    const waits = [];
    const p = mockText(() => {
      throw new ProviderError('busy', { status: 503 });
    });
    const t = await textRun(ledger(), p, {
      items: items.slice(0, 1),
      sleep: async (ms) => {
        waits.push(ms);
      },
      random: () => 0.5,
    });
    expect(t.failed).toBe(1);
    expect(p.calls.length).toBe(3);
    expect(waits).toEqual([500, 1000]);
  });

  it('a call that never answers times out and fails cleanly', async () => {
    const p = { name: 'hang', model: 'h', costCents: 0, complete: () => new Promise(() => {}) };
    const l = ledger();
    const t = await textRun(l, p, { items: items.slice(0, 1), timeoutMs: 20 });
    expect(t.failed).toBe(1);
    expect(l.latestFor('living-lessons', 'll1-a', 'text').lastError).toMatch(/timed out/);
    await expect(withTimeout(() => new Promise(() => {}), 10, 'x')).rejects.toThrow(/timed out after 10 ms/);
  });

  it('stops before the budget cap is crossed and leaves the rest queued', async () => {
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(ledger(), p, { budget: new Budget(2) });
    expect(t.done).toBe(2);
    expect(t.stoppedByBudget).toBe(true);
    expect(p.calls.length).toBe(2);
  });

  it('the token bucket waits when the per-minute allowance is spent', async () => {
    let now = 0;
    const waited = [];
    const b = new TokenBucket(2, {
      now: () => now,
      sleep: async (ms) => {
        waited.push(ms);
        now += ms;
      },
    });
    await b.take();
    await b.take();
    await b.take();
    expect(waited.length).toBe(1);
    expect(waited[0]).toBeGreaterThan(0);
  });
});

describe('quality gates', () => {
  it('a duplicate display title anywhere in the library is rejected to review', async () => {
    const p = mockText(() =>
      JSON.stringify({ displayTitle: 'The Same Title Every Time', thumbHeadline: 'SAME HEADLINE HERE', promoDescription: 'x', imagePrompt: 'y', imageAlt: 'z' })
    );
    const t = await textRun(ledger(), p, { items: items.slice(0, 2) });
    expect(t).toMatchObject({ done: 1, needsReview: 1 });
  });

  it('validator errors are fed back once, then routed to needs-review as a draft', async () => {
    const p = mockText(() =>
      JSON.stringify({ displayTitle: 'How God Uses Your Past', thumbHeadline: 'YOUR PAST MATTERS', promoDescription: 'x', imagePrompt: 'y', imageAlt: 'z' })
    );
    const l = ledger();
    const t = await textRun(l, p, { items: items.slice(0, 1) });
    expect(t.needsReview).toBe(1);
    expect(p.calls.length).toBe(2);
    expect(p.calls[1].user).toMatch(/rejected for: generic-god/);
    expect(l.getRecord('living-lessons', 'll1-a').status).toBe('draft');
  });

  it('identical image bytes are flagged for review', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const t = await runImages({
      items,
      ledger: l,
      provider: mockImage(() => Buffer.from('same')),
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(t.needsReview).toBe(4);
  });

  it('near-duplicate perceptual hashes are flagged when a hash hook is supplied', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const t = await runImages({
      items: items.slice(0, 2),
      ledger: l,
      provider: mockImage(),
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      sleep: noSleep,
      perceptualHash: async () => 'ffffffffffffff00',
    });
    expect(t).toMatchObject({ done: 1, needsReview: 1 });
    expect(hamming('ffffffffffffff00', 'ffffffffffffff01')).toBe(1);
  });

  it('images wait for approved copy and are one per lesson', async () => {
    const p = mockImage();
    const t = await runImages({ items, ledger: ledger(), provider: p, outDir: join(dir, 'img'), batchId: 'b1', sleep: noSleep });
    expect(t.waiting).toBe(5);
    expect(p.calls).toBe(0);
  });

  it('export is the seed shape and never marks anything approved', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const out = exportRecords(l);
    expect(out.records).toHaveLength(5);
    expect(new Set(out.records.map((r) => r.status))).toEqual(new Set(['review']));
    expect(Object.keys(out.records[0])).toEqual(
      expect.arrayContaining(['lessonId', 'courseKey', 'originalTitleAtApproval', 'displayTitle', 'thumbHeadline', 'visual', 'image'])
    );
    expect(
      readFileSync(join(dir, 'state', 'jobs.jsonl'), 'utf8')
        .trim()
        .split('\n').length
    ).toBeGreaterThan(5);
  });
});

describe('prompts, prices and providers', () => {
  it('parses fenced JSON and refuses missing keys', () => {
    expect(parseCopy('```json\n{"displayTitle":"a","thumbHeadline":"b c","promoDescription":"d","imagePrompt":"e","imageAlt":"f"}\n```').displayTitle).toBe(
      'a'
    );
    expect(() => parseCopy('{"displayTitle":"a"}')).toThrow(/thumbHeadline/);
  });
  it('the prompt carries the original title as do-not-reuse and the lesson text untouched', () => {
    const it0 = items[0];
    const u = userPrompt(it0);
    expect(u).toContain('ORIGINAL TITLE (do not reuse');
    expect(u).toContain('"In the beginning God created the heaven and the earth." (Genesis 1:1)');
  });
  it('estimates 994 lessons with regeneration', () => {
    const e = estimate({ lessons: 994 });
    expect(e.generations).toBe(1293);
    expect(e.image.find((r) => r.key === 'bfl:flux-pro-1.1-ultra').cents).toBe(7758);
  });
  it('paid providers refuse to start without a key', () => {
    expect(() => anthropicText({ apiKey: '' })).toThrow(/ANTHROPIC_API_KEY is not set/);
    expect(() => bflImage({ apiKey: '' })).toThrow(/BFL_API_KEY is not set/);
  });
  it('the BFL adapter submits, polls and downloads through an injected fetch', async () => {
    const seen = [];
    const fetchImpl = async (url) => {
      seen.push(url);
      if (url.endsWith('/flux-pro-1.1-ultra')) return { ok: true, json: async () => ({ polling_url: 'https://poll/1' }) };
      if (url === 'https://poll/1')
        return { ok: true, json: async () => ({ status: seen.length < 4 ? 'Pending' : 'Ready', result: { sample: 'https://cdn/img.jpg' } }) };
      return { ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    };
    const p = bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep });
    const out = await p.generate({ prompt: 'x', signal: new AbortController().signal });
    expect(out).toMatchObject({ ext: 'jpg', costCents: 6 });
    expect(out.bytes.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// The owner's pilot safeguards (2026-11-24): the pilot cannot be widened, and
// $5 is the combined ceiling, retries and failed tries included.
// ---------------------------------------------------------------------------
describe('pilot scope cannot be widened', () => {
  const SEED_PATH = join(process.cwd(), 'src/lib/learn-presentation/presentation-seed.json');
  let scope;
  beforeEach(async () => {
    scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
  });

  it('the seed is exactly the 20 approved pilot lessons, all mounted', async () => {
    const { learnInventory } = await import('../lib/learn-presentation/integrity.js');
    const real = buildItems(learnInventory());
    const picked = scope.resolveSpendingScope('seed', real, { seedPath: SEED_PATH });
    expect(scope.PILOT_MAX_LESSONS).toBe(20);
    expect(picked).toHaveLength(20);
    expect(new Set(picked.map((x) => `${x.courseKey}::${x.lessonId}`)).size).toBe(20);
  });

  it('refuses an empty selection, "all", unknown ids and more than 20', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ courseKey: 'c', lessonId: `l${i}` }));
    const r =
      (only, its = items) =>
      () =>
        scope.resolveSpendingScope(only, its, { seedPath: SEED_PATH });
    expect(r(undefined)).toThrow(scope.ScopeError);
    expect(r('')).toThrow(/must name its lessons/);
    expect(r(true)).toThrow(/must name its lessons/);
    expect(r('all')).toThrow(/full library is disabled/);
    expect(r('ALL')).toThrow(/full library is disabled/);
    expect(r('ll1-a,not-a-lesson')).toThrow(/not mounted lessons: not-a-lesson/);
    expect(r(many.map((x) => x.lessonId).join(','), many)).toThrow(/at most 20/);
    expect(scope.FULL_LIBRARY_ENABLED).toBe(false);
  });

  it('a repeated id is one lesson, not two', () => {
    const picked = scope.resolveSpendingScope('ll1-a,ll1-a,living-lessons::ll1-a', items, { seedPath: SEED_PATH });
    expect(picked).toHaveLength(1);
  });

  it('the combined cap subtracts everything already spent, across runs', () => {
    expect(scope.TOTAL_CAP_CENTS).toBe(500);
    expect(scope.remainingCents(400, 0)).toBe(400);
    expect(scope.remainingCents(400, 300)).toBe(200);
    expect(scope.remainingCents(null, 480)).toBe(20);
    expect(scope.remainingCents(400, 900)).toBe(0);
  });
});

describe('every try is charged, retries and failures included', () => {
  it('three failed text tries cost three calls, never zero (proven-to-catch the old release path)', async () => {
    const p = mockText(() => {
      throw new ProviderError('busy', { status: 503 });
    });
    const l = ledger();
    const budget = new Budget(100);
    await textRun(l, p, { items: items.slice(0, 1), budget });
    expect(p.calls.length).toBe(3);
    expect(budget.spent).toBe(3);
    expect(l.spentCents()).toBe(3);
  });

  it('a retried image is charged per request, and the cap counts the retries', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    let n = 0;
    const flaky = mockImage(() => {
      n += 1;
      if (n === 1) throw new ProviderError('busy', { status: 503 });
      return Buffer.from(`img-${n}`);
    });
    const budget = new Budget(12);
    const t = await runImages({
      items: items.slice(0, 2),
      ledger: l,
      provider: flaky,
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      budget,
      sleep: noSleep,
    });
    // 1 failed try (6c) + 1 success (6c) = 12c reaches the cap; the second lesson is never sent
    expect(budget.spent).toBe(12);
    expect(t.done).toBe(1);
    expect(t.stoppedByBudget).toBe(true);
    expect(flaky.calls).toBe(2);
  });

  it('a second run with the same ledger spends nothing on finished lessons', async () => {
    const l = ledger();
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    await textRun(l, p, { items: items.slice(0, 2) });
    const before = l.spentCents();
    const again = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(l, again, { items: items.slice(0, 2) });
    expect(t.skipped).toBe(2);
    expect(again.calls.length).toBe(0);
    expect(l.spentCents()).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Pilot 1 regressions (2026-11-24). Pilot 1 spent 98c, then: 10 of 20 titles
// came back as prose ("no JSON object in model output") and were parked for
// review, and compose crashed with "want.has is not a function". Each test
// below fails on the pilot-1 code.
// ---------------------------------------------------------------------------
describe('pilot 1 regressions', () => {
  const COPY_OBJ = { displayTitle: 'Who Are You When Nobody Is Watching?', thumbHeadline: 'WHO ARE YOU', promoDescription: 'p', imagePrompt: 'i', imageAlt: 'a' };
  const anthropicReply = (body) => async (url, init) => {
    anthropicReply.last = JSON.parse(init.body);
    return { ok: true, json: async () => body };
  };

  it('the Anthropic call FORCES the lesson_copy tool and returns its input as JSON', async () => {
    const fetchImpl = anthropicReply({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'lesson_copy', input: COPY_OBJ }] });
    const out = await anthropicText({ apiKey: 'k', fetchImpl }).complete({ system: 's', user: 'u' });
    const sent = anthropicReply.last;
    expect(sent.tool_choice).toEqual({ type: 'tool', name: 'lesson_copy' });
    expect(sent.tools[0].input_schema.required).toEqual(['displayTitle', 'thumbHeadline', 'promoDescription', 'imagePrompt', 'imageAlt']);
    expect(sent.tools[0].input_schema.additionalProperties).toBe(false);
    expect(sent.max_tokens).toBeGreaterThanOrEqual(2048);
    expect(parseCopy(out.text)).toEqual(COPY_OBJ);
  });

  it('an answer cut off at max_tokens is a retryable fault, never review', async () => {
    const fetchImpl = anthropicReply({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"displayTitle": "Half' }] });
    const err = await anthropicText({ apiKey: 'k', fetchImpl })
      .complete({ system: 's', user: 'u' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.retryable).toBe(true);
  });

  it('prose on both passes is recorded as failed (resumable), not needs-review', async () => {
    const l = ledger();
    const t = await textRun(
      l,
      mockText(() => 'Here is a great title for this lesson!'),
      { items: items.slice(0, 1) }
    );
    expect(t).toMatchObject({ failed: 1, needsReview: 0 });
    const j = l.latestFor('living-lessons', 'll1-a', 'text');
    expect(j.state).toBe('failed');
    expect(l.decide({ courseKey: 'living-lessons', lessonId: 'll1-a', kind: 'text', contentSha: items[0].contentSha })).toMatchObject({ run: true });
  });

  it('a pilot-1 needs-review parse fault is resumed; a real editorial review is not', () => {
    const l = ledger();
    const mk = (lessonId, lastError) => {
      const it = items.find((x) => x.lessonId === lessonId);
      l.write({ batchId: 'library-v1', courseKey: it.courseKey, lessonId, kind: 'text', contentSha: it.contentSha, idempotencyKey: `library-v1|${lessonId}`, state: 'needs-review', attempts: 1, costCents: 2, lastError });
      return it;
    };
    const a = mk('ll1-a', 'no JSON object in model output');
    const b = mk('ll2-b', 'generic-god');
    expect(l.decide({ courseKey: a.courseKey, lessonId: a.lessonId, kind: 'text', contentSha: a.contentSha })).toMatchObject({ run: true, reason: 'parse-fault' });
    expect(l.decide({ courseKey: b.courseKey, lessonId: b.lessonId, kind: 'text', contentSha: b.contentSha })).toMatchObject({ run: false, reason: 'needs-review' });
  });

  it('resuming keeps what earlier runs spent: the ledger never forgets a cent (proven-to-catch the overwrite)', async () => {
    const l = ledger();
    // Run 1: prose twice -> failed, 2c spent.
    await textRun(
      l,
      mockText(() => 'prose'),
      { items: items.slice(0, 1) }
    );
    expect(l.spentCents()).toBe(2);
    // Run 2, same batch key: succeeds on the first try for 1c more. Total must be 3, not 1.
    const l2 = ledger();
    const t = await textRun(
      l2,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 1) }
    );
    expect(t.done).toBe(1);
    expect(l2.spentCents()).toBe(3);
  });

  it('a resumed run skips the 10 finished titles and images and spends only on the rest', async () => {
    const l = ledger();
    // Two finished lessons (text + image), two that failed as prose.
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    await textRun(
      l,
      mockText(() => 'prose'),
      { items: items.slice(2, 4) }
    );
    await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    const spentBefore = l.spentCents();
    const text = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(ledger(), text, { items: items.slice(0, 4) });
    expect(t).toMatchObject({ skipped: 2, done: 2 });
    expect(text.calls.every((c) => !/Not with Eyeservice|Give Me This Mountain/.test(titleFrom(c.user)))).toBe(true);
    const img = mockImage();
    const l3 = ledger();
    const ti = await runImages({ items: items.slice(0, 4), ledger: l3, provider: img, outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    expect(ti.skipped).toBe(2);
    expect(img.calls).toBe(2);
    expect(l3.spentCents()).toBe(spentBefore + 2 + 12);
  });

  it('with 98c already in the ledger the run may spend at most 402c more', async () => {
    const scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
    expect(scope.remainingCents(null, 98)).toBe(402);
    expect(scope.remainingCents(400, 98)).toBe(400);
  });

  it('compose scope is a Set over the resolved lessons, by id or course::id (the want.has crash)', async () => {
    const { scopeKeySet } = await import('../../scripts/learn-presentation/lib/scope.mjs');
    const want = scopeKeySet(items.slice(0, 2));
    expect(typeof want.has).toBe('function');
    expect(want.has('ll1-a')).toBe(true);
    expect(want.has('living-lessons::ll2-b')).toBe(true);
    expect(want.has('ll3-c')).toBe(false);
    expect(scopeKeySet(undefined).size).toBe(0);
  });
});

describe('recovery is proven before a resumed run spends anything', () => {
  const finished = async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    return ledger();
  };
  const want = { minCents: 14, minText: 2, minImages: 2 };

  it('passes when the titles, the image bytes and the spend are all there', async () => {
    const v = verifyRecovery(await finished(), join(dir, 'img'), want);
    expect(v).toMatchObject({ ok: true, text: 2, images: 2, spent: 14 });
  });

  it('fails on an empty ledger (the cache did not come back)', () => {
    const v = verifyRecovery(ledger(), join(dir, 'img'), want);
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/0c spent.*|0 finished titles/);
  });

  it('fails when an image file is missing or its bytes changed', async () => {
    const l = await finished();
    const recs = Object.values(l.records).filter((r) => r.image);
    rmSync(join(dir, 'img', recs[0].image.path));
    writeFileSync(join(dir, 'img', recs[1].image.path), 'tampered');
    const v = verifyRecovery(l, join(dir, 'img'), want);
    expect(v.ok).toBe(false);
    expect(v.images).toBe(0);
    expect(v.problems.join(' ')).toMatch(/missing on disk[\s\S]*bytes changed/);
  });
});
