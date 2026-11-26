// =============================================================================
// The RIGHT ledger, never a stale one (incident 2026-11-25, run 45625192907):
// the cache restored a 20-lesson pilot ledger over the library's 176 paid
// pictures, an adjustment drove its spend to -$8.22, and it was saved as the
// newest ledger. Proven to catch here, with no network:
//   - staleness: a ledger that knows fewer paid pictures than the originals
//     manifest or the NAS verdict, or whose spend is negative, is STALE;
//   - ledger-restore replaces state/ and images/ only with a SUPERSET ledger
//     whose every paid picture is present with the paid bytes, else nothing moves;
//   - the batch-1 adjustment is never charged twice on the restored ledger;
//   - verify-resume --min-cents 98 already stops a negative-spend ledger.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ledgerFacts, restoreLedger, staleness, supersetCheck } from '../../scripts/learn-presentation/lib/ledger-restore.mjs';
import { Ledger } from '../../scripts/learn-presentation/lib/ledger.mjs';
import { applyAdjustments } from '../../scripts/learn-presentation/lib/adjust.mjs';
import { verifyRecovery } from '../../scripts/learn-presentation/lib/recovery.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const NAS = (expected, from = '45461834765') =>
  JSON.stringify({ at: '2026-11-25T13:02:27Z', from_run: from, expected, present_of_expected: expected, missing: 0 });
const ADJ = {
  id: 'batch1-refused-submits-2026-11-24',
  date: '2026-11-24',
  cents: -990,
  appliesTo: 'image',
  reason: 'refused submits are never billed',
  evidence: 'run 45443285162',
};

/** A ledger dir (root/state + images to the side) holding n lessons, each a title and a paid picture. */
function ledgerDir(root, n, { adjusted = false, picturesAt = 'images', skipBytes = [] } = {}) {
  const state = join(root, 'state');
  const pics = join(root, picturesAt);
  mkdirSync(state, { recursive: true });
  mkdirSync(join(pics, 'course'), { recursive: true });
  const rows = [];
  const records = {};
  for (let i = 1; i <= n; i += 1) {
    const id = `l${i}`;
    const bytes = Buffer.from(`picture ${i}`);
    if (!skipBytes.includes(i)) writeFileSync(join(pics, 'course', `${id}.jpg`), bytes);
    rows.push({ idempotencyKey: `library-v1|course|${id}|text|c${i}`, kind: 'text', state: 'succeeded', costCents: 1 });
    rows.push({ idempotencyKey: `library-v1|course|${id}|image|c${i}`, kind: 'image', state: 'succeeded', costCents: 6 });
    records[`course::${id}`] = { courseKey: 'course', lessonId: id, image: { path: `course/${id}.jpg`, sha256: sha(bytes) } };
  }
  if (adjusted) rows.push({ idempotencyKey: `adjustment|${ADJ.id}`, kind: 'adjustment', state: 'succeeded', costCents: ADJ.cents });
  writeFileSync(join(state, 'jobs.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(state, 'records.json'), JSON.stringify(records));
  return { root, state };
}
const tmp = (p) => mkdtempSync(join(tmpdir(), p));
const manifestOf = (n) => ({ entries: Array.from({ length: n }, (_, i) => ({ sha256: sha(Buffer.from(`picture ${i + 1}`)) })) });

describe('stale-ledger guard: no paid step on a ledger that knows less than permanent storage', () => {
  it('catches the incident ledger: 20 pictures, spend negative, NAS expects 176 from run 45461834765', () => {
    const stale = ledgerFacts(ledgerDir(tmp('lr-stale-'), 20, { adjusted: true }).state);
    expect(stale.paidPictures).toBe(20);
    expect(stale.spentCents).toBe(20 * 7 - 990); // -850c: the -$8.22 class
    const s = staleness({ ...stale, nasVerdict: NAS(176), ledgerKey: 'learn-presentation-ledger-45625192907' });
    expect(s.stale).toBe(true);
    expect(s.reasons.join(' ')).toMatch(/negative/);
    expect(s.reasons.join(' ')).toMatch(/expects 176 .*45461834765.*run 45625192907\) knows 20/);
    expect(s.remedy).toMatch(/only=ledger-restore/);
  });

  it('catches a ledger that knows fewer pictures than the private originals manifest', () => {
    const f = ledgerFacts(ledgerDir(tmp('lr-m-'), 20).state);
    expect(staleness({ ...f, manifest: manifestOf(176) }).stale).toBe(true);
    expect(staleness({ ...f, manifest: manifestOf(20) }).stale).toBe(false);
  });

  it('catches a negative spend even when no storage source is readable', () => {
    expect(staleness({ paidPictures: 176, spentCents: -1, manifest: null, nasVerdict: '' }).stale).toBe(true);
  });

  it('passes the real library ledger: 176 known, NAS 176, manifest 176, spend positive', () => {
    const f = ledgerFacts(ledgerDir(tmp('lr-ok-'), 176, { adjusted: true }).state);
    const s = staleness({ ...f, manifest: manifestOf(176), nasVerdict: NAS(176) });
    expect(s).toEqual({ stale: false, reasons: [], remedy: '' });
  });

  it('a replaced picture (job kept, record moved on) does not read as stale', () => {
    expect(staleness({ paidPictures: 175, pictureJobs: 180, spentCents: 900, manifest: manifestOf(176) }).stale).toBe(false);
  });

  it('verify-resume --min-cents 98 already stops a negative-spend ledger before any spend', () => {
    const w = ledgerDir(tmp('lr-vr-'), 20, { adjusted: true });
    const v = verifyRecovery(new Ledger(w.state), join(w.root, 'images'), { minCents: 98, minText: 10, minImages: 10 });
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/-850c spent, expected at least 98c/);
  });
});

