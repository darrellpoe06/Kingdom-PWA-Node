// @vitest-environment node
// =============================================================================
// Is every quotation His words, WHOLE — and is our bookkeeping out of the way?
// =============================================================================
// Found 2026-09-18, mid-way through the full-levels pass. L89 and L88 — two
// consecutive lessons — each turned out to be shipping the SAME two defects, so
// rather than patch the pair, the series was measured:
//
//   745 quoted spans across 113 of 172 lessons carry an ellipsis. 704 are
//   genuine elisions of HIS WORDS (both sides verbatim in the local KJV
//   corpus), and 679 of those have a CONTIGUOUS verbatim span available that
//   would cover the whole quotation. DR-0459's rule is that the remedy for a
//   long quotation is always a shorter genuinely-verbatim span and NEVER an
//   elision — and the measurement says that remedy is reachable for the
//   overwhelming majority, usually by quoting a little MORE of the verse.
//
//   44 of 172 lessons print a DR-nnnn identifier into text a READER sees.
//   Almost always a senior band opening with a rule and its internal citation,
//   e.g. "(DR-0098: let the Word explain the Word)". The rule is right every
//   time; the citation is ours, not theirs.
//
// A RATCHET, NOT A SWEEP — the same reasoning title-in-narrative.mjs gives for
// its 468, and the reason this repo forbids a blind God->Yahweh sweep. 745
// replacements are 745 judgement calls: the right contiguous span has to be
// chosen by reading the verse, and the sentence around it re-read so the prose
// still works. Doing that by script would satisfy a counter and damage the one
// thing this house is least willing to damage. So today's counts freeze: a NEW
// offender fails the build, a field that GAINS elided spans counts as new, and
// entries come out as the pass reaches each lesson.
//
// L89 IS THE FIRST LESSON DRAINED and is deliberately absent from the elided
// baseline — its teen and senior bands carried Hebrews 10:29 with an ellipsis
// and now quote it whole, and its senior band no longer recites DR-0098. If a
// future edit puts either back, this gate reports L89 as a FRESH offender.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/quotation-integrity-baseline.json';
import {
  QUOTE_BANDS, READER_FIELDS, classifyElision, elidedQuotations, recitedRecords,
  readerTexts, corpusText, scanQuotationIntegrity, ratchetQuotationIntegrity,
} from '../../../scripts/quotation-integrity.mjs';

const scan = scanQuotationIntegrity(LIVING_LESSONS_MODULES);

describe('the measure itself is sound before anything is measured with it', () => {
  it('an elision of real Scripture is told apart from our own words in quotes', () => {
    const corpus = corpusText();
    // Both sides are really in Luke 8:13, so this is an elision of His words.
    const real = classifyElision('receive the word with joy... in time of temptation fall away', corpus);
    expect(real.kind).toBe('scripture');
    // And the contiguous span covering both IS available — which is the point,
    // because it means the remedy exists rather than merely being desirable.
    expect(real.contiguous).toBe(true);
    // Our own phrasing in quotation marks is a different defect, not this one.
    const ours = classifyElision('the background apps... simply starve it', corpus);
    expect(ours.kind).toBe('ours');
  });

  it('a quotation with no ellipsis is never reported, however long', () => {
    const clean = { id: 'x', lesson: '"For by one offering he hath perfected for ever them that are sanctified." (Hebrews 10:14)' };
    expect(elidedQuotations(clean)).toEqual([]);
  });

  it('it refuses to judge a fragment too short to look up', () => {
    // Two-word sides cannot be found or ruled out honestly, so they are
    // 'undecidable' and never asserted either way (DR-0076 §8).
    expect(classifyElision('the seed... the soil').kind).toBe('undecidable');
  });

  it('it reads the fields a READER reads, and names them', () => {
    const m = {
      id: 'x', lesson: 'a', bigIdea: 'b', inApp: 'c',
      levels: { child: 'd', youth: 'e', teen: 'f', senior: 'g' },
      anchor: { theme: 'h' }, facilitator: 'not read by a learner',
    };
    const where = readerTexts(m).map(([w]) => w);
    for (const f of READER_FIELDS) expect(where).toContain(f);
    for (const b of QUOTE_BANDS) expect(where).toContain(`levels.${b}`);
    expect(where).toContain('anchor.theme');
    expect(where, 'the facilitator is a steward of the house, not a learner').not.toContain('facilitator');
  });

  it('a recited decision record is found wherever a reader would meet it', () => {
    const m = { id: 'x', levels: { senior: 'Teach it inside its chapter (DR-0098: let the Word explain the Word).' } };
    expect(recitedRecords(m)).toEqual([{ where: 'levels.senior', ids: ['DR-0098'] }]);
    const clean = { id: 'y', levels: { senior: 'Teach it inside its chapter, letting the Word explain the Word.' } };
    expect(recitedRecords(clean)).toEqual([]);
  });
});

