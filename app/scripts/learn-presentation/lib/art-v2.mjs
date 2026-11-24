// =============================================================================
// art-v2 — regenerate ONLY the pictures the art-direction file names, under the
// same ledger, the same $5 combined cap and the same one-run-at-a-time lane.
// =============================================================================
// Why it exists: pilot 1's art direction asked for dark, gold-lit scenes. The
// free grade pass (learn-thumbs/grade.mjs) could not rescue every picture, and
// the owner asked for a new art direction (bright natural daylight). This stage:
//   - reads art-direction-v2.json (lessons + Explore by Topic covers);
//   - refuses any prompt holding a banned "dark" art term BEFORE any spend;
//   - accepts only entries the file names ("samples", "rest", "all-art", or ids),
//     at most 20 lessons + 6 topics — never the library;
//   - charges every try to the shared ledger (kind image-v2 / topic-v2), so the
//     combined $5 cap counts it; a finished picture is never bought twice;
//   - keeps the v1 picture on the record (imageV1) — paid work is never discarded.
// Nothing here writes to a lesson.
// =============================================================================
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { bannedArtTerms, finalImagePrompt } from './prompts.mjs';
import { idempotencyKey } from './ledger.mjs';
import { Budget, BudgetExceeded, sha256 } from './pipeline.mjs';
import { retry, withTimeout, pool, realSleep } from './limits.mjs';
import { PILOT_MAX_LESSONS, ScopeError } from './scope.mjs';

export const TOPIC_MAX = 6;

export function loadArt(path) {
  const art = JSON.parse(readFileSync(path, 'utf8'));
  if (art.schema !== 'learn-art-direction/v2') throw new ScopeError(`art file schema must be learn-art-direction/v2 (got ${art.schema})`);
  return art;
}

/** Every problem with the art file. Empty = safe to spend on. */
export function validateArt(art, { mountedKeys = null } = {}) {
  const problems = [];
  const lessons = art.lessons || [];
  const topics = art.topics || [];
  if (lessons.length > PILOT_MAX_LESSONS) problems.push(`at most ${PILOT_MAX_LESSONS} lessons (has ${lessons.length})`);
  if (topics.length > TOPIC_MAX) problems.push(`at most ${TOPIC_MAX} topics (has ${topics.length})`);
  const seen = new Set();
  for (const e of [...lessons.map((l) => ({ ...l, id: `${l.courseKey}::${l.lessonId}` })), ...topics.map((t) => ({ ...t, id: `topic::${t.key}` }))]) {
    if (seen.has(e.id)) problems.push(`duplicate entry ${e.id}`);
    seen.add(e.id);
    if (!String(e.prompt || '').trim()) problems.push(`${e.id}: empty prompt`);
    if (!String(e.alt || '').trim()) problems.push(`${e.id}: empty alt text`);
    const bad = bannedArtTerms(e.prompt);
    if (bad.length) problems.push(`${e.id}: banned art terms (the dark pilot look): ${bad.join(', ')}`);
    if (/\bGod\b/.test(`${e.prompt} ${e.alt}`)) problems.push(`${e.id}: say "Yahweh" in our voice, not "God" (DR-0210)`);
    if (mountedKeys && e.id.indexOf('topic::') !== 0 && !mountedKeys.has(e.id)) problems.push(`${e.id}: not a mounted lesson`);
  }
  for (const s of art.samples || []) if (!seen.has(s)) problems.push(`sample ${s} is not an entry`);
  return problems;
}

/** Resolve --only for art-v2: "samples" | "rest" (everything but the samples) | "all-art" | comma ids. */
export function resolveArtScope(only, art) {
  const all = [
    ...(art.lessons || []).map((l) => ({ kind: 'image-v2', id: `${l.courseKey}::${l.lessonId}`, courseKey: l.courseKey, lessonId: l.lessonId, entry: l })),
    ...(art.topics || []).map((t) => ({ kind: 'topic-v2', id: `topic::${t.key}`, courseKey: 'topics', lessonId: t.key, entry: t })),
  ];
  const raw = only === true || only == null ? '' : String(only).trim();
  if (!raw) throw new ScopeError('art-v2 must name its entries: samples, rest, all-art, or ids');
  const samples = new Set(art.samples || []);
  let picked;
  if (raw === 'samples') picked = all.filter((e) => samples.has(e.id));
  else if (raw === 'rest') picked = all.filter((e) => !samples.has(e.id));
  else if (raw === 'all-art') picked = all;
  else {
    const want = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    picked = want.map((w) => all.find((e) => e.id === w || e.lessonId === w));
    const missing = want.filter((w, i) => !picked[i]);
    if (missing.length) throw new ScopeError(`not in the art file: ${missing.join(', ')}`);
  }
  if (!picked.length) throw new ScopeError('no art entries selected');
  return picked;
}

