// @vitest-environment node
// =============================================================================
// A commitment is counted once, not once per place it is written (DR-1128)
// =============================================================================
// Found while pulling the next dated item forward: the watcher reported
// "Overdue (1536)" of 2,069 dated commitments, and that number could not be
// trusted in either direction.
//
// WHY, measured on main 15141ac71. The watcher feeds the extractor the raw body
// of every DR record AND, separately, docs/decisions/INDEX.md -- a table whose
// every row summarises one record and reproduces its `re-review:` dates. So a
// commitment written once was counted twice: once from the record, once from
// its own index row. The existing dedup could not see it: its key is
// `origin|sourceId|date|clue`, and an echo differs on three of those four (the
// row's origin is `review`, its sourceId is `INDEX.md`, and its clue is the
// row's summary prose where the record's is the record's own). Nothing in the
// TEXT says the two are one commitment. Only the row's LINK does.
//
// THE SCANNING OF THE INDEX IS NOT THE BUG, and is kept. It was added on
// purpose (2026-07-30 comprehensive review) because commitments lived there and
// nothing read them. Measured: of 481 index-row commitments the extractor
// finds, 38 are NOT echoes -- dates that exist only in a row, including three
// rows citing DR-1104 and DR-1105, which have no record file on disk at all.
// Those are exactly what the widening was for, and they survive.
//
// A FINDING OF MINE THAT WAS WRONG FIRST, and is a case here because of it. I
// reported that this instrument over-counted a SINGLE commitment six times,
// citing DR-0143: `grep -c "re-review: 2026-08-07"` returned 1 while the
// watcher reported 6. `grep -c` counts matching LINES, not matches, and all six
// sit on one long line. Read in context they are six DIFFERENT parked items
// that share one date -- portable Agent Skills, calendar/email connectors, Open
// Notebook, multi-model routing, on-device browser AI, and the remote-session
// item. The watcher was right, and review-watcher.js:173-179 says in words that
// such siblings MUST each render. So this file pins that behaviour too: the fix
// below must not collapse them while removing the echoes.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractReReviews, dropIndexEchoes, LEDGER_INDEX_ID,
} from '../lib/re-reviews.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const DECISIONS = join(REPO, 'docs/decisions');
const NOW = Date.parse('2026-10-20T00:00:00Z');

const drFiles = () => readdirSync(DECISIONS).filter((f) => /^DR-\d+.*\.md$/.test(f));
const decisions = () => ({
  items: drFiles().map((f) => ({
    id: f.replace(/\.md$/, '').slice(0, 7), title: f,
    decision: readFileSync(join(DECISIONS, f), 'utf8'),
  })),
});
const indexOnly = () => ({
  items: [{
    id: LEDGER_INDEX_ID, title: 'Decision ledger index',
    findings: readFileSync(join(DECISIONS, 'INDEX.md'), 'utf8'),
    source: 'docs/decisions/INDEX.md',
  }],
});

describe('the echo of a commitment is not a second commitment', () => {
  it('an index row is dropped when its own record carries the same date', () => {
    const items = [
      { origin: 'decision', sourceId: 'DR-1122', date: '2026-12-20', clue: 'the record says it' },
      { origin: 'review', sourceId: LEDGER_INDEX_ID, owner: 'DR-1122', date: '2026-12-20', clue: 'the row says it too' },
    ];
    const kept = dropIndexEchoes(items);
    expect(kept).toHaveLength(1);
    expect(kept[0].sourceId).toBe('DR-1122');
  });

  it('and KEPT when the date lives only in the row — the reason the index is read', () => {
    const items = [
      { origin: 'decision', sourceId: 'DR-1122', date: '2026-12-20', clue: 'a different date' },
      { origin: 'review', sourceId: LEDGER_INDEX_ID, owner: 'DR-1122', date: '2026-11-01', clue: 'only the row says this' },
    ];
    expect(dropIndexEchoes(items)).toHaveLength(2);
  });

  it('and KEPT when the row cites a record that does not exist', () => {
    // Three real rows do this (DR-1104, DR-1105). Silencing them would hide a
    // commitment whose record was never written -- the worst one to lose.
    const items = [
      { origin: 'review', sourceId: LEDGER_INDEX_ID, owner: 'DR-9999', date: '2026-11-01', clue: 'orphan' },
    ];
    expect(dropIndexEchoes(items)).toHaveLength(1);
  });

  it('and KEPT when nothing links the row to a record at all', () => {
    const items = [
      { origin: 'decision', sourceId: 'DR-1122', date: '2026-12-20', clue: 'x' },
      { origin: 'review', sourceId: LEDGER_INDEX_ID, owner: null, date: '2026-12-20', clue: 'unattributable' },
    ];
    expect(dropIndexEchoes(items)).toHaveLength(2);
  });

  it('touches only the ledger index — a session note citing a DR keeps its own commitment', () => {
    // Narrow by construction: only the index is a table of one row per record.
    const items = [
      { origin: 'decision', sourceId: 'DR-1122', date: '2026-12-20', clue: 'x' },
      { origin: 'review', sourceId: 'session-note:2026-10-20-x.md', owner: 'DR-1122', date: '2026-12-20', clue: 'a note making its own commitment' },
    ];
    expect(dropIndexEchoes(items)).toHaveLength(2);
  });
});

