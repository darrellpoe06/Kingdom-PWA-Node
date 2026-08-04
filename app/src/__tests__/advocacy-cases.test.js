// =============================================================================
// advocacy-cases gate — the Advocacy Case Manager's model holds (DR-0076)
// =============================================================================
// Three duties:
//   1. VERSE-VERBATIM (DR-0270 class): every Scripture anchor in the module is
//      an exact whole-verse match against the local KJV corpus — no drift, no
//      paraphrase presented as quotation.
//   2. MODEL INTEGRITY: tiers/types/statuses/ladder are internally consistent;
//      factories validate their enums; transforms sort and count honestly.
//   3. THE CONTEXT PACK IS REAL DATA ONLY: every line of the pack traces to a
//      real entry — dates, tiers, verbatim quotes — and the their-data gap is
//      named when no institution-held record is logged.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADVOCACY_VERSES, EVIDENCE_TIERS, ENTRY_TYPES, CASE_STATUSES, ESCALATION_LADDER,
  newCase, newEntry, casesOf, entriesOf, caseStats, ladderIndex, buildContextPack,
} from '../lib/advocacy-cases.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function kjvVerse(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) throw new Error(`unparseable ref: ${ref}`);
  const bookName = m[1] === 'Psalm' ? 'Psalms' : m[1];
  const book = JSON.parse(readFileSync(join(ROOT, 'public', 'bible', 'kjv', `${bookName}.json`), 'utf8'));
  return book.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

describe('Scripture anchors are verbatim KJV (DR-0270 class)', () => {
  it('every ADVOCACY_VERSES text is the exact whole verse from the local corpus', () => {
    expect(ADVOCACY_VERSES.length).toBeGreaterThanOrEqual(4);
    for (const v of ADVOCACY_VERSES) {
      expect(v.text, `${v.ref} drifted from the corpus`).toBe(kjvVerse(v.ref));
      expect(v.why && v.why.length, `${v.ref} missing its why`).toBeTruthy();
    }
  });
  it('the gate CATCHES drift (proven-to-catch)', () => {
    expect(kjvVerse('Habakkuk 2:2')).not.toBe('Write the vision, and make it plain.');
  });
});

describe('model integrity', () => {
  it('tier/type/status/ladder ids are unique and complete', () => {
    for (const list of [EVIDENCE_TIERS, ENTRY_TYPES, CASE_STATUSES, ESCALATION_LADDER]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const x of list) {
        expect(x.label, `${x.id} missing label`).toBeTruthy();
      }
    }
    // The three evidentiary tiers are exactly the architecture declared 2026-08-04.
    expect(EVIDENCE_TIERS.map((t) => t.id)).toEqual(['their-words', 'our-witness', 'their-data']);
    // The ladder walks the real path: start where the issue lives, end on the record.
    expect(ESCALATION_LADDER[0].id).toBe('direct');
    expect(ESCALATION_LADDER.map((s) => s.id)).toContain('records');
    expect(ESCALATION_LADDER[ESCALATION_LADDER.length - 1].id).toBe('board');
  });

  it('factories validate enums and trim fields', () => {
    const c = newCase({ title: '  STEM enrollment  ', status: 'bogus', ladderStep: 'bogus' });
    expect(c.title).toBe('STEM enrollment');
    expect(c.status).toBe('documenting');
    expect(c.ladderStep).toBe('direct');
    expect(c.kind).toBe('case');
    const e = newEntry(c.caseSlug, { entryType: 'nope', evidenceTier: 'nope', summary: ' x ' });
    expect(e.entryType).toBe('incident');
    expect(e.evidenceTier).toBe('our-witness');
    expect(e.summary).toBe('x');
    expect(e.caseSlug).toBe(c.caseSlug);
  });

  it('entriesOf sorts by occurredAt; caseStats counts honestly', () => {
    const c = newCase({ title: 'T' });
    const e1 = newEntry(c.caseSlug, { occurredAt: '2026-02-01', evidenceTier: 'their-words', summary: 'later' });
    const e2 = newEntry(c.caseSlug, { occurredAt: '2026-01-05', evidenceTier: 'our-witness', summary: 'earlier' });
    const records = [c, e1, e2];
    const sorted = entriesOf(records, c.caseSlug);
    expect(sorted.map((e) => e.occurredAt)).toEqual(['2026-01-05', '2026-02-01']);
    const stats = caseStats(records, c.caseSlug);
    expect(stats.total).toBe(2);
    expect(stats.byTier['their-words']).toBe(1);
    expect(stats.byTier['our-witness']).toBe(1);
    expect(stats.byTier['their-data']).toBe(0);
    expect(stats.first).toBe('2026-01-05');
    expect(stats.last).toBe('2026-02-01');
    expect(casesOf(records)).toHaveLength(1);
    expect(ladderIndex('bogus')).toBe(0);
  });
});

describe('the context pack is real data only (DR-0076)', () => {
  const c = newCase({ title: 'STEM enrollment', student: 'A student', institution: 'The district', ask: 'A seat in the class', ladderStep: 'district' });
  const e1 = newEntry(c.caseSlug, {
    occurredAt: '2026-01-10', entryType: 'communication', evidenceTier: 'their-words',
    parties: 'the counselor', summary: 'Enrollment request answered.',
    theirWords: 'There are no open seats at this time.', followUp: 'Asked for the seat count in writing.',
  });
  const e2 = newEntry(c.caseSlug, {
    occurredAt: '2026-01-15', entryType: 'incident', evidenceTier: 'our-witness',
    summary: 'Observed open seats during the visit.',
  });
  const records = [c, e1, e2];
  const pack = buildContextPack(c, records);

  it('carries the header, the ask, the span, and every dated entry in order', () => {
    expect(pack).toContain('CASE FILE: STEM enrollment');
    expect(pack).toContain('Student: A student');
    expect(pack).toContain('The ask: A seat in the class');
    expect(pack).toContain('2026-01-10 to 2026-01-15 (2 dated entries)');
    expect(pack.indexOf('2026-01-10')).toBeLessThan(pack.indexOf('2026-01-15'));
    expect(pack).toContain('District administration');
  });
  it('marks their words as verbatim and labels tiers', () => {
    expect(pack).toContain('Their words, verbatim: "There are no open seats at this time."');
    expect(pack).toContain('[Communication / Their words]');
    expect(pack).toContain('[Incident / Our witness]');
    expect(pack).toContain('Follow-up: Asked for the seat count in writing.');
  });
  it('names the their-data gap when no institution-held record is logged', () => {
    expect(pack).toContain('Their data: 0 entries');
    expect(pack).toContain('a public records request can fill this');
  });
  it('an empty case says so plainly instead of painting content', () => {
    const empty = newCase({ title: 'Empty' });
    const p = buildContextPack(empty, [empty]);
    expect(p).toContain('no entries yet');
    expect(buildContextPack(null, [])).toBe('');
  });
});