function topicsPath(stateDir) {
  return join(stateDir, 'topics.json');
}
export function readTopics(stateDir) {
  const p = topicsPath(stateDir);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}
function writeTopics(stateDir, topics) {
  const p = topicsPath(stateDir);
  writeFileSync(`${p}.tmp`, JSON.stringify(topics, null, 1));
  renameSync(`${p}.tmp`, p);
}

/**
 * Generate the selected entries. contentSha for an art job is the PROMPT's
 * sha256: a rewritten prompt is new work, an unchanged one is never re-bought.
 */
export async function runArtV2({
  entries,
  ledger,
  provider,
  outDir,
  stateDir,
  batchId = 'library-v1',
  concurrency = 3,
  maxAttempts = 3,
  budget = new Budget(null),
  timeoutMs = 240000,
  sleep = realSleep,
  random = Math.random,
  log = () => {},
}) {
  const tally = { done: 0, skipped: 0, failed: 0, stoppedByBudget: false };
  const cost = provider.costCents != null ? provider.costCents : 0;
  const topics = readTopics(stateDir);
  await pool(entries, concurrency, async (e) => {
    if (tally.stoppedByBudget) return;
    const contentSha = sha256(e.entry.prompt);
    const d = ledger.decide({ courseKey: e.courseKey, lessonId: e.lessonId, kind: e.kind, contentSha, maxAttempts });
    if (!d.run) {
      tally.skipped += 1;
      return;
    }
    const rec = e.kind === 'image-v2' ? ledger.getRecord(e.courseKey, e.lessonId) : null;
    if (e.kind === 'image-v2' && !rec) {
      log(`art ✗ ${e.id}: no copy record`);
      tally.failed += 1;
      return;
    }
    const base = {
      batchId,
      courseKey: e.courseKey,
      lessonId: e.lessonId,
      kind: e.kind,
      contentSha,
      idempotencyKey: idempotencyKey({ batchId, courseKey: e.courseKey, lessonId: e.lessonId, kind: e.kind, contentSha }),
      provider: provider.name,
      model: provider.model,
    };
    const prior = ledger.costSoFar(base.idempotencyKey);
    const attempts = (d.attempts || 0) + 1;
    ledger.write({ ...base, state: 'running', attempts, leaseUntil: ledger.leaseUntil(), costCents: prior });
    const meter = { c: 0 };
    try {
      const out = await retry(
        async () => {
          const held = budget.reserve(cost);
          try {
            const r = await withTimeout((signal) => provider.generate({ prompt: finalImagePrompt(e.entry.prompt), signal }), timeoutMs, `art ${e.id}`);
            const c = r.costCents != null ? r.costCents : cost;
            budget.settle(held, c);
            meter.c += c;
            return r;
          } catch (err) {
            budget.settle(held, cost);
            meter.c += cost;
            throw err;
          }
        },
        { attempts: 3, sleep, random, onRetry: ({ attempt, wait, error }) => log(`art retry ${attempt} ${e.id} in ${wait}ms: ${error.message}`) }
      );
      const file = join(outDir, 'v2', e.courseKey, `${e.lessonId}.${out.ext || 'jpg'}`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, out.bytes);
      const image = {
        path: relative(outDir, file),
        sha256: sha256(out.bytes),
        provider: provider.name,
        model: out.model || provider.model,
        artVersion: 2,
        look: e.entry.look || 'default',
      };
      if (e.kind === 'image-v2') {
        ledger.putRecord({ ...rec, imageV1: rec.imageV1 || rec.image, image, visual: { prompt: e.entry.prompt, alt: e.entry.alt } });
      } else {
        topics[e.lessonId] = { key: e.lessonId, label: e.entry.label, alt: e.entry.alt, prompt: e.entry.prompt, image };
        writeTopics(stateDir, topics);
      }
      ledger.write({ ...base, state: 'succeeded', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: null });
      tally.done += 1;
      log(`art ✓ ${e.id}`);
    } catch (err) {
      if (err instanceof BudgetExceeded) {
        tally.stoppedByBudget = true;
        ledger.write({ ...base, state: 'queued', attempts: attempts - 1, costCents: prior + meter.c, leaseUntil: null, lastError: err.message });
        log(`budget: ${err.message}`);
        return;
      }
      ledger.write({
        ...base,
        state: 'failed',
        attempts,
        costCents: prior + meter.c,
        leaseUntil: null,
        lastError: String(err && err.message ? err.message : err),
      });
      tally.failed += 1;
      log(`art ✗ ${e.id}: ${err.message}`);
    }
  });
  return tally;
}