describe('ledger-restore: the authoritative ledger comes back from an artifact, only as a superset', () => {
  /** current = the stale 20-lesson ledger in root; artifact = 30 lessons with pictures under outbox/. */
  function setup(artifactOpts = {}, artifactN = 30) {
    const root = tmp('lr-root-');
    ledgerDir(root, 20, { adjusted: true });
    const art = tmp('lr-art-');
    ledgerDir(art, artifactN, { adjusted: true, picturesAt: 'outbox', ...artifactOpts });
    return { root, art, before: readFileSync(join(root, 'state', 'jobs.jsonl'), 'utf8') };
  }

  it('replaces state/ and images/ with the superset artifact, every paid picture verified', () => {
    const { root, art } = setup();
    const r = restoreLedger({ root, artifactDir: art });
    expect(r.ok).toBe(true);
    expect(r.pictures).toBe(30);
    expect(ledgerFacts(join(root, 'state')).paidPictures).toBe(30);
    expect(existsSync(join(root, 'images', 'course', 'l30.jpg'))).toBe(true);
    expect(existsSync(join(root, 'images.restore'))).toBe(false);
  });

  it('refuses an artifact missing a job the current ledger knows, and moves nothing', () => {
    const { root, art, before } = setup({}, 10);
    const r = restoreLedger({ root, artifactDir: art });
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/not in the artifact's/);
    expect(r.reasons.join(' ')).toMatch(/10 succeeded picture job\(s\), the current ledger 20/);
    expect(readFileSync(join(root, 'state', 'jobs.jsonl'), 'utf8')).toBe(before);
  });

  it('refuses when a paid picture the artifact names is absent with the paid bytes, and moves nothing', () => {
    const { root, art, before } = setup({ skipBytes: [25] });
    const r = restoreLedger({ root, artifactDir: art });
    expect(r.ok).toBe(false);
    expect(r.reasons[0]).toMatch(/1 paid picture\(s\).*course\/l25/);
    expect(readFileSync(join(root, 'state', 'jobs.jsonl'), 'utf8')).toBe(before);
    expect(existsSync(join(root, 'images.restore'))).toBe(false);
  });

  it('a picture absent from the artifact but already on the runner with the paid bytes is kept', () => {
    const { root, art } = setup({ skipBytes: [5] }); // l5 is in the current images/
    expect(restoreLedger({ root, artifactDir: art }).ok).toBe(true);
  });

  it('ignores adjustment rows in the superset check (they come back from git)', () => {
    const cur = ledgerFacts(ledgerDir(tmp('lr-a-'), 2, { adjusted: true }).state);
    const cand = ledgerFacts(ledgerDir(tmp('lr-b-'), 2).state);
    expect(supersetCheck(cur, cand).ok).toBe(true);
  });

  it('never charges the batch-1 adjustment twice: carried once, or applied once', () => {
    const { root, art } = setup();
    restoreLedger({ root, artifactDir: art });
    const l = new Ledger(join(root, 'state'));
    const spent = l.spentCents();
    expect(applyAdjustments(l, [ADJ])).toEqual([]);
    expect(l.spentCents()).toBe(spent);
    const bare = new Ledger(ledgerDir(tmp('lr-c-'), 3).state);
    expect(applyAdjustments(bare, [ADJ])).toEqual([ADJ.id]);
    expect(applyAdjustments(bare, [ADJ])).toEqual([]);
    expect(bare.spentCents()).toBe(3 * 7 - 990);
  });
});
