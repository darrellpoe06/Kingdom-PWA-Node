// The new art direction (2026-11-24): prompts are checked before any spend, the
// selection is only what art-direction-v2.json names, every try is charged to the
// shared ledger under the $5 combined cap, and the paid v1 picture is kept.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Ledger } from '../../scripts/learn-presentation/lib/ledger.mjs';
import { Budget } from '../../scripts/learn-presentation/lib/pipeline.mjs';
import { bannedArtTerms, finalImagePrompt, BRAND_LOOK } from '../../scripts/learn-presentation/lib/prompts.mjs';
import { loadArt, validateArt, resolveArtScope, runArtV2, readTopics } from '../../scripts/learn-presentation/lib/art-v2.mjs';
import { remainingCents } from '../../scripts/learn-presentation/lib/scope.mjs';

const ART = loadArt(resolve(__dirname, '../../scripts/learn-presentation/art-direction-v2.json'));
const PILOT1_PROMPT =
  'Cinematic 16:9 photograph of a focused Black woman at a desk in a quiet, dim home office. Warm gold light from a single window. Deep black shadows surround the room. The left third of the frame is left as open, dark negative space.';

const fakeProvider = (opts = {}) => {
  let n = 0;
  return {
    name: 'fake',
    model: 'fake-1',
    costCents: 6,
    calls: () => n,
    async generate() {
      n += 1;
      if (opts.fail) throw new Error('boom');
      return { bytes: Buffer.from(`img-${n}`), ext: 'jpg', costCents: 6 };
    },
  };
};
const ledgerWithRecord = () => {
  const dir = mkdtempSync(join(tmpdir(), 'art-v2-'));
  const ledger = new Ledger(join(dir, 'state'));
  for (const l of ART.lessons)
    ledger.putRecord({
      courseKey: l.courseKey,
      lessonId: l.lessonId,
      status: 'review',
      thumbHeadline: 'A B',
      image: { path: `${l.courseKey}/${l.lessonId}.jpg`, sha256: 'v1' },
      visual: { prompt: PILOT1_PROMPT, alt: 'old' },
    });
  return { dir, ledger };
};

describe('art direction v2', () => {
  it('the gate refuses the dark pilot-1 look (proven to catch)', () => {
    expect(bannedArtTerms(PILOT1_PROMPT)).toEqual(expect.arrayContaining(['dim', 'deep black', 'negative space']));
    const bad = { ...ART, lessons: [{ ...ART.lessons[0], prompt: PILOT1_PROMPT }] };
    expect(validateArt(bad).join(' ')).toMatch(/banned art terms/);
  });

  it('the committed art file is clean, and the brand guard asks for daylight, not darkness', () => {
    expect(validateArt(ART)).toEqual([]);
    expect(bannedArtTerms(BRAND_LOOK)).toEqual([]);
    expect(finalImagePrompt('x')).toMatch(/bright natural daylight/);
    expect(finalImagePrompt('x')).not.toMatch(/negative space|deep blacks|gold light/);
  });

  it('samples are exactly three; rest is every other entry; nothing outside the file', () => {
    expect(resolveArtScope('samples', ART)).toHaveLength(3);
    expect(resolveArtScope('rest', ART)).toHaveLength(ART.lessons.length + ART.topics.length - 3);
    expect(resolveArtScope('all-art', ART)).toHaveLength(ART.lessons.length + ART.topics.length);
    expect(ART.lessons.length).toBeLessThanOrEqual(20);
    expect(() => resolveArtScope('', ART)).toThrow(/must name/);
    expect(() => resolveArtScope('ll999-not-a-lesson', ART)).toThrow(/not in the art file/);
  });

  it('charges the shared ledger, keeps v1, and never buys a finished picture twice', async () => {
    const { dir, ledger } = ledgerWithRecord();
    const p = fakeProvider();
    const entries = resolveArtScope('samples', ART);
    const t = await runArtV2({ entries, ledger, provider: p, outDir: join(dir, 'images'), stateDir: join(dir, 'state'), budget: new Budget(100) });
    expect(t.done).toBe(3);
    expect(ledger.spentCents()).toBe(18);
    const rec = ledger.getRecord('little-learners', 'lil2-count-the-days-one-to-seven');
    expect(rec.imageV1.sha256).toBe('v1');
    expect(rec.image.artVersion).toBe(2);
    expect(existsSync(join(dir, 'images', rec.image.path))).toBe(true);
    const again = await runArtV2({ entries, ledger, provider: p, outDir: join(dir, 'images'), stateDir: join(dir, 'state'), budget: new Budget(100) });
    expect(again.skipped).toBe(3);
    expect(p.calls()).toBe(3);
  });

  it('stops at the cap: the $5 combined ceiling counts what earlier runs spent', async () => {
    const { dir, ledger } = ledgerWithRecord();
    const p = fakeProvider();
    const entries = resolveArtScope('rest', ART);
    // 168c already spent by the pilot leaves 332c; a 12c run cap allows exactly two pictures.
    const t = await runArtV2({
      entries,
      ledger,
      provider: p,
      outDir: join(dir, 'images'),
      stateDir: join(dir, 'state'),
      budget: new Budget(Math.min(12, remainingCents(null, 168))),
      concurrency: 1,
    });
    expect(t.done).toBe(2);
    expect(t.stoppedByBudget).toBe(true);
    expect(ledger.spentCents()).toBe(12);
  });

  it('writes topic covers beside, never into, lesson records', async () => {
    const { dir, ledger } = ledgerWithRecord();
    const entries = resolveArtScope('topic::faith,topic::tech', ART);
    await runArtV2({ entries, ledger, provider: fakeProvider(), outDir: join(dir, 'images'), stateDir: join(dir, 'state'), budget: new Budget(100) });
    const topics = readTopics(join(dir, 'state'));
    expect(Object.keys(topics).sort()).toEqual(['faith', 'tech']);
    expect(ledger.getRecord('topics', 'faith')).toBeNull();
    expect(JSON.parse(readFileSync(join(dir, 'state', 'topics.json'), 'utf8')).tech.label).toBe('A.I. & Technology');
  });
});
