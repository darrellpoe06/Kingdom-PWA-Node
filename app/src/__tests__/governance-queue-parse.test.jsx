// The Governor's decision queue is parsed from docs/governance/decision-queue.md
// at build time (vite.config.js → __GOVERNANCE_QUEUE__). The parser now lives in
// lib/governance-queue-parse.js so these tests prove exactly what the app shows.
//
// Characterized before the change (2026-09-29, lesson-pipeline governance
// review): the old parser ended the OPEN section only at "## DECIDED", so the
// BUILD BACKLOG and LANE COORDINATION text was read as part of the last OPEN
// block, and a "(Tier A)" in a lane note put "Tier A" on OPEN-5 (credentials, a
// bright line). The real file is pinned below: OPEN-5 carries no tier, because
// its own block names none.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { sectionBody, parseOpenItems, parseReviewFindings, parseGovernanceQueue } from '../lib/governance-queue-parse.js';
import { normalizeReviewFindings, normalizeGovernanceQueue } from '../components/GovernanceQueue.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const REAL = readFileSync(join(HERE, '../../../docs/governance/decision-queue.md'), 'utf8');

const SAMPLE = [
  '# Queue', '',
  '## OPEN — waiting on your call', '',
  '### OPEN-1 · First', '- **Unblocks:** a thing', '- **My recommendation:** yes', '- `DECISION:` _____', '',
  '### OPEN-2 · Second, no tier', '- **Unblocks:** another', '',
  '## BUILD BACKLOG', '',
  'Shipped (Tier A) and more (Tier C).', '',
  '## REVIEW FINDINGS', '',
  '### 2026-09-29 · A review', '- **Source:** docs/99-session-notes/x.md', '',
  '| id | finding | evidence | severity | owner | close-by |',
  '| --- | --- | --- | --- | --- | --- |',
  '| F-01 | A thing is wrong | run 123; a\\|b | high | lane | fix now |',
  '| F-02 | A smaller thing | file.js:9 | odd | coordinator | re-review: 2026-10-07 |', '',
  '## DECIDED — history', '', '### OPEN-9 · Decided long ago (Tier B)', '',
].join('\n');

describe('the queue parser (lib/governance-queue-parse.js)', () => {
  it('ends a section at the next "## " heading, not at DECIDED', () => {
    const open = sectionBody(SAMPLE, 'OPEN');
    expect(open).toContain('OPEN-2');
    expect(open).not.toContain('BUILD BACKLOG');
    expect(open).not.toContain('Tier A');
  });

  it('reads OPEN blocks with their fields; a block with no tier of its own has none', () => {
    const items = parseOpenItems(SAMPLE);
    expect(items.map((i) => i.id)).toEqual(['OPEN-1', 'OPEN-2']);
    expect(items[0]).toMatchObject({ title: 'First', unblocks: 'a thing', recommendation: 'yes' });
    expect(items[1].tier).toBe('');
  });

  it('reads the review findings as their own groups, with a literal pipe kept and an unknown severity left blank', () => {
    const [g] = parseReviewFindings(SAMPLE);
    expect(g.title).toBe('2026-09-29 · A review');
    expect(g.source).toBe('docs/99-session-notes/x.md');
    expect(g.findings.map((f) => f.id)).toEqual(['F-01', 'F-02']);
    expect(g.findings[0]).toMatchObject({ finding: 'A thing is wrong', evidence: 'run 123; a|b', severity: 'high', owner: 'lane', closeBy: 'fix now' });
    expect(g.findings[1].severity).toBe('');
  });

  it('never counts a finding as a decision waiting on the Governor', () => {
    const q = parseGovernanceQueue(SAMPLE);
    expect(q.openCount).toBe(2);
    expect(q.items.some((i) => /^F-/.test(i.id))).toBe(false);
    expect(q.reviews[0].findings).toHaveLength(2);
  });

  it('the REAL file: OPEN-5 (credentials, a bright line) is no longer labelled Tier A', () => {
    const q = parseGovernanceQueue(REAL);
    const open5 = q.items.find((i) => i.id === 'OPEN-5');
    expect(open5).toBeTruthy();
    expect(open5.tier).not.toBe('A');
    // non-vacuous: the file really does carry the lane text that used to bleed in
    expect(REAL).toMatch(/^## LANE COORDINATION/m);
    expect(REAL).toMatch(/\(Tier A\)/);
  });

  it('the REAL file carries the 2026-09-29 lesson-pipeline review, each finding with evidence, an owner and a close', () => {
    const q = parseGovernanceQueue(REAL);
    const g = q.reviews.find((r) => /lesson pipeline/i.test(r.title));
    expect(g).toBeTruthy();
    expect(g.source).toContain('docs/99-session-notes/2026-09-29-lesson-pipeline-governance-review.md');
    expect(g.findings.length).toBeGreaterThanOrEqual(10);
    for (const f of g.findings) {
      expect(f.evidence, f.id).not.toBe('');
      expect(f.owner, f.id).not.toBe('');
      expect(f.closeBy, f.id).toMatch(/fix now|fixed in|re-review: \d{4}-\d{2}-\d{2}|carried by/i);
      expect(['high', 'medium', 'low'], f.id).toContain(f.severity);
    }
  });

  it('the decisions this review raised are OPEN items with a recommendation', () => {
    const q = parseGovernanceQueue(REAL);
    const mine = q.items.filter((i) => /lesson/i.test(`${i.title} ${i.unblocks}`) && Number(i.id.slice(5)) >= 11);
    expect(mine.length).toBeGreaterThanOrEqual(2);
    for (const i of mine) expect(i.recommendation, i.id).not.toBe('');
  });
});

describe('the Governance surface renders the findings apart from the decisions', () => {
  it('normalizeReviewFindings tolerates a missing or garbled define', () => {
    expect(normalizeReviewFindings(undefined)).toEqual([]);
    expect(normalizeReviewFindings({ reviews: 'x' })).toEqual([]);
    expect(normalizeReviewFindings({ reviews: [{ title: 'T', findings: [{ id: 'F-1' }] }] })).toEqual([]);
  });

  it('the queue normalizer is unchanged by the new reviews key', () => {
    expect(normalizeGovernanceQueue({ ok: true, items: [], reviews: [{}] })).toEqual({ ok: true, openCount: 0, items: [] });
  });

  it('renders every finding with its evidence and close, under its own heading', async () => {
    // The component reads the build-time define at module load; give it the sample's parse.
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.__GOVERNANCE_QUEUE__ = parseGovernanceQueue(SAMPLE);
    vi.resetModules();
    const { default: GovernanceQueue } = await import('../components/GovernanceQueue.jsx');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(<GovernanceQueue />); });
    const box = host.querySelector('[data-testid="review-findings"]');
    expect(box).toBeTruthy();
    expect(box.textContent).toContain('These are not waiting on you');
    const rows = box.querySelectorAll('[data-testid="review-finding"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('A thing is wrong');
    expect(rows[0].textContent).toContain('run 123; a|b');
    expect(rows[1].textContent).toContain('re-review: 2026-10-07');
    // the decisions count still names only the two OPEN items
    expect(host.textContent).toContain('these are the 2 that do');
    await act(async () => { root.unmount(); });
    host.remove();
    delete globalThis.__GOVERNANCE_QUEUE__;
  });
});
