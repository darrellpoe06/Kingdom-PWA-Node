// =============================================================================
// A research answer becomes a reading: what it is, the opportunities, the
// constraints, the next step, where it lands (DR-1200)
// =============================================================================
// Darrell, 2026-10-21, from the Research tab with a raw transcript as the
// answer: "What happens when we get the results from our Research? Did we
// create the systems I expected... opportunities and constraints... fix it."
// The four pieces, pinned together: the forwarder's /read door (its own
// selftest, run in ci.yml), the renderer that writes the row, the parser that
// reads it back, and the surface that draws it -- plus the lane that runs it
// at most once per run, only when nothing waited to be answered.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseReading, researchItems, READING_PENDING, LANDS, RESEARCH_TAG, ANSWER_TAG, READING_TAG, READING_FAILED_TAG } from '../lib/research-items.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const row = (o) => ({ id: 'a', body: '', tags: [], created_at: '2026-10-21T06:00:00Z', created_by: 'u1', ...o });

function render(json) {
  const dir = mkdtempSync(join(tmpdir(), 'reading-'));
  const f = join(dir, 'read.json');
  writeFileSync(f, JSON.stringify(json));
  try {
    return { ok: true, out: execFileSync('node', [join(ROOT, 'scripts', 'research-reading-text.mjs'), f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { ok: false, err: String(e.stderr || '') };
  }
}

const GOOD = {
  code: 200, verified: false, truncated: false,
  reading: {
    what: 'A transcript about the Maya and the corn men.',
    opportunities: ['A History lesson on the Maya', 'A Love Corner trivia week'],
    constraints: ['The transcript is unverified'],
    next: 'Draft the lesson.', lands: 'learn',
  },
};

describe('the renderer writes the reading, or refuses', () => {
  it('a good reading renders to the fixed shape the parser reads back', () => {
    const r = render(GOOD);
    expect(r.ok).toBe(true);
    expect(r.out).toBe([
      'Reading:', 'What it is: A transcript about the Maya and the corn men.',
      'Opportunities:', '- A History lesson on the Maya', '- A Love Corner trivia week',
      'Constraints:', '- The transcript is unverified',
      'Next step: Draft the lesson.', 'Lands: learn', '',
    ].join('\n'));
    expect(parseReading(`Unverified: x\n\n${r.out}`)).toEqual({
      what: 'A transcript about the Maya and the corn men.',
      opportunities: ['A History lesson on the Maya', 'A Love Corner trivia week'],
      constraints: ['The transcript is unverified'], next: 'Draft the lesson.', lands: 'learn', truncated: false,
    });
  });
  it('PROVEN TO CATCH: a refusal from the road, a reading that stopped saying unverified, and one that says nothing are never written', () => {
    expect(render({ code: 503, error: 'No AI tower was answering' }).err).toMatch(/503: No AI tower was answering/);
    expect(render({ ...GOOD, verified: true }).err).toMatch(/stopped saying it is unverified/);
    expect(render({ ...GOOD, reading: { what: '' } }).err).toMatch(/without saying what the material is/);
  });
  it('a landing the app does not know reads as unplaced; truncated words say so', () => {
    const r = render({ ...GOOD, truncated: true, reading: { ...GOOD.reading, lands: 'the moon!' } });
    const p = parseReading(r.out);
    expect(p.lands).toBe('unplaced');
    expect(p.truncated).toBe(true);
    expect(parseReading('no reading here')).toBe(null);
  });
});

describe('the item carries its reading, or says it is pending', () => {
  const base = [
    row({ id: 'r1', body: 'https://mt27.org/msg/x We need this inside the Love Corner App each week.', tags: [RESEARCH_TAG, 'research-answered'] }),
    row({ id: 'c1', tags: [ANSWER_TAG, 'of:r1'], body: 'Unverified: ...\n\n# Transcript\nThe trivia questions.' }),
  ];
  it('an answered item with no reading says the reading is pending, in words', () => {
    const [it] = researchItems(base);
    expect(it.reading).toBe(null);
    expect(it.readingWhy).toBe(READING_PENDING);
  });
  it('a failed reading says the road\'s own why (the newest), never the standing sentence', () => {
    const [it] = researchItems([...base,
      row({ id: 'f1', tags: [READING_FAILED_TAG, 'of:r1'], body: 'old why', created_at: '2026-10-21T07:00:00Z' }),
      row({ id: 'f2', tags: [READING_FAILED_TAG, 'of:r1'], body: 'No AI tower was answering', created_at: '2026-10-21T08:00:00Z' })]);
    expect(it.readingWhy).toBe('No AI tower was answering');
  });
  it('a reading is parsed onto the item, and the waiting item (no answer) carries neither', () => {
    const body = `Unverified: x\n\n${render({ ...GOOD, reading: { ...GOOD.reading, lands: 'love-corner' } }).out}`;
    const [it] = researchItems([...base, row({ id: 'g1', tags: [READING_TAG, 'of:r1'], body })]);
    expect(it.reading.lands).toBe('love-corner');
    expect(LANDS[it.reading.lands].label).toBe('The Love Corner App');
    expect(it.readingWhy).toBe('');
    const [w] = researchItems([row({ id: 'w1', body: 'a question?', tags: [RESEARCH_TAG] })]);
    expect(w.reading).toBe(null);
    expect(w.readingWhy).toBe('');
  });
});

describe('the lane runs it at most once per run, and never hammers a sleeping tower', () => {
  const wf = read('.github', 'workflows', 'research-inbox.yml');
  const sql = read('scripts', 'research-reading-waiting.sql');
  it('every reading step runs only when nothing waited to be answered', () => {
    const steps = wf.split('\n      - name: ').filter((b) => /rwait|steps\.read\.|research-reading/.test(b));
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(wf).toMatch(/if: steps\.gate\.outputs\.go == 'true' && steps\.waiting\.outputs\.found != 'true'\n\s+id: rwait/);
    for (const b of steps.filter((x) => x.includes("steps.rwait.outputs.found == 'true'"))) expect(b).toMatch(/steps\.rwait\.outputs\.found == 'true'/);
  });
  it('claims before spending the road, releases on failure, and waits six hours after a failed reading', () => {
    expect(wf).toMatch(/research-reading-claimed/);
    expect(wf).toMatch(/tags - 'research-reading-claimed'/);
    expect(sql).toMatch(/research-reading-failed/);
    expect(sql).toMatch(/interval '6 hours'/);
    expect(sql).toMatch(/LIMIT 1;/);
  });
  it('the reading road is the forwarder\'s /read, and its selftest runs in CI', () => {
    expect(wf).toMatch(/127\.0\.0\.1:8797\/read/);
    const fwd = read('infra', 'nas-research', 'research_forwarder.py');
    expect(fwd).toMatch(/READ_PATHS = \{"\/read", "\/research\/read"\}/);
    expect(fwd).toMatch(/"verified": False/);
    expect(read('.github', 'workflows', 'ci.yml')).toMatch(/python3 research_forwarder\.py --selftest/);
  });
});