describe('MEASURED on the real ledger, not a fixture', () => {
  it('443 of the 481 index-row commitments are echoes, and 38 are not', () => {
    const rows = extractReReviews({ reviews: indexOnly(), decisions: { items: [] } }, NOW);
    const beside = extractReReviews({ reviews: indexOnly(), decisions: decisions() }, NOW)
      .filter((i) => i.sourceId === LEDGER_INDEX_ID);
    expect(rows.length).toBe(481);
    expect(beside.length).toBe(38);
    expect(rows.length - beside.length).toBe(443);
  });

  it('the survivors include the rows whose record is not on disk', () => {
    const beside = extractReReviews({ reviews: indexOnly(), decisions: decisions() }, NOW)
      .filter((i) => i.sourceId === LEDGER_INDEX_ID);
    const files = drFiles();
    const orphans = beside.filter((i) => i.owner && !files.some((f) => f.startsWith(i.owner)));
    expect(orphans.map((o) => o.owner).sort()).toEqual(['DR-1104', 'DR-1104', 'DR-1105']);
  });

  it('anti-theater: the walk reads a real ledger, so a stopped parse cannot read as success', () => {
    expect(drFiles().length).toBeGreaterThan(900);
    expect(extractReReviews({ reviews: indexOnly(), decisions: decisions() }, NOW).length)
      .toBeGreaterThan(1000);
  });
});

describe('PROVEN-TO-CATCH: the siblings my wrong finding was about must survive', () => {
  it("DR-0143's six distinct 2026-08-07 commitments are six rows, not one", () => {
    // The case that makes this change safe. Six separate parked items share one
    // date inside one record; collapsing them is the failure review-watcher.js
    // names in its own comment. They are NOT echoes -- same record, same date,
    // different clauses -- so nothing here may touch them.
    const f = drFiles().find((x) => x.startsWith('DR-0143'));
    expect(f).toBeTruthy();
    const one = { items: [{ id: 'DR-0143', title: f, decision: readFileSync(join(DECISIONS, f), 'utf8') }] };
    const got = extractReReviews({ reviews: { items: [] }, decisions: one }, NOW)
      .filter((i) => i.date === '2026-08-07');
    expect(got.length).toBe(6);
    // Each is told apart by its own clause, which is what makes the report
    // actionable rather than six identical lines.
    expect(new Set(got.map((g) => g.clue)).size).toBe(6);
  });

  it('the house states the rule this test protects, in its own words', () => {
    const watcher = readFileSync(join(REPO, 'app/src/lib/review-watcher.js'), 'utf8');
    expect(watcher).toMatch(/The DISTINGUISHER is not optional/);
  });

  it('an echo and a sibling are told apart by the LINK, since no fingerprint can', () => {
    // Same record, same date, different clause  -> two commitments (kept).
    // Different source, same owner, same date   -> an echo (dropped).
    const sibling = [
      { origin: 'decision', sourceId: 'DR-0143', date: '2026-08-07', clue: 'agent skills' },
      { origin: 'decision', sourceId: 'DR-0143', date: '2026-08-07', clue: 'open notebook' },
    ];
    expect(dropIndexEchoes(sibling)).toHaveLength(2);
    const echo = [
      ...sibling,
      { origin: 'review', sourceId: LEDGER_INDEX_ID, owner: 'DR-0143', date: '2026-08-07', clue: 'the row summarising both' },
    ];
    expect(dropIndexEchoes(echo)).toHaveLength(2);
  });
});

describe('what the number becomes, and that it is still a real number', () => {
  it('the owner is carried on every item, so a consumer can attribute one', () => {
    const got = extractReReviews({ reviews: indexOnly(), decisions: decisions() }, NOW);
    const fromIndex = got.filter((i) => i.sourceId === LEDGER_INDEX_ID);
    expect(fromIndex.every((i) => 'owner' in i)).toBe(true);
    const fromRecord = got.find((i) => i.origin === 'decision');
    expect(fromRecord.owner).toBe(fromRecord.sourceId);
  });

  it('the records themselves are untouched — every record commitment still counts', () => {
    const only = extractReReviews({ reviews: { items: [] }, decisions: decisions() }, NOW);
    const beside = extractReReviews({ reviews: indexOnly(), decisions: decisions() }, NOW)
      .filter((i) => i.origin === 'decision');
    expect(beside.length).toBe(only.length);
  });

  it('the index file the measurement depends on is really there', () => {
    expect(existsSync(join(DECISIONS, 'INDEX.md'))).toBe(true);
  });
});