describe('THE LIVE SERIES — measured, not asserted', () => {
  it('the committed baseline is the REAL debt, not a painted number', () => {
    expect(Object.keys(scan.elided).sort()).toEqual(Object.keys(baseline.elided).sort());
    expect(Object.keys(scan.recited).sort()).toEqual(Object.keys(baseline.recited).sort());
    expect(scan.totals.spans).toBe(baseline.totals.spans);
    expect(scan.totals.scripture).toBe(baseline.totals.scripture);
    expect(scan.lessonsElided).toBe(baseline.lessonsElided);
    expect(scan.lessonsReciting).toBe(baseline.lessonsReciting);
  });

  it('the recorded debt is HONEST about what it is — most of it is His words elided', () => {
    // If this ever inverts, the baseline has stopped describing the problem it
    // was created for and the note beside it has become untrue.
    expect(baseline.totals.scripture).toBeGreaterThan(baseline.totals.ours);
    expect(baseline.totals.contiguousAvailable).toBeGreaterThan(baseline.totals.scripture * 0.9);
  });

  it('no quotation is newly elided, and no lesson newly recites a record — the ratchet', () => {
    const r = ratchetQuotationIntegrity(scan, baseline);
    expect(
      r.fresh,
      `new quotation-integrity debt, not recorded:\n${r.fresh.join('\n')}`,
    ).toEqual([]);
  });

  it('reports healing, so the baseline can be shrunk deliberately', () => {
    const r = ratchetQuotationIntegrity(scan, baseline);
    expect(
      r.healed,
      `these are now clean — remove them from the baseline:\n${r.healed.join('\n')}`,
    ).toEqual([]);
  });

  it('every recorded id is a real lesson and every recorded field is a real field', () => {
    const ids = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
    const stale = [...Object.keys(baseline.elided), ...Object.keys(baseline.recited)].filter((id) => !ids.has(id));
    expect(stale, `baseline ids no longer in the series: ${stale.join(', ')}`).toEqual([]);
    const legal = new Set([...READER_FIELDS, ...QUOTE_BANDS.map((b) => `levels.${b}`), 'anchor.theme']);
    const bad = [];
    for (const [id, byField] of Object.entries(baseline.elided)) {
      for (const w of Object.keys(byField)) if (!legal.has(w)) bad.push(`${id} :: ${w}`);
    }
    for (const [id, fields] of Object.entries(baseline.recited)) {
      for (const w of fields) if (!legal.has(w)) bad.push(`${id} :: ${w}`);
    }
    expect(bad).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a new elision and a new recited record are both reported fresh', () => {
    // The gate is only worth its green if it goes red. L89 was drained first and
    // is absent from both baselines; put each defect back in a COPY and the
    // ratchet must name it. If this passes, the ratchet is decoration.
    const l89 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll89-the-most-hated-verse'));
    expect(l89, 'L89 must exist').toBeTruthy();
    expect(baseline.elided[l89.id], 'L89 was drained, so it must not be recorded debt').toBeUndefined();
    expect(baseline.recited[l89.id], 'L89 no longer recites a record').toBeUndefined();

    const withElision = LIVING_LESSONS_MODULES.map((m) => (m === l89
      ? { ...m, levels: { ...m.levels, senior: `${m.levels.senior} And again: "who hath trodden under foot the Son of God... and hath done despite unto the Spirit of grace" (Hebrews 10:29)` } }
      : m));
    const r1 = ratchetQuotationIntegrity(scanQuotationIntegrity(withElision), baseline);
    expect(r1.fresh.some((s) => s.startsWith(`${l89.id} :: levels.senior :: elided`)), r1.fresh.join('\n')).toBe(true);

    const withRecord = LIVING_LESSONS_MODULES.map((m) => (m === l89
      ? { ...m, levels: { ...m.levels, senior: `${m.levels.senior} (DR-0098: let the Word explain the Word.)` } }
      : m));
    const r2 = ratchetQuotationIntegrity(scanQuotationIntegrity(withRecord), baseline);
    expect(r2.fresh).toContain(`${l89.id} :: levels.senior :: recites a decision record`);
  });

  it('PROVEN-TO-CATCH: a lesson that ADDS an ellipsis where it already had one is fresh too', () => {
    // Otherwise a recorded field would be a licence to add more, and the debt
    // could grow without the ratchet ever noticing.
    const [id, byField] = Object.entries(baseline.elided)[0];
    const field = Object.keys(byField)[0];
    const target = LIVING_LESSONS_MODULES.find((m) => m.id === id);
    expect(target, `${id} must exist`).toBeTruthy();
    const bump = LIVING_LESSONS_MODULES.map((m) => {
      if (m !== target) return m;
      const extra = ' And: "the seed is the word of God... and other fell on good ground" (Luke 8:11)';
      if (field.startsWith('levels.')) {
        const b = field.slice('levels.'.length);
        return { ...m, levels: { ...m.levels, [b]: m.levels[b] + extra } };
      }
      return { ...m, [field]: m[field] + extra };
    });
    const r = ratchetQuotationIntegrity(scanQuotationIntegrity(bump), baseline);
    expect(r.fresh.some((s) => s.startsWith(`${id} :: ${field} :: elided`)), r.fresh.join('\n')).toBe(true);
  });
});

describe('L89 is the first lesson drained, and stays drained', () => {
  const l89 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll89-the-most-hated-verse'));

  it('carries no elided quotation in any reader-facing field', () => {
    expect(elidedQuotations(l89)).toEqual([]);
  });

  it('and recites no decision record at the reader', () => {
    expect(recitedRecords(l89)).toEqual([]);
  });

  it('while still quoting Hebrews 10:29 — whole, which was the point', () => {
    // The fix was never to drop the verse. It was to give the reader all of it.
    expect(l89.levels.senior).toContain('who hath trodden under foot the Son of God, and hath counted the blood of the covenant, wherewith he was sanctified, an unholy thing, and hath done despite unto the Spirit of grace');
  });
});
