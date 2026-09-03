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
  POLICY_SHELF, POLICY_LAYERS, WORKED_CASES,
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

describe('the pre-sourced policy shelf is sourced, dated, and layered (DR-0076/DR-0100)', () => {
  it('every entry carries cite, gives, useIt, at least one source URL, and an asOf date', () => {
    expect(POLICY_SHELF.length).toBeGreaterThanOrEqual(5);
    const layerIds = POLICY_LAYERS.map((l) => l.id);
    for (const p of POLICY_SHELF) {
      expect(layerIds, `${p.id} layer`).toContain(p.layer);
      for (const field of ['cite', 'name', 'gives', 'useIt']) {
        expect(p[field] && p[field].length > 10, `${p.id} missing ${field}`).toBe(true);
      }
      expect(/^\d{4}-\d{2}-\d{2}$/.test(p.asOf), `${p.id} asOf not dated`).toBe(true);
      expect(Array.isArray(p.sources) && p.sources.length >= 1, `${p.id} unsourced`).toBe(true);
      for (const s of p.sources) {
        expect(s.url && s.url.startsWith('https://'), `${p.id} source url`).toBe(true);
        expect(s.label && s.label.length > 3, `${p.id} source label`).toBe(true);
      }
    }
    const ids = POLICY_SHELF.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('all three layers are populated — law, district, history', () => {
    for (const l of POLICY_LAYERS) {
      expect(POLICY_SHELF.some((p) => p.layer === l.id), `layer ${l.id} empty`).toBe(true);
    }
  });
  it('the load-bearing statute names automatic enrollment and the parents-in-the-process requirement', () => {
    const apa = POLICY_SHELF.find((p) => p.id === 'ps-accelerated-placement-act');
    expect(apa.cite).toBe('105 ILCS 5/14A-32');
    expect(apa.gives).toContain('AUTOMATIC ENROLLMENT');
    expect(apa.gives).toContain('next most rigorous level');
    expect(apa.gives.toLowerCase()).toContain('parents or guardians');
  });
  it('an unverified specific carries a verify note instead of an asserted claim', () => {
    const issra = POLICY_SHELF.find((p) => p.id === 'ps-issra');
    expect(issra.verify && issra.verify.length > 10).toBe(true);
    expect(issra.gives).not.toMatch(/\b\d+\s*(school|business)\s*days\b.*inspect/i);
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

// =============================================================================
// The worked example (2026-09-03). Two duties beyond the shared verse gate:
//   PRIVACY — this is a real family case involving an identifiable school
//   employee. The act is taught; the person is released (Titus 3:2). The gate
//   below is written so it does NOT itself embed the name it protects.
//   HONESTY BOTH WAYS (DR-0100) — the closing must carry the refusal AND the
//   correction. A case file that logs only the injury is a grudge with dates on
//   it, and under-claiming the repentance is as much a false report as
//   over-claiming the guilt.
// =============================================================================
describe('the worked example teaches the method without exposing a person', () => {
  const wc = WORKED_CASES[0];
  const blob = JSON.stringify(WORKED_CASES);

  it('maps onto this tool’s own vocabulary, so the fields teach themselves', () => {
    expect(WORKED_CASES.length).toBeGreaterThanOrEqual(1);
    for (const c of WORKED_CASES) {
      expect(ESCALATION_LADDER.some((r) => r.id === c.ladderStep), `unknown rung: ${c.ladderStep}`).toBe(true);
      expect(CASE_STATUSES.some((r) => r.id === c.status), `unknown status: ${c.status}`).toBe(true);
      expect(c.steps.length).toBeGreaterThanOrEqual(4);
      for (const st of c.steps) {
        expect(ENTRY_TYPES.some((t) => t.id === st.entryType), `unknown entry type: ${st.entryType}`).toBe(true);
        expect(EVIDENCE_TIERS.some((t) => t.id === st.evidenceTier), `unknown tier: ${st.evidenceTier}`).toBe(true);
        expect(st.what.length).toBeGreaterThan(30);
        expect(st.why.length).toBeGreaterThan(30);
      }
      expect(c.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('shows all three evidence tiers, including the institution’s own words', () => {
    const tiers = new Set(wc.steps.map((s) => s.evidenceTier));
    expect(tiers.has('their-words'), 'the strongest tier must be demonstrated').toBe(true);
    expect(tiers.has('our-witness')).toBe(true);
    // and it must show the win being logged, not only the injury
    expect(wc.steps.some((s) => s.entryType === 'outcome'), 'the outcome must be logged').toBe(true);
    expect(wc.steps.some((s) => s.entryType === 'response'), 'their answer must be logged').toBe(true);
  });

  it('closes honestly — the refusal AND the correction, both stated (DR-0100)', () => {
    expect(wc.closing).toMatch(/not applied|not honour/i);
    expect(wc.closing).toMatch(/refused twice|refused|no twice/i);
    expect(wc.closing, 'the correction is not omitted').toMatch(/corrected/i);
    expect(wc.closing, 'both halves are named as the truth').toMatch(/[Bb]oth halves/);
    expect(wc.closing, 'names the act, releases the person').toMatch(/release the PERSON|releases the person/i);
    expect(wc.closing, 'cites the reproof texts').toMatch(/Proverbs 9:8|25:12/);
    expect(wc.closing, 'cites the judge-righteously texts').toMatch(/John 7:24|Titus 3:2/);
  });

  it('PRIVACY — no person, institution, or location is identifiable', () => {
    expect(blob, 'an email address').not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(blob, 'a US postal code').not.toMatch(/\b\d{5}(-\d{4})?\b/);
    expect(blob, 'a street address').not.toMatch(/\b\d+\s+[NSEW]?\s?[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road)\b/);
    for (const token of ['Elementary', 'Librarian', 'School District', 'Unit 4', 'Champaign']) {
      expect(blob, `identifying token leaked into the worked example: ${token}`).not.toContain(token);
    }
    // referred to by role only
    expect(wc.institution).toMatch(/^A school library$/);
    expect(wc.student).toMatch(/fifth-grader/);
  });

  it('states its own anonymization commitment in the module, not just in a test', () => {
    const src = readFileSync(join(ROOT, 'src', 'lib', 'advocacy-cases.js'), 'utf8');
    expect(src).toMatch(/ANONYMIZED/);
    expect(src).toMatch(/the act is taught, the person is released/i);
  });
});
