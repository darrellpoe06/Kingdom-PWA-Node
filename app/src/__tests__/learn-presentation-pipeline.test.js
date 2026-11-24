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

const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const noSleep = async () => {};

function fixture() {
  const mk = (id, title) => ({ id, title, bigIdea: `Big idea of ${title}.`, lesson: `The adult text of ${title}. "In the beginning God created the heaven and the earth." (Genesis 1:1)`, levels: { teen: `Teen text of ${title}.` } });
  return deepFreeze([
    { key: 'living-lessons', title: 'Living Lessons from the Word', department: 'Living Lessons', meta: { title: 'Living Lessons from the Word', category: 'Living Lessons' }, lessons: [mk('ll1-a', 'Not with Eyeservice — faithful work'), mk('ll2-b', 'Give Me This Mountain'), mk('ll3-c', 'Whoso Removeth Stones')] },
    { key: 'stocks', title: 'Stocks', department: 'Stock Market', meta: { title: 'Stocks', category: 'Stock Market' }, lessons: [mk('stk1-d', 'When you buy a share'), mk('stk2-e', 'Primary and secondary')] },
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
const goodCopy = (t) => JSON.stringify({ displayTitle: COPY[t], thumbHeadline: `${COPY[t].split(' ')[0]} HEADLINE NOW`, promoDescription: 'What the lesson teaches.', imagePrompt: 'A cinematic scene.', imageAlt: 'A person at work.' });

function mockText(fn) {
  const p = { name: 'mock', model: 'mock-1', costCents: 1, calls: [], complete: async (req) => { p.calls.push(req); return { text: await fn(req, p.calls.length), model: 'mock-1', costCents: 1 }; } };
  return p;
}
function mockImage(fn = (prompt) => Buffer.from(`img:${prompt.slice(0, 40)}:${Math.random()}`)) {
  const p = { name: 'mockimg', model: 'mock-img', costCents: 6, calls: 0, generate: async ({ prompt }) => { p.calls += 1; return { bytes: await fn(prompt, p.calls), ext: 'jpg', model: 'mock-img', costCents: 6 }; } };
  return p;
}

let dir; let inv; let courses; let items;
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
    const t = await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
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
    await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
    const again = mockText(() => { throw new Error('must not be called'); });
    const t = await textRun(new Ledger(join(dir, 'state')), again);
    expect(t).toMatchObject({ done: 0, skipped: 5 });
    expect(again.calls.length).toBe(0);
  });

  it('a lesson whose content changed is re-queued, never reused', async () => {
    const l = ledger();
    await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
    const changed = items.map((it) => (it.lessonId === 'll2-b' ? { ...it, contentSha: 'f'.repeat(64) } : it));
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await runText({ items: changed, ledger: new Ledger(join(dir, 'state')), provider: p, courses, batchId: 'b1', concurrency: 1, sleep: noSleep });
    expect(t).toMatchObject({ done: 1, skipped: 4 });
  });

  it('a job left running past its lease is resumed', () => {
    let now = 1_000_000;
    const l = new Ledger(join(dir, 'state'), { clock: () => now, leaseMs: 1000 });
    l.write({ idempotencyKey: 'k', courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x', state: 'running', attempts: 1, leaseUntil: new Date(now + 1000).toISOString() });
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' }).run).toBe(false);
    now += 5000;
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' })).toMatchObject({ run: true, reason: 'lease-expired' });
  });
});

describe('retries, timeouts and budget', () => {
  it('retries a 503 with backoff, then records the failure', async () => {
    const waits = [];
    const p = mockText(() => { throw new ProviderError('busy', { status: 503 }); });
    const t = await textRun(ledger(), p, { items: items.slice(0, 1), sleep: async (ms) => { waits.push(ms); }, random: () => 0.5 });
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
    let now = 0; const waited = [];
    const b = new TokenBucket(2, { now: () => now, sleep: async (ms) => { waited.push(ms); now += ms; } });
    await b.take(); await b.take(); await b.take();
    expect(waited.length).toBe(1);
    expect(waited[0]).toBeGreaterThan(0);
  });
});

describe('quality gates', () => {
  it('a duplicate display title anywhere in the library is rejected to review', async () => {
    const p = mockText(() => JSON.stringify({ displayTitle: 'The Same Title Every Time', thumbHeadline: 'SAME HEADLINE HERE', promoDescription: 'x', imagePrompt: 'y', imageAlt: 'z' }));
    const t = await textRun(ledger(), p, { items: items.slice(0, 2) });
    expect(t).toMatchObject({ done: 1, needsReview: 1 });
  });

  it('validator errors are fed back once, then routed to needs-review as a draft', async () => {
    const p = mockText(() => JSON.stringify({ displayTitle: 'How God Uses Your Past', thumbHeadline: 'YOUR PAST MATTERS', promoDescription: 'x', imagePrompt: 'y', imageAlt: 'z' }));
    const l = ledger();
    const t = await textRun(l, p, { items: items.slice(0, 1) });
    expect(t.needsReview).toBe(1);
    expect(p.calls.length).toBe(2);
    expect(p.calls[1].user).toMatch(/rejected for: generic-god/);
    expect(l.getRecord('living-lessons', 'll1-a').status).toBe('draft');
  });

  it('identical image bytes are flagged for review', async () => {
    const l = ledger();
    await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
    const t = await runImages({ items, ledger: l, provider: mockImage(() => Buffer.from('same')), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    expect(t.done).toBe(1);
    expect(t.needsReview).toBe(4);
  });

  it('near-duplicate perceptual hashes are flagged when a hash hook is supplied', async () => {
    const l = ledger();
    await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
    const t = await runImages({ items: items.slice(0, 2), ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep, perceptualHash: async () => 'ffffffffffffff00' });
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
    await textRun(l, mockText((req) => goodCopy(titleFrom(req.user))));
    const out = exportRecords(l);
    expect(out.records).toHaveLength(5);
    expect(new Set(out.records.map((r) => r.status))).toEqual(new Set(['review']));
    expect(Object.keys(out.records[0])).toEqual(expect.arrayContaining(['lessonId', 'courseKey', 'originalTitleAtApproval', 'displayTitle', 'thumbHeadline', 'visual', 'image']));
    expect(readFileSync(join(dir, 'state', 'jobs.jsonl'), 'utf8').trim().split('\n').length).toBeGreaterThan(5);
  });
});

describe('prompts, prices and providers', () => {
  it('parses fenced JSON and refuses missing keys', () => {
    expect(parseCopy('```json\n{"displayTitle":"a","thumbHeadline":"b c","promoDescription":"d","imagePrompt":"e","imageAlt":"f"}\n```').displayTitle).toBe('a');
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
      if (url === 'https://poll/1') return { ok: true, json: async () => ({ status: seen.length < 4 ? 'Pending' : 'Ready', result: { sample: 'https://cdn/img.jpg' } }) };
      return { ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    };
    const p = bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep });
    const out = await p.generate({ prompt: 'x', signal: new AbortController().signal });
    expect(out).toMatchObject({ ext: 'jpg', costCents: 6 });
    expect(out.bytes.length).toBe(3);
  });
});
